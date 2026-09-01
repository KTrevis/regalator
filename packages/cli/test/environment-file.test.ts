import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readEnvironmentFile,
  updateEnvironmentFile,
} from "../src/environment-file";

let temporaryDirectory: string | undefined;

afterEach(async () => {
  if (!temporaryDirectory) return;
  await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

test("updates known secrets without overwriting unrelated environment values", async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "regalator-env-"));
  const environmentPath = join(temporaryDirectory, ".env");
  await writeFile(
    environmentPath,
    "# Local secrets\nGITHUB_PAT=existing\nNOTION_ACCESS_TOKEN=\nCUSTOM=value\n",
  );

  await updateEnvironmentFile(environmentPath, {
    NOTION_ACCESS_TOKEN: "access-token",
    NOTION_REFRESH_TOKEN: "refresh-token",
  });

  expect(await readEnvironmentFile(environmentPath)).toEqual({
    GITHUB_PAT: "existing",
    NOTION_ACCESS_TOKEN: "access-token",
    NOTION_REFRESH_TOKEN: "refresh-token",
    CUSTOM: "value",
  });
  expect(await readFile(environmentPath, "utf8")).toContain("# Local secrets");
  expect((await Bun.file(environmentPath).stat()).mode & 0o777).toBe(0o600);
});
