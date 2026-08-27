import { getNotionClient } from "./notion.client";

export async function getPageTitle(pageId: string) {
  const notion = await getNotionClient();
  const res = await notion.pages.retrieve({ page_id: pageId });
  if (!("properties" in res)) {
    return "";
  }

  const title = Object.values(res.properties).find(
    (property) => property.type === "title",
  );

  return title?.title.map(({ plain_text }) => plain_text).join("") ?? "";
}
