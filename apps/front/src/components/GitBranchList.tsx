import { useGetBranches, useSwitchBranch } from "../queries/git.query";
import { GitBranchPicker } from "./GitBranchPicker";

export function GitBranchList() {
  const { data, isPending, isError } = useGetBranches();
  const switchBranch = useSwitchBranch();
  const branches = data?.branches ?? [];
  const currentBranch = branches.find(({ current }) => current)?.name ?? null;

  return (
    <div>
      <GitBranchPicker
        branches={branches}
        value={currentBranch}
        onConfirm={(branch) => switchBranch.mutate({ branch })}
        disabled={isPending || isError}
        pending={switchBranch.isPending}
      />
      {switchBranch.error && (
        <p className="mt-2 text-sm text-destructive">
          {switchBranch.error.message}
        </p>
      )}
    </div>
  );
}
