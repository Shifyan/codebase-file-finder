package main

import (
	"context"
	"fmt"
	"sync"

	"programming-languages-finder/internal/scanner"
	"programming-languages-finder/internal/storage"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	eventSearchBatch = "search:batch"
	eventSearchDone  = "search:done"
	eventSearchError = "search:error"
)

type searchBatchPayload struct {
	SearchID string           `json:"searchId"`
	Results  []scanner.Result `json:"results"`
}

type searchDonePayload struct {
	SearchID string              `json:"searchId"`
	Stats    scanner.SearchStats `json:"stats"`
}

type searchErrorPayload struct {
	SearchID string `json:"searchId"`
	Message  string `json:"message"`
}

// App struct
type App struct {
	ctx        context.Context
	storageSvc *storage.DriveService
	fileSvc    *scanner.FileService
	mu         sync.Mutex
	cancels    map[string]context.CancelFunc
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		storageSvc: storage.NewDriveService(),
		fileSvc:    scanner.NewFileService(),
		cancels:    make(map[string]context.CancelFunc),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) GetDiskStats(path string) (*storage.DiskStats, error) {
	return a.storageSvc.GetDiskStats(path)
}

func (a *App) GetAvaliableServices() ([]string, error) {
	return a.storageSvc.GetAvaliableServices()
}

// SearchFiles memindai berkas dan mengirim hasilnya secara streaming lewat event
// search:batch, diakhiri event search:done atau search:error. Nilai balik hanya
// dipakai frontend untuk menunggu selesai dan menangkap error.
func (a *App) SearchFiles(root string, patterns []string, keyword string, mode string, maxResults int, searchID string) (scanner.SearchStats, error) {
	ctx, cancel := context.WithCancel(a.ctx)
	defer cancel()

	a.mu.Lock()
	a.cancels[searchID] = cancel
	a.mu.Unlock()

	defer func() {
		a.mu.Lock()
		delete(a.cancels, searchID)
		a.mu.Unlock()
	}()

	stats, err := a.fileSvc.Search(ctx, scanner.SearchRequest{
		Root:       root,
		Patterns:   patterns,
		Keyword:    keyword,
		Mode:       scanner.Mode(mode),
		MaxResults: maxResults,
	}, func(batch []scanner.Result) {
		runtime.EventsEmit(a.ctx, eventSearchBatch, searchBatchPayload{
			SearchID: searchID,
			Results:  batch,
		})
	})

	if err != nil {
		runtime.EventsEmit(a.ctx, eventSearchError, searchErrorPayload{
			SearchID: searchID,
			Message:  err.Error(),
		})
		return stats, err
	}

	runtime.EventsEmit(a.ctx, eventSearchDone, searchDonePayload{
		SearchID: searchID,
		Stats:    stats,
	})

	return stats, nil
}

// CancelSearch menghentikan pemindaian yang sedang berjalan berdasarkan searchID.
func (a *App) CancelSearch(searchID string) error {
	a.mu.Lock()
	cancel, ok := a.cancels[searchID]
	a.mu.Unlock()

	if !ok {
		return fmt.Errorf("pemindaian %q tidak ditemukan", searchID)
	}

	cancel()
	return nil
}
