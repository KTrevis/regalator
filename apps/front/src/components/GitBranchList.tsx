import { useState } from "react";
import { GitBranchIcon } from "lucide-react";
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

export function GitBranchList() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const { data, isPending, isError } = useGetBranches();

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
      <ComboboxInput
        className="w-full"
        disabled={isPending || isError}
        placeholder={"Sélectionner une branche"}
      >
        <InputGroupAddon>
          <GitBranchIcon className="size-4" />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>Aucune branche trouvée.</ComboboxEmpty>
        <ComboboxList>
          {(branchName) => (
            <ComboboxItem key={branchName} value={branchName}>
              <span className="truncate">{branchName}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
