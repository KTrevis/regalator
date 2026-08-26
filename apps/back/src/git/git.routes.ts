import { Elysia } from "elysia";
import { refreshBranches } from "../utils/git/refreshBranches";
import { CONFIG } from "../config";

export const GIT_ROUTES = new Elysia({ prefix: "/git" }).get(
  "/branches",
  async () => ({
    branches: await refreshBranches(CONFIG.repoPath),
  }),
);
