package storage

import (
	"github.com/shirou/gopsutil/v3/disk"
)

type DriveService struct{}

func NewDriveService() *DriveService{
	return &DriveService{}
}

func (d *DriveService) GetDiskStats (path string)(*DiskStats, error){

	usage, err:=disk.Usage(path)

	if err != nil {
		return nil, err
	}

	return &DiskStats{
		Path:        usage.Path,
		TotalBytes:  usage.Total,
		FreeBytes:   usage.Free,
		UsedBytes:   usage.Used,
		UsedPercent: usage.UsedPercent,
	}, nil

}

func (d *DriveService) GetAvaliableServices ()([]string, error){
	partitions,err := disk.Partitions(false)
	if err != nil {
		return nil, err
	}
	var drives []string
	for _, p := range partitions{
		drives = append(drives, p.Mountpoint)
	}
	return drives, nil
}