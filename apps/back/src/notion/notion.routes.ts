import Elysia from "elysia";
import {
  fetchNotionAccessToken,
  getNotionTokenPath,
  NotionOAuthError,
} from "./notion.oauth";
import type { NotionAutomationPageWebhookBody } from "./notion.webhook.types";
import { getPageTitle } from "./notion.title";
import { getPageDescription } from "./notion.page-description";

export const NOTION_ROUTES = new Elysia({ prefix: "/notion" })
  .get("/oauth/callback", async ({ query, set }) => {
    const code = typeof query["code"] === "string" ? query["code"] : undefined;

    if (!code) {
      set.status = 400;
      return { error: "Missing Notion OAuth code" };
    }

    try {
      const accessToken = await fetchNotionAccessToken(code);

      return {
        accessToken,
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
  .post("/webhook", async ({ body }) => {
    const webhookBody = body as NotionAutomationPageWebhookBody;
    const pageId = webhookBody.data.id;
    const title = await getPageTitle(pageId);
    const description = await getPageDescription(pageId);
    console.log({ title, description });
  });
