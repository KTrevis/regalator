import { afterEach, expect, mock, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readEnvironmentFile } from "../src/environment-file";
import { setupGitHubPat } from "../src/github-setup";

let temporaryDirectory: string | undefined;

afterEach(async () => {
  mock.restore();
  if (!temporaryDirectory) return;
  await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

test("stores a GitHub PAT once and keeps it on later setup runs", async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "regalator-github-"));
  const environmentPath = join(temporaryDirectory, ".env");
  await writeFile(environmentPath, "GITHUB_PAT=\nCUSTOM=value\n");
  const prompt = mock(async () => "github-token");

  await setupGitHubPat(environmentPath, prompt);
  await setupGitHubPat(environmentPath, prompt);

  expect(prompt).toHaveBeenCalledTimes(1);
  expect(await readEnvironmentFile(environmentPath)).toEqual({
    GITHUB_PAT: "github-token",
    CUSTOM: "value",
  });
});
