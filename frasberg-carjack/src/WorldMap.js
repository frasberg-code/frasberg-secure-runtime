// ── Frasberg Carjack — World Map ──────────────────────────────────────────────

export class WorldMap {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas?.getContext?.('2d') ?? canvas; // accepts canvas or ctx
    this.visible = false;
    this.scale   = 1;
    this.offset  = { x: 0, y: 0 };
    this.drag    = { active: false, startX: 0, startY: 0 };
    this.time    = 360; // minutes since midnight

    this.zones    = this._buildZones();
    this.roads    = this._buildRoads();
    this.buildings = this._buildBuildings();
    this.markers  = new Map();
    this.players  = new Map();

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') this.toggle();
    });
  }

  // ── Zone definitions ─────────────────────────────────────────────────────────
  _buildZones() {
    return [
      { id: 'downtown',   name: 'Downtown',      x: 400,  y: 300,  w: 300, h: 200, color: '#1a1a2e' },
      { id: 'port',       name: 'Port District', x: 700,  y: 450,  w: 200, h: 150, color: '#16213e' },
      { id: 'hills',      name: 'Frasberg Hills',x: 100,  y: 100,  w: 250, h: 180, color: '#1f2a1f' },
      { id: 'industrial', name: 'Industrial',    x: 750,  y: 100,  w: 220, h: 180, color: '#2a2118' },
      { id: 'strip',      name: 'The Strip',     x: 400,  y: 550,  w: 300, h: 120, color: '#2a1a2e' },
      { id: 'suburbs',    name: 'Suburbs',       x: 80,   y: 420,  w: 240, h: 200, color: '#1a2620' },
    ];
  }

  // ── Road grid (world space) ──────────────────────────────────────────────────
  _buildRoads() {
    const roads = [];
    const SPACING = 160, EXTENT = 1200;
    for (let x = -EXTENT; x <= EXTENT; x += SPACING) {
      roads.push({ x1: x, y1: -EXTENT, x2: x, y2: EXTENT, vertical: true });
    }
    for (let y = -EXTENT; y <= EXTENT; y += SPACING) {
      roads.push({ x1: -EXTENT, y1: y, x2: EXTENT, y2: y, vertical: false });
    }
    return roads;
  }

  _buildBuildings() {
    const buildings = [];
    const SPACING = 160, EXTENT = 1200, ROAD_W = 40;
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let bx = -EXTENT; bx < EXTENT; bx += SPACING) {
      for (let by = -EXTENT; by < EXTENT; by += SPACING) {
        if (rand() < 0.25) continue; // park / empty lot
        const pad = ROAD_W / 2 + 8;
        buildings.push({
          x: bx + pad, y: by + pad,
          w: SPACING - pad * 2, h: SPACING - pad * 2,
          color: ['#23252e', '#2b2d38', '#1e2027', '#30323e'][Math.floor(rand() * 4)],
          park: rand() < 0.15,
        });
      }
    }
    return buildings;
  }

  async load() {
    console.log('[WorldMap] City loaded —', this.zones.length, 'zones,', this.roads.length, 'roads');
    return true;
  }

  // ── Nearest road (used by TrafficAI) ─────────────────────────────────────────
  getNearestRoad(x, z) {
    const SPACING = 160;
    const snapX = Math.round(x / SPACING) * SPACING;
    const snapZ = Math.round(z / SPACING) * SPACING;
    const useVertical = Math.abs(x - snapX) < Math.abs(z - snapZ);
    return {
      x: useVertical ? snapX : x,
      z: useVertical ? z : snapZ,
      direction: useVertical ? (Math.random() < 0.5 ? 0 : Math.PI) : (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
      lane: Math.random() < 0.5 ? 0 : 1,
    };
  }

  getZoneAt(x, z) {
    return this.zones.find(zn =>
      x >= zn.x && x <= zn.x + zn.w && z >= zn.y && z <= zn.y + zn.h
    ) ?? null;
  }

  addMarker(id, x, z, label = '', color = '#FFD700') {
    this.markers.set(id, { x, z, label, color });
  }
  removeMarker(id) { this.markers.delete(id); }

  setPlayer(id, x, z) { this.players.set(id, { x, z }); }

  toggle() { this.visible = !this.visible; }

  update(dt, player) {
    // Day/night clock — 1 real second = 1 game minute
    this.time = (this.time + dt) % 1440;
  }

  // ── World render (roads, buildings, parks) — camera space ────────────────────
  render(ctx, player) {
    const px = player?.x ?? 0;
    const py = player?.y ?? player?.z ?? 0;
    const view = 900;

    // Ground
    ctx.fillStyle = '#151820';
    ctx.fillRect(px - view, py - view, view * 2, view * 2);

    // Roads
    ctx.strokeStyle = '#3a3d47';
    ctx.lineWidth = 40;
    for (const r of this.roads) {
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1);
      ctx.lineTo(r.x2, r.y2);
      ctx.stroke();
    }
    // Lane markings
    ctx.strokeStyle = '#5a5d67';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 18]);
    for (const r of this.roads) {
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1);
      ctx.lineTo(r.x2, r.y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Buildings & parks (cull to view)
    for (const b of this.buildings) {
      if (b.x + b.w < px - view || b.x > px + view ||
          b.y + b.h < py - view || b.y > py + view) continue;
      if (b.park) {
        ctx.fillStyle = '#1d3320';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#2a4a2e';
        ctx.beginPath(); ctx.arc(b.x + b.w * 0.3, b.y + b.h * 0.4, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x + b.w * 0.7, b.y + b.h * 0.6, 13, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        // Rooftop detail
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(b.x + 6, b.y + 6, b.w * 0.4, b.h * 0.3);
      }
    }

    // Night dimming overlay based on world time
    const hour = this.time / 60;
    if (hour < 6 || hour > 19) {
      ctx.fillStyle = 'rgba(5,8,25,0.35)';
      ctx.fillRect(px - view, py - view, view * 2, view * 2);
    }

    // Markers
    for (const m of this.markers.values()) {
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.z, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Big map overlay
    if (this.visible) this._renderBigMap(ctx, px, py);
  }

  _renderBigMap(ctx, px, py) {
    const c = ctx.canvas;
    ctx.save();
    ctx.resetTransform?.();
    const W = Math.min(c.width * 0.7, 640), H = Math.min(c.height * 0.7, 480);
    const x = (c.width - W) / 2, y = (c.height - H) / 2;
    ctx.fillStyle = 'rgba(8,10,18,0.94)';
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, W, H, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('FRASBERG CITY MAP', x + 20, y + 30);
    // Zones
    const sc = Math.min(W / 2600, H / 2600);
    const cx = x + W / 2, cy = y + H / 2;
    for (const zn of this.zones) {
      ctx.fillStyle = zn.color;
      ctx.fillRect(cx + (zn.x - 500) * sc * 2, cy + (zn.y - 350) * sc * 2, zn.w * sc * 2, zn.h * sc * 2);
      ctx.fillStyle = '#8a8f9c';
      ctx.font = '10px monospace';
      ctx.fillText(zn.name, cx + (zn.x - 500) * sc * 2 + 4, cy + (zn.y - 350) * sc * 2 + 14);
    }
    // Player blip
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(cx + px * sc, cy + py * sc, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('Press M to close', x + 20, y + H - 14);
    ctx.restore();
  }

  destroy() {
    this.markers.clear();
    this.players.clear();
  }
}
