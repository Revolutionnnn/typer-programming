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
		token := s.extractToken(r)
		if token != "" {
			claims, err := s.ValidateToken(token)
			if err == nil {
				// Add user info to context
				userCtx := UserContext{
					UserID:   claims.UserID,
					Username: claims.Username,
					IsGuest:  claims.IsGuest,
				}
				ctx := context.WithValue(r.Context(), UserContextKey, userCtx)
				r = r.WithContext(ctx)
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
			http.Error(w, `{"error":"authentication required"}`, http.StatusUnauthorized)
			return
		}

		claims, err := s.ValidateToken(token)
		if err != nil {
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		// Add user info to context
		userCtx := UserContext{
			UserID:   claims.UserID,
			Username: claims.Username,
			IsGuest:  claims.IsGuest,
		}
		ctx := context.WithValue(r.Context(), UserContextKey, userCtx)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

// extractToken extracts JWT token from cookie or Authorization header
func (s *Service) extractToken(r *http.Request) string {
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
