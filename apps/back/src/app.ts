import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { relative, resolve, sep } from "node:path";
import { AGENT_RUNS_ROUTES } from "./agent-runs/agent-runs.routes";
import { environment } from "./environment";
import { GIT_ROUTES } from "./git/git.routes";
import { NOTION_ROUTES } from "./notion/notion.routes";
import { SETTINGS_ROUTES } from "./settings/settings.routes";

const API_ROUTES = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(AGENT_RUNS_ROUTES)
  .use(GIT_ROUTES)
  .use(NOTION_ROUTES)
  .use(SETTINGS_ROUTES)
  .get("/health", () => ({ status: "ok" as const }));

export const app = new Elysia()
  .use(API_ROUTES)
  .get("/", () => getWebFile("index.html"))
  .get("/embed.js", () => getWebFile("embed.js"))
  .get("/assets/*", ({ params }) => getWebFile(`assets/${params["*"]}`));

export type App = typeof app;

function getWebFile(relativePath: string) {
  const webRoot = environment.webRoot;
  if (!webRoot) {
    return new Response("Regalator web assets are not configured.", {
      status: 404,
    });
  }

  const filePath = resolve(webRoot, relativePath);
  const pathFromRoot = relative(webRoot, filePath);
  if (pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`)) {
    return new Response("Not found.", { status: 404 });
  }

  return Bun.file(filePath);
}
