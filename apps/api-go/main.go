package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/typing-code-learn/api-go/internal/auth"
	"github.com/typing-code-learn/api-go/internal/database"
	"github.com/typing-code-learn/api-go/internal/handlers"
	"github.com/typing-code-learn/api-go/internal/lessons"
)

func main() {
	// Initialize database
	db, err := database.InitDB("typing_code_learn.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Load lessons from content directory
	contentDir := getEnv("CONTENT_DIR", "../../content")
	lessonStore, err := lessons.LoadLessons(contentDir)
	if err != nil {
		log.Fatalf("Failed to load lessons: %v", err)
	}
	log.Printf("Loaded %d lessons", lessonStore.Count())

	// Create auth service
	authService := auth.NewService()

	// Create handlers
	h := handlers.New(db, lessonStore, authService)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:4200", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Apply optional auth middleware to all routes
	r.Use(authService.AuthMiddleware)

	// Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Authentication
		r.Post("/auth/guest", h.CreateGuestUser)
		r.Post("/auth/register", h.Register)
		r.Post("/auth/login", h.Login)
		r.Post("/auth/logout", h.Logout)
		r.With(authService.RequireAuth).Get("/auth/me", h.GetMe)

		// Languages
		r.Get("/languages", h.GetLanguages)

		// Lessons
		r.Get("/lessons", h.ListLessons)
		r.Get("/lessons/{id}", h.GetLesson)
		r.Get("/lessons/language/{language}", h.GetLessonsByLanguage)

		// Progress
		r.Post("/progress", h.SaveProgress)
		r.Get("/progress/{userId}", h.GetUserProgress)
		r.Get("/progress/{userId}/{lessonId}", h.GetLessonProgress)

		// Metrics
		r.Post("/metrics", h.SaveMetrics)
		r.Get("/metrics/{userId}", h.GetUserMetrics)
		r.Get("/leaderboard", h.GetLeaderboard)
		r.With(authService.RequireAuth).Get("/leaderboard/rank", h.GetUserRank)

		// Health
		r.Get("/health", h.HealthCheck)
	})

	port := getEnv("PORT", "8080")
	log.Printf("🚀 Typing Code Learn API running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
