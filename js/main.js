/* ============================================================
   Kevin Daniel Molina — portfolio interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- typed headline ---------- */
  function typeRole() {
    const el = document.getElementById("typed");
    if (!el) return;
    const text = "Full Stack Software Engineer";

    if (reduceMotion) { el.textContent = text; return; }

    let i = 0;
    (function step() {
      el.textContent = text.slice(0, i);
      if (i++ <= text.length) {
        setTimeout(step, 55 + Math.random() * 45);
      }
    })();
  }

  /* ---------- scroll reveals ---------- */
  function setupReveals() {
    const items = document.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            // small stagger between siblings revealed together
            setTimeout(() => entry.target.classList.add("is-visible"), idx * 70);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- console greeting (easter egg) ---------- */
  function consoleGreeting() {
    const tag = "color:#0e0f13;background:#f5b94d;padding:3px 8px;border-radius:4px;font-weight:bold";
    const dim = "color:#9197a1";
    console.log("%c $ whoami ", tag);
    console.log(
      "%cKevin Daniel Molina — Full Stack Software Engineer.\n" +
      "Reading the source? Nice. Say hi: daniel.97.molin@gmail.com\n" +
      "Built by hand, no frameworks. Try the Konami code. ↑↑↓↓←→←→BA",
      dim
    );
  }

  /* ---------- Konami code (easter egg) ---------- */
  function konami() {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let pos = 0;
    window.addEventListener("keydown", (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = key === seq[pos] ? pos + 1 : (key === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        document.documentElement.animate(
          [{ filter: "hue-rotate(0deg)" }, { filter: "hue-rotate(360deg)" }],
          { duration: 1400, easing: "ease-in-out" }
        );
        console.log("%c🎮 Achievement unlocked: you found the Konami code.", "color:#5ad1c4");
      }
    });
  }

  /* ---------- boot ---------- */
  function init() {
    typeRole();
    setupReveals();
    consoleGreeting();
    konami();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
