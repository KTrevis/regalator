(() => {
  const script = document.currentScript;

  if (!(script instanceof HTMLScriptElement)) return;

  const mount = () => {
    if (document.querySelector('[data-remote-kanban-frame]')) return;

    const frameUrl = new URL(script.dataset.appUrl || "/", script.src);
    frameUrl.searchParams.set("hostOrigin", window.location.origin);

    const iframe = document.createElement("iframe");
    iframe.dataset.remoteKanbanFrame = "";
    iframe.src = frameUrl.toString();
    iframe.title = "Remote Kanban";
    iframe.style.cssText = [
      "position:fixed",
      "inset:auto 12px 12px auto",
      "width:64px",
      "height:64px",
      "border:0",
      "background:transparent",
      "z-index:2147483647",
    ].join(";");

    window.addEventListener("message", (event) => {
      if (event.origin !== frameUrl.origin || event.source !== iframe.contentWindow) return;
      if (event.data?.source !== "remote-kanban") return;

      const open = event.data.type === "drawer:open";
      const close = event.data.type === "drawer:close";

      if (!open && !close) return;

      iframe.style.inset = open ? "0" : "auto 12px 12px auto";
      iframe.style.width = open ? "100vw" : "64px";
      iframe.style.height = open ? "100dvh" : "64px";
    });

    document.body.append(iframe);
  };

  if (document.body) mount();
  else window.addEventListener("DOMContentLoaded", mount, { once: true });
})();
