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

No test runner is configured in this project.

## Architecture

Three-service architecture + one shared types package:

- **`apps/api`** — Express REST API (port 3001). Currently minimal: `/health` endpoint only. Uses `@videochat/shared` types.
- **`apps/signaling`** — Socket.io WebRTC signaling server (port 3002). Manages in-memory peer/room state via Maps. Emits `PEER_DISCONNECTED` when users leave. Redis integration is planned (noted in comments).
- **`apps/web`** — React + Vite SPA (port 5173). Connects to both the API (health check) and signaling server (Socket.io client). Uses `@videochat/shared` types.
- **`packages/shared`** — TypeScript types and socket event constants only; no runtime dependencies. Defines all socket events, WebRTC payload interfaces, and `ApiResponse<T>`.

### How services connect
- Web polls `api:3001/health` to verify connectivity
- Web connects via Socket.io to `signaling:3002` for WebRTC peer matching
- All socket event names and payload types are defined in `packages/shared/src/index.ts`

### Build order
Turbo ensures `shared` builds before `api`/`signaling`/`web` (via `dependsOn: ["^build"]`).

## Key conventions
- All packages use the `@videochat/*` namespace
- Ports and cross-origin URLs are configured via environment variables (`PORT`, `WEB_URL`)
- API and signaling servers compile to CommonJS (`dist/`); web is bundled by Vite
- All TypeScript configs extend `tsconfig.base.json` (strict mode, ES2020, bundler resolution)
