import fs from "node:fs";
import git from "isomorphic-git";

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
  const [currentBranch, localBranches, remoteBranches] = await Promise.all([
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
  ]);

  const localBranchNames = new Set(localBranches);
  const remoteBranchNames = new Set(
    remoteBranches.filter((branchName) => branchName !== "HEAD"),
  );

  return Array.from(
    new Set([...localBranchNames, ...remoteBranchNames]),
    (name): GitBranch => ({
      name,
      current: name === currentBranch,
      local: localBranchNames.has(name),
      remote: remoteBranchNames.has(name),
    }),
  ).sort((left, right) => left.name.localeCompare(right.name));
};
