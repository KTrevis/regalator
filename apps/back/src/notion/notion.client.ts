import { Client } from "@notionhq/client";
import { getNotionTokenPath } from "./notion.oauth";

let cachedNotionClient: Client | undefined;

export async function getNotionClient() {
  if (cachedNotionClient) {
    return cachedNotionClient;
  }

  const tokenPath = getNotionTokenPath();
  const tokenFile = Bun.file(tokenPath);
  const token = (await tokenFile.exists())
    ? (await tokenFile.text()).trim()
    : "";

  if (!token) {
    throw new Error(
      `Notion token file not found at ${tokenPath}. Generate it from the Notion OAuth setup URL logged by the back end.`,
    );
  }

  cachedNotionClient = new Client({ auth: token });

  return cachedNotionClient;
}
