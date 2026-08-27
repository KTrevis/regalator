(() => {
  const script = document.currentScript;

  if (!(script instanceof HTMLScriptElement)) return;

  const launcherSize = 32;
  const launcherMargin = 12;
  const drawerWidth = 384;
  const launcherPositionKey = "regalator-launcher-position";

  const mount = () => {
    if (document.querySelector("[data-regalator-frame]")) return;

    const frameUrl = new URL(script.dataset.appUrl || "/", script.src);
    frameUrl.searchParams.set("hostOrigin", window.location.origin);

    const iframe = document.createElement("iframe");
    iframe.dataset.regalatorFrame = "";
    iframe.src = frameUrl.toString();
    iframe.title = "Regalator";
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
    overlay.dataset.regalatorOverlay = "";
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
        { source: "regalator-host", type: "drawer:close" },
        frameUrl.origin,
      );
    });

    let drawerOpen = false;
    let launcherPosition = readLauncherPosition();
    let dragOrigin = null;
    let dragPointerOrigin = null;
    let pendingDragPosition = null;
    let dragAnimationFrame = null;

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

    const applyDragPosition = () => {
      dragAnimationFrame = null;
      if (!dragOrigin || !pendingDragPosition) return;

      iframe.style.transform = `translate3d(${pendingDragPosition.x - dragOrigin.x}px, ${pendingDragPosition.y - dragOrigin.y}px, 0)`;
    };

    const dragLauncher = ({ active, pointerX, pointerY }) => {
      if (!dragOrigin) {
        const frameRect = iframe.getBoundingClientRect();
        dragOrigin = { x: frameRect.left, y: frameRect.top };
        dragPointerOrigin = { x: pointerX, y: pointerY };
        launcherPosition = dragOrigin;
        placeLauncher();
      }

      pendingDragPosition = clampLauncherPosition({
        x: dragOrigin.x + pointerX - dragPointerOrigin.x,
        y: dragOrigin.y + pointerY - dragPointerOrigin.y,
      });

      if (dragAnimationFrame === null) {
        dragAnimationFrame = requestAnimationFrame(applyDragPosition);
      }

      if (active) return;

      if (dragAnimationFrame !== null) {
        cancelAnimationFrame(dragAnimationFrame);
        dragAnimationFrame = null;
      }
      launcherPosition = pendingDragPosition;
      dragOrigin = null;
      dragPointerOrigin = null;
      pendingDragPosition = null;
      iframe.style.transform = "";
      saveLauncherPosition(launcherPosition);
      placeLauncher();
    };

    window.addEventListener("message", (event) => {
      if (
        event.origin !== frameUrl.origin ||
        event.source !== iframe.contentWindow
      )
        return;
      if (event.data?.source !== "regalator") return;

      if (event.data.type === "launcher:drag") {
        if (
          !drawerOpen &&
          typeof event.data.active === "boolean" &&
          Number.isFinite(event.data.pointerX) &&
          Number.isFinite(event.data.pointerY)
        ) {
          dragLauncher(event.data);
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
