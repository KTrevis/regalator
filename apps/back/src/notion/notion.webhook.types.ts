import type { PageObjectResponse } from "@notionhq/client";

type NotionDataSourcePageParent = Extract<
  PageObjectResponse["parent"],
  { type: "data_source_id" }
>;

export type NotionAutomationWebhookSource = {
  type: "automation";
  automation_id: string;
  action_id: string;
  event_id: string;
  attempt: number;
};

export type NotionAutomationWebhookPage = Omit<
  PageObjectResponse,
  "archived" | "parent"
> & {
  parent: NotionDataSourcePageParent;
  request_id: string;
};

export type NotionAutomationPageWebhookBody = {
  source: NotionAutomationWebhookSource;
  data: NotionAutomationWebhookPage;
};
