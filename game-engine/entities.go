package main

import (
	"image/color"
)

type Player struct {
	health    int
	units     []*Unit
	resources int
	commander string
}

type Unit struct {
	X        float32
	Y        float32
	Health   int
	Attack   int
	Defense  int
	MoveFreq int
	Type     string
	Owner    *Player
	Color    color.RGBA
}

func generateUnit() Unit {
	return Unit{
		X:        0.0,
		Y:        0.0,
		Health:   10,
		Attack:   3,
		Defense:  2,
		MoveFreq: 3,
		Type:     "default",
		Owner:    nil,
		Color:    color.RGBA{R: 180, G: 180, B: 180, A: 255},
	}
}
