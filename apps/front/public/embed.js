(() => {
  const script = document.currentScript;

  if (!(script instanceof HTMLScriptElement)) return;

  const launcherSize = 32;
  const launcherMargin = 12;
  const drawerWidth = 384;
  const launcherPositionKey = "remote-kanban-launcher-position";

  const mount = () => {
    if (document.querySelector("[data-remote-kanban-frame]")) return;

    const frameUrl = new URL(script.dataset.appUrl || "/", script.src);
    frameUrl.searchParams.set("hostOrigin", window.location.origin);

    const iframe = document.createElement("iframe");
    iframe.dataset.remoteKanbanFrame = "";
    iframe.src = frameUrl.toString();
    iframe.title = "Remote Kanban";
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.cssText = [
      "position:fixed",
      "width:32px",
      "height:32px",
      "border:0",
      "z-index:2147483647",
    ].join(";");
    iframe.style.setProperty("background", "transparent", "important");
    iframe.style.setProperty("outline", "none", "important");

    const overlay = document.createElement("div");
    overlay.dataset.remoteKanbanOverlay = "";
    overlay.hidden = true;
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:rgb(0 0 0 / 10%)",
      "backdrop-filter:blur(2px)",
      "z-index:2147483646",
    ].join(";");
    overlay.addEventListener("click", () => {
      iframe.contentWindow?.postMessage(
        { source: "remote-kanban-host", type: "drawer:close" },
        frameUrl.origin,
      );
    });

    let drawerOpen = false;
    let launcherPosition = readLauncherPosition();

    const placeLauncher = () => {
      iframe.style.width = `${launcherSize}px`;
      iframe.style.height = `${launcherSize}px`;

      if (!launcherPosition) {
        iframe.style.inset = `auto ${launcherMargin}px ${launcherMargin}px auto`;
        return;
      }

      launcherPosition = clampLauncherPosition(launcherPosition);
      iframe.style.inset = "auto";
      iframe.style.left = `${launcherPosition.x}px`;
      iframe.style.top = `${launcherPosition.y}px`;
    };

    const moveLauncher = (deltaX, deltaY) => {
      const frameRect = iframe.getBoundingClientRect();
      launcherPosition = clampLauncherPosition({
        x: frameRect.left + deltaX,
        y: frameRect.top + deltaY,
      });
      saveLauncherPosition(launcherPosition);
      placeLauncher();
    };

    window.addEventListener("message", (event) => {
      if (
        event.origin !== frameUrl.origin ||
        event.source !== iframe.contentWindow
      )
        return;
      if (event.data?.source !== "remote-kanban") return;

      if (event.data.type === "launcher:move") {
        if (
          !drawerOpen &&
          Number.isFinite(event.data.deltaX) &&
          Number.isFinite(event.data.deltaY)
        ) {
          moveLauncher(event.data.deltaX, event.data.deltaY);
        }
        return;
      }

      const open = event.data.type === "drawer:open";
      const close = event.data.type === "drawer:close";

      if (!open && !close) return;

      drawerOpen = open;
      if (open) {
        overlay.hidden = false;
        iframe.style.inset = "0 0 0 auto";
        iframe.style.width = `min(${drawerWidth}px, 100vw)`;
        iframe.style.height = "100dvh";
      } else {
        overlay.hidden = true;
        placeLauncher();
      }
    });

    window.addEventListener("resize", () => {
      if (!drawerOpen && launcherPosition) placeLauncher();
    });

    placeLauncher();
    document.body.append(overlay);
    document.body.append(iframe);
  };

  const clampLauncherPosition = ({ x, y }) => ({
    x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - launcherSize)),
    y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - launcherSize)),
  });

  const readLauncherPosition = () => {
    try {
      const position = JSON.parse(localStorage.getItem(launcherPositionKey));
      if (Number.isFinite(position?.x) && Number.isFinite(position?.y)) {
        return position;
      }
    } catch {
      // Ignore unavailable or invalid host storage.
    }

    return null;
  };

  const saveLauncherPosition = (position) => {
    try {
      localStorage.setItem(launcherPositionKey, JSON.stringify(position));
    } catch {
      // The launcher remains draggable when host storage is unavailable.
    }
  };

  if (document.body) mount();
  else window.addEventListener("DOMContentLoaded", mount, { once: true });
})();
