/* ============================================================
   Daniel Molina — portfolio interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");
  let konamiTail = null; // the keydown that finished a Konami "b a", so the "a" doesn't jump to Art

  /* ---------- active window: the one you're reading gets the double frame ---------- */
  function trackActiveWindow() {
    const wins = Array.from(document.querySelectorAll("[data-win]"));
    const navLinks = Array.from(document.querySelectorAll(".menubar__nav a[href^='#']"));
    if (!("IntersectionObserver" in window)) {
      wins.forEach((w) => w.classList.add("is-active"));
      return;
    }

    const ratios = new Map(wins.map((w) => [w, 0]));
    let current = null;

    function activate(win) {
      if (win === current) return;
      if (current) current.classList.remove("is-active");
      win.classList.add("is-active");
      current = win;
      const nav = win.dataset.nav ? "#" + win.dataset.nav : null;
      navLinks.forEach((a) => {
        if (a.getAttribute("href") === nav) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target, e.intersectionRatio * e.boundingClientRect.height));
        let best = wins[0], bestArea = -1;
        ratios.forEach((area, win) => { if (area > bestArea) { best = win; bestArea = area; } });
        activate(best);
      },
      { rootMargin: "-32px 0px -32px 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    wins.forEach((w) => io.observe(w));
    activate(wins[0]);
  }

  /* ---------- hotkeys: W P S A C jump to a section ---------- */
  function hotkeys() {
    const map = {};
    document.querySelectorAll(".menubar__nav a[data-key]").forEach((a) => { map[a.dataset.key] = a; });

    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const t = e.target;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e === konamiTail) return;
      const link = map[e.key.toLowerCase()];
      if (!link) return;
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", link.getAttribute("href"));
    });
  }

  /* ---------- console greeting ---------- */
  function consoleGreeting() {
    const tag = "color:#000;background:#aaaaaa;padding:2px 8px;font-family:monospace";
    const body = "color:#55ffff;font-family:monospace";
    console.log("%c C:\\> daniel.exe ", tag);
    console.log(
      "%cReading the source? Nice. Say hi: daniel.97.molin@gmail.com\n" +
      "Built by hand, no frameworks. Try the Konami code: ↑↑↓↓←→←→BA",
      body
    );
  }

  /* ---------- Konami code: switch to CGA palette 1 ---------- */
  function konami() {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let pos = 0;
    window.addEventListener("keydown", (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === seq[pos] && pos >= 8) konamiTail = e;
      pos = key === seq[pos] ? pos + 1 : (key === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        const on = root.dataset.palette === "cga";
        if (on) delete root.dataset.palette;
        else root.dataset.palette = "cga";
        console.log("%c" + (on ? "Back to blue." : "CGA palette 1 unlocked. Konami again to undo."), "color:#ff55ff;font-family:monospace");
      }
    });
  }

  function init() {
    konami(); // registered first so it sees each key before the hotkeys do
    trackActiveWindow();
    hotkeys();
    consoleGreeting();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
