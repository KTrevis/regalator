import { useEffect, useState } from "react";
import { CheckIcon } from "lucide-react";
import { GitBranchSelect } from "./GitBranchSelect";
import { Button } from "./ui/button";

type BranchOption = {
  name: string;
  current: boolean;
};

export function GitBranchPicker({
  branches,
  value,
  onConfirm,
  disabled = false,
  pending = false,
}: {
  branches: BranchOption[];
  value: string | null;
  onConfirm: (branch: string) => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const [selectedBranch, setSelectedBranch] = useState(value);

  useEffect(() => setSelectedBranch(value), [value]);

  const canConfirm = Boolean(
    selectedBranch && selectedBranch !== value && !disabled && !pending,
  );

  return (
    <div className="flex gap-1">
      <GitBranchSelect
        branches={branches}
        value={selectedBranch}
        onValueChange={setSelectedBranch}
        disabled={disabled || pending}
      />
      <Button
        aria-label="Confirm branch selection"
        disabled={!canConfirm}
        onClick={() => selectedBranch && onConfirm(selectedBranch)}
      >
        <CheckIcon />
      </Button>
    </div>
  );
}
