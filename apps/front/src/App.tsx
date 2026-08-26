import { useState } from "react";
import { GitBranchIcon } from "lucide-react";
import { GitBranchList } from "./components/GitBranchList";
import { Button } from "./components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import { notifyDrawerState } from "./lib/embed-frame";
import { useGetHealth } from "./queries/health.query";

export const App = () => {
  const [open, setOpen] = useState(false);

  const setDrawerOpen = (nextOpen: boolean) => {
    notifyDrawerState(nextOpen);
    setOpen(nextOpen);
  };

  return (
    <main className="remote-kanban-app">
      <Sheet open={open} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            aria-label="Ouvrir Remote Kanban"
            title="Remote Kanban"
          >
            <GitBranchIcon className="size-5" />
          </Button>
        </SheetTrigger>

        <SheetContent>
          <div className="space-y-4 px-6 py-6">
            <GitBranchList />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
};
