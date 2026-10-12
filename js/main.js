/* ============================================================
   Daniel Molina — portfolio interactions
   A BIOS setup utility: ←→ switch menus, ↑↓ select items,
   +/− change values, F9 defaults, F10 save and "restart".
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const bios = $("#bios");
  const screens = $$(".screen");
  const tabs = $$(".tabs a[data-tab]");
  const items = $$(".item");
  const toggles = $$(".toggle");
  const dialog = $("#confirm");

  let current = null;   // the screen whose tab is highlighted
  let selected = null;  // the highlighted item
  let booting = false;
  let navLock = null;   // while we scroll to a menu ourselves, the scroll spy waits

  const scrollBehavior = () => (reduceMotion ? "auto" : "smooth");
  const screenOf = (el) => el.closest(".screen");

  /* ---------- System Time / Date, fixed at UTC−6 ---------- */
  function clock() {
    const timeEl = $("[data-clock='time']");
    const dateEl = $("[data-clock='date']");
    if (!timeEl) return;
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "Etc/GMT+6", hour12: false,
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    function tick() {
      const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
      timeEl.textContent = `${p.hour === "24" ? "00" : p.hour}:${p.minute}:${p.second}`;
      dateEl.textContent = `${p.month}/${p.day}/${p.year}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- tabs follow the scroll ---------- */
  function setScreen(screen) {
    if (screen === current) return;
    current = screen;
    tabs.forEach((t) => {
      if (t.getAttribute("href") === "#" + screen.id) {
        t.setAttribute("aria-current", "true");
        const strip = t.parentElement;
        const left = t.offsetLeft - strip.offsetLeft;
        if (left < strip.scrollLeft || left + t.offsetWidth > strip.scrollLeft + strip.clientWidth) {
          strip.scrollTo({ left: left - 16, behavior: scrollBehavior() });
        }
      } else {
        t.removeAttribute("aria-current");
      }
    });
  }

  function spy() {
    if (navLock) return;
    const line = window.innerHeight * 0.4;
    let pick = screens[0];
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      pick = screens[screens.length - 1];
    } else {
      screens.forEach((s) => { if (s.getBoundingClientRect().top <= line) pick = s; });
    }
    setScreen(pick);
  }

  function watchScroll() {
    let queued = false;
    window.addEventListener("scroll", () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; spy(); });
    }, { passive: true });
    window.addEventListener("resize", spy);
    spy();
    // a deep link lands before the pixel font loads and shifts the layout; land it again
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && document.fonts) document.fonts.ready.then(() => target.scrollIntoView({ block: "start" }));
  }

  /* ---------- selection + Item Specific Help ---------- */
  function helpFor(item) {
    const t = $(".toggle", item);
    if (t && !item.dataset.help) {
      return `${t.dataset.label}: ${t.textContent}. Use +/− or Enter to change it.`;
    }
    return item.dataset.help || "";
  }

  function showHelp(screen, text, denied) {
    const el = $(".help__text", screen);
    if (!el) return;
    el.textContent = text || el.dataset.default;
    el.classList.toggle("is-denied", !!denied);
  }

  function select(item, { focus = false, scroll = false } = {}) {
    if (!item) return;
    if (selected && selected !== item) selected.classList.remove("is-sel", "is-denied");
    selected = item;
    item.classList.add("is-sel");
    showHelp(screenOf(item), helpFor(item));
    if (focus) {
      const target = item.matches("a, button") ? item : $(".row__link, .toggle, a, button", item);
      if (target) target.focus({ preventScroll: true });
    }
    if (scroll) item.scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
  }

  function inView(el) {
    const r = el.getBoundingClientRect();
    const topH = $(".top").offsetHeight, legH = ($(".legend") || { offsetHeight: 0 }).offsetHeight;
    return r.bottom > topH && r.top < window.innerHeight - legH;
  }

  function moveItem(dir) {
    if (!selected || !inView(selected)) {
      const visible = items.filter((i) => screenOf(i) === current && inView(i));
      const pool = visible.length ? visible : items.filter((i) => screenOf(i) === current);
      select(dir > 0 ? pool[0] : pool[pool.length - 1], { focus: true, scroll: true });
      return;
    }
    const next = items[items.indexOf(selected) + dir];
    if (!next) return;
    const crossing = screenOf(next) !== screenOf(selected);
    select(next, { focus: true, scroll: !crossing });
    if (crossing) {
      lockSpy();
      setScreen(screenOf(next));
      if (dir > 0) screenOf(next).scrollIntoView({ block: "start", behavior: scrollBehavior() });
      else next.scrollIntoView({ block: "center", behavior: scrollBehavior() });
    }
  }

  function lockSpy() {
    clearTimeout(navLock);
    navLock = setTimeout(() => { navLock = null; spy(); }, 900);
  }

  function goScreen(target) {
    if (!target) return;
    lockSpy();
    target.scrollIntoView({ block: "start", behavior: scrollBehavior() });
    history.replaceState(null, "", "#" + target.id);
    setScreen(target);
    select($(".item", target), { focus: true });
  }

  const step = (delta) => goScreen(screens[screens.indexOf(current) + delta]);

  function wireItems() {
    items.forEach((item) => {
      item.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") select(item); });
      item.addEventListener("click", () => select(item));
      item.addEventListener("focusin", () => select(item));
    });
    tabs.forEach((t) => t.addEventListener("click", (e) => {
      e.preventDefault();
      goScreen($(t.getAttribute("href")));
    }));
  }

  /* ---------- toggles: +/− or Enter changes a value ---------- */
  const valuesOf = (t) => (t.dataset.values ? t.dataset.values.split(",") : ["Enabled", "Disabled"]);
  const config = () => toggles.map((t) => t.dataset.i || "0");
  let saved = config();

  function render(t) {
    const v = valuesOf(t)[+(t.dataset.i || 0)];
    t.textContent = `[${v}]`;
    t.setAttribute("aria-label", `${t.dataset.label}: ${v}`);
  }

  function change(t, dir) {
    const item = t.closest(".item");
    if (t.dataset.locked) {
      item.classList.add("is-denied");
      showHelp(screenOf(item), t.dataset.locked, true);
      setTimeout(() => item.classList.remove("is-denied"), 400);
      return;
    }
    const n = valuesOf(t).length;
    t.dataset.i = String(((+(t.dataset.i || 0) + dir) % n + n) % n);
    render(t);
    if (item === selected) showHelp(screenOf(item), helpFor(item));
  }

  function applyConfig(cfg) {
    toggles.forEach((t, i) => { t.dataset.i = cfg[i]; render(t); });
    if (selected) showHelp(screenOf(selected), helpFor(selected));
  }

  function wireToggles() {
    toggles.forEach((t) => {
      render(t);
      t.addEventListener("click", () => change(t, 1));
    });
  }

  const valueOf = (label) => {
    const t = toggles.find((x) => x.dataset.label === label);
    return t ? valuesOf(t)[+(t.dataset.i || 0)] : null;
  };

  /* ---------- setup dialog ---------- */
  function ask({ title = "Setup Confirmation", body, buttons = ["Yes", "No"] }) {
    return new Promise((resolve) => {
      $("#confirm-title").textContent = title;
      const bodyEl = $("#confirm-body");
      bodyEl.replaceChildren();
      if (typeof body === "string") {
        const p = document.createElement("p");
        p.textContent = body;
        bodyEl.append(p);
      } else {
        bodyEl.append(body);
      }
      const btnBox = $("#confirm-buttons");
      btnBox.replaceChildren(...buttons.map((label) => {
        const b = document.createElement("button");
        b.value = label.toLowerCase();
        b.textContent = `[${label}]`;
        return b;
      }));
      dialog.returnValue = "";
      dialog.addEventListener("close", () => resolve(dialog.returnValue === "yes"), { once: true });
      dialog.showModal();
      btnBox.firstElementChild.focus();
    });
  }

  function wireDialog() {
    dialog.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      const btns = $$("#confirm-buttons button");
      if (key === "y" && btns.some((b) => b.value === "yes")) { dialog.close("yes"); e.preventDefault(); }
      else if (key === "n" && btns.some((b) => b.value === "no")) { dialog.close("no"); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const i = btns.indexOf(document.activeElement);
        const next = btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length];
        if (next) next.focus();
        e.preventDefault();
      }
    });
  }

  function helpDialog() {
    const dl = document.createElement("dl");
    [
      ["↑ ↓", "Select an item"],
      ["← →", "Switch menus (scrolling works too)"],
      ["Enter", "Open the selected item"],
      ["− / +", "Change a value"],
      ["F9", "Load setup defaults"],
      ["F10", "Save and exit"],
      ["Esc", "Go to the Exit menu"],
    ].forEach(([k, v]) => {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    });
    return ask({ title: "General Help", body: dl, buttons: ["Continue"] });
  }

  async function act(name) {
    if (booting || dialog.open) return;
    const back = document.activeElement;
    let restart = false;
    if (name === "help") await helpDialog();
    else if (name === "exit") goScreen($("#exit"));
    else if (name === "prev") step(-1);
    else if (name === "next") step(1);
    else if (name === "save") {
      if (await ask({ body: "Save configuration changes and exit now?" })) { saved = config(); restart = true; }
    } else if (name === "exit-discard") {
      if (await ask({ body: "Exit without saving changes?" })) { applyConfig(saved); restart = true; }
    } else if (name === "defaults") {
      if (await ask({ body: "Load default configuration now?" })) {
        applyConfig(toggles.map(() => "0"));
        delete root.dataset.palette;
      }
    } else if (name === "discard") {
      if (await ask({ body: "Load previous configuration now?" })) applyConfig(saved);
    }
    if (restart) restartSystem();
    else if (back && document.contains(back) && !["exit", "prev", "next"].includes(name)) back.focus({ preventScroll: true });
  }

  function wireActions() {
    $$("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
  }

  /* ---------- keyboard ---------- */
  function keyboard() {
    window.addEventListener("keydown", (e) => {
      if (booting || dialog.open) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;

      switch (e.key) {
        case "ArrowDown": e.preventDefault(); moveItem(1); break;
        case "ArrowUp": e.preventDefault(); moveItem(-1); break;
        case "ArrowRight": e.preventDefault(); step(1); break;
        case "ArrowLeft": e.preventDefault(); step(-1); break;
        case "+": case "=": case "-": {
          const tog = selected && $(".toggle", selected);
          if (!tog) break;
          e.preventDefault();
          change(tog, e.key === "-" ? -1 : 1);
          break;
        }
        case "F1": e.preventDefault(); act("help"); break;
        case "F9": e.preventDefault(); act("defaults"); break;
        case "F10": e.preventDefault(); act("save"); break;
        case "Escape": e.preventDefault(); act("exit"); break;
        case "Enter": {
          if (selected && (document.activeElement === document.body || !document.activeElement)) {
            const target = $(".row__link, .toggle, a, button", selected);
            if (target) { e.preventDefault(); target.click(); }
          }
          break;
        }
      }
    });
  }

  /* ---------- restart: Linux fails to boot, then POST, then back to setup ---------- */
  const bootEl = $("#bootscreen");
  const log = $("#bootlog");
  let skip = false;

  const wait = (ms) => new Promise((r) => { if (skip || reduceMotion) r(); else setTimeout(r, ms); });

  function line(parts) {
    const div = document.createElement("div");
    (Array.isArray(parts) ? parts : [["", parts]]).forEach(([cls, text]) => {
      const s = document.createElement("span");
      if (cls) s.className = cls;
      s.textContent = text;
      div.append(s);
    });
    log.append(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }
  const ok = (text) => line([["", "["], ["ok", "  OK  "], ["", "] " + text]]);
  const failed = (text) => line([["", "["], ["fail", "FAILED"], ["", "] " + text]]);
  const depend = (text) => line([["", "["], ["dep", "DEPEND"], ["", "] " + text]]);

  // resolves on the next key or tap (after a short guard), or after `timeout` ms
  function anyKey(timeout) {
    return new Promise((resolve) => {
      let armed = null, timer = null;
      const finish = () => {
        clearTimeout(armed); clearTimeout(timer);
        window.removeEventListener("keydown", done, true);
        bootEl.removeEventListener("pointerdown", done);
        resolve();
      };
      const done = (e) => {
        if (e.type === "keydown" && ["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
        e.preventDefault();
        finish();
      };
      armed = setTimeout(() => {
        window.addEventListener("keydown", done, true);
        bootEl.addEventListener("pointerdown", done);
      }, 250);
      if (timeout) timer = setTimeout(finish, timeout);
    });
  }

  function kernelLines(coffeeOn) {
    const ts = (n) => `[${n.toFixed(6).padStart(12)}] `;
    return [
      "Loading Linux 6.11.0-daniel ...",
      "Loading initial ramdisk ...",
      ts(0) + "Linux version 6.11.0-daniel (daniel@setup) (gcc 14.2.0) #1 SMP PREEMPT_DYNAMIC",
      ts(0) + "Command line: BOOT_IMAGE=/boot/vmlinuz-6.11.0-daniel root=/dev/twins ro quiet",
      ts(0.012764) + "Memory: 65536K/65536K available (6 years of experience reserved)",
      ts(0.181002) + "smpboot: CPU0: Daniel Molina (family: backend, model: senior, stepping: 6)",
      ts(0.402117) + `ACPI: Coffee Maker [CAF0] (${coffeeOn ? "on" : "off"})`,
      ts(1.204311) + "EXT4-fs (sda1): mounted filesystem with ordered data mode",
    ];
  }

  async function runLinux() {
    const disabled = toggles.filter((t) => !t.dataset.values && t.dataset.i === "1").map((t) => t.dataset.label);
    const off = (label) => disabled.includes(label);
    const coffeeOff = off("Coffee supply");
    const javaOff = off("Java");
    const drums = valueOf("Drum volume");

    for (const l of kernelLines(!coffeeOff)) { line(l); await wait(45); }
    await wait(250);
    line("");
    line([["", "Welcome to "], ["hi", "DanielOS 6.0 (Twin Edition)"], ["", "!"]]);
    line("");

    const steps = [
      () => ok("Started systemd-journald.service - Journal Service."),
      () => ok("Mounted home-daniel.mount - /home/daniel."),
      () => ok("Mounted home-daniel-twins.mount - /home/daniel/twins (2 devices)."),
      () => coffeeOff ? failed("Failed to start coffee.service - Caffeine Daemon (disabled in setup).")
                      : ok("Started coffee.service - Caffeine Daemon."),
      () => javaOff ? failed("Failed to start java.service - Java Runtime (disabled in setup).")
                    : ok("Started java.service - Java 25 Runtime."),
      () => ok("Reached target network-online.target - Network is Online (remote, UTC−6)."),
      () => ok("Started rori.service - AI Medical Records Review."),
      () => ok("Started eoplat.service - Nonprofit Platform."),
    ];
    disabled.filter((l) => l !== "Coffee supply" && l !== "Java").slice(0, 5).forEach((l) => {
      const unit = l.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      steps.push(() => failed(`Failed to start ${unit}.service - ${l} (disabled in setup).`));
    });
    if (drums === "Neighbors") steps.push(() => failed("Failed to start quiet-hours.service - Neighbors filed a noise complaint."));
    else steps.push(() => ok(`Started drums.service - Drum Kit (volume: ${drums ? drums.toLowerCase() : "loud"}).`));
    steps.push(() => ok("Reached target deep-work.target - Deep Work."));
    steps.push(() => failed("Failed to start sleep.service - Sleep."));
    steps.push(() => line("See 'systemctl status sleep.service' for details."));
    steps.push(() => depend("Dependency failed for rest.target - Rest and Recovery."));

    for (const s of steps) { s(); await wait(110); }
    await wait(700);

    const reason = coffeeOff ? "VFS: Unable to mount root fs: no coffee"
      : javaOff ? "No working init found. Java was disabled in setup"
      : "Attempted to kill init! (twins are awake)";
    line("");
    line(`[    4.512042] Kernel panic - not syncing: ${reason}`);
    line("[    4.512113] CPU: 0 PID: 1 Comm: init Not tainted 6.11.0-daniel #1");
    line(`[    4.512190] ---[ end Kernel panic - not syncing: ${reason} ]---`);
    line("");
    const prompt = line([["hi", "Press any key to reboot"]]);
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    prompt.append(cursor);
  }

  async function runPost() {
    log.replaceChildren();
    const logo = document.createElement("div");
    logo.className = "boot__logo";
    logo.setAttribute("aria-hidden", "true");
    logo.textContent = "DM";
    bootEl.append(logo);

    const today = new Date();
    const date = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
    line([["hi", "DM BIOS v6.0"], ["", ", Release " + date]]);
    line("Copyright (C) 2020-" + today.getFullYear() + " Daniel Molina. All rights reserved.");
    line("");
    line("Main Processor : Daniel Molina, Backend Engineer");
    const mem = line("Memory Testing : 0K");
    for (let k = 0; k <= 65536 && !skip && !reduceMotion; k += 2048) {
      mem.textContent = `Memory Testing : ${k}K`;
      await new Promise((r) => requestAnimationFrame(r));
    }
    mem.textContent = "Memory Testing : 65536K OK";
    line("");
    for (const [what, found] of [
      ["IDE Drive 0", "RORI-SSD"],
      ["IDE Drive 1", "EOPLAT-HDD"],
      ["USB Devices", "2 twins, 1 drum kit, 1 guitar"],
    ]) {
      await wait(260);
      line(`Detecting ${what.padEnd(11)} ... ${found}`);
    }
    await wait(300);
    line("");
    line([["hi", "Press DEL to enter SETUP"]]);
  }

  async function restartSystem() {
    booting = true;
    skip = false;
    log.replaceChildren();
    bootEl.hidden = false;
    bios.inert = true;
    document.body.style.overflow = "hidden";
    bootEl.focus();

    // any key or tap while text is printing skips to the end of that phase
    const skipper = (e) => { skip = true; if (e.type === "keydown") e.preventDefault(); };
    window.addEventListener("keydown", skipper, true);
    bootEl.addEventListener("pointerdown", skipper);

    await runLinux();
    window.removeEventListener("keydown", skipper, true);
    bootEl.removeEventListener("pointerdown", skipper);
    await anyKey();

    skip = false;
    window.addEventListener("keydown", skipper, true);
    bootEl.addEventListener("pointerdown", skipper);
    await runPost();
    await anyKey(reduceMotion ? 2500 : 1600);
    window.removeEventListener("keydown", skipper, true);
    bootEl.removeEventListener("pointerdown", skipper);

    $$(".boot__logo", bootEl).forEach((n) => n.remove());
    bootEl.hidden = true;
    bios.inert = false;
    document.body.style.overflow = "";
    booting = false;
    window.scrollTo({ top: 0, behavior: "auto" });
    history.replaceState(null, "", location.pathname);
    spy();
    select($(".item", screens[0]), { focus: false });
    tabs[0].focus({ preventScroll: true });
  }

  /* ---------- images arrive like it's 1997: 8px blocks, row by row, over a slow modem ---------- */
  function slowImages() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const imgs = $$(".shot img, .gallery img");
    const BLOCK = 8;       // CSS px, the size of a JPEG block
    let epoch = 0;         // bumps on resize, so in-flight canvases bail out
    window.addEventListener("resize", () => { epoch++; });

    imgs.forEach((img) => img.classList.add("px-pending"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        reveal(e.target);
      });
    }, { threshold: 0.15 });
    imgs.forEach((img) => io.observe(img));

    async function reveal(img) {
      const show = () => img.classList.remove("px-pending");
      img.loading = "eager";
      try { await img.decode(); } catch { show(); return; }
      await new Promise((r) => setTimeout(r, 80 + Math.random() * 300)); // latency

      const w = img.clientWidth, h = img.clientHeight;
      if (!w || !h) { show(); return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(w * dpr), ch = Math.round(h * dpr);

      // scale once offscreen, then copy blocks 1:1 so there are no seams between them
      const full = document.createElement("canvas");
      full.width = cw; full.height = ch;
      full.getContext("2d").drawImage(img, 0, 0, cw, ch);

      const cv = document.createElement("canvas");
      cv.width = cw; cv.height = ch;
      cv.className = "px-canvas";
      cv.setAttribute("aria-hidden", "true");
      Object.assign(cv.style, { left: img.offsetLeft + "px", top: img.offsetTop + "px", width: w + "px", height: h + "px" });
      img.after(cv);

      const ctx = cv.getContext("2d");
      const b = Math.round(BLOCK * dpr);
      const cols = Math.ceil(cw / b);
      const total = cols * Math.ceil(ch / b);
      const duration = 1000 + Math.random() * 700;
      const started = epoch;
      let drawn = 0, last = performance.now(), stallUntil = 0;

      await new Promise((resolve) => {
        function frame(now) {
          const dt = now - last;
          last = now;
          if (epoch !== started) return resolve();
          if (now >= stallUntil) {
            if (Math.random() < 0.01) stallUntil = now + 80 + Math.random() * 220; // the modem hiccups
            const end = Math.min(total, drawn + Math.max(1, Math.round(total * dt / duration * (0.4 + Math.random() * 1.2))));
            for (; drawn < end; drawn++) {
              const x = (drawn % cols) * b, y = Math.floor(drawn / cols) * b;
              ctx.drawImage(full, x, y, b, b, x, y, b, b);
            }
          }
          if (drawn >= total) resolve();
          else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
      show();
      cv.remove();
    }
  }

  /* ---------- Konami code: the other classic BIOS colors ---------- */
  function konami() {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let pos = 0;
    window.addEventListener("keydown", (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = key === seq[pos] ? pos + 1 : (key === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        const on = root.dataset.palette === "award";
        if (on) delete root.dataset.palette;
        else root.dataset.palette = "award";
        console.log("%c" + (on ? "Back to the gray BIOS." : "Classic blue BIOS unlocked. Konami again, or F9, to undo."), "color:#ffff55;font-family:monospace");
      }
    });
  }

  /* ---------- console greeting ---------- */
  function consoleGreeting() {
    const tag = "color:#fff;background:#0000aa;padding:2px 8px;font-family:monospace";
    const body = "color:#55ffff;font-family:monospace";
    console.log("%c DM BIOS Setup Utility v6.0 ", tag);
    console.log(
      "%cReading the source? Nice. Say hi: daniel.97.molin@gmail.com\n" +
      "Built by hand, no frameworks. Try F10, or the Konami code: ↑↑↓↓←→←→BA",
      body
    );
  }

  function init() {
    konami();
    clock();
    wireItems();
    wireToggles();
    wireDialog();
    wireActions();
    keyboard();
    watchScroll();
    slowImages();
    consoleGreeting();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
