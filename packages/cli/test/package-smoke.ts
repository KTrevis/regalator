import { Database } from "bun:sqlite";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dir, "../../..");
const temporaryRoot = await mkdtemp(resolve(tmpdir(), "regalator-package-"));
const archiveDirectory = resolve(temporaryRoot, "archive");
const projectDirectory = resolve(temporaryRoot, "project");
let regalatorProcess: ReturnType<typeof Bun.spawn> | undefined;

try {
  await Promise.all([
    mkdir(archiveDirectory, { recursive: true }),
    mkdir(projectDirectory, { recursive: true }),
  ]);
  await run(["git", "init", "--initial-branch=main"], projectDirectory);
  await run(
    [
      "bun",
      "pm",
      "pack",
      "--destination",
      archiveDirectory,
      "--ignore-scripts",
    ],
    resolve(repositoryRoot, "packages/cli"),
  );
  await run(
    ["bun", "add", resolve(archiveDirectory, "regalator-cli-0.1.0.tgz")],
    projectDirectory,
  );

  const executable = resolve(projectDirectory, "node_modules/.bin/regalator");
  const regalatorPort = getAvailablePort();
  const projectPort = getAvailablePort();
  const regalatorDirectory = resolve(projectDirectory, ".regalator");
  await mkdir(regalatorDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      resolve(regalatorDirectory, "config.json"),
      `${JSON.stringify(
        {
          backendUrl: `http://127.0.0.1:${regalatorPort}`,
          projectHealthcheckUrl: `http://127.0.0.1:${projectPort}/health`,
          port: regalatorPort,
        },
        null,
        2,
      )}\n`,
    ),
    writeFile(
      resolve(regalatorDirectory, "checkout-hook.sh"),
      "#!/bin/sh\nset -eu\nexit 0\n",
    ),
    writeFile(
      resolve(regalatorDirectory, "startup.sh"),
      "#!/bin/sh\nset -eu\nexec bun .regalator/test-server.ts\n",
    ),
    writeFile(
      resolve(regalatorDirectory, "test-server.ts"),
      `Bun.serve({ port: ${projectPort}, fetch: () => new Response("ok") });\n`,
    ),
    writeFile(
      resolve(regalatorDirectory, ".env"),
      "GITHUB_PAT=test\nNOTION_CLIENT_ID=test\nNOTION_CLIENT_SECRET=test\nNOTION_ACCESS_TOKEN=test\nNOTION_REFRESH_TOKEN=test\n",
      { mode: 0o600 },
    ),
  ]);

  regalatorProcess = Bun.spawn([executable, "start"], {
    cwd: projectDirectory,
    stdout: "pipe",
    stderr: "pipe",
  });
  const origin = `http://127.0.0.1:${regalatorPort}`;
  await waitForHealthyServer(origin, regalatorProcess);

  const [indexResponse, embedResponse, settingsResponse] = await Promise.all([
    fetch(`${origin}/`),
    fetch(`${origin}/embed.js`),
    fetch(`${origin}/api/settings`),
  ]);
  if (!indexResponse.ok || !embedResponse.ok || !settingsResponse.ok) {
    throw new Error("The packed CLI did not serve its web assets and API.");
  }

  const database = new Database(
    resolve(regalatorDirectory, "state/regalator.db"),
  );
  const appSettingsTable = database
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'AppSettings'",
    )
    .get();
  database.close();
  if (!appSettingsTable) {
    throw new Error("The packed CLI did not initialize the database.");
  }

  console.log("Packed CLI smoke test passed.");
} finally {
  if (regalatorProcess && regalatorProcess.exitCode === null) {
    regalatorProcess.kill("SIGTERM");
    await regalatorProcess.exited;
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}

async function run(command: string[], cwd: string) {
  const process = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await process.exited) !== 0) {
    throw new Error(`Command failed: ${command.join(" ")}`);
  }
}

function getAvailablePort() {
  const server = Bun.serve({ port: 0, fetch: () => new Response() });
  const port = server.port;
  server.stop(true);
  return port;
}

async function waitForHealthyServer(
  origin: string,
  process: ReturnType<typeof Bun.spawn>,
) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      const output = await readProcessOutput(process);
      throw new Error(
        `The packed CLI exited before becoming ready.\n${output}`,
      );
    }

    const healthy = await fetch(`${origin}/api/health`).then(
      (response) => response.ok,
      () => false,
    );
    if (healthy) return;
    await Bun.sleep(50);
  }

  throw new Error("The packed CLI did not become ready within 10 seconds.");
}

async function readProcessOutput(process: ReturnType<typeof Bun.spawn>) {
  const [stdout, stderr] = await Promise.all([
    readStream(process.stdout),
    readStream(process.stderr),
  ]);
  return `${stdout}\n${stderr}`.trim();
}

function readStream(stream: unknown) {
  return stream instanceof ReadableStream
    ? new Response(stream).text()
    : Promise.resolve("");
}
