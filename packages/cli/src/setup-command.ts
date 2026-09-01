import { cancel, isCancel, text } from "@clack/prompts";
import type { ProjectConfig } from "@regalator/shared";
import { findGitRepositoryRoot } from "./git-repository";
import { setupGitHubPat } from "./github-setup";
import { setupNotionOAuth } from "./notion-setup";
import { readExistingConfig, setupProject } from "./project-setup";

const START_COMMAND =
  "bunx --package https://github.com/KTrevis/regalator/releases/latest/download/regalator-cli.tgz regalator start";

export async function runSetup(directory: string) {
  const repositoryPath = await findGitRepositoryRoot(directory);
  const existingConfig = await readExistingConfig(repositoryPath);
  const config = existingConfig ?? (await promptForConfig(repositoryPath));
  const result = await setupProject(repositoryPath, config);
  await setupGitHubPat(result.files.environment);
  await setupNotionOAuth(config, result.files.environment);

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
2. Configure the Notion automation webhook: ${webhookUrl}
3. Commit the versioned .regalator files and propagate them to every branch that Regalator may select.
4. Start Regalator: ${START_COMMAND}`);
}
