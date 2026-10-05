// ── Frasberg Carjack Game — PhysicsEngine ─────────────────────────────────────

const GRAVITY        = -9.81;
const DRAG_LINEAR    = 0.98;
const DRAG_ANGULAR   = 0.92;
const FRICTION_ROAD  = 0.85;
const FRICTION_GRASS = 0.6;
const RESTITUTION    = 0.35;   // bounciness on collision

export class PhysicsEngine {
  constructor() {
    this.bodies   = new Map();   // id → PhysicsBody
    this.enabled  = true;
    this.timeStep = 1 / 60;
    this.accumulator = 0;
  }

  init() { console.log('[PhysicsEngine] Initialized.'); }

  // ── Register a body ──────────────────────────────────────────────────────
  addBody(id, config = {}) {
    const body = {
      id,
      position:     config.position     || { x: 0, y: 0, z: 0 },
      velocity:     config.velocity     || { x: 0, y: 0, z: 0 },
      acceleration: config.acceleration || { x: 0, y: 0, z: 0 },
      rotation:     config.rotation     || { x: 0, y: 0, z: 0 },
      angularVel:   config.angularVel   || { x: 0, y: 0, z: 0 },
      mass:         config.mass         ?? 1200,
      width:        config.width        ?? 2.0,
      height:       config.height       ?? 1.5,
      length:       config.length       ?? 4.5,
      grounded:     false,
      surface:      'road',
      forces:       [],
      onCollide:    config.onCollide    || null,
      isStatic:     config.isStatic     || false,
    };
    this.bodies.set(id, body);
    return body;
  }

  removeBody(id) { this.bodies.delete(id); }
  getBody(id)    { return this.bodies.get(id); }

  applyForce(id, force) {
    const b = this.bodies.get(id);
    if (b && !b.isStatic) b.forces.push({ ...force });
  }

  applyImpulse(id, impulse) {
    const b = this.bodies.get(id);
    if (!b || b.isStatic) return;
    const invMass = 1 / b.mass;
    b.velocity.x += impulse.x * invMass;
    b.velocity.y += impulse.y * invMass;
    b.velocity.z += impulse.z * invMass;
  }

  // ── Main update ──────────────────────────────────────────────────────────
  update(dt) {
    if (!this.enabled) return;
    this.accumulator += dt;
    while (this.accumulator >= this.timeStep) {
      this._step(this.timeStep);
      this.accumulator -= this.timeStep;
    }
  }

  _step(dt) {
    this.bodies.forEach(body => {
      if (body.isStatic) return;
      this._integrate(body, dt);
    });
    this._detectCollisions();
  }

  // ── Euler integration with friction & gravity ────────────────────────────
  _integrate(b, dt) {
    b.acceleration.x = 0;
    b.acceleration.y = GRAVITY;
    b.acceleration.z = 0;

    b.forces.forEach(f => {
      b.acceleration.x += f.x / b.mass;
      b.acceleration.y += (f.y ?? 0) / b.mass;
      b.acceleration.z += f.z / b.mass;
    });
    b.forces = [];

    b.velocity.x += b.acceleration.x * dt;
    b.velocity.y += b.acceleration.y * dt;
    b.velocity.z += b.acceleration.z * dt;

    if (b.position.y <= 0) {
      b.position.y = 0;
      b.velocity.y = b.velocity.y < 0 ? -b.velocity.y * RESTITUTION : b.velocity.y;
      b.grounded = true;
    } else {
      b.grounded = false;
    }

    if (b.grounded) {
      const friction = b.surface === 'grass' ? FRICTION_GRASS : FRICTION_ROAD;
      b.velocity.x *= friction;
      b.velocity.z *= friction;
    }

    b.velocity.x *= DRAG_LINEAR;
    b.velocity.z *= DRAG_LINEAR;

    b.angularVel.x *= DRAG_ANGULAR;
    b.angularVel.y *= DRAG_ANGULAR;
    b.angularVel.z *= DRAG_ANGULAR;

    b.rotation.x += b.angularVel.x * dt;
    b.rotation.y += b.angularVel.y * dt;
    b.rotation.z += b.angularVel.z * dt;

    b.position.x += b.velocity.x * dt;
    b.position.y += b.velocity.y * dt;
    b.position.z += b.velocity.z * dt;

    const EPSILON = 0.001;
    if (Math.abs(b.velocity.x) < EPSILON) b.velocity.x = 0;
    if (Math.abs(b.velocity.z) < EPSILON) b.velocity.z = 0;
  }

  // ── AABB collision detection ─────────────────────────────────────────────
  _detectCollisions() {
    const bodyList = [...this.bodies.values()];
    for (let i = 0; i < bodyList.length; i++) {
      for (let j = i + 1; j < bodyList.length; j++) {
        const a = bodyList[i];
        const b = bodyList[j];
        if (a.isStatic && b.isStatic) continue;
        if (this._aabbOverlap(a, b)) this._resolveCollision(a, b);
      }
    }
  }

  _aabbOverlap(a, b) {
    const aHW = a.width / 2, aHL = a.length / 2;
    const bHW = b.width / 2, bHL = b.length / 2;
    return (
      Math.abs(a.position.x - b.position.x) < aHW + bHW &&
      Math.abs(a.position.y - b.position.y) < (a.height + b.height) / 2 &&
      Math.abs(a.position.z - b.position.z) < aHL + bHL
    );
  }

  _resolveCollision(a, b) {
    const dx = b.position.x - a.position.x;
    const dz = b.position.z - a.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 0.001;
    const nx = dx / dist;
    const nz = dz / dist;

    const relVx = b.velocity.x - a.velocity.x;
    const relVz = b.velocity.z - a.velocity.z;
    const relVN = relVx * nx + relVz * nz;

    if (relVN > 0) return;   // already separating

    const invMassA = a.isStatic ? 0 : 1 / a.mass;
    const invMassB = b.isStatic ? 0 : 1 / b.mass;
    const jImpulse = (-(1 + RESTITUTION) * relVN) / (invMassA + invMassB || 1);

    a.velocity.x -= jImpulse * nx * invMassA;
    a.velocity.z -= jImpulse * nz * invMassA;
    b.velocity.x += jImpulse * nx * invMassB;
    b.velocity.z += jImpulse * nz * invMassB;

    // Positional correction to stop sinking
    const overlap = (a.width + b.width) / 2 - dist;
    if (overlap > 0) {
      const corr = overlap / 2 + 0.01;
      if (!a.isStatic) { a.position.x -= nx * corr; a.position.z -= nz * corr; }
      if (!b.isStatic) { b.position.x += nx * corr; b.position.z += nz * corr; }
    }

    a.onCollide?.(b, Math.abs(relVN));
    b.onCollide?.(a, Math.abs(relVN));
  }

  // ── CarController hook — simple 2D car-vs-car separation ─────────────────
  resolveCarCollision(car, cars) {
    for (const other of cars) {
      if (other === car || other.id === car.id) continue;
      const dx = other.x - car.x;
      const dy = other.y - car.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const minDist = ((car.width ?? 44) + (other.width ?? 44)) / 2;
      if (dist < minDist) {
        const nx = dx / dist, ny = dy / dist;
        const push = (minDist - dist) / 2;
        car.x -= nx * push; car.y -= ny * push;
        other.x += nx * push; other.y += ny * push;
        car.speed *= 0.85;
        car.health = Math.max(0, (car.health ?? 100) - Math.abs(car.speed) * 0.02);
      }
    }
  }

  pause()  { this.enabled = false; }
  resume() { this.enabled = true; }

  destroy() { this.bodies.clear(); }
}
