import { CONFIG } from "../config";
import { prisma } from "../lib/prisma";
import { type AgentImage, startPiAgent } from "../pi/startPiAgent";
import { getDefaultBaseBranch } from "../settings/settings.service";
import { createTaskWorktree } from "../utils/git/createTaskWorktree";
import { getBranches } from "../utils/git/getBranches";
import { isAgentRunActive } from "./agent-run-status";

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

  if (isAgentRunActive(agentRun.status)) {
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
    baseBranch: await getDefaultBaseBranch(),
  });

  startPiAgent(
    {
      title: agentRun.notionTitle,
      description: instruction,
      cwd: worktree.worktreePath,
      agentRunId: agentRun.id,
      worktreePath: worktree.worktreePath,
      notionPageId: agentRun.notionPageId,
      sessionFile: agentRun.piSessionFile,
      images,
    },
    "Pi agent follow-up",
  );

  return { status: "accepted" as const };
}
