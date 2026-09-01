import Elysia from "elysia";
import { NOTION_OAUTH_ROUTES } from "./notion.oauth.routes";

export function startNotionOAuthCallbackServer(port: number) {
  return new Elysia({ prefix: "/api" }).use(NOTION_OAUTH_ROUTES).listen(port);
}
