// ── Frasberg HUD ──────────────────────────────────────────────────────────────

export class HUD {
  constructor() {
    this.root = null;
    this.wantedLevel = 0;
    this.health = 100;
    this.money = 0;
    this.speed = 0;
    this.promptTimer = null;
    this.notifTimer = null;
  }

  init() {
    this.root = document.getElementById('hud') || this.createRoot();
    this.render();
    console.log('[HUD] Initialized');
  }

  createRoot() {
    const el = document.createElement('div');
    el.id = 'hud';
    el.style.cssText = `
      position:fixed; inset:0; pointer-events:none;
      font-family:'Rajdhani',sans-serif; color:#fff;
      z-index:1000;
    `;
    document.body.appendChild(el);
    return el;
  }

  render() {
    this.root.innerHTML = `
      <div id="hud-health" style="position:absolute;bottom:60px;left:20px;
        background:rgba(0,0,0,.6);padding:8px 14px;border-radius:6px;font-size:18px;">
        ❤️ <span id="hud-hp">${this.health}</span>
      </div>
      <div id="hud-money" style="position:absolute;top:20px;right:20px;
        background:rgba(0,0,0,.6);padding:8px 14px;border-radius:6px;font-size:20px;">
        💵 $<span id="hud-cash">${this.money}</span>
      </div>
      <div id="hud-speed" style="position:absolute;bottom:20px;right:20px;
        background:rgba(0,0,0,.6);padding:8px 14px;border-radius:6px;font-size:22px;
        min-width:90px;text-align:center;">
        <span id="hud-spd">0</span> <small>km/h</small>
      </div>
      <div id="hud-wanted" style="position:absolute;top:20px;left:20px;
        background:rgba(0,0,0,.6);padding:8px 14px;border-radius:6px;font-size:20px;">
        ${this.renderStars()}
      </div>
      <div id="hud-prompt" style="position:absolute;bottom:120px;left:50%;
        transform:translateX(-50%);background:rgba(0,0,0,.75);padding:10px 20px;
        border-radius:8px;font-size:16px;display:none;"></div>
      <div id="hud-notify" style="position:absolute;top:70px;left:50%;
        transform:translateX(-50%);padding:8px 20px;border-radius:8px;
        font-size:16px;font-weight:600;display:none;"></div>
      <div id="hud-carjack" style="position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);background:rgba(0,0,0,.8);padding:12px 24px;
        border-radius:10px;font-size:16px;display:none;min-width:200px;text-align:center;">
        🔑 Carjacking... <br>
        <div id="hud-cj-bar" style="height:8px;background:#333;border-radius:4px;
          margin-top:8px;overflow:hidden;">
          <div id="hud-cj-fill" style="height:100%;width:0%;background:#f90;
            transition:width .1s;"></div>
        </div>
      </div>
      <div id="hud-minimap" style="position:absolute;bottom:20px;left:20px;
        width:120px;height:120px;background:rgba(0,0,0,.7);border-radius:50%;
        border:2px solid #555;overflow:hidden;">
        <canvas id="hud-minimap-canvas" width="120" height="120"></canvas>
      </div>
    `;
  }

  renderStars() {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += `<span style="color:${i < this.wantedLevel ? '#ff0' : '#444'}">★</span>`;
    }
    return stars;
  }

  update(data) {
    if (!data || typeof data !== 'object') return;
    if (data.health !== undefined) this.setHealth(data.health);
    if (data.money !== undefined) this.setMoney(data.money);
    if (data.speed !== undefined) this.setSpeed(data.speed);
  }

  setHealth(val) {
    this.health = Math.max(0, Math.min(100, val));
    const el = document.getElementById('hud-hp');
    if (el) el.textContent = Math.round(this.health);
  }

  setMoney(val) {
    this.money = val;
    const el = document.getElementById('hud-cash');
    if (el) el.textContent = val.toLocaleString();
  }

  setSpeed(val) {
    this.speed = Math.round(val);
    const el = document.getElementById('hud-spd');
    if (el) el.textContent = this.speed;
  }

  addWantedLevel(amount = 1) {
    this.wantedLevel = Math.min(5, this.wantedLevel + amount);
    const el = document.getElementById('hud-wanted');
    if (el) el.innerHTML = this.renderStars();
  }

  setWantedLevel(level) {
    this.wantedLevel = Math.max(0, Math.min(5, level));
    const el = document.getElementById('hud-wanted');
    if (el) el.innerHTML = this.renderStars();
  }

  showPrompt(msg, duration = 2500) {
    const el = document.getElementById('hud-prompt');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(this.promptTimer);
    this.promptTimer = setTimeout(() => { el.style.display = 'none'; }, duration);
  }

  hidePrompt() {
    const el = document.getElementById('hud-prompt');
    if (el) el.style.display = 'none';
  }

  showNotification(msg, kind = 'info', duration = 3000) {
    const el = document.getElementById('hud-notify');
    if (!el) return;
    const colors = {
      info:   'rgba(52,152,219,.9)',  success: 'rgba(39,174,96,.9)',
      green:  'rgba(39,174,96,.9)',   warning: 'rgba(243,156,18,.9)',
      yellow: 'rgba(243,156,18,.9)',  orange:  'rgba(230,126,34,.9)',
      danger: 'rgba(231,76,60,.9)',   red:     'rgba(231,76,60,.9)',
      blue:   'rgba(52,152,219,.9)',
    };
    el.style.background = colors[kind] || colors.info;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(this.notifTimer);
    this.notifTimer = setTimeout(() => { el.style.display = 'none'; }, duration);
  }

  flash(color = 'red') {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:${color};
      opacity:.3;pointer-events:none;z-index:2000;transition:opacity .4s;`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '0'; });
    setTimeout(() => overlay.remove(), 450);
  }

  showCarjackProgress(pct) {
    const wrap = document.getElementById('hud-carjack');
    const fill = document.getElementById('hud-cj-fill');
    if (wrap) wrap.style.display = 'block';
    if (fill) fill.style.width = `${Math.round(pct * 100)}%`;
  }

  hideCarjackProgress() {
    const wrap = document.getElementById('hud-carjack');
    if (wrap) wrap.style.display = 'none';
  }

  updateMinimap(playerPos, nearbyEntities) {
    const canvas = document.getElementById('hud-minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 60, cy = 60, scale = 0.5;

    ctx.clearRect(0, 0, 120, 120);

    // Background
    ctx.fillStyle = 'rgba(20,20,30,0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.fill();

    // Entities
    if (nearbyEntities) {
      for (const e of nearbyEntities) {
        const rx = cx + (e.position.x - playerPos.x) * scale;
        const ry = cy + (e.position.z - playerPos.z) * scale;
        ctx.fillStyle = e.type === 'police' ? '#f00' : e.type === 'vehicle' ? '#ff0' : '#0af';
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player dot
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy() {
    if (this.root) this.root.innerHTML = '';
    clearTimeout(this.promptTimer);
    console.log('[HUD] Destroyed');
  }
}
