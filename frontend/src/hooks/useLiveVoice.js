import { useRef, useState, useCallback, useEffect } from "react";

export function useLiveVoice(onUtterance) {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState("idle");
  const activeRef = useRef(false);
  const cleanupRef = useRef(null);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setPhase("idle");
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const listen = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      let heard = false;
      let lastVoice = Date.now();
      const started = Date.now();
      const timer = setInterval(() => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        if (rms > 0.02) {
          heard = true;
          lastVoice = Date.now();
        }
        const shouldStop =
          (heard && Date.now() - lastVoice > 1400) ||
          Date.now() - started > 30000 ||
          (!heard && Date.now() - started > 15000);
        if (shouldStop && rec.state !== "inactive") rec.stop();
      }, 120);
      const cleanup = () => {
        clearInterval(timer);
        try { if (rec.state !== "inactive") rec.stop(); } catch {}
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
      };
      cleanupRef.current = cleanup;
      rec.onstop = async () => {
        clearInterval(timer);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
        if (!activeRef.current) return;
        if (!heard) { listen(); return; }
        setPhase("processing");
        await onUtterance(new Blob(chunks, { type: "audio/webm" }));
      };
      rec.start();
      setPhase("listening");
    } catch {
      stop();
    }
  }, [onUtterance, stop]);

  const start = useCallback(async () => {
    activeRef.current = true;
    setActive(true);
    await listen();
  }, [listen]);

  const resume = useCallback(() => {
    if (activeRef.current) listen();
  }, [listen]);

  useEffect(() => () => cleanupRef.current?.(), []);

  return { active, phase, start, stop, resume };
}
