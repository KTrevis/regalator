import { afterEach, expect, test } from "bun:test";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import { getBranches } from "../src/utils/git/getBranches";

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

test("lists local and remote-only branches", async () => {
  const repositoryPath = await realpath(
    await mkdtemp(join(tmpdir(), "regalator-branches-")),
  );
  repositories.push(repositoryPath);

  await $`git -C ${repositoryPath} init --initial-branch=main`.quiet();
  await $`git -C ${repositoryPath} config user.email test@example.com`.quiet();
  await $`git -C ${repositoryPath} config user.name Test`.quiet();
  await $`git -C ${repositoryPath} commit --allow-empty -m initial`.quiet();
  await $`git -C ${repositoryPath} branch local-only`.quiet();
  await $`git -C ${repositoryPath} update-ref refs/remotes/origin/main HEAD`.quiet();
  await $`git -C ${repositoryPath} update-ref refs/remotes/origin/remote-only HEAD`.quiet();

  expect(await getBranches(repositoryPath)).toEqual([
    { name: "local-only", current: false, local: true, remote: false },
    { name: "main", current: true, local: true, remote: true },
    { name: "remote-only", current: false, local: false, remote: true },
  ]);
});
