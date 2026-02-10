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

func (s *Service) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		if token := s.extractToken(r); token != "" {
			if claims, err := s.ValidateToken(token); err == nil {
				r = s.injectUserContext(r, claims)
			}
		}
		next.ServeHTTP(w, r)
	})
}

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

func (s *Service) injectUserContext(r *http.Request, claims *Claims) *http.Request {
	userCtx := UserContext{
		UserID:   claims.UserID,
		Username: claims.Username,
		IsGuest:  claims.IsGuest,
	}
	return r.WithContext(context.WithValue(r.Context(), UserContextKey, userCtx))
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write([]byte(`{"error":"` + message + `"}`))
}

func (s *Service) extractToken(r *http.Request) string {
	if cookie, err := r.Cookie("token"); err == nil && cookie.Value != "" {
		return cookie.Value
	}

	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	return ""
}

func GetUserFromContext(ctx context.Context) (*UserContext, bool) {
	user, ok := ctx.Value(UserContextKey).(UserContext)
	return &user, ok
}
