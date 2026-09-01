import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";

const REQUIRED_SECRETS = [
  "GITHUB_PAT",
  "NOTION_CLIENT_ID",
  "NOTION_CLIENT_SECRET",
] as const;

export async function loadSecrets(path: string) {
  let values: NodeJS.Dict<string>;
  try {
    values = parseEnv(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Unable to load Regalator secrets from ${path}.`, {
      cause: error,
    });
  }

  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined) process.env[name] ??= value;
  }

  validateRequiredSecrets(process.env);
}

export function validateRequiredSecrets(environment: NodeJS.ProcessEnv) {
  const missingSecrets = REQUIRED_SECRETS.filter(
    (name) => !environment[name]?.trim(),
  );

  if (missingSecrets.length > 0) {
    throw new Error(
      `Complete the required Regalator secrets before starting: ${missingSecrets.join(", ")}.`,
    );
  }
}
