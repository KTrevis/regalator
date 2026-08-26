import {
  createAgentSession,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { AgentRunStatus } from "../generated/prisma/enums";
import { CONFIG } from "../config";
import { prisma } from "../lib/prisma";

let modelRuntimePromise: Promise<ModelRuntime> | undefined;

export type SpawnPiAgentInput = {
  title: string;
  description: string;
  cwd?: string;
  tools?: string[];
  agentRunId?: string;
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
  tools = ["read", "bash", "edit", "write"],
  agentRunId,
}: SpawnPiAgentInput): Promise<SpawnPiAgentResult> {
  const modelRuntime = await getModelRuntime();
  const sessionManager = SessionManager.create(cwd);
  const { session } = await createAgentSession({
    cwd,
    modelRuntime,
    sessionManager,
    tools,
  });

  session.setSessionName(`Notion ticket: ${title}`);

  if (agentRunId) {
    await prisma.agentRun.update({
      where: { id: agentRunId },
      data: {
        status: AgentRunStatus.RUNNING,
        piSessionId: session.sessionId,
        piSessionFile: session.sessionFile ?? null,
        startedAt: new Date(),
        error: null,
      },
    });
  }

  let output = "";

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

    if (agentRunId) {
      await prisma.agentRun.update({
        where: { id: agentRunId },
        data: {
          status: AgentRunStatus.COMPLETED,
          output,
          completedAt: new Date(),
        },
      });
    }

    return {
      output,
      sessionFile: session.sessionFile,
      sessionId: session.sessionId,
    };
  } catch (error) {
    if (agentRunId) {
      await prisma.agentRun.update({
        where: { id: agentRunId },
        data: {
          status: AgentRunStatus.FAILED,
          error: error instanceof Error ? error.message : "Pi agent failed",
          completedAt: new Date(),
        },
      });
    }

    throw error;
  } finally {
    unsubscribe();
    session.dispose();
  }
}

function getModelRuntime() {
  modelRuntimePromise ??= ModelRuntime.create();

  return modelRuntimePromise;
}

function buildTicketPrompt({ title, description }: SpawnPiAgentInput) {
  return `You received a Notion ticket.

Title:
${title}

Description:
${description}

Implement the requested change in this repository.
Keep changes focused.
Follow the project conventions and run the relevant checks before finishing.`;
}
