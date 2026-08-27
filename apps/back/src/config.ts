import { resolve } from "node:path";

const projectPath = Bun.env["REMOTE_KANBAN_PROJECT_PATH"];

if (!projectPath) {
  throw new Error("REMOTE_KANBAN_PROJECT_PATH is required.");
}

export const CONFIG = {
  repoPath: resolve(projectPath),
  worktreesPath: resolve(
    Bun.env["REMOTE_KANBAN_WORKTREES_PATH"] ?? `${projectPath}-worktrees`,
  ),
  defaultBaseBranch: "main",
} as const;
