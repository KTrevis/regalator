import { Database } from "bun:sqlite";
import { readdir, readFile } from "node:fs/promises";
import { getPackageAssetPath } from "./package-assets";

export async function initializeDatabase(databasePath: string) {
  const migrationsPath = getPackageAssetPath("migrations");
  const migrationFiles = (await readdir(migrationsPath))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const database = new Database(databasePath, { create: true });

  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS "_regalator_migrations" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyPendingMigrations(database, migrationsPath, migrationFiles);
  } finally {
    database.close();
  }
}

async function applyPendingMigrations(
  database: Database,
  migrationsPath: string,
  migrationFiles: string[],
) {
  const appliedMigrations = new Set(
    database
      .query<{ name: string }, []>('SELECT "name" FROM "_regalator_migrations"')
      .all()
      .map(({ name }) => name),
  );

  for (const migrationFile of migrationFiles) {
    if (appliedMigrations.has(migrationFile)) continue;

    const sql = await readFile(`${migrationsPath}/${migrationFile}`, "utf8");
    database.transaction(() => {
      database.exec(sql);
      database
        .query('INSERT INTO "_regalator_migrations" ("name") VALUES (?)')
        .run(migrationFile);
    })();
  }
}
