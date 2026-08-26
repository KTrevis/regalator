# Remote Kanban

A Bun/Turbo monorepo designed as a long-term foundation:

- `apps/front`: React, Vite, Tailwind CSS, TanStack Router, TanStack Query, and the Eden client.
- `apps/back`: Elysia API.
- `packages/shared`: shared schemas, types, and domain utilities.
- `packages/typescript-config`: shared strict TypeScript configurations.

## Safe API types

The back end only exports `@remote-kanban/back/type`, which points to the API declarations and an empty runtime module. The client in `apps/front/src/lib/eden.ts` only imports `type { App }` for Eden, so the front-end bundle does not contain server code.

## Development with Caddy

Requirements: Bun and Docker.

```sh
bun install
bun run dev
```

This starts Caddy in Docker and then runs the applications with Turbo:

- Remote Kanban through Caddy: <http://embed.localhost>
- Host site integration sandbox: <http://host.localhost>
- Direct Vite front end: <http://localhost:5173>
- Direct Elysia API: <http://localhost:3000>

Caddy routes `/api/*` to Elysia and all other requests to Vite. The Eden client uses the current origin by default, so no environment variable is required when using Caddy.

The host site loads the minimal integration script:

```html
<script async src="http://embed.localhost/embed.js"></script>
```

The script creates a badge-sized iframe and expands it to fill the viewport while the drawer is open.

Stop Caddy with:

```sh
bun run dev:down
```

Run the applications without Caddy with:

```sh
bun run dev:apps
```

If port 80 is already in use, copy `.env.example` to `.env` and select another port:

```env
CADDY_HTTP_PORT=8080
```

The application will then be available at `http://embed.localhost:8080`.

## Front-end API configuration

To call an API on another origin, create `apps/front/.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

`VITE_*` variables are public and embedded at build time. Never store secrets in them.

## Verification

```sh
bun run check-types
bun run build
```
