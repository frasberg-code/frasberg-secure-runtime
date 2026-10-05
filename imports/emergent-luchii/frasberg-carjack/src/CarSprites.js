// ── Frasberg Carjack — CarSprites ─────────────────────────────────────────────
// Detailed top-down sprites for real-brand vehicles (Tesla, Mercedes-Benz,
// Ferrari, Lamborghini, Rolls-Royce, Ford trucks…). Sprites are rendered once
// to an offscreen canvas and cached. Local space: FRONT of the car faces +Y.

const cache = new Map();

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

export function getVehicleSprite(spec = {}) {
  const color  = spec.color  ?? '#8f9aa3';
  const tier   = spec.tier   ?? 'standard';
  const lenM   = spec.length ?? 4.6;
  const key    = `${spec.brand ?? ''}|${spec.model ?? ''}|${color}|${tier}|${lenM}`;
  if (cache.has(key)) return cache.get(key);

  const S   = 2;                       // supersample
  const len = Math.round(lenM * 9);    // px
  const wid = Math.round(len * (tier === 'truck' ? 0.46 : tier === 'sport' ? 0.44 : 0.42));
  const cw  = (wid + 12) * S, ch = (len + 12) * S;
  const cv  = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  g.scale(S, S);
  g.translate((wid + 12) / 2, (len + 12) / 2);

  const isTaxi  = /taxi/i.test(spec.model ?? '');
  const isSport = tier === 'sport' || tier === 'muscle';
  const isTruck = tier === 'truck';

  // Shadow
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.ellipse(1.5, 1.5, wid / 2 + 1, len / 2 + 1, 0, 0, Math.PI * 2); g.fill();

  // Wheels (4, slightly outside body)
  g.fillStyle = '#0c0c0e';
  const wy = len * 0.30, wx = wid / 2 - 1, ww = 4, wh = len * 0.16;
  for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    g.beginPath(); g.roundRect(sx * wx - ww / 2, sy * wy - wh / 2, ww, wh, 1.5); g.fill();
  }

  // Body — tapered nose for sport, boxy for trucks/SUVs
  const noseTaper = isSport ? 0.72 : isTruck ? 0.94 : 0.85;
  const tailTaper = isSport ? 0.88 : 0.92;
  const hw = wid / 2, hl = len / 2;
  const grad = g.createLinearGradient(-hw, 0, hw, 0);
  grad.addColorStop(0,   shade(color, -28));
  grad.addColorStop(0.5, shade(color, 18));
  grad.addColorStop(1,   shade(color, -28));
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(-hw * tailTaper, -hl + 3);
  g.quadraticCurveTo(-hw, -hl * 0.55, -hw, 0);
  g.quadraticCurveTo(-hw, hl * 0.55, -hw * noseTaper, hl - 3);
  g.quadraticCurveTo(0, hl + 1, hw * noseTaper, hl - 3);
  g.quadraticCurveTo(hw, hl * 0.55, hw, 0);
  g.quadraticCurveTo(hw, -hl * 0.55, hw * tailTaper, -hl + 3);
  g.quadraticCurveTo(0, -hl - 1, -hw * tailTaper, -hl + 3);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = 1;
  g.stroke();

  // Cabin / glasshouse
  const cabinTop = isTruck ? hl * 0.55 : hl * 0.45;   // toward front
  const cabinBot = isTruck ? hl * 0.05 : -hl * 0.45;  // toward rear
  const cw2 = hw * 0.78;
  g.fillStyle = shade(color, -45);
  g.beginPath();
  g.roundRect(-cw2, cabinBot, cw2 * 2, cabinTop - cabinBot, 4);
  g.fill();
  // Front windshield
  g.fillStyle = 'rgba(150,200,240,0.85)';
  g.beginPath();
  g.moveTo(-cw2 + 2, cabinTop - 8);
  g.lineTo(cw2 - 2, cabinTop - 8);
  g.lineTo(cw2 * 0.7, cabinTop);
  g.lineTo(-cw2 * 0.7, cabinTop);
  g.closePath();
  g.fill();
  // Rear window
  if (!isTruck) {
    g.fillStyle = 'rgba(120,170,210,0.7)';
    g.beginPath();
    g.moveTo(-cw2 * 0.7, cabinBot);
    g.lineTo(cw2 * 0.7, cabinBot);
    g.lineTo(cw2 - 2, cabinBot + 7);
    g.lineTo(-cw2 + 2, cabinBot + 7);
    g.closePath();
    g.fill();
  }
  // Side windows
  g.fillStyle = 'rgba(130,180,220,0.55)';
  g.fillRect(-cw2, cabinBot + 8, 2.5, (cabinTop - cabinBot) - 17);
  g.fillRect(cw2 - 2.5, cabinBot + 8, 2.5, (cabinTop - cabinBot) - 17);

  // Truck cargo bed
  if (isTruck) {
    g.fillStyle = shade(color, -55);
    g.beginPath(); g.roundRect(-hw * 0.82, -hl + 4, hw * 1.64, hl * 0.9, 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)';
    g.strokeRect(-hw * 0.7, -hl + 7, hw * 1.4, hl * 0.78);
  }

  // Hood line + centre accent
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.beginPath(); g.moveTo(-hw * 0.6, hl * 0.62); g.lineTo(hw * 0.6, hl * 0.62); g.stroke();
  if (spec.electric) {
    g.strokeStyle = 'rgba(72,202,228,0.8)';
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, cabinTop + 2); g.lineTo(0, hl - 4); g.stroke();
  }

  // Side mirrors
  g.fillStyle = shade(color, -20);
  g.fillRect(-hw - 2, cabinTop - 4, 3, 4);
  g.fillRect(hw - 1, cabinTop - 4, 3, 4);

  // Headlights (front, +Y)
  g.fillStyle = '#fff6c9';
  g.beginPath(); g.roundRect(-hw * 0.72, hl - 5, hw * 0.4, 3.5, 1.5); g.fill();
  g.beginPath(); g.roundRect(hw * 0.32,  hl - 5, hw * 0.4, 3.5, 1.5); g.fill();
  // Taillights (rear, −Y)
  g.fillStyle = '#e5383b';
  g.beginPath(); g.roundRect(-hw * 0.75, -hl + 1.5, hw * 0.42, 3, 1.5); g.fill();
  g.beginPath(); g.roundRect(hw * 0.33,  -hl + 1.5, hw * 0.42, 3, 1.5); g.fill();

  // Sport spoiler
  if (isSport) {
    g.fillStyle = shade(color, -60);
    g.beginPath(); g.roundRect(-hw * 0.9, -hl - 1, hw * 1.8, 3.5, 1.5); g.fill();
  }

  // Taxi roof sign
  if (isTaxi) {
    g.fillStyle = '#111';
    g.fillRect(-6, -3, 12, 6);
    g.fillStyle = '#f9d71c';
    g.font = 'bold 5px monospace';
    g.textAlign = 'center';
    g.fillText('TAXI', 0, 1.6);
    g.textAlign = 'left';
  }

  // Rolls-Royce style luxury chrome trim
  if (tier === 'luxury') {
    g.strokeStyle = 'rgba(220,225,230,0.55)';
    g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(-hw * 0.55, hl - 2); g.lineTo(hw * 0.55, hl - 2); g.stroke();
  }

  const sprite = { canvas: cv, w: wid + 12, h: len + 12 };
  cache.set(key, sprite);
  return sprite;
}

// Draw at current origin/rotation. Front of car faces local +Y.
export function drawVehicle(ctx, spec = {}) {
  const s = getVehicleSprite(spec);
  ctx.drawImage(s.canvas, -s.w / 2, -s.h / 2, s.w, s.h);
}
