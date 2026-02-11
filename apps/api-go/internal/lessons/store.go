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

// LoadLessons reads all lesson files from the content directory
func LoadLessons(contentDir string) (*Store, error) {
	store := NewStore()

	err := filepath.Walk(contentDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories unless they are lesson directories (containing main.json)
		if info.IsDir() {
			mainPath := filepath.Join(path, "main.json")
			if _, err := os.Stat(mainPath); err == nil {
				// This is a directory-based lesson
				lesson, err := loadDirectoryLesson(path, contentDir)
				if err != nil {
					return err
				}
				store.Add(lesson)
				return filepath.SkipDir // We processed this dir
			}
			return nil
		}

		// Support old-style single JSON files (not in a lesson directory)
		if !strings.HasSuffix(info.Name(), ".json") || info.Name() == "main.json" {
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

		// Extract level from path: content/<language>/<level>/file.json
		lesson.Level = extractLevelFromPath(path, contentDir)

		store.Add(&lesson)
		return nil
	})

	if err != nil && err != filepath.SkipDir {
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

// extractLevelFromPath extracts the level (basic, intermediate, advanced, exercises)
// from the file path: content/<language>/<level>/file.json
func extractLevelFromPath(path string, contentDir string) string {
	// Get relative path from content dir
	relPath, err := filepath.Rel(contentDir, path)
	if err != nil {
		return "basic" // default
	}

	// Split path: language/level/file.json
	parts := strings.Split(filepath.ToSlash(relPath), "/")
	if len(parts) >= 2 {
		level := parts[1]
		// Validate level
		validLevels := []string{"basic", "intermediate", "advanced", "exercises"}
		for _, valid := range validLevels {
			if level == valid {
				return level
			}
		}
	}

	return "basic" // default
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

	// Soon languages
	soonLangs := map[string]struct{ name, icon string }{
		"cybersecurity": {"Cybersecurity", "🔒"},
		"aws":           {"AWS", "☁️"},
		"devops":        {"DevOps", "⚙️"},
		"docker":        {"Docker", "🐳"},
		"kubernetes":    {"Kubernetes", "⎈"},
		"react":         {"React", "⚛️"},
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

	// Add soon languages
	for lang, meta := range soonLangs {
		result = append(result, models.LanguageInfo{
			ID:          lang,
			Name:        meta.name,
			Icon:        meta.icon,
			LessonCount: 0,
			Soon:        true,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		// Sort by lesson count first (available languages), then by name for soon languages
		if result[i].LessonCount != result[j].LessonCount {
			return result[i].LessonCount > result[j].LessonCount
		}
		return result[i].Name < result[j].Name
	})

	return result
}

// loadDirectoryLesson loads a lesson from a directory containing main.json and a code file
func loadDirectoryLesson(dirPath string, contentDir string) (*models.Lesson, error) {
	mainPath := filepath.Join(dirPath, "main.json")
	data, err := os.ReadFile(mainPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read %s: %w", mainPath, err)
	}

	var lesson models.Lesson
	if err := json.Unmarshal(data, &lesson); err != nil {
		return nil, fmt.Errorf("failed to parse %s: %w", mainPath, err)
	}

	// If code is not in JSON, look for a code file
	if lesson.Code == "" {
		codePath := ""
		// Look for files named code.ext or index.ext or matching the language name
		exts := []string{".go", ".js", ".py", ".ts", ".c", ".cpp", ".cs", ".rb", ".php", ".swift", ".kt"}
		files, _ := os.ReadDir(dirPath)
		for _, f := range files {
			if f.IsDir() || f.Name() == "main.json" {
				continue
			}
			name := strings.ToLower(f.Name())
			if strings.HasPrefix(name, "code.") || strings.HasPrefix(name, "exercise.") || strings.HasPrefix(name, "index.") {
				codePath = filepath.Join(dirPath, f.Name())
				break
			}
			// Fallback: any file with a code extension
			for _, ext := range exts {
				if strings.HasSuffix(name, ext) {
					codePath = filepath.Join(dirPath, f.Name())
					break
				}
			}
			if codePath != "" {
				break
			}
		}

		if codePath != "" {
			codeData, err := os.ReadFile(codePath)
			if err != nil {
				return nil, fmt.Errorf("failed to read code file %s: %w", codePath, err)
			}
			lesson.Code = string(codeData)
		}
	}

	// Extract level from directory path
	lesson.Level = extractLevelFromPath(dirPath, contentDir)

	return &lesson, nil
}
