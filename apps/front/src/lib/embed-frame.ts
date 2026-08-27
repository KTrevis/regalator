export type EmbedFrameMessage =
  | {
      readonly source: "remote-kanban";
      readonly type: "app:restarting" | "drawer:open" | "drawer:close";
    }
  | {
      readonly source: "remote-kanban";
      readonly type: "launcher:move";
      readonly deltaX: number;
      readonly deltaY: number;
    };

type HostFrameMessage = {
  readonly source: "remote-kanban-host";
  readonly type: "drawer:close";
};

const getHostOrigin = (): string => {
  const hostOrigin = new URLSearchParams(window.location.search).get(
    "hostOrigin",
  );

  return hostOrigin && hostOrigin !== "null" ? hostOrigin : "*";
};

export const notifyDrawerState = (open: boolean): void => {
  const message: EmbedFrameMessage = {
    source: "remote-kanban",
    type: open ? "drawer:open" : "drawer:close",
  };

  window.parent.postMessage(message, getHostOrigin());
};

export const notifyLauncherMove = (deltaX: number, deltaY: number): void => {
  window.parent.postMessage(
    {
      source: "remote-kanban",
      type: "launcher:move",
      deltaX,
      deltaY,
    } satisfies EmbedFrameMessage,
    getHostOrigin(),
  );
};

export const subscribeToHostDrawerClose = (
  onClose: () => void,
): (() => void) => {
  const hostOrigin = getHostOrigin();
  const handleMessage = (event: MessageEvent<HostFrameMessage>) => {
    if (event.source !== window.parent) return;
    if (hostOrigin !== "*" && event.origin !== hostOrigin) return;
    if (
      event.data?.source === "remote-kanban-host" &&
      event.data.type === "drawer:close"
    ) {
      onClose();
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
};

export const notifyAppRestarting = (): void => {
  window.parent.postMessage(
    {
      source: "remote-kanban",
      type: "app:restarting",
    } satisfies EmbedFrameMessage,
    getHostOrigin(),
  );
};
