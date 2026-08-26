import fs from "node:fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { getBranches, type GitBranch } from "./getBranches";

export const refreshBranches = async (
  repositoryPath: string,
  remoteName = "origin",
): Promise<GitBranch[]> => {
  const remotes = await git.listRemotes({
    fs,
    dir: repositoryPath,
  });
  const remote = remotes.find(({ remote }) => remote === remoteName);

  if (!remote) {
    return getBranches(repositoryPath, remoteName);
  }

  await git.fetch({
    fs,
    http,
    dir: repositoryPath,
    remote: remoteName,
    url: remote.url,
    prune: true,
  });

  return getBranches(repositoryPath, remoteName);
};
