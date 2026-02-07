package models

// Lesson represents a typing lesson
type Lesson struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Language    string   `json:"language"`
	Concept     string   `json:"concept"`
	Description string   `json:"description"`
	Explanation []string `json:"explanation"`
	Code        string   `json:"code"`
	Mode        string   `json:"mode"`       // "strict" or "practice"
	Difficulty  string   `json:"difficulty"` // "beginner", "intermediate", "advanced"
	Order       int      `json:"order"`
	Tags        []string `json:"tags"`
}

// LessonSummary is a lighter version for listing
type LessonSummary struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Language    string `json:"language"`
	Concept     string `json:"concept"`
	Description string `json:"description"`
	Difficulty  string `json:"difficulty"`
	Mode        string `json:"mode"`
	Order       int    `json:"order"`
}

// LanguageInfo describes an available programming language
type LanguageInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	LessonCount int    `json:"lessonCount"`
}

// ToSummary converts a Lesson to a LessonSummary
func (l *Lesson) ToSummary() LessonSummary {
	return LessonSummary{
		ID:          l.ID,
		Title:       l.Title,
		Language:    l.Language,
		Concept:     l.Concept,
		Description: l.Description,
		Difficulty:  l.Difficulty,
		Mode:        l.Mode,
		Order:       l.Order,
	}
}
