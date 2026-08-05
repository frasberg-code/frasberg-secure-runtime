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
    // ── Systems ────────────────────────────────────────────────
    this.physics     = new PhysicsEngine();
    this.car         = new CarController(this.player, this.physics);
    this.traffic     = new TrafficAI(this.ctx);
    this.npcs        = new NPCSystem(this.ctx);
    this.carjack     = new CarjackSystem(this.player, this.traffic);
    this.police      = new PoliceAI(this.player, this.traffic);
    this.missions    = new MissionSystem(this.player);
    this.weather     = new WeatherSystem(this.ctx);
    this.events      = new EventSystem(this.player, this.missions);
    this.hud         = new HUD(this.canvas, this.player);
    this.minimap     = new MinimapSystem(this.canvas, this.player, this.traffic, this.npcs);
    this.worldMap    = new WorldMap(this.ctx);
    this.audio       = new AudioEngine();
    this.save        = new SaveSystem();
    this.leaderboard = new LeaderboardSystem();
    this.multiplayer = new MultiplayerClient(this.player);
    // ── Input ──────────────────────────────────────────────────
    this.keys = {};
    this._bindInput();
    // ── Resize ────────────────────────────────────────────────
    this._bindResize();
    // ── Cross-system events ────────────────────────────────────
    this._wireEvents();
    // ── Electron menu events ───────────────────────────────────
    this._bindElectronMenu();
  }

  // ── Init ────────────────────────────────────────────────────
  async init() {
    await this.audio.init();
    await this.worldMap.load();
    await this.save.load(this.player);
    await this.leaderboard.init?.();
    this.traffic.spawn(30);
    this.npcs.spawn(25);
    this.missions.loadFirstMission();
    this.events.start?.();
    this.multiplayer.connect();
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
    // Physics first
    this.physics.update(dt);
    // Player car
    this.car.update(dt, this.keys);
    // World systems
    this.traffic.update(dt, this.player);
    this.npcs.update(dt, this.player);
    this.weather.update(dt);
    // Game logic
    this.carjack.update(dt, this.keys, this.traffic);
    this.police.update(dt, this.traffic, this.npcs);
    this.missions.update(dt, this.player);
    this.events.update(dt);
    // UI systems
    this.hud.update(dt, this.player, this.fps);
    this.minimap.update(dt);
    this.worldMap.update(dt, this.player);
    // Multiplayer sync
    this.multiplayer.sendUpdate(this.player);
    // Audio
    this.audio.update(this.player);
    // Auto-save every 60s
    this._autoSave(dt);
  }

  // ── Render ────────────────────────────────────────────────────
  _render(dt) {
    const { ctx, canvas } = this;
    // Clear
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
    this.car.render(ctx, this.player);
    this.weather.render?.(ctx, canvas.width, canvas.height, camX, camY);
    ctx.restore();
    // UI (fixed — no camera transform)
    this.hud.render(ctx);
    this.minimap.render?.(ctx);
    this.missions.renderObjective(ctx);
    this.multiplayer.renderOtherPlayers(ctx, camX, camY);
    // Paused overlay
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
    // Carjack → police wanted level
    this.carjack.on('carjacked', () => {
      this.player.wantedLevel = Math.min(5, this.player.wantedLevel + 1);
      this.police.escalate(this.player.wantedLevel);
      this.audio.play('siren');
      this.missions.onCarjack();
    });
    // Police → player damage
    this.police.on('playerHit', (dmg) => {
      this.player.health -= dmg;
      this.hud.flash('red');
      this.audio.play('hit');
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
    // Events → missions + audio
    this.events.on?.('worldEvent', (evt) => {
      this.missions.triggerEvent(evt);
      this.hud.showNotification(evt.title, 'yellow');
    });
    // Multiplayer → other player carjack
    this.multiplayer.on('carjack_event', (data) => {
      this.hud.showNotification(`${data.attackerName} carjacked a vehicle!`, 'orange');
    });
    // Save system hooks
    window.addEventListener('beforeunload', () => {
      this.save.save(this.player);
    });
  }

  // ── Auto-save ─────────────────────────────────────────────────
  _autoSaveTimer = 0;
  _autoSave(dt) {
    this._autoSaveTimer += dt;
    if (this._autoSaveTimer >= 60) {
      this._autoSaveTimer = 0;
      this.save.save(this.player);
      this.hud.showNotification('Game auto-saved', 'blue');
    }
  }

  // ── Player Death ──────────────────────────────────────────────
  _onPlayerDied() {
    this.player.health     = this.player.maxHealth;
    this.player.wantedLevel = 0;
    this.player.x          = 640;
    this.player.y          = 360;
    this.police.clearPursuit();
    this.hud.showNotification('Busted! Respawning...', 'red');
    this.audio.play('busted');
    this.save.save(this.player);
  }

  // ── Input ─────────────────────────────────────────────────────
  _bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape') this.toggle();
      if (e.code === 'KeyF')   this.carjack.attempt();
      if (e.code === 'KeyH')   this.audio.play('horn');
      if (e.code === 'F11')    this._toggleFullscreen();
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
      if (event === 'menu:save')     this.save.save(this.player);
      if (event === 'menu:load')     this.save.load(this.player);
      if (event === 'menu:new-game') location.reload();
    });
  }
}
