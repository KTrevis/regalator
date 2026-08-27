import { resolve } from "node:path";

const READY_TIMEOUT_MS = 30_000;

export type ManagedProjectProcess = ReturnType<typeof Bun.spawn>;

export function startManagedProject(repositoryPath: string) {
  const configuredScriptPath = Bun.env["REMOTE_KANBAN_START_SCRIPT"];
  if (!configuredScriptPath) return;

  return Bun.spawn(["/bin/sh", resolve(repositoryPath, configuredScriptPath)], {
    cwd: repositoryPath,
    env: process.env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
}

export async function stopManagedProject(
  process: ManagedProjectProcess | undefined,
  signal: "SIGINT" | "SIGTERM" = "SIGTERM",
) {
  if (!process || process.killed || process.exitCode !== null) return;

  process.kill(signal);
  await process.exited;
}

export async function waitForManagedProject(
  process: ManagedProjectProcess | undefined,
) {
  const backendUrl = Bun.env["REMOTE_KANBAN_BACKEND_URL"];

  if (!backendUrl) {
    await Bun.sleep(100);
    assertProcessRunning(process);
    return;
  }

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    assertProcessRunning(process);

    const reachable = await fetch(backendUrl, {
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
