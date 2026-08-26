import { getNotionClient } from "./notion.client";

export async function getPageTitle(pageId: string) {
  const notion = await getNotionClient();
  const res = await notion.pages.retrieve({ page_id: pageId });
  if (!("properties" in res)) {
    return "";
  }
  const properties = res.properties;
  for (const [key, _] of Object.entries(properties)) {
    const property = properties[key];
    if (property && property.type == "title") {
      return property.title.map((curr) => curr.plain_text).join("");
    }
  }
  return "";
}
