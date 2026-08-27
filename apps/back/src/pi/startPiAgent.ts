import {
  createAgentSession,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { CONFIG } from "../config";
import { AgentRunStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { commitWorktreeChanges } from "../utils/git/commitWorktreeChanges";
import { removeWorktree } from "../utils/git/gitWorktrees";

const DEFAULT_AGENT_TOOLS = ["read", "bash", "edit", "write"];

let modelRuntimePromise: Promise<ModelRuntime> | undefined;

type PiAgentInput = {
  title: string;
  description: string;
  cwd?: string;
  tools?: string[];
  agentRunId?: string;
  worktreePath?: string;
  notionPageId?: string;
  sessionFile?: string;
  images?: AgentImage[];
};

export type AgentImage = {
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
};

export function startPiAgent(input: PiAgentInput, label = "Pi agent") {
  void runPiAgent(input).catch((error) =>
    console.error(`${label} failed:`, error),
  );
}

async function runPiAgent({
  title,
  description,
  cwd = CONFIG.repoPath,
  tools = DEFAULT_AGENT_TOOLS,
  agentRunId,
  worktreePath,
  notionPageId,
  sessionFile,
  images = [],
}: PiAgentInput) {
  const { session } = await createSession(cwd, tools, sessionFile);
  let output = "";

  session.setSessionName(`Notion ticket: ${title}`);
  await markAgentRunAsRunning(
    agentRunId,
    session.sessionId,
    session.sessionFile,
  );

  const unsubscribe = session.subscribe((event) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta"
    ) {
      output += event.assistantMessageEvent.delta;
    }
  });

  try {
    await session.prompt(
      buildTicketPrompt(title, description, Boolean(sessionFile)),
      {
        images: images.map(({ mediaType, data }) => ({
          type: "image" as const,
          mimeType: mediaType,
          data,
        })),
      },
    );
    await cleanupCompletedWorktree(worktreePath, notionPageId);
    await markAgentRunAsCompleted(agentRunId, output);
  } catch (error) {
    await markAgentRunAsFailed(agentRunId, error);
    throw error;
  } finally {
    unsubscribe();
    session.dispose();
  }
}

async function createSession(
  cwd: string,
  tools: string[],
  sessionFile: string | undefined,
) {
  return createAgentSession({
    cwd,
    tools,
    modelRuntime: await getModelRuntime(),
    sessionManager: sessionFile
      ? SessionManager.open(sessionFile)
      : SessionManager.create(cwd),
  });
}

function getModelRuntime() {
  modelRuntimePromise ??= ModelRuntime.create();

  return modelRuntimePromise;
}

function markAgentRunAsRunning(
  agentRunId: string | undefined,
  sessionId: string,
  sessionFile: string | undefined,
) {
  if (!agentRunId) {
    return;
  }

  return prisma.agentRun.update({
    where: { id: agentRunId },
    data: {
      status: AgentRunStatus.RUNNING,
      piSessionId: sessionId,
      piSessionFile: sessionFile ?? null,
      startedAt: new Date(),
      completedAt: null,
      error: null,
    },
  });
}

async function cleanupCompletedWorktree(
  worktreePath: string | undefined,
  notionPageId: string | undefined,
) {
  if (!worktreePath || !notionPageId) {
    return;
  }

  await commitWorktreeChanges(worktreePath, `notion(${notionPageId})`);
  await removeWorktree(CONFIG.repoPath, worktreePath);
}

function markAgentRunAsCompleted(
  agentRunId: string | undefined,
  output: string,
) {
  if (!agentRunId) {
    return;
  }

  return prisma.agentRun.update({
    where: { id: agentRunId },
    data: {
      status: AgentRunStatus.COMPLETED,
      output,
      completedAt: new Date(),
    },
  });
}

function markAgentRunAsFailed(agentRunId: string | undefined, error: unknown) {
  if (!agentRunId) {
    return;
  }

  return prisma.agentRun.update({
    where: { id: agentRunId },
    data: {
      status: AgentRunStatus.FAILED,
      error: error instanceof Error ? error.message : "Pi agent failed",
      completedAt: new Date(),
    },
  });
}

function buildTicketPrompt(
  title: string,
  description: string,
  isFollowUp: boolean,
) {
  if (isFollowUp) {
    return `The user reviewed your work on "${title}" and requested these changes:

${description}

Implement the requested changes on the existing branch. Keep the current implementation unless the new instructions require changing it. Run the relevant checks and commit your changes before finishing.`;
  }

  return `You received a Notion ticket.

Title:
${title}

Description:
${description}

Implement the requested change in this repository.
Keep changes focused.
Follow the project conventions, run the relevant checks, and commit your changes before finishing.`;
}
