// src/GameEngine.js — Master game loop, all systems wired (Three.js renderer)
import { CarController }    from './CarController.js';
import { TrafficAI }        from './TrafficAI.js';
import { NPCSystem }        from './NPCSystem.js';
import { CarjackSystem }    from './CarjackSystem.js';
import { HUD }              from './HUD.js';
import { AudioEngine }      from './AudioEngine.js';
import { SaveSystem }       from './SaveSystem.js';
import { WorldMap }         from './WorldMap.js';
import { PoliceAI }         from './PoliceAI.js';
import { MissionSystem }    from './MissionSystem.js';
import { PhysicsEngine }    from './PhysicsEngine.js';
import { WeatherSystem }    from './WeatherSystem.js';
import { LeaderboardSystem } from './LeaderboardSystem.js';
import { MinimapSystem }    from './MinimapSystem.js';
import { EventSystem }      from './EventSystem.js';
import { MultiplayerClient } from './MultiplayerClient.js';
import { Renderer3D }       from './Renderer3D.js';
import { ShowroomSystem }   from './ShowroomSystem.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas  = canvas;
    this.running = false;
    this.paused  = false;
    this.lastTime = 0;
    this.fps     = 0;
    this.frameCount = 0;
    this.fpsTimer   = 0;
    this._dt        = 0.016;
    this._hitFlashCooldown = 0;
    // 2D overlay (mission text, name tags, big map, pause) above the WebGL canvas
    this.overlay = document.createElement('canvas');
    this.overlay.width  = canvas.width;
    this.overlay.height = canvas.height;
    this.overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:50;';
    document.body.appendChild(this.overlay);
    this.octx = this.overlay.getContext('2d');
    // ── Player State ───────────────────────────────────────────
    const spawnOff = () => Math.round((Math.random() - 0.5) * 240);
    this.player = {
      x: 640 + spawnOff(), y: 360 + spawnOff(),
      angle: 0, speed: 0,
      health: 100, maxHealth: 100,
      money: 1500, wantedLevel: 0,
      name: 'Frasberg',
      carName: 'Frasberg GT',
      color: '#e63946',
      inVehicle: true,
      isAlive: true,
    };
    // ── Systems (dependency order) ─────────────────────────────
    this.physics     = new PhysicsEngine();
    this.audio       = new AudioEngine();
    this.hud         = new HUD();
    this.save        = new SaveSystem();
    this.worldMap    = new WorldMap(this.octx);
    this.traffic     = new TrafficAI(this.worldMap);
    this.npcs        = new NPCSystem();
    this.car         = new CarController(this.canvas, this.physics, this.audio);
    this.carjack     = new CarjackSystem();
    this.police      = new PoliceAI();
    this.missions    = new MissionSystem(this.hud, this.audio, this.save);
    this.weather     = new WeatherSystem();
    this.events      = new EventSystem();
    this.minimap     = new MinimapSystem(4800);
    this.multiplayer = new MultiplayerClient(this.player);
    this.leaderboard = new LeaderboardSystem(this.multiplayer);
    this.showroom    = new ShowroomSystem(this);
    this.renderer3d  = null;
    this.playerCar   = null;
    // ── Input ──────────────────────────────────────────────────
    this.keys = {};
    this._bindInput();
    this._bindResize();
    this._wireEvents();
    this._bindElectronMenu();
  }

  // ── Init ────────────────────────────────────────────────────
  async init() {
    this.hud.init();
    this.physics.init();
    await this.worldMap.load();
    // Spawn on a road, not inside a building
    const road = this.worldMap.getNearestRoad(this.player.x, this.player.y);
    this.player.x = road.x;
    this.player.y = road.z;
    this.renderer3d = new Renderer3D(this.canvas, this.worldMap);
    this.carjack.init(this.traffic, this.player, this.hud);
    // Player car
    this.playerCar = this.car.spawnCar('player', {
      x: this.player.x, y: this.player.y,
      isPlayer: true, color: this.player.color, maxSpeed: 220, accel: 0.55,
    });
    this.playerCar.spec = { brand: 'Frasberg', model: 'GT', tier: 'sport', color: this.player.color, length: 4.7, topSpeed: 290 };
    // Restore save
    const saved = this.save.load();
    if (saved?.money != null) this.player.money = saved.money;
    if (saved?.player?.money != null) this.player.money = saved.player.money;
    this.showroom.restore(saved?.garage);
    // World population
    this.traffic.spawn(30, { x: this.player.x, z: this.player.y });
    this.npcs.spawn(25);
    this.missions.loadFirstMission();
    this.events.start?.();
    // Multiplayer (non-blocking — game runs solo if server is down)
    this.multiplayer.connect().catch(() => {});
    console.log('[GameEngine] All systems online (3D).');
    this.start();
  }

  // ── Ride swap (showroom + carjack) ──────────────────────────
  equipVehicle(spec, { silent = false } = {}) {
    if (!this.playerCar) return;
    this.playerCar.color    = spec.color;
    this.playerCar.maxSpeed = Math.min(260, (spec.topSpeed ?? 180) * 0.75);
    this.playerCar.spec     = spec;
    this.player.carName     = `${spec.brand} ${spec.model}`;
    if (!silent) this.hud.showNotification(`Now driving: ${this.player.carName}`, 'info');
  }

  // ── Game Loop ────────────────────────────────────────────────
  start() {
    this.running = true;
    requestAnimationFrame((t) => this._loop(t));
  }
  stop() { this.running = false; }

  _loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this._dt = dt;
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer   = 0;
    }
    if (!this.paused) {
      this._update(dt);
    }
    this._render(dt);
    requestAnimationFrame((t) => this._loop(t));
  }

  // ── Update ────────────────────────────────────────────────────
  _update(dt) {
    this.physics.update(dt);
    this.car.update(dt);
    const pc = this.playerCar;
    if (pc) {
      this.player.x     = pc.x;
      this.player.y     = pc.y;
      this.player.angle = pc.angle;
      this.player.speed = pc.speed;
      this.player.health = Math.min(this.player.health, pc.health ?? 100);
    }
    const pos = { x: this.player.x, z: this.player.y };
    this.traffic.update(dt, pos);
    this.npcs.update(dt, pos);
    this.weather.update(dt);
    this.carjack.update(dt, pos);
    this.police.update(dt, this.player);
    this.missions.update(dt);
    this.events.update(dt, this.player);
    this._hitFlashCooldown = Math.max(0, this._hitFlashCooldown - dt);
    this.hud.update({
      health: this.player.health,
      money:  this.player.money,
      speed:  Math.abs(Math.round(this.player.speed)),
    });
    this.hud.setWantedLevel(this.player.wantedLevel);
    this.minimap.setPlayer('local', this.player.x, this.player.y, this.player.angle * Math.PI / 180, true);
    this.minimap.update(dt * 1000);
    this.worldMap.update(dt, this.player);
    this.multiplayer.sendUpdate(this.player);
    for (const [id, p] of this.multiplayer.remote) {
      this.minimap.setPlayer(id, p.x, p.y, 0, false);
    }
    this.audio.update?.(this.player);
    this._autoSave(dt);
  }

  // ── Render (Three.js world + 2D overlay) ─────────────────────
  _render(dt) {
    if (this.renderer3d) {
      this.renderer3d.render({
        player: this.player,
        playerSpec: this.playerCar?.spec,
        vehicles: this.traffic.vehicles,
        npcs: this.npcs.npcs,
        police: this.police.units,
        helicopter: this.police.helicopter,
        remote: this.multiplayer.remote,
        time: this.worldMap.time,
        dt,
      });
    }
    const octx = this.octx;
    octx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.missions.renderObjective(octx);
    this._renderNameTags(octx);
    this.worldMap.renderBigMapOverlay(octx, this.player);
    if (this.paused && !this.showroom.visible) this._renderPauseScreen(octx);
  }

  _renderNameTags(octx) {
    if (!this.renderer3d) return;
    for (const [id, p] of this.multiplayer.remote) {
      const s = this.renderer3d.project(p.x, p.y, 26);
      if (!s.visible) continue;
      octx.fillStyle = 'rgba(0,0,0,0.6)';
      octx.fillRect(s.x - 32, s.y - 10, 64, 15);
      octx.fillStyle = '#3a86ff';
      octx.font = 'bold 10px monospace';
      octx.textAlign = 'center';
      octx.fillText(String(id).slice(0, 8), s.x, s.y + 1);
      octx.textAlign = 'left';
    }
  }

  // ── Pause ─────────────────────────────────────────────────────
  pause()  { this.paused = true;  this.audio.setMasterVolume(0.2); }
  resume() { this.paused = false; this.audio.setMasterVolume(1.0); }
  toggle() { this.paused ? this.resume() : this.pause(); }

  _renderPauseScreen(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.overlay.width / 2, this.overlay.height / 2);
    ctx.font      = '24px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press ESC to resume', this.overlay.width / 2, this.overlay.height / 2 + 48);
    ctx.textAlign = 'left';
  }

  // ── Cross-system Event Wiring ──────────────────────────────────
  _wireEvents() {
    this.carjack.on('carjacked', (vehicle) => {
      this.player.wantedLevel = Math.min(5, this.player.wantedLevel + 1);
      this.police.escalate(this.player.wantedLevel);
      this.audio.play('siren');
      this.missions.onCarjack();
      if (vehicle?.spec) {
        this.equipVehicle(vehicle.spec, { silent: true });
        this.showroom.owned.add(ShowroomSystem.id(vehicle.spec));
        this.showroom.activeId = ShowroomSystem.id(vehicle.spec);
      }
      if (vehicle?.id != null) this.traffic.removeVehicle(vehicle.id);
      this.npcs.triggerPanic(this.player.x, this.player.y, 60);
      this.multiplayer.sendCarjack(vehicle?.id, this.player.x, this.player.y);
    });
    this.police.on('playerHit', (dmg) => {
      this.player.health -= dmg * this._dt * 4;
      if (this._hitFlashCooldown <= 0) {
        this.hud.flash('red');
        this.audio.play('hit');
        this._hitFlashCooldown = 0.8;
      }
      if (this.player.health <= 0) this._onPlayerDied();
    });
    this.missions.on('complete', (reward) => {
      this.player.money += reward.money;
      this.hud.showNotification(`Mission Complete! +$${reward.money}`, 'green');
      this.audio.play('mission_complete');
      this.leaderboard.submitScore(this.player.name, this.player.money);
    });
    window.addEventListener('weather:change', (e) => {
      this.traffic.setWeather(e.detail.type);
      this.audio.setWeather(e.detail.type);
    });
    this.events.on?.('worldEvent', (evt) => {
      this.missions.triggerEvent(evt);
      this.hud.showNotification(evt.title, 'yellow');
    });
    this.multiplayer.on('carjack_event', (data) => {
      this.hud.showNotification(`Player ${String(data.by).slice(0, 8)} carjacked a vehicle!`, 'orange');
    });
    this.multiplayer.on('encrypted',    () => this.hud.showNotification('🔐 Secure connection established', 'blue'));
    this.multiplayer.on('disconnected', () => this.hud.showNotification('⚠️ Connection lost — reconnecting...', 'warning'));
    this.multiplayer.on('connected',    () => this.hud.showNotification('✅ Multiplayer online', 'success'));
    this.multiplayer.on('player_left',  ({ id }) => this.minimap.removePlayer(id));
    window.addEventListener('beforeunload', () => this._persist());
  }

  _persist() {
    this.save.save({
      money: this.player.money,
      x: this.player.x, y: this.player.y,
      carName: this.player.carName,
      garage: this.showroom.serialize(),
    });
  }

  // ── Auto-save ─────────────────────────────────────────────────
  _autoSaveTimer = 0;
  _autoSave(dt) {
    this._autoSaveTimer += dt;
    if (this._autoSaveTimer >= 60) {
      this._autoSaveTimer = 0;
      this._persist();
      this.hud.showNotification('Game auto-saved', 'blue');
    }
  }

  // ── Player Death ──────────────────────────────────────────────
  _onPlayerDied() {
    this.player.health     = this.player.maxHealth;
    this.player.wantedLevel = 0;
    this.player.x          = 640;
    this.player.y          = 360;
    if (this.playerCar) {
      this.playerCar.x = 640;
      this.playerCar.y = 360;
      this.playerCar.speed = 0;
      this.playerCar.health = 100;
    }
    this.police.clearPursuit();
    this.hud.showNotification('Busted! Respawning...', 'red');
    this.audio.play('busted');
    this._persist();
  }

  // ── Input ─────────────────────────────────────────────────────
  _bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape') {
        if (this.showroom.visible) this.showroom.close();
        else this.toggle();
      }
      if (e.code === 'KeyF')   this.carjack.attempt({ x: this.player.x, z: this.player.y });
      if (e.code === 'KeyH')   this.audio.play('horn');
      if (e.code === 'KeyL')   this.leaderboard.toggle();
      if (e.code === 'F11')    this._toggleFullscreen();
      this.audio.resume?.();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  _bindResize() {
    window.addEventListener('resize', () => this._resize());
  }
  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.overlay.width  = window.innerWidth;
    this.overlay.height = window.innerHeight;
    this.renderer3d?.resize(window.innerWidth, window.innerHeight);
  }
  _toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }

  // ── Electron menu events ──────────────────────────────────────
  _bindElectronMenu() {
    if (!window.electronAPI) return;
    window.electronAPI.onMenuEvent((event) => {
      if (event === 'menu:save')     this._persist();
      if (event === 'menu:load')     location.reload();
      if (event === 'menu:new-game') { this.save.delete?.(); location.reload(); }
    });
  }
}
