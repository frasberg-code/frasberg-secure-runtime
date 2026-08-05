// ── Frasberg Carjack — Showroom / Garage ──────────────────────────────────────
// Press G: browse real-brand cars, buy with mission cash, equip your ride.

import { VEHICLE_CATALOG } from './VehicleCatalog.js';
import { getVehicleSprite } from './CarSprites.js';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export class ShowroomSystem {
  constructor(engine) {
    this.engine  = engine;
    this.owned   = new Set(['frasberg-gt']);
    this.activeId = 'frasberg-gt';
    this.customColors = {};
    this.nitro   = false;
    this.visible = false;
    this.panel   = null;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyG') this.toggle();
    });
  }

  static id(spec) { return slug(`${spec.brand}-${spec.model}`); }
  // Arcade "street price" — real value scaled for mission economy
  static price(spec) { return Math.max(400, Math.round(spec.value / 20 / 50) * 50); }

  serialize() {
    return { owned: [...this.owned], activeId: this.activeId, colors: this.customColors, nitro: this.nitro };
  }

  restore(data) {
    if (!data) return;
    if (Array.isArray(data.owned)) data.owned.forEach((id) => this.owned.add(id));
    if (data.colors) this.customColors = data.colors;
    if (data.nitro) this.nitro = true;
    if (data.activeId) {
      this.activeId = data.activeId;
      const spec = VEHICLE_CATALOG.find((s) => ShowroomSystem.id(s) === data.activeId);
      if (spec) this._equip(spec, true);
    }
  }

  _equip(spec, silent = false) {
    const id = ShowroomSystem.id(spec);
    const custom = this.customColors[id];
    this.engine.equipVehicle(custom ? { ...spec, color: custom } : spec, { silent });
    if (this.nitro && this.engine.playerCar) this.engine.playerCar.maxSpeed = Math.min(300, this.engine.playerCar.maxSpeed + 40);
  }

  toggle() { this.visible ? this.close() : this.open(); }

  open() {
    this.visible = true;
    this.engine.paused = true;
    this._render();
  }

  close() {
    this.visible = false;
    this.engine.paused = false;
    this.panel?.remove();
    this.panel = null;
  }

  buy(spec) {
    const id = ShowroomSystem.id(spec);
    const price = ShowroomSystem.price(spec);
    const p = this.engine.player;
    if (this.owned.has(id)) return;
    if (p.money < price) {
      this.engine.hud.showNotification(`Not enough cash — need $${price.toLocaleString()}`, 'danger');
      return;
    }
    p.money -= price;
    this.owned.add(id);
    this.engine.audio.play('cash');
    this.engine.hud.showNotification(`${spec.brand} ${spec.model} purchased!`, 'success');
    this.drive(spec);
  }

  drive(spec) {
    this.activeId = ShowroomSystem.id(spec);
    this._equip(spec);
    this._render();
  }

  paint(color) {
    const p = this.engine.player;
    if (p.money < 250) { this.engine.hud.showNotification('Paint job costs $250', 'danger'); return; }
    p.money -= 250;
    this.customColors[this.activeId] = color;
    const spec = VEHICLE_CATALOG.find((s) => ShowroomSystem.id(s) === this.activeId);
    if (spec) this._equip(spec, true);
    this.engine.audio.play('cash');
    this.engine.hud.showNotification('🎨 Fresh paint applied!', 'success');
    this._render();
  }

  buyNitro() {
    const p = this.engine.player;
    if (this.nitro) return;
    if (p.money < 2000) { this.engine.hud.showNotification('Nitro kit costs $2,000', 'danger'); return; }
    p.money -= 2000;
    this.nitro = true;
    if (this.engine.playerCar) this.engine.playerCar.maxSpeed = Math.min(300, this.engine.playerCar.maxSpeed + 40);
    this.engine.audio.play('cash');
    this.engine.hud.showNotification('⚡ NITRO installed — +40 top speed on every ride!', 'success');
    this._render();
  }

  _card(spec) {
    const id     = ShowroomSystem.id(spec);
    const price  = ShowroomSystem.price(spec);
    const owned  = this.owned.has(id);
    const active = this.activeId === id;
    const sprite = getVehicleSprite(spec);
    const afford = this.engine.player.money >= price;
    const btn = active
      ? `<button data-testid="garage-driving-${id}" disabled style="width:100%;padding:7px;border:none;border-radius:6px;background:#1d3320;color:#7ee2a0;font-family:monospace;font-weight:bold;">DRIVING</button>`
      : owned
        ? `<button data-testid="garage-drive-${id}" data-act="drive" data-id="${id}" style="width:100%;padding:7px;border:none;border-radius:6px;background:#264a8b;color:#fff;font-family:monospace;font-weight:bold;cursor:pointer;">DRIVE</button>`
        : `<button data-testid="garage-buy-${id}" data-act="buy" data-id="${id}" ${afford ? '' : 'disabled'} style="width:100%;padding:7px;border:none;border-radius:6px;background:${afford ? '#e63946' : '#40232a'};color:${afford ? '#fff' : '#7a5a60'};font-family:monospace;font-weight:bold;cursor:${afford ? 'pointer' : 'not-allowed'};">BUY $${price.toLocaleString()}</button>`;
    return `
      <div style="background:#12141d;border:1px solid ${active ? '#00ff88' : '#232634'};border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;">
        <img src="${sprite.canvas.toDataURL()}" alt="${spec.model}" style="height:64px;object-fit:contain;transform:rotate(90deg);image-rendering:auto;" />
        <div style="font-weight:bold;font-size:13px;color:#fff;">${spec.brand} ${spec.model}</div>
        <div style="font-size:10px;color:#8a8f9c;display:flex;justify-content:space-between;">
          <span style="text-transform:uppercase;color:#f1c40f;">${spec.tier}</span>
          <span>${spec.topSpeed} km/h${spec.electric ? ' · ⚡EV' : ''}</span>
        </div>
        ${btn}
      </div>`;
  }

  _render() {
    if (!this.visible) return;
    this.panel?.remove();
    this.panel = document.createElement('div');
    this.panel.id = 'showroom';
    this.panel.setAttribute('data-testid', 'garage-panel');
    this.panel.style.cssText = `
      position:fixed; inset:0; background:rgba(5,7,14,0.92); z-index:5000;
      display:flex; flex-direction:column; font-family:monospace; color:#fff;
      padding:28px 4vw; cursor:auto; overflow:hidden;
    `;
    const cards = VEHICLE_CATALOG.map((s) => this._card(s)).join('');
    const PAINTS = ['#e63946', '#f1c40f', '#00ff88', '#3a86ff', '#b14aed', '#ff7a3c', '#f5f6fa', '#111318'];
    const paintRow = PAINTS.map((c) =>
      `<span data-paint="${c}" data-testid="paint-${c.slice(1)}" style="width:26px;height:26px;border-radius:50%;background:${c};border:2px solid ${this.customColors[this.activeId] === c ? '#00ff88' : '#232634'};cursor:pointer;display:inline-block;"></span>`
    ).join('');
    this.panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <div style="color:#e63946;font-size:24px;font-weight:800;letter-spacing:2px;">FRASBERG SHOWROOM</div>
          <div style="color:#666;font-size:11px;">Buy with mission cash · press G to close</div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
          <div data-testid="garage-cash" style="background:#12141d;border:1px solid #232634;border-radius:8px;padding:8px 16px;font-size:16px;">
            💵 <span style="color:#7ee2a0;font-weight:bold;">$${this.engine.player.money.toLocaleString()}</span>
          </div>
          <span id="showroom-close" data-testid="garage-close" style="cursor:pointer;color:#888;font-size:26px;">✕</span>
        </div>
      </div>
      <div data-testid="paint-shop" style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:#12141d;border:1px solid #232634;border-radius:10px;padding:10px 14px;margin-bottom:14px;">
        <span style="color:#f1c40f;font-size:11px;font-weight:bold;letter-spacing:1px;">🎨 PAINT SHOP — $250</span>
        ${paintRow}
        <span style="flex:1"></span>
        <button id="nitroBtn" data-testid="garage-nitro" ${this.nitro ? 'disabled' : ''} style="padding:8px 16px;border:none;border-radius:8px;background:${this.nitro ? '#1d3320' : '#b14aed'};color:${this.nitro ? '#7ee2a0' : '#fff'};font-family:monospace;font-weight:bold;cursor:${this.nitro ? 'default' : 'pointer'};">${this.nitro ? '⚡ NITRO INSTALLED' : '⚡ NITRO KIT — $2,000'}</button>
      </div>
      <div style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;padding-right:6px;">
        ${cards}
      </div>`;
    document.body.appendChild(this.panel);
    this.panel.querySelector('#showroom-close').onclick = () => this.close();
    this.panel.querySelector('#nitroBtn').onclick = () => this.buyNitro();
    this.panel.querySelectorAll('span[data-paint]').forEach((s) => {
      s.onclick = () => this.paint(s.dataset.paint);
    });
    this.panel.querySelectorAll('button[data-act]').forEach((b) => {
      b.onclick = () => {
        const spec = VEHICLE_CATALOG.find((s) => ShowroomSystem.id(s) === b.dataset.id);
        if (!spec) return;
        b.dataset.act === 'buy' ? this.buy(spec) : this.drive(spec);
        this._render();
      };
    });
  }

  destroy() { this.panel?.remove(); }
}
