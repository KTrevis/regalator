import { stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { $ } from "bun";
import { environment } from "../environment";

const MANAGED_PROJECT_SCRIPTS = {
  checkoutHook: {
    getConfiguredPath: () => environment.projectCheckoutHook,
    label: "checkout hook",
  },
  start: {
    getConfiguredPath: () => environment.projectStartScript,
    label: "startup script",
  },
};

type ManagedProjectScript = keyof typeof MANAGED_PROJECT_SCRIPTS;

export function getManagedProjectScriptPath(
  repositoryPath: string,
  script: ManagedProjectScript,
) {
  const configuredPath = MANAGED_PROJECT_SCRIPTS[script].getConfiguredPath();
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

  for (const script of Object.values(MANAGED_PROJECT_SCRIPTS)) {
    const configuredPath = script.getConfiguredPath();
    if (!configuredPath) continue;

    const scriptPath = resolve(repositoryPath, configuredPath);
    if (!(await exists(scriptPath))) {
      missingScripts.push({ label: script.label, path: scriptPath });
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
