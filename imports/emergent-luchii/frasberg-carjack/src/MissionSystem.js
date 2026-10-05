// ── Frasberg Carjack Game — MissionSystem ─────────────────────────────────────

export class MissionSystem {
  constructor(hud, audioEngine, saveSystem) {
    this.hud         = hud;
    this.audio       = audioEngine;
    this.save        = saveSystem;
    this.missions    = new Map();
    this.active      = null;
    this.completed   = new Set();
    this.failed      = new Set();
    this.timerEl     = null;
    this.callbacks   = {};

    this._registerMissions();
  }

  _registerMissions() {
    const defs = [
      {
        id: 'tutorial_carjack',
        title: 'First Score',
        description: 'Steal any vehicle from an NPC.',
        type: 'carjack',
        timeLimit: 120,
        reward: { cash: 500, xp: 100 },
        objectives: [
          { id: 'steal_car', label: 'Steal a vehicle', count: 1, progress: 0 }
        ]
      },
      {
        id: 'delivery_01',
        title: 'Hot Delivery',
        description: 'Deliver a stolen car to the docks within 3 minutes.',
        type: 'delivery',
        timeLimit: 180,
        reward: { cash: 2500, xp: 300 },
        startMarker: { x: 100, y: 0, z: 200 },
        endMarker:   { x: -400, y: 0, z: 600 },
        objectives: [
          { id: 'steal_target', label: 'Steal the marked vehicle', count: 1, progress: 0 },
          { id: 'deliver',      label: 'Deliver to the docks',     count: 1, progress: 0 }
        ]
      },
      {
        id: 'escape_01',
        title: 'Ghost Run',
        description: 'Lose a 3-star wanted level within 2 minutes.',
        type: 'escape',
        timeLimit: 120,
        reward: { cash: 1500, xp: 200 },
        objectives: [
          { id: 'lose_wanted', label: 'Lose wanted level (★★★)', count: 1, progress: 0 }
        ]
      },
      {
        id: 'heist_01',
        title: 'Bank Job',
        description: 'Rob the downtown bank and escape the city.',
        type: 'heist',
        timeLimit: 600,
        reward: { cash: 15000, xp: 1000 },
        objectives: [
          { id: 'enter_bank',      label: 'Enter the bank',        count: 1, progress: 0 },
          { id: 'grab_cash',       label: 'Grab the cash',         count: 1, progress: 0 },
          { id: 'escape_police',   label: 'Escape police pursuit', count: 1, progress: 0 },
          { id: 'reach_safehouse', label: 'Reach the safe house',  count: 1, progress: 0 }
        ]
      },
      {
        id: 'race_01',
        title: 'Street King',
        description: 'Win the Harbour Street race.',
        type: 'race',
        timeLimit: 300,
        reward: { cash: 5000, xp: 500 },
        objectives: [
          { id: 'finish_first', label: 'Finish in 1st place', count: 1, progress: 0 }
        ]
      }
    ];

    defs.forEach(m => this.missions.set(m.id, { ...m }));
  }

  // ── GameEngine compat ────────────────────────────────────────────────────
  loadFirstMission() {
    const first = [...this.missions.keys()].find(id => !this.completed.has(id));
    if (first) this.start(first);
  }

  onCarjack() { this.advanceObjective('steal_car'); this.advanceObjective('steal_target'); }
  triggerEvent(evt) { if (evt?.id) this.advanceObjective(evt.id); }

  renderObjective(ctx) {
    if (!this.active) return;
    const pending = this.active.objectives.find(o => !o.complete);
    if (!pending) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(ctx.canvas.width / 2 - 180, 12, 360, 46);
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.active.title.toUpperCase(), ctx.canvas.width / 2, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    const remaining = Math.max(0, Math.ceil(this.active.timeLimit - (this.active.elapsed || 0)));
    ctx.fillText(`▸ ${pending.label}  ·  ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`, ctx.canvas.width / 2, 48);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ── Start a mission ──────────────────────────────────────────────────────
  start(missionId) {
    const def = this.missions.get(missionId);
    if (!def) { console.warn(`[MissionSystem] Unknown mission: ${missionId}`); return; }
    if (this.active)  { console.warn('[MissionSystem] A mission is already active.'); return; }
    if (this.completed.has(missionId)) { console.log('[MissionSystem] Mission already completed.'); return; }

    this.active = JSON.parse(JSON.stringify(def));
    this.active.startedAt = Date.now();
    this.active.elapsed   = 0;

    this._showBriefing(this.active);
    this.audio?.play?.('mission_start');
    this.hud?.showNotification?.(`Mission started: ${this.active.title}`, 'info');
    this._emit('start', this.active);

    console.log(`[MissionSystem] ▶ ${this.active.title}`);
  }

  update(dt) {
    if (!this.active) return;
    this.active.elapsed += dt;
    if (this.active.timeLimit - this.active.elapsed <= 0) {
      this._fail('Time ran out!');
    }
  }

  advanceObjective(objectiveId, amount = 1) {
    if (!this.active) return;

    const obj = this.active.objectives.find(o => o.id === objectiveId);
    if (!obj || obj.complete) return;

    obj.progress = Math.min(obj.progress + amount, obj.count);
    this.audio?.play?.('objective_ping');

    if (obj.progress >= obj.count) {
      obj.complete = true;
      this.hud?.showNotification?.(`✅ ${obj.label}`, 'success');
    }

    if (this._allObjectivesComplete()) this._complete();
  }

  _allObjectivesComplete() {
    return this.active.objectives.every(o => o.complete);
  }

  _complete() {
    if (!this.active) return;
    const mission = this.active;
    this.completed.add(mission.id);
    this.active = null;

    this.audio?.play?.('mission_complete');
    this.hud?.showNotification?.(`Mission complete: ${mission.title} +$${mission.reward.cash}`, 'success');
    this.save?.addMoney?.(mission.reward.cash);
    this._emit('complete', { money: mission.reward.cash, xp: mission.reward.xp, mission });

    console.log(`[MissionSystem] ✅ Complete — +$${mission.reward.cash} / +${mission.reward.xp} XP`);
  }

  _fail(reason = 'Mission failed') {
    if (!this.active) return;
    const mission = this.active;
    this.failed.add(mission.id);
    this.active = null;

    this.audio?.play?.('mission_fail');
    this.hud?.showNotification?.(`Mission failed: ${reason}`, 'danger');
    this._emit('fail', { mission, reason });

    console.log(`[MissionSystem] ❌ Failed — ${reason}`);
  }

  abandon() { if (this.active) this._fail('Abandoned'); }

  _showBriefing(mission) {
    const overlay = document.createElement('div');
    overlay.id = 'mission-briefing';
    overlay.innerHTML = `
      <div class="briefing-box" style="background:#0d0f18;border:1px solid #e63946;border-radius:12px;padding:28px 36px;max-width:420px;text-align:center;">
        <h2 style="color:#e63946;margin-bottom:8px;">${mission.title}</h2>
        <p style="color:#aab;margin-bottom:14px;">${mission.description}</p>
        <ul style="list-style:none;text-align:left;color:#ddd;margin-bottom:14px;">
          ${mission.objectives.map(o => `<li>☐ ${o.label}</li>`).join('')}
        </ul>
        <div style="color:#2ecc71;font-weight:bold;">
          💰 $${mission.reward.cash.toLocaleString()} &nbsp; ⭐ ${mission.reward.xp} XP
        </div>
      </div>
    `;
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,.75);
      display:flex; align-items:center; justify-content:center;
      z-index:9999; font-family:sans-serif; color:#fff;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 4000);
  }

  on(event, cb)      { this.callbacks[event] = cb; }
  _emit(event, data) { this.callbacks[event]?.(data); }

  getActive()    { return this.active; }
  isActive()     { return !!this.active; }
  getCompleted() { return [...this.completed]; }
  getAvailable() { return [...this.missions.values()].filter(m => !this.completed.has(m.id)); }

  destroy() { this.active = null; }
}
