import fs from "node:fs";
import git from "isomorphic-git";

export const switchBranch = async (
  repositoryPath: string,
  branch: string,
): Promise<void> => {
  await git.checkout({
    fs,
    dir: repositoryPath,
    ref: branch,
    remote: "origin",
  });
};
