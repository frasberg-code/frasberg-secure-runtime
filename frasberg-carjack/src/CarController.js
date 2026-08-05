// ── Frasberg Carjack — Car Controller ─────────────────────────────────────────

import { drawVehicle } from './CarSprites.js';

export class CarController {
  constructor(canvas, physicsEngine, audioEngine) {
    this.canvas    = canvas;
    this.physics   = physicsEngine;
    this.audio     = audioEngine;
    this.cars      = new Map();   // id → car state
    this.playerCar = null;

    this.keys = {
      ArrowUp: false, ArrowDown: false,
      ArrowLeft: false, ArrowRight: false,
      KeyW: false, KeyS: false, KeyA: false, KeyD: false,
      Space: false, ShiftLeft: false
    };

    this._bindInput();
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  _bindInput() {
    const down = (e) => { if (e.code in this.keys) this.keys[e.code] = true; };
    const up   = (e) => { if (e.code in this.keys) this.keys[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
  }

  // ── Spawn ──────────────────────────────────────────────────────────────────
  spawnCar(id, config = {}) {
    const car = {
      id,
      x:        config.x        ?? 400,
      y:        config.y        ?? 300,
      angle:    config.angle    ?? 0,
      speed:    0,
      rpm:      800,
      gear:     1,
      health:   100,
      maxSpeed: config.maxSpeed ?? 180,
      accel:    config.accel    ?? 0.18,
      brake:    config.brake    ?? 0.35,
      friction: config.friction ?? 0.025,
      turning:  config.turning  ?? 2.8,
      model:    config.model    ?? 'sedan',
      color:    config.color    ?? '#e74c3c',
      width:    44,
      height:   22,
      isPlayer: config.isPlayer ?? false,
      nitro:    100,
      drifting: false,
    };
    this.cars.set(id, car);
    if (car.isPlayer) this.playerCar = car;
    return car;
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update(dt) {
    for (const [, car] of this.cars) {
      if (car.isPlayer) {
        this._updatePlayerCar(car, dt);
      }
      this._updatePhysics(car, dt);
      this._updateAudio(car);
    }
  }

  _updatePlayerCar(car, dt) {
    const gas   = this.keys.ArrowUp   || this.keys.KeyW;
    const brake = this.keys.ArrowDown || this.keys.KeyS;
    const left  = this.keys.ArrowLeft || this.keys.KeyA;
    const right = this.keys.ArrowRight|| this.keys.KeyD;
    const nitro = this.keys.ShiftLeft && car.nitro > 0;
    const handbrake = this.keys.Space;

    // Acceleration
    if (gas) {
      const boost = nitro ? 2.2 : 1.0;
      car.speed = Math.min(car.speed + car.accel * boost * dt * 60, car.maxSpeed);
      if (nitro) car.nitro = Math.max(0, car.nitro - 0.4 * dt * 60);
    }

    // Brake / reverse
    if (brake) {
      if (car.speed > 0) {
        car.speed = Math.max(0, car.speed - car.brake * dt * 60);
      } else {
        car.speed = Math.max(-car.maxSpeed * 0.4, car.speed - car.accel * dt * 60);
      }
    }

    // Handbrake drift
    if (handbrake && Math.abs(car.speed) > 20) {
      car.drifting = true;
      car.speed   *= 0.97;
    } else {
      car.drifting = false;
    }

    // Steering (speed-sensitive)
    if (Math.abs(car.speed) > 2) {
      const steerFactor = car.drifting ? 1.6 : 1.0;
      const dir = car.speed > 0 ? 1 : -1;
      if (left)  car.angle -= car.turning * steerFactor * dir * dt;
      if (right) car.angle += car.turning * steerFactor * dir * dt;
    }

    // Nitro recharge
    if (!nitro && car.nitro < 100) {
      car.nitro = Math.min(100, car.nitro + 0.08 * dt * 60);
    }
  }

  _updatePhysics(car, dt) {
    // Friction
    if (!this.keys.ArrowUp && !this.keys.KeyW &&
        !this.keys.ArrowDown && !this.keys.KeyS) {
      car.speed *= (1 - car.friction * dt * 60);
      if (Math.abs(car.speed) < 0.1) car.speed = 0;
    }

    // Move
    const rad = (car.angle - 90) * Math.PI / 180;
    car.x += Math.cos(rad) * car.speed * dt;
    car.y += Math.sin(rad) * car.speed * dt;

    // Gear simulation
    const speedPct = Math.abs(car.speed) / car.maxSpeed;
    car.gear = Math.min(6, Math.ceil(speedPct * 6) || 1);
    car.rpm  = 800 + (speedPct % (1/6)) * 6 * 5200;

    // Open world — soft bounds far from origin
    const EXTENT = 2360;
    car.x = Math.max(-EXTENT, Math.min(EXTENT, car.x));
    car.y = Math.max(-EXTENT, Math.min(EXTENT, car.y));

    // Physics engine collision
    if (this.physics) this.physics.resolveCarCollision(car, [...this.cars.values()]);
  }

  _updateAudio(car) {
    if (!this.audio || !car.isPlayer) return;
    this.audio.setEngineRPM(car.rpm);
    if (car.drifting) this.audio.playTireScreech();
  }

  // ── Render — detailed sprite (movement forward is local −Y, sprite front is +Y) ──
  render(ctx, player) {
    for (const [, car] of this.cars) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle * Math.PI / 180 + Math.PI);
      drawVehicle(ctx, car.spec ?? { color: car.color, tier: 'sport', length: 4.7 });
      if (car.drifting) {
        ctx.fillStyle = 'rgba(200,200,200,0.25)';
        ctx.beginPath(); ctx.arc(-8, -20, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -20, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── External controls (for carjack / NPC takeover) ─────────────────────────
  setExternalInput(carId, input) {
    const car = this.cars.get(carId);
    if (!car) return;
    if (input.speed  !== undefined) car.speed  = input.speed;
    if (input.angle  !== undefined) car.angle  = input.angle;
    if (input.x      !== undefined) car.x      = input.x;
    if (input.y      !== undefined) car.y      = input.y;
  }

  takeover(carId, newOwnerId) {
    const car = this.cars.get(carId);
    if (!car) return null;
    car.isPlayer = newOwnerId === 'player';
    if (car.isPlayer) this.playerCar = car;
    return car;
  }

  getPlayerCar()  { return this.playerCar; }
  getCar(id)      { return this.cars.get(id); }
  getAllCars()    { return [...this.cars.values()]; }
  removeCar(id)   { this.cars.delete(id); }

  destroy() {
    this.cars.clear();
    this.playerCar = null;
  }
}
