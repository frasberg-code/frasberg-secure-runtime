import logging
from datetime import datetime, timezone

logger = logging.getLogger("seed_builds")

_WEBSITE_HTML = """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ember &amp; Oak — Small-Batch Coffee Roastery</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#171310;color:#efe7dc;line-height:1.6}
nav{display:flex;justify-content:space-between;align-items:center;padding:22px 6vw;position:sticky;top:0;background:rgba(23,19,16,.92);backdrop-filter:blur(8px);z-index:9}
.logo{font-family:Fraunces,serif;font-size:1.3rem;color:#e8a552}nav a{color:#b8a894;text-decoration:none;margin-left:26px;font-size:.9rem}nav a:hover{color:#efe7dc}
header{padding:14vh 6vw 10vh;max-width:900px}h1{font-family:Fraunces,serif;font-size:clamp(2.4rem,6vw,4.4rem);line-height:1.08}
h1 em{color:#e8a552;font-style:normal}header p{margin:22px 0 30px;color:#b8a894;max-width:520px}
.btn{display:inline-block;background:#e8a552;color:#171310;padding:14px 34px;border-radius:999px;font-weight:600;text-decoration:none;transition:transform .2s}.btn:hover{transform:translateY(-2px)}
section{padding:9vh 6vw}h2{font-family:Fraunces,serif;font-size:2rem;margin-bottom:34px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}
.card{background:#221c17;border:1px solid #33291f;border-radius:18px;padding:28px;transition:transform .25s}.card:hover{transform:translateY(-5px)}
.card b{font-family:Fraunces,serif;font-size:1.15rem;color:#e8a552}.card p{color:#b8a894;font-size:.92rem;margin-top:8px}
.price{margin-top:16px;font-weight:600}footer{padding:40px 6vw;border-top:1px solid #33291f;color:#8d7f6d;font-size:.85rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
</style></head><body>
<nav><span class="logo">Ember &amp; Oak</span><span><a href="#beans">Beans</a><a href="#story">Story</a><a href="#visit">Visit</a></span></nav>
<header><h1>Slow-roasted. <em>Small-batch.</em> Seriously good coffee.</h1>
<p>We roast single-origin beans in 12&nbsp;kg batches over oak embers, so every cup tastes like it was made just for you — because it was.</p>
<a class="btn" href="#beans">Shop the roast</a></header>
<section id="beans"><h2>This month's beans</h2><div class="grid">
<div class="card"><b>Midnight Ember</b><p>Dark roast · Sumatra · notes of molasses, smoked cedar and dark chocolate.</p><div class="price">$19 / 340g</div></div>
<div class="card"><b>Golden Hour</b><p>Medium roast · Ethiopia Yirgacheffe · apricot, honey and jasmine.</p><div class="price">$21 / 340g</div></div>
<div class="card"><b>Oak &amp; Orchard</b><p>Light roast · Colombia Huila · green apple, caramel and toasted oak.</p><div class="price">$18 / 340g</div></div>
</div></section>
<section id="story"><h2>Roasted the hard way, on purpose</h2>
<p style="max-width:640px;color:#b8a894">Since 2016 we've hand-turned every batch above real oak embers. No conveyor drums, no shortcuts. Our roaster, June, tastes every batch before it ships — and rejects about one in five. That's the one you never have to drink.</p></section>
<section id="visit"><h2>Visit the roastery</h2>
<p style="color:#b8a894">14 Kiln Lane · Open Thu–Sun, 8am–3pm · Cuppings every Saturday at 10am.</p></section>
<footer><span>© Ember &amp; Oak Roastery</span><span>Built with Luchii Builder</span></footer>
</body></html>"""

_APP_HTML = """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pulse — Focus Timer</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#0c0f1d;display:flex;justify-content:center;min-height:100vh}
.phone{width:100%;max-width:400px;min-height:100vh;background:linear-gradient(180deg,#131832,#0c0f1d);color:#e9ecf8;padding:34px 24px 90px;position:relative}
h1{font-size:1.1rem;letter-spacing:.25em;text-transform:uppercase;color:#7f8bff;text-align:center}
#ring{width:230px;height:230px;margin:36px auto;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:conic-gradient(#7f8bff var(--p,0%),#1d2442 0)}
#inner{width:200px;height:200px;border-radius:50%;background:#0c0f1d;display:flex;flex-direction:column;align-items:center;justify-content:center}
#time{font-size:2.8rem;font-weight:800}#mode{color:#8b93b8;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;margin-top:4px}
.row{display:flex;gap:12px;justify-content:center}button{border:0;border-radius:999px;padding:13px 30px;font-weight:600;font-size:.95rem;cursor:pointer}
#start{background:#7f8bff;color:#0c0f1d}#reset{background:#1d2442;color:#8b93b8}
h2{font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:#8b93b8;margin:34px 0 12px}
#log div{background:#161c38;border-radius:12px;padding:11px 15px;margin-bottom:8px;font-size:.87rem;display:flex;justify-content:space-between;color:#c6cdee}
#count{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:400px;background:#131832;border-top:1px solid #1d2442;padding:16px;text-align:center;font-size:.85rem;color:#8b93b8}
</style></head><body><div class="phone">
<h1>Pulse</h1>
<div id="ring"><div id="inner"><div id="time">25:00</div><div id="mode">Focus</div></div></div>
<div class="row"><button id="start">Start</button><button id="reset">Reset</button></div>
<h2>Session history</h2><div id="log"></div>
<div id="count"><span id="total">0</span> focus sessions completed</div>
<script>
const F=25*60,B=5*60;let left=F,mode='focus',tick=null;
const hist=JSON.parse(localStorage.pulseLog||'[]');
const $=id=>document.getElementById(id);
function fmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function paint(){$('time').textContent=fmt(left);$('mode').textContent=mode==='focus'?'Focus':'Break';
const tot=mode==='focus'?F:B;$('ring').style.setProperty('--p',(100-left/tot*100)+'%')}
function draw(){$('log').innerHTML=hist.slice(-6).reverse().map(h=>'<div><span>'+h.label+'</span><span>'+h.when+'</span></div>').join('');$('total').textContent=hist.filter(h=>h.label.includes('Focus')).length}
$('start').onclick=()=>{if(tick){clearInterval(tick);tick=null;$('start').textContent='Start';return}
$('start').textContent='Pause';tick=setInterval(()=>{left--;paint();if(left<=0){clearInterval(tick);tick=null;
hist.push({label:(mode==='focus'?'Focus 25m':'Break 5m')+' done',when:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
localStorage.pulseLog=JSON.stringify(hist);mode=mode==='focus'?'break':'focus';left=mode==='focus'?F:B;$('start').textContent='Start';paint();draw()}},1000)};
$('reset').onclick=()=>{clearInterval(tick);tick=null;left=mode==='focus'?F:B;$('start').textContent='Start';paint()};
paint();draw();
</script></div></body></html>"""

_LANDING_HTML = """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hydra — The Bottle That Reminds You</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;800&family=Inter:wght@400;500&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#04121c;color:#eaf6fd;line-height:1.6}
header{min-height:88vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 6vw;background:radial-gradient(ellipse at 50% 0%,#0a2d44 0%,#04121c 65%)}
.tag{color:#37c8f5;letter-spacing:.3em;text-transform:uppercase;font-size:.78rem;margin-bottom:18px}
h1{font-family:Sora,sans-serif;font-size:clamp(2.4rem,6.5vw,4.6rem);line-height:1.08;max-width:820px}
h1 span{color:#37c8f5}header p{margin:24px auto 34px;color:#9dc2d6;max-width:520px}
.cta{display:inline-block;background:#37c8f5;color:#04121c;font-weight:600;padding:16px 44px;border-radius:999px;text-decoration:none;transition:transform .2s}.cta:hover{transform:translateY(-2px)}
.sub{margin-top:14px;font-size:.82rem;color:#5f8ba1}
section{padding:10vh 6vw;max-width:1080px;margin:0 auto}h2{font-family:Sora,sans-serif;font-size:2rem;text-align:center;margin-bottom:44px}
.feats{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}
.f{background:#082133;border:1px solid #0e3049;border-radius:18px;padding:28px}
.f b{color:#37c8f5;font-family:Sora,sans-serif}.f p{color:#9dc2d6;font-size:.92rem;margin-top:8px}
.quote{text-align:center;font-size:1.25rem;max-width:640px;margin:0 auto;color:#cfe9f6}
.quote small{display:block;margin-top:14px;color:#5f8ba1}
.price{background:#082133;border:1px solid #37c8f5;border-radius:24px;max-width:420px;margin:0 auto;padding:40px;text-align:center}
.price .n{font-family:Sora,sans-serif;font-size:3rem;color:#37c8f5}
footer{text-align:center;padding:36px;color:#5f8ba1;font-size:.85rem;border-top:1px solid #0e3049}
</style></head><body>
<header><div class="tag">Pre-order now open</div>
<h1>Meet Hydra. The smart bottle that <span>remembers to remind you.</span></h1>
<p>Glow-ring hydration nudges, sip tracking and a 30-day battery — because the best health habit is the one you don't have to think about.</p>
<a class="cta" href="#order">Pre-order for $49</a><div class="sub">Ships worldwide · 30-day money-back promise</div></header>
<section><h2>Why 40,000 people joined the waitlist</h2><div class="feats">
<div class="f"><b>Glow nudges</b><p>The ring glows softly when you fall behind your goal. No apps to open, no alarms to snooze.</p></div>
<div class="f"><b>Real sip tracking</b><p>A weight sensor in the base logs every sip to the milliliter — automatically.</p></div>
<div class="f"><b>30-day battery</b><p>One USB-C charge lasts a month. Fully dishwasher-safe body.</p></div>
</div></section>
<section><p class="quote">"I've bought four 'smart' bottles. Hydra is the first one that actually changed how much I drink."<small>— Maya R., beta tester</small></p></section>
<section id="order"><div class="price"><div class="tag">Launch pricing</div><div class="n">$49</div>
<p style="color:#9dc2d6;margin:12px 0 24px">Reg. $79 · includes app access forever, no subscription.</p>
<a class="cta" href="#order">Reserve yours</a></div></section>
<footer>© Hydra Labs · Built with Luchii Builder</footer>
</body></html>"""

SEED_BUILDS = [
    {"slug": "flagship-ember-oak", "type": "website", "title": "Ember & Oak — coffee roastery", "html": _WEBSITE_HTML},
    {"slug": "flagship-pulse-focus", "type": "app", "title": "Pulse — mobile focus timer", "html": _APP_HTML},
    {"slug": "flagship-hydra-launch", "type": "landing", "title": "Hydra — smart bottle launch page", "html": _LANDING_HTML},
]


async def seed_flagship_builds(db):
    removed = await db.builder_projects.delete_many(
        {"$or": [{"slug": "flagship-nebula-dodge"}, {"title": {"$regex": "nebula dodge", "$options": "i"}}]}
    )
    if removed.deleted_count:
        logger.info("Purged %d Nebula Dodge builds", removed.deleted_count)
    admin = await db.users.find_one({"email": "admin@frasberg.com"})
    owner = admin["id"] if admin else "system"
    now = datetime.now(timezone.utc).isoformat()
    seeded = 0
    for b in SEED_BUILDS:
        existing = await db.builder_projects.find_one({"slug": b["slug"]})
        if existing:
            continue
        await db.builder_projects.insert_one({
            "id": f"seed-{b['slug']}", "user_id": owner, "type": b["type"], "title": b["title"],
            "last_prompt": "Flagship demo build by the Frasberg team", "html": b["html"],
            "published": True, "slug": b["slug"], "custom_domain": None,
            "featured": True, "plays": 0, "created_at": now, "updated_at": now,
        })
        seeded += 1
    if seeded:
        logger.info("Seeded %d flagship builder demos", seeded)
