GOOS=js GOARCH=wasm go build -o main.wasm main.go
cp main.wasm ../frontend/src/assets/game.wasm
