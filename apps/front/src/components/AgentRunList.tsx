import { GitBranchIcon, LoaderCircle } from "lucide-react";
import { useGetAgentRuns } from "../queries/agent-runs.query";
import { useSwitchBranch } from "../queries/git.query";
import { Button } from "./ui/button";

const RUNNING_STATUSES = new Set(["PENDING", "RUNNING"]);

type AgentRun = NonNullable<ReturnType<typeof useGetAgentRuns>["data"]>[number];

export const AgentRunList = () => {
  const { data: agentRuns = [], isLoading, error } = useGetAgentRuns();
  const switchBranch = useSwitchBranch();

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
        <AgentRunCard
          key={agentRun.id}
          agentRun={agentRun}
          checkoutPending={switchBranch.isPending}
          onCheckout={() => switchBranch.mutate({ branch: agentRun.branchName })}
        />
      ))}
    </div>
  );
};

function AgentRunCard({
  agentRun,
  checkoutPending,
  onCheckout,
}: {
  agentRun: AgentRun;
  checkoutPending: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="rounded-md border bg-background p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={agentRun.notionUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate font-medium underline-offset-2 hover:underline"
          >
            {agentRun.notionTitle}
          </a>
          <p className="truncate text-xs text-muted-foreground">
            {agentRun.branchName}
          </p>
        </div>
        <AgentRunStatusActions
          status={agentRun.status}
          branchName={agentRun.branchName}
          checkoutPending={checkoutPending}
          onCheckout={onCheckout}
        />
      </div>
    </div>
  );
}

function AgentRunStatusActions({
  status,
  branchName,
  checkoutPending,
  onCheckout,
}: {
  status: AgentRun["status"];
  branchName: string;
  checkoutPending: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
      {RUNNING_STATUSES.has(status) && (
        <LoaderCircle className="size-4 animate-spin" />
      )}
      <span>{status}</span>
      {status === "COMPLETED" && (
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={`Checkout ${branchName}`}
          title={`Checkout ${branchName}`}
          disabled={checkoutPending}
          onClick={onCheckout}
        >
          <GitBranchIcon className="size-3" />
        </Button>
      )}
    </div>
  );
}
