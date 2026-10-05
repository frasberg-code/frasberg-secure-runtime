// ── Frasberg Carjack — Save System ────────────────────────────────────────────

const SAVE_KEY    = 'frasberg_save_v1';
const AUTO_KEY    = 'frasberg_autosave_v1';
const SAVE_VER    = 1;

export class SaveSystem {
  constructor() {
    this.current    = null;
    this.autoTimer  = 0;
    this.autoInterval = 60; // seconds
    this.onSave     = null;
    this.onLoad     = null;
  }

  // ── Default state ────────────────────────────────────────────────────────────
  _defaultState() {
    return {
      version:    SAVE_VER,
      timestamp:  Date.now(),
      player: {
        name:     'Player',
        money:    500,
        health:   100,
        wanted:   0,
        position: { x: 0, y: 0 },
        cars:     ['starter_sedan'],
        activeCar: 'starter_sedan'
      },
      missions: {
        completed: [],
        active:    null,
        failed:    []
      },
      world: {
        discoveredZones: [],
        safeHouses:      [],
        time:            360    // minutes since midnight (6 AM)
      },
      stats: {
        carjacks:        0,
        missionsComplete:0,
        distanceDriven:  0,
        moneyEarned:     0,
        timesArrested:   0,
        totalPlaytime:   0      // seconds
      },
      settings: {
        masterVolume: 0.8,
        sfxVolume:    0.7,
        musicVolume:  0.4,
        showMinimap:  true,
        controls:     'keyboard'
      }
    };
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  save(state, slot = SAVE_KEY) {
    try {
      const data = {
        ...state,
        version:   SAVE_VER,
        timestamp: Date.now()
      };
      localStorage.setItem(slot, JSON.stringify(data));
      this.current = data;
      this._serverSync(data);
      if (this.onSave) this.onSave(data);
      console.log(`[SaveSystem] Saved to slot "${slot}"`);
      return true;
    } catch (e) {
      console.error('[SaveSystem] Save failed:', e);
      return false;
    }
  }

  // ── Load ─────────────────────────────────────────────────────────────────────
  load(slot = SAVE_KEY) {
    try {
      const key = typeof slot === 'string' ? slot : SAVE_KEY;
      const raw = localStorage.getItem(key);
      if (!raw) return this._defaultState();

      const data = JSON.parse(raw);
      if (data.version !== SAVE_VER) return this._migrate(data);

      this.current = data;
      if (this.onLoad) this.onLoad(data);
      console.log(`[SaveSystem] Loaded from slot "${key}"`);
      return data;
    } catch (e) {
      console.error('[SaveSystem] Load failed:', e);
      return this._defaultState();
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  delete(slot = SAVE_KEY) {
    localStorage.removeItem(slot);
    console.log(`[SaveSystem] Deleted slot "${slot}"`);
  }

  // ── Auto-save ────────────────────────────────────────────────────────────────
  update(dt, state) {
    this.autoTimer += dt;
    if (this.autoTimer >= this.autoInterval) {
      this.autoTimer = 0;
      this.save(state, AUTO_KEY);
    }
  }

  // ── Migration ────────────────────────────────────────────────────────────────
  _migrate(old) {
    console.log('[SaveSystem] Migrating save from version', old.version);
    const fresh = this._defaultState();
    // Preserve player progress where possible
    if (old.player) Object.assign(fresh.player, old.player);
    if (old.stats)  Object.assign(fresh.stats,  old.stats);
    return fresh;
  }

  // ── Server sync ──────────────────────────────────────────────────────────────
  async _serverSync(data) {
    try {
      await fetch('/api/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
      });
    } catch {
      // Offline — local save is sufficient
    }
  }

  // ── Export / Import ──────────────────────────────────────────────────────────
  exportJSON() {
    return JSON.stringify(this.current, null, 2);
  }

  importJSON(json) {
    try {
      const data = JSON.parse(json);
      this.save(data);
      return data;
    } catch { return null; }
  }

  // ── Data Accessors ────────────────────────────────────────────────────────
  addMoney(amount) {
    if (!this.current) this.current = this._defaultState();
    this.current.player.money += amount;
    this.current.stats.moneyEarned += Math.max(0, amount);
  }

  incrementStat(stat, amount = 1) {
    if (!this.current) this.current = this._defaultState();
    this.current.stats[stat] = (this.current.stats[stat] || 0) + amount;
  }

  completeMission(id) {
    if (!this.current) this.current = this._defaultState();
    if (!this.current.missions.completed.includes(id)) {
      this.current.missions.completed.push(id);
    }
  }

  hasSave(slot = SAVE_KEY) {
    return localStorage.getItem(slot) !== null;
  }

  getSaveInfo(slot = SAVE_KEY) {
    try {
      const data = JSON.parse(localStorage.getItem(slot));
      if (!data) return null;
      return {
        timestamp: data.timestamp,
        money:     data.player?.money,
        missions:  data.missions?.completed?.length,
        playtime:  data.stats?.totalPlaytime
      };
    } catch { return null; }
  }
}
