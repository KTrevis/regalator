import fs from "node:fs";
import git from "isomorphic-git";
import { assertBranchIsNotCheckedOutInAnotherWorktree } from "./gitWorktrees";

export const switchBranch = async (
  repositoryPath: string,
  branch: string,
): Promise<void> => {
  await assertBranchIsNotCheckedOutInAnotherWorktree(repositoryPath, branch);

  await git.checkout({
    fs,
    dir: repositoryPath,
    ref: branch,
    remote: "origin",
  });
};
