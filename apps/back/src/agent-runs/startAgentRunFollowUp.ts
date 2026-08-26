import { CONFIG } from "../config";
import { AgentRunStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { type AgentImage, spawnPiAgent } from "../pi/spawnPiAgent";
import { createTaskWorktree } from "../utils/git/createTaskWorktree";
import { getBranches } from "../utils/git/getBranches";

export async function startAgentRunFollowUp(
  agentRunId: string,
  instruction: string,
  images: AgentImage[],
) {
  const agentRun = await prisma.agentRun.findUnique({
    where: { id: agentRunId },
  });

  if (!agentRun) {
    throw new Error("Agent run not found.");
  }

  if (
    agentRun.status === AgentRunStatus.PENDING ||
    agentRun.status === AgentRunStatus.RUNNING
  ) {
    throw new Error("The agent is already working on this ticket.");
  }

  if (!agentRun.piSessionFile) {
    throw new Error("This agent run cannot be continued.");
  }

  const branches = await getBranches(CONFIG.repoPath);
  const currentBranch = branches.find(({ current }) => current)?.name;

  if (currentBranch === agentRun.branchName) {
    throw new Error(
      "Switch to another branch before giving the agent new instructions.",
    );
  }

  const worktree = await createTaskWorktree({
    repositoryPath: CONFIG.repoPath,
    worktreesPath: CONFIG.worktreesPath,
    taskId: agentRun.notionPageId,
    title: agentRun.notionTitle,
    baseBranch: CONFIG.defaultBaseBranch,
  });

  void spawnPiAgent({
    title: agentRun.notionTitle,
    description: instruction,
    cwd: worktree.worktreePath,
    agentRunId: agentRun.id,
    worktreePath: worktree.worktreePath,
    notionPageId: agentRun.notionPageId,
    sessionFile: agentRun.piSessionFile,
    images,
  }).catch((error) => {
    console.error("Pi agent follow-up failed:", error);
  });

  return { status: "accepted" as const };
}
