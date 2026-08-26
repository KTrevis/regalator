# Remote Kanban

Monorepo Bun/Turbo pensé pour une base long terme :

- `apps/front` : React, Vite, Tailwind CSS, TanStack Router, TanStack Query et client Eden.
- `apps/back` : API Elysia.
- `packages/shared` : types et utilitaires métier partagés.
- `packages/typescript-config` : configurations TypeScript strictes communes.

## Types API safe

Le back exporte uniquement `@remote-kanban/back/type`, qui pointe vers les déclarations de l'API et un runtime vide. Le client situé dans `apps/front/src/lib/eden.ts` importe uniquement `type { App }` pour Eden : le bundle front ne contient pas le code serveur.

## Développement avec Caddy

Prérequis : Bun et Docker.

```sh
bun install
cp apps/back/.env.example apps/back/.env.local
# Renseigner REPOSITORY_PATH avec un chemin absolu dans apps/back/.env.local
bun run dev
```

Cette commande démarre Caddy dans Docker, puis les applications avec Turbo :

- Remote Kanban via Caddy : <http://embed.localhost>
- Site hôte simulant l'intégration : <http://host.localhost>
- Front Vite direct : <http://localhost:5173>
- API Elysia directe : <http://localhost:3000>

Caddy route `/api/*` vers Elysia et le reste vers Vite. Le client Eden utilise l'origine courante par défaut : aucune variable d'environnement n'est nécessaire avec Caddy.

Le site hôte charge le script d'intégration minimal :

```html
<script async src="http://embed.localhost/embed.js"></script>
```

Le script crée une iframe de la taille du badge, puis l'agrandit à la taille de l'écran pendant l'ouverture du drawer.

Pour arrêter Caddy :

```sh
bun run dev:down
```

Pour lancer les applications sans Caddy :

```sh
bun run dev:apps
```

Si le port 80 est occupé, créer `.env` à partir de `.env.example` et choisir un autre port :

```env
CADDY_HTTP_PORT=8080
```

L'application sera alors accessible sur `http://embed.localhost:8080`.

## Configuration de l'API côté front

Pour appeler exceptionnellement une autre origine, créer `apps/front/.env.local` :

```env
VITE_API_URL=http://localhost:3000
```

Les variables `VITE_*` sont publiques et injectées au build : elles ne doivent contenir aucun secret.

## Vérifications

```sh
bun run check-types
bun run build
```
