export type EmbedFrameMessage =
  | {
      readonly source: "regalator";
      readonly type: "drawer:open" | "drawer:close";
    }
  | {
      readonly source: "regalator";
      readonly type: "launcher:drag";
      readonly active: boolean;
      readonly pointerX: number;
      readonly pointerY: number;
    };

type HostFrameMessage = {
  readonly source: "regalator-host";
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
    source: "regalator",
    type: open ? "drawer:open" : "drawer:close",
  };

  window.parent.postMessage(message, getHostOrigin());
};

export const notifyLauncherDrag = (
  active: boolean,
  pointerX: number,
  pointerY: number,
): void => {
  window.parent.postMessage(
    {
      source: "regalator",
      type: "launcher:drag",
      active,
      pointerX,
      pointerY,
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
      event.data?.source === "regalator-host" &&
      event.data.type === "drawer:close"
    ) {
      onClose();
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
};
