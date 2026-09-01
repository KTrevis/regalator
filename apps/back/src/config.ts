import { resolve } from "node:path";
import { readProjectConfig, resolveWorktreesPath } from "./project-config";
import { getProjectFiles } from "./project-files";

const repoPath = resolve(process.cwd());
const projectFiles = getProjectFiles(repoPath);

export const CONFIG = {
  repoPath,
  projectFiles,
  get project() {
    return readProjectConfig(repoPath);
  },
  get worktreesPath() {
    return resolveWorktreesPath(
      repoPath,
      readProjectConfig(repoPath).worktreesPath,
    );
  },
  defaultBaseBranch: "main",
} as const;
