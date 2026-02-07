package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"github.com/typing-code-learn/api-go/internal/models"
)

// DB wraps the sql.DB with helper methods
type DB struct {
	*sql.DB
}

// InitDB creates and initializes the SQLite database
func InitDB(dbPath string) (*DB, error) {
	sqlDB, err := sql.Open("sqlite3", dbPath+"?_journal=WAL&_fk=1")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db := &DB{sqlDB}

	if err := db.createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return db, nil
}

func (db *DB) createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS progress (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			lesson_id TEXT NOT NULL,
			completed BOOLEAN DEFAULT FALSE,
			best_wpm REAL DEFAULT 0,
			best_accuracy REAL DEFAULT 0,
			attempts INTEGER DEFAULT 0,
			last_attempt DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, lesson_id)
		)`,
		`CREATE TABLE IF NOT EXISTS typing_metrics (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			lesson_id TEXT NOT NULL,
			wpm REAL NOT NULL,
			accuracy REAL NOT NULL,
			total_time REAL NOT NULL,
			total_chars INTEGER NOT NULL,
			correct_chars INTEGER NOT NULL,
			incorrect_chars INTEGER NOT NULL,
			common_errors TEXT DEFAULT '[]',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_metrics_user ON typing_metrics(user_id)`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return fmt.Errorf("failed to execute query: %w", err)
		}
	}

	return nil
}

// SaveProgress saves or updates a user's progress on a lesson
func (db *DB) SaveProgress(req models.ProgressRequest) (*models.Progress, error) {
	now := time.Now()

	// Check if progress exists
	var existing models.Progress
	err := db.QueryRow(
		"SELECT id, best_wpm, best_accuracy, attempts FROM progress WHERE user_id = ? AND lesson_id = ?",
		req.UserID, req.LessonID,
	).Scan(&existing.ID, &existing.BestWPM, &existing.BestAccuracy, &existing.Attempts)

	if err == sql.ErrNoRows {
		// Insert new progress
		id := uuid.New().String()
		_, err := db.Exec(
			`INSERT INTO progress (id, user_id, lesson_id, completed, best_wpm, best_accuracy, attempts, last_attempt, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
			id, req.UserID, req.LessonID, req.Completed, req.WPM, req.Accuracy, now, now, now,
		)
		if err != nil {
			return nil, err
		}

		return &models.Progress{
			ID:           id,
			UserID:       req.UserID,
			LessonID:     req.LessonID,
			Completed:    req.Completed,
			BestWPM:      req.WPM,
			BestAccuracy: req.Accuracy,
			Attempts:     1,
			LastAttempt:   now,
			CreatedAt:    now,
			UpdatedAt:    now,
		}, nil
	} else if err != nil {
		return nil, err
	}

	// Update existing progress
	bestWPM := existing.BestWPM
	if req.WPM > bestWPM {
		bestWPM = req.WPM
	}
	bestAccuracy := existing.BestAccuracy
	if req.Accuracy > bestAccuracy {
		bestAccuracy = req.Accuracy
	}
	completed := req.Completed || existing.BestAccuracy > 0

	_, err = db.Exec(
		`UPDATE progress SET completed = ?, best_wpm = ?, best_accuracy = ?, attempts = attempts + 1, last_attempt = ?, updated_at = ?
		WHERE id = ?`,
		completed, bestWPM, bestAccuracy, now, now, existing.ID,
	)
	if err != nil {
		return nil, err
	}

	return &models.Progress{
		ID:           existing.ID,
		UserID:       req.UserID,
		LessonID:     req.LessonID,
		Completed:    completed,
		BestWPM:      bestWPM,
		BestAccuracy: bestAccuracy,
		Attempts:     existing.Attempts + 1,
		LastAttempt:   now,
		UpdatedAt:    now,
	}, nil
}

// GetUserProgress returns all progress records for a user
func (db *DB) GetUserProgress(userID string) ([]models.Progress, error) {
	rows, err := db.Query(
		`SELECT id, user_id, lesson_id, completed, best_wpm, best_accuracy, attempts, last_attempt, created_at, updated_at
		FROM progress WHERE user_id = ? ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.Progress
	for rows.Next() {
		var p models.Progress
		if err := rows.Scan(&p.ID, &p.UserID, &p.LessonID, &p.Completed, &p.BestWPM, &p.BestAccuracy, &p.Attempts, &p.LastAttempt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		results = append(results, p)
	}

	return results, nil
}

// GetLessonProgress returns progress for a specific user and lesson
func (db *DB) GetLessonProgress(userID, lessonID string) (*models.Progress, error) {
	var p models.Progress
	err := db.QueryRow(
		`SELECT id, user_id, lesson_id, completed, best_wpm, best_accuracy, attempts, last_attempt, created_at, updated_at
		FROM progress WHERE user_id = ? AND lesson_id = ?`,
		userID, lessonID,
	).Scan(&p.ID, &p.UserID, &p.LessonID, &p.Completed, &p.BestWPM, &p.BestAccuracy, &p.Attempts, &p.LastAttempt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// SaveMetrics saves typing metrics for a session
func (db *DB) SaveMetrics(req models.MetricsRequest) (*models.TypingMetrics, error) {
	id := uuid.New().String()
	now := time.Now()

	errorsJSON, err := json.Marshal(req.CommonErrors)
	if err != nil {
		errorsJSON = []byte("[]")
	}

	_, err = db.Exec(
		`INSERT INTO typing_metrics (id, user_id, lesson_id, wpm, accuracy, total_time, total_chars, correct_chars, incorrect_chars, common_errors, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, req.UserID, req.LessonID, req.WPM, req.Accuracy, req.TotalTime,
		req.TotalChars, req.CorrectChars, req.IncorrectChars, string(errorsJSON), now,
	)
	if err != nil {
		return nil, err
	}

	return &models.TypingMetrics{
		ID:             id,
		UserID:         req.UserID,
		LessonID:       req.LessonID,
		WPM:            req.WPM,
		Accuracy:       req.Accuracy,
		TotalTime:      req.TotalTime,
		TotalChars:     req.TotalChars,
		CorrectChars:   req.CorrectChars,
		IncorrectChars: req.IncorrectChars,
		CommonErrors:   req.CommonErrors,
		CreatedAt:      now,
	}, nil
}

// GetUserMetrics returns all metrics for a user
func (db *DB) GetUserMetrics(userID string) (*models.UserMetricsSummary, error) {
	var summary models.UserMetricsSummary
	summary.UserID = userID

	err := db.QueryRow(
		`SELECT
			COALESCE(AVG(wpm), 0),
			COALESCE(AVG(accuracy), 0),
			COUNT(*),
			COALESCE(SUM(total_time), 0),
			COALESCE(MAX(wpm), 0)
		FROM typing_metrics WHERE user_id = ?`,
		userID,
	).Scan(&summary.AverageWPM, &summary.AverageAccuracy, &summary.TotalSessions, &summary.TotalTime, &summary.BestWPM)
	if err != nil {
		return nil, err
	}

	return &summary, nil
}
