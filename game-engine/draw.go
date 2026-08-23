package main

import (
	"fmt"
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/ebitenutil"
	"github.com/hajimehoshi/ebiten/v2/vector"
)

func (g *Game) drawUnits(screen *ebiten.Image) {
	for _, unit := range g.player.units {
		vector.DrawFilledCircle(screen, unit.X, unit.Y, 20.0, unit.Color, true)
	}
}

func (g *Game) Draw(screen *ebiten.Image) {
	// Background
	screen.Fill(color.RGBA{R: 18, G: 24, B: 38, A: 255})

	// Grid Lines
	gridColor := color.RGBA{R: 40, G: 50, B: 70, A: 255}
	for x := 0; x < ScreenWidth; x += 40 {
		vector.StrokeLine(screen, float32(x), 0, float32(x), ScreenHeight, 1, gridColor, false)
	}
	for y := 0; y < ScreenHeight; y += 40 {
		vector.StrokeLine(screen, 0, float32(y), ScreenWidth, float32(y), 1, gridColor, false)
	}

	g.drawUnits(screen)

	// Debug / Status Info
	ebitenutil.DebugPrint(screen, fmt.Sprintf("NEWTYPE 2D ENGINE (GO WASM)\nTurn: %d | Status: %s", g.turnNumber, g.statusMsg))
}
