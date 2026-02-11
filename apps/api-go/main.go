package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/typing-code-learn/api-go/internal/auth"
	"github.com/typing-code-learn/api-go/internal/database"
	"github.com/typing-code-learn/api-go/internal/handlers"
	"github.com/typing-code-learn/api-go/internal/lessons"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database
	dbURL := getEnv("DATABASE_URL", "postgres://typer:typer@localhost:5432/typer?sslmode=disable")
	db, err := database.InitDB(dbURL)
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
	appEnv := strings.ToLower(strings.TrimSpace(getEnv("APP_ENV", getEnv("ENV", getEnv("GO_ENV", "development")))))
	jwtSecret := os.Getenv("JWT_SECRET")
	if appEnv == "production" || appEnv == "prod" {
		if jwtSecret == "" {
			log.Fatal("JWT_SECRET is required in production")
		}
		if !auth.IsStrongEnoughSecret(jwtSecret) {
			log.Fatalf("JWT_SECRET must be at least %d characters", auth.MinSecretLength)
		}
	} else if jwtSecret == "" {
		log.Println("⚠️ WARNING: JWT_SECRET is not set. Using default development key.")
	}
	authService := auth.NewService(jwtSecret)

	// Create handlers
	h := handlers.New(db, lessonStore, authService)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	// CORS – configurable via ALLOWED_ORIGINS env var (comma‑separated)
	allowedOrigins := getAllowedOrigins()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
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
		r.With(authService.RequireAuth).Post("/progress", h.SaveProgress)
		r.With(authService.RequireAuth).Get("/progress/{userId}", h.GetUserProgress)
		r.With(authService.RequireAuth).Get("/progress/{userId}/{lessonId}", h.GetLessonProgress)

		// Metrics
		r.With(authService.RequireAuth).Post("/metrics", h.SaveMetrics)
		r.With(authService.RequireAuth).Get("/metrics/{userId}", h.GetUserMetrics)
		r.Get("/leaderboard", h.GetLeaderboard)
		r.With(authService.RequireAuth).Get("/leaderboard/rank", h.GetUserRank)

		// Badges
		r.With(authService.RequireAuth).Post("/badges", h.CreateBadge)
		r.Get("/badges", h.GetAllBadges)
		r.With(authService.RequireAuth).Post("/users/{userId}/badges/{badgeId}", h.AssignBadgeToUser)
		r.With(authService.RequireAuth).Delete("/users/{userId}/badges/{badgeId}", h.RemoveBadgeFromUser)

		// Users
		r.Get("/users/{userId}", h.GetUserProfile)

		// Health
		r.Get("/health", h.HealthCheck)
	})

	port := getEnv("PORT", "8080")
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("🚀 Typing Code Learn API running on http://localhost:%s", port)
	serverErr := make(chan error, 1)
	go func() {
		serverErr <- srv.ListenAndServe()
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-stop:
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
		log.Println("Server stopped")
		return
	case err := <-serverErr:
		if err == nil || err == http.ErrServerClosed {
			return
		}
		log.Fatal(err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getAllowedOrigins() []string {
	raw := os.Getenv("ALLOWED_ORIGINS")
	if raw == "" {
		return []string{"http://localhost:4200", "http://localhost:3000"}
	}
	origins := strings.Split(raw, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}
	return origins
}
