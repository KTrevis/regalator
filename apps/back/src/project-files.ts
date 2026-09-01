import { resolve } from "node:path";

export const REGALATOR_DIRECTORY_NAME = ".regalator";
export const CHECKOUT_HOOK_NAME = "checkout-hook.sh";
export const STARTUP_SCRIPT_NAME = "startup.sh";
export const CONFIG_FILE_NAME = "config.json";
export const ENV_FILE_NAME = ".env";
export const STATE_DIRECTORY_NAME = "state";
export const SCRIPT_TEMPLATE_MARKER = "REGALATOR_SETUP_REQUIRED";

export function getProjectFiles(repositoryPath: string) {
  const regalatorDirectory = resolve(repositoryPath, REGALATOR_DIRECTORY_NAME);
  const stateDirectory = resolve(regalatorDirectory, STATE_DIRECTORY_NAME);

  return {
    checkoutHook: resolve(regalatorDirectory, CHECKOUT_HOOK_NAME),
    config: resolve(regalatorDirectory, CONFIG_FILE_NAME),
    database: resolve(stateDirectory, "regalator.db"),
    environment: resolve(regalatorDirectory, ENV_FILE_NAME),
    notionToken: resolve(stateDirectory, "notion-token.txt"),
    regalatorDirectory,
    startupScript: resolve(regalatorDirectory, STARTUP_SCRIPT_NAME),
    stateDirectory,
  } as const;
}
