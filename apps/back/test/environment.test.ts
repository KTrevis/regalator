import { afterEach, expect, test } from "bun:test";
import { environment } from "../src/environment";

const originalGitHubPat = environment.all["GITHUB_PAT"];

afterEach(() => {
  if (originalGitHubPat === undefined) {
    delete environment.all["GITHUB_PAT"];
  } else {
    environment.all["GITHUB_PAT"] = originalGitHubPat;
  }
});

test("exposes the GitHub PAT without logging or transforming it", () => {
  environment.all["GITHUB_PAT"] = "github-token";

  expect(environment.githubPat).toBe("github-token");
});
