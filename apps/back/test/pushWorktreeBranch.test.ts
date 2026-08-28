import { expect, test } from "bun:test";
import { environment } from "../src/environment";
import {
  getGitHubHttpsRemoteUrl,
  pushWorktreeBranch,
} from "../src/utils/git/pushWorktreeBranch";

test("requires a GitHub PAT before running Git", async () => {
  const githubPat = environment.all["GITHUB_PAT"];
  delete environment.all["GITHUB_PAT"];

  try {
    await expect(pushWorktreeBranch("/unused")).rejects.toThrow(
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
