// src/EventSystem.js — World events: races, heists, random encounters
export class EventSystem {
  constructor() {
    this.activeEvent  = null;
    this.eventQueue   = [];
    this.timer        = 0;
    this.nextEvent    = 20000 + Math.random() * 40000;
    this.completedCount = 0;
    this.EVENT_TYPES = [
      {
        id: 'street_race',
        label: '🏁 Street Race',
        description: 'Reach the checkpoint before time runs out!',
        duration: 60000,
        reward: 5000,
        color: '#f39c12',
      },
      {
        id: 'heist',
        label: '💰 Bank Heist',
        description: 'Rob the bank and escape the police!',
        duration: 90000,
        reward: 15000,
        color: '#e63946',
      },
      {
        id: 'delivery',
        label: '📦 Express Delivery',
        description: 'Deliver the package without getting busted!',
        duration: 45000,
        reward: 3000,
        color: '#2ecc71',
      },
      {
        id: 'survival',
        label: '🚨 Survival Mode',
        description: 'Survive the police for 60 seconds!',
        duration: 60000,
        reward: 8000,
        color: '#9b59b6',
      },
    ];
  }

  update(dt, gameState) {
    this.timer += dt;
    if (!this.activeEvent && this.timer >= this.nextEvent) {
      this.timer = 0;
      this.nextEvent = 30000 + Math.random() * 60000;
      this._spawnEvent();
    }
    if (this.activeEvent) {
      this.activeEvent.elapsed += dt;
      // Check completion
      if (this.activeEvent.elapsed >= this.activeEvent.duration) {
        this._failEvent();
      }
    }
  }

  _spawnEvent() {
    const template = this.EVENT_TYPES[Math.floor(Math.random() * this.EVENT_TYPES.length)];
    this.activeEvent = {
      ...template,
      elapsed:   0,
      startTime: Date.now(),
      completed: false,
    };
    console.log(`[EventSystem] Event spawned: ${template.label}`);
  }

  completeEvent() {
    if (!this.activeEvent) return 0;
    const reward = this.activeEvent.reward;
    this.completedCount++;
    console.log(`[EventSystem] Event completed: +$${reward}`);
    this.activeEvent = null;
    return reward;
  }

  _failEvent() {
    console.log(`[EventSystem] Event failed: ${this.activeEvent?.label}`);
    this.activeEvent = null;
  }

  skipEvent() { this.activeEvent = null; }

  draw(ctx, canvas) {
    if (!this.activeEvent) return;
    const e        = this.activeEvent;
    const progress = Math.max(0, 1 - e.elapsed / e.duration);
    const W = 320, H = 90;
    const x = canvas.width / 2 - W / 2;
    const y = 20;
    ctx.save();
    // Background
    ctx.fillStyle   = 'rgba(10,10,20,0.90)';
    ctx.strokeStyle = e.color;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, W, H, 10);
    ctx.fill(); ctx.stroke();
    // Label
    ctx.fillStyle = e.color;
    ctx.font      = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(e.label, x + W / 2, y + 22);
    // Description
    ctx.fillStyle = '#cccccc';
    ctx.font      = '11px monospace';
    ctx.fillText(e.description, x + W / 2, y + 40);
    // Timer bar
    const barX = x + 16, barY = y + 54, barW = W - 32, barH = 10;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = progress > 0.3 ? e.color : '#e63946';
    ctx.fillRect(barX, barY, barW * progress, barH);
    // Time left
    const secsLeft = Math.ceil((e.duration - e.elapsed) / 1000);
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 12px monospace';
    ctx.fillText(`${secsLeft}s`, x + W / 2, y + 80);
    ctx.restore();
  }
}
