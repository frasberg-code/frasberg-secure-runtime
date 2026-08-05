// Luchii Games — shared real-audio engine + environmental realism layer (FRASBERG INC.)
(function () {
  var A = "/api/games/assets/";
  var cache = {};
  function sfx(name, vol) {
    try {
      var base = cache[name] || (cache[name] = new Audio(A + "sfx-" + name + ".ogg"));
      var a = base.cloneNode();
      a.volume = Math.min(1, vol == null ? 0.5 : vol);
      a.play().catch(function () {});
    } catch (_) {}
  }
  var musicEl = null;
  var music = {
    start: function (src, vol) {
      try {
        if (musicEl && musicEl.src.indexOf(src) === -1) { musicEl.pause(); musicEl = null; }
        if (!musicEl) { musicEl = new Audio(src); musicEl.loop = true; }
        musicEl.volume = Math.min(1, (vol == null ? 0.5 : vol) * 0.8);
        musicEl.play().catch(function () {});
      } catch (_) {}
    },
    stop: function () { try { musicEl && musicEl.pause(); } catch (_) {} },
    setVol: function (v) { try { if (musicEl) musicEl.volume = Math.min(1, v * 0.8); } catch (_) {} },
  };
  var engEl = null;
  var engine = {
    start: function (vol) {
      try {
        if (!engEl) { engEl = new Audio(A + "sfx-engine.ogg"); engEl.loop = true; }
        engEl.volume = vol == null ? 0.35 : vol;
        engEl.playbackRate = 1;
        engEl.play().catch(function () {});
      } catch (_) {}
    },
    setRate: function (r) { try { if (engEl) engEl.playbackRate = Math.max(0.5, Math.min(3.5, r)); } catch (_) {} },
    stop: function () { try { engEl && engEl.pause(); } catch (_) {} },
  };
  window.LuchiiAudio = { sfx: sfx, music: music, engine: engine };

  // ── Environment: rendered backdrop + live day/night + weather shaders ──
  var m = location.pathname.match(/\/api\/games\/([^/]+)\/play/);
  var gid = m ? m[1] : null;
  if (!gid) return;
  fetch("/api/games/" + gid + "/environment").then(function (r) { return r.ok ? r.json() : null; }).then(function (env) {
    if (!env || !env.image_url) return;
    var bd = document.createElement("div");
    bd.id = "luchiiBackdrop";
    bd.style.cssText = "position:fixed;inset:0;z-index:-2;background:url('" + env.image_url + "') center/cover no-repeat #05050f;filter:brightness(0.75) saturate(1.1)";
    document.body.prepend(bd);

    var tint = document.createElement("div");
    tint.id = "luchiiDayNight";
    tint.style.cssText = "position:fixed;inset:0;z-index:5;pointer-events:none;transition:background 2s ease";
    document.body.appendChild(tint);
    var hour = typeof env.hour === "number" ? env.hour : 21;
    var phaseOf = function (h) { return h >= 5 && h < 10 ? "DAWN" : h >= 10 && h < 17 ? "DAY" : h >= 17 && h < 21 ? "DUSK" : "NIGHT"; };
    var tintOf = function (h) {
      if (h >= 5 && h < 10) return "rgba(245,158,11,0.10)";
      if (h >= 10 && h < 17) return "rgba(255,255,255,0)";
      if (h >= 17 && h < 21) return "rgba(239,68,68,0.12)";
      return "rgba(30,27,75,0.35)";
    };
    var pill = document.createElement("div");
    pill.id = "envPill";
    pill.style.cssText = "position:fixed;top:60px;left:24px;z-index:9;padding:8px 14px;border-radius:20px;border:1px solid #6c63ff66;background:rgba(13,13,26,.7);color:#a8a3ff;font:bold 11px 'Courier New',monospace;letter-spacing:1px";
    document.body.appendChild(pill);
    var setEnv = function () {
      tint.style.background = tintOf(hour);
      pill.textContent = phaseOf(hour) + " \u00b7 " + String(env.weather || "clear").replace(/_/g, " ").toUpperCase();
    };
    setEnv();
    setInterval(function () { hour = (hour + 1) % 24; setEnv(); }, 12000);

    var weather = env.weather || "clear";
    if (weather !== "clear") {
      var canvas = document.createElement("canvas");
      canvas.id = "luchiiWeather";
      canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:6;pointer-events:none";
      document.body.appendChild(canvas);
      var ctx = canvas.getContext("2d");
      var size = function () { canvas.width = innerWidth; canvas.height = innerHeight; };
      size();
      addEventListener("resize", size);
      var intensity = 0.6;
      var drops = [];
      if (weather === "rain" || weather === "stormy") {
        for (var i = 0; i < 200 * intensity; i++) {
          drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: 8 + Math.random() * 8, length: 15 + Math.random() * 20 });
        }
      }
      (function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (weather === "rain" || weather === "stormy") {
          ctx.strokeStyle = "rgba(174,214,241," + 0.4 * intensity + ")";
          ctx.lineWidth = 1;
          drops.forEach(function (d) {
            ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 2, d.y + d.length); ctx.stroke();
            d.y += d.speed;
            if (d.y > canvas.height) { d.y = -d.length; d.x = Math.random() * canvas.width; }
          });
        }
        if (weather === "fog") {
          var g = ctx.createLinearGradient(0, 0, 0, canvas.height);
          g.addColorStop(0, "rgba(200,210,220," + 0.5 * intensity + ")");
          g.addColorStop(1, "rgba(200,210,220,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (weather === "heat_haze") {
          var t = Date.now() * 0.001;
          ctx.fillStyle = "rgba(255,200,100," + (0.08 + Math.sin(t) * 0.03) + ")";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (weather === "stormy" && Math.random() < 0.003) {
          ctx.fillStyle = "rgba(255,255,255," + 0.3 * intensity + ")";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        requestAnimationFrame(draw);
      })();
    }
  }).catch(function () {});
})();
