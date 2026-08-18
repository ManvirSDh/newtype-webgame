package main

import (
	"fmt"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
)

const (
	GridWidth  = 12
	GridHeight = 20
)

type Cell struct {
	isResourceArea bool
	unitInside     *Unit
	isAttackRange  bool
}

type Game struct {
	player         Player
	enemy          Player
	turnNumber     int
	turnTimer      int
	timeAtLastTurn time
	statusMsg      string
	grid           [GridWidth][GridHeight]Cell
}

func NewGame() *Game {
	var grid [GridWidth][GridHeight]Cell

	g := &Game{
		player:     Player{health: 20, units: []Unit{}, resources: 3, commander: "test"},
		enemy:      Player{health: 20, units: []Unit{}, resources: 3, commander: "test"},
		turnNumber: 1,
		statusMsg:  "Ready - Touch/Click to Move",
		grid:       grid,
	}
	// g.registerJSCallbacks()
	return g
}

func (g *Game) Update() error {
	// Handle Touch or Click input
	if ebiten.IsMouseButtonPressed(ebiten.MouseButtonLeft) {
		cx, cy := ebiten.CursorPosition()
		g.playerUnit.X = float32(cx)
		g.playerUnit.Y = float32(cy)
		g.statusMsg = fmt.Sprintf("Moved Unit to (%d, %d)", cx, cy)
		// g.notifyJSStateChange()
	}
	return nil
}
