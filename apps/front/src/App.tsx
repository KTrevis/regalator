import { useEffect, useState } from "react";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import { AgentRunList } from "./components/AgentRunList";
import { DraggableLauncher } from "./components/DraggableLauncher";
import { GitBranchList } from "./components/GitBranchList";
import { SettingsView } from "./components/SettingsView";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./components/ui/sheet";
import {
  notifyDrawerState,
  subscribeToHostDrawerClose,
} from "./lib/embed-frame";

export const App = () => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"runs" | "settings">("runs");

  const setDrawerOpen = (nextOpen: boolean) => {
    notifyDrawerState(nextOpen);
    setOpen(nextOpen);
    if (!nextOpen) setView("runs");
  };

  useEffect(() => subscribeToHostDrawerClose(() => setDrawerOpen(false)), []);

  return (
    <main className="remote-kanban-app">
      <Sheet open={open} onOpenChange={setDrawerOpen}>
        <DraggableLauncher onOpen={() => setDrawerOpen(true)} />
        <SheetContent className="!w-full !max-w-none">
          {view === "runs" ? (
            <RunsView onOpenSettings={() => setView("settings")} />
          ) : (
            <SettingsDrawerView onBack={() => setView("runs")} />
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
};

function RunsView({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <>
      <SheetHeader />
      <div className="mx-3 flex-1 space-y-6 overflow-y-auto">
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Branches</h2>
          <GitBranchList />
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Agent runs</h2>
          <AgentRunList />
        </section>
      </div>
      <div className="mt-auto border-t p-3">
        <Button
          className="w-full justify-start"
          variant="ghost"
          onClick={onOpenSettings}
        >
          <SettingsIcon />
          Settings
        </Button>
      </div>
    </>
  );
}

function SettingsDrawerView({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SheetHeader className="flex-row items-center gap-2 pr-12">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to agent runs"
          onClick={onBack}
        >
          <ArrowLeftIcon />
        </Button>
        <SheetTitle>Settings</SheetTitle>
      </SheetHeader>
      <div className="mx-4">
        <SettingsView />
      </div>
    </>
  );
}
