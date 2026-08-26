import { useGetBranches } from "../queries/git.query";
import { useGetSettings, useUpdateSettings } from "../queries/settings.query";
import { GitBranchPicker } from "./GitBranchPicker";

export function SettingsView() {
  const { data: branchData, isPending: branchesPending } = useGetBranches();
  const { data: settings, isPending: settingsPending } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const localBranches = (branchData?.branches ?? []).filter(
    ({ local }) => local,
  );

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-medium">Default branch</h2>
        <p className="text-xs text-muted-foreground">
          New agent runs start from this branch.
        </p>
      </div>
      <GitBranchPicker
        branches={localBranches}
        value={settings?.defaultBaseBranch ?? null}
        onConfirm={(defaultBaseBranch) =>
          updateSettings.mutate({ defaultBaseBranch })
        }
        disabled={branchesPending || settingsPending}
        pending={updateSettings.isPending}
      />
      {updateSettings.isPending && (
        <p className="text-xs text-muted-foreground">Saving...</p>
      )}
      {updateSettings.error && (
        <p className="text-xs text-destructive">
          Failed to update the default branch.
        </p>
      )}
    </section>
  );
}
