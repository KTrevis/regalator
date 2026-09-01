import { environment } from "../environment";
import { getManagedProjectScriptPath } from "./managed-project-scripts";

const READY_TIMEOUT_MS = 30_000;

export type ManagedProjectProcess = ReturnType<typeof Bun.spawn>;

export function spawnManagedProject(repositoryPath: string) {
  const startScriptPath = getManagedProjectScriptPath(repositoryPath, "start");

  return Bun.spawn(["/bin/sh", startScriptPath], {
    cwd: repositoryPath,
    detached: true,
    env: environment.all,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
}

export async function stopManagedProjectProcess(
  managedProcess: ManagedProjectProcess | undefined,
  signal: "SIGINT" | "SIGTERM" = "SIGTERM",
) {
  if (!managedProcess || managedProcess.exitCode !== null) return;

  process.kill(-managedProcess.pid, signal);
  await managedProcess.exited;
}

export async function waitForManagedProjectReady(
  process: ManagedProjectProcess | undefined,
) {
  const projectHealthcheckUrl = environment.projectHealthcheckUrl;

  if (!projectHealthcheckUrl) {
    await Bun.sleep(100);
    assertProcessRunning(process);
    return;
  }

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    assertProcessRunning(process);

    const reachable = await fetch(projectHealthcheckUrl, {
      signal: AbortSignal.timeout(1_000),
    }).then(
      () => true,
      () => false,
    );
    if (reachable) return;

    await Bun.sleep(100);
  }

  throw new Error(
    `The managed project was not ready within ${READY_TIMEOUT_MS} ms.`,
  );
}

function assertProcessRunning(process: ManagedProjectProcess | undefined) {
  if (!process || (!process.killed && process.exitCode === null)) return;

  const reason = process.killed
    ? "after receiving a signal"
    : `with code ${process.exitCode}`;
  throw new Error(`The managed project exited ${reason}.`);
}
