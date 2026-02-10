package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const UserContextKey contextKey = "user"

// UserContext represents user information stored in request context
type UserContext struct {
	UserID   string
	Username string
	IsGuest  bool
}

// AuthMiddleware is optional authentication middleware
// It validates the token if present and adds user info to context
func (s *Service) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add some basic security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		token := s.extractToken(r)
		if token != "" {
			claims, err := s.ValidateToken(token)
			if err == nil {
				r = s.injectUserContext(r, claims)
			}
		}
		next.ServeHTTP(w, r)
	})
}

// RequireAuth is middleware that requires authentication
func (s *Service) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := s.extractToken(r)
		if token == "" {
			respondWithError(w, http.StatusUnauthorized, "authentication required")
			return
		}

		claims, err := s.ValidateToken(token)
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		r = s.injectUserContext(r, claims)
		next.ServeHTTP(w, r)
	})
}

// injectUserContext adds the user info from claims to the request context
func (s *Service) injectUserContext(r *http.Request, claims *Claims) *http.Request {
	userCtx := UserContext{
		UserID:   claims.UserID,
		Username: claims.Username,
		IsGuest:  claims.IsGuest,
	}
	ctx := context.WithValue(r.Context(), UserContextKey, userCtx)
	return r.WithContext(ctx)
}

// respondWithError sends a JSON error response
func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write([]byte(`{"error":"` + message + `"}`))
}

// extractToken extracts JWT token from cookie or Authorization header
	// Try cookie first
	cookie, err := r.Cookie("token")
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}

	// Try Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		// Expected format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	return ""
}

// GetUserFromContext extracts user info from request context
func GetUserFromContext(ctx context.Context) (*UserContext, bool) {
	user, ok := ctx.Value(UserContextKey).(UserContext)
	return &user, ok
}
