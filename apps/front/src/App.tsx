import { useState } from "react";
import { GitBranchIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";
import { notifyDrawerState } from "./lib/embed-frame";
import { useGetHealth } from "./queries/health.query";

export const App = () => {
  const [open, setOpen] = useState(false);
  const health = useGetHealth();

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
            <GitBranchIcon className="size-5 bg-black" />
          </Button>
        </SheetTrigger>

        <SheetContent>
          <SheetHeader>
            <SheetTitle>Remote Kanban</SheetTitle>
            <SheetDescription>
              Changez de branche et pilotez votre environnement.
            </SheetDescription>
          </SheetHeader>

          <div className="border-t border-border px-6 py-4 text-sm">
            API : {health.data?.status ?? "connexion…"}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
};
