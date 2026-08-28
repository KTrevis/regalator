import { afterEach, expect, test } from "bun:test";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import { environment } from "../src/environment";
import {
  getGitHubHttpsRemoteUrl,
  pushWorktreeBranch,
} from "../src/utils/git/pushWorktreeBranch";

const repositories: string[] = [];

afterEach(async () => {
  await Promise.all(
    repositories
      .splice(0)
      .map((repositoryPath) =>
        rm(repositoryPath, { recursive: true, force: true }),
      ),
  );
});

async function createRepository() {
  const repositoryPath = await realpath(
    await mkdtemp(join(tmpdir(), "regalator-push-")),
  );
  repositories.push(repositoryPath);

  await $`git -C ${repositoryPath} init --initial-branch=main`.quiet();

  return repositoryPath;
}

test("does nothing when the repository has no origin remote", async () => {
  const repositoryPath = await createRepository();
  const githubPat = environment.all["GITHUB_PAT"];
  delete environment.all["GITHUB_PAT"];

  try {
    await expect(pushWorktreeBranch(repositoryPath)).resolves.toBeUndefined();
  } finally {
    if (githubPat !== undefined) {
      environment.all["GITHUB_PAT"] = githubPat;
    }
  }
});

test("requires a GitHub PAT before running Git", async () => {
  const repositoryPath = await createRepository();
  await $`git -C ${repositoryPath} remote add origin https://github.com/example/project.git`.quiet();
  const githubPat = environment.all["GITHUB_PAT"];
  delete environment.all["GITHUB_PAT"];

  try {
    await expect(pushWorktreeBranch(repositoryPath)).rejects.toThrow(
      "GITHUB_PAT is required to push agent changes.",
    );
  } finally {
    if (githubPat !== undefined) {
      environment.all["GITHUB_PAT"] = githubPat;
    }
  }
});

test("keeps GitHub HTTPS remotes unchanged", () => {
  expect(
    getGitHubHttpsRemoteUrl("https://github.com/example/project.git"),
  ).toBe("https://github.com/example/project.git");
});

test("converts common GitHub SSH remotes to HTTPS", () => {
  expect(getGitHubHttpsRemoteUrl("git@github.com:example/project.git")).toBe(
    "https://github.com/example/project.git",
  );
  expect(
    getGitHubHttpsRemoteUrl("ssh://git@github.com/example/project.git"),
  ).toBe("https://github.com/example/project.git");
});

test("rejects remotes that could expose the GitHub PAT to another host", () => {
  expect(() =>
    getGitHubHttpsRemoteUrl("https://example.com/example/project.git"),
  ).toThrow("The origin remote must use a GitHub HTTPS or SSH repository URL.");
});
