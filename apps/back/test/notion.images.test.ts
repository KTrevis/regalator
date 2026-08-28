import { expect, mock, test } from "bun:test";
import { downloadNotionImages } from "../src/notion/notion.images";

test("downloads supported Notion images as base64", async () => {
  const fetchImage = mock(
    async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/png; charset=binary" },
      }),
  );

  await expect(
    downloadNotionImages(
      [{ caption: "Checkout error", url: "https://example.com/image" }],
      fetchImage,
    ),
  ).resolves.toEqual([
    {
      caption: "Checkout error",
      mediaType: "image/png",
      data: "AQID",
    },
  ]);
});

test("skips unavailable and unsupported images", async () => {
  const fetchImage = mock(async (url: string) => {
    if (url.endsWith("missing")) return new Response(null, { status: 404 });
    return new Response("not an image", {
      headers: { "content-type": "text/plain" },
    });
  });

  const images = await downloadNotionImages(
    [
      { caption: "Missing", url: "https://example.com/missing" },
      { caption: "Text", url: "https://example.com/text" },
    ],
    fetchImage,
  );

  expect(images).toEqual([]);
});

test("downloads no more than five images", async () => {
  const fetchImage = mock(
    async () =>
      new Response(new Uint8Array([1]), {
        headers: { "content-type": "image/webp" },
      }),
  );
  const sources = Array.from({ length: 6 }, (_, index) => ({
    caption: `Image ${index + 1}`,
    url: `https://example.com/${index + 1}`,
  }));

  const images = await downloadNotionImages(sources, fetchImage);

  expect(images).toHaveLength(5);
  expect(fetchImage).toHaveBeenCalledTimes(5);
});

test("skips images larger than 5 MB", async () => {
  const fetchImage = mock(
    async () =>
      new Response(null, {
        headers: {
          "content-length": String(5 * 1024 * 1024 + 1),
          "content-type": "image/jpeg",
        },
      }),
  );

  const images = await downloadNotionImages(
    [{ caption: "Large", url: "https://example.com/large" }],
    fetchImage,
  );

  expect(images).toEqual([]);
});
