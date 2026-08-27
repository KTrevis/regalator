import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const SCRIPT_ENV_NAMES = {
  checkoutHook: "REGALATOR_CHECKOUT_HOOK",
  start: "REGALATOR_START_SCRIPT",
} as const;

type ManagedProjectScript = keyof typeof SCRIPT_ENV_NAMES;

export function getManagedProjectScriptPath(
  repositoryPath: string,
  script: ManagedProjectScript,
) {
  const configuredPath = Bun.env[SCRIPT_ENV_NAMES[script]];
  return configuredPath ? resolve(repositoryPath, configuredPath) : undefined;
}

export async function assertManagedProjectScriptsExist(repositoryPath: string) {
  const missingScripts: string[] = [];

  for (const envName of Object.values(SCRIPT_ENV_NAMES)) {
    const configuredPath = Bun.env[envName];
    if (!configuredPath) continue;

    const scriptPath = resolve(repositoryPath, configuredPath);
    if (scriptPath && !(await isFile(scriptPath)))
      missingScripts.push(scriptPath);
  }

  if (missingScripts.length > 0) {
    throw new Error(
      `Managed project scripts not found: ${missingScripts.join(", ")}.`,
    );
  }
}

async function isFile(path: string) {
  return stat(path).then(
    (entry) => entry.isFile(),
    () => false,
  );
}
