package main

import (
	// "encoding/json"

	"log"

	// "syscall/js"

	"github.com/hajimehoshi/ebiten/v2"
)

const (
	ScreenWidth  = 360
	ScreenHeight = 640
)

// func (g *Game) registerJSCallbacks() {
// 	// Register JS function window.onNetworkSignal(jsonStr)
// 	js.Global().Set("onNetworkSignal", js.FuncOf(func(this js.Value, args []js.Value) any {
// 		if len(args) > 0 {
// 			rawJson := args[0].String()
// 			var data map[string]interface{}
// 			if err := json.Unmarshal([]byte(rawJson), &data); err == nil {
// 				if msg, ok := data["status"].(string); ok {
// 					g.statusMsg = msg
// 				}
// 			}
// 		}
// 		return nil
// 	}))
// }

// func (g *Game) notifyJSStateChange() {
// 	// Broadcast state change to JavaScript WebRTC channel if available
// 	sendFn := js.Global().Get("sendP2PMessage")
// 	if sendFn.Type() == js.TypeFunction {
// 		payload := fmt.Sprintf(`{"type":"UNIT_MOVE","x":%.1f,"y":%.1f}`, g.playerUnit.X, g.playerUnit.Y)
// 		sendFn.Invoke(payload)
// 	}
// }

func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return ScreenWidth, ScreenHeight
}

func main() {
	game := NewGame()
	ebiten.SetWindowSize(ScreenWidth, ScreenHeight)
	ebiten.SetWindowTitle("Newtype Game")
	if err := ebiten.RunGame(game); err != nil {
		log.Fatal(err)
	}
}
