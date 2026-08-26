import {
  createAgentSession,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { CONFIG } from "../config";
import { AgentRunStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { removeWorktree } from "../utils/git/gitWorktrees";

const DEFAULT_AGENT_TOOLS = ["read", "bash", "edit", "write"];

let modelRuntimePromise: Promise<ModelRuntime> | undefined;

export type SpawnPiAgentInput = {
  title: string;
  description: string;
  cwd?: string;
  tools?: string[];
  agentRunId?: string;
  worktreePath?: string;
};

export type SpawnPiAgentResult = {
  output: string;
  sessionFile: string | undefined;
  sessionId: string;
};

export async function spawnPiAgent({
  title,
  description,
  cwd = CONFIG.repoPath,
  tools = DEFAULT_AGENT_TOOLS,
  agentRunId,
  worktreePath,
}: SpawnPiAgentInput): Promise<SpawnPiAgentResult> {
  const { session } = await createSession(cwd, tools);
  let output = "";

  session.setSessionName(`Notion ticket: ${title}`);
  await markAgentRunAsRunning(agentRunId, session.sessionId, session.sessionFile);

  const unsubscribe = session.subscribe((event) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta"
    ) {
      output += event.assistantMessageEvent.delta;
    }
  });

  try {
    await session.prompt(buildTicketPrompt({ title, description }));
    await cleanupCompletedWorktree(worktreePath);
    await markAgentRunAsCompleted(agentRunId, output);

    return {
      output,
      sessionFile: session.sessionFile,
      sessionId: session.sessionId,
    };
  } catch (error) {
    await markAgentRunAsFailed(agentRunId, error);
    throw error;
  } finally {
    unsubscribe();
    session.dispose();
  }
}

async function createSession(cwd: string, tools: string[]) {
  return createAgentSession({
    cwd,
    tools,
    modelRuntime: await getModelRuntime(),
    sessionManager: SessionManager.create(cwd),
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
      error: null,
    },
  });
}

async function cleanupCompletedWorktree(worktreePath: string | undefined) {
  if (worktreePath) {
    await removeWorktree(CONFIG.repoPath, worktreePath);
  }
}

function markAgentRunAsCompleted(agentRunId: string | undefined, output: string) {
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

function buildTicketPrompt({ title, description }: SpawnPiAgentInput) {
  return `You received a Notion ticket.

Title:
${title}

Description:
${description}

Implement the requested change in this repository.
Keep changes focused.
Follow the project conventions, run the relevant checks, and commit your changes before finishing.`;
}
