import { CONFIG } from "../config";
import { AgentRunStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { spawnPiAgent } from "../pi/spawnPiAgent";
import { createTaskWorktree } from "../utils/git/createTaskWorktree";
import { getPageDescription } from "./notion.page-description";
import { getPageTitle } from "./notion.title";
import type { NotionAutomationPageWebhookBody } from "./notion.webhook.types";

export async function startNotionAgentRun(
  webhookBody: NotionAutomationPageWebhookBody,
) {
  const pageId = webhookBody.data.id;
  const title = (await getPageTitle(pageId)) ?? pageId;
  const description = (await getPageDescription(pageId)) ?? "";
  const worktree = await createTaskWorktree({
    repositoryPath: CONFIG.repoPath,
    worktreesPath: CONFIG.worktreesPath,
    taskId: pageId,
    title,
    baseBranch: CONFIG.defaultBaseBranch,
  });
  const runningAgentRun = await getRunningAgentRun(pageId);

  if (runningAgentRun) {
    return {
      status: "already_running" as const,
      branchName: runningAgentRun.branchName,
      worktreePath: runningAgentRun.worktreePath,
    };
  }

  const agentRun = await upsertPendingAgentRun({
    notionPageId: pageId,
    notionTitle: title,
    notionUrl: webhookBody.data.url,
    branchName: worktree.branchName,
    worktreePath: worktree.worktreePath,
  });

  void spawnPiAgent({
    title,
    description,
    cwd: worktree.worktreePath,
    agentRunId: agentRun.id,
    worktreePath: worktree.worktreePath,
  }).catch((error) => {
    console.error("Pi agent failed:", error);
  });

  return {
    status: "accepted" as const,
    branchName: worktree.branchName,
    worktreePath: worktree.worktreePath,
  };
}

function getRunningAgentRun(notionPageId: string) {
  return prisma.agentRun.findFirst({
    where: {
      notionPageId,
      status: { in: [AgentRunStatus.PENDING, AgentRunStatus.RUNNING] },
    },
  });
}

type PendingAgentRunInput = {
  notionPageId: string;
  notionTitle: string;
  notionUrl: string;
  branchName: string;
  worktreePath: string;
};

function upsertPendingAgentRun(input: PendingAgentRunInput) {
  return prisma.agentRun.upsert({
    where: { notionPageId: input.notionPageId },
    create: {
      ...input,
      status: AgentRunStatus.PENDING,
    },
    update: {
      ...input,
      status: AgentRunStatus.PENDING,
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    },
  });
}
