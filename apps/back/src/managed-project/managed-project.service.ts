import { CONFIG } from "../config";
import { switchBranch } from "../utils/git/switchBranch";
import { runCheckoutHook } from "./checkout-hook";
import {
  type ManagedProjectProcess,
  spawnManagedProject,
  stopManagedProjectProcess,
  waitForManagedProjectReady,
} from "./managed-process";

let managedProcess: ManagedProjectProcess | undefined;
let lifecycleRunning = false;

export function startManagedProject() {
  return runLifecycleOperation(prepareAndStartProject);
}

export function switchManagedProjectBranch(branch: string) {
  return runLifecycleOperation(async () => {
    await stopManagedProject();
    await switchBranch(CONFIG.repoPath, branch);
    await prepareAndStartProject();
  });
}

export async function stopManagedProject(
  signal: "SIGINT" | "SIGTERM" = "SIGTERM",
) {
  await stopManagedProjectProcess(managedProcess, signal);
  managedProcess = undefined;
}

async function prepareAndStartProject() {
  await runCheckoutHook(CONFIG.repoPath);
  managedProcess = spawnManagedProject(CONFIG.repoPath);
  await waitForManagedProjectReady(managedProcess);
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
  } catch (error) {
    await stopManagedProject();
    throw error;
  } finally {
    lifecycleRunning = false;
  }
}
