import fs from "node:fs";
import git from "isomorphic-git";

export async function getCurrentRef(repositoryPath: string) {
  const branch = await git.currentBranch({
    fs,
    dir: repositoryPath,
    fullname: false,
  });

  return branch ?? git.resolveRef({ fs, dir: repositoryPath, ref: "HEAD" });
}
