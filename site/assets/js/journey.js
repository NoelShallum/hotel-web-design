/* Shivaya Prakriti: the guided journey.
   A visitor answers a few questions, one per screen, sees a stay sketched from
   their answers, and leaves their details to be contacted or kept posted.
   The copy is in index.html; this file runs the flow. */
(function () {
  "use strict";

  var root = document.documentElement;
  var J = document.getElementById("journey");
  if (!J) return;

  var STORE = "sp-journey";
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var conn = navigator.connection || {};
  var saveData = !!(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""));
  var canHover = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  var stage = J.querySelector(".j-stage");
  var progress = J.querySelector(".j-progress");
  var backBtn = J.querySelector("[data-j-back]");
  var hint = J.querySelector(".j-hint");

  function $(sel, el) { return (el || J).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || J).querySelectorAll(sel)); }
  function stepEl(id) { return $('.j-step[data-step="' + id + '"]'); }
  function tbc(text) { return ' <span class="tbc">' + (text || "TBC") + "</span>"; }

  // ---------- What each answer means ----------
  var INTERESTS = ["stay", "sound", "yoga", "food", "craft"];
  var SCENES = {
    stay: ["photos/cabin-night.jpg", "50% 60%"],
    sound: ["photos/gong-room.jpg", "42% 50%"],
    yoga: ["photos/yoga-ridge.jpg", "40% 45%"],
    food: ["photos/thali.jpg", "50% 50%"],
    craft: ["photos/clay-wheel-dark.jpg", "50% 55%"],
    who: ["photos/silhouette-fire.jpg", "50% 82%"],
    when: ["photos/lake-camp-stars.jpg", "50% 40%"],
    more: ["photos/forest-fog.jpg", "50% 50%"],
    from: ["photos/tirthan-smoke.jpg", "50% 50%"],
    plan: ["photos/tirthan-house.jpg", "50% 50%"],
    host: ["photos/loom.jpg", "50% 50%"],
    contact: ["photos/tent-forest.jpg", "50% 50%"]
  };
  var THUMBS = { stay: "cabin-night", sound: "gong-room", yoga: "yoga-ridge", food: "thali", craft: "clay-wheel-dark" };

  // A short handwritten reply to the last answer, shown on the next screen
  var ECHO = {
    need: { stay: "Noted: sleep, and a quiet room.", sound: "Music that isn't traffic. Noted.", yoga: "Room to stretch. Noted.", food: "Food you can trace. Good.", craft: "Something made by hand. Lovely." },
    who: { solo: "Just you, then.", two: "The two of you.", family: "Family or friends. The more the merrier.", group: "A group. We like a full fire." },
    length: { weekend: "A long weekend. Enough to slow down.", week: "A week. Long enough to settle in.", month: "A month. You may not want to leave.", unsure: "No need to decide yet." },
    room: { view: "Trees outside the window. Noted.", desk: "A desk that works. Noted.", quiet: "Quiet, above everything. Noted.", warm: "Warm on a cold night. Noted." },
    soundExp: { "new": "A first time. We'll start gently.", some: "Good, you know the feeling.", regular: "Then you'll feel at home." },
    yogaExp: { "new": "Everyone starts somewhere.", some: "On and off is fine.", daily: "Then the mornings here are yours." },
    diet: { veg: "Vegetarian. Noted.", vegan: "Vegan. We'll go through the details with you.", all: "A bit of everything. Noted.", later: "Fine, tell us when we talk." },
    bring: { sound: "Sound or music. Lovely.", movement: "Yoga or movement. Lovely.", healing: "Naturopathy or bodywork. Lovely.", craft: "An art or a craft. Lovely.", volunteer: "Your time. Thank you." },
    intent: { outreach: "Lovely. We'll take it from here.", updates: "No rush at all.", host: "We'd love to hear about it." },
    done: { outreach: "Your plan is with us now.", updates: "You're on the list.", host: "Lovely to meet you." }
  };
  var CRAFTS = { clay: "clay modelling", plate: "plate design", paint: "painting", hemp: "hemp craft", upcycle: "upcycling", build: "building" };

  // ---------- Saved progress (answers only, never names or contact details) ----------
  var state = load();
  var A = state.answers = state.answers || {};

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { return {}; }
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ v: 1, closed: !!state.closed, done: !!state.done, step: state.step, answers: A }));
    } catch (e) { /* private mode: the journey still works, it just won't remember */ }
  }

  // Campaign tags from the landing link travel with the enquiry
  var utm = {};
  location.search.replace(/[?&](utm_[a-z]+)=([^&]*)/g, function (m, k, v) { utm[k] = decodeURIComponent(v.replace(/\+/g, " ")); });
  try {
    if (Object.keys(utm).length) sessionStorage.setItem("sp-utm", JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem("sp-utm") || "{}");
  } catch (e) {}

  // Analytics hook: pushes to a tag manager's dataLayer if the site adds one later
  function track(name, props) {
    var detail = { event: "journey_" + name };
    for (var k in props) if (Object.prototype.hasOwnProperty.call(props, k)) detail[k] = props[k];
    if (window.dataLayer && window.dataLayer.push) window.dataLayer.push(detail);
    try { document.dispatchEvent(new CustomEvent("sp:journey", { detail: detail })); } catch (e) {}
  }

  // ---------- The route through the steps, worked out from the answers so far ----------
  function flow() {
    if (A.host) return ["intro", "host", "contact", "thanks"];
    var f = A.entry ? [A.need, "who", "when", "more"] : ["intro", "who", "when"].concat(A.need ? [A.need, "more"] : []);
    (A.extras || []).forEach(function (x) { if (f.indexOf(x) < 0) f.push(x); });
    return f.concat(["from", "plan", "contact", "thanks"]);
  }
  function intent() { return A.host ? "host" : (A.intent || "outreach"); }

  function echoOf(id) {
    switch (id) {
      case "intro": return ECHO.need[A.need] || "";
      case "who": return ECHO.who[A.who] || "";
      case "when": return ECHO.length[A.length] || "";
      case "stay": return ECHO.room[A.room] || "";
      case "sound": return ECHO.soundExp[A.soundExp] || "";
      case "yoga": return ECHO.yogaExp[A.yogaExp] || "";
      case "food": return ECHO.diet[A.diet] || "";
      case "craft": return (A.crafts || []).length ? "Good picks." : "You might find one when you're here.";
      case "more": return (A.extras || []).length ? "Good. We'll add those." : "Keeping it simple. Good.";
      case "host": return ECHO.bring[A.bring] || "";
      case "plan": return ECHO.intent[intent()] || "";
      default: return "";
    }
  }
  function echoBefore(id) {
    var f = flow(), i = f.indexOf(id);
    return i > 0 ? echoOf(f[i - 1]) : "";
  }

  // ---------- Background scenes ----------
  var scenes = { fire: $('.j-scene[data-scene="fire"]') };
  var activeScene = null, wantScene = null, underTimer = 0; // null, so the first setScene starts the video and embers

  function makeScene(name) {
    if (scenes[name] || !SCENES[name]) return scenes[name];
    var div = document.createElement("div");
    var img = new Image();
    div.className = "j-scene";
    div.setAttribute("data-scene", name);
    img.alt = "";
    img.decoding = "async";
    img.src = "assets/img/" + SCENES[name][0];
    img.style.objectPosition = SCENES[name][1];
    div.appendChild(img);
    $(".j-bg").appendChild(div);
    scenes[name] = div;
    return div;
  }
  function preload(names) { names.forEach(makeScene); }

  function setScene(name) {
    if (!name || !(scenes[name] || SCENES[name])) return;
    wantScene = name;
    if (name === activeScene) return;
    var el = makeScene(name);
    var img = el.querySelector("img");
    function show() {
      if (wantScene !== name) return;
      var old = activeScene && scenes[activeScene];
      $$(".j-scene").forEach(function (s) {
        s.classList.toggle("is-on", s === el);
        s.classList.toggle("is-under", s === old && s !== el);
      });
      clearTimeout(underTimer);
      underTimer = setTimeout(function () { if (old) old.classList.remove("is-under"); }, 1500);
      activeScene = name;
      Video.toggle(name === "fire");
      Embers.toggle(name === "fire" || name === "who");
      Sound.scene(name);
    }
    if (!img) { show(); return; }
    var fired = false;
    function ready() { if (!fired) { fired = true; show(); } }
    // decode() waits for the download and the decode, so the fade never starts on an undecoded frame.
    // It can stall while the page isn't being drawn (a background tab, a locked phone), so a loaded
    // image also gets a short fallback and a scene can never get stuck.
    if (img.decode) img.decode().then(ready, ready);
    var grace = img.decode ? 250 : 0;
    if (img.complete) setTimeout(ready, grace);
    else {
      img.addEventListener("load", function () { setTimeout(ready, grace); }, { once: true });
      img.addEventListener("error", ready, { once: true });
    }
  }

  // ---------- The fire video ----------
  var Video = (function () {
    var v = $(".j-video");
    var ready = false;
    function tall() { return window.innerHeight > window.innerWidth * 1.05; }
    return {
      init: function () {
        if (!v || ready) return;
        if (tall() && v.getAttribute("data-poster-tall")) v.poster = v.getAttribute("data-poster-tall");
        if (reduceMotion || saveData) return; // the still poster stays
        v.src = tall() ? v.getAttribute("data-tall") : v.getAttribute("data-wide");
        v.preload = "auto";
        ready = true;
      },
      toggle: function (on) {
        if (!ready) return;
        if (on && !document.hidden) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      }
    };
  })();

  // ---------- Embers rising from the fire ----------
  var Embers = (function () {
    var c = $(".j-embers");
    var ctx = c && c.getContext && c.getContext("2d");
    var parts = [], raf = 0, on = false, w = 0, h = 0, last = 0;
    if (!ctx || reduceMotion) return { toggle: function () {} };

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.max(14, Math.min(42, Math.round((w * h) / 38000)));
      while (parts.length < want) parts.push(spawn({}, true));
      parts.length = want;
    }
    function spawn(p, anywhere) {
      p.x = w * (0.18 + Math.random() * 0.68);
      p.y = anywhere ? h * (0.35 + Math.random() * 0.65) : h + 8;
      p.vy = -(16 + Math.random() * 40);
      p.vx = (Math.random() - 0.5) * 12;
      p.r = 0.6 + Math.random() * 1.5;
      p.t = 0;
      p.life = 4 + Math.random() * 7;
      p.ph = Math.random() * 6.283;
      return p;
    }
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.t += dt;
        if (p.t > p.life || p.y < -12) spawn(p, false);
        p.x += (p.vx + Math.sin(p.t * 1.4 + p.ph) * 9) * dt;
        p.y += p.vy * dt;
        var k = p.t / p.life;
        var a = (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88) * 0.85;
        ctx.fillStyle = "rgba(244,162,75," + (a * 0.22).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4.5, 0, 6.283); ctx.fill();
        ctx.fillStyle = "rgba(255,206,140," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      raf = on ? requestAnimationFrame(frame) : 0;
    }
    window.addEventListener("resize", function () { if (on) size(); });
    return {
      toggle: function (v) {
        v = !!v && !document.hidden && root.classList.contains("journey-open");
        c.classList.toggle("is-on", v);
        if (v === on) return;
        on = v;
        if (on) { size(); last = performance.now(); raf = requestAnimationFrame(frame); }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }
    };
  })();

  // ---------- Sound: a quiet bed of wind and fire, and a singing bowl ----------
  // Everything is synthesised, so there are no audio files to load.
  var Sound = (function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    var btn = $(".j-sound"), label = $(".j-sound__label");
    var ctx, master, verb, bedGain, clickBuf, crackleTimer, on = false, fireLevel = 1;
    if (!AC) {
      if (btn) btn.hidden = true;
      return { set: function () {}, toggle: function () {}, bowl: function () {}, scene: function () {}, stop: function () {}, on: function () { return false; } };
    }

    function ensure() {
      if (ctx) return ctx;
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp); comp.connect(ctx.destination);
      // A small room for the bowl to ring in
      verb = ctx.createConvolver();
      verb.buffer = impulse(3.2);
      var wet = ctx.createGain(); wet.gain.value = 0.32;
      verb.connect(wet); wet.connect(master);
      // A short burst of noise: the knock of a mallet, or a crack in the fire
      clickBuf = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.03), ctx.sampleRate);
      var d = clickBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
      return ctx;
    }
    function impulse(sec) {
      var len = Math.round(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var d = b.getChannelData(ch);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      return b;
    }
    function startBed() {
      // Brown noise through a low filter reads as wind in the trees, or a river far off
      var len = ctx.sampleRate * 8, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480;
      bedGain = ctx.createGain(); bedGain.gain.value = 0;
      var lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = 0.07; depth.gain.value = 0.05;
      lfo.connect(depth); depth.connect(bedGain.gain);
      src.connect(lp); lp.connect(bedGain); bedGain.connect(master);
      src.start(); lfo.start();
    }
    function crackle() {
      clearTimeout(crackleTimer);
      if (!on || !ctx) return;
      if (fireLevel > 0) {
        var n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        n.buffer = clickBuf;
        bp.type = "bandpass"; bp.frequency.value = 1600 + Math.random() * 2800; bp.Q.value = 0.8;
        g.gain.value = (0.015 + Math.random() * 0.07) * fireLevel;
        n.connect(bp); bp.connect(g); g.connect(master);
        n.start();
      }
      crackleTimer = setTimeout(crackle, 50 + Math.random() * (Math.random() < 0.25 ? 900 : 260));
    }
    function set(v) {
      on = !!v;
      if (btn) btn.setAttribute("aria-pressed", String(on));
      if (label) label.textContent = on ? "Sound on" : "Sound off";
      if (on) {
        ensure();
        if (ctx.state === "suspended") ctx.resume();
        if (!bedGain) startBed();
        bedGain.gain.setTargetAtTime(0.15, ctx.currentTime, 1.2);
        crackle();
        if (hint) hint.classList.remove("is-on");
      } else if (ctx) {
        if (bedGain) bedGain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
        clearTimeout(crackleTimer);
      }
    }
    function bowl() {
      ensure();
      if (ctx.state === "suspended") ctx.resume();
      var t = ctx.currentTime + 0.02, f0 = 196;
      var out = ctx.createGain();
      out.gain.value = 0.55;
      out.connect(master); out.connect(verb);
      // A bowl's partials are not whole multiples; pairs a hair apart give the slow beat
      [[1, 1, 9], [2.76, 0.42, 6.5], [5.4, 0.2, 3.8], [8.93, 0.08, 2.2]].forEach(function (p, i) {
        [0, 0.8 + i * 0.55].forEach(function (detune) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = f0 * p[0] + detune;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(p[1] * 0.16, t + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
          o.connect(g); g.connect(out);
          o.start(t); o.stop(t + p[2] + 0.1);
        });
      });
      var knock = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), kg = ctx.createGain();
      knock.buffer = clickBuf; lp.type = "lowpass"; lp.frequency.value = 2200; kg.gain.value = 0.22;
      knock.connect(lp); lp.connect(kg); kg.connect(out);
      knock.start(t);
    }
    return {
      set: set,
      toggle: function () { set(!on); track("sound", { on: on }); },
      bowl: bowl,
      on: function () { return on; },
      scene: function (name) { fireLevel = (name === "fire" || name === "who") ? 1 : 0.15; },
      stop: function () { set(false); if (ctx && ctx.state === "running") ctx.suspend(); }
    };
  })();

  // ---------- Moving between steps ----------
  var current = null, busy = false, pushes = 0;

  function go(id, opts) {
    opts = opts || {};
    var next = stepEl(id);
    if (!next || (id === current && !opts.force)) return;
    var prev = current && current !== id ? stepEl(current) : null;
    prepare(id, next);
    busy = true;
    if (id !== "intro" && hint) hint.classList.remove("is-on");

    function swap() {
      // Hide every other step, not just the previous one: a deep link opens with no previous step
      // over the intro, and two quick moves can both be mid-animation
      $$(".j-step", J).forEach(function (s) {
        if (s === next) return;
        s.hidden = true;
        s.classList.remove("is-leaving", "is-entering", "is-arriving");
      });
      next.hidden = false;
      next.classList.remove("is-leaving", "is-entering");
      if (opts.arrive && !reduceMotion) next.classList.add("is-arriving");
      else if (!reduceMotion) { void next.offsetWidth; next.classList.add("is-entering"); }
      root.classList.remove("j-arrive", "j-deep"); // the head script held the first screen back; the animation takes over now
      stage.scrollTop = 0;
      var head = next.querySelector('[tabindex="-1"]');
      if (head) {
        J.setAttribute("aria-labelledby", head.id);
        if (!opts.noFocus) head.focus({ preventScroll: true });
      }
      current = id;
      setScene(next.getAttribute("data-scene"));
      chrome();
      after(id);
      busy = false;
    }
    if (prev && !reduceMotion) { prev.classList.add("is-leaving"); setTimeout(swap, 300); }
    else swap();

    if (opts.push !== false) { history.pushState({ sj: id }, ""); pushes++; }
    if (id !== "intro") state.step = id; // the intro is never a place to resume to, and opening it must not erase one
    save();
    track("step", { step: id, index: flow().indexOf(id) });
  }

  function advance() {
    var f = flow(), i = f.indexOf(current);
    if (i > -1 && i < f.length - 1) go(f[i + 1]);
  }

  function back() {
    if (pushes > 0 && history.state && history.state.sj) { history.back(); return; }
    var f = flow(), i = f.indexOf(current);
    if (i > 0) go(f[i - 1], { push: false });
  }

  function chrome() {
    var f = flow(), i = f.indexOf(current), last = f.length - 1;
    var pct = i <= 0 ? 0 : Math.round((i / last) * 100);
    progress.querySelector("span").style.setProperty("--p", pct + "%");
    progress.classList.toggle("is-on", i > 0);
    backBtn.hidden = i <= 0 || current === "thanks";
    J.setAttribute("data-current", current); // not data-step: that would collide with the steps' own selectors
    J.setAttribute("data-depth", current === "plan" || current === "contact" ? "deep" : "");
  }

  // Fill in anything on a step that depends on earlier answers
  function prepare(id, el) {
    var echo = el.querySelector("[data-echo]");
    if (echo) echo.textContent = id === "thanks" ? ECHO.done[intent()] : echoBefore(id);

    // Show earlier single-choice answers as picked, for when someone comes back
    $$("[data-answer]", el).forEach(function (b) {
      var picked = A[b.getAttribute("data-answer")] === b.getAttribute("data-value");
      b.classList.toggle("is-picked", picked);
    });

    if (id === "intro") {
      var resume = $(".j-resume", el);
      resume.hidden = !(state.step && state.step !== "intro" && !state.done && (A.need || A.host));
    }
    if (id === "craft") {
      $$(".j-chip", el).forEach(function (c) { c.setAttribute("aria-pressed", String((A.crafts || []).indexOf(c.getAttribute("data-value")) > -1)); });
    }
    if (id === "more") {
      $$(".j-tile", el).forEach(function (t) {
        var v = t.getAttribute("data-value");
        t.parentNode.hidden = v === A.need;
        t.setAttribute("aria-pressed", String((A.extras || []).indexOf(v) > -1));
      });
      moreLabel();
    }
    if (id === "from") $("[data-route]", el).hidden = true; // redrawn in after(), once it can be measured
    if (id === "plan") buildPlan();
    if (id === "contact") prepareContact();
  }

  // Things that happen once a step is on screen
  function after(id) {
    var f = flow(), nxt = stepEl(f[f.indexOf(id) + 1]);
    if (nxt) makeScene(nxt.getAttribute("data-scene")); // fetch the next photo while this screen is read
    if (id === "intro" && canHover && !saveData) setTimeout(function () { preload(INTERESTS); }, 2500);
    if (id === "from" && A.from) drawRoute(A.from, false);
  }

  // ---------- Answers ----------
  function answer(btn) {
    if (busy) return;
    var key = btn.getAttribute("data-answer"), val = btn.getAttribute("data-value");
    A[key] = val;
    if (key === "need") {
      A.host = false;
      A.entry = false;
      A.extras = (A.extras || []).filter(function (x) { return x !== val; });
      if (stepEl("intro").classList.contains("is-arriving")) stepEl("intro").classList.remove("is-arriving");
    }
    $$('[data-answer="' + key + '"]', btn.closest(".j-step")).forEach(function (b) { b.classList.toggle("is-picked", b === btn); });
    save();
    track("answer", { question: key, answer: val });
    if (btn.hasAttribute("data-stay")) { drawRoute(val, true); return; }
    busy = true;
    setTimeout(function () { busy = false; advance(); }, reduceMotion ? 120 : 380);
  }

  function toggleMulti(btn) {
    var box = btn.closest("[data-multi]"), key = box.getAttribute("data-multi");
    btn.setAttribute("aria-pressed", String(btn.getAttribute("aria-pressed") !== "true"));
    A[key] = $$('[aria-pressed="true"]', box).filter(function (b) { return !(b.parentNode.hidden); }).map(function (b) { return b.getAttribute("data-value"); });
    if (key === "extras") moreLabel();
    save();
  }

  function moreLabel() {
    var b = $("[data-j-next]", stepEl("more"));
    var some = (A.extras || []).length > 0;
    b.textContent = b.getAttribute(some ? "data-label-some" : "data-label-none");
  }

  // ---------- The way here: a road drawn north from Delhi ----------
  var routeRaf = 0;
  function drawRoute(from, animate) {
    var box = $("[data-route]"), path = $("[data-r-path]", box), pre = $("[data-r-pre]", box);
    var g = $("[data-r-nodes]", box), km = $("[data-r-km]", box), text = $("[data-r-text]", box);
    var NS = "http://www.w3.org/2000/svg";
    box.hidden = false;
    pre.style.display = from === "delhi" ? "none" : "";

    var lead = { delhi: "Your start", india: "From your city", abroad: "After your flight" }[from];
    var stops = [
      [0, "Delhi NCR", lead, "start"],
      [0.7, "Mandi", "", "start"],
      [0.84, "Aut tunnel", "", "end"],
      [1, "Tirthan Valley", "location TBC", "end"]
    ];
    var L = path.getTotalLength();
    g.textContent = "";
    var labels = stops.map(function (s, i) {
      var pt = path.getPointAtLength(L * s[0]);
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
      dot.setAttribute("r", i === stops.length - 1 ? 5 : 3.5);
      dot.setAttribute("class", i === stops.length - 1 ? "r-node r-end" : "r-node");
      var grp = document.createElementNS(NS, "g");
      grp.setAttribute("class", "r-label");
      grp.appendChild(dot);
      var dx = s[3] === "start" ? 10 : -10, anchor = s[3] === "start" ? "start" : "end";
      var t1 = document.createElementNS(NS, "text");
      t1.setAttribute("x", pt.x + dx); t1.setAttribute("y", pt.y + (s[3] === "start" ? 4 : 1));
      t1.setAttribute("text-anchor", anchor);
      t1.textContent = s[1];
      grp.appendChild(t1);
      if (s[2]) {
        var t2 = document.createElementNS(NS, "text");
        t2.setAttribute("x", pt.x + dx); t2.setAttribute("y", pt.y + (s[3] === "start" ? 19 : 15));
        t2.setAttribute("text-anchor", anchor);
        t2.setAttribute("class", "r-small");
        t2.textContent = s[2];
        grp.appendChild(t2);
      }
      g.appendChild(grp);
      return { at: s[0], el: grp };
    });

    text.innerHTML = {
      delhi: "About 480 km by road from Delhi NCR. The valley branches off at the Aut tunnel. Travel times and the best way up" + tbc(),
      india: "Most routes join the road north through Delhi or Chandigarh. Options from your city" + tbc(),
      abroad: "Fly into Delhi, then continue north by road for about 480 km. Pickups, visas and paying in foreign currency" + tbc()
    }[from];

    cancelAnimationFrame(routeRaf);
    if (!animate || reduceMotion) {
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
      labels.forEach(function (l) { l.el.classList.add("is-on"); });
      km.textContent = "480";
      return;
    }
    path.style.strokeDasharray = L;
    path.style.strokeDashoffset = L;
    km.textContent = "0";
    var start = performance.now(), dur = 2600;
    (function tick(now) {
      var k = Math.min(1, (now - start) / dur);
      var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      path.style.strokeDashoffset = String(L * (1 - e));
      km.textContent = String(Math.round(480 * e));
      labels.forEach(function (l) { if (e >= l.at - 0.001) l.el.classList.add("is-on"); });
      if (k < 1) routeRaf = requestAnimationFrame(tick);
    })(start);
    // On a phone the route sits under the question: scroll just enough to show its Continue button,
    // without pushing the top of the map out of view
    setTimeout(function () {
      var s = stage.getBoundingClientRect(), b = box.getBoundingClientRect();
      var by = Math.min(b.bottom - s.bottom + 16, b.top - s.top - 8);
      if (by > 0) stage.scrollBy({ top: by, behavior: reduceMotion ? "auto" : "smooth" });
    }, 150);
  }

  // ---------- The plan, sketched from the answers ----------
  function chosen() {
    var list = [];
    if (A.need) list.push(A.need);
    (A.extras || []).forEach(function (x) { if (list.indexOf(x) < 0) list.push(x); });
    return list;
  }

  function listOf(words) {
    if (words.length < 2) return words.join("");
    return words.slice(0, -1).join(", ") + " and " + words[words.length - 1];
  }

  function buildPlan() {
    var picks = chosen();
    var len = { weekend: "A long weekend", week: "A week", month: "A month or more", unsure: "Some time away" }[A.length] || "Some time away";
    var who = { solo: "on your own", two: "for two", family: "with family or friends", group: "for a group" }[A.who] || "";
    var from = { delhi: "from Delhi", india: "from elsewhere in India", abroad: "from abroad" }[A.from] || "";
    $("[data-plan-title]").textContent = (who ? len + " " + who : len) + (from ? ", " + from : "") + ".";

    var items = [];
    picks.forEach(function (p) {
      if (p === "stay") {
        items.push({ view: "A room among the pines, with a view of the trees.", desk: "A room with a desk you can work at, for the days you need to.", quiet: "A quiet room, and nowhere you have to be.", warm: "A warm room for the cold nights." }[A.room] || "A room among the pines, by the forest and the river.");
      }
      if (p === "sound") {
        items.push({ "new": "Sound healing with our founder, starting gently, since it's your first time.", some: "Sound healing with our founder, picking up where you left off.", regular: "Sound healing with our founder, as part of your days here." }[A.soundExp] || "Sound healing with our founder.");
      }
      if (p === "yoga") {
        items.push({ "new": "Vedic yoga from the very beginning, with a practitioner.", some: "Vedic yoga at your own pace, with a practitioner.", daily: "Vedic yoga to keep your daily practice going." }[A.yogaExp] || "Vedic yoga with a practitioner.");
      }
      if (p === "food") {
        items.push({ veg: "Vegetarian food from the garden and the villages.", vegan: "Vegan food from the garden and the villages. We'll check the details with you.", all: "Whatever is fresh from the garden and the villages.", later: "Fresh food from the garden and the villages. Tell us how you eat when we talk." }[A.diet] || "Fresh food from the garden and the villages.");
      }
      if (p === "craft") {
        var c = (A.crafts || []).map(function (k) { return CRAFTS[k]; });
        items.push(c.length ? "Workshops: " + listOf(c) + "." : "A workshop or two, whichever catches your eye.");
      }
    });
    if (A.length === "month" && picks.indexOf("stay") < 0) items.push("A workstation for the weeks you're working.");
    items.push({
      delhi: "Getting here: about 480 km by road, through the Aut tunnel.",
      india: "Getting here: join the road north through Delhi or Chandigarh. We'll help with the route.",
      abroad: "Getting here: fly into Delhi and continue north by road. We'll help with the rest."
    }[A.from] || "Getting here: we'll help with the route.");

    var ul = $("[data-plan-list]");
    ul.textContent = "";
    items.forEach(function (t, i) {
      var li = document.createElement("li");
      li.textContent = t;
      if (i === items.length - 1) li.insertAdjacentHTML("beforeend", tbc("Location TBC"));
      ul.appendChild(li);
    });

    var photos = $("[data-plan-photos]");
    photos.textContent = "";
    (picks.length ? picks : ["stay"]).slice(0, 3).forEach(function (p) {
      var fig = document.createElement("figure"), img = new Image();
      fig.className = "frame";
      img.src = "assets/img/thumbs/" + THUMBS[p] + ".jpg";
      img.alt = "";
      img.decoding = "async";
      fig.appendChild(img);
      photos.appendChild(fig);
    });

    var has = function (x) { return picks.indexOf(x) > -1; };
    var firstCraft = (A.crafts || [])[0];
    var day = [
      ["First light", has("yoga") ? "Yoga, with the valley waking up" : "Chai, and the sound of the river"],
      ["Midday", has("craft") ? (firstCraft ? "A session of " + CRAFTS[firstCraft] : "A workshop") : (A.room === "desk" || A.length === "month" ? "Work at your desk, in clean air" : (has("food") ? "Lunch from the garden" : "A walk by the river"))],
      ["Dusk", has("sound") ? "Sound healing with the founder" : "The fire is lit"],
      ["Night", has("sound") ? "Music by the fire, then the stars" : "Stars over the forest"]
    ];
    var dl = $("[data-plan-day]");
    dl.textContent = "";
    day.forEach(function (d) {
      var wrap = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = d[0]; dd.textContent = d[1];
      wrap.appendChild(dt); wrap.appendChild(dd);
      dl.appendChild(wrap);
    });
  }

  // ---------- Contact ----------
  var form = $("#j-form");
  var COPY = {
    outreach: {
      title: "Who should we write to?",
      sub: "A real person will reply about your plan, not a brochure. Reply time" + tbc(),
      submit: "Send my plan",
      consent: "We'll use these details only to reply about your plan. Privacy notice" + tbc()
    },
    updates: {
      title: "Where should we send news?",
      sub: "When dates and retreats open, we'll let you know. Nothing else.",
      submit: "Keep me posted",
      consent: "By choosing Keep me posted, you agree that Shivaya Prakriti may send you news about dates and retreats this way. You can unsubscribe at any time. Privacy notice" + tbc()
    },
    host: {
      title: "Tell us about your practice.",
      sub: "Who you are, what you'd bring, and when you might come. Reply time" + tbc(),
      submit: "Send",
      consent: "We'll use these details only to reply to you. Privacy notice" + tbc()
    }
  };

  function prepareContact() {
    var c = COPY[intent()];
    $("[data-contact-title]").textContent = c.title;
    $("[data-contact-sub]").innerHTML = c.sub;
    $("[data-consent-line]").innerHTML = c.consent;
    $("[data-submit]").textContent = c.submit;
    $("[data-news-opt]").hidden = intent() === "updates";
    if (intent() === "host") setNote(true);
    $("[data-j-status]").textContent = "";
  }

  function setBy() {
    var by = form.elements.by.value;
    $$("[data-by]", form).forEach(function (f) {
      f.hidden = f.getAttribute("data-by") !== by;
      if (f.hidden) $$("input", f).forEach(clearError);
    });
  }
  function setNote(open) {
    var t = $("[data-j-note]"), f = $("#j-note-field");
    f.hidden = !open;
    t.setAttribute("aria-expanded", String(open));
    t.hidden = open;
  }

  function fieldError(input, msg) {
    clearError(input);
    input.setAttribute("aria-invalid", "true");
    var p = document.createElement("p");
    p.className = "field__error";
    p.id = input.id + "-error";
    p.textContent = msg;
    input.setAttribute("aria-describedby", p.id);
    input.parentNode.appendChild(p);
  }
  function clearError(input) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    var old = document.getElementById(input.id + "-error");
    if (old) old.remove();
  }

  if (form) {
    form.addEventListener("change", function (e) { if (e.target.name === "by") setBy(); });
    form.addEventListener("input", function (e) { if (e.target.matches("[aria-invalid]")) clearError(e.target); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name, by = form.elements.by.value;
      var email = form.elements.email, phone = form.elements.whatsapp, bad = null;
      var status = $("[data-j-status]");
      status.textContent = "";
      [name, email, phone].forEach(clearError); // start clean, so a field fixed without typing (autofill, or switching email/WhatsApp) loses its old error
      if (!name.value.trim()) { fieldError(name, "Please tell us your name."); bad = bad || name; }
      if (by === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { fieldError(email, "Please enter an email address we can reply to."); bad = bad || email; }
      if (by === "whatsapp" && phone.value.replace(/\D/g, "").length < 8) { fieldError(phone, "Please enter a WhatsApp number, with the country code."); bad = bad || phone; }
      if (bad) { bad.focus(); return; }

      var it = intent();
      var data = {
        source: "journey",
        intent: it,
        name: name.value.trim(),
        contactBy: by,
        email: by === "email" ? email.value.trim() : "",
        whatsapp: by === "whatsapp" ? phone.value.trim() : "",
        note: form.elements.note.value.trim(),
        newsConsent: it === "updates" || !!form.elements.news.checked,
        answers: JSON.parse(JSON.stringify(A)),
        plan: it === "host" ? "" : $("[data-plan-title]").textContent + " " + $$("[data-plan-list] li").map(function (li) { return li.textContent; }).join(" "),
        utm: utm,
        page: location.href.split("#")[0],
        submittedAt: new Date().toISOString()
      };

      var sp = window.SP || {};
      if (!sp.endpoint) { finish(data, true); return; }
      var submit = $("[data-submit]");
      submit.disabled = true;
      status.textContent = "Sending...";
      sp.send(data).then(function () { finish(data, false); }).catch(function () {
        status.textContent = "We couldn't send this. Please try again in a moment.";
      }).then(function () { submit.disabled = false; });
    });
  }

  function finish(data, preview) {
    var first = data.name.split(/\s+/)[0];
    var by = data.contactBy === "whatsapp" ? "on WhatsApp" : "by email";
    $("[data-thanks-title]").textContent = "Thank you, " + first + ".";
    $("[data-thanks-text]").innerHTML = {
      outreach: "We'll be in touch " + by + " about your plan. Reply time" + tbc(),
      updates: "We'll let you know " + by + " when dates and retreats open.",
      host: "We'll be in touch " + by + " about your practice. Reply time" + tbc()
    }[data.intent];
    $("[data-j-preview]").hidden = !preview;
    state.done = true;
    state.closed = true;
    save();
    track("lead", { intent: data.intent, contactBy: data.contactBy, newsConsent: data.newsConsent, preview: preview });
    form.reset();
    setBy();
    setNote(false);
    go("thanks");
  }

  // ---------- Opening and closing ----------
  var behind = [".skip", ".preview-note", ".site-header", "#main", ".site-footer"];
  function setInert(v) {
    behind.forEach(function (s) {
      var el = document.querySelector(s);
      if (el) { el.inert = v; if (v) el.setAttribute("aria-hidden", "true"); else el.removeAttribute("aria-hidden"); }
    });
  }
  function isOpen() { return root.classList.contains("journey-open"); }

  function open(step, opts) {
    opts = opts || {};
    root.classList.add("journey-open");
    setInert(true);
    Video.init();
    go(step || "intro", { push: opts.push, force: true, arrive: opts.arrive });
    if (opts.replace) history.replaceState({ sj: step || "intro" }, "");
    if ((step || "intro") === "intro" && hint && Sound.on && !Sound.on()) {
      setTimeout(function () { if (current === "intro" && !Sound.on()) hint.classList.add("is-on"); }, 2600);
      setTimeout(function () { hint.classList.remove("is-on"); }, 9000);
    }
    track("open", { via: opts.via || "landing" });
  }

  function close(reason, opts) {
    opts = opts || {};
    state.closed = true;
    save();
    track("exit", { reason: reason, step: current });
    root.classList.remove("journey-open");
    setInert(false);
    Video.toggle(false);
    Embers.toggle(false);
    Sound.stop();
    activeScene = null; // so reopening restarts the video and embers
    if (hint) hint.classList.remove("is-on");
    if (opts.push !== false) { history.pushState({ site: true }, ""); }
    pushes = 0;
    window.scrollTo(0, 0);
    var h = document.getElementById("hero-title");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  function restart() {
    for (var k in A) if (Object.prototype.hasOwnProperty.call(A, k)) delete A[k];
    state.step = "intro";
    state.done = false;
    save();
    track("restart", {});
    go("intro");
  }

  // ---------- Events ----------
  J.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t || !J.contains(t)) return;
    if (t.hasAttribute("data-j-exit")) { close(t.getAttribute("data-j-exit")); return; }
    if (t.hasAttribute("data-answer")) { answer(t); return; }
    if (t.closest("[data-multi]") && t.hasAttribute("aria-pressed")) { toggleMulti(t); return; }
    if (t.hasAttribute("data-j-next")) { if (!busy) advance(); return; }
    if (t.hasAttribute("data-j-goto")) { A.host = true; A.entry = false; save(); go("host"); return; }
    if (t.hasAttribute("data-intent")) { A.intent = t.getAttribute("data-intent"); save(); track("intent", { intent: A.intent }); go("contact"); return; }
    if (t.hasAttribute("data-j-back")) { back(); return; }
    if (t.hasAttribute("data-j-resume")) { go(state.step); return; }
    if (t.hasAttribute("data-j-restart")) { restart(); return; }
    if (t.hasAttribute("data-j-note")) { setNote(true); $("#j-note").focus(); return; }
    if (t.hasAttribute("data-j-bowl")) {
      Sound.bowl();
      t.classList.remove("is-ringing"); void t.offsetWidth; t.classList.add("is-ringing");
      track("bowl", {});
      return;
    }
    if (t.classList.contains("j-sound")) Sound.toggle();
  });

  // Hovering a door on the first screen shows that place behind it
  var cards = $(".j-cards");
  if (cards && canHover) {
    cards.addEventListener("pointerover", function (e) {
      var c = e.target.closest(".j-card");
      if (c && e.pointerType === "mouse") setScene(c.getAttribute("data-scene"));
    });
    cards.addEventListener("pointerleave", function () { if (current === "intro") setScene("fire"); });
  }
  if (cards) {
    cards.addEventListener("focusin", function (e) { var c = e.target.closest(".j-card"); if (c) setScene(c.getAttribute("data-scene")); });
    cards.addEventListener("focusout", function (e) { if (current === "intro" && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".j-card"))) setScene("fire"); });
  }

  // Number keys pick an answer; Escape leaves for the full site
  J.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === "Escape") { close("escape"); return; }
    var n = parseInt(e.key, 10);
    if (!n || !current) return;
    var opts = $$(".j-card, .j-opt, .j-chip, .j-tile", stepEl(current)).filter(function (b) { return b.offsetParent !== null; });
    if (opts[n - 1]) { e.preventDefault(); opts[n - 1].focus(); opts[n - 1].click(); }
  });

  window.addEventListener("popstate", function (e) {
    var s = e.state && e.state.sj;
    if (s) {
      if (pushes > 0) pushes--;
      if (!isOpen()) open(s, { push: false, via: "history" });
      else go(s, { push: false });
    } else if (isOpen()) {
      close("history", { push: false });
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (!isOpen()) return;
    Video.toggle(!document.hidden && activeScene === "fire");
    Embers.toggle(!document.hidden && (activeScene === "fire" || activeScene === "who"));
  });

  // Buttons on the page that start the journey
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-journey-open]");
    if (!a || J.contains(a)) return;
    e.preventDefault();
    open("intro", { via: a.getAttribute("data-journey-open") || "page" });
  });

  // ---------- Start ----------
  // The head script checks for this at DOMContentLoaded; without it, the overlay is removed
  window.SPJourney = { open: function (step) { open(step || "intro", { via: "api" }); }, close: function () { close("api"); } };

  if (isOpen()) {
    var m = location.search.match(/[?&]path=([a-z]+)/);
    var path = m && m[1];
    if (path === "host" || INTERESTS.indexOf(path) > -1) {
      // A campaign link straight into one part of the stay, e.g. ?path=food from a café post
      restartSilently();
      if (path === "host") A.host = true; else { A.need = path; A.entry = true; }
      save();
      open(path, { push: false, replace: true, via: "link:" + path });
    } else {
      open("intro", { push: false, replace: true, arrive: true, via: location.hash === "#journey" ? "link" : "landing" });
    }
  }
  function restartSilently() {
    for (var k in A) if (Object.prototype.hasOwnProperty.call(A, k)) delete A[k];
    state.done = false;
  }
})();
