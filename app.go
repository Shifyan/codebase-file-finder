package main

import (
	"context"
	"fmt"
	"programming-languages-finder/internal/scanner"
	"programming-languages-finder/internal/storage"
)

// App struct
type App struct {
	ctx context.Context
	storageSvc *storage.DriveService
	fileSvc *scanner.FileService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		storageSvc: storage.NewDriveService(),
		fileSvc: scanner.NewFileService(),
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

func (a *App) GetDiskStats (path string) (*storage.DiskStats, error){
	return a.storageSvc.GetDiskStats(path)
}

func (a *App) GetAvaliableServices ()([]string, error){
	return a.storageSvc.GetAvaliableServices()
}

func (a *App) SearchFiles (root string, patterns []string, keyword string, respectGitignore bool)([]scanner.Result, error){
	return a.fileSvc.Search(root, patterns, keyword, respectGitignore)
}


