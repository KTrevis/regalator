import { useState } from "react";
import {
  EllipsisVerticalIcon,
  GitBranchIcon,
  MessageCircleIcon,
  Trash2Icon,
} from "lucide-react";
import { useDeleteAgentRun } from "../queries/agent-runs.query";
import { AgentInstructionsSheet } from "./AgentInstructionsSheet";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type AgentRunActionsProps = {
  agentRunId: string;
  title: string;
  canContinue: boolean;
  branchCheckedOut: boolean;
  checkoutPending: boolean;
  onCheckout: () => void;
};

export function AgentRunActions({
  agentRunId,
  title,
  canContinue,
  branchCheckedOut,
  checkoutPending,
  onCheckout,
}: AgentRunActionsProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const deleteAgentRun = useDeleteAgentRun(agentRunId);

  const deleteRun = () => {
    const confirmed = window.confirm(
      `Delete the agent run for "${title}"? This action cannot be undone.`,
    );
    if (confirmed) deleteAgentRun.mutate();
  };

  return (
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
          {canContinue && (
            <>
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
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            disabled={deleteAgentRun.isPending}
            onClick={deleteRun}
          >
            <Trash2Icon />
            Delete run
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {canContinue && (
        <AgentInstructionsSheet
          agentRunId={agentRunId}
          title={title}
          open={instructionsOpen}
          onOpenChange={setInstructionsOpen}
        />
      )}
    </div>
  );
}
