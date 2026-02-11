package models

import "time"

// Badge represents a badge that can be assigned to users
type Badge struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"` // e.g., "#FF0000" or "red"
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// UserBadge represents the assignment of a badge to a user
type UserBadge struct {
	UserID    string    `json:"userId"`
	BadgeID   string    `json:"badgeId"`
	AssignedAt time.Time `json:"assignedAt"`
}

// BadgeWithDetails includes badge info and assignment time
type BadgeWithDetails struct {
	Badge      Badge     `json:"badge"`
	AssignedAt time.Time `json:"assignedAt"`
}