import { chmod, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const packageRoot = import.meta.dir;
const repositoryRoot = resolve(packageRoot, "../..");
const outputDirectory = resolve(packageRoot, "dist");
const executablePath = resolve(outputDirectory, "bin/regalator.js");

await rm(outputDirectory, { recursive: true, force: true });
await Promise.all([
  mkdir(resolve(outputDirectory, "bin"), { recursive: true }),
  mkdir(resolve(outputDirectory, "prisma"), { recursive: true }),
]);

const result = await Bun.build({
  entrypoints: [resolve(packageRoot, "src/index.ts")],
  outdir: resolve(outputDirectory, "bin"),
  naming: "regalator.js",
  target: "bun",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

await Promise.all([
  cp(
    resolve(repositoryRoot, "apps/front/dist"),
    resolve(outputDirectory, "web"),
    {
      recursive: true,
    },
  ),
  cp(
    resolve(repositoryRoot, "apps/back/prisma/schema/schema.prisma"),
    resolve(outputDirectory, "prisma/schema.prisma"),
    { recursive: true },
  ),
  cp(
    resolve(packageRoot, "migrations"),
    resolve(outputDirectory, "migrations"),
    {
      recursive: true,
    },
  ),
]);
await chmod(executablePath, 0o755);
