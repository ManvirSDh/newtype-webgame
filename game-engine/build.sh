GOOS=js GOARCH=wasm go build -x -o main.wasm .
cp main.wasm ../frontend/src/assets/game.wasm
