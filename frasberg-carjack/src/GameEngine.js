// src/GameEngine.js — Master game loop, all systems wired
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

export class GameEngine {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.running = false;
    this.paused  = false;
    this.lastTime = 0;
    this.fps     = 0;
    this.frameCount = 0;
    this.fpsTimer   = 0;
    this._dt        = 0.016;
    this._hitFlashCooldown = 0;
    // ── Player State ───────────────────────────────────────────
    this.player = {
      x: 640, y: 360,
      angle: 0, speed: 0,
      health: 100, maxHealth: 100,
      money: 0, wantedLevel: 0,
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
    this.worldMap    = new WorldMap(this.ctx);
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
    this.carjack.init(this.traffic, this.player, this.hud);
    // Restore save
    const saved = this.save.load();
    if (saved?.money != null)  this.player.money = saved.money;
    if (saved?.player?.money != null) this.player.money = saved.player.money;
    // Player car
    this.playerCar = this.car.spawnCar('player', {
      x: this.player.x, y: this.player.y,
      isPlayer: true, color: this.player.color, maxSpeed: 220, accel: 0.55,
    });
    this.playerCar.spec = { brand: 'Frasberg', model: 'GT', tier: 'sport', color: this.player.color, length: 4.7 };
    // World population
    this.traffic.spawn(30, { x: this.player.x, z: this.player.y });
    this.npcs.spawn(25);
    this.missions.loadFirstMission();
    this.events.start?.();
    // Multiplayer (non-blocking — game runs solo if server is down)
    this.multiplayer.connect().catch(() => {});
    console.log('[GameEngine] All systems online.');
    this.start();
  }

  // ── Game Loop ────────────────────────────────────────────────
  start() {
    this.running = true;
    requestAnimationFrame((t) => this._loop(t));
  }
  stop() { this.running = false; }

  _loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = timestamp;
    this._dt = dt;
    // FPS counter
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
    // Sync player state from the driven car
    const pc = this.playerCar;
    if (pc) {
      this.player.x     = pc.x;
      this.player.y     = pc.y;
      this.player.angle = pc.angle;
      this.player.speed = pc.speed;
      this.player.health = Math.min(this.player.health, pc.health ?? 100);
    }
    const pos = { x: this.player.x, z: this.player.y };
    // World systems
    this.traffic.update(dt, pos);
    this.npcs.update(dt, pos);
    this.weather.update(dt);
    // Game logic
    this.carjack.update(dt, pos);
    this.police.update(dt, this.player);
    this.missions.update(dt);
    this.events.update(dt, this.player);
    this._hitFlashCooldown = Math.max(0, this._hitFlashCooldown - dt);
    // UI systems
    this.hud.update({
      health: this.player.health,
      money:  this.player.money,
      speed:  Math.abs(Math.round(this.player.speed)),
    });
    this.hud.setWantedLevel(this.player.wantedLevel);
    this.minimap.setPlayer('local', this.player.x, this.player.y, this.player.angle * Math.PI / 180, true);
    this.minimap.update(dt * 1000);
    this.worldMap.update(dt, this.player);
    // Multiplayer sync
    this.multiplayer.sendUpdate(this.player);
    for (const [id, p] of this.multiplayer.remote) {
      this.minimap.setPlayer(id, p.x, p.y, 0, false);
    }
    // Audio
    this.audio.update?.(this.player);
    // Auto-save every 60s
    this._autoSave(dt);
  }

  // ── Render ────────────────────────────────────────────────────
  _render(dt) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // World (camera follows player)
    ctx.save();
    const camX = canvas.width  / 2 - this.player.x;
    const camY = canvas.height / 2 - this.player.y;
    ctx.translate(camX, camY);
    this.worldMap.render(ctx, this.player);
    this.traffic.render(ctx);
    this.npcs.render(ctx);
    this.police.render(ctx);
    this.carjack.render(ctx);
    this.car.render(ctx, this.player);
    ctx.restore();
    // UI (fixed — no camera transform)
    this.missions.renderObjective(ctx);
    this.multiplayer.renderOtherPlayers(ctx, camX, camY);
    this.events.draw?.(ctx, canvas);
    if (this.paused) this._renderPauseScreen(ctx);
  }

  // ── Pause ─────────────────────────────────────────────────────
  pause()  { this.paused = true;  this.audio.setMasterVolume(0.2); }
  resume() { this.paused = false; this.audio.setMasterVolume(1.0); }
  toggle() { this.paused ? this.resume() : this.pause(); }

  _renderPauseScreen(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle    = '#fff';
    ctx.font         = 'bold 48px monospace';
    ctx.textAlign    = 'center';
    ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    ctx.font         = '24px monospace';
    ctx.fillStyle    = '#aaa';
    ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 48);
    ctx.textAlign    = 'left';
  }

  // ── Cross-system Event Wiring ──────────────────────────────────
  _wireEvents() {
    // Carjack → swap ride, wanted level, police
    this.carjack.on('carjacked', (vehicle) => {
      this.player.wantedLevel = Math.min(5, this.player.wantedLevel + 1);
      this.police.escalate(this.player.wantedLevel);
      this.audio.play('siren');
      this.missions.onCarjack();
      // Take the stolen car as the player's ride
      if (vehicle?.spec && this.playerCar) {
        this.playerCar.color    = vehicle.spec.color;
        this.playerCar.maxSpeed = Math.min(260, (vehicle.spec.topSpeed ?? 180) * 0.75);
        this.playerCar.spec     = vehicle.spec;
        this.player.carName     = vehicle.name ?? this.player.carName;
      }
      if (vehicle?.id != null) this.traffic.removeVehicle(vehicle.id);
      this.npcs.triggerPanic(this.player.x, this.player.y, 60);
      this.multiplayer.sendCarjack(vehicle?.id, this.player.x, this.player.y);
    });
    // Police → player damage (dt-scaled, flash throttled)
    this.police.on('playerHit', (dmg) => {
      this.player.health -= dmg * this._dt * 4;
      if (this._hitFlashCooldown <= 0) {
        this.hud.flash('red');
        this.audio.play('hit');
        this._hitFlashCooldown = 0.8;
      }
      if (this.player.health <= 0) this._onPlayerDied();
    });
    // Mission → reward
    this.missions.on('complete', (reward) => {
      this.player.money += reward.money;
      this.hud.showNotification(`Mission Complete! +$${reward.money}`, 'green');
      this.audio.play('mission_complete');
      this.leaderboard.submitScore(this.player.name, this.player.money);
    });
    // Weather → traffic behaviour
    window.addEventListener('weather:change', (e) => {
      this.traffic.setWeather(e.detail.type);
      this.audio.setWeather(e.detail.type);
    });
    // Events → missions + HUD
    this.events.on?.('worldEvent', (evt) => {
      this.missions.triggerEvent(evt);
      this.hud.showNotification(evt.title, 'yellow');
    });
    // Multiplayer notifications
    this.multiplayer.on('carjack_event', (data) => {
      this.hud.showNotification(`Player ${String(data.by).slice(0, 8)} carjacked a vehicle!`, 'orange');
    });
    this.multiplayer.on('encrypted',    () => this.hud.showNotification('🔐 Secure connection established', 'blue'));
    this.multiplayer.on('disconnected', () => this.hud.showNotification('⚠️ Connection lost — reconnecting...', 'warning'));
    this.multiplayer.on('connected',    () => this.hud.showNotification('✅ Multiplayer online', 'success'));
    this.multiplayer.on('player_left',  ({ id }) => this.minimap.removePlayer(id));
    // Save on exit
    window.addEventListener('beforeunload', () => this._persist());
  }

  _persist() {
    this.save.save({
      money: this.player.money,
      x: this.player.x, y: this.player.y,
      carName: this.player.carName,
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
      if (e.code === 'Escape') this.toggle();
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
