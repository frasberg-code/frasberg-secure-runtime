// ── Frasberg NPC System — Real AI humans (men & women) + animals ─────────────

const FIRST_NAMES_M = ['Marcus', 'Jamal', 'Diego', 'Andre', 'Viktor', 'Kenji', 'Omar', 'Tyrone', 'Luca', 'Dante'];
const FIRST_NAMES_F = ['Aaliyah', 'Sofia', 'Nia', 'Elena', 'Yuki', 'Fatima', 'Zara', 'Camille', 'Imani', 'Rosa'];
const SKIN_TONES    = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac', '#5c3317'];
const OUTFIT_COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#6d597a', '#212529', '#f4a261', '#adb5bd'];
const HAIR_COLORS   = ['#0b0b0b', '#3b2716', '#5e3b17', '#8a6d3b', '#b0b0b0', '#7a1f1f'];
const ANIMALS       = [
  { species: 'dog',    color: '#8a6d3b', size: 5, speed: 3.0 },
  { species: 'cat',    color: '#4a4a4a', size: 3.5, speed: 2.4 },
  { species: 'pigeon', color: '#9aa3ad', size: 2.5, speed: 4.5 },
];

export class NPCSystem {
  constructor() {
    this.npcs = new Map();
    this.maxNPCs = 50;
    this.spawnRadius = 200;
    this.despawnRadius = 300;
  }

  init(world) {
    this.world = world;
    this.spawnInitialNPCs();
    console.log('[NPCSystem] Initialized');
  }

  spawnInitialNPCs() {
    for (let i = 0; i < 20; i++) {
      this.spawnNPC();
    }
  }

  // Alias used by GameEngine
  spawn(count = 25) {
    for (let i = 0; i < count; i++) this.spawnNPC();
  }

  spawnNPC(position = null) {
    if (this.npcs.size >= this.maxNPCs) return null;

    const id = `npc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const pos = position || this.randomSpawnPoint();
    const type = this.randomNPCType();

    const npc = {
      id,
      position: { ...pos },
      velocity: { x: 0, y: 0 },
      state: 'idle',       // idle | walking | running | scared | dead
      type,
      health: 100,
      awareness: 0,        // 0–1 awareness of player
      walkTarget: null,
      idleTimer: Math.random() * 3,
      walkPhase: Math.random() * Math.PI * 2,   // limb animation
      heading: Math.random() * Math.PI * 2,
      mesh: null,
      ...(type === 'animal' ? this._animalIdentity() : this._humanIdentity(type)),
    };

    this.npcs.set(id, npc);
    return npc;
  }

  // ── Real human identity: man or woman with name, skin tone, outfit ─────────
  _humanIdentity(type) {
    const gender = Math.random() < 0.5 ? 'man' : 'woman';
    const name = gender === 'man'
      ? FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)]
      : FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)];
    return {
      gender,
      name,
      skinTone:   SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
      shirtColor: OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)],
      pantsColor: OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)],
      hairColor:  HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      hairLong:   gender === 'woman' ? Math.random() < 0.7 : Math.random() < 0.15,
    };
  }

  _animalIdentity() {
    const a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return { species: a.species, color: a.color, size: a.size, animalSpeed: a.speed };
  }

  randomNPCType() {
    // 85% humans, 15% animals
    if (Math.random() < 0.15) return 'animal';
    const types = ['civilian', 'vendor', 'gangster', 'cop', 'bystander'];
    return types[Math.floor(Math.random() * types.length)];
  }

  randomSpawnPoint() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 150;
    return {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius
    };
  }

  update(dt, playerPosition = { x: 0, z: 0 }) {
    const p = { x: playerPosition.x ?? 0, z: playerPosition.z ?? playerPosition.y ?? 0 };
    for (const [id, npc] of this.npcs) {
      this.updateNPC(npc, dt, p);
      this.checkDespawn(id, npc, p);
    }
    this.maintainPopulation(p);
  }

  updateNPC(npc, dt, playerPos) {
    const distToPlayer = this.distance(npc.position, playerPos);

    // Update awareness
    if (distToPlayer < 30) {
      npc.awareness = Math.min(1, npc.awareness + dt * 0.5);
    } else {
      npc.awareness = Math.max(0, npc.awareness - dt * 0.2);
    }

    switch (npc.state) {
      case 'idle':
        this.updateIdle(npc, dt);
        if (npc.awareness > 0.7) npc.state = 'scared';
        break;
      case 'walking':
        this.updateWalking(npc, dt);
        if (npc.awareness > 0.7) npc.state = 'running';
        break;
      case 'scared':
        this.updateScared(npc, dt, playerPos);
        break;
      case 'running':
        this.updateRunning(npc, dt, playerPos);
        break;
    }

    // Limb swing animation while moving
    if (npc.state === 'walking') npc.walkPhase += dt * 6;
    if (npc.state === 'running' || npc.state === 'scared') npc.walkPhase += dt * 12;
  }

  updateIdle(npc, dt) {
    npc.idleTimer -= dt;
    if (npc.idleTimer <= 0) {
      npc.walkTarget = this.randomSpawnPoint();
      npc.state = 'walking';
      npc.idleTimer = 2 + Math.random() * 4;
    }
  }

  updateWalking(npc, dt) {
    if (!npc.walkTarget) { npc.state = 'idle'; return; }
    const speed = npc.type === 'animal' ? npc.animalSpeed : 1.5;
    const dir = this.directionTo(npc.position, npc.walkTarget);
    npc.position.x += dir.x * speed * dt;
    npc.position.z += dir.z * speed * dt;
    npc.heading = Math.atan2(dir.x, dir.z);
    if (this.distance(npc.position, npc.walkTarget) < 1) {
      npc.state = 'idle';
      npc.walkTarget = null;
    }
  }

  updateScared(npc, dt, playerPos) {
    // Back away from player
    const dir = this.directionTo(playerPos, npc.position);
    const speed = 2;
    npc.position.x += dir.x * speed * dt;
    npc.position.z += dir.z * speed * dt;
    npc.heading = Math.atan2(dir.x, dir.z);
    if (npc.awareness < 0.3) npc.state = 'idle';
  }

  updateRunning(npc, dt, playerPos) {
    const dir = this.directionTo(playerPos, npc.position);
    const speed = npc.type === 'animal' ? npc.animalSpeed * 1.8 : 4;
    npc.position.x += dir.x * speed * dt;
    npc.position.z += dir.z * speed * dt;
    npc.heading = Math.atan2(dir.x, dir.z);
    if (npc.awareness < 0.2) npc.state = 'walking';
  }

  checkDespawn(id, npc, playerPos) {
    if (this.distance(npc.position, playerPos) > this.despawnRadius) {
      this.npcs.delete(id);
    }
  }

  maintainPopulation(playerPos) {
    if (this.npcs.size < 15) this.spawnNPC();
  }

  // ── Render — human-looking figures & animals (2D canvas, world space) ───────
  render(ctx) {
    for (const npc of this.npcs.values()) {
      if (npc.state === 'dead') continue;
      const { x, z } = npc.position;
      ctx.save();
      ctx.translate(x, z);

      if (npc.type === 'animal') {
        this._renderAnimal(ctx, npc);
      } else {
        this._renderHuman(ctx, npc);
      }
      ctx.restore();
    }
  }

  _renderHuman(ctx, npc) {
    ctx.rotate(npc.heading);
    const swing = Math.sin(npc.walkPhase) * 3;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 2, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Arms (swing while walking)
    ctx.strokeStyle = npc.skinTone;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-7, swing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 0);  ctx.lineTo(7, -swing); ctx.stroke();
    // Body (shirt)
    ctx.fillStyle = npc.shirtColor;
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    // Legs hint (pants)
    ctx.fillStyle = npc.pantsColor;
    ctx.fillRect(-3.5, 3, 3, 3.5 + swing * 0.3);
    ctx.fillRect(0.5, 3, 3, 3.5 - swing * 0.3);
    // Head (skin tone)
    ctx.fillStyle = npc.skinTone;
    ctx.beginPath(); ctx.arc(0, -3, 3.5, 0, Math.PI * 2); ctx.fill();
    // Hair
    ctx.fillStyle = npc.hairColor;
    if (npc.hairLong) {
      ctx.beginPath(); ctx.arc(0, -3.5, 3.6, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
      ctx.fillRect(-3.5, -3.5, 7, 4);
    } else {
      ctx.beginPath(); ctx.arc(0, -4, 3.2, Math.PI, Math.PI * 2); ctx.fill();
    }
    // Cop hat
    if (npc.type === 'cop') {
      ctx.fillStyle = '#1a2a6b';
      ctx.beginPath(); ctx.arc(0, -4, 3.4, Math.PI, Math.PI * 2); ctx.fill();
    }
  }

  _renderAnimal(ctx, npc) {
    ctx.rotate(npc.heading);
    const s = npc.size;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(0, 1, s, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = npc.color;
    if (npc.species === 'pigeon') {
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * 1.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b7480';
      ctx.beginPath(); ctx.arc(0, -s * 1.2, s * 0.5, 0, Math.PI * 2); ctx.fill();
    } else {
      // Dog / cat — body + head + tail
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.7, s * 1.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -s * 1.3, s * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = npc.color;
      ctx.lineWidth = 1.5;
      const wag = Math.sin(npc.walkPhase * 2) * 2;
      ctx.beginPath(); ctx.moveTo(0, s * 1.2); ctx.lineTo(wag, s * 2); ctx.stroke();
    }
  }

  updateNPCLegacy() {}

  distance(a, b) {
    const dx = a.x - b.x;
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  directionTo(from, to) {
    const dx = to.x - from.x;
    const dz = (to.z || 0) - (from.z || 0);
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    return { x: dx / len, z: dz / len };
  }

  getNearbyNPCs(position, radius) {
    return Array.from(this.npcs.values())
      .filter(npc => this.distance(npc.position, position) <= radius);
  }

  triggerPanic(x, z, radius = 40) {
    for (const npc of this.npcs.values()) {
      if (this.distance(npc.position, { x, z }) < radius) {
        npc.awareness = 1;
        npc.state = 'running';
      }
    }
  }

  killNPC(id) {
    const npc = this.npcs.get(id);
    if (npc) { npc.state = 'dead'; npc.health = 0; }
  }

  destroy() {
    this.npcs.clear();
    console.log('[NPCSystem] Destroyed');
  }
}
