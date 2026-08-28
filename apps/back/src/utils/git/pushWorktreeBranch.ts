import { $ } from "bun";
import { environment } from "../../environment";

export async function pushWorktreeBranch(worktreePath: string) {
  const githubPat = environment.githubPat;

  if (!githubPat) {
    throw new Error("GITHUB_PAT is required to push agent changes.");
  }

  const [branchName, remoteUrl] = await Promise.all([
    $`git -C ${worktreePath} branch --show-current`.text(),
    $`git -C ${worktreePath} remote get-url --push origin`.text(),
  ]);
  const branch = branchName.trim();

  if (!branch) {
    throw new Error("The agent worktree must be on a branch before pushing.");
  }

  const pushUrl = getGitHubHttpsRemoteUrl(remoteUrl.trim());
  const authorization = Buffer.from(`x-access-token:${githubPat}`).toString(
    "base64",
  );
  const gitEnvironment = { ...environment.all };
  delete gitEnvironment["GITHUB_PAT"];

  await $`git -C ${worktreePath} push ${pushUrl} HEAD:${`refs/heads/${branch}`}`
    .env({
      ...gitEnvironment,
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraHeader",
      GIT_CONFIG_VALUE_0: `Authorization: Basic ${authorization}`,
      GIT_TERMINAL_PROMPT: "0",
    })
    .quiet();
}

export function getGitHubHttpsRemoteUrl(remoteUrl: string) {
  if (remoteUrl.startsWith("https://github.com/")) {
    return remoteUrl;
  }

  const scpPath = remoteUrl.match(/^git@github\.com:(.+)$/)?.[1];
  if (scpPath) {
    return `https://github.com/${scpPath}`;
  }

  const sshPath = remoteUrl.match(/^ssh:\/\/git@github\.com\/(.+)$/)?.[1];
  if (sshPath) {
    return `https://github.com/${sshPath}`;
  }

  throw new Error(
    "The origin remote must use a GitHub HTTPS or SSH repository URL.",
  );
}
