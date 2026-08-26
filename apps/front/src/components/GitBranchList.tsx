import { useState } from "react";
import { Check, GitBranchIcon } from "lucide-react";
import { useGetBranches } from "../queries/git.query";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import { InputGroupAddon } from "./ui/input-group";
import { Button } from "./ui/button";

export function GitBranchList({
  onBranchSelected,
}: {
  onBranchSelected: (branch: string) => void;
}) {
  const { data, isPending, isError } = useGetBranches();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const branches = data?.branches ?? [];
  const branchNames = branches.map((branch) => branch.name);
  const currentBranch = branches.find((branch) => branch.current)?.name ?? null;
  const value = branchNames.includes(selectedBranch ?? "")
    ? selectedBranch
    : currentBranch;

  return (
    <Combobox
      items={branchNames}
      value={value}
      onValueChange={(branch) => setSelectedBranch(branch)}
    >
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
          onClick={() =>
            selectedBranch !== currentBranch &&
            selectedBranch &&
            onBranchSelected(selectedBranch)
          }
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
    </Combobox>
  );
}
