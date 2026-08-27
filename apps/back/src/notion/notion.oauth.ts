const NOTION_TOKEN_PATH = new URL("./notion-token.txt", import.meta.url)
  .pathname;

const NOTION_OAUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

type NotionTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export class NotionOAuthError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NotionOAuthError";
  }
}

export async function storeNotionAccessToken(code: string) {
  const clientId = getNotionClientId();
  const clientSecret = getNotionClientSecret();
  const redirectUri = getNotionRedirectUri();

  if (!clientId || !clientSecret) {
    throw new NotionOAuthError(
      500,
      "Missing NOTION_CLIENT_ID or NOTION_CLIENT_SECRET",
    );
  }

  const tokenResponse = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = (await tokenResponse.json()) as NotionTokenResponse;

  if (!tokenResponse.ok || !data.access_token) {
    throw new NotionOAuthError(
      400,
      data.error_description ?? data.error ?? "Failed to fetch Notion token",
    );
  }

  await Bun.write(NOTION_TOKEN_PATH, data.access_token);
}

function getNotionAuthorizationUrl() {
  const clientId = getNotionClientId();

  if (!clientId) {
    return;
  }

  const url = new URL(NOTION_OAUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", getNotionRedirectUri());

  return url.toString();
}

function getNotionRedirectUri() {
  return `${getBackPublicUrl()}/api/notion/oauth/callback`;
}

export function getNotionTokenPath() {
  return NOTION_TOKEN_PATH;
}

export function logNotionSetupInstructions() {
  const authorizationUrl = getNotionAuthorizationUrl();
  const missingVariables = [
    getNotionClientId() ? undefined : "NOTION_CLIENT_ID",
    getNotionClientSecret() ? undefined : "NOTION_CLIENT_SECRET",
  ].filter((variable): variable is string => Boolean(variable));

  console.log("\nNotion API key generation setup:");
  console.log(
    "1. Create a Notion OAuth integration: https://www.notion.so/my-integrations",
  );
  console.log(`2. Register this redirect URI: ${getNotionRedirectUri()}`);
  console.log(
    "3. Add NOTION_CLIENT_ID and NOTION_CLIENT_SECRET to apps/back/.env",
  );
  console.log(
    `4. The generated token will be saved to: ${getNotionTokenPath()}`,
  );

  if (missingVariables.length > 0) {
    console.log(`Missing Notion env variables: ${missingVariables.join(", ")}`);
    return;
  }

  console.log(
    `Open this URL to generate a Notion API key: ${authorizationUrl}`,
  );
}

function getNotionClientId() {
  return Bun.env["NOTION_CLIENT_ID"]?.trim();
}

function getNotionClientSecret() {
  return Bun.env["NOTION_CLIENT_SECRET"]?.trim();
}

function getBackPublicUrl() {
  return Bun.env["BACK_PUBLIC_URL"]?.trim() || `http://localhost:${getPort()}`;
}

function getPort() {
  return Bun.env["PORT"]?.trim() || "3000";
}
