package scanner

import (
	"context"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"testing"
)

func write(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func names(results []Result) []string {
	out := make([]string, 0, len(results))
	for _, result := range results {
		out = append(out, result.Name)
	}
	sort.Strings(out)
	return out
}

type collector struct {
	batches [][]Result
	all     []Result
}

func newCollector() (*collector, BatchFunc) {
	c := &collector{}
	return c, func(batch []Result) {
		cp := append([]Result(nil), batch...)
		c.batches = append(c.batches, cp)
		c.all = append(c.all, cp...)
	}
}

func run(t *testing.T, svc *FileService, req SearchRequest) (SearchStats, *collector) {
	t.Helper()
	c, emit := newCollector()
	stats, err := svc.Search(context.Background(), req, emit)
	if err != nil {
		t.Fatal(err)
	}
	return stats, c
}

func batchSizes(batches [][]Result) []int {
	out := make([]int, 0, len(batches))
	for _, batch := range batches {
		out = append(out, len(batch))
	}
	return out
}

func TestNormalizeRoot(t *testing.T) {
	// gopsutil mengembalikan mountpoint Windows tanpa backslash ("D:"), dan
	// path seperti itu berarti "current directory di drive D:", bukan root
	// drive. Tanpa normalisasi, pemindaian diam-diam membaca folder kerja
	// proses alih-alih seluruh drive.
	sep := string(os.PathSeparator)

	cases := []struct {
		in   string
		want string
	}{
		{"D:", "D:" + sep},
		{"C:", "C:" + sep},
		{"D:\\", "D:\\"},
		{"/", "/"},
		{"/home/user", "/home/user"},
	}

	for _, c := range cases {
		if got := normalizeRoot(c.in); got != c.want {
			t.Errorf("normalizeRoot(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func fixtureRoot(t *testing.T) string {
	t.Helper()
	root := t.TempDir()

	write(t, filepath.Join(root, "main.go"), "package main")
	write(t, filepath.Join(root, "readme.md"), "# readme")
	write(t, filepath.Join(root, "app.js"), "")
	write(t, filepath.Join(root, "src", "deep.go"), "package src")
	write(t, filepath.Join(root, "node_modules", "lib.js"), "")
	write(t, filepath.Join(root, ".git", "config"), "")

	// CRLF disengaja: .gitignore buatan Windows harus tetap terbaca.
	write(t, filepath.Join(root, ".gitignore"), "*.md\r\napp.js\r\n")

	return root
}

func TestSearch(t *testing.T) {
	root := fixtureRoot(t)
	svc := NewFileService()
	patterns := []string{"*.go", "*.js", "*.md"}

	t.Run("mode fast mengabaikan .gitignore dan folder bawaan", func(t *testing.T) {
		_, got := run(t, svc, SearchRequest{
			Root: root, Patterns: patterns, Mode: ModeFast,
		})
		// app.js/readme.md dikecualikan .gitignore, node_modules/lib.js
		// dikecualikan daftar bawaan.
		want := []string{"deep.go", "main.go"}
		if !slices.Equal(names(got.all), want) {
			t.Fatalf("got %v, want %v", names(got.all), want)
		}
	})

	t.Run("mode deep tidak mengabaikan apa pun", func(t *testing.T) {
		_, got := run(t, svc, SearchRequest{
			Root: root, Patterns: patterns, Mode: ModeDeep,
		})
		// node_modules/lib.js ikut terbaca karena deep tidak memakai ignores.
		want := []string{"app.js", "deep.go", "lib.js", "main.go", "readme.md"}
		if !slices.Equal(names(got.all), want) {
			t.Fatalf("got %v, want %v", names(got.all), want)
		}
	})

	t.Run("keyword menyaring nama berkas", func(t *testing.T) {
		_, got := run(t, svc, SearchRequest{
			Root: root, Patterns: []string{"*.go"}, Keyword: "deep", Mode: ModeFast,
		})
		want := []string{"deep.go"}
		if !slices.Equal(names(got.all), want) {
			t.Fatalf("got %v, want %v", names(got.all), want)
		}
	})

	t.Run("metadata berkas terisi", func(t *testing.T) {
		_, got := run(t, svc, SearchRequest{
			Root: root, Patterns: []string{"main.go"}, Mode: ModeFast,
		})
		if len(got.all) != 1 {
			t.Fatalf("got %d hasil, want 1", len(got.all))
		}
		if got.all[0].Size == 0 || got.all[0].Modified == 0 {
			t.Fatalf("size/modified kosong: %+v", got.all[0])
		}
	})

	t.Run("pola tidak valid ditolak", func(t *testing.T) {
		if _, err := svc.Search(context.Background(), SearchRequest{
			Root: root, Patterns: []string{"["}, Mode: ModeFast,
		}, func([]Result) {}); err == nil {
			t.Fatal("pola rusak seharusnya mengembalikan error")
		}
	})
}

func TestSearchBatching(t *testing.T) {
	root := t.TempDir()
	for i := 0; i < 5; i++ {
		write(t, filepath.Join(root, "file"+string(rune('a'+i))+".go"), "package main")
	}

	svc := NewFileService()
	svc.BatchSize = 2

	stats, got := run(t, svc, SearchRequest{Root: root, Patterns: []string{"*.go"}})

	if stats.Total != 5 {
		t.Fatalf("stats.Total = %d, want 5", stats.Total)
	}
	// Buffer di-flush tepat saat mencapai batch size, jadi 5 berkas -> 2+2+1.
	wantSizes := []int{2, 2, 1}
	if !slices.Equal(batchSizes(got.batches), wantSizes) {
		t.Fatalf("ukuran batch = %v, want %v", batchSizes(got.batches), wantSizes)
	}
}

func TestSearchMaxResults(t *testing.T) {
	root := t.TempDir()
	for i := 0; i < 5; i++ {
		write(t, filepath.Join(root, "file"+string(rune('a'+i))+".go"), "package main")
	}

	svc := NewFileService()
	stats, got := run(t, svc, SearchRequest{
		Root: root, Patterns: []string{"*.go"}, MaxResults: 2,
	})

	if !stats.Truncated {
		t.Fatal("stats.Truncated = false, want true")
	}
	if stats.Total != 2 {
		t.Fatalf("stats.Total = %d, want 2", stats.Total)
	}
	if len(got.all) != 2 {
		t.Fatalf("hasil terkumpul = %d, want 2", len(got.all))
	}
}

func TestSearchCancelled(t *testing.T) {
	root := fixtureRoot(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	svc := NewFileService()
	c, emit := newCollector()

	stats, err := svc.Search(ctx, SearchRequest{
		Root: root, Patterns: []string{"*.go"}, Mode: ModeFast,
	}, emit)

	if err != nil {
		t.Fatalf("pembatalan bukan kegagalan, dapat error: %v", err)
	}
	if !stats.Cancelled {
		t.Fatal("stats.Cancelled = false, want true")
	}
	if len(c.all) != 0 {
		t.Fatalf("hasil = %d, want 0 setelah dibatalkan", len(c.all))
	}
}
