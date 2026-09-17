package filemanager

import (
	"fmt"
	"os/exec"
	"path/filepath"
)

type FileManagerService struct{}

func NewFileManagerService() *FileManagerService {
	return &FileManagerService{

	}
}

func (fm *FileManagerService) OpenWithDefaultEditor(filePath string, forceDialog bool) error {
	cleanPath := filepath.Clean(filePath)

	cmd := exec.Command("explorer.exe", cleanPath)

	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("gagal membuka Explorer: %w", err)
	}
	return nil
}

func (fm *FileManagerService) OpenInFolder(filePath string, forceDialog bool) error {
	cleanPath := filepath.Clean(filePath)

	cmd := exec.Command("explorer.exe", "/select,", cleanPath)
	
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("gagal membuka Explorer: %w", err)
	}
	return nil
}