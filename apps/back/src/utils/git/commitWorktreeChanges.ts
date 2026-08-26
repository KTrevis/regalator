import { $ } from "bun";

export async function commitWorktreeChanges(
  worktreePath: string,
  message: string,
) {
  await $`git -C ${worktreePath} add --all`.quiet();

  const stagedChanges = await $`git -C ${worktreePath} diff --cached --quiet`
    .quiet()
    .nothrow();

  if (stagedChanges.exitCode === 0) {
    return;
  }

  await $`git -C ${worktreePath} commit -m ${message}`.quiet();
}
