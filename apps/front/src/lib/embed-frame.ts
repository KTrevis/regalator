export type EmbedFrameMessage = {
  readonly source: "remote-kanban";
  readonly type: "drawer:open" | "drawer:close";
};

const getHostOrigin = (): string => {
  const hostOrigin = new URLSearchParams(window.location.search).get("hostOrigin");

  return hostOrigin && hostOrigin !== "null" ? hostOrigin : "*";
};

export const notifyDrawerState = (open: boolean): void => {
  const message: EmbedFrameMessage = {
    source: "remote-kanban",
    type: open ? "drawer:open" : "drawer:close",
  };

  window.parent.postMessage(message, getHostOrigin());
};
