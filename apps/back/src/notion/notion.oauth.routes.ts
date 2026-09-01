import Elysia from "elysia";
import {
  exchangeNotionOAuthCode,
  finishNotionOAuthResponse,
  NotionOAuthError,
} from "./notion.oauth";

export const NOTION_OAUTH_ROUTES = new Elysia({ prefix: "/notion" })
  .onAfterResponse(finishNotionOAuthResponse)
  .get("/oauth/callback", async ({ query, set }) => {
    const code = typeof query["code"] === "string" ? query["code"] : undefined;
    const state =
      typeof query["state"] === "string" ? query["state"] : undefined;

    if (!code || !state) {
      set.status = 400;
      return { error: "Missing Notion OAuth code or state." };
    }

    try {
      await exchangeNotionOAuthCode(code, state);

      return new Response(
        "<h1>Notion authorization completed</h1><p>You can close this tab.</p>",
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    } catch (error) {
      set.status = error instanceof NotionOAuthError ? error.status : 500;

      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to authorize Notion.",
      };
    }
  });
