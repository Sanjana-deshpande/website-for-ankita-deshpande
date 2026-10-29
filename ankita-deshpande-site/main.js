// Shared behaviour for every page: starfield, active nav link, mobile menu,
// copy buttons, contact form note, and the map markers on the home page.
(function () {
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Faint starlight behind every page
  var canvas = document.getElementById("stars");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round((innerWidth * innerHeight) / 9000);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          r: Math.random() * 1.1 + 0.2, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 1.2,
          gold: Math.random() < 0.12 });
      }
    };
    var draw = function (t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = reduceMotion ? 0.55 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 1000 * s.speed + s.phase));
        ctx.fillStyle = s.gold ? "rgba(242,200,121," + a + ")" : "rgba(213,197,233," + a + ")";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    };
    resize(); addEventListener("resize", resize);
    requestAnimationFrame(draw);
  }

  // Track which chapter is being read: light up its moon on the rail and in the nav
  var sections = document.querySelectorAll(".chapter");
  var links = document.querySelectorAll(".rail a, .nav a");
  var setHere = function (id) {
    links.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("here", on);
      if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
  };
  if ("IntersectionObserver" in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setHere(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }
  setHere("map");

  // Reading progress bar
  var bar = document.getElementById("progress-bar");
  if (bar) {
    var tick = false;
    var update = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
      tick = false;
    };
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.querySelector(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { selectSibling(btn); });
      else selectSibling(btn);
    });
  });
  function selectSibling(btn) {
    var code = btn.parentElement.querySelector("code");
    if (!code) return;
    var r = document.createRange(); r.selectNodeContents(code);
    var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.querySelector("#form-status");
      if (note) note.textContent = "This form is still a preview and hasn't sent anything. It will deliver messages once the site is hosted. Until then, please write to ankitadeshpande890@gmail.com.";
    });
  }

  // Map markers: choosing a light on the map reveals that chapter in the side card
  var chapters = {
    story:   { no: "Chapter I",   name: "The Hearth",            title: "My Story",              href: "#story",
               text: "Where it all began: 7+ years across IBM, Bosch and Novartis, from electronics engineering to supply chain, and now a Master’s and a new chapter in Berlin.",
               img: "images/portrait.jpg", alt: "Ankita in a long white coat before a tall arched window" },
    journey: { no: "Chapter II",  name: "The Strategist's Tower", title: "Professional Journey", href: "#journey",
               text: "Five years at Novartis guiding 25+ product lifecycle events for a $1.5 billion brand across the US, EU and Asia, plus earlier roles at Bosch and ICICI Bank.",
               img: "images/look-work.jpg", alt: "Ankita in a houndstooth blazer, taking a mirror selfie" },
    travels: { no: "Chapter III", name: "The Wandering Coast",    title: "Travel Diaries",       href: "#travels",
               text: "Field notes from home in India and Berlin, and journeys through Poland, Austria and the Czech Republic.",
               img: "images/austria.jpg", alt: "Ankita beside the lake in Hallstatt, Austria" },
    style:   { no: "Chapter IV",  name: "The Atelier",            title: "Fashion & Style",      href: "#style",
               text: "A lookbook of the outfits, colours and textures I love, from sharp boardroom tailoring to black lace at midnight.",
               img: "images/look-signature.jpg", alt: "Ankita in a white vest beneath black chandeliers" },
    magic:   { no: "Chapter V",   name: "The Moonlit Library",    title: "Magical Interests",     href: "#magic",
               text: "The shelf of spells: a lifelong love of Harry Potter, moon phases, candlelit reading and all things a little enchanted.",
               img: "images/berlin-night.jpg", alt: "The Berliner Dom lit up at night" },
    contact: { no: "Chapter VI",  name: "The Lantern Post",       title: "Send an Owl",          href: "#contact",
               text: "The strategist, the traveller, the fashion lover and the curious soul, all in one place. Write to me here.",
               img: "images/prague.jpg", alt: "Ankita with arms open on a snowy Charles Bridge in Prague" }
  };
  var card = document.getElementById("chapter-card");
  var markers = document.querySelectorAll(".marker");
  function show(id) {
    var c = chapters[id]; if (!c || !card) return;
    card.querySelector("[data-f=no]").textContent = c.no + " · " + c.name;
    card.querySelector("[data-f=title]").textContent = c.title;
    card.querySelector("[data-f=text]").textContent = c.text;
    var img = card.querySelector("[data-f=photo]");
    if (img.getAttribute("src") !== c.img) { img.src = c.img; img.alt = c.alt; }
    card.querySelector("[data-f=link]").setAttribute("href", c.href);
    markers.forEach(function (m) { m.classList.toggle("active", m.getAttribute("data-chapter") === id); m.setAttribute("aria-pressed", String(m.getAttribute("data-chapter") === id)); });
  }
  markers.forEach(function (m) {
    var id = m.getAttribute("data-chapter");
    m.addEventListener("click", function () { show(id); });
    m.addEventListener("mouseenter", function () { show(id); });
    m.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(id); }
    });
  });
  if (card) {
    show("story");
    Object.keys(chapters).forEach(function (k) { var pre = new Image(); pre.src = chapters[k].img; });
  }

  // Tonight's moon: phase from a known new moon (6 Jan 2000, 18:14 UTC),
  // drawn as a softly lit, natural grey sphere
  var moonCanvas = document.getElementById("moon-now");
  if (moonCanvas && moonCanvas.getContext) {
    var synodic = 29.530588853;
    var days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
    var p = ((days % synodic) + synodic) % synodic / synodic;
    var illum = Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100);
    var names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    document.getElementById("moon-name").textContent = names[Math.floor(p * 8 + 0.5) % 8];
    document.getElementById("moon-detail").textContent = illum + "% illuminated · day " + Math.floor(p * synodic) + " of 29";

    var size = 220, mc = moonCanvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    moonCanvas.width = size * dpr; moonCanvas.height = size * dpr; mc.scale(dpr, dpr);
    var cx = size / 2, cy = size / 2, r = 78;
    var radial = function (x0, y0, r0, x1, y1, r1, stops) {
      var g = mc.createRadialGradient(x0, y0, r0, x1, y1, r1);
      stops.forEach(function (st) { g.addColorStop(st[0], st[1]); });
      return g;
    };
    // outer glow
    mc.fillStyle = radial(cx, cy, r * 0.9, cx, cy, r * 1.45, [[0, "rgba(235,235,240,0.18)"], [0.5, "rgba(235,235,240,0.05)"], [1, "rgba(235,235,240,0)"]]);
    mc.fillRect(0, 0, size, size);

    mc.save();
    mc.beginPath(); mc.arc(cx, cy, r, 0, Math.PI * 2); mc.clip();
    // the sphere, lit from the upper left
    mc.fillStyle = radial(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r * 1.05,
      [[0, "#f7f6f2"], [0.35, "#e2e0da"], [0.7, "#b4b2ab"], [1, "#6a6965"]]);
    mc.fillRect(cx - r, cy - r, r * 2, r * 2);
    // seas: broad soft plum patches
    [[-0.22, -0.12, 0.42, 0.3], [0.28, 0.22, 0.32, 0.24], [0.1, -0.45, 0.22, 0.14]].forEach(function (m) {
      mc.fillStyle = radial(cx + m[0] * r, cy + m[1] * r, 0, cx + m[0] * r, cy + m[1] * r, m[2] * r,
        [[0, "rgba(92,92,96,0.34)"], [1, "rgba(92,92,96,0)"]]);
      mc.beginPath(); mc.ellipse(cx + m[0] * r, cy + m[1] * r, m[2] * r, m[3] * r, 0.3, 0, Math.PI * 2); mc.fill();
    });
    // craters with a bright lower-right rim
    [[-0.38, -0.3, 0.13], [0.22, -0.42, 0.09], [0.38, 0.08, 0.15], [-0.1, 0.38, 0.11], [0.04, 0.02, 0.06],
     [-0.55, 0.18, 0.07], [0.55, -0.2, 0.05], [-0.28, -0.6, 0.05], [0.24, 0.55, 0.06], [-0.48, 0.48, 0.05]].forEach(function (c) {
      var x = cx + c[0] * r, y = cy + c[1] * r, cr = c[2] * r;
      mc.fillStyle = radial(x - cr * 0.3, y - cr * 0.3, 0, x, y, cr, [[0, "rgba(70,70,74,0.4)"], [1, "rgba(70,70,74,0.1)"]]);
      mc.beginPath(); mc.arc(x, y, cr, 0, Math.PI * 2); mc.fill();
      mc.strokeStyle = "rgba(255,250,240,0.35)"; mc.lineWidth = Math.max(0.8, cr * 0.15);
      mc.beginPath(); mc.arc(x, y, cr, -0.2, Math.PI * 0.8); mc.stroke();
    });
    // night side of the moon for today's phase
    var waxing = p < 0.5, k = Math.cos(2 * Math.PI * p), crescent = illum < 50;
    mc.beginPath();
    if (waxing) {
      mc.arc(cx, cy, r, Math.PI / 2, Math.PI * 1.5, false);
      mc.ellipse(cx, cy, Math.abs(k) * r, r, 0, Math.PI * 1.5, Math.PI / 2, !crescent);
    } else {
      mc.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
      mc.ellipse(cx, cy, Math.abs(k) * r, r, 0, Math.PI / 2, Math.PI * 1.5, !crescent);
    }
    mc.closePath();
    mc.fillStyle = "rgba(12,12,16,0.86)"; mc.fill();
    mc.fillStyle = "rgba(120,130,150,0.06)"; mc.fill(); // faint earthshine
    // limb darkening sells the curve
    mc.fillStyle = radial(cx, cy, r * 0.55, cx, cy, r, [[0, "rgba(10,10,14,0)"], [1, "rgba(10,10,14,0.5)"]]);
    mc.fillRect(cx - r, cy - r, r * 2, r * 2);
    mc.restore();
    // gold rim
    var rim = mc.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rim.addColorStop(0, "rgba(255,255,255,0.45)"); rim.addColorStop(0.5, "rgba(255,255,255,0.08)"); rim.addColorStop(1, "rgba(255,255,255,0.2)");
    mc.strokeStyle = rim; mc.lineWidth = 1;
    mc.beginPath(); mc.arc(cx, cy, r + 0.5, 0, Math.PI * 2); mc.stroke();
    // a few gold stars around it
    [[28, 40, 1.4], [190, 58, 1.1], [40, 182, 1], [196, 170, 1.5], [110, 14, 0.9]].forEach(function (st) {
      mc.fillStyle = "rgba(235,235,240,0.7)";
      mc.beginPath(); mc.arc(st[0], st[1], st[2], 0, Math.PI * 2); mc.fill();
    });
  }

  // A faint trail of sparks behind the wand (mouse only, skipped for reduced motion)
  if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
    var last = 0;
    addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var now = performance.now();
      if (now - last < 45) return;
      last = now;
      var s = document.createElement("span");
      s.className = "spark";
      s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      s.style.setProperty("--dx", (Math.random() * 16 - 8).toFixed(1) + "px");
      if (Math.random() < 0.3) s.style.background = "#d5c5e9";
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 800);
    }, { passive: true });
  }

  // Travel flip cards: click or tap anywhere on a card to turn it over
  document.querySelectorAll("[data-flip]").forEach(function (card) {
    var front = card.querySelector(".front"), back = card.querySelector(".back");
    card.addEventListener("click", function () {
      var flipped = card.classList.toggle("flipped");
      front.inert = flipped; back.inert = !flipped;
      var target = (flipped ? back : front).querySelector(".turn");
      if (target && document.activeElement && card.contains(document.activeElement)) target.focus({ preventScroll: true });
    });
  });

  // The Traveller's Map: hover (or tap) the oath button and the words write themselves,
  // then the map unfolds. "Mischief managed" folds it away again.
  var mm = document.querySelector(".marauder");
  if (mm) {
    var mmInk = mm.querySelector(".mm-ink");
    var mmOath = mm.querySelector(".mm-oath");
    var mmMap = mm.querySelector(".mm-map");
    var mmClose = mm.querySelector(".mm-close");
    var mmBusy = false;
    var inkWrite = function (text, done) {
      mmInk.textContent = "";
      if (reduceMotion) { mmInk.textContent = text; setTimeout(done, 700); return; }
      var wrap = document.createElement("span");
      wrap.className = "sr-only"; wrap.textContent = text;
      wrap.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)";
      mmInk.appendChild(wrap);
      text.split("").forEach(function (ch, i) {
        var c = document.createElement("span");
        c.textContent = ch; c.setAttribute("aria-hidden", "true");
        c.style.animationDelay = (i * 55) + "ms";
        mmInk.appendChild(c);
      });
      setTimeout(done, text.length * 55 + 800);
    };
    var openMap = function () {
      if (mmBusy || mm.dataset.state !== "closed") return;
      mmBusy = true; mm.dataset.state = "swearing";
      inkWrite("I solemnly swear that I am up to no good.", function () {
        mmMap.hidden = false; mm.dataset.state = "open"; mmBusy = false;
      });
    };
    var closeMap = function () {
      if (mmBusy || mm.dataset.state !== "open") return;
      mmBusy = true; mm.dataset.state = "closing";
      setTimeout(function () {
        mmMap.hidden = true; mm.dataset.state = "managed";
        var top = mm.getBoundingClientRect().top + scrollY - 90;
        scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
        inkWrite("Mischief managed.", function () {
          setTimeout(function () {
            mmInk.textContent = ""; mm.dataset.state = "closed"; mmBusy = false;
          }, 1800);
        });
      }, reduceMotion ? 0 : 700);
    };
    if (matchMedia("(hover: hover)").matches) mmOath.addEventListener("mouseenter", openMap);
    mmOath.addEventListener("click", openMap);
    mmClose.addEventListener("click", closeMap);
  }

  // Wand cursor drawn by the page itself. Browsers can refuse custom cursor images
  // when the site is shown inside a frame (as in the artifact viewer), so the wand
  // is an element that follows the mouse; the CSS cursor stays as a fallback.
  if (matchMedia("(pointer: fine)").matches) {
    var wand = document.createElement("img");
    wand.id = "wand-cursor"; wand.alt = ""; wand.setAttribute("aria-hidden", "true");
    wand.src = "images/wand.png"; wand.srcset = "images/wand.png 1x, images/wand@2x.png 2x";
    var litSrc = "images/wand-lit.png", litSet = "images/wand-lit.png 1x, images/wand-lit@2x.png 2x";
    var plainSrc = wand.src, plainSet = wand.srcset;
    new Image().src = "images/wand-lit@2x.png";
    document.body.appendChild(wand);
    document.documentElement.classList.add("wand-js");
    var wx = -100, wy = -100, queued = false, lit = false;
    var place = function () { wand.style.transform = "translate(" + (wx - 4) + "px," + (wy - 4) + "px)"; queued = false; };
    addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      wx = e.clientX; wy = e.clientY;
      var t = e.target instanceof Element ? e.target : null;
      var typing = t && t.closest("input, textarea");
      wand.classList.toggle("hide", !!typing);
      var nowLit = !!(t && t.closest('a, button, summary, label, .marker, [role="button"], .flip'));
      if (nowLit !== lit) { lit = nowLit; wand.src = lit ? litSrc : plainSrc; wand.srcset = lit ? litSet : plainSet; }
      wand.classList.add("on");
      if (!queued) { queued = true; requestAnimationFrame(place); }
    }, { passive: true });
    document.addEventListener("mouseleave", function () { wand.classList.remove("on"); });
  }

  // Apothecary shelf: hovering or tapping a bottle brews it and shows its label
  var potions = document.querySelectorAll(".potion");
  var pickPotion = function (btn) {
    if (btn.classList.contains("active")) return;
    var id = btn.getAttribute("data-potion");
    potions.forEach(function (b) { var on = b === btn; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
    document.querySelectorAll(".potion-card").forEach(function (c) { c.hidden = c.getAttribute("data-card") !== id; });
    btn.classList.remove("brew"); void btn.offsetWidth; btn.classList.add("brew");
  };
  potions.forEach(function (btn) {
    btn.addEventListener("click", function () { pickPotion(btn); });
    btn.addEventListener("mouseenter", function () { pickPotion(btn); });
    btn.addEventListener("focus", function () { pickPotion(btn); });
  });
})();
