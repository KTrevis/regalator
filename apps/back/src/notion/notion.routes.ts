import Elysia from "elysia";
import { NOTION_OAUTH_ROUTES } from "./notion.oauth.routes";
import { NOTION_WEBHOOK_ROUTES } from "./notion.webhook.routes";

export const NOTION_ROUTES = new Elysia()
  .use(NOTION_OAUTH_ROUTES)
  .use(NOTION_WEBHOOK_ROUTES);
