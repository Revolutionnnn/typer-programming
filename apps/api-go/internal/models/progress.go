package models

import "time"

// Progress tracks a user's progress on a lesson
type Progress struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	LessonID     string    `json:"lessonId"`
	Completed    bool      `json:"completed"`
	BestWPM      float64   `json:"bestWpm"`
	BestAccuracy float64   `json:"bestAccuracy"`
	Attempts     int       `json:"attempts"`
	LastAttempt  time.Time `json:"lastAttempt"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// ProgressRequest is the request body for saving progress
type ProgressRequest struct {
	UserID    string  `json:"userId"`
	LessonID  string  `json:"lessonId"`
	WPM       float64 `json:"wpm"`
	Accuracy  float64 `json:"accuracy"`
	Completed bool    `json:"completed"`
}
