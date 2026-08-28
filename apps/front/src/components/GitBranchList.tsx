import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import {
  useGetBranches,
  useIsUpdatingBranch,
  usePullBranch,
  useSwitchBranch,
} from "../queries/git.query";
import { GitBranchPicker } from "./GitBranchPicker";
import { Button } from "./ui/button";

export function GitBranchList() {
  const { data, isPending, isError } = useGetBranches();
  const switchBranch = useSwitchBranch();
  const pullBranch = usePullBranch();
  const isUpdatingBranch = useIsUpdatingBranch();
  const branches = data?.branches ?? [];
  const currentBranch = branches.find(({ current }) => current)?.name ?? null;
  const disabled = isPending || isError || isUpdatingBranch;

  return (
    <div className="flex gap-1">
      <div className="min-w-0 flex-1">
        <GitBranchPicker
          branches={branches}
          value={currentBranch}
          onConfirm={(branch) => switchBranch.mutate({ branch })}
          disabled={disabled}
          pending={switchBranch.isPending}
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        aria-label="Pull current branch"
        title="Pull current branch"
        disabled={disabled || !currentBranch}
        onClick={() => pullBranch.mutate()}
      >
        {pullBranch.isPending ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <DownloadIcon />
        )}
      </Button>
    </div>
  );
}
