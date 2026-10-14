package main

import (
	// "fmt"
	"image/color"
	"log"
	"os"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text"
	"golang.org/x/image/font"
	"golang.org/x/image/font/opentype"

	// "github.com/hajimehoshi/ebiten/v2/ebitenutil"
	"github.com/hajimehoshi/ebiten/v2/vector"
)

const (
	TextHeight       = PortraitSize * 0.35
	uiStrokeWidth    = float32(2.0)
	PortraitSize     = 80
	ResourceBarSize  = 64
	ResourceIconSize = TextHeight
	ActionSize       = (ScreenWidth - PortraitSize) / 3
)

var (
	GridColor  = color.RGBA{R: 100, G: 255, B: 120, A: 255}
	UIColor    = color.RGBA{R: 150, G: 255, B: 150, A: 255}
	TextColor  = color.RGBA{R: 150, G: 255, B: 150, A: 255}
	UIFontFace font.Face
)

func init() {
	loadUIFont("./pixeldroidConsoleRegular.ttf", TextHeight)
}

func loadUIFont(path string, size float64) {
	fontData, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("Failed to read font file: %v", err)
	}

	tt, err := opentype.Parse(fontData)
	if err != nil {
		log.Fatalf("Failed to parse font: %v", err)
	}

	const dpi = 72
	UIFontFace, err = opentype.NewFace(tt, &opentype.FaceOptions{
		Size:    size,
		DPI:     dpi,
		Hinting: font.HintingFull,
	})
	if err != nil {
		log.Fatalf("Failed to create font face: %v", err)
	}
}

func calcGridSize() (float32, float32, float32, float32, float32) {
	// Calculating how big the hexagons should be
	// Hexs overlap width wise which is what the magic numbers are for
	hexWidth := float32(ScreenWidth) / (GridWidth*0.75 + 0.25)
	hexHeight := float32(ScreenHeight) / GridHeight

	hexRadius := min(hexHeight, hexWidth) / 2.0
	gridScreenHeight := (GridHeight + 0.5) * hexRadius * 2.0
	gridScreenWidth := (GridWidth*0.75 + 0.25) * hexRadius * 2.0
	yOffset := (ScreenHeight - gridScreenHeight) / 2.0
	xOffset := (ScreenWidth - gridScreenWidth) / 2.0
	return hexRadius, gridScreenHeight, gridScreenWidth, yOffset, xOffset
}

// TODO: Next function to write up, need to draw rectangles for UI and section it for player name, commander, resource count, and possible actions
func (g *Game) drawUI(screen *ebiten.Image) {
	// Calculate empty space for header / footer UI
	ySpace := float32(PortraitSize)

	// Draw border above and below game grid
	vector.StrokeLine(screen, 0, ySpace, ScreenWidth, ySpace, uiStrokeWidth, UIColor, false)
	vector.StrokeLine(screen, 0, ScreenHeight-ySpace, ScreenWidth, ScreenHeight-ySpace, uiStrokeWidth, UIColor, false)

	// write player / commander names
	// draw resource count

	// space on left for portrait
	vector.StrokeLine(screen, PortraitSize, 0, PortraitSize, ySpace, uiStrokeWidth, UIColor, false)
	vector.StrokeLine(screen, PortraitSize, ScreenHeight-ySpace, PortraitSize, ScreenHeight, uiStrokeWidth, UIColor, false)
	text.Draw(screen, "COMMAND\nPORTRAIT", UIFontFace, 0, TextHeight*0.75, TextColor)
	text.Draw(screen, "COMMAND\nPORTRAIT", UIFontFace, 0, int(ScreenHeight-ySpace+TextHeight*0.75), TextColor)

	// seperators for health / resource bars
	vector.StrokeLine(screen, PortraitSize, ResourceIconSize, ScreenWidth, ResourceIconSize, uiStrokeWidth, UIColor, false)
	vector.StrokeLine(screen, PortraitSize, ScreenHeight-ySpace+ResourceIconSize, ScreenWidth, ScreenHeight-ySpace+ResourceIconSize, uiStrokeWidth, UIColor, false)
	text.Draw(screen, "HEALTH BAR", UIFontFace, PortraitSize+5, TextHeight*0.75, TextColor)
	text.Draw(screen, "HEALTH BAR", UIFontFace, PortraitSize+5, int(ScreenHeight-ySpace+TextHeight*0.75), TextColor)

	spaceForHealthBar := ScreenWidth - PortraitSize - ResourceBarSize - ResourceIconSize
	startOfResourceBar := float32(PortraitSize + spaceForHealthBar)

	vector.StrokeLine(screen, startOfResourceBar, 0, startOfResourceBar, TextHeight, uiStrokeWidth, UIColor, false)
	vector.StrokeLine(screen, startOfResourceBar, ScreenHeight-ySpace+(TextHeight), startOfResourceBar, ScreenHeight-ySpace, uiStrokeWidth, UIColor, false)
	text.Draw(screen, "RES. BAR", UIFontFace, int(startOfResourceBar), TextHeight*0.75, TextColor)
	text.Draw(screen, "RES. BAR", UIFontFace, int(startOfResourceBar), int(ScreenHeight-ySpace+TextHeight*0.75), TextColor)

	// draw possible actions
	vector.StrokeLine(screen, PortraitSize+ActionSize, TextHeight, PortraitSize+ActionSize, ySpace, uiStrokeWidth, UIColor, false)
	vector.StrokeLine(screen, PortraitSize+(2*ActionSize), TextHeight, PortraitSize+(2*ActionSize), ySpace, uiStrokeWidth, UIColor, false)
	vector.StrokeLine(screen, PortraitSize+ActionSize, ScreenHeight-ySpace+TextHeight, PortraitSize+ActionSize, ScreenHeight, uiStrokeWidth, UIColor, false)
	vector.StrokeLine(screen, PortraitSize+(2*ActionSize), ScreenHeight-ySpace+TextHeight, PortraitSize+(2*ActionSize), ScreenHeight, uiStrokeWidth, UIColor, false)
	text.Draw(screen, "ACT 1", UIFontFace, PortraitSize, TextHeight*01.75, TextColor)
	text.Draw(screen, "ACT 1", UIFontFace, PortraitSize, int(ScreenHeight-ySpace+TextHeight*1.75), TextColor)
	text.Draw(screen, "ACT 2", UIFontFace, PortraitSize+ActionSize, TextHeight*1.75, TextColor)
	text.Draw(screen, "ACT 2", UIFontFace, PortraitSize+ActionSize, int(ScreenHeight-ySpace+TextHeight*1.75), TextColor)

	text.Draw(screen, "ACT 3", UIFontFace, PortraitSize+2*ActionSize, TextHeight*1.75, TextColor)
	text.Draw(screen, "ACT 3", UIFontFace, PortraitSize+2*ActionSize, int(ScreenHeight-ySpace+TextHeight*1.75), TextColor)
}

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
			vector.StrokeLine(screen, vertexA[0], vertexA[1], vertexB[0], vertexB[1], strokeWidth, GridColor, false)
		}
	}

	hexRadius, _, _, yOffset, xOffset := calcGridSize()

	for column := range g.grid {
		xPos := xOffset + float32(column)*1.5*hexRadius + hexRadius
		for cell := range g.grid[column] {
			// Need to offset the hexagons height a bit
			yPos := yOffset + float32(cell*2)*hexRadius + hexRadius*float32(column%2+1)
			drawHexagon(screen, xPos, yPos, hexRadius, 2.0)
		}
	}
}

func (g *Game) Draw(screen *ebiten.Image) {
	g.drawBackground(screen)
	g.drawGrid(screen)

	g.drawUnits(screen)
	g.drawUI(screen)

	// Debug / Status Info
	// ebitenutil.DebugPrint(screen, fmt.Sprintf("NEWTYPE 2D ENGINE (GO WASM)\nTurn: %d | Status: %s", g.turnNumber, g.statusMsg))
}
