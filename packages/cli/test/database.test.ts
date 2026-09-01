import { afterEach, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initializeDatabase } from "../src/database";
import { validateRequiredSecrets } from "../src/secrets";

let temporaryDirectory: string | undefined;

afterEach(async () => {
  if (!temporaryDirectory) return;
  await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

test("initializes a new database and can run again", async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "regalator-database-"));
  const databasePath = join(temporaryDirectory, "regalator.db");

  await initializeDatabase(databasePath);
  await initializeDatabase(databasePath);

  const database = new Database(databasePath);
  const tables = database
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
    .all()
    .map(({ name }) => name);
  database.close();

  expect(tables).toContain("AgentRun");
  expect(tables).toContain("AppSettings");
});

test("requires GitHub and Notion secrets", () => {
  expect(() => validateRequiredSecrets({})).toThrow(
    "GITHUB_PAT, NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_ACCESS_TOKEN, NOTION_REFRESH_TOKEN",
  );
  expect(() =>
    validateRequiredSecrets({
      GITHUB_PAT: "github-token",
      NOTION_CLIENT_ID: "notion-id",
      NOTION_CLIENT_SECRET: "notion-secret",
      NOTION_ACCESS_TOKEN: "notion-access-token",
      NOTION_REFRESH_TOKEN: "notion-refresh-token",
    }),
  ).not.toThrow();
});
