import { stat } from "node:fs/promises";
import { isAbsolute, relative, sep } from "node:path";
import { $ } from "bun";
import { getProjectFiles } from "../project-files";
import { assertScriptTemplatesCompleted } from "./script-template";

const MANAGED_PROJECT_SCRIPTS = {
  checkoutHook: {
    label: "checkout hook",
    path: (repositoryPath: string) =>
      getProjectFiles(repositoryPath).checkoutHook,
  },
  start: {
    label: "startup script",
    path: (repositoryPath: string) =>
      getProjectFiles(repositoryPath).startupScript,
  },
};

type ManagedProjectScript = keyof typeof MANAGED_PROJECT_SCRIPTS;

export function getManagedProjectScriptPath(
  repositoryPath: string,
  script: ManagedProjectScript,
) {
  return MANAGED_PROJECT_SCRIPTS[script].path(repositoryPath);
}

export async function assertManagedProjectScriptsExist(repositoryPath: string) {
  const missingScripts = await getMissingScripts(repositoryPath, isFile);

  if (missingScripts.length > 0) {
    throw new Error(
      `Managed project scripts not found: ${formatScripts(missingScripts)}.`,
    );
  }

  await assertScriptTemplatesCompleted(repositoryPath);
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
    const scriptPath = script.path(repositoryPath);
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
