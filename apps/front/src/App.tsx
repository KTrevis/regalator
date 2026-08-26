import { useState } from "react";
import { GitBranchIcon } from "lucide-react";
import { GitBranchList } from "./components/GitBranchList";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "./components/ui/sheet";
import { notifyDrawerState } from "./lib/embed-frame";
import { useSwitchBranch } from "./queries/git.query";

export const App = () => {
  const [open, setOpen] = useState(false);
  const switchBranch = useSwitchBranch();

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
          <div className="mx-3">
            <GitBranchList
              onBranchSelected={(branch) => switchBranch.mutate({ branch })}
            />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
};
