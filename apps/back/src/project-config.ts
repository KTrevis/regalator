import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { PROJECT_CONFIG_SCHEMA, type ProjectConfig } from "@regalator/shared";
import { getProjectFiles } from "./project-files";

export function readProjectConfig(repositoryPath: string): ProjectConfig {
  const configPath = getProjectFiles(repositoryPath).config;

  try {
    const value: unknown = JSON.parse(readFileSync(configPath, "utf8"));
    const config = PROJECT_CONFIG_SCHEMA.parse(value);
    validateWorktreesPath(config.worktreesPath);
    return config;
  } catch (error) {
    throw new Error(`Invalid Regalator configuration at ${configPath}.`, {
      cause: error,
    });
  }
}

export function resolveWorktreesPath(
  repositoryPath: string,
  configuredPath?: string,
) {
  return resolve(configuredPath ?? `${repositoryPath}-worktrees`);
}

function validateWorktreesPath(path?: string) {
  if (path && !isAbsolute(path)) {
    throw new Error("worktreesPath must be an absolute path.");
  }
}
