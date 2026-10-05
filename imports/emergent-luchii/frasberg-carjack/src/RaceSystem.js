// ── Frasberg Carjack — RaceSystem ─────────────────────────────────────────────
// Checkpoint street races. Solo = time-trial vs par. With players online:
// host broadcasts a challenge, others press Y to join, first to finish takes the pot.
export class RaceSystem {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.started = false;
    this.checkpoints = [];
    this.idx = 0;
    this.timer = 0;
    this.par = 75;
    this.bet = 200;
    this.mode = 'solo';        // solo | host | guest
    this.participants = 1;
    this.startAt = 0;
    this.lostToOther = false;
    this.pending = null;       // incoming challenge {checkpoints, bet, startAt, by}
    this._pendingT = 0;
  }

  _buildCheckpoints(fromX, fromY) {
    const cps = [];
    let cx = fromX, cy = fromY;
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2;
      const distR = 380 + Math.random() * 260;
      const road = this.engine.worldMap.getNearestRoad(cx + Math.cos(ang) * distR, cy + Math.sin(ang) * distR);
      cx = Math.max(-2200, Math.min(2200, road.x));
      cy = Math.max(-2200, Math.min(2200, road.z));
      cps.push({ x: cx, y: cy });
    }
    return cps;
  }

  start() {
    if (this.active) return;
    const p = this.engine.player;
    if (p.money < this.bet) {
      this.engine.hud.showNotification(`Need $${this.bet} to enter a street race`, 'danger');
      return;
    }
    p.money -= this.bet;
    this.checkpoints = this._buildCheckpoints(p.x, p.y);
    this.idx = 0;
    this.timer = 0;
    this.participants = 1;
    this.lostToOther = false;
    this.active = true;
    const online = this.engine.multiplayer.isConnected && this.engine.multiplayer.remote.size > 0;
    if (online) {
      this.mode = 'host';
      this.started = false;
      this.startAt = Date.now() + 8000;
      this.engine.multiplayer.send('race_challenge', { checkpoints: this.checkpoints, bet: this.bet, startAt: this.startAt });
      this.engine.hud.showNotification(`🏁 CHALLENGE SENT — race starts in 8s. Winner takes the pot!`, 'warning');
    } else {
      this.mode = 'solo';
      this.started = true;
      this.startAt = Date.now();
      this.engine.hud.showNotification(`🏁 STREET RACE — $${this.bet} bet · beat ${this.par}s for 3x payout!`, 'warning');
    }
    this.engine.audio.play('mission_start');
  }

  // Called by GameEngine when a race_challenge arrives
  offer(challenge) {
    if (this.active) return;
    this.pending = challenge;
    this._pendingT = Math.max(0, (challenge.startAt - Date.now()) / 1000);
    this.engine.hud.showNotification(`🏁 ${String(challenge.by).slice(0, 8)} challenges you — press Y to race ($${challenge.bet})`, 'warning');
  }

  joinPending() {
    if (this.active || !this.pending) return;
    const p = this.engine.player;
    if (p.money < this.pending.bet) {
      this.engine.hud.showNotification(`Need $${this.pending.bet} to join the race`, 'danger');
      return;
    }
    if (Date.now() > this.pending.startAt) { this.pending = null; return; }
    p.money -= this.pending.bet;
    this.bet = this.pending.bet;
    this.checkpoints = this.pending.checkpoints;
    this.startAt = this.pending.startAt;
    this.mode = 'guest';
    this.started = false;
    this.idx = 0;
    this.timer = 0;
    this.participants = 2;
    this.lostToOther = false;
    this.active = true;
    this.pending = null;
    this.engine.multiplayer.send('race_join', {});
    this.engine.hud.showNotification('🏁 Race joined — get to the start line!', 'success');
    this.engine.voice?.say('Ready to race!');
  }

  onJoin(by) {
    if (!this.active || this.mode === 'solo') return;
    this.participants++;
    this.engine.hud.showNotification(`🏁 ${String(by).slice(0, 8)} joined the race — pot $${this.bet * this.participants}!`, 'success');
  }

  onRemoteFinish(d) {
    if (!this.active || this.mode === 'solo' || this.lostToOther) return;
    this.lostToOther = true;
    this.engine.hud.showNotification(`🏁 ${String(d.by).slice(0, 8)} finished first in ${d.time}s — pot lost`, 'danger');
  }

  update(dt) {
    if (this.pending) {
      this._pendingT -= dt;
      if (this._pendingT <= 0) this.pending = null;
    }
    if (!this.active) return;
    if (!this.started) {
      if (Date.now() >= this.startAt) {
        this.started = true;
        this.engine.hud.showNotification('🏁 GO GO GO!', 'success');
        this.engine.voice?.say('Go!');
      }
      return;
    }
    this.timer += dt;
    const p = this.engine.player;
    const cp = this.checkpoints[this.idx];
    if (Math.hypot(p.x - cp.x, p.y - cp.y) < 50) {
      this.idx++;
      this.engine.audio.play('checkpoint');
      if (this.mode !== 'solo') this.engine.multiplayer.send('race_cp', { idx: this.idx });
      if (this.idx >= this.checkpoints.length) this._finish();
      else this.engine.hud.showNotification(`Checkpoint ${this.idx}/${this.checkpoints.length} — ${this.timer.toFixed(1)}s`, 'info');
    }
    if (this.timer > this.par * 2) {
      this.active = false;
      this.engine.hud.showNotification('🏁 Race expired — bet lost', 'danger');
    }
  }

  _finish() {
    this.active = false;
    const p = this.engine.player;
    const t = Math.round(this.timer * 10) / 10;
    if (this.mode === 'solo') {
      const won = this.timer <= this.par;
      if (won) {
        const payout = this.bet * 3;
        p.money += payout;
        this.engine.hud.showNotification(`🏆 RACE WON in ${t}s — +$${payout}!`, 'success');
        this.engine.audio.play('mission_complete');
        this.engine.leaderboard.submitScore(p.name, p.money);
      } else {
        this.engine.hud.showNotification(`🏁 Finished in ${t}s — too slow (par ${this.par}s)`, 'danger');
      }
      return;
    }
    // Head-to-head: first finisher takes the whole pot
    this.engine.multiplayer.send('race_finish', { time: t });
    if (this.lostToOther) {
      this.engine.hud.showNotification(`🏁 Finished in ${t}s — second place, no payout`, 'danger');
    } else {
      const pot = this.bet * Math.max(2, this.participants);
      p.money += pot;
      this.engine.hud.showNotification(`🏆 FIRST PLACE in ${t}s — pot +$${pot}!`, 'success');
      this.engine.audio.play('mission_complete');
      this.engine.leaderboard.submitScore(p.name, p.money);
    }
  }

  renderOverlay(octx, w) {
    if (this.active && !this.started) {
      const left = Math.max(0, (this.startAt - Date.now()) / 1000);
      octx.fillStyle = 'rgba(0,0,0,0.65)';
      octx.fillRect(w / 2 - 130, 12, 260, 34);
      octx.fillStyle = '#ffd24a';
      octx.font = 'bold 16px monospace';
      octx.textAlign = 'center';
      octx.fillText(`🏁 RACE STARTS IN ${left.toFixed(1)}s`, w / 2, 34);
      octx.textAlign = 'left';
      return;
    }
    if (!this.active) return;
    octx.fillStyle = 'rgba(0,0,0,0.65)';
    octx.fillRect(w / 2 - 150, 12, 300, 34);
    octx.fillStyle = this.mode === 'solo' ? (this.timer <= this.par ? '#00ff88' : '#ff5a5a') : (this.lostToOther ? '#ff5a5a' : '#00ff88');
    octx.font = 'bold 16px monospace';
    octx.textAlign = 'center';
    const tail = this.mode === 'solo' ? `par ${this.par}s` : `pot $${this.bet * Math.max(2, this.participants)}`;
    octx.fillText(`🏁 ${this.timer.toFixed(1)}s · CP ${this.idx + 1}/${this.checkpoints.length} · ${tail}`, w / 2, 34);
    octx.textAlign = 'left';
  }
}
