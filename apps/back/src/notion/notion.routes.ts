import Elysia from "elysia";
import { CONFIG } from "../config";
import { AgentRunStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { spawnPiAgent } from "../pi/spawnPiAgent";
import { createTaskWorktree } from "../utils/git/createTaskWorktree";
import {
  fetchNotionAccessToken,
  getNotionTokenPath,
  NotionOAuthError,
} from "./notion.oauth";
import type { NotionAutomationPageWebhookBody } from "./notion.webhook.types";
import { getPageTitle } from "./notion.title";
import { getPageDescription } from "./notion.page-description";

export const NOTION_ROUTES = new Elysia({ prefix: "/notion" })
  .get("/oauth/callback", async ({ query, set }) => {
    const code = typeof query["code"] === "string" ? query["code"] : undefined;

    if (!code) {
      set.status = 400;
      return { error: "Missing Notion OAuth code" };
    }

    try {
      const accessToken = await fetchNotionAccessToken(code);

      return {
        accessToken,
        tokenPath: getNotionTokenPath(),
      };
    } catch (error) {
      set.status = error instanceof NotionOAuthError ? error.status : 500;

      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Notion API key",
      };
    }
  })
  .post("/webhook", async ({ body, set }) => {
    const webhookBody = body as NotionAutomationPageWebhookBody;
    const pageId = webhookBody.data.id;
    const title = await getPageTitle(pageId);
    const description = await getPageDescription(pageId);
    const notionUrl = webhookBody.data.url;
    const ticketTitle = title ?? pageId;
    const ticketDescription = description ?? "";
    const worktree = await createTaskWorktree({
      repositoryPath: CONFIG.repoPath,
      worktreesPath: CONFIG.worktreesPath,
      taskId: pageId,
      title: ticketTitle,
      baseBranch: CONFIG.defaultBaseBranch,
    });
    const existingAgentRun = await prisma.agentRun.findUnique({
      where: { notionPageId: pageId },
    });

    if (
      existingAgentRun?.status === AgentRunStatus.PENDING ||
      existingAgentRun?.status === AgentRunStatus.RUNNING
    ) {
      set.status = 202;

      return {
        status: "already_running" as const,
        branchName: existingAgentRun.branchName,
        worktreePath: existingAgentRun.worktreePath,
      };
    }

    const agentRun = await prisma.agentRun.upsert({
      where: { notionPageId: pageId },
      create: {
        notionPageId: pageId,
        notionTitle: ticketTitle,
        notionUrl,
        branchName: worktree.branchName,
        worktreePath: worktree.worktreePath,
        status: AgentRunStatus.PENDING,
      },
      update: {
        notionTitle: ticketTitle,
        notionUrl,
        branchName: worktree.branchName,
        worktreePath: worktree.worktreePath,
        status: AgentRunStatus.PENDING,
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
      },
    });

    void spawnPiAgent({
      title: ticketTitle,
      description: ticketDescription,
      cwd: worktree.worktreePath,
      agentRunId: agentRun.id,
    }).catch((error) => {
      console.error("Pi agent failed:", error);
    });

    set.status = 202;

    return {
      status: "accepted" as const,
      branchName: worktree.branchName,
      worktreePath: worktree.worktreePath,
    };
  });
