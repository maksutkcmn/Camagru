package services

import (
	"encoding/base64"
	"fmt"
	"image"
	"image/draw"
	_ "image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const maxImageSize = 5 * 1024 * 1024 // 5MB

func CreateImage(base64Image string, filterName string) (string, error) {
	parts := strings.Split(base64Image, ",")
	if len(parts) != 2 {
		return "", fmt.Errorf("Unknown image format")
	}

	header := strings.ToLower(parts[0])
	if !strings.Contains(header, "image/png") && !strings.Contains(header, "image/jpeg") && !strings.Contains(header, "image/jpg") {
		return "", fmt.Errorf("Only PNG and JPEG images are allowed")
	}

	rawData := parts[1]
	if len(rawData) > maxImageSize {
		return "", fmt.Errorf("Image size exceeds maximum allowed size (5MB)")
	}

	reader := base64.NewDecoder(base64.StdEncoding, strings.NewReader(rawData))

	bgImage, _, err := image.Decode(reader)
	if err != nil {
		return "", fmt.Errorf("Image not decoded")
	}

	bounds := bgImage.Bounds()
    rgba := image.NewRGBA(bounds)
    draw.Draw(rgba, bounds, bgImage, image.Point{0, 0}, draw.Src)

    if filterName != "" {
        filterPath := filepath.Join("filters", filterName)

        if _, err := os.Stat(filterPath); err == nil {
            filterFile, err := os.Open(filterPath)
            if err == nil {
                defer filterFile.Close()
                filterImage, _, err := image.Decode(filterFile)
                if err == nil {
                    filterBounds := filterImage.Bounds()
                    filterWidth := filterBounds.Dx()
                    filterHeight := filterBounds.Dy()

                    x := (bounds.Dx() - filterWidth) / 2
                    y := (bounds.Dy() - filterHeight) / 2

                    offset := image.Rect(x, y, x+filterWidth, y+filterHeight)

                    draw.Draw(rgba, offset, filterImage, image.Point{0, 0}, draw.Over)
                }
            }
        }
    }

	filename := uuid.New().String() + ".png"
	savePath := filepath.Join("uploads", filename)

	if err := os.MkdirAll("uploads", 0755); err != nil {
		return "", fmt.Errorf("Failed to create uploads directory: %v", err)
	}

	outFile, err := os.Create(savePath)
	if err != nil {
		return "", fmt.Errorf("Failed to create image file: %v", err)
	}
	defer outFile.Close()

	if err := png.Encode(outFile, rgba); err != nil {
		return "", fmt.Errorf("Failed to encode image: %v", err)
	}

	return filepath.ToSlash(savePath), nil
}