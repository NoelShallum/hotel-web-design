(function () {
  "use strict";

  // Where enquiries are sent. Leave empty until the founder confirms how
  // enquiries should arrive (email, WhatsApp or a form service). While it is
  // empty the form validates and shows a preview message, and sends nothing.
  var ENQUIRY_ENDPOINT = "";

  var root = document.documentElement;
  root.classList.add("js");

  // ----- Header turns solid once the page scrolls -----
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ----- Fade sections in as they arrive -----
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduceMotion) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  // ----- Mobile menu -----
  var menuBtn = document.getElementById("menu-btn");
  var nav = document.getElementById("site-nav");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  // ----- Enquiry form -----
  var form = document.getElementById("enquiry");
  var status = document.getElementById("form-status");
  if (!form) return;

  function showError(input, message) {
    clearError(input);
    input.setAttribute("aria-invalid", "true");
    var el = document.createElement("p");
    el.className = "field__error";
    el.id = input.id + "-error";
    el.textContent = message;
    input.setAttribute("aria-describedby", el.id);
    input.parentNode.appendChild(el);
  }

  function clearError(input) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    var old = document.getElementById(input.id + "-error");
    if (old) old.remove();
  }

  form.addEventListener("input", function (e) {
    if (e.target.matches("[aria-invalid]")) clearError(e.target);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";

    var name = form.elements.name;
    var email = form.elements.email;
    var firstBad = null;

    if (!name.value.trim()) {
      showError(name, "Please tell us your name.");
      firstBad = firstBad || name;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showError(email, "Please enter an email address we can reply to.");
      firstBad = firstBad || email;
    }
    if (firstBad) {
      firstBad.focus();
      return;
    }

    if (!ENQUIRY_ENDPOINT) {
      status.textContent =
        "Thank you, " + name.value.trim() + ". This preview is not connected to an inbox yet, so nothing was sent.";
      return;
    }

    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) data[el.name] = el.value;
    });

    status.textContent = "Sending...";
    fetch(ENQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Request failed");
        form.reset();
        status.textContent = "Thank you, we have your enquiry and will write back.";
      })
      .catch(function () {
        status.textContent = "We could not send your enquiry. Please try again in a moment.";
      });
  });
})();
