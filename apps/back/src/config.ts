import { resolve } from "node:path";

const projectPath = Bun.env["REGALATOR_PROJECT_PATH"];

if (!projectPath) {
  throw new Error("REGALATOR_PROJECT_PATH is required.");
}

export const CONFIG = {
  repoPath: resolve(projectPath),
  worktreesPath: resolve(
    Bun.env["REGALATOR_WORKTREES_PATH"] ?? `${projectPath}-worktrees`,
  ),
  defaultBaseBranch: "main",
} as const;
