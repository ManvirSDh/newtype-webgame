#   newtype
Time Travel / Teleporting Robot, Turnbased Strategy, 1v1 blitz sort of game (and a testris-like race mode)

Using AWS S3 w/ Cloudfront to deploy a TypeScript Angular Frontend, and AWS Serverless for a Java backend for matchmaking

Users connect to backend with websockets, and play a turnbased game where every turn is very short, with multiple units for each player, but units will repeat their last action if their action isn't changed. Idea is that you can only make x amount of choices but have c>0, f(x) = cx different decisions presented.
Units can teleport or move back in time for something


# FRONTEND
Angular TS
Gets Lobby List from Server
Get List of Users from Server
Post and add a open lobby to server when creating a room
Create connection to game host
PlayGame

# BACKEND
Serverless, using AWS Lambda
Functions written in Java
Used only to populate a user list and lobby list, and to match users for their P2P game

# GAME
Grid based strategy game where each decision is very simple but you have to make multiple decisions
Units can warp and change age
Younger units are stronger
Game is built around getting your units to the spots that lower units age, and direct them away from spots that increase units age
Units attack with psychic abilities
Think Childhood's End themed
Hex grid?


# TODO

Backend:
    Figure out how Lambda Java functions work (how to get them to execute on api call)
    Write hello world for serverless Lambda
    setup database that contains connected users
    figure out if websockets can work in a lambda serverless setup
    write functions that add user to database when they connect to server, and remove them when they disconnect
    get active users
    post room
    get rooms
    connect clients in a room directly
Frontend:
Game:
