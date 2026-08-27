import { resolve } from "node:path";
import { $ } from "bun";

type GitWorktree = {
  path: string;
  branch?: string;
};

async function listWorktrees(repositoryPath: string) {
  const output =
    await $`git -C ${repositoryPath} worktree list --porcelain`.text();

  return output.trim().split("\n\n").filter(Boolean).map(parseWorktree);
}

export async function listWorktreeBranches(repositoryPath: string) {
  const worktrees = await listWorktrees(repositoryPath);
  const mainWorktreePath = resolve(repositoryPath);

  return new Set(
    worktrees
      .filter((worktree) => resolve(worktree.path) !== mainWorktreePath)
      .map((worktree) => worktree.branch)
      .filter((branch): branch is string => Boolean(branch)),
  );
}

export async function assertBranchIsNotCheckedOutInAnotherWorktree(
  repositoryPath: string,
  branch: string,
) {
  const worktreeBranches = await listWorktreeBranches(repositoryPath);

  if (worktreeBranches.has(branch)) {
    throw new Error(`Branch ${branch} is already checked out in a worktree.`);
  }
}

export async function removeWorktree(
  repositoryPath: string,
  worktreePath: string,
) {
  await $`git -C ${repositoryPath} worktree remove ${worktreePath}`.quiet();
}

function parseWorktree(rawWorktree: string): GitWorktree {
  const lines = rawWorktree.split("\n");
  const path = lines[0]?.replace(/^worktree /, "");
  const branch = lines
    .find((line) => line.startsWith("branch refs/heads/"))
    ?.replace("branch refs/heads/", "");

  if (!path) {
    throw new Error(`Invalid Git worktree output: ${rawWorktree}`);
  }

  return branch ? { path, branch } : { path };
}
