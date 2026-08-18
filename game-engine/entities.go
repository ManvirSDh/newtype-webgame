package main

import (
	"image/color"
)

type Player struct {
	health    int
	units     []Unit
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
