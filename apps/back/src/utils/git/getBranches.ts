import fs from "node:fs";
import git from "isomorphic-git";
import { listWorktreeBranches } from "./gitWorktrees";

export interface GitBranch {
  readonly name: string;
  readonly current: boolean;
  readonly local: boolean;
  readonly remote: boolean;
}

export const getBranches = async (
  repositoryPath: string,
  remoteName = "origin",
): Promise<GitBranch[]> => {
  const [currentBranch, localBranches, remoteBranches, worktreeBranches] =
    await Promise.all([
      git.currentBranch({
        fs,
        dir: repositoryPath,
        fullname: false,
      }),
      git.listBranches({
        fs,
        dir: repositoryPath,
      }),
      git.listBranches({
        fs,
        dir: repositoryPath,
        remote: remoteName,
      }),
      listWorktreeBranches(repositoryPath),
    ]);

  const remoteBranchNames = new Set(
    remoteBranches.filter((branchName) => branchName !== "HEAD"),
  );

  return localBranches
    .filter((name) => !worktreeBranches.has(name))
    .map((name): GitBranch => ({
      name,
      current: name === currentBranch,
      local: true,
      remote: remoteBranchNames.has(name),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
};
