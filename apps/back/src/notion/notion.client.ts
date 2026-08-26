import { Client } from "@notionhq/client";
import { getNotionTokenPath } from "./notion.oauth";

let cachedNotionClient: Client | undefined;

export async function getNotionClient() {
  if (cachedNotionClient) {
    return cachedNotionClient;
  }

  const tokenPath = getNotionTokenPath();
  const tokenFile = Bun.file(tokenPath);

  if (!(await tokenFile.exists())) {
    const err = `Notion token file not found at ${tokenPath}. Generate it from the Notion OAuth setup URL logged by the back end.`;
    console.error(err);
    throw new Error(err);
  }

  const token = (await tokenFile.text()).trim();

  if (!token) {
    const err = `Notion token file not found at ${tokenPath}. Generate it from the Notion OAuth setup URL logged by the back end.`;
    console.error(err);
    throw new Error(err);
  }

  cachedNotionClient = new Client({ auth: token });

  return cachedNotionClient;
}
