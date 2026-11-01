(function () {
  "use strict";

  /* Mountain trips page.
     - Fills the media sections from trips-config.js.
     - Validates the trips enquiry form and writes a WhatsApp message for the visitor to review.
     Nothing here uses the network: no fetch, no XHR, no beacons. The only way WhatsApp is ever
     reached is the visitor pressing the "Open WhatsApp" link, which only exists once a valid
     business number has been configured and the visitor has checked their answers. */

  var CFG = window.SP_TRIPS || {};

  // ----- Business number: digits only, country code first, 8 to 15 digits. Anything else counts as not set.
  function businessNumber() {
    var n = typeof CFG.whatsappNumber === "string" ? CFG.whatsappNumber.trim() : "";
    if (!n) return "";
    if (!/^[1-9]\d{7,14}$/.test(n)) {
      if (window.console) console.warn("trips-config.js: whatsappNumber must be digits only with the country code (for example 919876543210). Enquiries stay closed.");
      return "";
    }
    return n;
  }
  var NUMBER = businessNumber();

  // ----- Media sections -----
  var PREVIEW_BADGE = "Preview media, not the actual place";

  function safeSrc(src) {
    if (typeof src !== "string" || !src.trim()) return "";
    try {
      var u = new URL(src, location.href);
      return u.protocol === "http:" || u.protocol === "https:" ? src : "";
    } catch (e) { return ""; }
  }

  function mediaFigure(item) {
    var src = safeSrc(item && item.src);
    if (!src) return null;
    var isVideo = item.type === "video";
    // A photo or video must say what it shows; skip entries that do not, rather than publish them unlabelled
    if (!item.alt || !String(item.alt).trim()) {
      if (window.console) console.warn("trips-config.js: media entry skipped because it has no alt text:", item.src);
      return null;
    }
    var fig = document.createElement("figure");
    fig.className = "shot";
    var box = document.createElement("div");
    box.className = "shot__media";
    var el;
    if (isVideo) {
      el = document.createElement("video");
      el.controls = true;
      el.preload = "none";
      el.setAttribute("playsinline", "");
      el.setAttribute("aria-label", String(item.alt));
      var poster = safeSrc(item.poster);
      if (poster) el.poster = poster;
      el.src = src;
    } else {
      el = document.createElement("img");
      el.alt = String(item.alt);
      el.loading = "lazy";
      el.decoding = "async";
      if (item.width) el.width = item.width;
      if (item.height) el.height = item.height;
      el.src = src;
    }
    box.appendChild(el);
    if (item.preview) {
      var badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = PREVIEW_BADGE;
      box.appendChild(badge);
    }
    fig.appendChild(box);
    if (item.caption) {
      var cap = document.createElement("figcaption");
      cap.textContent = String(item.caption);
      fig.appendChild(cap);
    }
    return fig;
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-media]"), function (grid) {
    var items = CFG.media && CFG.media[grid.getAttribute("data-media")];
    if (!Array.isArray(items) || !items.length) return;
    var figs = items.map(mediaFigure).filter(Boolean);
    if (!figs.length) return;
    grid.textContent = "";
    figs.forEach(function (f) { grid.appendChild(f); });
  });

  // ----- Enquiry form -----
  var form = document.getElementById("trip-enquiry");
  if (!form) return;

  var stateEl = document.getElementById("trip-state");
  var resultEl = document.getElementById("trip-result");
  var submitBtn = document.getElementById("t-submit");
  var partySel = document.getElementById("t-party");
  var arrival = document.getElementById("t-arrival");
  var flexible = document.getElementById("t-flex");
  var nameLabel = form.querySelector("[data-label-name]");
  var partnerOnly = form.querySelectorAll("[data-partner-only]");

  var PARTY = {
    direct: ["Just me", "Two of us", "Family", "Friends", "Something else"],
    partner: ["Travel company or agent", "Group organiser (club, school, team or company)", "Something else"]
  };
  var STAY = { "one-night": "One night", "two-nights": "Two nights", unsure: "Not sure yet" };
  var TRANSPORT = {
    pickup: "Pickup at the valley entrance (proposed main arrangement)",
    delhi: "Transport from Delhi (enquiry only)",
    own: "I will arrange my own transport",
    unsure: "Not sure yet"
  };
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // What the page says depends on whether a number is set
  function applyState() {
    var open = !!NUMBER;
    stateEl.setAttribute("data-state", open ? "active" : "inactive");
    stateEl.textContent = open ? "Enquiries by WhatsApp: open" : "Enquiries by WhatsApp: not open yet";
    submitBtn.textContent = open ? "Prepare my WhatsApp message" : "Check my answers";
    // The static line beside the form describes the closed state, so it must change when a number is set
    var now = document.getElementById("trip-now");
    if (now && open) now.innerHTML = "<strong>Right now:</strong> the business WhatsApp number is set, so the form prepares a message for you to review. Nothing is sent until you press send in WhatsApp.";
  }

  function pathValue() {
    var r = form.querySelector('input[name="path"]:checked');
    return r ? r.value : "direct";
  }

  function fillParty(path) {
    partySel.textContent = "";
    var first = document.createElement("option");
    first.value = "";
    first.textContent = "Choose one";
    first.disabled = true;
    first.selected = true;
    partySel.appendChild(first);
    PARTY[path].forEach(function (label) {
      var o = document.createElement("option");
      o.value = label;
      o.textContent = label;
      partySel.appendChild(o);
    });
  }

  function applyPath() {
    var partner = pathValue() === "partner";
    Array.prototype.forEach.call(partnerOnly, function (el) { el.hidden = !partner; });
    nameLabel.textContent = partner ? "Your name (contact person)" : "Your name";
    form.elements.company.required = partner;
    if (!partner) clearError(form.elements.company);
    fillParty(partner ? "partner" : "direct");
  }

  // ----- Errors, in the same pattern as the other site forms -----
  function showError(input, message) {
    clearError(input);
    input.setAttribute("aria-invalid", "true");
    var el = document.createElement("p");
    el.className = "field__error";
    el.id = input.id + "-error";
    el.textContent = message;
    var prior = input.getAttribute("aria-describedby");
    if (prior) input.setAttribute("data-prior-describedby", prior);
    input.setAttribute("aria-describedby", (prior ? prior + " " : "") + el.id);
    input.parentNode.appendChild(el);
  }

  function clearError(input) {
    input.removeAttribute("aria-invalid");
    var prior = input.getAttribute("data-prior-describedby");
    if (prior) input.setAttribute("aria-describedby", prior);
    else input.removeAttribute("aria-describedby");
    input.removeAttribute("data-prior-describedby");
    var old = document.getElementById(input.id + "-error");
    if (old) old.remove();
  }

  // ----- Helpers -----
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function longDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return "";
    return parseInt(m[3], 10) + " " + MONTHS[parseInt(m[2], 10) - 1] + " " + m[1];
  }
  function oneLine(s) { return String(s || "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim(); }
  function multiLine(s) { return String(s || "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\n{3,}/g, "\n\n").trim(); }

  // The form never asks for these, so refuse them if they turn up in the free-text notes
  function looksSensitive(text) {
    var t = text.toLowerCase();
    if (/\b(cvv|cvc|date of birth|dob|passport|aadhaar|aadhar|card number|account number|ifsc|pan number)\b/.test(t)) return true;
    return /\d(?:[ -]?\d){12,18}/.test(text);
  }

  function collect() {
    var path = pathValue();
    var acts = [];
    Array.prototype.forEach.call(form.querySelectorAll('input[name="activity"]:checked'), function (c) { acts.push(c.value); });
    return {
      path: path,
      name: oneLine(form.elements.name.value),
      company: oneLine(form.elements.company.value),
      party: form.elements.party.value,
      guests: form.elements.guests.value.trim(),
      arrival: arrival.value,
      flexible: flexible.checked,
      stay: form.elements.stay.value,
      transport: form.elements.transport.value,
      activities: acts,
      notes: multiLine(form.elements.notes.value)
    };
  }

  function validate(d) {
    var bad = [];
    function fail(input, msg) { showError(input, msg); bad.push(input); }

    ["name", "company", "party", "guests", "arrival", "stay", "transport", "notes"].forEach(function (n) {
      clearError(form.elements[n]);
    });

    if (!d.name) fail(form.elements.name, "Please tell us your name.");
    if (d.path === "partner" && !d.company) fail(form.elements.company, "Please tell us the company or organiser name.");
    if (!d.party) fail(form.elements.party, "Please choose the party type.");

    if (!/^\d+$/.test(d.guests) || parseInt(d.guests, 10) < 1 || parseInt(d.guests, 10) > 500) {
      fail(form.elements.guests, "Please enter a whole number of guests, from 1 to 500.");
    }

    if (!d.arrival && !d.flexible) {
      fail(arrival, "Please choose a preferred arrival date, or tick that your dates are flexible.");
    } else if (d.arrival && d.arrival < todayISO()) {
      fail(arrival, "Please choose today or a later date.");
    }

    if (!d.stay) fail(form.elements.stay, "Please choose a preferred stay.");
    if (!d.transport) fail(form.elements.transport, "Please choose a transport preference.");
    if (d.notes && looksSensitive(d.notes)) {
      fail(form.elements.notes, "Please take out anything like a date of birth, an ID or passport number, or card details. We do not need them.");
    }
    return bad;
  }

  function buildMessage(d) {
    var partner = d.path === "partner";
    var when;
    if (d.arrival && d.flexible) when = longDate(d.arrival) + " (my dates are flexible)";
    else if (d.arrival) when = longDate(d.arrival);
    else when = "Flexible dates";

    var lines = [
      "Hello, I would like to ask about a Shivaya Prakriti mountain trip.",
      "",
      "Enquiry from: " + (partner ? "a travel company or group organiser" : "a customer planning a trip"),
      "Name: " + d.name
    ];
    if (partner) lines.push("Company or organiser: " + d.company);
    lines.push(
      "Party type: " + d.party,
      "Number of guests: " + d.guests,
      "Preferred arrival: " + when,
      "Preferred stay: " + STAY[d.stay],
      "Transport: " + TRANSPORT[d.transport],
      "Activities I am interested in: " + (d.activities.length ? d.activities.join(", ") : "None selected")
    );
    if (d.notes) lines.push("Notes: " + d.notes);
    lines.push(
      "",
      "I understand this is an enquiry only. Please confirm availability, the itinerary, what is included and the price before anything is booked or paid."
    );
    return lines.join("\n");
  }

  // ----- Rendering the outcome -----
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function clearResult() { resultEl.textContent = ""; }

  function showResult(box) {
    resultEl.textContent = "";
    resultEl.appendChild(box);
    resultEl.focus();
    if (resultEl.scrollIntoView) resultEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function showClosed(message) {
    var box = make("div", "result__box result__box--stop");
    box.appendChild(make("h3", "", "Your answers look complete. Nothing has been sent."));
    box.appendChild(make("p", "", "Enquiries by WhatsApp are not open yet, because the business WhatsApp number has not been set. This page has not opened WhatsApp, sent a message or saved your answers anywhere, and the team has received nothing."));
    box.appendChild(make("p", "", "Please come back once enquiries open. You do not need to do anything else for now."));
    var det = make("details", "");
    det.appendChild(make("summary", "", "See the message this form would prepare"));
    var pre = make("pre", "msg", message);
    pre.setAttribute("tabindex", "0");
    pre.setAttribute("role", "region");
    pre.setAttribute("aria-label", "Preview of the message, which has not been sent");
    det.appendChild(pre);
    box.appendChild(det);
    showResult(box);
  }

  function showReady(message) {
    var box = make("div", "result__box");
    box.appendChild(make("h3", "", "Your message is ready to review. It has not been sent."));
    box.appendChild(make("p", "", "Read the message below. The button opens WhatsApp with these words filled in. The team only receives it when you press send inside WhatsApp."));
    var pre = make("pre", "msg", message);
    pre.setAttribute("tabindex", "0");
    pre.setAttribute("role", "region");
    pre.setAttribute("aria-label", "Your WhatsApp message, for review");
    box.appendChild(pre);

    var actions = make("div", "result__actions");
    var open = make("a", "btn btn--ember", "Open WhatsApp to review and send");
    open.href = "https://wa.me/" + NUMBER + "?text=" + encodeURIComponent(message);
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    var copy = make("button", "btn btn--line", "Copy the message");
    copy.type = "button";
    actions.appendChild(open);
    actions.appendChild(copy);
    box.appendChild(actions);

    var note = make("p", "hint", "");
    note.setAttribute("role", "status");
    note.textContent = "Nothing is sent until you press send in WhatsApp.";
    box.appendChild(note);

    open.addEventListener("click", function () {
      note.textContent = "WhatsApp should now be open with your message. Your enquiry has not been sent until you press send there. If WhatsApp did not open, copy the message and paste it into a chat with +" + NUMBER + ".";
    });
    copy.addEventListener("click", function () {
      function done(ok) {
        note.textContent = ok
          ? "Message copied. It has not been sent. Paste it into a WhatsApp chat with +" + NUMBER + " and press send."
          : "Could not copy automatically. Select the message above and copy it, then paste it into a WhatsApp chat with +" + NUMBER + ".";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
    showResult(box);
  }

  // ----- Wiring -----
  applyState();
  applyPath();
  arrival.min = todayISO();

  // Links such as trips.html?stay=two-nights#enquire pre-pick a stay. Only known values are used.
  try {
    var q = new URLSearchParams(location.search);
    var stay = q.get("stay");
    if (stay && Object.prototype.hasOwnProperty.call(STAY, stay) && stay !== "unsure") form.elements.stay.value = stay;
  } catch (e) { /* older browser: leave the form as is */ }

  form.addEventListener("change", function (e) {
    if (e.target.name === "path") applyPath();
  });

  // Any edit makes an earlier message out of date, so remove it
  form.addEventListener("input", function (e) {
    if (e.target.matches("[aria-invalid]")) clearError(e.target);
    clearResult();
  });
  form.addEventListener("change", clearResult);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearResult();
    var data = collect();
    var bad = validate(data);
    if (bad.length) {
      bad[0].focus();
      return;
    }
    var message = buildMessage(data);
    if (!NUMBER) showClosed(message);
    else showReady(message);
  });
})();
