import { NotionToMarkdown } from "notion-to-md";
import { getNotionClient } from "./notion.client";

export type NotionImageSource = {
  caption: string;
  url: string;
};

export async function notionPageToMarkdown(pageId: string) {
  const notion = await getNotionClient();
  const notionToMarkdown = new NotionToMarkdown({ notionClient: notion });
  const imageSources: NotionImageSource[] = [];

  notionToMarkdown.setCustomTransformer("image", (block) => {
    if (!("type" in block) || block.type !== "image") return false;

    const image = block.image;
    const caption = image.caption.map(({ plain_text }) => plain_text).join("");
    const url = image.type === "file" ? image.file.url : image.external.url;

    if (image.type === "file") imageSources.push({ caption, url });

    return `![${caption || "image"}](${url})`;
  });

  const markdownBlocks = await notionToMarkdown.pageToMarkdown(pageId);
  const markdownByPage = notionToMarkdown.toMarkdownString(markdownBlocks);

  return {
    description: Object.values(markdownByPage).join("\n").trim(),
    imageSources,
  };
}
