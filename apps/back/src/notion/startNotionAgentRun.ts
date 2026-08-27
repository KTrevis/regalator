import { ACTIVE_AGENT_RUN_STATUSES } from "../agent-runs/agent-run-status";
import { CONFIG } from "../config";
import { AgentRunStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { startPiAgent } from "../pi/startPiAgent";
import { getDefaultBaseBranch } from "../settings/settings.service";
import { createTaskWorktree } from "../utils/git/createTaskWorktree";
import { getPageDescription } from "./notion.page-description";
import { getPageTitle } from "./notion.title";

type NotionPageWebhook = {
  data: {
    id: string;
    url: string;
  };
};

export async function startNotionAgentRun(webhookBody: NotionPageWebhook) {
  const pageId = webhookBody.data.id;
  const runningAgentRun = await getRunningAgentRun(pageId);

  if (runningAgentRun) {
    return {
      status: "already_running" as const,
      branchName: runningAgentRun.branchName,
      worktreePath: runningAgentRun.worktreePath,
    };
  }

  const [pageTitle, description, baseBranch] = await Promise.all([
    getPageTitle(pageId),
    getPageDescription(pageId),
    getDefaultBaseBranch(),
  ]);
  const title = pageTitle || pageId;
  const worktree = await createTaskWorktree({
    repositoryPath: CONFIG.repoPath,
    worktreesPath: CONFIG.worktreesPath,
    taskId: pageId,
    title,
    baseBranch,
  });

  const agentRun = await upsertPendingAgentRun({
    notionPageId: pageId,
    notionTitle: title,
    notionUrl: webhookBody.data.url,
    branchName: worktree.branchName,
    worktreePath: worktree.worktreePath,
  });

  startPiAgent({
    title,
    description,
    cwd: worktree.worktreePath,
    agentRunId: agentRun.id,
    worktreePath: worktree.worktreePath,
    notionPageId: pageId,
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
      status: { in: ACTIVE_AGENT_RUN_STATUSES },
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
