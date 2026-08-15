# Newtype Game Engine (Go + Ebitengine)

This directory contains the 2D game engine written in Go using [Ebitengine](https://ebiten.org/).

## Prerequisites
- [Go 1.21+](https://go.dev/doc/install)

## Building for WebAssembly (Wasm)

To compile the Go game engine into WebAssembly for browser execution:

```bash
GOOS=js GOARCH=wasm go build -o ../frontend/src/assets/game.wasm main.go
```

## Local Desktop Testing

You can also run and debug the game engine locally as a native desktop app:

```bash
go run main.go
```

## JavaScript / WebAssembly Bridge API

The Go engine exposes global JavaScript functions via `syscall/js`:

- `window.onNetworkSignal(jsonStr)`: Call from JavaScript to pass opponent P2P WebRTC data into Go.
- `window.sendP2PMessage(jsonStr)`: Provided by JavaScript for Go to send local player movements over WebRTC.
