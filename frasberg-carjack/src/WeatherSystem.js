// src/WeatherSystem.js — Dynamic weather affecting gameplay
export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.current = 'clear';
    this.intensity = 0;
    this.transitionTimer = 0;
    this.transitionDuration = 5000;
    this.weatherCycle = ['clear', 'cloudy', 'rain', 'heavy-rain', 'fog', 'clear'];
    this.cycleIndex = 0;
    this.particles = [];
    this.maxParticles = 500;
    this.effects = {
      clear:       { friction: 1.0,  visibility: 1.0,  ambientLight: 0xffffff, fogDensity: 0    },
      cloudy:      { friction: 0.95, visibility: 0.85, ambientLight: 0xaaaacc, fogDensity: 0.001 },
      rain:        { friction: 0.75, visibility: 0.65, ambientLight: 0x8899aa, fogDensity: 0.003 },
      'heavy-rain':{ friction: 0.55, visibility: 0.40, ambientLight: 0x556677, fogDensity: 0.008 },
      fog:         { friction: 0.85, visibility: 0.25, ambientLight: 0xcccccc, fogDensity: 0.02  },
    };
    this._initCanvas();
    this._scheduleNextChange();
  }

  _initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      pointer-events:none; z-index:50; opacity:0.6;
    `;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    document.body.appendChild(this.canvas);
    window.addEventListener('resize', () => {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  _scheduleNextChange() {
    const delay = 30000 + Math.random() * 60000; // 30–90 seconds
    setTimeout(() => {
      if (!this.locked) {
        this.cycleIndex = (this.cycleIndex + 1) % this.weatherCycle.length;
        this.transitionTo(this.weatherCycle[this.cycleIndex]);
      }
      this._scheduleNextChange();
    }, delay);
  }

  transitionTo(type) {
    if (!this.effects[type]) return;
    console.log(`[Weather] Transitioning to: ${type}`);
    this.previous = this.current;
    this.current  = type;
    this.transitionTimer = 0;
    if (type === 'rain' || type === 'heavy-rain') {
      this._spawnRain();
    } else {
      this.particles = [];
    }
    // Notify game engine
    window.dispatchEvent(new CustomEvent('weather:change', {
      detail: { type, effects: this.effects[type] }
    }));
  }

  _spawnRain() {
    const count = this.current === 'heavy-rain' ? this.maxParticles : this.maxParticles / 2;
    this.particles = Array.from({ length: count }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      speed: 8 + Math.random() * 6,
      len:   12 + Math.random() * 8,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }

  getCurrentEffects() {
    return this.effects[this.current] || this.effects.clear;
  }

  update(delta) {
    this.transitionTimer = Math.min(this.transitionTimer + delta, this.transitionDuration);
    this._render();
  }

  _render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.current === 'rain' || this.current === 'heavy-rain') {
      ctx.strokeStyle = 'rgba(180,210,255,0.5)';
      ctx.lineWidth = 1;
      for (const p of this.particles) {
        p.y += p.speed;
        p.x += 1.5; // wind angle
        if (p.y > canvas.height) { p.y = -p.len; p.x = Math.random() * canvas.width; }
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 2, p.y + p.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (this.current === 'fog') {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'rgba(200,210,220,0.0)');
      grad.addColorStop(0.4, 'rgba(200,210,220,0.35)');
      grad.addColorStop(1, 'rgba(200,210,220,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (this.current === 'cloudy') {
      ctx.fillStyle = 'rgba(100,110,130,0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  destroy() {
    this.canvas.remove();
  }
}
