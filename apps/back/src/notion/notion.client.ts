import { Client } from "@notionhq/client";
import { environment } from "../environment";

let cachedNotionClient: Client | undefined;

export async function getNotionClient() {
  if (cachedNotionClient) {
    return cachedNotionClient;
  }

  const token = environment.notionAccessToken;

  if (!token) {
    throw new Error("Missing NOTION_ACCESS_TOKEN. Run Regalator setup again.");
  }

  cachedNotionClient = new Client({ auth: token });

  return cachedNotionClient;
}
