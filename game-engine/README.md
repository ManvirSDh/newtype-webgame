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

You can also test just the game in WebASM by using the test index.html and serving the dir using goexec

```bash
goexec 'http.ListenAndServe(`:8080`, http.FileServer(http.Dir(`.`)))'
```

## JavaScript / WebAssembly Bridge API

The Go engine exposes global JavaScript functions via `syscall/js`:

- `window.onNetworkSignal(jsonStr)`: Call from JavaScript to pass opponent P2P WebRTC data into Go.
- `window.sendP2PMessage(jsonStr)`: Provided by JavaScript for Go to send local player movements over WebRTC.

## Notes for self
try to compile with tinyGo or compress with brotli (serve with https://github.com/lpar/gzipped)


## GAME DESIGN NOTES

# GAME
- Grid based strategy game where each decision is very simple but you have to make multiple decisions

- GAME LAYOUT:
    - SCREEN LAYOUT:
        - Leave some space at bottom of screen for actions like spawning units or activating commander abilities
        - Leave a strip at top of screen for mobile controls like lobby settings or chat room
        - GRID SIZE: ~12 WIDE, ~20 Tall
            - Hex grid?
            - Need space for multiple skirmishes at once:
            - Horizontally, need space for atleast 3 side by side
            - Shortest distance from left to right = 12 MOVE
    - Units spawn on your end of the board, in the path of enemy units
    
    - RESOURCE SPOTS:
        - Parking your units in certain locations will give you extra resources
        - 


- GAME LOOP / UPDATE LOGIC:
    - GAME MODES:
        - Auto-move mode (Tetris-like):
            - Every X seconds, the game state will move to the next turn. The players must direct their units and use their abilities while prioritizing across the game board. The player will not be able to control every single minutae of the game due to time constraints.
        - Limited action mode (Chess-like):
            - Players can only make X amount of actions per turn. An action is defined as changing the direction of a unit, spawning a new unit, or using a commander ability, or using any other abilities unless other specified.
            - Chess timer submode, where you still have to compete against the opponent on speed of execution
    - TURN LOGIC:
        - Units move if able and directed (will continue to move in previously directed direction if no specific action)
        - Units battle any adjacent or competing units
        - Units take damage from any atk ranges they are in
        - Units damage the enemy player if possible (if on opponent's side of the field, or if atk range extends past the play field)
        - Resource increases by X + Y, X = universal rate, Y = # units in resource fields
        
    - RESOURCE:
        - Automatically increases every turn by X
            - X increases over time (every 10 turns?)
        - Increases by additional Y for every unit in a resource zone
        - Can be used to spawn new units, or to use commander abilities
        - Theming?
            - Fetus symbol? Don't name it bc it's gross, but the idea is that children / fetuses are experimented on and the more test subjects, the greater a warrior you can create 
            - Time anomaly that creates genetic clones of the unit in the area, but as a fetus that gets sent back to the lab
            - Name = Test Subjects
    - COMMANDER ABILITIES
        - Choose commander at start of game, dictates which commander ability you have access top
        - 3 abilities, with increasing costs and effects
        - First ability upgrades a unit in some way (stacks?)
        - Second ability is an instant damage spell or similar
        - Highest cost ability affects core mechanics for both players
    - UNIT COMBAT
        - Two units that are adjacent or attempting to occupy the same tile will combat
            - HEALTH -= OppAtk - UnitDef
        - Certain units will have unique battle ranges - any enemy in this range will take damage

- UNIT DESIGN:
    - Stats are transparent, and simple - think Fire Emblem
    - THEMING:
        - Units can warp and change age - Younger units are stronger
        - Units attack with psychic abilities?
        - Think Childhood's End themed, or Cyber Newtypes
    - Unit Ideas
        - Core units
            - OLD
                - Slow, high health
                - Low attack, medium-high defense
                - 2 tile attack range
                - Cheapest
            - ADULT
                - Medium speed, medium health
                - Medium attack, medium defense
                - 2 tile attack range
                - Has a one-time use ability to blow up, does damage to enemies in range, and refunds part of the unit depending on health left
                - Cheap
            - CHILD
                - Fast, lower health
                - High attack, low defense
                - 3 tile attack range
                - Has a one-time use ability to blow up, does damage to enemies in range, and refunds part of the unit depending on health left
                - Pricy
            - FETUS (hidden until enough resources have been acquired)
                - Fast, high health
                - High attack, high defense
                - 4 tile attack range
                - Takes double damage from adjacent enemies
                - Regenerates health
                - Has an player activated ability to warp to a random space within 6 tiles - fetus does some damage, disappears for 5 turns then reappears in random spot
                - Auto tracks to closest enemy
                    - Auto mode: cannot control direction
                    - Chess mode: changing direction does not count as an action
                - Very expensive
                

## IMPLEMENTATION PLANNING
- Game Object:
    - Grid Layout Object, 2D array of Cells <Cell[][]>
    - Player Object <Player>
    - Opponent Object <Player>
    - Turn Count <int>
- Cell Object:
    - Is cell a resource area? <Bool>
    - Pointer to unit that is inside. <Unit*>
- Player Object:
    - List of Units: <Unit[]>
    - Resource Count: <int>
    - Commander Type: <String>
- Unit Object:
    - Health: <int>
    - Atk: <int>
    - Def: <int>
    - Walk_freq: <int>
    - Type: <String>
    - Pointer to Owner: <Player*>
    - Position: <tuple(int, int)>

    
- LAYOUT
- DRAWING
    - Strip at top for game options (leave game, etc.)
    - Main game screen
        - Draw hex grid (regular tiles vs resource tile)
        - Draw player units
            - Draw sprites
            - Draw health bar below sprite
        - Draw any effects for animations or the like
        - Draw any effects for window dressing
    - Command strip at bottom
        - Health bar
        - Two buttons that say "Spawn Unit" or "Command Options"
            - If you click spawn unit, will replace with cards with the available units to spawn
            - If you click command options, will replace with cards with the available command options
            - If you click on a unit, will give you direction options and (if available) a unit ability
            
        
- UPDATE
    - In auto mode, every X seconds, run the turn update loop
    - In chess mode, run the turn loop if both players are ready
    - Turn update loop:
        - Any animations are <1/4s and don't actually delay user actions / turn timer
        - Units battle any adjacent or competing units
            - Units clash with each other and bump off
            - Shows damage taken
        - Units move if able and directed (will continue to move in previously directed direction if no specific action)
            - Play movement animation (smooth translate?)
        - Units take damage from any atk ranges they are in
            - Attack range flashes and unit taking damage has a small damage animation
            - Shows damage taken
        - Units damage the enemy player if possible (if on opponent's side of the field, or if atk range extends past the play field)
            - Attack ranges flash and you can see the health bar tick down, end of field flashes
            - Shows damage taken
        - Resource increases by X + Y, X = universal rate, Y = # units in resource fields
            - No animation
        
    - Monitor mouse clicks and run corresponding action depending on user's clicks
