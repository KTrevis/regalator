export type EmbedFrameMessage = {
  readonly source: "remote-kanban";
  readonly type: "app:restarting" | "drawer:open" | "drawer:close";
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

export const notifyAppRestarting = (): void => {
  window.parent.postMessage(
    {
      source: "remote-kanban",
      type: "app:restarting",
    } satisfies EmbedFrameMessage,
    getHostOrigin(),
  );
};
