import { useState } from "react";
import { Check, GitBranchIcon } from "lucide-react";
import { useGetBranches, useSwitchBranch } from "../queries/git.query";
import { Button } from "./ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import { InputGroupAddon } from "./ui/input-group";

export function GitBranchList() {
  const { data, isPending, isError } = useGetBranches();
  const switchBranch = useSwitchBranch();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const branches = data?.branches ?? [];
  const branchNames = branches.map((branch) => branch.name);
  const currentBranch = branches.find((branch) => branch.current)?.name ?? null;
  const branchToCheckout = selectedBranch ?? currentBranch;
  const selectedBranchExists = branchToCheckout
    ? branchNames.includes(branchToCheckout)
    : false;
  const value = selectedBranchExists ? branchToCheckout : currentBranch;
  const canCheckout = Boolean(value && value !== currentBranch);

  return (
    <Combobox items={branchNames} value={value} onValueChange={setSelectedBranch}>
      <div className="flex gap-1">
        <ComboboxInput
          className="w-full"
          disabled={isPending || isError}
          placeholder="Select a branch"
        >
          <InputGroupAddon>
            <GitBranchIcon className="size-4" />
          </InputGroupAddon>
          {value === currentBranch && (
            <span className="opacity-50">checked out</span>
          )}
        </ComboboxInput>
        <Button
          disabled={!canCheckout || switchBranch.isPending}
          onClick={() => value && switchBranch.mutate({ branch: value })}
        >
          <Check />
        </Button>
      </div>
      <ComboboxContent>
        <ComboboxEmpty>No branches found.</ComboboxEmpty>
        <ComboboxList>
          {(branchName) => (
            <ComboboxItem key={branchName} value={branchName}>
              <div className="flex w-full justify-between">
                <span className="truncate">{branchName}</span>
                {branchName === currentBranch && (
                  <span className="opacity-50">checked out</span>
                )}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
      {switchBranch.error && (
        <p className="mt-2 text-sm text-destructive">
          {switchBranch.error.message}
        </p>
      )}
    </Combobox>
  );
}
