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
	GridWidth           = 15
	GridHeight          = 12
	MaxHealth           = 255
	TurnLengthInSeconds = 5.0
)

type Cell struct {
	isResourceArea bool
	unitInside     *Unit
	isAttackRange  bool
}

type Game struct {
	player           Player
	enemy            Player
	turnNumber       int
	turnNumberString string
	timeAtLastTurn   time.Time
	statusMsg        string
	grid             [GridWidth][GridHeight]Cell
	lastTime         time.Time
	timeAcc          float64
}

func NewGame() *Game {
	var grid [GridWidth][GridHeight]Cell

	g := &Game{
		player:           Player{health: MaxHealth, units: []*Unit{}, resources: 3, commander: "test"},
		enemy:            Player{health: MaxHealth, units: []*Unit{}, resources: 3, commander: "test"},
		turnNumber:       1,
		turnNumberString: "Turn 1",
		statusMsg:        "Ready - Touch/Click to Move",
		grid:             grid,
		lastTime:         time.Now(),
		timeAcc:          0.0,
	}
	// g.registerJSCallbacks()
	return g
}

func (g *Game) Update() error {

	// delta time
	if g.lastTime.IsZero() {
		g.lastTime = time.Now()
		return nil
	}
	now := time.Now()
	dt := now.Sub(g.lastTime).Seconds()
	g.timeAcc += dt
	g.lastTime = now

	// TURN TICK
	if g.timeAcc >= TurnLengthInSeconds {
		g.timeAcc -= TurnLengthInSeconds
		g.turnNumber += 1
		g.turnNumberString = fmt.Sprintf("Turn %d", g.turnNumber)
	}

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
