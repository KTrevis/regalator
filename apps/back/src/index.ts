import { app } from "./app";
import {
  startManagedProject,
  stopManagedProject,
} from "./managed-project/managed-project.service";
import { logNotionSetupInstructions } from "./notion/notion.oauth";

const port = Number(Bun.env["PORT"] ?? 3000);

app.listen(port);

console.log(`Back listening on http://localhost:${port}`);
logNotionSetupInstructions();

void startManagedProject().catch((error) => {
  console.error("Failed to start the managed project.", error);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

let shuttingDown = false;

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;

  await stopManagedProject(signal);
  process.exit(0);
}
