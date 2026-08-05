// src/PoliceAI.js — Police chase system
export class PoliceAI {
  constructor() {
    this.units      = [];
    this.helicopter = null;
    this.active     = false;
    this.level      = 0;
    this._handlers  = new Map();
  }

  on(event, handler) { this._handlers.set(event, handler); }
  _emit(event, data) { this._handlers.get(event)?.(data); }

  update(dt, player) {
    this.level = player?.wantedLevel || this.level;
    this.active = this.level > 0;
    if (!this.active) { this.units = []; this.helicopter = null; return; }
    if (!player) return;
    // Spawn units based on wanted level
    const targetCount = this.level * 2;
    while (this.units.length < targetCount) {
      this.units.push(this._spawnUnit(player));
    }
    // Update unit positions (simple pursuit)
    for (const unit of this.units) {
      const dx = player.x - unit.x;
      const dy = player.y - unit.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        unit.x += (dx / dist) * unit.speed * dt * 0.06;
        unit.y += (dy / dist) * unit.speed * dt * 0.06;
        unit.angle = Math.atan2(dy, dx);
      }
      unit.sirenTimer += dt;
      // Close-range damage
      if (dist < 28) this._emit('playerHit', 2 + this.level);
    }
    // Helicopter at wanted level 4+
    if (this.level >= 4 && !this.helicopter) {
      this.helicopter = { x: player.x, y: player.y - 80, bladeAngle: 0 };
    }
    if (this.helicopter) {
      this.helicopter.x += (player.x - this.helicopter.x) * 0.02;
      this.helicopter.y += (player.y - 80 - this.helicopter.y) * 0.02;
      this.helicopter.bladeAngle += dt * 0.02;
    }
  }

  _spawnUnit(player) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 400 + Math.random() * 200;
    return {
      x:          player.x + Math.cos(angle) * dist,
      y:          player.y + Math.sin(angle) * dist,
      angle:      0,
      speed:      3 + this.level * 0.5,
      sirenTimer: 0,
      id:         Math.random().toString(36).slice(2),
    };
  }

  checkCaught(player) {
    if (!this.active) return false;
    for (const unit of this.units) {
      if (Math.hypot(player.x - unit.x, player.y - unit.y) < 30) {
        return true;
      }
    }
    return false;
  }

  escalate(level) {
    this.level = Math.min(5, level);
    this.active = this.level > 0;
  }

  clearPursuit() {
    this.units      = [];
    this.helicopter = null;
    this.level      = 0;
    this.active     = false;
  }

  render(ctx) {
    for (const unit of this.units) {
      ctx.save();
      ctx.translate(unit.x, unit.y);
      ctx.rotate(unit.angle + Math.PI / 2);
      // Body
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(-10, -18, 20, 36);
      // Siren flash
      const flash = Math.floor(unit.sirenTimer * 8) % 2 === 0;
      ctx.fillStyle = flash ? '#e63946' : '#3498db';
      ctx.fillRect(-8, -6, 16, 6);
      ctx.restore();
    }
    if (this.helicopter) {
      const h = this.helicopter;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,200,200,0.7)';
      ctx.lineWidth = 2;
      ctx.save();
      ctx.rotate(h.bladeAngle);
      ctx.beginPath();
      ctx.moveTo(-24, 0); ctx.lineTo(24, 0);
      ctx.moveTo(0, -24); ctx.lineTo(0, 24);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }
  }
}
