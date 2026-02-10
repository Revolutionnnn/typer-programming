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

	if err := db.InitializeBadges(); err != nil {
		return nil, fmt.Errorf("failed to initialize badges: %w", err)
	}

	return db, nil
}

func (db *DB) createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE,
			password_hash TEXT, display_name TEXT NOT NULL, github_username TEXT UNIQUE,
			is_guest BOOLEAN DEFAULT FALSE, current_streak INTEGER DEFAULT 0,
			last_streak_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE TABLE IF NOT EXISTS progress (
			id TEXT PRIMARY KEY, user_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
			completed BOOLEAN DEFAULT FALSE, best_wpm REAL DEFAULT 0,
			best_accuracy REAL DEFAULT 0, attempts INTEGER DEFAULT 0,
			last_attempt DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, lesson_id)
		)`,
		`CREATE TABLE IF NOT EXISTS typing_metrics (
			id TEXT PRIMARY KEY, user_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
			wpm REAL NOT NULL, accuracy REAL NOT NULL, total_time REAL NOT NULL,
			total_chars INTEGER NOT NULL, correct_chars INTEGER NOT NULL,
			incorrect_chars INTEGER NOT NULL, common_errors TEXT DEFAULT '[]',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_metrics_user ON typing_metrics(user_id)`,
		`CREATE TABLE IF NOT EXISTS point_transactions (
			id TEXT PRIMARY KEY, user_id TEXT NOT NULL, source_id TEXT,
			points INTEGER NOT NULL, reason TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_points_user ON point_transactions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_points_created_at ON point_transactions(created_at)`,
		`CREATE TABLE IF NOT EXISTS badges (
			id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, color TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS user_badges (
			user_id TEXT NOT NULL, badge_id TEXT NOT NULL, assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, badge_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id)`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return fmt.Errorf("failed to execute query: %w", err)
		}
	}
	return nil
}

// SavePointTransaction saves a point earning event
func (db *DB) SavePointTransaction(pt models.PointTransaction) error {
	_, err := db.Exec(
		`INSERT INTO point_transactions (id, user_id, source_id, points, reason, created_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		pt.ID, pt.UserID, pt.SourceID, pt.Points, pt.Reason, pt.CreatedAt,
	)
	return err
}

// GetLeaderboard returns the leaderboard for a specific period
func (db *DB) GetLeaderboard(startDate, endDate time.Time, limit int) ([]models.LeaderboardEntry, error) {
	rows, err := db.Query(
		`SELECT pt.user_id, u.username, u.github_username, SUM(pt.points) as total_points
		FROM point_transactions pt
		INNER JOIN users u ON pt.user_id = u.id
		WHERE pt.created_at BETWEEN ? AND ?
		GROUP BY pt.user_id, u.username, u.github_username
		ORDER BY total_points DESC
		LIMIT ?`,
		startDate, endDate, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.LeaderboardEntry
	rank := 1
	for rows.Next() {
		var entry models.LeaderboardEntry
		var githubUsername sql.NullString
		if err := rows.Scan(&entry.UserID, &entry.Username, &githubUsername, &entry.Points); err != nil {
			return nil, err
		}
		if githubUsername.Valid {
			entry.GitHubUsername = &githubUsername.String
		}
		entry.Rank = rank

		badges, err := db.GetUserBadges(entry.UserID)
		if err != nil {
			return nil, err
		}
		entry.Badges = badges

		rank++
		entries = append(entries, entry)
	}

	return entries, nil
}

// GetUserPoints returns total points for a user in a period
func (db *DB) GetUserPoints(userID string, startDate, endDate time.Time) (int, error) {
	var totalPoints sql.NullInt64
	err := db.QueryRow(
		`SELECT SUM(points) FROM point_transactions
		WHERE user_id = ? AND created_at BETWEEN ? AND ?`,
		userID, startDate, endDate,
	).Scan(&totalPoints)

	if err != nil {
		return 0, err
	}

	if !totalPoints.Valid {
		return 0, nil
	}

	return int(totalPoints.Int64), nil
}

// GetUserRank returns the rank of a user in a specific period
func (db *DB) GetUserRank(userID string, startDate, endDate time.Time) (int, error) {
	userPoints, err := db.GetUserPoints(userID, startDate, endDate)
	if err != nil {
		return 0, err
	}

	var rank int
	err = db.QueryRow(
		`SELECT COUNT(*) + 1 as rank
		FROM (
			SELECT user_id, SUM(points) as total_points
			FROM point_transactions
			WHERE created_at BETWEEN ? AND ?
			GROUP BY user_id
			HAVING SUM(points) > ?
		) as higher_users`,
		startDate, endDate, userPoints,
	).Scan(&rank)

	if err != nil {
		return 0, err
	}

	return rank, nil
}

func (db *DB) CreateGuestUser() (*models.User, error) {
	id := uuid.New().String()
	guestNum := time.Now().UnixNano() % 10000000
	username := fmt.Sprintf("guest_%07d", guestNum)
	displayName := username
	now := time.Now()

	_, err := db.Exec(
		`INSERT INTO users (id, username, display_name, is_guest, current_streak, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id, username, displayName, true, 0, now, now,
	)
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:          id,
		Username:    username,
		DisplayName: displayName,
		IsGuest:     true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// CreateRegisteredUser creates a new registered user
func (db *DB) CreateRegisteredUser(username, email, passwordHash, displayName, githubUsername string) (*models.User, error) {
	id := uuid.New().String()
	now := time.Now()

	_, err := db.Exec(
		`INSERT INTO users (id, username, email, password_hash, display_name, github_username, is_guest, current_streak, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, username, email, passwordHash, displayName, githubUsername, false, 0, now, now,
	)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		ID:             id,
		Username:       username,
		Email:          &email,
		DisplayName:    displayName,
		GitHubUsername: &githubUsername,
		IsGuest:        false,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	// Assign automatic badges
	if err := db.assignAutomaticBadges(user); err != nil {
		// Log error but don't fail user creation
		fmt.Printf("Error assigning automatic badges: %v\n", err)
	}

	return user, nil
}

// GetUserByID returns a user by ID
func (db *DB) GetUserByID(id string) (*models.User, error) {
	var user models.User
	var email sql.NullString

	err := db.QueryRow(
		`SELECT id, username, email, display_name, is_guest, current_streak, last_streak_at, created_at, updated_at
		FROM users WHERE id = ?`,
		id,
	).Scan(&user.ID, &user.Username, &email, &user.DisplayName, &user.IsGuest, &user.CurrentStreak, &user.LastStreakAt, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, err
	}

	if email.Valid {
		user.Email = &email.String
	}

	// Load badges
	badges, err := db.GetUserBadges(id)
	if err != nil {
		return nil, err
	}
	user.Badges = badges

	return &user, nil
}

// GetUserByUsername returns a user by username
func (db *DB) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	var email sql.NullString

	err := db.QueryRow(
		`SELECT id, username, email, display_name, is_guest, current_streak, last_streak_at, created_at, updated_at
		FROM users WHERE username = ?`,
		username,
	).Scan(&user.ID, &user.Username, &email, &user.DisplayName, &user.IsGuest, &user.CurrentStreak, &user.LastStreakAt, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, err
	}

	if email.Valid {
		user.Email = &email.String
	}

	return &user, nil
}

// GetUserByEmail returns a user by email
func (db *DB) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	var emailVal sql.NullString

	err := db.QueryRow(
		`SELECT id, username, email, display_name, is_guest, current_streak, last_streak_at, created_at, updated_at
		FROM users WHERE email = ?`,
		email,
	).Scan(&user.ID, &user.Username, &emailVal, &user.DisplayName, &user.IsGuest, &user.CurrentStreak, &user.LastStreakAt, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, err
	}

	if emailVal.Valid {
		user.Email = &emailVal.String
	}

	return &user, nil
}

// GetPasswordHash returns the password hash for a user
func (db *DB) GetPasswordHash(username string) (string, error) {
	var hash sql.NullString
	err := db.QueryRow(
		`SELECT password_hash FROM users WHERE username = ?`,
		username,
	).Scan(&hash)

	if err != nil {
		return "", err
	}

	if !hash.Valid {
		return "", sql.ErrNoRows
	}

	return hash.String, nil
}

// ConvertGuestToRegistered converts a guest user to a registered user
func (db *DB) ConvertGuestToRegistered(guestID, username, email, passwordHash, displayName, githubUsername string) (*models.User, error) {
	now := time.Now()

	_, err := db.Exec(
		`UPDATE users
		SET username = ?, email = ?, password_hash = ?, display_name = ?, github_username = ?, is_guest = ?, updated_at = ?
		WHERE id = ? AND is_guest = ?`,
		username, email, passwordHash, displayName, githubUsername, false, now, guestID, true,
	)
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:             guestID,
		Username:       username,
		Email:          &email,
		DisplayName:    displayName,
		GitHubUsername: &githubUsername,
		IsGuest:        false,
		UpdatedAt:      now,
	}, nil
}

// SaveProgress saves or updates a user's progress on a lesson
func (db *DB) SaveProgress(req models.ProgressRequest) (*models.Progress, error) {
	now := time.Now()

	// Check if progress exists
	var existing models.Progress
	err := db.QueryRow(
		"SELECT id, completed, best_wpm, best_accuracy, attempts FROM progress WHERE user_id = ? AND lesson_id = ?",
		req.UserID, req.LessonID,
	).Scan(&existing.ID, &existing.Completed, &existing.BestWPM, &existing.BestAccuracy, &existing.Attempts)

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
			LastAttempt:  now,
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
	completed := req.Completed || existing.Completed

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
		LastAttempt:  now,
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

// UpdateUserStreak updates the user's daily streak
func (db *DB) UpdateUserStreak(userID string) (int, error) {
	var currentStreak int
	var lastStreakAt *time.Time

	err := db.QueryRow(
		"SELECT current_streak, last_streak_at FROM users WHERE id = ?",
		userID,
	).Scan(&currentStreak, &lastStreakAt)

	if err != nil {
		return 0, err
	}

	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	if lastStreakAt == nil {
		// First time exercise
		currentStreak = 1
	} else {
		lastDate := time.Date(lastStreakAt.Year(), lastStreakAt.Month(), lastStreakAt.Day(), 0, 0, 0, 0, time.UTC)

		if lastDate.Equal(today) {
			// Already updated today
			return currentStreak, nil
		}

		yesterday := today.AddDate(0, 0, -1)
		if lastDate.Equal(yesterday) {
			// Streak continues
			currentStreak++
		} else {
			// Streak broken
			currentStreak = 1
		}
	}

	_, err = db.Exec(
		"UPDATE users SET current_streak = ?, last_streak_at = ?, updated_at = ? WHERE id = ?",
		currentStreak, now, now, userID,
	)

	return currentStreak, err
}

// --- Badge Management ---

// CreateBadge creates a new badge
func (db *DB) CreateBadge(name, color string) (*models.Badge, error) {
	id := uuid.New().String()
	now := time.Now()

	_, err := db.Exec(
		`INSERT INTO badges (id, name, color, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)`,
		id, name, color, now, now,
	)
	if err != nil {
		return nil, err
	}

	return &models.Badge{
		ID:        id,
		Name:      name,
		Color:     color,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// GetBadgeByID returns a badge by ID
func (db *DB) GetBadgeByID(id string) (*models.Badge, error) {
	var badge models.Badge
	err := db.QueryRow(
		`SELECT id, name, color, created_at, updated_at
		FROM badges WHERE id = ?`,
		id,
	).Scan(&badge.ID, &badge.Name, &badge.Color, &badge.CreatedAt, &badge.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &badge, nil
}

// GetBadgeByName returns a badge by name
func (db *DB) GetBadgeByName(name string) (*models.Badge, error) {
	var badge models.Badge
	err := db.QueryRow(
		`SELECT id, name, color, created_at, updated_at
		FROM badges WHERE name = ?`,
		name,
	).Scan(&badge.ID, &badge.Name, &badge.Color, &badge.CreatedAt, &badge.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &badge, nil
}

// GetAllBadges returns all badges
func (db *DB) GetAllBadges() ([]models.Badge, error) {
	rows, err := db.Query(
		`SELECT id, name, color, created_at, updated_at
		FROM badges ORDER BY created_at`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var badges []models.Badge
	for rows.Next() {
		var badge models.Badge
		if err := rows.Scan(&badge.ID, &badge.Name, &badge.Color, &badge.CreatedAt, &badge.UpdatedAt); err != nil {
			return nil, err
		}
		badges = append(badges, badge)
	}

	return badges, nil
}

// AssignBadgeToUser assigns a badge to a user
func (db *DB) AssignBadgeToUser(userID, badgeID string) error {
	now := time.Now()
	_, err := db.Exec(
		`INSERT OR IGNORE INTO user_badges (user_id, badge_id, assigned_at)
		VALUES (?, ?, ?)`,
		userID, badgeID, now,
	)
	return err
}

// RemoveBadgeFromUser removes a badge from a user
func (db *DB) RemoveBadgeFromUser(userID, badgeID string) error {
	_, err := db.Exec(
		`DELETE FROM user_badges WHERE user_id = ? AND badge_id = ?`,
		userID, badgeID,
	)
	return err
}

// GetUserBadges returns all badges for a user
func (db *DB) GetUserBadges(userID string) ([]models.BadgeWithDetails, error) {
	rows, err := db.Query(
		`SELECT b.id, b.name, b.color, b.created_at, b.updated_at, ub.assigned_at
		FROM badges b
		INNER JOIN user_badges ub ON b.id = ub.badge_id
		WHERE ub.user_id = ?
		ORDER BY ub.assigned_at`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var badges []models.BadgeWithDetails
	for rows.Next() {
		var badge models.Badge
		var assignedAt time.Time
		if err := rows.Scan(&badge.ID, &badge.Name, &badge.Color, &badge.CreatedAt, &badge.UpdatedAt, &assignedAt); err != nil {
			return nil, err
		}
		badges = append(badges, models.BadgeWithDetails{
			Badge:      badge,
			AssignedAt: assignedAt,
		})
	}

	return badges, nil
}

// GetUsersWithBadge returns all users who have a specific badge
func (db *DB) GetUsersWithBadge(badgeID string) ([]string, error) {
	rows, err := db.Query(
		`SELECT user_id FROM user_badges WHERE badge_id = ?`,
		badgeID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []string
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		userIDs = append(userIDs, userID)
	}

	return userIDs, nil
}

// InitializeBadges creates default badges if they don't exist
func (db *DB) InitializeBadges() error {
	badges := []struct {
		name  string
		color string
	}{
		{"Beta Tester", "#FFD700"},  // Gold
		{"Early Access", "#C0C0C0"}, // Silver
		{"Donator", "#FF69B4"},      // Hot Pink
		{"Contributor", "#32CD32"},  // Lime Green
	}

	for _, b := range badges {
		_, err := db.GetBadgeByName(b.name)
		if err == sql.ErrNoRows {
			// Badge doesn't exist, create it
			_, err := db.CreateBadge(b.name, b.color)
			if err != nil {
				return fmt.Errorf("failed to create badge %s: %w", b.name, err)
			}
		} else if err != nil {
			return err
		}
	}

	return nil
}

// assignAutomaticBadges assigns badges based on user registration order
func (db *DB) assignAutomaticBadges(user *models.User) error {
	// Count registered users (non-guests) created before this user
	var count int
	err := db.QueryRow(
		`SELECT COUNT(*) FROM users WHERE is_guest = 0 AND created_at < ?`,
		user.CreatedAt,
	).Scan(&count)

	if err != nil {
		return err
	}

	// Assign Beta Tester to first 100 registered users
	if count < 100 {
		badge, err := db.GetBadgeByName("Beta Tester")
		if err != nil {
			return err
		}
		if err := db.AssignBadgeToUser(user.ID, badge.ID); err != nil {
			return err
		}
	}

	// Assign Early Access to first 1000 registered users
	if count < 1000 {
		badge, err := db.GetBadgeByName("Early Access")
		if err != nil {
			return err
		}
		if err := db.AssignBadgeToUser(user.ID, badge.ID); err != nil {
			return err
		}
	}

	return nil
}
