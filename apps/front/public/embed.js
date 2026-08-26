(() => {
  const script = document.currentScript;

  if (!(script instanceof HTMLScriptElement)) return;

  const mount = () => {
    if (document.querySelector("[data-remote-kanban-frame]")) return;

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
      if (
        event.origin !== frameUrl.origin ||
        event.source !== iframe.contentWindow
      )
        return;
      if (event.data?.source !== "remote-kanban") return;

      if (event.data.type === "app:restarting") {
        void reloadAfterRestart(iframe, frameUrl);
        return;
      }

      const open = event.data.type === "drawer:open";
      const close = event.data.type === "drawer:close";

      if (!open && !close) return;

      iframe.style.inset = open ? "0" : "auto 12px 12px auto";
      iframe.style.width = open ? "100vw" : "64px";
      iframe.style.height = open ? "100dvh" : "64px";
    });

    document.body.append(iframe);
  };

  const reloadAfterRestart = async (iframe, frameUrl) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const ready = await fetch(
        new URL("/api/dev/restart-status", frameUrl),
      ).then(
        (response) => response.ok,
        () => false,
      );

      if (ready) {
        frameUrl.searchParams.set("restart", Date.now().toString());
        iframe.src = frameUrl.toString();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  if (document.body) mount();
  else window.addEventListener("DOMContentLoaded", mount, { once: true });
})();
