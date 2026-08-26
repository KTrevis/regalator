import fs from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { $ } from "bun";
import git from "isomorphic-git";

export type CreateTaskWorktreeInput = {
  repositoryPath: string;
  worktreesPath: string;
  taskId: string;
  title: string;
  baseBranch: string;
};

export type TaskWorktree = {
  branchName: string;
  worktreePath: string;
};

export async function createTaskWorktree({
  repositoryPath,
  worktreesPath,
  taskId,
  title,
  baseBranch,
}: CreateTaskWorktreeInput): Promise<TaskWorktree> {
  const branchName = getTaskBranchName(taskId, title);
  const worktreePath = join(worktreesPath, branchName.replaceAll("/", "__"));

  if (await isExistingWorktree(worktreePath)) {
    return { branchName, worktreePath };
  }

  await mkdir(dirname(worktreePath), { recursive: true });
  await createBranchIfMissing(repositoryPath, branchName, baseBranch);
  await addWorktree(repositoryPath, worktreePath, branchName);

  return { branchName, worktreePath };
}

async function createBranchIfMissing(
  repositoryPath: string,
  branchName: string,
  baseBranch: string,
) {
  const branches = await git.listBranches({ fs, dir: repositoryPath });

  if (branches.includes(branchName)) {
    return;
  }

  await git.branch({
    fs,
    dir: repositoryPath,
    ref: branchName,
    object: baseBranch,
    checkout: false,
  });
}

async function addWorktree(
  repositoryPath: string,
  worktreePath: string,
  branchName: string,
) {
  await $`git -C ${repositoryPath} worktree add ${worktreePath} ${branchName}`.quiet();
}

async function isExistingWorktree(worktreePath: string) {
  if (!(await pathExists(worktreePath))) {
    return false;
  }

  if (await pathExists(join(worktreePath, ".git"))) {
    return true;
  }

  throw new Error(
    `Worktree path already exists and is not a Git worktree: ${worktreePath}`,
  );
}

async function pathExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function getTaskBranchName(taskId: string, title: string) {
  const shortTaskId = taskId.replaceAll("-", "").slice(0, 12);
  const slug = slugify(title).slice(0, 48);

  return `feature/notion-${shortTaskId}${slug ? `-${slug}` : ""}`;
}

type NodeError = Error & { code?: string };

function isNodeError(error: unknown): error is NodeError {
  return error instanceof Error;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
