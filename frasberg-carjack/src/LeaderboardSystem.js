// src/LeaderboardSystem.js — Real-time global rankings via Redis/WebSocket
export class LeaderboardSystem {
  constructor(wsClient) {
    this.ws       = wsClient;
    this.entries  = [];
    this.myRank   = null;
    this.myScore  = 0;
    this.panel    = null;
    this.visible  = false;
    this._buildUI();
    this._listen();
    this._fetchScores();
  }

  // ── Frasberg platform leaderboard (when served from /api/games/{id}/play) ──
  _scoresUrl() {
    try {
      if (!/\/api\/games\//.test(location.pathname)) return null;
      return new URL('scores', location.href).toString();
    } catch { return null; }
  }

  async _fetchScores() {
    const url = this._scoresUrl();
    if (!url) return;
    try {
      const r = await fetch(url);
      if (r.ok) this.update(await r.json());
    } catch {}
  }

  _buildUI() {
    this.panel = document.createElement('div');
    this.panel.id = 'leaderboard';
    this.panel.style.cssText = `
      position:fixed; top:50%; right:-380px; transform:translateY(-50%);
      width:360px; background:rgba(0,0,0,0.92); border:1px solid #00ff88;
      border-radius:12px; padding:20px; color:#fff; font-family:monospace;
      transition:right 0.4s ease; z-index:200;
    `;
    this.panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="color:#00ff88;font-size:18px;font-weight:bold;">🏆 LEADERBOARD</span>
        <span id="lb-close" style="cursor:pointer;color:#888;font-size:20px;">✕</span>
      </div>
      <div id="lb-list" style="max-height:400px;overflow-y:auto;"></div>
      <div id="lb-myrank" style="margin-top:14px;padding:10px;background:#111;border-radius:8px;
        border-left:3px solid #00ff88;font-size:13px;color:#aaa;"></div>
    `;
    document.body.appendChild(this.panel);
    document.getElementById('lb-close').onclick = () => this.hide();
    // Toggle shortcut
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); this.toggle(); }
    });
  }

  _listen() {
    window.addEventListener('ws:message', (e) => {
      const { type, data } = e.detail;
      if (type === 'leaderboard:update') this.update(data);
      if (type === 'leaderboard:rank')   this._updateMyRank(data);
    });
  }

  submitScore(playerName, score, stats = {}) {
    this.myScore = score;
    this.ws?.send?.('leaderboard_submit', {
      name:     playerName,
      score,
      carjacks: stats.carjacks    || 0,
      distance: stats.distance    || 0,
      wanted:   stats.wantedLevel || 0,
    });
    const url = this._scoresUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(playerName).slice(0, 20) || 'PLAYER', score: Math.max(0, Math.floor(score)) }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.top) this.update(d.top); })
        .catch(() => {});
    }
  }

  update(entries) {
    this.entries = entries.sort((a, b) => b.score - a.score);
    const list = document.getElementById('lb-list');
    if (!list) return;
    list.innerHTML = this.entries.slice(0, 20).map((e, i) => `
      <div style="display:flex;align-items:center;padding:8px 0;
        border-bottom:1px solid #1a1a1a;${i < 3 ? 'background:rgba(0,255,136,0.05);border-radius:6px;padding:8px;' : ''}">
        <span style="width:32px;color:${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#555'};
          font-weight:bold;font-size:${i < 3 ? '16px' : '13px'};">
          ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
        </span>
        <span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${this._sanitize(e.name)}
        </span>
        <span style="color:#00ff88;font-weight:bold;font-size:14px;">
          ${e.score.toLocaleString()}
        </span>
      </div>
    `).join('');
  }

  _updateMyRank({ rank, total, score }) {
    this.myRank = rank;
    const el = document.getElementById('lb-myrank');
    if (el) {
      el.innerHTML = `
        Your rank: <span style="color:#00ff88;font-weight:bold;">#${rank}</span>
        of ${total} players &nbsp;|&nbsp; Score: <span style="color:#fff;">${score.toLocaleString()}</span>
      `;
    }
  }

  _sanitize(str) {
    return String(str).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c]));
  }

  show()   { this.visible = true;  this.panel.style.right = '20px'; }
  hide()   { this.visible = false; this.panel.style.right = '-380px'; }
  toggle() { this.visible ? this.hide() : this.show(); }
  destroy() { this.panel?.remove(); }
}
