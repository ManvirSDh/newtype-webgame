package main

import (
	"fmt"
	"image/color"
	"math/rand"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
)

const (
	GridWidth  = 13
	GridHeight = 13
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
	timeAtLastTurn time.Time
	statusMsg      string
	grid           [GridWidth][GridHeight]Cell
}

func NewGame() *Game {
	var grid [GridWidth][GridHeight]Cell

	g := &Game{
		player:         Player{health: 20, units: []*Unit{}, resources: 3, commander: "test"},
		enemy:          Player{health: 20, units: []*Unit{}, resources: 3, commander: "test"},
		turnNumber:     1,
		turnTimer:      1,
		timeAtLastTurn: time.Now(),
		statusMsg:      "Ready - Touch/Click to Move",
		grid:           grid,
	}
	// g.registerJSCallbacks()
	return g
}

func (g *Game) Update() error {
	// Handle Touch or Click input
	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) {
		cx, cy := ebiten.CursorPosition()
		tempTime := time.Now()
		timeElapsed := tempTime.Sub(g.timeAtLastTurn)
		g.statusMsg = fmt.Sprintf("Moved Unit to (%d, %d), time elapsed is %s", cx, cy, timeElapsed.String())
		g.timeAtLastTurn = tempTime
		g.turnNumber += 1
		// g.notifyJSStateChange()
	}
	if inpututil.IsKeyJustPressed(ebiten.KeySpace) {
		var temp Unit = generateUnit()
		temp.X = rand.Float32() * 360
		temp.Y = rand.Float32() * 640
		temp.Color = color.RGBA{R: uint8(rand.Intn(255)), G: uint8(rand.Intn(255)), B: uint8(rand.Intn(255)), A: uint8(rand.Intn(255))}
		g.player.units = append(g.player.units, &temp)
	}
	return nil
}
