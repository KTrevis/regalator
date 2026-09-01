import { mkdir } from "node:fs/promises";
import { assertManagedProjectScriptsExist } from "../../../apps/back/src/managed-project/managed-project-scripts";
import { getProjectFiles } from "../../../apps/back/src/project-files";
import { initializeDatabase } from "./database";
import { findGitRepositoryRoot } from "./git-repository";
import { getPackageAssetPath } from "./package-assets";
import { readExistingConfig } from "./project-setup";
import { loadSecrets } from "./secrets";

export async function runStart(directory: string) {
  const repositoryPath = await findGitRepositoryRoot(directory);
  process.chdir(repositoryPath);

  const config = await readExistingConfig(repositoryPath);
  if (!config) {
    throw new Error("Run `regalator setup` before starting Regalator.");
  }

  const files = getProjectFiles(repositoryPath);
  await assertManagedProjectScriptsExist(repositoryPath);
  await mkdir(files.stateDirectory, { recursive: true });
  await loadSecrets(files.environment);

  process.env["DATABASE_URL"] = `file:${files.database}`;
  process.env["REGALATOR_WEB_ROOT"] = getPackageAssetPath("web");
  await initializeDatabase(files.database);

  const { startRegalator } = await import("../../../apps/back/src/runtime");
  await startRegalator();
}
