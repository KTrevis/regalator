import { chmod, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseEnv } from "node:util";

export async function readEnvironmentFile(path: string) {
  try {
    return parseEnv(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read environment file at ${path}.`, {
      cause: error,
    });
  }
}

export async function updateEnvironmentFile(
  path: string,
  updates: Record<string, string>,
) {
  const content = await readFile(path, "utf8");
  const pending = new Map(Object.entries(updates));
  const lines = content.replace(/\n$/, "").split("\n");
  const updatedLines = lines.flatMap((line) => {
    const name = line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1];
    if (!name || !pending.has(name)) return [line];

    const value = pending.get(name);
    pending.delete(name);
    return value === undefined ? [] : [`${name}=${JSON.stringify(value)}`];
  });

  for (const [name, value] of pending) {
    updatedLines.push(`${name}=${JSON.stringify(value)}`);
  }

  const temporaryPath = resolve(
    dirname(path),
    `.env.${crypto.randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, `${updatedLines.join("\n")}\n`, {
      mode: 0o600,
    });
    await rename(temporaryPath, path);
    await chmod(path, 0o600);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
