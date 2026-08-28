import { SWITCH_BRANCH_SCHEMA } from "@regalator/shared";
import { Elysia } from "elysia";
import { CONFIG } from "../config";
import {
  pullManagedProjectBranch,
  switchManagedProjectBranch,
} from "../managed-project/managed-project.service";
import { getBranches } from "../utils/git/getBranches";

export const GIT_ROUTES = new Elysia({ prefix: "/git" })
  .get("/branches", async () => ({
    branches: await getBranches(CONFIG.repoPath),
  }))
  .post("/branch/pull", async () => ({
    branch: await pullManagedProjectBranch(),
  }))
  .post(
    "/branch/switch",
    async ({ body }) => {
      await switchManagedProjectBranch(body.branch);

      return {
        branch: body.branch,
      };
    },
    {
      body: SWITCH_BRANCH_SCHEMA,
    },
  );
