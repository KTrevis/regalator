import { resolve } from "node:path";
import { environment } from "./environment";

const projectPath = environment.projectPath;

export const CONFIG = {
  repoPath: resolve(projectPath),
  worktreesPath: resolve(
    environment.worktreesPath ?? `${projectPath}-worktrees`,
  ),
  defaultBaseBranch: "main",
} as const;
