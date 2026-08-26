import { GitBranchIcon, LoaderCircle } from "lucide-react";
import { useGetAgentRuns } from "../queries/agent-runs.query";
import { useSwitchBranch } from "../queries/git.query";
import { Button } from "./ui/button";

const RUNNING_STATUSES = new Set(["PENDING", "RUNNING"]);

export const AgentRunList = () => {
  const { data, isLoading, error } = useGetAgentRuns();
  const switchBranch = useSwitchBranch();
  const agentRuns = data ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading agent runs...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load agent runs.</p>;
  }

  if (agentRuns.length === 0) {
    return <p className="text-sm text-muted-foreground">No agent runs yet.</p>;
  }

  return (
    <div className="space-y-2">
      {agentRuns.map((agentRun) => (
        <div
          key={agentRun.id}
          className="rounded-md border bg-background p-3 text-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {agentRun.notionUrl ? (
                <a
                  href={agentRun.notionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-medium underline-offset-2 hover:underline"
                >
                  {agentRun.notionTitle}
                </a>
              ) : (
                <p className="truncate font-medium">{agentRun.notionTitle}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {agentRun.branchName}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              {RUNNING_STATUSES.has(agentRun.status) && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              <span>{agentRun.status}</span>
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={`Checkout ${agentRun.branchName}`}
                title={`Checkout ${agentRun.branchName}`}
                disabled={switchBranch.isPending}
                onClick={() => switchBranch.mutate({ branch: agentRun.branchName })}
              >
                <GitBranchIcon className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
