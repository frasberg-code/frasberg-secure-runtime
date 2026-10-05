// ── Frasberg Carjack — Renderer3D (Three.js pipeline) ─────────────────────────
// Full 3D night-city renderer: procedural city from WorldMap data, real-brand
// low-poly vehicles, human/animal NPCs, police with flashing sirens, chase cam.

import * as THREE from 'three';

const DEG = Math.PI / 180;

function windowTexture(seed = 1) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#2e3340';
  g.fillRect(0, 0, 64, 128);
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let y = 6; y < 122; y += 12) {
    for (let x = 6; x < 58; x += 12) {
      const lit = rnd() < 0.35;
      g.fillStyle = lit ? (rnd() < 0.5 ? '#ffd97a' : '#9fd0ff') : '#181c26';
      g.fillRect(x, y, 7, 8);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class Renderer3D {
  constructor(canvas, worldMap) {
    this.canvas   = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth || canvas.width, canvas.clientHeight || canvas.height, false);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e18);
    this.scene.fog = new THREE.Fog(0x0a0e18, 600, 1900);

    this.camera = new THREE.PerspectiveCamera(62, (canvas.width || 1) / (canvas.height || 1), 1, 5000);
    this.camera.position.set(0, 130, 180);

    this.hemi = new THREE.HemisphereLight(0x8899bb, 0x1c2418, 0.55);
    this.sun  = new THREE.DirectionalLight(0xffeedd, 0.6);
    this.sun.position.set(400, 600, 250);
    this.scene.add(this.hemi, this.sun);

    // Shared geometry/material caches
    this._wheelGeo = new THREE.CylinderGeometry(3.2, 3.2, 3, 10);
    this._wheelMat = new THREE.MeshLambertMaterial({ color: 0x0c0c0e });
    this._headMat  = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
    this._tailMat  = new THREE.MeshBasicMaterial({ color: 0xe5383b });

    this.pools = { vehicles: new Map(), npcs: new Map(), police: new Map(), remote: new Map() };
    this.playerMesh = null;
    this._playerKey = '';
    this.heliMesh   = null;
    this._camPos    = new THREE.Vector3(0, 130, 180);
    this._camLook   = new THREE.Vector3();

    this._buildWorld(worldMap);
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ── Static city ──────────────────────────────────────────────────────────────
  _buildWorld(wm) {
    const world = new THREE.Group();

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(7000, 7000),
      new THREE.MeshLambertMaterial({ color: 0x10131b })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.4;
    world.add(ground);

    // Roads
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2e313a });
    for (const r of wm.roads) {
      const len = Math.hypot(r.x2 - r.x1, r.y2 - r.y1);
      const geo = r.vertical ? new THREE.PlaneGeometry(40, len) : new THREE.PlaneGeometry(len, 40);
      const m = new THREE.Mesh(geo, roadMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((r.x1 + r.x2) / 2, 0, (r.y1 + r.y2) / 2);
      world.add(m);
    }

    // Buildings & parks
    const winTexes = [windowTexture(7), windowTexture(21), windowTexture(55)];
    const parkMat  = new THREE.MeshLambertMaterial({ color: 0x1d3320 });
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
    const leafMat  = new THREE.MeshLambertMaterial({ color: 0x2a4a2e });
    const trunkGeo = new THREE.CylinderGeometry(1.5, 2, 10, 6);
    const leafGeo  = new THREE.ConeGeometry(9, 18, 7);

    let i = 0;
    for (const b of wm.buildings) {
      const cx = b.x + b.w / 2, cz = b.y + b.h / 2;
      if (b.park) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), parkMat);
        p.rotation.x = -Math.PI / 2;
        p.position.set(cx, 0.1, cz);
        world.add(p);
        for (const [ox, oz] of [[-0.25, -0.2], [0.22, 0.25]]) {
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.set(cx + ox * b.w, 5, cz + oz * b.h);
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.set(cx + ox * b.w, 18, cz + oz * b.h);
          world.add(trunk, leaf);
        }
      } else {
        const height = 40 + (Math.abs((b.x * 7919 + b.y * 104729)) % 125);
        const tex = winTexes[i++ % 3];
        const mat = new THREE.MeshLambertMaterial({ color: 0x565d6e, map: tex });
        const box = new THREE.Mesh(new THREE.BoxGeometry(b.w, height, b.h), mat);
        box.position.set(cx, height / 2, cz);
        world.add(box);
      }
    }
    this.scene.add(world);
  }

  // ── Vehicle mesh (nose faces −Z) ─────────────────────────────────────────────
  _carMesh(spec = {}) {
    const g = new THREE.Group();
    const L = (spec.length ?? 4.6) * 9;
    const W = L * (spec.tier === 'truck' ? 0.46 : 0.42);
    const isSport = spec.tier === 'sport' || spec.tier === 'muscle';
    const H = isSport ? L * 0.2 : spec.tier === 'truck' ? L * 0.3 : L * 0.25;
    const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(spec.color ?? '#8f9aa3') });

    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), bodyMat);
    body.position.y = H / 2 + 2.5;
    g.add(body);

    // Cabin
    const cabMat = new THREE.MeshLambertMaterial({ color: 0x1c222c });
    const cabL = spec.tier === 'truck' ? L * 0.32 : L * 0.45;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(W * 0.82, H * 0.72, cabL), cabMat);
    cab.position.set(0, H + 2.5, spec.tier === 'truck' ? -L * 0.18 : -L * 0.05);
    g.add(cab);

    // Truck bed
    if (spec.tier === 'truck') {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.4, L * 0.45), cabMat);
      bed.position.set(0, H * 0.7 + 2.5, L * 0.24);
      g.add(bed);
    }
    // Spoiler
    if (isSport) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 1.6, 4), cabMat);
      sp.position.set(0, H + 4, L / 2 - 3);
      g.add(sp);
    }

    // Wheels
    for (const [sx, sz] of [[-1, -0.3], [1, -0.3], [-1, 0.3], [1, 0.3]]) {
      const wheel = new THREE.Mesh(this._wheelGeo, this._wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * (W / 2), 3.2, sz * L);
      g.add(wheel);
    }

    // Head / tail lights
    const hl = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 1.6, 1), this._headMat);
    hl.position.set(0, H * 0.6 + 2.5, -L / 2 - 0.4);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 1.6, 1), this._tailMat);
    tl.position.set(0, H * 0.6 + 2.5, L / 2 + 0.4);
    g.add(hl, tl);
    return g;
  }

  _policeMesh() {
    const g = this._carMesh({ color: '#12162a', tier: 'standard', length: 4.8 });
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2.2, 4),
      new THREE.MeshBasicMaterial({ color: 0xe63946 })
    );
    bar.position.set(0, 16, 0);
    bar.name = 'siren';
    g.add(bar);
    return g;
  }

  _humanMesh(npc) {
    // Realistic AI-rendered human billboards (falls back to low-poly if texture missing)
    if (!this._npcTex) {
      const tl = new THREE.TextureLoader();
      this._npcTex = {
        man:   { tex: tl.load('/api/games/assets/npc-man.png'),   aspect: 0.51 },
        woman: { tex: tl.load('/api/games/assets/npc-woman.png'), aspect: 0.42 },
        cop:   { tex: tl.load('/api/games/assets/npc-cop.png'),   aspect: 0.33 },
      };
    }
    const key = npc.type === 'cop' ? 'cop' : (npc.gender === 'woman' ? 'woman' : 'man');
    const t = this._npcTex[key];
    const mat = new THREE.SpriteMaterial({ map: t.tex, transparent: true });
    const s = new THREE.Sprite(mat);
    const h = 16;
    s.scale.set(h * t.aspect, h, 1);
    s.center.set(0.5, 0);
    return s;
  }

  _humanMeshLowPoly(npc) {
    const g = new THREE.Group();
    const legs = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.9, 5.5, 7),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(npc.pantsColor ?? '#333') })
    );
    legs.position.y = 2.75;
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2, 5.5, 7),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(npc.shirtColor ?? '#888') })
    );
    torso.position.y = 8.2;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 7),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(npc.skinTone ?? '#e0ac69') })
    );
    head.position.y = 12.6;
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(2.05, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(npc.hairColor ?? '#111') })
    );
    hair.position.y = 13.1;
    g.add(legs, torso, head, hair);
    if (npc.type === 'cop') {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 1, 8),
        new THREE.MeshLambertMaterial({ color: 0x1a2a6b })
      );
      cap.position.y = 14.4;
      g.add(cap);
    }
    return g;
  }

  _animalMesh(npc) {
    const g = new THREE.Group();
    const s = npc.size ?? 4;
    const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(npc.color ?? '#8a6d3b') });
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s, s * 2.2), mat);
    body.position.y = s * 0.9;
    const head = new THREE.Mesh(new THREE.SphereGeometry(s * 0.55, 7, 6), mat);
    head.position.set(0, s * 1.2, -s * 1.3);
    g.add(body, head);
    return g;
  }

  _heliMesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(12, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0x22242e })
    );
    body.scale.set(1, 0.6, 1.6);
    const blades = new THREE.Mesh(
      new THREE.BoxGeometry(56, 0.8, 3),
      new THREE.MeshLambertMaterial({ color: 0xb8bcc4 })
    );
    blades.position.y = 9;
    blades.name = 'blades';
    const spot = new THREE.PointLight(0xaad4ff, 1.2, 220);
    spot.position.y = -6;
    g.add(body, blades, spot);
    return g;
  }

  // ── Pool sync helper ─────────────────────────────────────────────────────────
  _sync(entries, pool, makeFn, placeFn) {
    const seen = new Set();
    for (const [id, e] of entries) {
      seen.add(id);
      let mesh = pool.get(id);
      if (!mesh) {
        mesh = makeFn(e);
        pool.set(id, mesh);
        this.scene.add(mesh);
      }
      placeFn(mesh, e);
    }
    for (const [id, mesh] of pool) {
      if (!seen.has(id)) {
        this.scene.remove(mesh);
        pool.delete(id);
      }
    }
  }

  // ── Frame ────────────────────────────────────────────────────────────────────
  render(state) {
    const { player, playerSpec, vehicles, npcs, police, helicopter, remote, time, dt, weather, bribeSpots, race } = state;

    // Weather → 3D fog
    if (weather && weather !== this._lastWeather) {
      this._lastWeather = weather;
      const f = { clear: [600, 1900], cloudy: [500, 1600], rain: [350, 1200], 'heavy-rain': [220, 800], fog: [120, 550] }[weather] || [600, 1900];
      this.scene.fog.near = f[0]; this.scene.fog.far = f[1];
    }

    // Bribe hideout markers (static, created once)
    if (bribeSpots && !this._bribeMeshes) {
      this._bribeMeshes = bribeSpots.map(sp => {
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(14, 14, 3, 20, 1, true),
          new THREE.MeshBasicMaterial({ color: 0x3ee06c, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
        );
        m.position.set(sp.x, 2, sp.y);
        this.scene.add(m);
        return m;
      });
    }
    if (this._bribeMeshes) {
      const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.12;
      for (const m of this._bribeMeshes) { m.scale.set(pulse, 1, pulse); m.rotation.y += (dt ?? 0.016) * 0.6; }
    }

    // Race checkpoint rings
    const raceKey = race?.active ? `${race.idx}:${race.checkpoints.length}` : '';
    if (raceKey !== this._raceKey) {
      this._raceKey = raceKey;
      (this._raceMeshes || []).forEach(m => this.scene.remove(m));
      this._raceMeshes = [];
      if (race?.active) {
        race.checkpoints.forEach((cp, i) => {
          if (i < race.idx) return;
          const active = i === race.idx;
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(22, active ? 2.4 : 1.2, 8, 28),
            new THREE.MeshBasicMaterial({ color: active ? 0xffb020 : 0x6c63ff, transparent: true, opacity: active ? 0.9 : 0.35 })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(cp.x, 8, cp.y);
          this.scene.add(ring);
          this._raceMeshes.push(ring);
        });
      }
    }
    if (this._raceMeshes?.length) {
      const p2 = 1 + Math.sin(performance.now() * 0.006) * 0.08;
      this._raceMeshes[0]?.scale.setScalar(p2);
    }

    // Player car (rebuild on ride change)
    const key = `${playerSpec?.brand}|${playerSpec?.model}|${playerSpec?.color}`;
    if (key !== this._playerKey) {
      if (this.playerMesh) this.scene.remove(this.playerMesh);
      this.playerMesh = this._carMesh(playerSpec ?? { color: '#e63946', tier: 'sport', length: 4.7 });
      const beam = new THREE.PointLight(0xfff2c4, 1.4, 260);
      beam.position.set(0, 14, -30);
      this.playerMesh.add(beam);
      this.scene.add(this.playerMesh);
      this._playerKey = key;
    }
    const aRad = player.angle * DEG;
    this.playerMesh.position.set(player.x, 0, player.y);
    this.playerMesh.rotation.y = -aRad;

    // Traffic
    this._sync(vehicles, this.pools.vehicles,
      (v) => this._carMesh(v.spec),
      (mesh, v) => {
        mesh.position.set(v.position.x, 0, v.position.z);
        mesh.rotation.y = v.rotation + Math.PI;
      });

    // NPCs
    this._sync(npcs, this.pools.npcs,
      (n) => (n.type === 'animal' ? this._animalMesh(n) : this._humanMesh(n)),
      (mesh, n) => {
        if (n.state === 'dead') { mesh.visible = false; return; }
        mesh.visible = true;
        mesh.position.set(n.position.x, 0, n.position.z);
        mesh.rotation.y = (n.heading ?? 0) + Math.PI;
        const bob = (n.state === 'walking' || n.state === 'running' || n.state === 'scared')
          ? Math.abs(Math.sin(n.walkPhase ?? 0)) * 0.8 : 0;
        mesh.position.y = bob;
      });

    // Police units
    const policeMap = new Map(police.map(u => [u.id, u]));
    this._sync(policeMap, this.pools.police,
      () => this._policeMesh(),
      (mesh, u) => {
        mesh.position.set(u.x, 0, u.y);
        mesh.rotation.y = -((u.angle ?? 0) + Math.PI / 2);
        const bar = mesh.getObjectByName('siren');
        if (bar) bar.material.color.setHex(Math.floor(u.sirenTimer * 8) % 2 === 0 ? 0xe63946 : 0x3a86ff);
      });

    // Helicopter
    if (helicopter) {
      if (!this.heliMesh) { this.heliMesh = this._heliMesh(); this.scene.add(this.heliMesh); }
      this.heliMesh.position.set(helicopter.x, 120, helicopter.y);
      const blades = this.heliMesh.getObjectByName('blades');
      if (blades) blades.rotation.y += (dt ?? 0.016) * 25;
    } else if (this.heliMesh) {
      this.scene.remove(this.heliMesh);
      this.heliMesh = null;
    }

    // Remote players
    this._sync(remote, this.pools.remote,
      () => this._carMesh({ color: '#3a86ff', tier: 'sport', length: 4.7 }),
      (mesh, p) => {
        mesh.position.set(p.x, 0, p.y);
        mesh.rotation.y = -((p.angle ?? 0) * DEG);
      });

    // Day/night
    const hour = (time ?? 720) / 60;
    const night = hour < 6 || hour > 19;
    this.sun.intensity  = night ? 0.2 : 0.85;
    this.hemi.intensity = night ? 0.4 : 0.7;
    const bg = night ? 0x05070f : 0x0a0e18;
    this.scene.background.setHex(bg);
    this.scene.fog.color.setHex(bg);

    // Elevated chase camera — clears the skyline, never clips into buildings
    const fx = Math.sin(aRad), fz = -Math.cos(aRad);
    const desired = new THREE.Vector3(player.x - fx * 85, 235, player.y - fz * 85);
    this._camPos.lerp(desired, 0.07);
    this.camera.position.copy(this._camPos);
    this._camLook.set(player.x + fx * 60, 0, player.y + fz * 60);
    this.camera.lookAt(this._camLook);

    this.renderer.render(this.scene, this.camera);
  }

  // World → screen (for overlay name tags)
  project(x, z, y = 20) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return {
      x: (v.x + 1) / 2 * this.canvas.width,
      y: (1 - (v.y + 1) / 2) * this.canvas.height,
      visible: v.z < 1,
    };
  }

  destroy() {
    this.renderer.dispose();
  }
}
