package services

import (
	"encoding/base64"
	"fmt"
	"image"
	"image/png"
	"image/draw"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

func CreateImage(base64Image string, filterName string) (string, error) {
	parts := strings.Split(base64Image, ",")
	if len(parts) != 2 {
		return "" , fmt.Errorf("Unkown image format")
	}
	reader := base64.NewDecoder(base64.StdEncoding, strings.NewReader(parts[1]))

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