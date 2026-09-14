package scanner

import (
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

func TestSearch(t *testing.T) {
	root := t.TempDir()

	write(t, filepath.Join(root, "main.go"), "package main")
	write(t, filepath.Join(root, "readme.md"), "# readme")
	write(t, filepath.Join(root, "app.js"), "")
	write(t, filepath.Join(root, "src", "deep.go"), "package src")
	write(t, filepath.Join(root, "node_modules", "lib.js"), "")
	write(t, filepath.Join(root, ".git", "config"), "")

	// CRLF disengaja: .gitignore buatan Windows harus tetap terbaca.
	write(t, filepath.Join(root, ".gitignore"), "*.md\r\napp.js\r\n")

	svc := NewFileService()
	patterns := []string{"*.go", "*.js", "*.md"}

	t.Run("glob ekstensi dengan gitignore aktif", func(t *testing.T) {
		got, err := svc.Search(root, patterns, "", true)
		if err != nil {
			t.Fatal(err)
		}
		want := []string{"deep.go", "main.go"}
		if !slices.Equal(names(got), want) {
			t.Fatalf("got %v, want %v", names(got), want)
		}
	})

	t.Run("tanpa gitignore semua ikut terbaca", func(t *testing.T) {
		got, err := svc.Search(root, patterns, "", false)
		if err != nil {
			t.Fatal(err)
		}
		want := []string{"app.js", "deep.go", "lib.js", "main.go", "readme.md"}
		if !slices.Equal(names(got), want) {
			t.Fatalf("got %v, want %v", names(got), want)
		}
	})

	t.Run("keyword menyaring nama berkas", func(t *testing.T) {
		got, err := svc.Search(root, []string{"*.go"}, "deep", true)
		if err != nil {
			t.Fatal(err)
		}
		want := []string{"deep.go"}
		if !slices.Equal(names(got), want) {
			t.Fatalf("got %v, want %v", names(got), want)
		}
	})

	t.Run("metadata berkas terisi", func(t *testing.T) {
		got, err := svc.Search(root, []string{"main.go"}, "", true)
		if err != nil {
			t.Fatal(err)
		}
		if len(got) != 1 {
			t.Fatalf("got %d hasil, want 1", len(got))
		}
		if got[0].Size == 0 || got[0].Modified == 0 {
			t.Fatalf("size/modified kosong: %+v", got[0])
		}
	})

	t.Run("pola tidak valid ditolak", func(t *testing.T) {
		if _, err := svc.Search(root, []string{"["}, "", true); err == nil {
			t.Fatal("pola rusak seharusnya mengembalikan error")
		}
	})
}
