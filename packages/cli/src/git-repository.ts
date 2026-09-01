import { realpath } from "node:fs/promises";

export async function findGitRepositoryRoot(directory: string) {
  const process = Bun.spawn(["git", "rev-parse", "--show-toplevel"], {
    cwd: directory,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, output] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error("Run Regalator from inside a Git repository.");
  }

  return realpath(output.trim());
}
