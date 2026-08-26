import { Elysia, t } from "elysia";
import { getSettings, updateDefaultBaseBranch } from "./settings.service";

export const SETTINGS_ROUTES = new Elysia({ prefix: "/settings" })
  .get("/", getSettings)
  .put("/", ({ body }) => updateDefaultBaseBranch(body.defaultBaseBranch), {
    body: t.Object({ defaultBaseBranch: t.String({ minLength: 1 }) }),
  });
