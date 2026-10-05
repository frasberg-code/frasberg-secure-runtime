import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/, "ws");

export function useAdminSocket() {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    ws.current = new WebSocket(`${WS_BASE}/api/ws/admin-feed`);

    ws.current.onopen = () => setConnected(true);

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "feed_init") {
          setEvents(data.events || []);
        } else {
          setEvents((prev) => [data, ...prev].slice(0, 200));
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.current.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 4000);
    };

    ws.current.onerror = () => ws.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, connected, clearEvents };
}
