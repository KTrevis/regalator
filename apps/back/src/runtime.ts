import { mkdir } from "node:fs/promises";
import { app } from "./app";
import { CONFIG } from "./config";
import { environment } from "./environment";
import {
  startManagedProject,
  stopManagedProject,
} from "./managed-project/managed-project.service";
import { logNotionSetupInstructions } from "./notion/notion.oauth";

export async function startRegalator() {
  await mkdir(CONFIG.projectFiles.stateDirectory, { recursive: true });

  const port = environment.port;
  app.listen(port);

  console.log(`Regalator is listening on http://localhost:${port}`);
  logNotionSetupInstructions();

  void startManagedProject().catch((error) => {
    console.error("Failed to start the managed project.", error);
  });

  installShutdownHandlers();
}

function installShutdownHandlers() {
  let shuttingDown = false;

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, async () => {
      if (shuttingDown) return;
      shuttingDown = true;

      await stopManagedProject(signal);
      process.exit(0);
    });
  }
}
