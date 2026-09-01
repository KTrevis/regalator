import { cancel, isCancel, password, text } from "@clack/prompts";
import type { ProjectConfig } from "@regalator/shared";
import { startNotionOAuthSession } from "../../../apps/back/src/notion/notion.oauth";
import { startNotionOAuthCallbackServer } from "../../../apps/back/src/notion/notion.oauth.server";
import { readEnvironmentFile, updateEnvironmentFile } from "./environment-file";

const NOTION_INTEGRATIONS_URL = "https://www.notion.so/profile/integrations";
const OAUTH_TIMEOUT_MS = 10 * 60 * 1_000;

export async function setupNotionOAuth(
  config: ProjectConfig,
  environmentPath: string,
) {
  const environment = await readEnvironmentFile(environmentPath);
  const existingAccessToken = environment["NOTION_ACCESS_TOKEN"]?.trim();
  const existingRefreshToken = environment["NOTION_REFRESH_TOKEN"]?.trim();
  const existingClientId = environment["NOTION_CLIENT_ID"]?.trim();
  const existingClientSecret = environment["NOTION_CLIENT_SECRET"]?.trim();

  if (
    existingAccessToken &&
    existingRefreshToken &&
    existingClientId &&
    existingClientSecret
  ) {
    console.log("Notion OAuth is already configured.");
    return;
  }

  const redirectUri = `${config.backendUrl}/api/notion/oauth/callback`;
  printNotionIntegrationInstructions(config, redirectUri);

  const clientId =
    existingClientId || (await askForCredential("Notion client ID", false));
  const clientSecret =
    existingClientSecret ||
    (await askForCredential("Notion client secret", true));

  await updateEnvironmentFile(environmentPath, {
    NOTION_CLIENT_ID: clientId,
    NOTION_CLIENT_SECRET: clientSecret,
  });

  if (existingAccessToken && existingRefreshToken) {
    console.log("Notion OAuth is already configured.");
    return;
  }

  const session = startNotionOAuthSession({
    clientId,
    clientSecret,
    redirectUri,
    onAuthorized: ({ accessToken, refreshToken }) =>
      updateEnvironmentFile(environmentPath, {
        NOTION_ACCESS_TOKEN: accessToken,
        NOTION_REFRESH_TOKEN: refreshToken,
      }),
  });
  let server: ReturnType<typeof startNotionOAuthCallbackServer> | undefined;

  try {
    server = startNotionOAuthCallbackServer(config.port);
    console.log(`
Open this URL to authorize Regalator in Notion:
${session.authorizationUrl}

Waiting for Notion authorization for up to 10 minutes...`);
    await withTimeout(session.completed, OAUTH_TIMEOUT_MS);
    console.log("Notion authorization completed and tokens saved.");
  } finally {
    session.cancel();
    await server?.stop();
  }
}

function printNotionIntegrationInstructions(
  config: ProjectConfig,
  redirectUri: string,
) {
  console.log(`
Notion OAuth setup:
1. Create or open a public Notion integration: ${NOTION_INTEGRATIONS_URL}
2. Add this OAuth redirect URI to the integration: ${redirectUri}
3. Ensure ${config.backendUrl} forwards to local port ${config.port}.`);
}

async function askForCredential(message: string, masked: boolean) {
  const options = { message, validate: validateRequiredValue };
  const answer = masked ? await password(options) : await text(options);
  if (isCancel(answer)) {
    cancel("Regalator setup cancelled.");
    throw new Error("Regalator setup cancelled.");
  }
  return answer.trim();
}

function validateRequiredValue(value?: string) {
  if (!value?.trim()) return "This value is required.";
}

async function withTimeout(promise: Promise<void>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error("Notion authorization timed out.")),
      timeoutMs,
    );
  });

  try {
    await Promise.race([promise, expired]);
  } finally {
    clearTimeout(timeout);
  }
}
