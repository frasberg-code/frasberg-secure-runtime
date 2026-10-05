// ── Frasberg Carjack System ───────────────────────────────────────────────────

export class CarjackSystem {
  constructor() {
    this.activeCarjack = null;
    this.carjackRange = 3.5;
    this.carjackDuration = 2.5;  // seconds to complete
    this.progress = 0;
    this.onSuccess = null;
    this.onFail = null;
    this.wantedLevelIncrease = 2;
    this._handlers = new Map();
  }

  on(event, handler) { this._handlers.set(event, handler); }
  _emit(event, data) { this._handlers.get(event)?.(data); }

  init(trafficSystem, playerRef, hudRef) {
    this.traffic = trafficSystem;
    this.player = playerRef;
    this.hud = hudRef;
    console.log('[CarjackSystem] Initialized');
  }

  // Call this when player presses carjack button
  attempt(playerPosition, playerVehicle) {
    if (this.activeCarjack) return false;
    const pos = playerPosition || this.player?.position || this.player || { x: 0, z: 0 };

    const target = this.findNearestVehicle(pos);
    if (!target) {
      this.hud?.showPrompt('No vehicle in range');
      return false;
    }

    this.activeCarjack = {
      vehicle: target,
      startTime: performance.now(),
      playerPos: { x: pos.x ?? 0, z: pos.z ?? pos.y ?? 0 }
    };
    this.progress = 0;

    this.hud?.showCarjackProgress(0);
    console.log(`[CarjackSystem] Attempting carjack on vehicle ${target.id}`);
    return true;
  }

  update(dt, playerPosition) {
    if (!this.activeCarjack) return;
    const pos = playerPosition || this.player?.position || this.player || this.activeCarjack.playerPos;

    // Check player hasn't moved too far
    const drift = this.distance(pos, this.activeCarjack.playerPos);
    if (drift > 2) {
      this.cancel('Player moved');
      return;
    }

    this.progress += dt / this.carjackDuration;
    this.hud?.showCarjackProgress(Math.min(this.progress, 1));

    if (this.progress >= 1) {
      this.complete();
    }
  }

  complete() {
    if (!this.activeCarjack) return;

    const vehicle = this.activeCarjack.vehicle;
    console.log(`[CarjackSystem] ✅ Carjack complete — vehicle ${vehicle.id}`);

    // Transfer vehicle ownership to player
    vehicle.owner = 'player';
    vehicle.driverNPC = null;

    this.hud?.hideCarjackProgress();
    this.hud?.showPrompt(vehicle.name ? `${vehicle.name} stolen!` : 'Vehicle stolen!');
    this.hud?.addWantedLevel(this.wantedLevelIncrease);

    this._emit('carjacked', vehicle);
    if (this.onSuccess) this.onSuccess(vehicle);
    this.activeCarjack = null;
    this.progress = 0;
  }

  cancel(reason = 'Cancelled') {
    console.log(`[CarjackSystem] ❌ Carjack cancelled — ${reason}`);
    this.hud?.hideCarjackProgress();
    this.hud?.showPrompt(reason);
    this.activeCarjack = null;
    this.progress = 0;
  }

  findNearestVehicle(position) {
    if (!this.traffic) return null;
    const vehicles = this.traffic.getActiveVehicles
      ? this.traffic.getActiveVehicles()
      : [...(this.traffic.vehicles?.values?.() ?? [])];

    let nearest = null;
    let minDist = this.carjackRange * 15; // canvas-scale range

    for (const v of vehicles) {
      if (v.owner === 'player') continue;
      const d = this.distance(position, v.position ?? v);
      if (d < minDist) {
        minDist = d;
        nearest = v;
      }
    }
    return nearest;
  }

  isCarjacking() { return this.activeCarjack !== null; }
  getProgress() { return this.progress; }

  render(ctx) {
    if (!this.activeCarjack) return;
    const v = this.activeCarjack.vehicle;
    const pos = v.position ?? v;
    ctx.save();
    ctx.strokeStyle = '#f90';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.z ?? pos.y ?? 0, 30, 0, Math.PI * 2 * this.progress);
    ctx.stroke();
    ctx.restore();
  }

  distance(a, b) {
    const ax = a.x ?? 0, az = a.z ?? a.y ?? 0;
    const bx = b.x ?? 0, bz = b.z ?? b.y ?? 0;
    return Math.hypot(ax - bx, az - bz);
  }

  destroy() {
    this.activeCarjack = null;
    console.log('[CarjackSystem] Destroyed');
  }
}
