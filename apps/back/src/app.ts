import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { AGENT_RUNS_ROUTES } from "./agent-runs/agent-runs.routes";
import { GIT_ROUTES } from "./git/git.routes";
import { NOTION_ROUTES } from "./notion/notion.routes";
import { SETTINGS_ROUTES } from "./settings/settings.routes";

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(AGENT_RUNS_ROUTES)
  .use(GIT_ROUTES)
  .use(NOTION_ROUTES)
  .use(SETTINGS_ROUTES)
  .get("/health", () => ({ status: "ok" as const }));

export type App = typeof app;
