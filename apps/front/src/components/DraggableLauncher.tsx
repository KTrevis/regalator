import { useDrag } from "@use-gesture/react";
import { GitBranchIcon } from "lucide-react";
import { notifyLauncherDrag } from "../lib/embed-frame";
import { Button } from "./ui/button";

export function DraggableLauncher({ onOpen }: { onOpen: () => void }) {
  const bindDrag = useDrag(
    ({ active, event, tap }) => {
      const { screenX, screenY } = event as PointerEvent;
      notifyLauncherDrag(active && !tap, screenX, screenY);

      if (tap) {
        onOpen();
      }
    },
    {
      filterTaps: true,
      threshold: 4,
    },
  );

  return (
    <Button
      {...bindDrag()}
      className="cursor-grab touch-none select-none rounded-none border-0 active:cursor-grabbing"
      size="icon"
      aria-label="Open Regalator"
      title="Regalator"
    >
      <GitBranchIcon className="size-5" />
    </Button>
  );
}
