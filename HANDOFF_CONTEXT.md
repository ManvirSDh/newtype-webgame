# HANDOFF_CONTEXT.md - Newtype Webgame Session State & Handoff Brief

## Project Overview
- **Repository**: `newtype-webgame`
- **GitHub URL**: `https://github.com/ManvirSDh/newtype-webgame.git`
- **Branch**: `main` (clean working tree, fully committed and pushed)
- **Concept**: Time travel / teleporting unit, turn-based strategy 1v1 blitz game.

---

## 1. Live Infrastructure & Live URLs

### Frontend Deployment
- **S3 Bucket Name**: `newtype-webgame-frontend` (Region: `ca-central-1`)
- **Live S3 Website URL**: [http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com](http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com)
- **Direct Page URLs**:
  - Login Page: [http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com/login](http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com/login)
  - Lobby Page: [http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com/lobby](http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com/lobby)
  - Game Page: [http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com/game](http://newtype-webgame-frontend.s3-website.ca-central-1.amazonaws.com/game)

### Backend Deployment (AWS API Gateway WebSockets + Java Lambda)
- **Region**: `ca-central-1`
- **Live WebSocket URL**: `wss://bss7xlzqhe.execute-api.ca-central-1.amazonaws.com/dev`
- **DynamoDB Tables**:
  - `newtype-backend-connections-dev`
  - `newtype-backend-lobbies-dev`

---

## 2. Codebase Architecture & Current Progress

### Frontend (`/frontend`)
- **Framework**: Angular 17+ (Standalone components, SCSS, RxJS, Angular Router)
- **Routes & Views**:
  - `LoginComponent` (`/login`): Commander Codename entry and local identity persistence.
  - `LobbyComponent` (`/lobby`): Real-time lobby list container, room creation, joining, and closing via WebSocket. (Socket connects only when entering `/lobby`).
  - `GameComponent` (`/game`): 3-Segment 9:16 layout featuring:
    - **Left Container**: Lobby Controls placeholders, Users list, Disconnect button.
    - **Center Container**: Game canvas container and live WebRTC status bar.
    - **Right Container**: Peer-to-Peer Chat app operating over direct WebRTC `RTCDataChannel`. Disconnects from central WebSocket server once P2P connects.
- **Build Command**: `cd frontend && npm run build` (outputs to `dist/frontend/browser`).

### Backend (`/backend`)
- **Runtime**: Java 17 + AWS Lambda + API Gateway WebSockets + Serverless Framework.
- **Handlers**:
  - `WebSocketHandler.java`: Handles `$connect` and `$disconnect` WebSocket connections, cleaning up associated DynamoDB lobbies upon disconnect.
  - `LobbyHandler.java`: Handles `createLobby`, `joinLobby`, `closeLobby`, and `getLobbies`, broadcasting updates in real time.
  - `SignalingHandler.java`: Relays WebRTC SDP offers, answers, and ICE candidates between peers via `sendSignal`.
- **Packaging & Deployment Command**: `cd backend && mvn clean package && serverless deploy`.

---

## 3. Environment & Credentials Configuration

- **Secret File**: `.env` (Ignored by Git, present locally).
- **Template File**: `.env.example` (Committed to Git).
- **Required Keys**:
  ```env
  AWS_REGION=ca-central-1
  AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
  AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
  S3_BUCKET_NAME=newtype-webgame-frontend
  CLOUDFRONT_DISTRIBUTION_ID=<OPTIONAL>
  DYNAMODB_TABLE_PREFIX=newtype
  ```
