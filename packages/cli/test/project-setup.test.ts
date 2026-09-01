import { afterEach, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import { getProjectFiles } from "../../../apps/back/src/project-files";
import { findGitRepositoryRoot } from "../src/git-repository";
import { setupProject, validateProjectConfig } from "../src/project-setup";

const temporaryDirectories: string[] = [];
const config = {
  backendUrl: "https://regalator.example.com",
  projectHealthcheckUrl: "http://127.0.0.1:8080/health",
  port: 3000,
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

test("finds the repository root and rejects non-Git directories", async () => {
  const repositoryPath = await createTemporaryDirectory();
  const nestedPath = join(repositoryPath, "nested");
  await $`git -C ${repositoryPath} init --initial-branch=main`.quiet();
  await mkdir(nestedPath);

  await expect(findGitRepositoryRoot(nestedPath)).resolves.toBe(repositoryPath);

  const nonRepositoryPath = await createTemporaryDirectory();
  await expect(findGitRepositoryRoot(nonRepositoryPath)).rejects.toThrow(
    "Run Regalator from inside a Git repository.",
  );
});

test("creates project files without overwriting existing content", async () => {
  const repositoryPath = await createTemporaryDirectory();
  const files = getProjectFiles(repositoryPath);
  const firstRun = await setupProject(repositoryPath, config);

  expect(firstRun.created).toHaveLength(5);
  expect(await Bun.file(files.environment).exists()).toBeTrue();
  expect((await Bun.file(files.environment).stat()).mode & 0o777).toBe(0o600);

  await writeFile(files.startupScript, "#!/bin/sh\nexec custom-server\n");
  const secondRun = await setupProject(repositoryPath, config);

  expect(secondRun.created).toEqual([]);
  expect(await readFile(files.startupScript, "utf8")).toContain(
    "exec custom-server",
  );
});

test("rejects invalid configuration", () => {
  expect(() => validateProjectConfig({ ...config, port: 0 })).toThrow();
  expect(() =>
    validateProjectConfig({ ...config, worktreesPath: "relative/path" }),
  ).toThrow("worktreesPath must be an absolute path.");
  expect(() =>
    validateProjectConfig({ ...config, backendUrl: "ftp://example.com" }),
  ).toThrow();
});

test("generated script templates explain how to configure themselves", async () => {
  const repositoryPath = await createTemporaryDirectory();
  const files = getProjectFiles(repositoryPath);
  await setupProject(repositoryPath, config);

  const checkoutHook = Bun.spawn(["/bin/sh", files.checkoutHook], {
    cwd: repositoryPath,
    stderr: "pipe",
  });
  const startupScript = Bun.spawn(["/bin/sh", files.startupScript], {
    cwd: repositoryPath,
    stderr: "pipe",
  });

  expect(await checkoutHook.exited).toBe(1);
  expect(await startupScript.exited).toBe(1);
  expect(await new Response(checkoutHook.stderr).text()).toContain(
    "Edit .regalator/checkout-hook.sh before starting Regalator.",
  );
  expect(await new Response(startupScript.stderr).text()).toContain(
    "Edit .regalator/startup.sh before starting Regalator.",
  );
});

async function createTemporaryDirectory() {
  const path = await realpath(await mkdtemp(join(tmpdir(), "regalator-cli-")));
  temporaryDirectories.push(path);
  return path;
}
