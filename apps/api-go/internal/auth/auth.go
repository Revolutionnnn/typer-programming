package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/typing-code-learn/api-go/internal/models"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidToken      = errors.New("invalid token")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

// Service handles authentication operations
type Service struct {
	secretKey []byte
}

// NewService creates a new auth service
func NewService() *Service {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Default secret for development only
		secret = "dev-secret-key-change-in-production"
	}
	return &Service{
		secretKey: []byte(secret),
	}
}

// Claims represents JWT claims
type Claims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	IsGuest  bool   `json:"isGuest"`
	jwt.RegisteredClaims
}

// GenerateToken creates a JWT token for a user
func (s *Service) GenerateToken(user models.User) (string, error) {
	expirationTime := time.Now().Add(30 * 24 * time.Hour) // 30 days

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		IsGuest:  user.IsGuest,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secretKey)
}

// ValidateToken validates a JWT token and returns the claims
func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return s.secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// HashPassword hashes a password using bcrypt
func (s *Service) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword verifies a password against its hash
func (s *Service) CheckPassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
