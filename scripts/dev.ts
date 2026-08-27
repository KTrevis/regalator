import { $ } from "bun";

const remoteKanbanPath = new URL("..", import.meta.url).pathname;

await $`docker compose -f compose.dev.yml up -d --force-recreate caddy`.cwd(
  remoteKanbanPath,
);
const remoteKanbanApps = Bun.spawn(["bun", "run", "dev:apps"], {
  cwd: remoteKanbanPath,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  remoteKanbanApps.kill(signal);
  await remoteKanbanApps.exited;

  process.exit(0);
}
