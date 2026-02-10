package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/typing-code-learn/api-go/internal/models"
	"golang.org/x/crypto/bcrypt"
)

const (
	// TokenDuration is the lifetime of a JWT token
	TokenDuration = 24 * time.Hour
)

var (
	ErrInvalidToken       = errors.New("invalid token")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

// Service handles authentication operations
type Service struct {
	secretKey []byte
}

// NewService creates a new auth service with the given secret
func NewService(secret string) *Service {
	if secret == "" {
		// In a real production app, we should probably panic if no secret is provided
		// for security reasons, but we'll keep a fallback for dev convenience.
		secret = "dev-secret-key-change-in-production-at-least-32-chars-long"
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
	expirationTime := time.Now().Add(TokenDuration)

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		IsGuest:  user.IsGuest,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "typer-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secretKey)
}

// ValidateToken validates a JWT token and returns the claims
func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate the algorithm used for signing
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return s.secretKey, nil
	}, jwt.WithIssuer("typer-api"))

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
	if password == "" {
		return "", errors.New("password cannot be empty")
	}
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword verifies a password against its hash
func (s *Service) CheckPassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// ValidatePassword checks if a password meets the security requirements
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}
	// Add more complex checks here if needed (uppercase, numbers, etc.)
	return nil
}
