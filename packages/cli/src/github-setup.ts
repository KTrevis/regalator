import { cancel, isCancel, password } from "@clack/prompts";
import { readEnvironmentFile, updateEnvironmentFile } from "./environment-file";

const GITHUB_TOKENS_URL = "https://github.com/settings/personal-access-tokens";

export async function setupGitHubPat(
  environmentPath: string,
  prompt: () => Promise<string> = promptForGitHubPat,
) {
  const environment = await readEnvironmentFile(environmentPath);
  if (environment["GITHUB_PAT"]?.trim()) {
    console.log("GitHub authentication is already configured.");
    return;
  }

  console.log(`
GitHub authentication setup:
1. Open ${GITHUB_TOKENS_URL}
2. Create a fine-grained personal access token.
3. Grant access only to the repository managed by Regalator.
4. Under Repository permissions, grant Contents: Read and write.`);

  const token = await prompt();
  await updateEnvironmentFile(environmentPath, { GITHUB_PAT: token });
  console.log("GitHub personal access token saved.");
}

async function promptForGitHubPat() {
  const token = await password({
    message: "GitHub personal access token",
    validate: (value) =>
      value?.trim() ? undefined : "This value is required.",
  });
  if (isCancel(token)) {
    cancel("Regalator setup cancelled.");
    throw new Error("Regalator setup cancelled.");
  }

  return token.trim();
}
