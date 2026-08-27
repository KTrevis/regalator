import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { $ } from "bun";

const CHECKOUT_HOOK_TIMEOUT_MS = 300_000;

export async function runCheckoutHook(repositoryPath: string) {
  const configuredHookPath = Bun.env["REMOTE_KANBAN_CHECKOUT_HOOK"];
  if (!configuredHookPath) return;

  const branch = await getCurrentBranch(repositoryPath);
  const branchId = createHash("sha256")
    .update(branch)
    .digest("hex")
    .slice(0, 12);

  console.log(`Running checkout hook for ${branch}...`);

  const hook = Bun.spawn(
    ["/bin/sh", resolve(repositoryPath, configuredHookPath)],
    {
      cwd: repositoryPath,
      env: {
        ...process.env,
        REMOTE_KANBAN_BRANCH_ID: branchId,
      },
      stdin: "ignore",
      stdout: "inherit",
      stderr: "inherit",
    },
  );

  await waitForHook(hook);
}

async function getCurrentBranch(repositoryPath: string) {
  const branch = (
    await $`git branch --show-current`.cwd(repositoryPath).quiet().text()
  ).trim();

  if (branch) return branch;

  return (
    await $`git rev-parse HEAD`.cwd(repositoryPath).quiet().text()
  ).trim();
}

async function waitForHook(hook: ReturnType<typeof Bun.spawn>) {
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    hook.kill("SIGTERM");
  }, CHECKOUT_HOOK_TIMEOUT_MS);
  const exitCode = await hook.exited.finally(() => clearTimeout(timeout));

  if (timedOut) {
    throw new Error(
      `Checkout hook timed out after ${CHECKOUT_HOOK_TIMEOUT_MS} ms.`,
    );
  }

  if (exitCode !== 0) {
    throw new Error(`Checkout hook failed with exit code ${exitCode}.`);
  }
}
