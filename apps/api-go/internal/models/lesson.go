package models

// Lesson represents a typing lesson
type Lesson struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	TitleEn       string   `json:"title_en,omitempty"`
	Language      string   `json:"language"`
	Concept       string   `json:"concept"`
	Description   string   `json:"description"`
	DescriptionEn string   `json:"description_en,omitempty"`
	Explanation   []string `json:"explanation"`
	ExplanationEn []string `json:"explanation_en,omitempty"`
	Code          string   `json:"code"`
	Exclude       []string `json:"exclude,omitempty"`
	Mode          string   `json:"mode"`       // "strict" or "practice"
	Difficulty    string   `json:"difficulty"` // "beginner", "intermediate", "advanced"
	Order         int      `json:"order"`
	Tags          []string `json:"tags"`
	Level         string   `json:"level"` // "basic", "intermediate", "advanced", "exercises"
}

// LessonSummary is a lighter version for listing
type LessonSummary struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	TitleEn       string `json:"title_en,omitempty"`
	Language      string `json:"language"`
	Concept       string `json:"concept"`
	Description   string `json:"description"`
	DescriptionEn string `json:"description_en,omitempty"`
	Difficulty    string `json:"difficulty"`
	Mode          string `json:"mode"`
	Order         int    `json:"order"`
	Level         string `json:"level"`
}

// LanguageInfo describes an available programming language
type LanguageInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	LessonCount int    `json:"lessonCount"`
	Soon        bool   `json:"soon,omitempty"`
}

// ToSummary converts a Lesson to a LessonSummary
func (l *Lesson) ToSummary() LessonSummary {
	return LessonSummary{
		ID:            l.ID,
		Title:         l.Title,
		TitleEn:       l.TitleEn,
		Language:      l.Language,
		Concept:       l.Concept,
		Description:   l.Description,
		DescriptionEn: l.DescriptionEn,
		Difficulty:    l.Difficulty,
		Mode:          l.Mode,
		Order:         l.Order,
		Level:         l.Level,
	}
}
