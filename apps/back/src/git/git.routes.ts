import { SWITCH_BRANCH_SCHEMA } from "@remote-kanban/shared";
import { Elysia } from "elysia";
import { CONFIG } from "../config";
import { getBranches } from "../utils/git/getBranches";
import { switchBranch } from "../utils/git/switchBranch";

export const GIT_ROUTES = new Elysia({ prefix: "/git" })
  .get("/branches", async () => ({
    branches: await getBranches(CONFIG.repoPath),
  }))
  .post(
    "/branch/switch",
    async ({ body }) => {
      await switchBranch(CONFIG.repoPath, body.branch);

      return {
        branch: body.branch,
      };
    },
    {
      body: SWITCH_BRANCH_SCHEMA,
    },
  );
