package main

import (
	"encoding/json"
	"fmt"
	"image/color"
	"log"
	"syscall/js"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/ebitenutil"
	"github.com/hajimehoshi/ebiten/v2/vector"
)

const (
	ScreenWidth  = 360
	ScreenHeight = 640
)

type Unit struct {
	X     float32
	Y     float32
	Color color.RGBA
}

type Game struct {
	playerUnit Unit
	ghostUnit  Unit
	turn       int
	statusMsg  string
}

func NewGame() *Game {
	g := &Game{
		playerUnit: Unit{X: 180, Y: 500, Color: color.RGBA{R: 0, G: 230, B: 118, A: 255}},
		ghostUnit:  Unit{X: 180, Y: 140, Color: color.RGBA{R: 255, G: 235, B: 59, A: 180}},
		turn:       1,
		statusMsg:  "Ready - Touch/Click to Move",
	}
	g.registerJSCallbacks()
	return g
}

func (g *Game) registerJSCallbacks() {
	// Register JS function window.onNetworkSignal(jsonStr)
	js.Global().Set("onNetworkSignal", js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) > 0 {
			rawJson := args[0].String()
			var data map[string]interface{}
			if err := json.Unmarshal([]byte(rawJson), &data); err == nil {
				if msg, ok := data["status"].(string); ok {
					g.statusMsg = msg
				}
			}
		}
		return nil
	}))
}

func (g *Game) Update() error {
	// Handle Touch or Click input
	if ebiten.IsMouseButtonPressed(ebiten.MouseButtonLeft) {
		cx, cy := ebiten.CursorPosition()
		g.playerUnit.X = float32(cx)
		g.playerUnit.Y = float32(cy)
		g.statusMsg = fmt.format("Moved Unit to (%d, %d)", cx, cy)
		g.notifyJSStateChange()
	}
	return nil
}

func (g *Game) notifyJSStateChange() {
	// Broadcast state change to JavaScript WebRTC channel if available
	sendFn := js.Global().Get("sendP2PMessage")
	if sendFn.Type() == js.TypeFunction {
		payload := fmt.Sprintf(`{"type":"UNIT_MOVE","x":%.1f,"y":%.1f}`, g.playerUnit.X, g.playerUnit.Y)
		sendFn.Invoke(payload)
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

	// Draw Player Unit
	vector.DrawFilledCircle(screen, g.playerUnit.X, g.playerUnit.Y, 16, g.playerUnit.Color, false)

	// Draw Time Travel Ghost Unit
	vector.DrawFilledCircle(screen, g.ghostUnit.X, g.ghostUnit.Y, 12, g.ghostUnit.Color, false)

	// Debug / Status Info
	ebitenutil.DebugPrint(screen, fmt.Sprintf("NEWTYPE 2D ENGINE (GO WASM)\nTurn: %d | Status: %s", g.turn, g.statusMsg))
}

func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return ScreenWidth, ScreenHeight
}

func main() {
	game := NewGame()
	ebiten.SetWindowSize(ScreenWidth, ScreenHeight)
	ebiten.SetWindowTitle("Newtype 2D Engine")
	if err := ebiten.RunGame(game); err != nil {
		log.Fatal(err)
	}
}
