package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/typing-code-learn/api-go/internal/auth"
	"github.com/typing-code-learn/api-go/internal/database"
	"github.com/typing-code-learn/api-go/internal/gamification"
	"github.com/typing-code-learn/api-go/internal/lessons"
	"github.com/typing-code-learn/api-go/internal/models"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	db          *database.DB
	lessonStore *lessons.Store
	authService *auth.Service
}

// New creates a new Handler
func New(db *database.DB, lessonStore *lessons.Store, authService *auth.Service) *Handler {
	return &Handler{
		db:          db,
		lessonStore: lessonStore,
		authService: authService,
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

func (h *Handler) setAuthCookie(w http.ResponseWriter, token string) {
	secure := os.Getenv("COOKIE_SECURE") != "false" // default true
	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   int(auth.TokenDuration.Seconds()),
	})
}

func (h *Handler) ListLessons(w http.ResponseWriter, r *http.Request) {
	lang := r.URL.Query().Get("lang")
	allLessons := h.lessonStore.All()
	summaries := make([]models.LessonSummary, len(allLessons))
	for i, l := range allLessons {
		s := l.ToSummary()
		h.localizeSummary(&s, lang)
		summaries[i] = s
	}
	respondJSON(w, http.StatusOK, summaries)
}

func (h *Handler) GetLesson(w http.ResponseWriter, r *http.Request) {
	lang := r.URL.Query().Get("lang")
	id := chi.URLParam(r, "id")
	lesson, ok := h.lessonStore.Get(id)
	if !ok {
		respondError(w, http.StatusNotFound, "Lesson not found")
		return
	}

	l := *lesson
	h.localizeLesson(&l, lang)
	respondJSON(w, http.StatusOK, l)
}

func (h *Handler) GetLessonsByLanguage(w http.ResponseWriter, r *http.Request) {
	lang := r.URL.Query().Get("lang")
	language := chi.URLParam(r, "language")
	lessonList := h.lessonStore.GetByLanguage(language)
	if lessonList == nil {
		lessonList = make([]*models.Lesson, 0)
	}

	summaries := make([]models.LessonSummary, len(lessonList))
	for i, l := range lessonList {
		s := l.ToSummary()
		h.localizeSummary(&s, lang)
		summaries[i] = s
	}
	respondJSON(w, http.StatusOK, summaries)
}

func (h *Handler) localizeSummary(s *models.LessonSummary, lang string) {
	if lang == "en" && s.TitleEn != "" {
		s.Title = s.TitleEn
		s.Description = s.DescriptionEn
	}
}

func (h *Handler) localizeLesson(l *models.Lesson, lang string) {
	if lang == "en" && l.TitleEn != "" {
		l.Title = l.TitleEn
		l.Description = l.DescriptionEn
		l.Explanation = l.ExplanationEn
	}
}

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
		_ = h.db.SavePointTransaction(pt)
	}

	streak, err := h.db.UpdateUserStreak(metrics.UserID)
	if err != nil {
		fmt.Printf("Error updating streak for user %s: %v\n", metrics.UserID, err)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"metrics":       metrics,
		"pointsEarned":  points,
		"currentStreak": streak,
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

	now := time.Now().UTC()
	var startDate, endDate time.Time
	endDate = now.Add(1 * time.Minute)

	switch period {
	case "daily":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	case "weekly":
		// Start of week (Monday)
		offset := int(now.Weekday())
		if offset == 0 {
			offset = 7
		}
		startDate = now.AddDate(0, 0, -offset+1)
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, time.UTC)
	case "monthly":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
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

// GetUserRank returns the user's rank in daily and weekly leaderboards
func (h *Handler) GetUserRank(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	now := time.Now().UTC()

	// Daily rank
	dailyStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	dailyEnd := now.Add(1 * time.Minute)
	dailyRank, err := h.db.GetUserRank(userCtx.UserID, dailyStart, dailyEnd)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get daily rank")
		return
	}

	// Weekly rank
	offset := int(now.Weekday())
	if offset == 0 {
		offset = 7
	}
	weeklyStart := now.AddDate(0, 0, -offset+1)
	weeklyStart = time.Date(weeklyStart.Year(), weeklyStart.Month(), weeklyStart.Day(), 0, 0, 0, 0, time.UTC)
	weeklyEnd := now.Add(1 * time.Minute)
	weeklyRank, err := h.db.GetUserRank(userCtx.UserID, weeklyStart, weeklyEnd)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get weekly rank")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"dailyRank":  dailyRank,
		"weeklyRank": weeklyRank,
	})
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

func (h *Handler) GetLanguages(w http.ResponseWriter, r *http.Request) {
	langs := h.lessonStore.GetLanguages()
	if langs == nil {
		langs = make([]models.LanguageInfo, 0)
	}
	respondJSON(w, http.StatusOK, langs)
}

func (h *Handler) CreateGuestUser(w http.ResponseWriter, r *http.Request) {
	user, err := h.db.CreateGuestUser()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create guest user")
		return
	}

	token, err := h.authService.GenerateToken(*user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	h.setAuthCookie(w, token)

	respondJSON(w, http.StatusOK, models.AuthResponse{
		User:  *user,
		Token: token,
	})
}

// Register handles user registration (new user or guest conversion)
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB limit

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)

	if req.Username == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Username and password are required")
		return
	}

	if err := validateUsername(req.Username); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := auth.ValidatePassword(req.Password); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	existingUser, err := h.db.GetUserByUsername(req.Username)
	if err == nil && existingUser != nil {
		respondError(w, http.StatusConflict, "Username already exists")
		return
	}

	if req.Email != "" {
		existingUser, err = h.db.GetUserByEmail(req.Email)
		if err == nil && existingUser != nil {
			respondError(w, http.StatusConflict, "Email already exists")
			return
		}
	}

	passwordHash, err := h.authService.HashPassword(req.Password)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to process password")
		return
	}

	displayName := req.Username

	var user *models.User

	if req.GuestID != nil && *req.GuestID != "" {
		user, err = h.db.ConvertGuestToRegistered(*req.GuestID, req.Username, req.Email, passwordHash, displayName, req.GitHubUsername)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to convert guest user")
			return
		}
	} else {
		user, err = h.db.CreateRegisteredUser(req.Username, req.Email, passwordHash, displayName, req.GitHubUsername)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create user")
			return
		}
	}

	token, err := h.authService.GenerateToken(*user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	h.setAuthCookie(w, token)

	respondJSON(w, http.StatusCreated, models.AuthResponse{
		User:  *user,
		Token: token,
	})
}

// Login authenticates a user
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB limit

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)

	user, err := h.db.GetUserByUsername(req.Username)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	passwordHash, err := h.db.GetPasswordHash(req.Username)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := h.authService.CheckPassword(req.Password, passwordHash); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := h.authService.GenerateToken(*user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	h.setAuthCookie(w, token)

	respondJSON(w, http.StatusOK, models.AuthResponse{
		User:  *user,
		Token: token,
	})
}

// GetMe returns the current authenticated user
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	user, err := h.db.GetUserByID(userCtx.UserID)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// GetUserProfile returns a public user profile with stats
func (h *Handler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")

	// Get user
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	// Get metrics
	metrics, err := h.db.GetUserMetrics(userID)
	if err != nil {
		fmt.Printf("Error getting user metrics: %v\n", err)
	}

	// Get progress
	progress, err := h.db.GetUserProgress(userID)
	if err != nil {
		fmt.Printf("Error getting user progress: %v\n", err)
		progress = []models.Progress{}
	}

	// Count completed lessons
	completedLessons := 0
	for _, p := range progress {
		if p.Completed {
			completedLessons++
		}
	}

	// Get total points (all time)
	totalPoints, err := h.db.GetUserPoints(userID, time.Time{}, time.Now())
	if err != nil {
		fmt.Printf("Error getting user points: %v\n", err)
	}

	profile := models.UserProfile{
		User:             *user,
		Metrics:          metrics,
		Progress:         progress,
		CompletedLessons: completedLessons,
		TotalPoints:      totalPoints,
	}

	respondJSON(w, http.StatusOK, profile)
}

// Logout clears the authentication cookie
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1, // Delete cookie
	})

	respondJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"service": "typing-code-learn-api",
		"lessons": h.lessonStore.Count(),
	})
}

// validateUsername checks that a username is safe and well-formed
var validUsernameRe = regexp.MustCompile(`^[a-zA-Z0-9_-]{3,30}$`)

func validateUsername(username string) error {
	if !validUsernameRe.MatchString(username) {
		return fmt.Errorf("username must be 3-30 characters and contain only letters, numbers, _ or -")
	}
	return nil
}

func (h *Handler) CreateBadge(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	badge, err := h.db.CreateBadge(req.Name, req.Color)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create badge")
		return
	}

	respondJSON(w, http.StatusCreated, badge)
}

// GetAllBadges returns all badges
func (h *Handler) GetAllBadges(w http.ResponseWriter, r *http.Request) {
	badges, err := h.db.GetAllBadges()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get badges")
		return
	}

	respondJSON(w, http.StatusOK, badges)
}

// AssignBadgeToUser assigns a badge to a user
func (h *Handler) AssignBadgeToUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	badgeID := chi.URLParam(r, "badgeId")

	if userID == "" || badgeID == "" {
		respondError(w, http.StatusBadRequest, "Missing userId or badgeId")
		return
	}

	if err := h.db.AssignBadgeToUser(userID, badgeID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to assign badge")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Badge assigned successfully"})
}

// RemoveBadgeFromUser removes a badge from a user
func (h *Handler) RemoveBadgeFromUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userId")
	badgeID := chi.URLParam(r, "badgeId")

	if userID == "" || badgeID == "" {
		respondError(w, http.StatusBadRequest, "Missing userId or badgeId")
		return
	}

	if err := h.db.RemoveBadgeFromUser(userID, badgeID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to remove badge")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Badge removed successfully"})
}
