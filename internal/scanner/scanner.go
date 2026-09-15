package scanner

import (
	"context"
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

const (
	DefaultBatchSize  = 500
	DefaultMaxResults = 20000
	MaxResultsCeiling = 200000
)

// Mode menentukan apa yang diabaikan saat pemindaian.
type Mode string

const (
	// ModeFast melewati folder bawaan (node_modules, .git, dist, ...) dan
	// menghormati .gitignore pada root pemindaian.
	ModeFast Mode = "fast"

	// ModeDeep tidak mengabaikan apa pun, termasuk node_modules dan .git,
	// sehingga pemindaian jauh lebih lambat dan berat.
	ModeDeep Mode = "deep"
)

var errLimitReached = errors.New("scanner: batas hasil tercapai")

var errCancelled = errors.New("scanner: pemindaian dibatalkan")

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

type SearchRequest struct {
	Root       string
	Patterns   []string
	Keyword    string
	Mode       Mode
	MaxResults int
}

type SearchStats struct {
	Total     int  `json:"total"`
	Truncated bool `json:"truncated"`
	Cancelled bool `json:"cancelled"`
}

// BatchFunc menerima potongan hasil setiap buffer mencapai batch size dan sekali
// lagi di akhir pemindaian. Pembatalan ditangani lewat context, bukan lewat
// nilai balik BatchFunc.
type BatchFunc func(batch []Result)

type FileService struct {
	BatchSize int
}

func NewFileService() *FileService {
	return &FileService{BatchSize: DefaultBatchSize}
}

func (s *FileService) Search(ctx context.Context, req SearchRequest, emit BatchFunc) (SearchStats, error) {
	root := normalizeRoot(req.Root)

	batchSize := s.BatchSize
	if batchSize <= 0 {
		batchSize = DefaultBatchSize
	}

	maxResults := req.MaxResults
	if maxResults <= 0 {
		maxResults = DefaultMaxResults
	}
	if maxResults > MaxResultsCeiling {
		maxResults = MaxResultsCeiling
	}

	matchers := make([]*glob.Pattern, 0, len(req.Patterns))
	for _, pattern := range req.Patterns {
		g, err := glob.Compile(pattern)
		if err != nil {
			return SearchStats{}, fmt.Errorf("pola tidak valid %q: %w", pattern, err)
		}
		matchers = append(matchers, g)
	}

	ignorer := buildIgnorer(root, req.Mode)

	keyword := strings.ToLower(req.Keyword)

	var (
		mu    sync.Mutex
		buf   []Result
		stats SearchStats
	)

	flushLocked := func(force bool) {
		if len(buf) == 0 {
			return
		}
		if !force && len(buf) < batchSize {
			return
		}
		out := buf
		buf = nil
		if emit != nil {
			emit(out)
		}
	}

	err := fastwalk.Walk(nil, root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}

		select {
		case <-ctx.Done():
			return errCancelled
		default:
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
		defer mu.Unlock()

		if stats.Total >= maxResults {
			stats.Truncated = true
			return errLimitReached
		}

		stats.Total++
		buf = append(buf, Result{
			Name:     entry.Name(),
			Path:     path,
			Size:     info.Size(),
			Modified: info.ModTime().UnixMilli(),
		})
		flushLocked(false)

		return nil
	})

	if err != nil {
		switch {
		case errors.Is(err, errLimitReached):
			// Batas hasil tercapai: hasil dikembalikan sebagian, bukan kegagalan.
		case errors.Is(err, errCancelled):
			stats.Cancelled = true
		default:
			return stats, err
		}
	}

	mu.Lock()
	flushLocked(true)
	mu.Unlock()

	return stats, nil
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

// buildIgnorer mengembalikan nil untuk ModeDeep, yang berarti tidak ada berkas
// maupun folder yang diabaikan sama sekali. ModeFast memakai daftar bawaan
// ditambah isi .gitignore pada root pemindaian.
func buildIgnorer(root string, mode Mode) *ignore.GitIgnore {
	if mode == ModeDeep {
		return nil
	}

	lines := append([]string{}, defaultIgnores...)
	if data, err := os.ReadFile(filepath.Join(root, ".gitignore")); err == nil {
		text := strings.ReplaceAll(string(data), "\r\n", "\n")
		lines = append(lines, strings.Split(text, "\n")...)
	}
	return ignore.CompileIgnoreLines(lines...)
}
