import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { GIT_ROUTES } from "./git/git.routes";
import { NOTION_ROUTES } from "./notion/notion.routes";

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(GIT_ROUTES)
  .use(NOTION_ROUTES)
  .get("/health", () => ({ status: "ok" as const }));

export type App = typeof app;
