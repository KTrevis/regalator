import type { AgentImage } from "../pi/startPiAgent";
import { downloadNotionImages } from "./notion.images";
import { notionPageToMarkdown } from "./notion.markdown";

export async function getPageContent(pageId: string) {
  const { description, imageSources } = await notionPageToMarkdown(pageId);
  const images = await downloadNotionImages(imageSources);

  return {
    description: addImageSummary(description, images),
    images: images.map(({ mediaType, data }) => ({ mediaType, data })),
  };
}

function addImageSummary(
  description: string,
  images: Array<AgentImage & { caption: string }>,
) {
  if (images.length === 0) return description;

  const summary = images
    .map(({ caption }, index) => `${index + 1}. ${caption || "Untitled image"}`)
    .join("\n");

  return `${description}\n\nAttached ticket images, in page order:\n${summary}`.trim();
}
