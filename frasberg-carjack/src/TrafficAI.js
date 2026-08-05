// ── TrafficAI.js ──────────────────────────────────────────────────────────────
// Spawns and manages AI traffic vehicles throughout the city.

export class TrafficAI {
  constructor(worldMap) {
    this.worldMap = worldMap;
    this.vehicles = new Map();   // id → vehicle
    this.maxVehicles = 80;
    this.spawnRadius = 300;
    this.despawnRadius = 400;
    this.weather = 'clear';
    this._idCounter = 0;

    this.CAR_TYPES = [
      { name: 'Sedan',   speed: 60,  color: '#1a73e8', length: 4.5 },
      { name: 'SUV',     speed: 55,  color: '#34a853', length: 5.0 },
      { name: 'Truck',   speed: 45,  color: '#ea4335', length: 7.0 },
      { name: 'Sports',  speed: 90,  color: '#fbbc04', length: 4.2 },
      { name: 'Bus',     speed: 40,  color: '#ff6d00', length: 12.0 },
      { name: 'Taxi',    speed: 65,  color: '#f9d71c', length: 4.5 },
    ];
  }

  // ── Spawn initial traffic ─────────────────────────────────────────────────────
  init(playerPos = { x: 0, z: 0 }) {
    for (let i = 0; i < 40; i++) {
      this._spawnVehicle(playerPos);
    }
    console.log(`[TrafficAI] Initialised with ${this.vehicles.size} vehicles.`);
  }

  // Alias used by GameEngine
  spawn(count = 30, playerPos = { x: 0, z: 0 }) {
    this.maxVehicles = Math.max(this.maxVehicles, count);
    for (let i = 0; i < count; i++) this._spawnVehicle(playerPos);
  }

  // ── Main update ───────────────────────────────────────────────────────────────
  update(dt, playerPos = { x: 0, z: 0 }) {
    const p = { x: playerPos.x ?? 0, z: playerPos.z ?? playerPos.y ?? 0 };
    // Despawn far vehicles
    for (const [id, v] of this.vehicles) {
      const dist = this._dist(v.position, p);
      if (dist > this.despawnRadius) this.vehicles.delete(id);
    }

    // Spawn new vehicles
    while (this.vehicles.size < this.maxVehicles) {
      this._spawnVehicle(p);
    }

    // Update each vehicle
    for (const v of this.vehicles.values()) {
      this._updateVehicle(v, dt);
    }
  }

  // ── Spawn one vehicle ─────────────────────────────────────────────────────────
  _spawnVehicle(playerPos) {
    const angle  = Math.random() * Math.PI * 2;
    const radius = 150 + Math.random() * (this.spawnRadius - 150);
    const x      = playerPos.x + Math.cos(angle) * radius;
    const z      = playerPos.z + Math.sin(angle) * radius;

    const road = this.worldMap?.getNearestRoad?.(x, z) ?? {
      x, z, direction: Math.round(Math.random() * 3) * (Math.PI / 2), lane: 0,
    };

    const type = this.CAR_TYPES[Math.floor(Math.random() * this.CAR_TYPES.length)];
    const id   = ++this._idCounter;

    this.vehicles.set(id, {
      id,
      type:       type.name,
      color:      type.color,
      length:     type.length,
      position:   { x: road.x, y: 0, z: road.z },
      rotation:   road.direction,
      speed:      type.speed * (0.7 + Math.random() * 0.3),
      maxSpeed:   type.speed,
      state:      'driving',   // driving | stopped | turning | parked
      stopTimer:  0,
      turnTarget: null,
      lane:       road.lane ?? 0,
    });
  }

  // ── Per-vehicle update ────────────────────────────────────────────────────────
  _updateVehicle(v, dt) {
    const weatherMult = this.weather === 'rain' || this.weather === 'heavy-rain' ? 0.7
                      : this.weather === 'fog' ? 0.8 : 1.0;

    switch (v.state) {
      case 'driving': {
        const speedMS = (v.speed * weatherMult) / 3.6;
        v.position.x += Math.sin(v.rotation) * speedMS * dt;
        v.position.z += Math.cos(v.rotation) * speedMS * dt;
        // Random stop or turn
        if (Math.random() < 0.002) { v.state = 'stopped'; v.stopTimer = 1 + Math.random() * 3; }
        else if (Math.random() < 0.004) {
          v.state = 'turning';
          v.turnTarget = v.rotation + (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2);
        }
        break;
      }
      case 'stopped': {
        v.stopTimer -= dt;
        if (v.stopTimer <= 0) v.state = 'driving';
        break;
      }
      case 'turning': {
        const diff = v.turnTarget - v.rotation;
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 1.5 * dt);
        v.rotation += step;
        if (Math.abs(v.turnTarget - v.rotation) < 0.02) {
          v.rotation = v.turnTarget;
          v.state = 'driving';
        }
        break;
      }
    }
  }

  setWeather(type) {
    this.weather = type;
  }

  // ── Render (2D canvas, world space) ──────────────────────────────────────────
  render(ctx) {
    for (const v of this.vehicles.values()) {
      ctx.save();
      ctx.translate(v.position.x, v.position.z);
      ctx.rotate(v.rotation);
      const len = v.length * 8;
      const wid = 20;
      ctx.fillStyle = v.color;
      ctx.fillRect(-wid / 2, -len / 2, wid, len);
      ctx.fillStyle = 'rgba(180,220,255,0.7)';
      ctx.fillRect(-wid / 2 + 3, -len / 2 + 5, wid - 6, 8);
      ctx.restore();
    }
  }

  // ── Get nearest vehicle to a point (for carjacking) ──────────────────────────
  getNearestVehicle(x, z, maxDist = 60) {
    let best = null, bestDist = maxDist;
    for (const v of this.vehicles.values()) {
      const d = this._dist(v.position, { x, z });
      if (d < bestDist) { best = v; bestDist = d; }
    }
    return best;
  }

  removeVehicle(id) { this.vehicles.delete(id); }

  _dist(a, b) {
    return Math.hypot(a.x - b.x, (a.z ?? 0) - (b.z ?? 0));
  }

  destroy() { this.vehicles.clear(); }
}
