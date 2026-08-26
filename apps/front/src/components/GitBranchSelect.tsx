import { GitBranchIcon } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import { InputGroupAddon } from "./ui/input-group";

type BranchOption = {
  name: string;
  current: boolean;
};

export function GitBranchSelect({
  branches,
  value,
  onValueChange,
  disabled = false,
}: {
  branches: BranchOption[];
  value: string | null;
  onValueChange: (branch: string | null) => void;
  disabled?: boolean;
}) {
  const branchNames = branches.map(({ name }) => name);
  const currentBranch = branches.find(({ current }) => current)?.name;

  return (
    <Combobox items={branchNames} value={value} onValueChange={onValueChange}>
      <ComboboxInput
        className="w-full"
        disabled={disabled}
        placeholder="Select a branch"
      >
        <InputGroupAddon>
          <GitBranchIcon className="size-4" />
        </InputGroupAddon>
        {value === currentBranch && (
          <span className="opacity-50">checked out</span>
        )}
      </ComboboxInput>
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
