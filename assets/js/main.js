/* ==========================================================================
   NARESH FITNESS — Interactions
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header ---------- */
  var header = document.getElementById("siteHeader");
  function onScrollHeader() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");

  function closeNav() {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  function toggleNav() {
    var isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  }
  navToggle.addEventListener("click", toggleNav);
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ---------- Scrollspy: highlight active nav link ---------- */
  var navLinks = document.querySelectorAll(".nav-link");
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

  function updateActiveLink() {
    var scrollPos = window.scrollY + 140;
    var current = sections[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec;
    });
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + current.id;
      link.classList.toggle("active", match);
    });
  }
  updateActiveLink();
  window.addEventListener("scroll", updateActiveLink, { passive: true });

  /* ---------- Scroll cue ---------- */
  var scrollCue = document.getElementById("scrollCue");
  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      var target = document.querySelector(".trust-bar") || document.getElementById("about");
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = entry.target.getAttribute("data-reveal-delay");
            if (delay) entry.target.style.transitionDelay = delay + "ms";
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });

    /* Safety net: some browsers/contexts throttle or skip IntersectionObserver
       callbacks (e.g. backgrounded tabs). Never leave content permanently hidden. */
    setTimeout(function () {
      revealEls.forEach(function (el) {
        if (!el.classList.contains("in-view")) el.classList.add("in-view");
      });
    }, 2000);
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll(".count-up");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduceMotion || isNaN(target)) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { counterObserver.observe(el); });

    /* Safety net: force-run any counters an unreliable observer never triggered. */
    setTimeout(function () {
      counters.forEach(function (el) {
        if (el.textContent === "0") animateCounter(el);
      });
    }, 2000);
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Gallery lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");
  var lastFocused = null;

  function openLightbox(src, alt) {
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.hidden = false;
    lightboxClose.focus();
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  document.querySelectorAll(".gallery-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var full = btn.getAttribute("data-full");
      var img = btn.querySelector("img");
      openLightbox(full, img ? img.alt : "");
    });
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  /* ---------- Back to top ---------- */
  var toTop = document.getElementById("toTop");
  function onScrollTop() {
    toTop.classList.toggle("visible", window.scrollY > 700);
  }
  onScrollTop();
  window.addEventListener("scroll", onScrollTop, { passive: true });
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Contact form -> WhatsApp ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var goal = form.goal.value;
      var message = form.message.value.trim();

      var text = "Hi Naresh, my name is " + name + ".\n" +
        "Goal: " + goal + "\n" +
        (message ? "Message: " + message + "\n" : "") +
        "My contact number: " + phone;

      var url = "https://wa.me/919840808876?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
