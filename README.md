# Quick Draw MVP

This bundle contains the Quick Draw MVP web client and the Colyseus-powered multiplayer server.

## Getting started

1. Install dependencies with `pnpm install`.
2. Start the multiplayer server with `pnpm run dev:server` (listens on `http://localhost:2567` by default).
3. In a separate terminal, run `pnpm run dev` to launch the Vite dev server.

Set `VITE_SERVER_URL` in your environment if you need the client to talk to a different Colyseus endpoint.
