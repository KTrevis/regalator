import { useState } from "react";
import {
  EllipsisVerticalIcon,
  GitBranchIcon,
  LoaderCircle,
  MessageCircleIcon,
} from "lucide-react";
import { useGetAgentRuns } from "../queries/agent-runs.query";
import { useGetBranches, useSwitchBranch } from "../queries/git.query";
import { AgentInstructionsSheet } from "./AgentInstructionsSheet";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const RUNNING_STATUSES = new Set(["PENDING", "RUNNING"]);

type AgentRun = NonNullable<ReturnType<typeof useGetAgentRuns>["data"]>[number];

export const AgentRunList = () => {
  const { data: agentRuns = [], isLoading, error } = useGetAgentRuns();
  const { data: branchData } = useGetBranches();
  const switchBranch = useSwitchBranch();
  const currentBranch = branchData?.branches.find(
    ({ current }) => current,
  )?.name;

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading agent runs...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">Failed to load agent runs.</p>
    );
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
          branchCheckedOut={agentRun.branchName === currentBranch}
          onCheckout={() =>
            switchBranch.mutate({ branch: agentRun.branchName })
          }
        />
      ))}
    </div>
  );
};

function AgentRunCard({
  agentRun,
  checkoutPending,
  branchCheckedOut,
  onCheckout,
}: {
  agentRun: AgentRun;
  checkoutPending: boolean;
  branchCheckedOut: boolean;
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
          agentRunId={agentRun.id}
          title={agentRun.notionTitle}
          status={agentRun.status}
          branchName={agentRun.branchName}
          checkoutPending={checkoutPending}
          branchCheckedOut={branchCheckedOut}
          onCheckout={onCheckout}
        />
      </div>
    </div>
  );
}

function AgentRunStatusActions({
  agentRunId,
  title,
  status,
  branchName,
  checkoutPending,
  branchCheckedOut,
  onCheckout,
}: {
  agentRunId: string;
  title: string;
  status: AgentRun["status"];
  branchName: string;
  checkoutPending: boolean;
  branchCheckedOut: boolean;
  onCheckout: () => void;
}) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-start gap-2 text-xs text-muted-foreground">
      <div className="flex h-7 items-center gap-2">
        {RUNNING_STATUSES.has(status) && (
          <LoaderCircle className="size-4 animate-spin" />
        )}
      </div>
      {status === "COMPLETED" && (
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-xs"
                  aria-label="Open run actions"
                  title="More actions"
                />
              }
            >
              <EllipsisVerticalIcon className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <Tooltip>
                <TooltipTrigger render={<div />}>
                  <DropdownMenuItem
                    disabled={branchCheckedOut}
                    onClick={() => setInstructionsOpen(true)}
                  >
                    <MessageCircleIcon />
                    Give new instructions
                  </DropdownMenuItem>
                </TooltipTrigger>
                {branchCheckedOut && (
                  <TooltipContent side="left">
                    This branch is currently checked out. Switch to another
                    branch before giving new instructions.
                  </TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuItem disabled={checkoutPending} onClick={onCheckout}>
                <GitBranchIcon />
                Switch to branch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AgentInstructionsSheet
            agentRunId={agentRunId}
            title={title}
            open={instructionsOpen}
            onOpenChange={setInstructionsOpen}
          />
        </div>
      )}
    </div>
  );
}
