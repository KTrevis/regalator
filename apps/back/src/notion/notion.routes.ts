import Elysia, { t } from "elysia";
import {
  getNotionTokenPath,
  NotionOAuthError,
  storeNotionAccessToken,
} from "./notion.oauth";
import { startNotionAgentRun } from "./startNotionAgentRun";

export const NOTION_ROUTES = new Elysia({ prefix: "/notion" })
  .get("/oauth/callback", async ({ query, set }) => {
    const code = typeof query["code"] === "string" ? query["code"] : undefined;

    if (!code) {
      set.status = 400;
      return { error: "Missing Notion OAuth code" };
    }

    try {
      await storeNotionAccessToken(code);

      return {
        tokenPath: getNotionTokenPath(),
      };
    } catch (error) {
      set.status = error instanceof NotionOAuthError ? error.status : 500;

      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Notion API key",
      };
    }
  })
  .post(
    "/webhook",
    async ({ body, set }) => {
      set.status = 202;

      return startNotionAgentRun(body);
    },
    {
      body: t.Object({
        data: t.Object({
          id: t.String({ minLength: 1 }),
          url: t.String({ minLength: 1 }),
        }),
      }),
    },
  );
