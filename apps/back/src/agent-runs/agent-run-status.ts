import { AgentRunStatus } from "../generated/prisma/enums";

export const ACTIVE_AGENT_RUN_STATUSES: AgentRunStatus[] = [
  AgentRunStatus.PENDING,
  AgentRunStatus.RUNNING,
];

export function isAgentRunActive(status: AgentRunStatus) {
  return ACTIVE_AGENT_RUN_STATUSES.includes(status);
}
