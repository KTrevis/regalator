import type { BlockObjectResponse } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { getNotionClient } from "./notion.client";

export async function notionBlocksToMarkdown(blocks: BlockObjectResponse[]) {
  const notion = await getNotionClient();

  const notionToMarkdown = new NotionToMarkdown({ notionClient: notion });
  const markdownBlocks = await notionToMarkdown.blocksToMarkdown(blocks);
  const markdownByPage = notionToMarkdown.toMarkdownString(markdownBlocks);

  return Object.values(markdownByPage).join("\n").trim();
}
