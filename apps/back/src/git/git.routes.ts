import { switchBranchSchema } from "@remote-kanban/shared";
import { Elysia } from "elysia";
import { CONFIG } from "../config";
import { refreshBranches } from "../utils/git/refreshBranches";
import { switchBranch } from "../utils/git/switchBranch";

export const GIT_ROUTES = new Elysia({ prefix: "/git" })
  .get("/branches", async () => ({
    branches: await refreshBranches(CONFIG.repoPath),
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
      body: switchBranchSchema,
    },
  );
