import { $ } from "bun";

const projectPath = new URL("..", import.meta.url).pathname;

await $`docker compose -f compose.dev.yml up -d --force-recreate caddy`.cwd(
  projectPath,
);
const apps = Bun.spawn(["bun", "run", "dev:apps"], {
  cwd: projectPath,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  apps.kill(signal);
  await apps.exited;

  process.exit(0);
}
