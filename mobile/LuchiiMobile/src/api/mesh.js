import { MESH_WS_URL } from "../config";

export class MeshClient {
  constructor({ token, onMessage, onStatus }) {
    this.token = token;
    this.onMessage = onMessage;
    this.onStatus = onStatus || (() => {});
    this.ws = null;
    this.retries = 0;
    this.closedByUser = false;
  }

  connect() {
    this.closedByUser = false;
    const url = this.token ? `${MESH_WS_URL}?token=${encodeURIComponent(this.token)}` : MESH_WS_URL;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => { this.retries = 0; this.onStatus("connected"); };
    this.ws.onmessage = (e) => {
      try { this.onMessage(JSON.parse(e.data)); } catch { /* ignore malformed frames */ }
    };
    this.ws.onclose = () => {
      this.onStatus("disconnected");
      if (!this.closedByUser && this.retries < 8) {
        const wait = Math.min(1000 * 2 ** this.retries, 15000);
        this.retries += 1;
        setTimeout(() => this.connect(), wait);
      }
    };
    this.ws.onerror = () => this.onStatus("error");
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  close() {
    this.closedByUser = true;
    if (this.ws) this.ws.close();
  }
}
