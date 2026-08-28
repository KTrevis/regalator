import { CONFIG } from "../config";
import { getCurrentRef } from "../utils/git/getCurrentRef";
import { switchBranch } from "../utils/git/switchBranch";
import { runCheckoutHook } from "./checkout-hook";
import {
  type ManagedProjectProcess,
  spawnManagedProject,
  stopManagedProjectProcess,
  waitForManagedProjectReady,
} from "./managed-process";
import {
  assertManagedProjectScriptsExist,
  assertManagedProjectScriptsExistOnBranch,
} from "./managed-project-scripts";

let managedProcess: ManagedProjectProcess | undefined;
let lifecycleRunning = false;

export function startManagedProject() {
  return runLifecycleOperation(prepareAndStartProject);
}

export async function switchManagedProjectBranch(branch: string) {
  await assertManagedProjectScriptsExistOnBranch(CONFIG.repoPath, branch);

  return runLifecycleOperation(async () => {
    const previousRef = await getCurrentRef(CONFIG.repoPath);
    await stopManagedProject();

    try {
      await switchBranch(CONFIG.repoPath, branch);
      await prepareAndStartProject();
    } catch (error) {
      await restoreManagedProject(previousRef, branch, error);
    }
  });
}

export async function stopManagedProject(
  signal: "SIGINT" | "SIGTERM" = "SIGTERM",
) {
  await stopManagedProjectProcess(managedProcess, signal);
  managedProcess = undefined;
}

async function prepareAndStartProject() {
  try {
    await assertManagedProjectScriptsExist(CONFIG.repoPath);
    await runCheckoutHook(CONFIG.repoPath);
    managedProcess = spawnManagedProject(CONFIG.repoPath);
    await waitForManagedProjectReady(managedProcess);
  } catch (error) {
    await stopManagedProject();
    throw error;
  }
}

async function restoreManagedProject(
  previousRef: string,
  failedRef: string,
  switchError: unknown,
): Promise<never> {
  try {
    await switchBranch(CONFIG.repoPath, previousRef);
    await prepareAndStartProject();
  } catch (restoreError) {
    throw new AggregateError(
      [switchError, restoreError],
      `Failed to switch to ${failedRef} and to restore ${previousRef}.`,
    );
  }

  throw new Error(
    `Failed to switch to ${failedRef}; restored ${previousRef}.`,
    { cause: switchError },
  );
}

async function runLifecycleOperation(operation: () => Promise<void>) {
  if (lifecycleRunning) {
    throw new Error(
      "A managed project lifecycle operation is already running.",
    );
  }

  lifecycleRunning = true;
  try {
    await operation();
  } finally {
    lifecycleRunning = false;
  }
}
