import { afterEach, expect, mock, test } from "bun:test";
import {
  startNotionOAuthSession,
  type NotionOAuthTokens,
} from "../src/notion/notion.oauth";
import { startNotionOAuthCallbackServer } from "../src/notion/notion.oauth.server";

const originalFetch = globalThis.fetch;
let session: ReturnType<typeof startNotionOAuthSession> | undefined;
let server: ReturnType<typeof startNotionOAuthCallbackServer> | undefined;

afterEach(async () => {
  globalThis.fetch = originalFetch;
  session?.cancel();
  session = undefined;
  await server?.stop();
  server = undefined;
});

test("exchanges the OAuth code and completes after storing both tokens", async () => {
  let storedTokens: NotionOAuthTokens | undefined;
  const storeTokens = mock(async (tokens: NotionOAuthTokens) => {
    storedTokens = tokens;
  });
  globalThis.fetch = mockNotionTokenExchange();
  session = startNotionOAuthSession({
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "https://regalator.example.com/api/notion/oauth/callback",
    onAuthorized: storeTokens,
  });
  server = startNotionOAuthCallbackServer(0);

  const authorizationUrl = new URL(session.authorizationUrl);
  const callbackUrl = new URL(
    "/api/notion/oauth/callback",
    `http://127.0.0.1:${server.server?.port}`,
  );
  callbackUrl.searchParams.set("code", "authorization-code");
  callbackUrl.searchParams.set(
    "state",
    authorizationUrl.searchParams.get("state")!,
  );

  const response = await fetch(callbackUrl);
  await session.completed;

  expect(response.status).toBe(200);
  expect(await response.text()).toContain("Notion authorization completed");
  expect(storeTokens).toHaveBeenCalledTimes(1);
  expect(storedTokens).toEqual({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  });
});

test("rejects a callback with the wrong state", async () => {
  session = startNotionOAuthSession({
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "https://regalator.example.com/api/notion/oauth/callback",
    onAuthorized: async () => {},
  });
  server = startNotionOAuthCallbackServer(0);

  const response = await fetch(
    `http://127.0.0.1:${server.server?.port}/api/notion/oauth/callback?code=test&state=wrong`,
  );

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "Invalid Notion OAuth state.",
  });
});

function mockNotionTokenExchange(): typeof fetch {
  return async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url !== "https://api.notion.com/v1/oauth/token") {
      return originalFetch(input, init);
    }

    expect(init?.headers).toEqual({
      Authorization: `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`,
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      grant_type: "authorization_code",
      code: "authorization-code",
      redirect_uri: "https://regalator.example.com/api/notion/oauth/callback",
    });

    return Response.json({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
  };
}
