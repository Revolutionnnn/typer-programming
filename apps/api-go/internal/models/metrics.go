package models

import "time"

// TypingMetrics represents the metrics of a typing session
type TypingMetrics struct {
	ID             string       `json:"id"`
	UserID         string       `json:"userId"`
	LessonID       string       `json:"lessonId"`
	WPM            float64      `json:"wpm"`
	Accuracy       float64      `json:"accuracy"`
	TotalTime      float64      `json:"totalTime"` // seconds
	TotalChars     int          `json:"totalChars"`
	CorrectChars   int          `json:"correctChars"`
	IncorrectChars int          `json:"incorrectChars"`
	CommonErrors   []ErrorEntry `json:"commonErrors"`
	CreatedAt      time.Time    `json:"createdAt"`
}

// ErrorEntry represents a common typing error
type ErrorEntry struct {
	Expected string `json:"expected"`
	Typed    string `json:"typed"`
	Count    int    `json:"count"`
}

// MetricsRequest is the request body for saving metrics
type MetricsRequest struct {
	UserID         string       `json:"userId"`
	LessonID       string       `json:"lessonId"`
	WPM            float64      `json:"wpm"`
	Accuracy       float64      `json:"accuracy"`
	TotalTime      float64      `json:"totalTime"`
	TotalChars     int          `json:"totalChars"`
	CorrectChars   int          `json:"correctChars"`
	IncorrectChars int          `json:"incorrectChars"`
	CommonErrors   []ErrorEntry `json:"commonErrors"`
}

// UserMetricsSummary is an aggregated view of user metrics
type UserMetricsSummary struct {
	UserID          string  `json:"userId"`
	AverageWPM      float64 `json:"averageWpm"`
	AverageAccuracy float64 `json:"averageAccuracy"`
	TotalSessions   int     `json:"totalSessions"`
	TotalTime       float64 `json:"totalTime"`
	BestWPM         float64 `json:"bestWpm"`
}
