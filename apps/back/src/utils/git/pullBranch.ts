import fs from "node:fs";
import { $ } from "bun";
import git from "isomorphic-git";

export async function pullBranch(repositoryPath: string) {
  const branch = await git.currentBranch({
    fs,
    dir: repositoryPath,
    fullname: false,
  });

  if (!branch) {
    throw new Error("Cannot pull while the repository has a detached HEAD.");
  }

  await $`git -C ${repositoryPath} pull --ff-only origin ${branch}`.quiet();
  return branch;
}
