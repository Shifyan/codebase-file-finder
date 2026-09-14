package scanner

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/charlievieth/fastwalk"
	"github.com/gobwas/glob"
	ignore "github.com/sabhiram/go-gitignore"
)

const MaxResults = 20000

var errLimitReached = errors.New("scanner: batas hasil tercapai")

var defaultIgnores = []string{
	".git",
	"node_modules",
	"dist",
	"build",
	"target",
	"vendor",
	"__pycache__",
	"venv",
	".venv",
	".next",
	".cache",
	".gradle",
}

type Result struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	Size     int64  `json:"size"`
	Modified int64  `json:"modified"`
}

type FileService struct{}

func NewFileService() *FileService {
	return &FileService{}
}

func (s *FileService) Search(root string, patterns []string, keyword string, respectGitignore bool) ([]Result, error) {
	root = normalizeRoot(root)

	matchers := make([]*glob.Pattern, 0, len(patterns))
	for _, pattern := range patterns {
		g, err := glob.Compile(pattern)
		if err != nil {
			return nil, fmt.Errorf("pola tidak valid %q: %w", pattern, err)
		}
		matchers = append(matchers, g)
	}

	var ignorer *ignore.GitIgnore
	if respectGitignore {
		ignorer = loadIgnore(root)
	}

	keyword = strings.ToLower(keyword)

	var (
		mu      sync.Mutex
		results = make([]Result, 0, 128)
	)

	err := fastwalk.Walk(nil, root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}

		if entry.IsDir() {
			if ignorer != nil && ignorer.MatchesPath(path) {
				return fastwalk.SkipDir
			}
			return nil
		}

		if !matchesAny(matchers, entry.Name()) {
			return nil
		}

		if ignorer != nil && ignorer.MatchesPath(path) {
			return nil
		}

		if keyword != "" && !strings.Contains(strings.ToLower(entry.Name()), keyword) {
			return nil
		}

		info, err := fastwalk.StatDirEntry(path, entry)
		if err != nil {
			return nil
		}

		mu.Lock()
		if len(results) >= MaxResults {
			mu.Unlock()
			return errLimitReached
		}
		results = append(results, Result{
			Name:     entry.Name(),
			Path:     path,
			Size:     info.Size(),
			Modified: info.ModTime().UnixMilli(),
		})
		mu.Unlock()

		return nil
	})

	if err != nil && !errors.Is(err, errLimitReached) {
		return nil, err
	}

	return results, nil
}

func normalizeRoot(root string) string {
	if len(root) == 2 && root[1] == ':' {
		return root + string(os.PathSeparator)
	}
	return root
}

func matchesAny(matchers []*glob.Pattern, name string) bool {
	for _, matcher := range matchers {
		if matcher.Match(name) {
			return true
		}
	}
	return false
}

func loadIgnore(root string) *ignore.GitIgnore {
	lines := append([]string{}, defaultIgnores...)
	if data, err := os.ReadFile(filepath.Join(root, ".gitignore")); err == nil {
		text := strings.ReplaceAll(string(data), "\r\n", "\n")
		lines = append(lines, strings.Split(text, "\n")...)
	}
	return ignore.CompileIgnoreLines(lines...)
}
