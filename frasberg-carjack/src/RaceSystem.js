// ── Frasberg Carjack — RaceSystem (checkpoint street races, bet mission cash) ─
export class RaceSystem {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.checkpoints = [];
    this.idx = 0;
    this.timer = 0;
    this.par = 75;
    this.bet = 200;
  }

  start() {
    if (this.active) return;
    const p = this.engine.player;
    if (p.money < this.bet) {
      this.engine.hud.showNotification(`Need $${this.bet} to enter a street race`, 'danger');
      return;
    }
    p.money -= this.bet;
    this.checkpoints = [];
    let cx = p.x, cy = p.y;
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 380 + Math.random() * 260;
      const road = this.engine.worldMap.getNearestRoad(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
      cx = Math.max(-2200, Math.min(2200, road.x));
      cy = Math.max(-2200, Math.min(2200, road.z));
      this.checkpoints.push({ x: cx, y: cy });
    }
    this.idx = 0;
    this.timer = 0;
    this.active = true;
    this.engine.hud.showNotification(`🏁 STREET RACE — $${this.bet} bet · beat ${this.par}s for 3x payout!`, 'warning');
    this.engine.audio.play('mission_start');
    this.engine.multiplayer.send('race_update', { event: 'started', bet: this.bet });
  }

  update(dt) {
    if (!this.active) return;
    this.timer += dt;
    const p = this.engine.player;
    const cp = this.checkpoints[this.idx];
    if (Math.hypot(p.x - cp.x, p.y - cp.y) < 50) {
      this.idx++;
      this.engine.audio.play('checkpoint');
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
    const won = this.timer <= this.par;
    const p = this.engine.player;
    if (won) {
      const payout = this.bet * 3;
      p.money += payout;
      this.engine.hud.showNotification(`🏆 RACE WON in ${this.timer.toFixed(1)}s — +$${payout}!`, 'success');
      this.engine.audio.play('mission_complete');
      this.engine.leaderboard.submitScore(p.name, p.money);
    } else {
      this.engine.hud.showNotification(`🏁 Finished in ${this.timer.toFixed(1)}s — too slow (par ${this.par}s)`, 'danger');
    }
    this.engine.multiplayer.send('race_update', { event: 'finished', won, time: Math.round(this.timer * 10) / 10 });
  }

  renderOverlay(octx, w) {
    if (!this.active) return;
    octx.fillStyle = 'rgba(0,0,0,0.65)';
    octx.fillRect(w / 2 - 130, 12, 260, 34);
    octx.fillStyle = this.timer <= this.par ? '#00ff88' : '#ff5a5a';
    octx.font = 'bold 16px monospace';
    octx.textAlign = 'center';
    octx.fillText(`🏁 ${this.timer.toFixed(1)}s · CP ${this.idx + 1}/${this.checkpoints.length} · par ${this.par}s`, w / 2, 34);
    octx.textAlign = 'left';
  }
}
