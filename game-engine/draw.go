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

func (g *Game) drawBackground(screen *ebiten.Image) {
	// Background
	screen.Fill(color.RGBA{R: 18, G: 24, B: 38, A: 255})
}

func (g *Game) drawGrid(screen *ebiten.Image) {
	gridColor := color.RGBA{R: 100, G: 100, B: 120, A: 255}

	drawHexagon := func(screen *ebiten.Image, x, y, r, strokeWidth float32) {
		vertices := [6][2]float32{
			{x - r, y},
			{x - r/2.0, y - r},
			{x + r/2.0, y - r},
			{x + r, y},
			{x + r/2.0, y + r},
			{x - r/2.0, y + r},
		}
		for index := range vertices {
			vertexA := vertices[index]
			vertexB := vertices[(index+1)%6]
			vector.StrokeLine(screen, vertexA[0], vertexA[1], vertexB[0], vertexB[1], strokeWidth, gridColor, false)
		}
	}

	// Calculating how big the hexagons should be
	// Hexs overlap width wise which is what the magic numbers are for
	hexWidth := float32(ScreenWidth) / (GridWidth*0.75 + 0.25)
	hexHeight := float32(ScreenHeight) / GridHeight
	hexRadius := min(hexHeight, hexWidth) / 2.0

	gridScreenHeight := GridHeight * hexRadius * 2.0
	gridScreenWidth := (GridWidth*0.75 + 0.25) * hexRadius * 2.0
	yOffset := (ScreenHeight - gridScreenHeight) / 2.0
	xOffset := (ScreenWidth - gridScreenWidth) / 2.0

	for column := range g.grid {
		xPos := xOffset + float32(column)*1.5*hexRadius + hexRadius
		for cell := range g.grid[column] {
			// Need to offset the hexagons height a bit
			yPos := yOffset + float32(cell*2)*hexRadius + hexRadius*float32(column%2+1)
			drawHexagon(screen, xPos, yPos, hexRadius, 2.0)
		}
	}

	// // Grid Lines
	// for x := 0; x < ScreenWidth; x += 40 {
	// 	vector.StrokeLine(screen, float32(x), 0, float32(x), ScreenHeight, 1, gridColor, false)
	// }
	// for y := 0; y < ScreenHeight; y += 40 {
	// 	vector.StrokeLine(screen, 0, float32(y), ScreenWidth, float32(y), 1, gridColor, false)
	// }
}

func (g *Game) Draw(screen *ebiten.Image) {
	g.drawBackground(screen)
	g.drawGrid(screen)

	g.drawUnits(screen)

	// Debug / Status Info
	ebitenutil.DebugPrint(screen, fmt.Sprintf("NEWTYPE 2D ENGINE (GO WASM)\nTurn: %d | Status: %s", g.turnNumber, g.statusMsg))
}
