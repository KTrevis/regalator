import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { PROJECT_CONFIG_SCHEMA, type ProjectConfig } from "@regalator/shared";
import { getProjectFiles } from "../../../apps/back/src/project-files";

const CHECKOUT_HOOK_TEMPLATE = `#!/bin/sh
set -eu

# Replace this template with the finite commands
# that prepare the selected branch. This script must be idempotent and finish
# within five minutes. REGALATOR_BRANCH_ID contains a stable branch identifier.

echo "Edit .regalator/checkout-hook.sh before starting Regalator." >&2
exit 1
`;

const STARTUP_SCRIPT_TEMPLATE = `#!/bin/sh
set -eu

# Replace this template with the long-running command
# that starts the managed project. Keep the process in the foreground and use
# exec when possible so that SIGTERM and SIGINT are forwarded correctly.

echo "Edit .regalator/startup.sh before starting Regalator." >&2
exit 1
`;

const ENVIRONMENT_TEMPLATE = `GITHUB_PAT=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_ACCESS_TOKEN=
NOTION_REFRESH_TOKEN=
`;

const GITIGNORE_TEMPLATE = `.env
state/
`;

export async function readExistingConfig(repositoryPath: string) {
  const configPath = getProjectFiles(repositoryPath).config;
  if (!(await fileExists(configPath))) return;

  return parseProjectConfig(await readFile(configPath, "utf8"));
}

export async function setupProject(
  repositoryPath: string,
  input: ProjectConfig,
) {
  const config = validateProjectConfig(input);
  const files = getProjectFiles(repositoryPath);
  await mkdir(files.regalatorDirectory, { recursive: true });

  const created = (
    await Promise.all([
      createFile(files.config, `${JSON.stringify(config, null, 2)}\n`),
      createFile(files.checkoutHook, CHECKOUT_HOOK_TEMPLATE),
      createFile(files.startupScript, STARTUP_SCRIPT_TEMPLATE),
      createFile(files.environment, ENVIRONMENT_TEMPLATE, 0o600),
      createFile(`${files.regalatorDirectory}/.gitignore`, GITIGNORE_TEMPLATE),
    ])
  ).filter((path): path is string => Boolean(path));

  if (!created.includes(files.config)) {
    await readExistingConfig(repositoryPath);
  }

  return { config, created, files };
}

export function validateProjectConfig(input: unknown) {
  const config = PROJECT_CONFIG_SCHEMA.parse(input);
  if (config.worktreesPath && !isAbsolute(config.worktreesPath)) {
    throw new Error("worktreesPath must be an absolute path.");
  }
  return config;
}

function parseProjectConfig(content: string) {
  try {
    return validateProjectConfig(JSON.parse(content));
  } catch (error) {
    throw new Error("The existing .regalator/config.json is invalid.", {
      cause: error,
    });
  }
}

async function createFile(path: string, content: string, mode?: number) {
  try {
    await writeFile(path, content, { encoding: "utf8", flag: "wx", mode });
    return path;
  } catch (error) {
    if (isFileExistsError(error)) return;
    throw error;
  }
}

function isFileExistsError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}

async function fileExists(path: string) {
  return access(path, constants.F_OK).then(
    () => true,
    () => false,
  );
}
