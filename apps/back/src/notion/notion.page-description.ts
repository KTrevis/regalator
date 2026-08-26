import { getNotionClient } from "./notion.client";
import { notionBlocksToMarkdown } from "./notion.markdown";

export async function getPageDescription(pageId: string) {
  const notion = await getNotionClient();

  if (!notion) {
    return;
  }

  const blocks = await notion.blocks.children.list({
    block_id: pageId,
  });

  return notionBlocksToMarkdown(
    blocks.results.filter((curr) => "type" in curr),
  );
}
