import { useRef } from "react";
import { GitBranchIcon } from "lucide-react";
import { notifyLauncherMove } from "../lib/embed-frame";
import { Button } from "./ui/button";

const DRAG_THRESHOLD = 4;

export function DraggableLauncher({ onOpen }: { onOpen: () => void }) {
  const drag = useRef({
    active: false,
    moved: false,
    originX: 0,
    originY: 0,
    screenX: 0,
    screenY: 0,
  });

  return (
    <Button
      className="cursor-grab touch-none select-none rounded-none border-0 active:cursor-grabbing"
      size="icon"
      aria-label="Open Remote Kanban"
      title="Remote Kanban"
      onPointerDown={(event) => {
        if (event.button !== 0) return;

        drag.current = {
          active: true,
          moved: false,
          originX: event.screenX,
          originY: event.screenY,
          screenX: event.screenX,
          screenY: event.screenY,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current.active) return;

        if (
          !current.moved &&
          Math.hypot(
            event.screenX - current.originX,
            event.screenY - current.originY,
          ) < DRAG_THRESHOLD
        ) {
          return;
        }

        const deltaX = event.screenX - current.screenX;
        const deltaY = event.screenY - current.screenY;
        current.screenX = event.screenX;
        current.screenY = event.screenY;
        current.moved = true;
        notifyLauncherMove(deltaX, deltaY);
      }}
      onPointerUp={(event) => {
        drag.current.active = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current.active = false;
        drag.current.moved = false;
      }}
      onClick={(event) => {
        if (drag.current.moved) {
          drag.current.moved = false;
          event.preventDefault();
          return;
        }

        onOpen();
      }}
    >
      <GitBranchIcon className="size-5" />
    </Button>
  );
}
