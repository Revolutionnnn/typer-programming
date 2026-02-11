package models

import "time"

// PointTransaction represents a point earning event
type PointTransaction struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	SourceID  string    `json:"sourceId"` // e.g. LessonID
	Points    int       `json:"points"`
	Reason    string    `json:"reason"` // e.g. "lesson_complete", "daily_streak"
	CreatedAt time.Time `json:"createdAt"`
}

// LeaderboardEntry represents a user's standing in a leaderboard
type LeaderboardEntry struct {
	UserID         string             `json:"userId"`
	Username       string             `json:"username"` // Optional, if we have usernames
	GitHubUsername *string            `json:"githubUsername,omitempty"` // Optional, if user linked GitHub
	Points         int                `json:"points"`
	Rank           int                `json:"rank"`
	AvatarURL      string             `json:"avatarUrl"`
	Badges         []BadgeWithDetails `json:"badges,omitempty"`
}

// Leaderboard represents a ranking list for a specific period
type Leaderboard struct {
	Period    string             `json:"period"` // "daily", "weekly", "monthly", "all_time"
	StartDate time.Time          `json:"startDate"`
	EndDate   time.Time          `json:"endDate"`
	Entries   []LeaderboardEntry `json:"entries"`
}
