package lessons

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/typing-code-learn/api-go/internal/models"
)

// Store holds all loaded lessons in memory
type Store struct {
	mu      sync.RWMutex
	lessons map[string]*models.Lesson
	byLang  map[string][]*models.Lesson
}

// NewStore creates a new empty lesson store
func NewStore() *Store {
	return &Store{
		lessons: make(map[string]*models.Lesson),
		byLang:  make(map[string][]*models.Lesson),
	}
}

// LoadLessons reads all JSON lesson files from the content directory
func LoadLessons(contentDir string) (*Store, error) {
	store := NewStore()

	err := filepath.Walk(contentDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || !strings.HasSuffix(info.Name(), ".json") {
			return nil
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", path, err)
		}

		var lesson models.Lesson
		if err := json.Unmarshal(data, &lesson); err != nil {
			return fmt.Errorf("failed to parse %s: %w", path, err)
		}

		store.Add(&lesson)
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Sort lessons by order within each language
	store.mu.Lock()
	for lang := range store.byLang {
		sort.Slice(store.byLang[lang], func(i, j int) bool {
			return store.byLang[lang][i].Order < store.byLang[lang][j].Order
		})
	}
	store.mu.Unlock()

	return store, nil
}

// Add adds a lesson to the store
func (s *Store) Add(lesson *models.Lesson) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.lessons[lesson.ID] = lesson
	s.byLang[lesson.Language] = append(s.byLang[lesson.Language], lesson)
}

// Get returns a lesson by ID
func (s *Store) Get(id string) (*models.Lesson, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	l, ok := s.lessons[id]
	return l, ok
}

// GetByLanguage returns all lessons for a language
func (s *Store) GetByLanguage(language string) []*models.Lesson {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.byLang[language]
}

// All returns all lessons
func (s *Store) All() []*models.Lesson {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*models.Lesson, 0, len(s.lessons))
	for _, l := range s.lessons {
		result = append(result, l)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].Language != result[j].Language {
			return result[i].Language < result[j].Language
		}
		return result[i].Order < result[j].Order
	})

	return result
}

// Count returns the number of lessons
func (s *Store) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return len(s.lessons)
}

// GetLanguages returns a list of all available languages with lesson counts
func (s *Store) GetLanguages() []models.LanguageInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Map of language ID to display info
	langNames := map[string]struct{ name, icon string }{
		"go":         {"Go", "🐹"},
		"python":     {"Python", "🐍"},
		"javascript": {"JavaScript", "🟨"},
		"typescript": {"TypeScript", "🔷"},
		"rust":       {"Rust", "🦀"},
		"java":       {"Java", "☕"},
		"c":          {"C", "⚙️"},
		"cpp":        {"C++", "⚙️"},
		"csharp":     {"C#", "🟪"},
		"ruby":       {"Ruby", "💎"},
		"php":        {"PHP", "🐘"},
		"swift":      {"Swift", "🍎"},
		"kotlin":     {"Kotlin", "🟣"},
	}

	var result []models.LanguageInfo
	for lang, lessons := range s.byLang {
		info := models.LanguageInfo{
			ID:          lang,
			LessonCount: len(lessons),
		}
		if meta, ok := langNames[lang]; ok {
			info.Name = meta.name
			info.Icon = meta.icon
		} else {
			info.Name = lang
			info.Icon = "📝"
		}
		result = append(result, info)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].LessonCount > result[j].LessonCount
	})

	return result
}
