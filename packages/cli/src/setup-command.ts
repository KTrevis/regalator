import { cancel, isCancel, text } from "@clack/prompts";
import type { ProjectConfig } from "@regalator/shared";
import { findGitRepositoryRoot } from "./git-repository";
import { readExistingConfig, setupProject } from "./project-setup";

export async function runSetup(directory: string) {
  const repositoryPath = await findGitRepositoryRoot(directory);
  const existingConfig = await readExistingConfig(repositoryPath);
  const config = existingConfig ?? (await promptForConfig(repositoryPath));
  const result = await setupProject(repositoryPath, config);

  printSetupSummary(repositoryPath, result);
}

async function promptForConfig(repositoryPath: string): Promise<ProjectConfig> {
  const backendUrl = await askForText({
    message: "Public Regalator URL",
    validate: validateHttpUrl,
  });
  const projectHealthcheckUrl = await askForText({
    message: "Managed project healthcheck URL",
    validate: validateHttpUrl,
  });
  const portInput = await askForText({
    message: "Local Regalator port",
    initialValue: "3000",
    validate: validatePort,
  });
  const worktreesPath = await askForText({
    message: "Worktrees path",
    initialValue: `${repositoryPath}-worktrees`,
  });

  return {
    backendUrl: removeTrailingSlash(backendUrl),
    projectHealthcheckUrl,
    port: Number(portInput),
    worktreesPath,
  };
}

type TextPromptOptions = Parameters<typeof text>[0];

async function askForText(options: TextPromptOptions) {
  const answer = await text(options);
  if (isCancel(answer)) {
    cancel("Regalator setup cancelled.");
    throw new Error("Regalator setup cancelled.");
  }
  return answer.trim();
}

function validateHttpUrl(value?: string) {
  if (!value?.trim()) return "This URL is required.";

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Use an HTTP or HTTPS URL.";
    }
  } catch {
    return "Enter a valid URL.";
  }
}

function validatePort(value?: string) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    return "Enter an integer between 1 and 65535.";
  }
}

function removeTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function printSetupSummary(
  repositoryPath: string,
  result: Awaited<ReturnType<typeof setupProject>>,
) {
  const { config, created, files } = result;
  const webhookUrl = `${config.backendUrl}/api/notion/webhook`;
  const redirectUrl = `${config.backendUrl}/api/notion/oauth/callback`;

  console.log(`\nRegalator is configured for ${repositoryPath}.`);
  if (created.length > 0) {
    console.log(`Created:\n${created.map((path) => `- ${path}`).join("\n")}`);
  } else {
    console.log(
      "All Regalator project files already exist; nothing was overwritten.",
    );
  }

  console.log(`
Next steps:
1. Complete ${files.checkoutHook} and ${files.startupScript}.
2. Create a fine-grained GitHub personal access token for this repository with Contents: Read and write, then add it as GITHUB_PAT in ${files.environment}.
3. Create a Notion OAuth integration and add NOTION_CLIENT_ID and NOTION_CLIENT_SECRET to ${files.environment}.
4. Register this Notion redirect URI: ${redirectUrl}
5. Configure the Notion automation webhook: ${webhookUrl}
6. Expose ${config.backendUrl} through your preferred public HTTPS proxy or tunnel.
7. Commit the versioned .regalator files and propagate them to every branch that Regalator may select.
8. Start Regalator: bunx @regalator/cli start`);
}
