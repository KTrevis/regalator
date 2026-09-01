import { afterEach, expect, mock, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readEnvironmentFile } from "../src/environment-file";
import { setupNotionOAuth } from "../src/notion-setup";

const originalFetch = globalThis.fetch;
const originalConsoleLog = console.log;
let temporaryDirectory: string | undefined;

afterEach(async () => {
  globalThis.fetch = originalFetch;
  console.log = originalConsoleLog;
  if (!temporaryDirectory) return;
  await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

test("completes OAuth during setup and stores the returned tokens", async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "regalator-notion-setup-"));
  const environmentPath = join(temporaryDirectory, ".env");
  await writeFile(
    environmentPath,
    "NOTION_CLIENT_ID=client-id\nNOTION_CLIENT_SECRET=client-secret\nNOTION_ACCESS_TOKEN=\nNOTION_REFRESH_TOKEN=\n",
  );
  const port = getAvailablePort();
  const callbackRequest = Promise.withResolvers<void>();

  globalThis.fetch = mockNotionTokenExchange();
  console.log = mock((...values: unknown[]) => {
    const authorizationUrl = values
      .join(" ")
      .match(/https:\/\/api\.notion\.com\/v1\/oauth\/authorize\?\S+/)?.[0];
    if (!authorizationUrl) return;

    void completeAuthorization(authorizationUrl, port).then(
      callbackRequest.resolve,
      callbackRequest.reject,
    );
  });

  await setupNotionOAuth(
    {
      backendUrl: `http://127.0.0.1:${port}`,
      projectHealthcheckUrl: "http://127.0.0.1:8080/health",
      port,
    },
    environmentPath,
  );
  await callbackRequest.promise;

  expect(await readEnvironmentFile(environmentPath)).toEqual({
    NOTION_CLIENT_ID: "client-id",
    NOTION_CLIENT_SECRET: "client-secret",
    NOTION_ACCESS_TOKEN: "access-token",
    NOTION_REFRESH_TOKEN: "refresh-token",
  });
});

async function completeAuthorization(authorizationUrl: string, port: number) {
  const state = new URL(authorizationUrl).searchParams.get("state");
  const callbackUrl = new URL(
    "/api/notion/oauth/callback",
    `http://127.0.0.1:${port}`,
  );
  callbackUrl.searchParams.set("code", "authorization-code");
  callbackUrl.searchParams.set("state", state!);

  const response = await fetch(callbackUrl);
  expect(response.status).toBe(200);
}

function mockNotionTokenExchange(): typeof fetch {
  return (async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url !== "https://api.notion.com/v1/oauth/token") {
      return originalFetch(input, init);
    }

    return Response.json({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
  }) as typeof fetch;
}

function getAvailablePort(): number {
  const server = Bun.serve({ port: 0, fetch: () => new Response() });
  const port = server.port;
  server.stop(true);
  if (!port) throw new Error("Unable to allocate a test port.");
  return port;
}
