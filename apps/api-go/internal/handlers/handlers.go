package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/typing-code-learn/api-go/internal/database"
	"github.com/typing-code-learn/api-go/internal/gamification"
	"github.com/typing-code-learn/api-go/internal/lessons"
	"github.com/typing-code-learn/api-go/internal/models"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	db          *database.DB
	lessonStore *lessons.Store
}

// New creates a new Handler
func New(db *database.DB, lessonStore *lessons.Store) *Handler {
	return &Handler{
		db:          db,
		lessonStore: lessonStore,
	}
}

// --- JSON helpers ---

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// --- Lesson handlers ---

// ListLessons returns all lessons (summaries)
func (h *Handler) ListLessons(w http.ResponseWriter, r *http.Request) {
	allLessons := h.lessonStore.All()
	summaries := make([]models.LessonSummary, len(allLessons))
	for i, l := range allLessons {
		summaries[i] = l.ToSummary()
	}
	respondJSON(w, http.StatusOK, summaries)
}

// GetLesson returns a single lesson by ID
func (h *Handler) GetLesson(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	lesson, ok := h.lessonStore.Get(id)
	if !ok {
		respondError(w, http.StatusNotFound, "Lesson not found")
		return
	}
	respondJSON(w, http.StatusOK, lesson)
}

// GetLessonsByLanguage returns all lessons for a specific language
func (h *Handler) GetLessonsByLanguage(w http.ResponseWriter, r *http.Request) {
	language := chi.URLParam(r, "language")
	lessonList := h.lessonStore.GetByLanguage(language)
	if lessonList == nil {
		lessonList = make([]*models.Lesson, 0)
	}

	summaries := make([]models.LessonSummary, len(lessonList))
	for i, l := range lessonList {
		summaries[i] = l.ToSummary()
	}
	respondJSON(w, http.StatusOK, summaries)
}

// --- Progress handlers ---

// SaveProgress saves or updates user progress
func (h *Handler) SaveProgress(w http.ResponseWriter, r *http.Request) {
	var req models.ProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UserID == "" || req.LessonID == "" {
		respondError(w, http.StatusBadRequest, "userId and lessonId are required")
		return
	}

	progress, err := h.db.SaveProgress(req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save progress")
		return
	}

	respondJSON(w, http.StatusOK, progress)
}

// GetUserProgress returns all progress for a user
func (h *Handler) GetUserProgress(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	progress, err := h.db.GetUserProgress(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get progress")
		return
	}
	if progress == nil {
		progress = []models.Progress{}
	}
	respondJSON(w, http.StatusOK, progress)
}

// GetLessonProgress returns progress for a specific lesson
func (h *Handler) GetLessonProgress(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	lessonID := chi.URLParam(r, "lessonId")

	progress, err := h.db.GetLessonProgress(userID, lessonID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondJSON(w, http.StatusOK, map[string]interface{}{
				"userId":    userID,
				"lessonId":  lessonID,
				"completed": false,
				"attempts":  0,
			})
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get progress")
		return
	}

	respondJSON(w, http.StatusOK, progress)
}

// --- Metrics handlers ---

// SaveMetrics saves typing metrics for a session
func (h *Handler) SaveMetrics(w http.ResponseWriter, r *http.Request) {
	var req models.MetricsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UserID == "" || req.LessonID == "" {
		respondError(w, http.StatusBadRequest, "userId and lessonId are required")
		return
	}

	metrics, err := h.db.SaveMetrics(req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save metrics")
		return
	}

	// Calculate and save points
	pointStrategy := gamification.NewDefaultStrategy()
	points := pointStrategy.Calculate(*metrics)
	
	if points > 0 {
		pt := models.PointTransaction{
			ID:        uuid.New().String(),
			UserID:    metrics.UserID,
			SourceID:  metrics.LessonID,
			Points:    points,
			Reason:    "lesson_complete",
			CreatedAt: metrics.CreatedAt,
		}
		
		// We log the error but don't fail the request if point saving fails
		// In a production system, we might want to use a transaction or a background job
		_ = h.db.SavePointTransaction(pt)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"metrics": metrics,
		"pointsEarned": points,
	})
}

// GetLeaderboard returns the leaderboard
func (h *Handler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	limitStr := r.URL.Query().Get("limit")
	limit := 10
	if limitStr != "" {
		// simple parse, default to 10 on error
		fmt.Sscanf(limitStr, "%d", &limit)
	}
	
	now := time.Now()
	var startDate, endDate time.Time
	endDate = now
	
	switch period {
	case "weekly":
		// Start of week (Monday)
		offset := int(now.Weekday())
		if offset == 0 {
			offset = 7
		}
		startDate = now.AddDate(0, 0, -offset+1)
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
	case "monthly":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	default: // all_time
		startDate = time.Time{} // Zero time
	}
	
	leaderboard, err := h.db.GetLeaderboard(startDate, endDate, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get leaderboard")
		return
	}
	
	if leaderboard == nil {
		leaderboard = []models.LeaderboardEntry{}
	}
	
	respondJSON(w, http.StatusOK, leaderboard)
}

// GetUserMetrics returns aggregated metrics for a user
func (h *Handler) GetUserMetrics(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	summary, err := h.db.GetUserMetrics(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get metrics")
		return
	}
	respondJSON(w, http.StatusOK, summary)
}

// --- Language handlers ---

// GetLanguages returns all available programming languages
func (h *Handler) GetLanguages(w http.ResponseWriter, r *http.Request) {
	langs := h.lessonStore.GetLanguages()
	if langs == nil {
		langs = make([]models.LanguageInfo, 0)
	}
	respondJSON(w, http.StatusOK, langs)
}

// --- Health check ---

// HealthCheck returns the health status
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"service": "typing-code-learn-api",
		"lessons": h.lessonStore.Count(),
	})
}
