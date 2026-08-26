import { useState } from "react";
import { GitBranchIcon } from "lucide-react";
import { AgentRunList } from "./components/AgentRunList";
import { GitBranchList } from "./components/GitBranchList";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "./components/ui/sheet";
import { notifyDrawerState } from "./lib/embed-frame";

export const App = () => {
  const [open, setOpen] = useState(false);

  const setDrawerOpen = (nextOpen: boolean) => {
    notifyDrawerState(nextOpen);
    setOpen(nextOpen);
  };

  return (
    <main className="remote-kanban-app">
      <Sheet open={open} onOpenChange={setDrawerOpen}>
        <SheetTrigger
          render={
            <Button
              size="icon"
              aria-label="Open Remote Kanban"
              title="Remote Kanban"
            />
          }
        >
          <GitBranchIcon className="size-5" />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader></SheetHeader>
          <div className="mx-3 space-y-6">
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Branches</h2>
              <GitBranchList />
            </section>
            <section className="space-y-2">
              <h2 className="text-sm font-medium">Agent runs</h2>
              <AgentRunList />
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
};
