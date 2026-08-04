import { useEffect, useRef, useState } from "react";

// WebRTC stream client for the Luchii Streaming Server (cloud game streaming).
export default function StreamPlayer({ wsUrl, gameId, token, onStateChange, onFallback }) {
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const [state, setState] = useState("connecting");

  useEffect(() => {
    let closed = false;
    const set = (s) => { if (!closed) { setState(s); onStateChange?.(s); } };

    const ws = new WebSocket(`${wsUrl}/stream?token=${encodeURIComponent(token || "")}&game=${gameId}`);
    wsRef.current = ws;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (videoRef.current && e.streams[0]) {
        videoRef.current.srcObject = e.streams[0];
        videoRef.current.play().catch(() => {});
        set("streaming");
      }
    };
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "ice_candidate", candidate }));
      }
    };

    ws.onmessage = async (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === "offer" || msg.sdp) {
        await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp?.sdp || msg.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", sdp: answer.sdp }));
      } else if (msg.type === "ice_candidate" && msg.candidate) {
        pc.addIceCandidate(msg.candidate).catch(() => {});
      } else if (msg.type === "ready") {
        set("negotiating");
      } else if (msg.type === "error") {
        set("error");
        onFallback?.();
      }
    };
    ws.onerror = () => { set("error"); onFallback?.(); };
    ws.onclose = () => { if (state !== "streaming") onFallback?.(); };

    // Input tunneling — forward keyboard/mouse to the stream node
    const sendInput = (payload) => { if (ws.readyState === 1) ws.send(JSON.stringify(payload)); };
    const onKeyDown = (e) => sendInput({ type: "keydown", key: e.code });
    const onKeyUp = (e) => sendInput({ type: "keyup", key: e.code });
    const onMouseMove = (e) => {
      const rect = videoRef.current?.getBoundingClientRect();
      if (!rect) return;
      sendInput({
        type: "mousemove",
        x: Math.round(((e.clientX - rect.left) / rect.width) * 1280),
        y: Math.round(((e.clientY - rect.top) / rect.height) * 720),
      });
    };
    const onMouseDown = (e) => sendInput({ type: "mousedown", button: e.button });
    const onMouseUp = (e) => sendInput({ type: "mouseup", button: e.button });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const v = videoRef.current;
    v?.addEventListener("mousemove", onMouseMove);
    v?.addEventListener("mousedown", onMouseDown);
    v?.addEventListener("mouseup", onMouseUp);

    return () => {
      closed = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      v?.removeEventListener("mousemove", onMouseMove);
      v?.removeEventListener("mousedown", onMouseDown);
      v?.removeEventListener("mouseup", onMouseUp);
      ws.close();
      pc.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl, gameId]);

  return (
    <video
      ref={videoRef}
      data-testid="stream-video"
      className="h-full w-full bg-black object-contain"
      autoPlay
      playsInline
      muted={false}
    />
  );
}
