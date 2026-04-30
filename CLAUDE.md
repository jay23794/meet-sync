# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (runs all services via Turbo)
```bash
npm run dev      # Start all services in watch mode
npm run build    # Build all packages in dependency order
```

### Per-app (run from the app directory)
```bash
npm run dev      # Watch mode (tsx watch for api/signaling, vite for web)
npm run build    # Compile (tsc for api/signaling, tsc + vite build for web)
```

### Installing dependencies
```bash
npm install <pkg> --workspace=apps/api        # Add to a specific app
npm install <pkg> --workspace=apps/signaling
npm install <pkg> --workspace=apps/web
npm install <pkg> --save-dev                   # Root-level dev tool
```

No test runner is configured in this project.

## Architecture

Three-service architecture + one shared types package:

- **`apps/api`** — Express REST API (port 3001). JWT-based guest auth (`POST /api/auth/guest`, `POST /api/auth/refresh`) backed by MongoDB via Mongoose. Swagger docs at `/api-docs`. Uses `@videochat/shared` types.
- **`apps/signaling`** — Socket.io WebRTC signaling server (port 3002). Manages in-memory peer/room state via Maps. Emits `PEER_DISCONNECTED` when users leave. Redis integration is planned (noted in comments).
- **`apps/web`** — React + Vite SPA (port 5173). Chakra UI with a retro pixel-art theme (`apps/web/src/theme.ts`). Auth feature in `src/features/auth/`; chat/WebRTC in `src/features/chat/`. Uses `@videochat/shared` types.
- **`packages/shared`** — TypeScript types and socket event constants only; no runtime dependencies. Defines all socket events, WebRTC payload interfaces, auth shapes, and `ApiResponse<T>`.

### How services connect
- Web calls `api:3001/api/auth/guest` (or `/refresh`) to obtain a JWT guest session
- Web connects via Socket.io to `signaling:3002` — the JWT token is passed in `socket.auth.token`
- Web polls `api:3001/health` for connectivity checks
- All socket event names and payload types are defined in `packages/shared/src/index.ts`

### Auth flow
1. Web calls `POST /api/auth/guest` → API mints a JWT (`GuestTokenPayload`) signed with `JWT_SECRET`, stores guest record in MongoDB, returns `GuestAuthResponse` (token, guestId, name, avatar seed)
2. Guest session is kept in React state (`GuestSession`); avatar seed is fed to DiceBear pixel-art API
3. Signaling server validates the Bearer token on every socket connection via `authMiddleware`

### WebRTC signaling flow (in `useChat.ts`)
1. Client emits `JOIN_QUEUE` → server pairs two waiting sockets, assigns one as `caller`, one as `callee`
2. Caller creates an SDP offer → server relays to callee
3. Callee creates an SDP answer → server relays to caller
4. Both sides exchange ICE candidates through the server (pure relay)
5. `SKIP` tears down the room and re-queues the skipper; `PEER_DISCONNECTED` triggers auto-rejoin on the client

### Build order
Turbo ensures `shared` builds before `api`/`signaling`/`web` (via `dependsOn: ["^build"]`).

## Key conventions
- All packages use the `@videochat/*` namespace
- Ports and cross-origin URLs are configured via environment variables (`PORT`, `WEB_URL`)
- Web env vars use Vite prefix: `VITE_API_URL`, `VITE_SIGNALING_URL`
- API and signaling servers compile to CommonJS (`dist/`); web is bundled by Vite
- All TypeScript configs extend `tsconfig.base.json` (strict mode, ES2020, bundler resolution)
- API follows a feature-folder pattern: `features/<name>/` contains controller, service, repository, routes, and model

## Required environment variables

| Service    | Variable        | Default / Notes |
|------------|----------------|-----------------|
| api        | `JWT_SECRET`   | `dev_secret_change_in_production` |
| api        | `MONGO_URI`    | `mongodb://localhost:27017/videochat` |
| api        | `WEB_URL`      | CORS origin (`true` = allow all) |
| signaling  | `WEB_URL`      | CORS origin |
| web        | `VITE_API_URL` | Set in `.env` or `.env.production` |
| web        | `VITE_SIGNALING_URL` | Set in `.env` or `.env.production` |
