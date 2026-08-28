import { stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { $ } from "bun";

const SCRIPT_ENV_NAMES = {
  checkoutHook: "REGALATOR_CHECKOUT_HOOK",
  start: "REGALATOR_START_SCRIPT",
} as const;

const SCRIPT_LABELS: Record<ManagedProjectScript, string> = {
  checkoutHook: "checkout hook",
  start: "startup script",
};

type ManagedProjectScript = keyof typeof SCRIPT_ENV_NAMES;

export function getManagedProjectScriptPath(
  repositoryPath: string,
  script: ManagedProjectScript,
) {
  const configuredPath = Bun.env[SCRIPT_ENV_NAMES[script]];
  return configuredPath ? resolve(repositoryPath, configuredPath) : undefined;
}

export async function assertManagedProjectScriptsExist(repositoryPath: string) {
  const missingScripts = await getMissingScripts(repositoryPath, isFile);

  if (missingScripts.length > 0) {
    throw new Error(
      `Managed project scripts not found: ${formatScripts(missingScripts)}.`,
    );
  }
}

export async function assertManagedProjectScriptsExistOnBranch(
  repositoryPath: string,
  branch: string,
) {
  const missingScripts = await getMissingScripts(repositoryPath, (path) =>
    isFileOnBranch(repositoryPath, branch, path),
  );

  if (missingScripts.length > 0) {
    throw new Error(
      `Branch "${branch}" cannot be checked out because the following managed project scripts are missing: ${formatScripts(missingScripts)}.`,
    );
  }
}

async function getMissingScripts(
  repositoryPath: string,
  exists: (path: string) => Promise<boolean>,
) {
  const missingScripts: Array<{ label: string; path: string }> = [];

  for (const [script, envName] of Object.entries(SCRIPT_ENV_NAMES) as Array<
    [ManagedProjectScript, string]
  >) {
    const configuredPath = Bun.env[envName];
    if (!configuredPath) continue;

    const scriptPath = resolve(repositoryPath, configuredPath);
    if (!(await exists(scriptPath))) {
      missingScripts.push({ label: SCRIPT_LABELS[script], path: scriptPath });
    }
  }

  return missingScripts;
}

async function isFileOnBranch(
  repositoryPath: string,
  branch: string,
  path: string,
) {
  const repositoryRelativePath = relative(repositoryPath, path);
  if (
    repositoryRelativePath === ".." ||
    repositoryRelativePath.startsWith(`..${sep}`) ||
    isAbsolute(repositoryRelativePath)
  ) {
    return isFile(path);
  }

  const object = `${branch}:${repositoryRelativePath}`;
  const result = await $`git -C ${repositoryPath} cat-file -t ${object}`
    .quiet()
    .nothrow();
  return result.exitCode === 0 && result.text().trim() === "blob";
}

function formatScripts(scripts: Array<{ label: string; path: string }>) {
  return scripts.map(({ label, path }) => `${label} (${path})`).join(", ");
}

async function isFile(path: string) {
  return stat(path).then(
    (entry) => entry.isFile(),
    () => false,
  );
}
