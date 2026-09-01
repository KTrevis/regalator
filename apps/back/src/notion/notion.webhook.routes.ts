import Elysia, { t } from "elysia";
import { startNotionAgentRun } from "./startNotionAgentRun";

export const NOTION_WEBHOOK_ROUTES = new Elysia({ prefix: "/notion" }).post(
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
