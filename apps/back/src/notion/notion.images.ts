import type { AgentImage } from "../pi/startPiAgent";
import type { NotionImageSource } from "./notion.markdown";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_DOWNLOAD_TIMEOUT_MS = 10_000;
const SUPPORTED_IMAGE_TYPES = new Set<AgentImage["mediaType"]>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

type DownloadedNotionImage = AgentImage & { caption: string };
type ImageFetcher = (url: string, init: RequestInit) => Promise<Response>;

export async function downloadNotionImages(
  sources: NotionImageSource[],
  fetchImage: ImageFetcher = fetch,
) {
  const images = await Promise.all(
    sources
      .slice(0, MAX_IMAGES)
      .map((source) => downloadSafely(source, fetchImage)),
  );

  return images.filter(
    (image): image is DownloadedNotionImage => image !== undefined,
  );
}

async function downloadSafely(
  source: NotionImageSource,
  fetchImage: ImageFetcher,
) {
  try {
    return await downloadImage(source, fetchImage);
  } catch (error) {
    console.warn(`Failed to download Notion image: ${getErrorMessage(error)}`);
  }
}

async function downloadImage(
  source: NotionImageSource,
  fetchImage: ImageFetcher,
): Promise<DownloadedNotionImage> {
  const response = await fetchImage(source.url, {
    signal: AbortSignal.timeout(IMAGE_DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const mediaType = response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.toLowerCase();
  if (!mediaType || !isSupportedImageType(mediaType)) {
    throw new Error(`unsupported content type: ${mediaType ?? "missing"}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > MAX_IMAGE_BYTES) throw imageTooLargeError();

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw imageTooLargeError();

  return {
    caption: source.caption,
    mediaType,
    data: Buffer.from(bytes).toString("base64"),
  };
}

function isSupportedImageType(value: string): value is AgentImage["mediaType"] {
  return SUPPORTED_IMAGE_TYPES.has(value as AgentImage["mediaType"]);
}

function imageTooLargeError() {
  return new Error("image exceeds the 5 MB limit");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
