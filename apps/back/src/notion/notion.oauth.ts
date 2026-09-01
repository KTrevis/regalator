const NOTION_OAUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

export type NotionOAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type NotionOAuthSessionOptions = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  onAuthorized: (tokens: NotionOAuthTokens) => Promise<void>;
};

type NotionTokenResponse = {
  access_token?: string;
  refresh_token?: string | null;
  error?: string;
  error_description?: string;
};

type ActiveNotionOAuthSession = NotionOAuthSessionOptions & {
  resolve: () => void;
  state: string;
  tokensStored: boolean;
};

let activeSession: ActiveNotionOAuthSession | undefined;

export class NotionOAuthError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NotionOAuthError";
  }
}

export function startNotionOAuthSession(options: NotionOAuthSessionOptions) {
  if (activeSession) {
    throw new Error("A Notion OAuth setup session is already running.");
  }

  const { promise, resolve } = Promise.withResolvers<void>();
  const state = crypto.randomUUID();
  activeSession = {
    ...options,
    resolve,
    state,
    tokensStored: false,
  };

  const authorizationUrl = new URL(NOTION_OAUTH_URL);
  authorizationUrl.searchParams.set("client_id", options.clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("owner", "user");
  authorizationUrl.searchParams.set("redirect_uri", options.redirectUri);
  authorizationUrl.searchParams.set("state", state);

  return {
    authorizationUrl: authorizationUrl.toString(),
    completed: promise,
    cancel() {
      if (activeSession?.state === state) activeSession = undefined;
    },
  };
}

export async function exchangeNotionOAuthCode(code: string, state: string) {
  const session = activeSession;
  if (!session) {
    throw new NotionOAuthError(409, "No Notion OAuth setup is running.");
  }
  if (state !== session.state) {
    throw new NotionOAuthError(400, "Invalid Notion OAuth state.");
  }

  const response = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${session.clientId}:${session.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: session.redirectUri,
    }),
  });
  const data = (await response.json()) as NotionTokenResponse;

  if (!response.ok || !data.access_token || !data.refresh_token) {
    throw new NotionOAuthError(
      400,
      data.error_description ??
        data.error ??
        "Notion did not return access and refresh tokens.",
    );
  }

  await session.onAuthorized({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  session.tokensStored = true;
}

export function finishNotionOAuthResponse() {
  if (!activeSession?.tokensStored) return;

  const session = activeSession;
  activeSession = undefined;
  session.resolve();
}
