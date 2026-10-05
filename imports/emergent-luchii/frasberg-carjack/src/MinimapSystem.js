// src/MinimapSystem.js — Live minimap with players, waypoints, zones
export class MinimapSystem {
  constructor(worldSize = 2000) {
    this.worldSize  = worldSize;
    this.mapSize    = 200;
    this.scale      = this.mapSize / worldSize;
    this.players    = new Map();
    this.waypoints  = [];
    this.zones      = [];
    this.blip       = 0; // blink timer
    this._buildUI();
  }

  _buildUI() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position:fixed; bottom:20px; left:20px; z-index:100;
      width:${this.mapSize}px; height:${this.mapSize}px;
    `;
    // Background canvas
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.bgCanvas.height = this.mapSize;
    this.bgCanvas.style.cssText = `
      position:absolute; top:0; left:0; border-radius:50%;
      border:2px solid rgba(0,255,136,0.4);
      box-shadow:0 0 20px rgba(0,255,136,0.15);
    `;
    // Dynamic canvas (players/blips)
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = this.mapSize;
    this.canvas.style.cssText = `
      position:absolute; top:0; left:0; border-radius:50%;
    `;
    wrapper.appendChild(this.bgCanvas);
    wrapper.appendChild(this.canvas);
    document.body.appendChild(wrapper);
    this.wrapper = wrapper;
    this._drawBackground();
  }

  _drawBackground() {
    const ctx  = this.bgCanvas.getContext('2d');
    const size = this.mapSize;
    const cx   = size / 2;
    // Circular clip
    ctx.beginPath();
    ctx.arc(cx, cx, cx - 2, 0, Math.PI * 2);
    ctx.clip();
    // Base
    ctx.fillStyle = 'rgba(10,15,20,0.85)';
    ctx.fillRect(0, 0, size, size);
    // Grid
    ctx.strokeStyle = 'rgba(0,255,136,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 25) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }
    // Cardinal labels
    ctx.fillStyle = 'rgba(0,255,136,0.3)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 12);
    ctx.fillText('S', cx, size - 4);
    ctx.fillText('E', size - 5, cx + 4);
    ctx.fillText('W', 7, cx + 4);
  }

  setPlayer(id, x, y, heading = 0, isLocal = false) {
    this.players.set(id, { x, y, heading, isLocal });
  }
  removePlayer(id) {
    this.players.delete(id);
  }
  addWaypoint(x, y, label = '', color = '#FFD700') {
    this.waypoints.push({ x, y, label, color });
  }
  clearWaypoints() {
    this.waypoints = [];
  }
  addZone(x, y, radius, color = 'rgba(255,50,50,0.2)', label = '') {
    this.zones.push({ x, y, radius, color, label });
  }

  _worldToMap(wx, wy) {
    const cx = this.mapSize / 2;
    return {
      mx: cx + (wx * this.scale),
      my: cx + (wy * this.scale),
    };
  }

  update(delta) {
    this.blip = (this.blip + delta * 0.003) % (Math.PI * 2);
    this._render();
  }

  _render() {
    const ctx  = this.canvas.getContext('2d');
    const size = this.mapSize;
    const cx   = size / 2;
    ctx.clearRect(0, 0, size, size);
    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cx, cx - 2, 0, Math.PI * 2);
    ctx.clip();
    // Draw zones
    for (const z of this.zones) {
      const { mx, my } = this._worldToMap(z.x, z.y);
      const r = z.radius * this.scale;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fillStyle = z.color;
      ctx.fill();
    }
    // Draw waypoints
    for (const wp of this.waypoints) {
      const { mx, my } = this._worldToMap(wp.x, wp.y);
      const pulse = 4 + Math.sin(this.blip) * 2;
      ctx.beginPath();
      ctx.arc(mx, my, pulse, 0, Math.PI * 2);
      ctx.fillStyle = wp.color;
      ctx.fill();
      if (wp.label) {
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(wp.label, mx, my - 8);
      }
    }
    // Draw players
    for (const [id, p] of this.players) {
      const { mx, my } = this._worldToMap(p.x, p.y);
      if (p.isLocal) {
        // Local player — directional triangle
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(p.heading);
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(-5, 5);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      } else {
        // Remote players — dot
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FF6B6B';
        ctx.shadowColor = '#FF6B6B';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  destroy() {
    this.wrapper?.remove();
  }
}
