#!/usr/bin/env node
"use strict";

/* Browser checks for the mountain trips page and the parts of the existing site it touches.

   Run:   npm i --no-save playwright-core     (once; a Chromium must be installed for it)
          node tests/trips.check.cjs

   Optional environment variables:
     CHROMIUM_PATH   path to a Chromium or Chrome binary, if Playwright's own download is not present
     SHOTS_DIR       folder to write full-page screenshots into (desktop and mobile)

   What it does and does not do:
   - It serves site/ from a throwaway local server and drives it in a real browser.
   - Every request that is not to that local server is aborted. Nothing leaves the machine, so no WhatsApp
     message, font download or analytics call can happen. The one place WhatsApp is "reached" is the click
     on the prepared link in the active-number test, and that request is aborted before it goes anywhere.
   - The active-number test uses a made-up number (15551234567). The real business number is not in this repo.
   Exit code is 0 only when every check passes. */

const fs = require("fs");
const path = require("path");
const http = require("http");
const cp = require("child_process");

let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch (e) {
  console.error("playwright-core is not installed. Run: npm i --no-save playwright-core");
  process.exit(2);
}

const SITE = path.resolve(__dirname, "..", "site");
const FAKE_NUMBER = "15551234567"; // not a real number: used only to test the active state
const DESKTOP = { name: "desktop", size: { width: 1280, height: 800 } };
const MOBILE = { name: "mobile", size: { width: 375, height: 812 } };

// ---------------------------------------------------------------- reporting
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok });
  console.log((ok ? "  ok   " : "  FAIL ") + name + (!ok && detail ? "\n         " + String(detail).replace(/\n/g, "\n         ") : ""));
}
function section(title) { console.log("\n" + title); }

// ---------------------------------------------------------------- local static server
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4",
  ".webm": "video/webm", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2"
};
function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(SITE, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(SITE) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// ---------------------------------------------------------------- page helper
let BASE = "";

/* Opens a page in a fresh context.
   Everything outside the local server is aborted and recorded. Options:
   size, config (replaces trips-config.js), endpoint (puts a fake endpoint into main.js), reducedMotion,
   js (false turns JavaScript off), skipJourney (the guided opening stays closed), clipboard, allowBad. */
async function openPage(browser, rel, o = {}) {
  const ctx = await browser.newContext({
    viewport: o.size || DESKTOP.size,
    reducedMotion: o.reducedMotion ? "reduce" : "no-preference",
    javaScriptEnabled: o.js !== false,
    serviceWorkers: "block"
  });
  if (o.clipboard) await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });

  const rec = {
    all: [], external: [], pageErrors: [], consoleErrors: [], warnings: [], localBad: [], popups: [], dialogs: [],
    since(mark) { return rec.all.slice(mark); },
    wa() { return rec.all.filter((r) => !r.url.startsWith(BASE) && /wa\.me|whatsapp/i.test(r.url)); },
    // Anything that could carry answers off the page: not a plain GET, has a query string, or leaves the local server
    outbound(mark) { return rec.all.slice(mark || 0).filter((r) => r.method !== "GET" || r.url.includes("?") || !r.url.startsWith(BASE)); }
  };
  ctx.on("request", (r) => rec.all.push({ method: r.method(), url: r.url() }));
  await ctx.route((u) => !u.href.startsWith(BASE), (route) => { rec.external.push(route.request().url()); route.abort(); });

  if (o.config) {
    await ctx.route("**/assets/js/trips-config.js", (r) =>
      r.fulfill({ status: 200, contentType: "application/javascript", body: "window.SP_TRIPS = " + JSON.stringify(o.config) + ";" }));
  }
  if (o.endpoint) {
    const src = fs.readFileSync(path.join(SITE, "assets/js/main.js"), "utf8");
    const patched = src.replace('var ENQUIRY_ENDPOINT = "";', 'var ENQUIRY_ENDPOINT = ' + JSON.stringify(o.endpoint) + ";");
    if (patched === src) throw new Error("main.js no longer has the ENQUIRY_ENDPOINT line this test patches");
    await ctx.route("**/assets/js/main.js", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: patched }));
  }
  await ctx.addInitScript(() => {
    window.__opens = [];
    window.open = function () { window.__opens.push([].slice.call(arguments)); return null; };
  });
  if (o.skipJourney) {
    await ctx.addInitScript(() => { try { localStorage.setItem("sp-journey", JSON.stringify({ closed: true })); } catch (e) { /* ignore */ } });
  }

  const page = await ctx.newPage();
  page.on("pageerror", (e) => rec.pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning") rec.warnings.push(m.text());
    // Aborted external requests (fonts) report as console errors; local failures are tracked separately below
    if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) rec.consoleErrors.push(m.text());
  });
  page.on("dialog", (d) => { rec.dialogs.push(d.message()); d.dismiss(); });
  page.on("response", (r) => { if (r.url().startsWith(BASE) && r.status() >= 400 && !o.allowBad) rec.localBad.push(r.status() + " " + r.url()); });
  page.on("requestfailed", (r) => { if (r.url().startsWith(BASE) && !o.allowBad) rec.localBad.push("failed " + r.url()); });
  ctx.on("page", (p) => rec.popups.push(p));

  await page.goto(BASE + "/" + rel, { waitUntil: "load" });
  return { ctx, page, rec, close: () => ctx.close() };
}

// ---------------------------------------------------------------- form helpers
function isoDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x) => (x < 10 ? "0" : "") + x;
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

async function fillForm(page, v = {}) {
  const partner = v.path === "partner";
  const d = Object.assign({
    path: "direct", name: "Asha Rao", company: "", party: partner ? "Travel company or agent" : "Friends", guests: "4",
    arrival: isoDays(30), flexible: false, stay: "two-nights", transport: "pickup", activities: [], notes: ""
  }, v);
  await page.check(partner ? "#path-partner" : "#path-direct");
  await page.fill("#t-name", d.name);
  if (partner) await page.fill("#t-company", d.company || "Acme Travel");
  await page.selectOption("#t-party", d.party);
  await page.fill("#t-guests", d.guests);
  await page.fill("#t-arrival", d.arrival);
  await page.setChecked("#t-flex", d.flexible);
  await page.selectOption("#t-stay", d.stay);
  await page.selectOption("#t-transport", d.transport);
  for (const box of await page.locator('input[name="activity"]').all()) await box.setChecked(false);
  for (const a of d.activities) await page.check('input[name="activity"][value="' + a + '"]');
  await page.fill("#t-notes", d.notes);
  return d;
}

const errorCount = (page) => page.locator("#trip-enquiry .field__error").count();
const resultText = (page) => page.locator("#trip-result").innerText();

// ---------------------------------------------------------------- suites
async function suiteLayout(browser, vp) {
  section("Layout and structure: " + vp.name + " (" + vp.size.width + "px)");
  for (const rel of ["trips.html", "index.html"]) {
    const h = await openPage(browser, rel, { size: vp.size, skipJourney: true });
    const label = rel + " @" + vp.name;
    check(label + ": no script errors", h.rec.pageErrors.length === 0, h.rec.pageErrors.join("\n"));
    check(label + ": no console errors", h.rec.consoleErrors.length === 0, h.rec.consoleErrors.join("\n"));
    check(label + ": every local file loads", h.rec.localBad.length === 0, h.rec.localBad.join("\n"));
    const o = await h.page.evaluate(() => {
      const iw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll("body *")]
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > iw + 1 && getComputedStyle(e).position !== "fixed"; })
        .slice(0, 5).map((e) => e.tagName.toLowerCase() + "." + e.className);
      return { sw: document.documentElement.scrollWidth, iw, wide };
    });
    check(label + ": no horizontal scrolling", o.sw <= o.iw, "page is " + o.sw + "px wide in a " + o.iw + "px window; " + o.wide.join(", "));
    if (process.env.SHOTS_DIR) {
      fs.mkdirSync(process.env.SHOTS_DIR, { recursive: true });
      await h.page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-in")));
      await h.page.screenshot({ path: path.join(process.env.SHOTS_DIR, rel.replace(".html", "") + "-" + vp.name + ".png"), fullPage: true });
    }
    await h.close();
  }
}

async function suiteStructure(browser) {
  section("Page structure and accessibility basics (trips.html)");
  const h = await openPage(browser, "trips.html");
  const s = await h.page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((e) => +e.tagName[1]);
    const jumps = levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1);
    const first = document.querySelector("a[href],button,input,select,textarea,[tabindex]");
    const missingTargets = [];
    document.querySelectorAll("[aria-labelledby],[aria-describedby],[aria-controls]").forEach((e) => {
      ["aria-labelledby", "aria-describedby", "aria-controls"].forEach((a) => {
        (e.getAttribute(a) || "").split(/\s+/).filter(Boolean).forEach((id) => { if (!document.getElementById(id)) missingTargets.push(a + "=" + id); });
      });
    });
    const unlabelled = [...document.querySelectorAll("#trip-enquiry input, #trip-enquiry select, #trip-enquiry textarea")]
      .filter((e) => !(e.labels && e.labels.length) && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby")).map((e) => e.id || e.name);
    return {
      lang: document.documentElement.lang, title: document.title, desc: !!document.querySelector('meta[name="description"]'),
      h1: document.querySelectorAll("h1").length, mains: document.querySelectorAll("main").length,
      header: !!document.querySelector("header"), footer: !!document.querySelector("footer"), nav: document.querySelectorAll("nav").length,
      noAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).map((i) => i.src), dupes, jumps, firstIsSkip: !!first && first.classList.contains("skip"),
      missingTargets, unlabelled, legends: document.querySelectorAll("#trip-enquiry fieldset > legend").length, fieldsets: document.querySelectorAll("#trip-enquiry fieldset").length,
      viewport: !!document.querySelector('meta[name="viewport"]')
    };
  });
  check("language, title, description and viewport are set", s.lang && s.title && s.desc && s.viewport, JSON.stringify(s));
  check("exactly one h1 and one main landmark", s.h1 === 1 && s.mains === 1, "h1=" + s.h1 + " main=" + s.mains);
  check("header, footer and navigation landmarks exist", s.header && s.footer && s.nav >= 1);
  check("heading levels never skip", s.jumps.length === 0, s.jumps.join(","));
  check("every image has an alt attribute", s.noAlt.length === 0, s.noAlt.join("\n"));
  check("ids are unique", s.dupes.length === 0, s.dupes.join(","));
  check("aria references point at real elements", s.missingTargets.length === 0, s.missingTargets.join(","));
  check("the skip link is the first focusable element", s.firstIsSkip);
  check("every form control has a label", s.unlabelled.length === 0, s.unlabelled.join(","));
  check("every fieldset has a legend", s.legends === s.fieldsets, s.legends + " legends for " + s.fieldsets + " fieldsets");
  await h.close();
}

function fragmentExists(file, frag) {
  const html = fs.readFileSync(file, "utf8");
  return new RegExp('\\sid="' + frag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"').test(html);
}

async function suiteLinks(browser) {
  section("Links, anchors and navigation between the pages");
  for (const rel of ["trips.html", "index.html"]) {
    const h = await openPage(browser, rel, { skipJourney: true });
    const links = await h.page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.getAttribute("href"), blank: a.target === "_blank", rel: a.rel })));
    const broken = [];
    const unsafe = [];
    let external = 0;
    for (const l of links) {
      if (l.blank && !/noopener/.test(l.rel)) unsafe.push(l.href);
      if (/^(https?:)?\/\//i.test(l.href)) { external++; continue; }
      if (/^(mailto|tel):/i.test(l.href)) continue;
      if (l.href === "#") { broken.push("#"); continue; }
      const [p, frag] = l.href.split("#");
      const target = p.split("?")[0];
      const file = target ? path.join(SITE, path.dirname(rel), target) : path.join(SITE, rel);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { broken.push(l.href); continue; }
      if (frag && !fragmentExists(file, frag)) broken.push(l.href);
    }
    check(rel + ": all " + (links.length - external) + " internal links and anchors resolve", broken.length === 0, broken.join("\n"));
    check(rel + ": links that open a new tab use rel=noopener", unsafe.length === 0, unsafe.join("\n"));
    const wa = links.filter((l) => /wa\.me|whatsapp/i.test(l.href));
    check(rel + ": no WhatsApp link exists before a form is completed", wa.length === 0, wa.map((l) => l.href).join("\n"));
    await h.close();
  }

  // The retreat content that was already on the site is still there
  let before = null;
  try { before = cp.execSync("git show HEAD:site/index.html", { cwd: path.resolve(__dirname, ".."), stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { /* no git history: skip */ }
  const now = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  if (before) {
    const oldIds = [...before.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const lost = oldIds.filter((id) => !new RegExp('\\sid="' + id + '"').test(now));
    check("every id in the committed index.html is still present (" + oldIds.length + " checked)", lost.length === 0, lost.join(","));
  } else {
    console.log("  skip  committed-id comparison (no git history available)");
  }
  for (const id of ["idea", "plan", "programmes", "workshops", "stay", "cafe", "community", "trips", "contact", "enquiry"]) {
    if (!new RegExp('\\sid="' + id + '"').test(now)) check("index.html still has #" + id, false);
  }

  // Nav both ways
  const a = await openPage(browser, "index.html", { skipJourney: true });
  const hdr = a.page.locator('#site-nav a[href="trips.html"]');
  check("index.html header nav links to the trips page", (await hdr.count()) === 1);
  await hdr.click();
  await a.page.waitForURL("**/trips.html");
  check("clicking it opens trips.html", /\/trips\.html$/.test(a.page.url()));
  check("trips.html marks its own nav link as the current page", (await a.page.locator('#site-nav a[aria-current="page"]').getAttribute("href")) === "trips.html");
  await a.page.locator('#site-nav a[href="index.html"]').click();
  await a.page.waitForURL("**/index.html");
  check("the retreat link on trips.html goes back to index.html", /\/index\.html$/.test(a.page.url()));
  await a.page.goto(BASE + "/index.html");
  const foot = a.page.locator('.site-footer a[href="trips.html"]');
  check("index.html footer links to the trips page", (await foot.count()) >= 1);
  const teaser = a.page.locator('#trips a[href="trips.html"]');
  check("index.html teaser section links to the trips page", (await teaser.count()) === 1);
  await a.close();

  const b = await openPage(browser, "trips.html");
  await b.page.locator('#how a[href="index.html#idea"]').click();
  await b.page.waitForURL("**/index.html**");
  check("'Read about the retreat' lands on the retreat idea section", /index\.html#idea$/.test(b.page.url()));
  await b.close();
}

async function suiteMenu(browser) {
  section("Navigation menu: mobile and desktop");
  for (const rel of ["trips.html", "index.html"]) {
    const m = await openPage(browser, rel, { size: MOBILE.size, skipJourney: true });
    const btn = m.page.locator("#menu-btn");
    const nav = m.page.locator("#site-nav");
    check(rel + " @mobile: menu button visible, links hidden to start", (await btn.isVisible()) && !(await nav.isVisible()));
    await btn.click();
    check(rel + " @mobile: button opens the menu and sets aria-expanded", (await btn.getAttribute("aria-expanded")) === "true" && (await nav.isVisible()));
    check(rel + " @mobile: the Mountain trips link is reachable in the open menu", await m.page.locator('#site-nav a[href="trips.html"]').isVisible());
    await m.page.keyboard.press("Escape");
    check(rel + " @mobile: Escape closes the menu and returns focus to the button",
      (await btn.getAttribute("aria-expanded")) === "false" && (await m.page.evaluate(() => document.activeElement && document.activeElement.id)) === "menu-btn");
    if (rel === "trips.html") {
      await btn.click();
      await m.page.locator('#site-nav a[href="#enquire"]').first().click();
      check("trips.html @mobile: choosing a menu link closes the menu", (await btn.getAttribute("aria-expanded")) === "false");
    }
    await m.close();
    const d = await openPage(browser, rel, { size: DESKTOP.size, skipJourney: true });
    check(rel + " @desktop: links show in the bar, no menu button", !(await d.page.locator("#menu-btn").isVisible()) && (await d.page.locator("#site-nav").isVisible()));
    await d.close();
  }
}

async function suiteKeyboard(browser) {
  section("Keyboard use (trips.html)");
  const h = await openPage(browser, "trips.html");
  const p = h.page;
  await p.keyboard.press("Tab");
  check("first Tab lands on the skip link", await p.evaluate(() => document.activeElement.classList.contains("skip")));
  await p.keyboard.press("Enter");
  check("activating the skip link moves to #main", (await p.evaluate(() => location.hash)) === "#main");

  // Tab order through the form reaches every control
  await p.focus("#path-direct");
  const seen = [];
  for (let i = 0; i < 40; i++) {
    seen.push(await p.evaluate(() => { const e = document.activeElement; return e.id || e.name + ":" + e.value; }));
    if (seen[seen.length - 1] === "t-submit") break;
    await p.keyboard.press("Tab");
  }
  const want = ["path-direct", "t-name", "t-party", "t-guests", "t-arrival", "t-flex", "t-stay", "t-transport", "t-notes", "t-submit"];
  check("Tab reaches every field and the button, in reading order", want.every((id, i) => seen.indexOf(id) >= 0 && (i === 0 || seen.indexOf(id) > seen.indexOf(want[i - 1]))), seen.join(" > "));
  check("Tab also reaches all six activity checkboxes", seen.filter((x) => x.startsWith("activity:")).length === 6, seen.join(" > "));

  // The two paths are a radio group: arrow keys switch, and the company field follows
  await p.focus("#path-direct");
  await p.keyboard.press("ArrowRight");
  check("arrow keys move between the two enquiry paths", await p.isChecked("#path-partner"));
  check("the partner path shows the company field", await p.locator("#t-company").isVisible());
  await p.keyboard.press("ArrowLeft");
  check("and the direct path hides it again", (await p.isChecked("#path-direct")) && !(await p.locator("#t-company").isVisible()));

  // Visible focus
  const focusStyle = async (sel) => p.evaluate((s) => {
    const e = document.querySelector(s); const cs = getComputedStyle(e);
    const card = e.closest(".pathcard");
    const ring = (x) => x.outlineStyle !== "none" && parseFloat(x.outlineWidth) > 0;
    return ring(cs) || cs.boxShadow !== "none" || (card ? ring(getComputedStyle(card)) : false);
  }, sel);
  const focusOk = [];
  for (const sel of ["#t-name", "#t-party", "#t-guests", "#t-flex", "#t-submit", "#path-direct", 'input[name="activity"]']) {
    await p.focus("#path-direct"); // reset so focus-visible comes from the keyboard
    await p.keyboard.press("Shift+Tab");
    await p.evaluate((s) => document.querySelector(s).focus(), sel);
    await p.keyboard.press("Shift+Tab");
    await p.keyboard.press("Tab"); // return by keyboard so :focus-visible applies
    const onTarget = await p.evaluate((s) => document.activeElement === document.querySelector(s), sel);
    if (!onTarget || !(await focusStyle(sel))) focusOk.push(sel);
  }
  check("keyboard focus is visibly marked on form controls", focusOk.length === 0, "no visible focus on: " + focusOk.join(", "));

  // Fill and submit with the keyboard only
  await fillForm(p);
  await p.focus("#t-name");
  await p.keyboard.press("Enter");
  check("Enter in a field submits the form", (await resultText(p)).length > 0);
  check("focus moves to the result so it is announced", (await p.evaluate(() => document.activeElement.id)) === "trip-result");
  check("the result region is a polite live region", (await p.getAttribute("#trip-result", "aria-live")) === "polite");
  await h.close();
}

async function suiteInventory(browser) {
  section("What the form collects");
  const h = await openPage(browser, "trips.html");
  const f = await h.page.evaluate(() => {
    const form = document.getElementById("trip-enquiry");
    const names = [...new Set([...form.querySelectorAll("input,select,textarea")].map((e) => e.name))].sort();
    const bad = [...form.querySelectorAll("input,select,textarea")].filter((e) => {
      const label = [...(e.labels || [])].map((l) => l.textContent).join(" ");
      return /birth|dob|passport|aadhaar|aadhar|licen[cs]e|visa|id number|card|cvv|cvc|iban|account|payment|pan\b|ssn/i.test(e.name + " " + e.id + " " + label)
        || /^(cc-|bday|tel|email|password|new-password|current-password)/.test(e.getAttribute("autocomplete") || "")
        || ["password", "file", "tel", "email"].includes(e.type);
    }).map((e) => e.id || e.name);
    return { names, bad, action: form.getAttribute("action"), method: form.getAttribute("method"), novalidate: form.noValidate };
  });
  const expected = ["activity", "arrival", "company", "flexible", "guests", "name", "notes", "party", "path", "stay", "transport"];
  check("fields are exactly: " + expected.join(", "), JSON.stringify(f.names) === JSON.stringify(expected), f.names.join(", "));
  check("no date of birth, ID, payment, phone or email fields", f.bad.length === 0, f.bad.join(", "));
  check("the form has no action and does not post anywhere", !f.action && !f.method, "action=" + f.action + " method=" + f.method);
  await h.close();
}

async function suiteValidation(browser) {
  section("Form validation (inactive config, as shipped)");
  const h = await openPage(browser, "trips.html");
  const p = h.page;
  const mark = h.rec.all.length;

  await p.click("#t-submit");
  check("an empty form shows six errors", (await errorCount(p)) === 6, "got " + (await errorCount(p)));
  check("the first invalid field is focused", (await p.evaluate(() => document.activeElement.id)) === "t-name");
  const linked = await p.evaluate(() => [...document.querySelectorAll("#trip-enquiry [aria-invalid]")]
    .every((e) => { const t = document.getElementById((e.getAttribute("aria-describedby") || "").split(" ").pop()); return t && t.classList.contains("field__error") && t.textContent.length > 8; }));
  check("each invalid field is marked and linked to its message", linked);
  check("nothing is shown as a result while there are errors", (await resultText(p)) === "");
  await p.fill("#t-name", "A");
  check("typing in a field clears just that field's error", (await errorCount(p)) === 5 && (await p.getAttribute("#t-name", "aria-invalid")) === null);

  // Partner path
  await p.check("#path-partner");
  check("partner path: contact-name label changes and the party list changes",
    (await p.locator('label[for="t-name"]').innerText()).includes("contact person") && (await p.locator("#t-party option").allInnerTexts()).includes("Group organiser (club, school, team or company)"));
  check("partner path: a note says partner rates are not published or collected", /partner rates or supplier costs/.test(await p.locator("[data-partner-only]").first().innerText()));
  await fillForm(p, { path: "partner", company: "" });
  await p.fill("#t-company", "");
  await p.click("#t-submit");
  check("partner path: company is required", (await p.locator("#t-company-error").count()) === 1 && (await errorCount(p)) === 1, "errors=" + (await errorCount(p)));
  await p.fill("#t-company", "Acme Travel");
  await p.click("#t-submit");
  check("partner path: passes once a company is given", ((await errorCount(p)) === 0) && (await resultText(p)).length > 0);
  await p.check("#path-direct");
  check("switching back to direct removes the company field and any error", !(await p.locator("#t-company").isVisible()) && (await p.locator("#t-company-error").count()) === 0);

  // Guests
  const guests = async (v) => { await fillForm(p, { guests: "4" }); await p.evaluate((x) => { document.getElementById("t-guests").value = x; }, v); await p.click("#t-submit"); return (await p.locator("#t-guests-error").count()) === 1; };
  for (const bad of ["0", "-3", "501", "2.5", "1e2", ""]) check("guests " + JSON.stringify(bad) + " is rejected", await guests(bad));
  for (const ok of ["1", "12", "500"]) check("guests " + ok + " is accepted", !(await guests(ok)));

  // Dates
  await fillForm(p, { arrival: "2020-01-01" });
  await p.click("#t-submit");
  check("a past arrival date is rejected", (await p.locator("#t-arrival-error").count()) === 1);
  await fillForm(p, { arrival: "" });
  await p.click("#t-submit");
  check("no date and not flexible is rejected", (await p.locator("#t-arrival-error").count()) === 1);
  await p.check("#t-flex");
  await p.click("#t-submit");
  check("no date but flexible is accepted", (await errorCount(p)) === 0);
  await fillForm(p, { arrival: isoDays(0) });
  await p.click("#t-submit");
  check("today is accepted", (await errorCount(p)) === 0);
  check("the date picker's minimum is today", (await p.getAttribute("#t-arrival", "min")) === isoDays(0));

  // Notes
  const noteBlocked = async (text) => { await fillForm(p, { notes: text }); await p.click("#t-submit"); return (await p.locator("#t-notes-error").count()) === 1; };
  for (const t of ["My passport number is X1234567", "date of birth 4 May 1990", "card 4111 1111 1111 1111", "4111-1111-1111-1111", "Aadhaar 1234 5678 9012", "CVV is on the back"]) {
    check("notes with sensitive details are blocked: " + JSON.stringify(t), await noteBlocked(t));
  }
  check("ordinary notes with some digits are accepted", !(await noteBlocked("Vegetarian meals please. Two rooms near each other. Arriving around 12:30, 3 adults 1 child.")));
  await p.fill("#t-notes", "x".repeat(700));
  check("notes are limited to 600 characters", (await p.inputValue("#t-notes")).length === 600);

  const reqs = h.rec.since(mark);
  check("validating produced no network requests at all", reqs.length === 0, reqs.map((r) => r.method + " " + r.url).join("\n"));
  await h.close();
}

async function suiteInactive(browser) {
  section("Inactive configuration: the shipped state, no business number");
  const cfg = fs.readFileSync(path.join(SITE, "assets/js/trips-config.js"), "utf8");
  const h = await openPage(browser, "trips.html");
  const p = h.page;
  check("trips-config.js ships with an empty number", (await p.evaluate(() => window.SP_TRIPS && window.SP_TRIPS.whatsappNumber)) === "", cfg.slice(0, 300));
  check("trips-config.js ships with no media entries", await p.evaluate(() => Object.values(window.SP_TRIPS.media).every((a) => Array.isArray(a) && a.length === 0)));
  check("the state pill says enquiries are not open yet",
    (await p.innerText("#trip-state")) === "Enquiries by WhatsApp: not open yet" && (await p.getAttribute("#trip-state", "data-state")) === "inactive");
  check("the submit button says 'Check my answers'", (await p.innerText("#t-submit")) === "Check my answers");
  check("the page explains why enquiries are unavailable", /business WhatsApp number has not been set/.test(await p.locator("#trip-now").innerText()));

  const mark = h.rec.all.length;
  const urlBefore = p.url();
  const d = await fillForm(p, { activities: ["Sunset viewpoints", "Temple visit"], notes: "Quiet room if possible." });
  await p.click("#t-submit");
  const text = await resultText(p);
  check("a complete form says nothing has been sent", /Nothing has been sent/.test(text), text);
  check("it says the number is not set and nobody has received anything", /not been set/.test(text) && /team has received nothing/.test(text), text);
  check("no WhatsApp link or button is created", (await p.locator('#trip-result a, #trip-result button, a[href*="wa.me"], a[href*="whatsapp"]').count()) === 0);
  check("the preview message is available but folded away", (await p.locator("#trip-result details pre.msg").count()) === 1 && !(await p.locator("#trip-result details pre.msg").isVisible()));
  const msg = await p.locator("#trip-result pre.msg").textContent();
  check("the preview message matches the answers", msg.includes("Name: " + d.name) && msg.includes("Number of guests: 4") && msg.includes("Sunset viewpoints, Temple visit") && msg.includes("Notes: Quiet room if possible."), msg);
  const reqs = h.rec.since(mark);
  check("the submit made zero network requests", reqs.length === 0, reqs.map((r) => r.method + " " + r.url).join("\n"));
  check("it opened no window and no tab", (await p.evaluate(() => window.__opens.length)) === 0 && h.rec.popups.length === 0);
  check("the address did not change (no answers in the URL)", p.url() === urlBefore);
  check("nothing is stored in the browser", await p.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ""));
  const page = await p.evaluate(() => document.body.innerText);
  check("no page text claims an enquiry was sent or received",
    !/\b(enquir(y|ies)|messages?|answers?|requests?) (has|have|was|were) (been )?(sent|received|submitted)\b/i.test(page.replace(/\b(not|nothing|never|until)\b[^.]*\./gi, "")), "");
  check("no page text promises a reply time or an outcome", !/\b(within|in) \d+\s?(hours?|days?|minutes?)\b|\bwe will (reply|respond|get back|call)\b|\bbooking confirmed\b/i.test(page));
  check("no script errors during all of the above", h.rec.pageErrors.length === 0, h.rec.pageErrors.join("\n"));
  await h.close();

  // The number cannot be supplied from the address bar
  for (const q of ["?number=" + FAKE_NUMBER, "?whatsapp=" + FAKE_NUMBER, "?wa=" + FAKE_NUMBER, "?whatsappNumber=" + FAKE_NUMBER, "?stay=two-nights&number=" + FAKE_NUMBER + "#enquire"]) {
    const u = await openPage(browser, "trips.html" + q);
    await fillForm(u.page);
    await u.page.click("#t-submit");
    const closed = /Nothing has been sent/.test(await resultText(u.page)) && (await u.page.locator('a[href*="wa.me"]').count()) === 0 && u.rec.wa().length === 0;
    check("the number cannot be set from the URL: " + q, closed && (await u.page.innerText("#trip-state")).includes("not open yet"));
    await u.close();
  }

  // Wrong formats count as not set
  for (const bad of ["abc", "+91 98765 43210", "+919876543210", "123", "0919876543210", "9198765432101234567", " ", 919876543210, null, true]) {
    const u = await openPage(browser, "trips.html", { config: { whatsappNumber: bad, media: {} } });
    const inactive = (await u.page.innerText("#trip-state")).includes("not open yet");
    await fillForm(u.page);
    await u.page.click("#t-submit");
    const noLink = (await u.page.locator('a[href*="wa.me"]').count()) === 0 && u.rec.wa().length === 0;
    const warned = typeof bad !== "string" || !bad.trim() || u.rec.warnings.some((w) => /whatsappNumber/.test(w));
    check("a badly formatted number stays inactive: " + JSON.stringify(bad), inactive && noLink && warned, "inactive=" + inactive + " noLink=" + noLink + " warned=" + warned);
    await u.close();
  }

  // A missing or broken config file must not break the page
  const m = await openPage(browser, "trips.html", { allowBad: true });
  await m.close();
  const broken = await browser.newContext({ viewport: DESKTOP.size });
  await broken.route((u) => !u.href.startsWith(BASE), (r) => r.abort());
  await broken.route("**/assets/js/trips-config.js", (r) => r.fulfill({ status: 404, body: "" }));
  const bp = await broken.newPage();
  const berr = [];
  bp.on("pageerror", (e) => berr.push(e.message));
  await bp.goto(BASE + "/trips.html");
  await fillForm(bp);
  await bp.click("#t-submit");
  check("if trips-config.js is missing the form still works and stays inactive", berr.length === 0 && /Nothing has been sent/.test(await resultText(bp)), berr.join("\n"));
  await broken.close();

  // No JavaScript
  const nj = await openPage(browser, "trips.html", { js: false });
  check("with JavaScript off the form controls are hidden", !(await nj.page.locator("#t-name").isVisible()) && !(await nj.page.locator("#t-submit").isVisible()));
  check("with JavaScript off the page explains that the form needs JavaScript", /needs JavaScript/.test(await nj.page.locator("#trip-enquiry").innerText()));
  check("with JavaScript off nothing can be submitted, so no answers can reach the URL", (await nj.page.locator("#trip-enquiry button[type=submit]:visible").count()) === 0);
  const ow = await nj.page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  check("with JavaScript off the page still lays out without side-scrolling", ow);
  check("with JavaScript off the content is readable (no hidden reveals)", await nj.page.evaluate(() => [...document.querySelectorAll(".reveal")].every((e) => getComputedStyle(e).opacity === "1")));
  await nj.close();
}

async function suiteActive(browser) {
  section("Active configuration: a made-up number, network blocked");
  const config = { whatsappNumber: FAKE_NUMBER, media: {} };
  const h = await openPage(browser, "trips.html", { config, clipboard: true });
  const p = h.page;
  check("the state pill says enquiries are open", (await p.innerText("#trip-state")) === "Enquiries by WhatsApp: open" && (await p.getAttribute("#trip-state", "data-state")) === "active");
  check("the submit button changes to 'Prepare my WhatsApp message'", (await p.innerText("#t-submit")) === "Prepare my WhatsApp message");
  check("the 'Right now' line no longer says the number is unset", !/has not been set/.test(await p.locator("#trip-now").innerText()));
  check("nothing contacts WhatsApp just because a number is configured", h.rec.wa().length === 0 && h.rec.popups.length === 0 && (await p.evaluate(() => window.__opens.length)) === 0);
  check("no WhatsApp link exists before the form is completed", (await p.locator('a[href*="wa.me"]').count()) === 0);

  await p.click("#t-submit");
  check("an invalid form produces no link", (await p.locator('a[href*="wa.me"]').count()) === 0 && (await errorCount(p)) === 6);

  const mark = h.rec.all.length;
  const d = await fillForm(p, { name: "Zoë & Co #1 ?x=1", activities: ["Paragliding (optional)", "Local walks"], notes: "Line one\nLine two & more, 100% sure.\n<b>not bold</b>" });
  await p.click("#t-submit");
  const text = await resultText(p);
  check("the result says the message is ready and has not been sent", /ready to review\. It has not been sent/.test(text), text);
  const link = p.locator('#trip-result a[href*="wa.me"]');
  check("exactly one WhatsApp link is shown", (await link.count()) === 1);
  const href = await link.getAttribute("href");
  const msg = await p.locator("#trip-result pre.msg").textContent();
  check("the link goes to wa.me with the configured number only", href.startsWith("https://wa.me/" + FAKE_NUMBER + "?text="), href);
  check("the link text is exactly the message shown for review", new URL(href).searchParams.get("text") === msg, msg);
  check("special characters, newlines and percent signs survive", msg.includes("Name: Zoë & Co #1 ?x=1") && msg.includes("Line one\nLine two & more, 100% sure."), msg);
  check("HTML in answers is shown as text, not run", (await p.locator("#trip-result b").count()) === 0 && msg.includes("<b>not bold</b>"));
  check("the link opens in a new tab safely", (await link.getAttribute("target")) === "_blank" && /noopener/.test(await link.getAttribute("rel")));
  check("the message carries every answer", ["Number of guests: 4", "Party type: Friends", "Preferred stay: Two nights", "Transport: Pickup at the valley entrance (proposed main arrangement)", "Paragliding (optional), Local walks"].every((s) => msg.includes(s)), msg);
  check("the direct message has no company line", !/Company/.test(msg) && msg.includes("a customer planning a trip"));
  check("the message says it is an enquiry only and nothing is booked or paid until confirmed", /enquiry only\. Please confirm availability, the itinerary, what is included and the price before anything is booked or paid\.$/.test(msg));
  check("the message contains no date of birth, ID or payment prompts", !/birth|passport|aadhaar|card|payment details/i.test(msg.replace(/before anything is booked or paid/, "")));
  check("preparing the message made zero requests, opened nothing", h.rec.since(mark).length === 0 && h.rec.wa().length === 0 && (await p.evaluate(() => window.__opens.length)) === 0 && h.rec.popups.length === 0);
  check("the page address still holds no answers", !p.url().includes("Zo") && !p.url().includes("?"));

  // Copy
  await p.locator("#trip-result button", { hasText: "Copy" }).click();
  await p.waitForFunction(() => /copied/i.test(document.querySelector("#trip-result .hint").textContent));
  check("Copy puts the exact message on the clipboard", (await p.evaluate(() => navigator.clipboard.readText())) === msg);
  check("after copying the page still says it has not been sent", /not been sent/.test(await p.locator("#trip-result .hint").innerText()));

  // The click is the visitor's act. The request is recorded then aborted, so nothing leaves the machine.
  const popup = p.waitForEvent("popup");
  await link.click();
  const pop = await popup;
  await pop.waitForLoadState("domcontentloaded").catch(() => {});
  check("only after the click does a request to wa.me go out (and it was blocked here)", h.rec.wa().length >= 1 && h.rec.wa().every((r) => r.url === href), h.rec.wa().map((r) => r.url).join("\n"));
  check("after the click the page says the enquiry has not been sent until send is pressed in WhatsApp", /has not been sent until you press send there/.test(await p.locator("#trip-result .hint").innerText()));
  await pop.close();

  // Stale results
  await p.fill("#t-name", "Someone else");
  check("editing any field removes the old message and link", (await p.locator("#trip-result a").count()) === 0 && (await resultText(p)) === "");
  await p.click("#t-submit");
  await p.check('input[name="activity"][value="Temple visit"]');
  check("ticking an activity also removes it", (await resultText(p)) === "");

  // Partner
  await fillForm(p, { path: "partner", company: "Acme & Sons Travel", party: "Group organiser (club, school, team or company)", flexible: true, arrival: "", stay: "unsure", transport: "delhi" });
  await p.click("#t-submit");
  const pm = await p.locator("#trip-result pre.msg").textContent();
  check("partner message names the company and the group", pm.includes("Company or organiser: Acme & Sons Travel") && pm.includes("a travel company or group organiser") && pm.includes("Group organiser"), pm);
  check("flexible dates and 'not sure' read correctly", pm.includes("Preferred arrival: Flexible dates") && pm.includes("Preferred stay: Not sure yet") && pm.includes("Activities I am interested in: None selected"), pm);
  check("Delhi transport is worded as an enquiry", pm.includes("Transport: Transport from Delhi (enquiry only)"), pm);
  check("the partner message asks for no rates and states none", !/rate|cost|commission|price:/i.test(pm.replace("and the price before", "")), pm);

  // Injection attempt in a field
  await fillForm(p, { name: "<img src=x onerror=window.__x=1>" });
  await p.click("#t-submit");
  check("a script-like name is shown as text and runs nothing", (await p.locator("#trip-result img").count()) === 0 && (await p.evaluate(() => window.__x)) === undefined && h.rec.dialogs.length === 0);
  check("no script errors", h.rec.pageErrors.length === 0, h.rec.pageErrors.join("\n"));
  await h.close();

  // Without a clipboard the page says so rather than claiming success
  const nc = await openPage(browser, "trips.html", { config });
  await nc.page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }));
  await fillForm(nc.page);
  await nc.page.click("#t-submit");
  await nc.page.locator("#trip-result button", { hasText: "Copy" }).click();
  check("if copying is not possible, the page says so instead of claiming success", /Could not copy/.test(await nc.page.locator("#trip-result .hint").innerText()));
  await nc.close();
}

async function suiteMedia(browser) {
  section("Media sections");
  const h = await openPage(browser, "trips.html");
  const groups = await h.page.evaluate(() => [...document.querySelectorAll("[data-media]")].map((g) => ({ key: g.getAttribute("data-media"), slots: g.querySelectorAll(".slot").length, figs: g.querySelectorAll("figure.shot").length, slotText: (g.querySelector(".slot") || {}).textContent })));
  check("all five groups exist: destination, properties, rooms, meals, activities", JSON.stringify(groups.map((g) => g.key)) === JSON.stringify(["destination", "properties", "rooms", "meals", "activities"]), JSON.stringify(groups));
  check("as shipped each group shows one empty placeholder and no pictures", groups.every((g) => g.slots === 1 && g.figs === 0));
  check("the placeholders say the media is not available yet", groups.every((g) => /^No photos or video of .+ yet\.$/i.test((g.slotText || "").trim())), groups.map((g) => g.slotText).join(" | "));
  check("the page hero photo is labelled as a placeholder, not the destination", /Placeholder photo/i.test(await h.page.locator(".hero__credit").innerText()) && /placeholder/i.test(await h.page.getAttribute(".hero__img", "alt")));
  await h.close();

  const img = "assets/video/fire-dusk-wide.jpg";
  const config = {
    whatsappNumber: "",
    media: {
      destination: [
        { type: "image", src: img, width: 1600, height: 900, alt: "A placeholder view", caption: "Stock image for layout only", preview: true },
        { type: "image", src: img, alt: "" },
        { type: "image", src: "javascript:window.__x=1" },
        { type: "image", src: "data:image/png;base64,AAAA", alt: "Embedded" },
        { type: "image", alt: "No source" }
      ],
      properties: [{ type: "image", src: img, alt: "A real photo of a vendor property", caption: "Supplied by the vendor", preview: false }],
      rooms: [{ type: "video", src: "assets/video/none.mp4", poster: img, alt: "A short room tour", preview: true }],
      meals: [{ type: "image", src: "javascript:alert(1)", alt: "Bad" }],
      activities: "not an array"
    }
  };
  const m = await openPage(browser, "trips.html", { config, allowBad: true });
  const out = await m.page.evaluate(() => {
    const g = (k) => document.querySelector('[data-media="' + k + '"]');
    return {
      destFigs: g("destination").querySelectorAll("figure.shot").length,
      destBadge: (g("destination").querySelector(".badge") || {}).textContent,
      destAlt: (g("destination").querySelector("img") || {}).alt,
      destCap: (g("destination").querySelector("figcaption") || {}).textContent,
      propBadges: g("properties").querySelectorAll(".badge").length, propFigs: g("properties").querySelectorAll("figure.shot").length,
      video: (() => { const v = g("rooms").querySelector("video"); return v && { controls: v.controls, preload: v.preload, label: v.getAttribute("aria-label"), badge: !!g("rooms").querySelector(".badge") }; })(),
      mealsSlots: g("meals").querySelectorAll(".slot").length, actSlots: g("activities").querySelectorAll(".slot").length, x: window.__x
    };
  });
  check("a preview image gets the 'Preview media, not the actual place' badge", out.destBadge === "Preview media, not the actual place", JSON.stringify(out));
  check("entries with no alt text, no source, or a javascript:/data: source are skipped", out.destFigs === 1 && out.destAlt === "A placeholder view" && out.x === undefined, JSON.stringify(out));
  check("captions are shown", out.destCap === "Stock image for layout only");
  check("a non-preview image has no badge", out.propFigs === 1 && out.propBadges === 0);
  check("a video gets controls, a label, preload=none and the preview badge", out.video && out.video.controls && out.video.preload === "none" && out.video.label === "A short room tour" && out.video.badge, JSON.stringify(out.video));
  check("groups with only unusable entries keep their placeholder", out.mealsSlots === 1 && out.actSlots === 1);
  check("no script errors with a media config", m.rec.pageErrors.length === 0 && m.rec.dialogs.length === 0, m.rec.pageErrors.join("\n"));
  for (const vp of [MOBILE, DESKTOP]) {
    await m.page.setViewportSize(vp.size);
    check("media grid does not overflow at " + vp.name + " width", await m.page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  }
  await m.close();
}

async function suitePrefill(browser) {
  section("Stay prefill from the stay cards");
  const h = await openPage(browser, "trips.html");
  const hrefs = await h.page.evaluate(() => ({
    one: (document.querySelector("#stay-one-night a.btn") || {}).getAttribute && document.querySelector("#stay-one-night a.btn").getAttribute("href"),
    two: (document.querySelector("#stay-two-nights a.btn") || {}).getAttribute && document.querySelector("#stay-two-nights a.btn").getAttribute("href")
  }));
  check("the two stay cards link to the form with their option chosen", hrefs.one === "?stay=one-night#enquire" && hrefs.two === "?stay=two-nights#enquire", JSON.stringify(hrefs));
  await h.page.locator("#stay-two-nights a.btn").click();
  await h.page.waitForURL("**?stay=two-nights#enquire");
  check("following the two-night link pre-selects 'Two nights'", (await h.page.inputValue("#t-stay")) === "two-nights");
  await h.page.goto(BASE + "/trips.html?stay=one-night#enquire");
  check("the one-night link pre-selects 'One night'", (await h.page.inputValue("#t-stay")) === "one-night");
  await h.close();
  for (const v of ["bogus", "unsure", "<script>alert(1)</script>", "__proto__", "constructor", "one-night%00", "TWO-NIGHTS"]) {
    const u = await openPage(browser, "trips.html?stay=" + encodeURIComponent(v));
    check("an unknown ?stay= value is ignored: " + v, (await u.page.inputValue("#t-stay")) === "" && u.rec.pageErrors.length === 0 && u.rec.dialogs.length === 0);
    await u.close();
  }
}

async function suiteMotion(browser) {
  section("Reduced motion and scrolling reveals");
  const r = await openPage(browser, "trips.html", { reducedMotion: true });
  const ok = await r.page.evaluate(() => [...document.querySelectorAll(".reveal")].every((e) => e.classList.contains("is-in") && getComputedStyle(e).opacity === "1"));
  check("with reduced motion every section is visible straight away", ok);
  await r.close();
  const n = await openPage(browser, "trips.html");
  // The page uses smooth scrolling, so jump instantly or the steps are still animating when the check runs
  await n.page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 30)); }
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
  });
  await n.page.waitForTimeout(900);
  check("with motion allowed, scrolling through reveals every section", await n.page.evaluate(() => [...document.querySelectorAll(".reveal")].every((e) => e.classList.contains("is-in"))));
  await n.close();
}

async function suiteOldForms(browser) {
  section("Existing retreat forms: honestly labelled as previews");
  const h = await openPage(browser, "index.html", { skipJourney: true });
  const p = h.page;
  const mark = h.rec.all.length;
  check("the #enquiry form shows an 'Inactive preview' notice", await p.locator("#enquiry [data-inactive-preview], #contact [data-inactive-preview]").first().isVisible());
  check("the notice points to the trip enquiry form", (await p.locator('[data-inactive-preview] a[href="trips.html#enquire"]').count()) === 1);
  check("the send button is labelled as a preview", (await p.innerText("#enquiry button[type=submit]")) === "Check my enquiry (preview)");
  await p.click("#enquiry button[type=submit]");
  check("an empty #enquiry form shows two errors", (await p.locator("#enquiry .field__error").count()) === 2);
  await p.fill("#f-name", "Asha");
  await p.fill("#f-email", "asha@example.com");
  await p.click("#enquiry button[type=submit]");
  const status = await p.innerText("#form-status");
  check("a valid submit says nothing was sent and nobody has received it", /nothing was sent and nobody has received your answers/.test(status), status);
  check("it did not say 'thank you, we have your enquiry'", !/we have your enquiry|will write back/i.test(status));
  check("the preview submit sent nothing anywhere (no POST, no query string, no outside host)", h.rec.outbound(mark).length === 0, h.rec.outbound(mark).map((r) => r.method + " " + r.url).join("\n"));
  await h.close();

  // When an endpoint is connected the preview wording must disappear and a failed send must be reported as failed
  const e = await openPage(browser, "index.html", { skipJourney: true, endpoint: "https://inbox.example.test/enquiries" });
  check("with an endpoint set, the preview notices are hidden", !(await e.page.locator("#enquiry [data-inactive-preview]").first().isVisible()));
  check("with an endpoint set, the button keeps its normal label", (await e.page.innerText("#enquiry button[type=submit]")) !== "Check my enquiry (preview)");
  await e.page.fill("#f-name", "Asha");
  await e.page.fill("#f-email", "asha@example.com");
  await e.page.click("#enquiry button[type=submit]");
  await e.page.waitForFunction(() => /could not send|Thank you/i.test(document.getElementById("form-status").textContent));
  check("a send that fails is reported as failed, not as success", /could not send/i.test(await e.page.innerText("#form-status")) && e.rec.external.some((u) => u.startsWith("https://inbox.example.test")));
  await e.close();
}

async function suiteJourney(browser) {
  section("Guided opening on index.html");
  const h = await openPage(browser, "index.html");
  const p = h.page;
  check("a first visit opens the guided journey", await p.locator("#journey").isVisible());
  const link = p.locator('#journey a.j-link[href="trips.html"]');
  check("its first screen offers the mountain trip route", (await link.count()) === 1 && (await link.isVisible()));
  check("the offer is reachable by keyboard", await p.evaluate(() => { const a = document.querySelector('#journey a.j-link[href="trips.html"]'); a.focus(); return document.activeElement === a; }));
  await h.close();

  const j = await openPage(browser, "index.html");
  await j.page.locator('#journey [data-j-goto="host"]').click();
  await j.page.locator('#journey [data-answer="bring"][data-value="sound"]').click();
  await j.page.waitForSelector("#j-name", { state: "visible" });
  check("the journey's contact step shows the inactive-preview notice", await j.page.locator("#j-q-contact ~ form [data-inactive-preview], #journey [data-step=contact] [data-inactive-preview]").first().isVisible());
  check("and its button says (preview)", /\(preview\)/.test(await j.page.innerText("#journey [data-submit]")));
  const mark = j.rec.all.length;
  await j.page.fill("#j-name", "Asha Rao");
  await j.page.fill("#j-email", "asha@example.com");
  await j.page.click("#journey [data-submit]");
  await j.page.waitForSelector("[data-thanks-title]", { state: "visible" });
  const title = await j.page.innerText("[data-thanks-title]");
  const body = await j.page.innerText("[data-thanks-text]");
  check("the final screen says nothing was sent", /Nothing was sent/.test(title) && /nobody has received them and nobody will be in touch/.test(body), title + " / " + body);
  check("it promises no reply", !/we'll be in touch|we will be in touch|reply time/i.test(body));
  check("the journey submit sent nothing anywhere (no POST, no query string, no outside host)", j.rec.outbound(mark).length === 0, j.rec.outbound(mark).map((r) => r.method + " " + r.url).join("\n"));
  check("no script errors in the journey", j.rec.pageErrors.length === 0, j.rec.pageErrors.join("\n"));
  await j.close();

  const k = await openPage(browser, "index.html");
  await k.page.locator('#journey a.j-link[href="trips.html"]').click();
  await k.page.waitForURL("**/trips.html");
  check("choosing the mountain trip route opens the trips page", /\/trips\.html$/.test(k.page.url()));
  await k.close();
}

async function suiteContent(browser) {
  section("Content rules (what the pages must not claim)");
  const h = await openPage(browser, "trips.html");
  const t = await h.page.evaluate(() => document.title + "\n" + document.querySelector('meta[name="description"]').content + "\n" + document.body.textContent.replace(/\s+/g, " "));
  const tbc = await h.page.locator(".tbc").count();
  const guesses = [
    ["the pickup place is not named (generic wording only)", /\bAut\b/],
    ["no other business's name or details", /nomichi/i],
    ["no prices, amounts or currencies", /[₹$€£]\s?\d|\b(INR|Rs\.?|USD|EUR)\s?\d|\b\d[\d,]*\s?(rupees|dollars|euros)\b|\bper (person|night|head)\b/i],
    ["no percentages or discounts", /\d\s?%|\bdiscount|\bcommission\b|\bmargin\b/i],
    ["no durations, flight times or clock times", /\b\d+\s?(hours?|hrs?|minutes?|mins?|days?)\b|\b\d{1,2}[:.]\d{2}\s?(am|pm)?\b/i],
    ["no safety certificates or insurance claims", /\b(certified|licensed|accredited|insured|DGCA|ISO[- ]?\d|award[- ]winning)\b/i],
    ["no ownership of rooms or property", /\bour (own )?(hotel|propert|rooms?|lodge|cottages?|resort|camp|guesthouse)/i],
    ["no cancellation or refund terms", /\brefund|\bfree cancell|\bcancellation (is|are|policy:)/i],
    ["no street address, pin code or phone number", /\b\d{6}\b|\+\d[\d\s-]{8,}|\b\d{10}\b/],
    ["no capacity numbers", /\b(sleeps|accommodates|up to \d+|\d+ (beds|rooms|guests max))\b/i],
    ["no invented departure dates", /\b(depart(s|ure)? on|leaves on|next departure)\b/i]
  ];
  for (const [what, re] of guesses) {
    const m = t.match(re);
    check("page text: " + what, !m, m && '"' + m[0] + '" in …' + t.slice(Math.max(0, m.index - 60), m.index + 60) + "…");
  }
  const sentences = t.split(/(?<=[.!?])\s+/);
  const guar = sentences.filter((s) => /guarantee/i.test(s) && !/\b(no|not|nor|never|cannot|can't|cannot|without|n't)\b/i.test(s));
  check("'guarantee' only ever appears in a negative sentence", guar.length === 0, guar.join("\n"));
  const safe = sentences.filter((s) => /\b(safe|safety|safely)\b/i.test(s) && !/\b(no|not|nor|never|nothing|cannot|can't|without|n't|until|before|ask|confirm|discuss|check|TBC|risk)\b/i.test(s));
  check("safety is never promised", safe.length === 0, safe.join("\n"));
  check("it says these are vendor-backed trips and not the permanent retreat", /vendor/i.test(t) && /permanent retreat|retreat is (a )?different|separate/i.test(t));
  check("it says enquiring books and charges nothing", /nothing is booked or paid|before (anything is )?(booked|paid)|no payment/i.test(t));
  check("it says the team will confirm availability, itinerary, included services and price", /availability/i.test(t) && /itinerary/i.test(t) && /included/i.test(t) && /price/i.test(t));
  check("both optional and separate-discussion activities are named", /paragliding/i.test(t) && /trekking/i.test(t) && /camping/i.test(t) && /temple/i.test(t) && /sunset/i.test(t));
  check("transport: valley-entrance pickup is proposed and Delhi is an enquiry", /valley entrance/i.test(t) && /Delhi/.test(t) && /not (yet )?(part of|in|included in)|not confirmed|TBC|until the founder|before .*confirm/i.test(t));
  check("undecided items are marked TBC (" + tbc + " chips)", tbc >= 8);
  check("partner rates and supplier costs are not published", /do not publish partner rates or supplier costs/i.test(t));
  const heroCredit = await h.page.locator(".hero__credit").innerText();
  check("the stock hero photo is credited and labelled as not the destination", /placeholder/i.test(heroCredit) && /not the destination/i.test(heroCredit), heroCredit);
  await h.close();

  const i = await openPage(browser, "index.html", { skipJourney: true });
  const teaser = await i.page.locator("#trips").textContent();
  check("index teaser: no place names, prices or ownership claims", !/\bAut\b|nomichi|[₹$€£]\s?\d|\bour (own )?(hotel|propert|rooms?|lodge)/i.test(teaser), teaser.replace(/\s+/g, " ").slice(0, 300));
  check("index teaser: says the retreat is a different project", /different project|separate/i.test(teaser));
  await i.close();
}

// ---------------------------------------------------------------- main
(async () => {
  const server = await startServer();
  BASE = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  console.log("Serving " + SITE + " at " + BASE + "; every other host is blocked.");
  const suites = [
    () => suiteLayout(browser, DESKTOP), () => suiteLayout(browser, MOBILE), suiteStructure, suiteLinks, suiteMenu, suiteKeyboard,
    suiteInventory, suiteValidation, suiteInactive, suiteActive, suiteMedia, suitePrefill, suiteMotion, suiteOldForms, suiteJourney, suiteContent
  ];
  for (const s of suites) {
    try { await (s.length ? s(browser) : s()); } catch (e) { check("suite crashed: " + (s.name || "layout"), false, e.stack || e); }
  }
  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok);
  console.log("\n" + (results.length - failed.length) + " of " + results.length + " checks passed" + (failed.length ? ", " + failed.length + " failed:" : "."));
  failed.forEach((f) => console.log("  - " + f.name));
  process.exit(failed.length ? 1 : 0);
})();
