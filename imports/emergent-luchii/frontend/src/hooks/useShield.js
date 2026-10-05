import { useEffect } from "react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useShield(pageName) {
  useEffect(() => {
    const report = (event, detail) => {
      fetch(`${API}/security/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: `page_${pageName}`,
          timestamp: new Date().toISOString(),
          event, detail: `[${pageName}] ${detail}`,
          user_agent: navigator.userAgent,
          referrer: document.referrer || "direct",
          url: window.location.href,
        }),
      }).catch(() => {});
    };
    const onCtx = (e) => { e.preventDefault(); report("RIGHT_CLICK_BLOCKED", "Right-click blocked"); };
    const onCopy = (e) => { e.preventDefault(); report("COPY_BLOCKED", "Copy blocked"); };
    const onCut = (e) => { e.preventDefault(); report("CUT_BLOCKED", "Cut blocked"); };
    const onKey = (e) => {
      const blocked = e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ["u", "U", "s", "S"].includes(e.key));
      if (blocked) {
        e.preventDefault();
        report("DEVTOOLS_SHORTCUT_BLOCKED", `Key combo: ${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.key}`);
      }
    };
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("keydown", onKey);
    let last = 0;
    const iv = setInterval(() => {
      const wd = window.outerWidth - window.innerWidth;
      const hd = window.outerHeight - window.innerHeight;
      if ((wd > 160 || hd > 160) && Date.now() - last > 60000) {
        last = Date.now();
        report("DEVTOOLS_OPEN_DETECTED", `Window delta W:${wd} H:${hd}`);
      }
    }, 3000);
    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("keydown", onKey);
      clearInterval(iv);
    };
  }, [pageName]);
}
