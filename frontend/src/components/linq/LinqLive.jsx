import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Room, RoomEvent } from "livekit-client";
import { toast } from "sonner";
import { Loader2, Radio, Video, MessageSquare } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LinqLive = ({ identity }) => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("room-linq-001");
  const [mode, setMode] = useState("viewer");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [agentPresent, setAgentPresent] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [luchiiInput, setLuchiiInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [thinking, setThinking] = useState(false);
  const roomRef = useRef(null);
  const videoRef = useRef(null);

  const loadRooms = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/rooms/live`);
      setRooms(data);
    } catch {}
  }, []);

  const loadPreview = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/preview/state`);
      setPreview(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadRooms();
    loadPreview();
    const id = setInterval(() => { loadRooms(); loadPreview(); }, 5000);
    return () => { clearInterval(id); roomRef.current?.disconnect(); };
  }, [loadRooms, loadPreview]);

  const attachTrack = (track) => {
    if (track.kind === "video" && videoRef.current) track.attach(videoRef.current);
  };

  const join = async () => {
    setConnecting(true);
    try {
      const { data } = await axios.post(`${API}/livekit/token`, { identity, room: roomName, role: mode });
      const lkRoom = new Room({ adaptiveStream: true, dynacast: true });
      lkRoom.on(RoomEvent.ParticipantConnected, (p) => { if (p.identity === "luchii") setAgentPresent(true); });
      lkRoom.on(RoomEvent.ParticipantDisconnected, (p) => { if (p.identity === "luchii") setAgentPresent(false); });
      lkRoom.on(RoomEvent.TrackSubscribed, (track) => attachTrack(track));
      lkRoom.on(RoomEvent.DataReceived, (payload, participant) => {
        const text = new TextDecoder().decode(payload);
        setMessages((prev) => [...prev, { from: participant?.identity || "unknown", text }]);
      });
      lkRoom.on(RoomEvent.Disconnected, () => setConnected(false));
      await lkRoom.connect(data.host, data.token);
      roomRef.current = lkRoom;
      setConnected(true);
      if (mode === "host") {
        await lkRoom.localParticipant.enableCameraAndMicrophone();
        const pubs = Array.from(lkRoom.localParticipant.videoTrackPublications.values());
        pubs.forEach((pub) => pub.track && attachTrack(pub.track));
        await axios.post(`${API}/rooms/live`, { roomId: roomName, hostId: identity });
        await axios.post(`${API}/rooms/events`, { roomId: roomName, type: "host_action", identity, payload: { event: "host_joined" } });
      } else {
        await axios.post(`${API}/rooms/events`, { roomId: roomName, type: "viewer_joined", identity, payload: {} });
      }
      loadRooms();
      toast.success(`Connected to ${roomName} as ${mode}`);
    } catch (e) {
      toast.error("Could not connect to LiveKit room");
    } finally {
      setConnecting(false);
    }
  };

  const leave = async () => {
    try {
      if (mode === "host") {
        await axios.post(`${API}/rooms/end`, { roomId: roomName });
        await axios.post(`${API}/rooms/summary`, { roomId: roomName, hostId: identity, summary: { topics: ["broadcast ended"], decisions: [], followUps: [] } });
      }
    } catch {}
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnected(false);
    loadRooms();
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !roomRef.current) return;
    const text = chatInput.trim();
    await roomRef.current.localParticipant.publishData(new TextEncoder().encode(text), { reliable: true });
    setMessages((prev) => [...prev, { from: identity, text }]);
    axios.post(`${API}/rooms/events`, { roomId: roomName, type: mode === "host" ? "host_action" : "viewer_message", identity, payload: { message: text } }).catch(() => {});
    setChatInput("");
  };

  const askLuchii = async () => {
    if (!luchiiInput.trim()) return;
    const text = luchiiInput.trim();
    setLuchiiInput("");
    setMessages((prev) => [...prev, { from: identity, text: `@luchii ${text}` }]);
    setThinking(true);
    try {
      const { data } = await axios.post(`${API}/agents/luchii/actions`, { roomId: roomName, action: "viewer_question", from: identity, details: { text } });
      if (data.reply) setMessages((prev) => [...prev, { from: "luchii", text: data.reply, artifact: data.artifact }]);
    } catch {
      toast.error("Luchii is unavailable");
    } finally {
      setThinking(false);
    }
  };

  const runEngine = async (engine, label) => {
    setMessages((prev) => [...prev, { from: identity, text: `@luchii run ${label}` }]);
    setThinking(true);
    try {
      const { data } = await axios.post(`${API}/agents/luchii/actions`, { roomId: roomName, action: "run_engine", from: identity, details: { engine } });
      if (data.reply) setMessages((prev) => [...prev, { from: "luchii", text: data.reply, artifact: data.artifact }]);
      loadPreview();
    } catch {
      toast.error("Luchii is unavailable");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="linq-live">
      <div className="flex flex-wrap items-center gap-2" data-testid="live-now-strip">
        <span className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" /> Live now
        </span>
        {rooms.length === 0 && <span className="text-xs text-[#64748b]">No live rooms</span>}
        {rooms.map((r) => (
          <button key={r.roomId} data-testid={`live-room-${r.roomId}`} onClick={() => setRoomName(r.roomId)}
            className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${roomName === r.roomId ? "bg-[#ef4444] border-[#ef4444] text-white" : "bg-[#0f172a] border-[#1e293b] text-[#cbd5e1] hover:border-[#ef4444]"}`}>
            🔴 {r.roomId} · {r.viewerCount} watching
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select data-testid="live-mode-select" value={mode} onChange={(e) => setMode(e.target.value)} disabled={connected}
              className="bg-[#0f172a] border border-[#1e293b] text-[#f8fafc] text-sm rounded px-3 py-2">
              <option value="viewer">Viewer</option>
              <option value="host">Host (Go Live)</option>
            </select>
            <input data-testid="live-room-input" value={roomName} onChange={(e) => setRoomName(e.target.value)} disabled={connected}
              className="bg-[#0f172a] border border-[#1e293b] text-[#f8fafc] text-sm rounded px-3 py-2 flex-1 min-w-[160px]" placeholder="room-linq-001" />
            {!connected ? (
              <button data-testid="live-join-btn" onClick={join} disabled={connecting}
                className="bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-40 text-white text-sm rounded-full px-5 py-2 flex items-center gap-2">
                {connecting ? <Loader2 size={14} className="animate-spin" /> : mode === "host" ? <Video size={14} /> : <Radio size={14} />}
                {mode === "host" ? "Go Live" : "Join"}
              </button>
            ) : (
              <button data-testid="live-leave-btn" onClick={leave} className="bg-[#1e293b] hover:bg-[#334155] text-white text-sm rounded-full px-5 py-2">Leave</button>
            )}
            {agentPresent && <span className="text-xs text-[#4ade80]" data-testid="agent-badge">• Luchii active</span>}
          </div>

          <div className="bg-black rounded-lg aspect-video overflow-hidden border border-[#1e293b] flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted={mode === "host"} className="w-full h-full object-contain" data-testid="live-video" />
          </div>

          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#94a3b8]"><MessageSquare size={12} /> Room chat & Luchii</div>
            <div className="flex flex-wrap gap-2">
              <button data-testid="luchii-run-threat-btn" onClick={() => runEngine("threat", "threat scan")} disabled={thinking}
                className="text-[11px] rounded-full px-3 py-1 border border-[#a78bfa]/50 text-[#a78bfa] hover:bg-[#a78bfa]/10 disabled:opacity-40">🔮 Run Threat Scan</button>
              <button data-testid="luchii-run-billing-btn" onClick={() => runEngine("billing", "billing report")} disabled={thinking}
                className="text-[11px] rounded-full px-3 py-1 border border-[#facc15]/50 text-[#facc15] hover:bg-[#facc15]/10 disabled:opacity-40">⚡ Pull Billing Data</button>
              <button data-testid="luchii-run-compliance-btn" onClick={() => runEngine("compliance", "compliance check")} disabled={thinking}
                className="text-[11px] rounded-full px-3 py-1 border border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/10 disabled:opacity-40">🧠 Compliance Check</button>
              {thinking && <span className="text-[11px] text-[#94a3b8] flex items-center gap-1" data-testid="luchii-thinking"><Loader2 size={11} className="animate-spin" /> Luchii is working…</span>}
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 text-sm" data-testid="chat-messages">
              {messages.length === 0 && <div className="text-[#64748b] text-xs">No messages yet — ask Luchii to "run a threat scan" or "pull billing data"</div>}
              {messages.map((m, i) => (
                <div key={i}>
                  <span className={m.from === "luchii" ? "text-[#4ade80]" : "text-[#f87171]"}>{m.from}</span>: <span className="text-[#e2e8f0]">{m.text}</span>
                  {m.artifact && (
                    <div className="mt-1 mb-2 ml-4 rounded-lg border border-[#1e293b] bg-[#020617] p-2.5 text-xs space-y-1" data-testid={`engine-artifact-${m.artifact.engine}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[#a78bfa] uppercase tracking-widest text-[10px]">{m.artifact.engine} engine</span>
                        <span className="font-mono text-[#facc15]">{m.artifact.score}/100</span>
                      </div>
                      <div className="text-[#f8fafc]">{m.artifact.tag}</div>
                      {(m.artifact.recommendations || []).map((r, j) => (
                        <div key={j} className="text-[#94a3b8]">• {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input data-testid="chat-input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()}
                disabled={!connected} placeholder={connected ? "Chat…" : "Join a room to chat"}
                className="flex-1 bg-[#020617] border border-[#1e293b] text-[#f8fafc] text-sm rounded px-3 py-2" />
              <button data-testid="chat-send-btn" onClick={sendChat} disabled={!connected} className="bg-[#ef4444] disabled:opacity-40 text-white text-sm rounded px-4">Send</button>
            </div>
            <div className="flex gap-2">
              <input data-testid="ask-luchii-input" value={luchiiInput} onChange={(e) => setLuchiiInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askLuchii()}
                placeholder="Ask Luchii…" className="flex-1 bg-[#020617] border border-[#1e293b] text-[#f8fafc] text-sm rounded px-3 py-2" />
              <button data-testid="ask-luchii-btn" onClick={askLuchii} className="bg-[#4ade80]/20 border border-[#4ade80]/50 text-[#4ade80] text-sm rounded px-4">Ask</button>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 space-y-4 max-h-[560px] overflow-y-auto" data-testid="preview-panel">
          <h4 className="text-[#f8fafc] text-sm">Realtime Core Preview</h4>
          <div>
            <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-1">Rooms</div>
            {(preview?.rooms || []).slice(0, 6).map((r) => (
              <div key={r.roomId} className="text-xs text-[#cbd5e1]">{r.status === "live" ? "🔴" : "⚫"} {r.roomId} · {r.viewerCount} viewers</div>
            ))}
            {(!preview || preview.rooms.length === 0) && <div className="text-xs text-[#64748b]">None</div>}
          </div>
          <div>
            <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-1">Recent events</div>
            {(preview?.events || []).slice(0, 10).map((e) => (
              <div key={e.id} className="text-[11px] text-[#94a3b8] truncate"><span className="text-[#f87171]">{e.type}</span> · {e.identity}</div>
            ))}
            {(!preview || preview.events.length === 0) && <div className="text-xs text-[#64748b]">None</div>}
          </div>
          <div>
            <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-1">Summaries</div>
            {(preview?.summaries || []).slice(0, 4).map((s) => (
              <div key={s.id} className="text-[11px] text-[#cbd5e1] truncate">{s.roomId}: {(s.summary?.topics || []).join(", ")}</div>
            ))}
            {(!preview || preview.summaries.length === 0) && <div className="text-xs text-[#64748b]">None</div>}
          </div>
          <div>
            <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-1">Luchii actions</div>
            {(preview?.agentActions || []).slice(0, 5).map((a) => (
              <div key={a.id} className="text-[11px] text-[#4ade80] truncate">{a.action} · {a.from}</div>
            ))}
            {(!preview || preview.agentActions.length === 0) && <div className="text-xs text-[#64748b]">None</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
