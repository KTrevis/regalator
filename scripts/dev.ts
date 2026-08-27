import { $ } from "bun";
import { CONFIG } from "../apps/back/src/config";
import { runCheckoutHook } from "./checkout-hook";
import {
  type ManagedProjectProcess,
  startManagedProject,
  stopManagedProject,
  waitForManagedProject,
} from "./managed-project";

const remoteKanbanPath = new URL("..", import.meta.url).pathname;
let remoteKanbanApps: ReturnType<typeof startRemoteKanbanApps> | undefined;
let projectProcess: ManagedProjectProcess | undefined;
let switching = true;
let projectError: unknown;

const supervisor = Bun.serve({
  hostname: "0.0.0.0",
  port: 3001,
  async fetch(request) {
    const path = new URL(request.url).pathname;

    if (request.method === "GET" && path === "/api/dev/restart-status") {
      return statusResponse(switching || projectError ? 503 : 204);
    }

    if (request.method === "GET" && path === "/api/git/branch/switch") {
      return statusResponse(switching || projectError ? 503 : 200);
    }

    if (path !== "/api/git/branch/switch" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    if (switching) {
      return new Response("A branch switch is already in progress.", {
        status: 409,
      });
    }

    const { branch } = (await request.json()) as { branch?: unknown };
    if (typeof branch !== "string") {
      return new Response("Invalid branch.", { status: 400 });
    }

    switching = true;
    projectError = undefined;
    setTimeout(() => void restartOnBranch(branch), 100);
    return Response.json({ branch }, { status: 202 });
  },
});

await $`docker compose -f compose.dev.yml up -d --force-recreate caddy`.cwd(
  remoteKanbanPath,
);
remoteKanbanApps = startRemoteKanbanApps();

try {
  await waitForRemoteKanban();
  await prepareAndStartProject();
} catch (error) {
  projectError = error;
  await stopProject();
  console.error(error);
} finally {
  switching = false;
}

function statusResponse(status: number) {
  return new Response(null, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

function startRemoteKanbanApps() {
  return Bun.spawn(["bun", "run", "dev:apps"], {
    cwd: remoteKanbanPath,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
}

async function prepareAndStartProject() {
  await runCheckoutHook(CONFIG.repoPath);
  projectProcess = startManagedProject(CONFIG.repoPath);
  await waitForManagedProject(projectProcess);
}

async function stopProject(signal: "SIGINT" | "SIGTERM" = "SIGTERM") {
  await stopManagedProject(projectProcess, signal);
  projectProcess = undefined;
}

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  supervisor.stop();
  await stopProject(signal);

  if (remoteKanbanApps) {
    remoteKanbanApps.kill(signal);
    await remoteKanbanApps.exited;
  }

  process.exit(0);
}

async function switchBranch(branch: string) {
  await stopProject();
  await $`git switch ${branch}`.cwd(CONFIG.repoPath);
  await prepareAndStartProject();
}

async function restartOnBranch(branch: string) {
  try {
    await switchBranch(branch);
  } catch (error) {
    projectError = error;
    await stopProject();
    console.error(error);
  } finally {
    switching = false;
  }
}

async function waitForRemoteKanban() {
  const deadline = Date.now() + 30_000;
  const urls = [
    "http://127.0.0.1:3000/api/git/branches",
    "http://127.0.0.1:5173",
  ];

  while (Date.now() < deadline) {
    const ready = await Promise.all(
      urls.map((url) =>
        fetch(url).then(
          (response) => response.ok,
          () => false,
        ),
      ),
    );
    if (ready.every(Boolean)) return;

    await Bun.sleep(100);
  }

  throw new Error("Remote Kanban was not ready within 30000 ms.");
}
