import { $ } from "bun";

const repositoryPath = new URL("..", import.meta.url).pathname;
let apps = startApps();
let switching = false;

await $`docker compose -f compose.dev.yml up -d --force-recreate caddy`.cwd(
  repositoryPath,
);

const supervisor = Bun.serve({
  hostname: "0.0.0.0",
  port: 3001,
  async fetch(request) {
    const path = new URL(request.url).pathname;

    if (
      request.method === "GET" &&
      ["/api/dev/restart-status", "/api/git/branch/switch"].includes(path)
    ) {
      return new Response(null, { status: switching ? 503 : 204 });
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
    setTimeout(() => void restartOnBranch(branch), 100);
    return Response.json({ branch }, { status: 202 });
  },
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

function startApps() {
  return Bun.spawn(["bun", "run", "dev:apps"], {
    cwd: repositoryPath,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
}

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  supervisor.stop();
  apps.kill(signal);
  await apps.exited;
  process.exit(0);
}

async function switchBranch(branch: string) {
  apps.kill("SIGTERM");
  await apps.exited;

  try {
    await $`git switch ${branch}`.cwd(repositoryPath);
    await $`bun install --frozen-lockfile`.cwd(repositoryPath);
  } finally {
    apps = startApps();
    await waitForApps();
  }
}

async function restartOnBranch(branch: string) {
  try {
    await switchBranch(branch);
  } catch (error) {
    console.error(error);
  } finally {
    switching = false;
  }
}

async function waitForApps() {
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

  throw new Error("The applications did not restart within 30 seconds.");
}
