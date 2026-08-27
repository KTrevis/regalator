import { createHash } from "node:crypto";
import { getCurrentRef } from "../utils/git/getCurrentRef";
import { getManagedProjectScriptPath } from "./managed-project-scripts";

const CHECKOUT_HOOK_TIMEOUT_MS = 300_000;

export async function runCheckoutHook(repositoryPath: string) {
  const hookPath = getManagedProjectScriptPath(repositoryPath, "checkoutHook");
  if (!hookPath) return;

  const branch = await getCurrentRef(repositoryPath);
  const branchId = createHash("sha256")
    .update(branch)
    .digest("hex")
    .slice(0, 12);

  console.log(`Running checkout hook for ${branch}...`);

  const hook = Bun.spawn(["/bin/sh", hookPath], {
    cwd: repositoryPath,
    env: {
      ...process.env,
      REGALATOR_BRANCH_ID: branchId,
    },
    stdin: "ignore",
    stdout: "inherit",
    stderr: "inherit",
  });

  await waitForHook(hook);
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
