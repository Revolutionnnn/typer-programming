package models

import "time"

// User represents a user account (guest or registered)
type User struct {
	ID            string             `json:"id"`
	Username      string             `json:"username"`
	Email         *string            `json:"email,omitempty"`
	DisplayName   string             `json:"displayName"`
	IsGuest       bool               `json:"isGuest"`
	CurrentStreak int                `json:"currentStreak"`
	LastStreakAt  *time.Time         `json:"lastStreakAt"`
	Badges        []BadgeWithDetails `json:"badges,omitempty"`
	CreatedAt     time.Time          `json:"createdAt"`
	UpdatedAt     time.Time          `json:"updatedAt"`
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Username string  `json:"username"`
	Email    string  `json:"email"`
	Password string  `json:"password"`
	GuestID  *string `json:"guestId,omitempty"` // Optional: for converting guest to registered
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthResponse represents the response after successful authentication
type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}
