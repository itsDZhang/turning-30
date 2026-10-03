/* David Turns 30 · Banff Sunshine Village · interactions */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------------
     Countdown — first chair, Fri Jan 15 2027, 9:00 Mountain Time
  ------------------------------------------------------------------ */
  const TRIP_START = new Date("2027-01-15T09:00:00-07:00").getTime();
  const cdNums = {
    d: $$('[data-cd="d"]'), h: $$('[data-cd="h"]'), m: $$('[data-cd="m"]'), s: $$('[data-cd="s"]'),
  };
  const cdDaysMini = $$("[data-cd-days]");
  const pad2 = (n) => String(n).padStart(2, "0");

  function tickCountdown() {
    let diff = Math.max(0, TRIP_START - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    cdNums.d.forEach((el) => (el.textContent = d));
    cdNums.h.forEach((el) => (el.textContent = pad2(h)));
    cdNums.m.forEach((el) => (el.textContent = pad2(m)));
    cdNums.s.forEach((el) => (el.textContent = pad2(s)));
    cdDaysMini.forEach((el) => (el.textContent = d));
    if (TRIP_START - Date.now() <= 0) {
      const until = $(".countdown__until");
      if (until) until.textContent = "it's happening";
    }
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ------------------------------------------------------------------
     Reveal on scroll + counters
  ------------------------------------------------------------------ */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const format = el.dataset.format;
    const dur = prefersReduced ? 0 : 1500;
    const start = performance.now();
    function frame(now) {
      const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      const v = Math.round(target * easeOut(t));
      el.textContent = format === "comma" ? v.toLocaleString("en-US") : String(v);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          $$("[data-count]", e.target).forEach((c) => {
            if (!c.dataset.done) { c.dataset.done = "1"; animateCount(c); }
          });
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
    $$("[data-count]").forEach(animateCount);
  }

  /* ------------------------------------------------------------------
     Scene (sky colour) switching per section
  ------------------------------------------------------------------ */
  const scened = $$("[data-scene]").filter((el) => el !== document.body);
  if ("IntersectionObserver" in window) {
    const sceneIO = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting section
        let best = null;
        entries.forEach((e) => {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
        });
        if (best) document.body.dataset.scene = best.target.dataset.scene;
      },
      { threshold: [0.25, 0.5, 0.75] }
    );
    scened.forEach((el) => sceneIO.observe(el));
  }

  /* ------------------------------------------------------------------
     Scroll-driven: progress bar, hero parallax, sticky bar
  ------------------------------------------------------------------ */
  const progressBar = $("#progressBar");
  const hero = $("#hero");
  const mtns = $$(".mtn");
  const heroContent = $(".hero__content");
  const sticky = $("#sticky");
  let ticking = false;
  let ctaInView = false;
  const ctaSection = $("#cta");
  if (ctaSection && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { ctaInView = e.isIntersecting; });
      onScroll();
    }, { threshold: 0.05 }).observe(ctaSection);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || window.pageYOffset;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.transform = `scaleX(${docH > 0 ? Math.min(1, y / docH) : 0})`;

      const heroH = hero ? hero.offsetHeight : 0;
      if (!prefersReduced && hero && y < heroH) {
        mtns.forEach((m) => {
          const depth = parseFloat(m.dataset.depth || "0.2");
          m.style.transform = `translate3d(0, ${y * depth}px, 0)`;
        });
        if (heroContent) {
          heroContent.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
          heroContent.style.opacity = String(Math.max(0, 1 - y / (heroH * 0.7)));
        }
      }

      if (sticky) {
        const show = y > heroH * 0.85 && !ctaInView;
        sticky.classList.toggle("is-visible", show);
        sticky.setAttribute("aria-hidden", show ? "false" : "true");
        if (show) sticky.removeAttribute("inert"); else sticky.setAttribute("inert", "");
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ------------------------------------------------------------------
     Snow + stars canvas
  ------------------------------------------------------------------ */
  const snowCanvas = $("#snow");
  if (snowCanvas && !prefersReduced) {
    const ctx = snowCanvas.getContext("2d");
    let W = 0, H = 0, DPR = 1, flakes = [], stars = [], running = true, last = 0;

    function resize() {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      snowCanvas.width = W * DPR; snowCanvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.min(170, Math.round((W * H) / 7000));
      flakes = Array.from({ length: n }, () => makeFlake(true));
      stars = Array.from({ length: Math.min(140, Math.round(W / 3)) }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.7, r: Math.random() * 1.2 + 0.3,
        p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 0.6,
      }));
    }
    function makeFlake(randomY) {
      const z = Math.random(); // depth 0..1
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : -10,
        r: 0.8 + z * 2.6,
        vy: 0.35 + z * 1.1,
        vx: (Math.random() - 0.5) * 0.4,
        a: 0.35 + z * 0.55,
        ph: Math.random() * Math.PI * 2,
        sw: 0.2 + Math.random() * 0.6,
      };
    }
    function draw(now) {
      if (!running) return;
      const dt = Math.min(50, now - last || 16) / 16.67; last = now;
      ctx.clearRect(0, 0, W, H);

      // stars (only strong in night/alpine scenes, fade otherwise)
      const scene = document.body.dataset.scene;
      const starAlpha = scene === "night" ? 1 : scene === "alpine" ? 0.7 : 0.35;
      const t = now / 1000;
      ctx.fillStyle = "#ffffff";
      for (const s of stars) {
        ctx.globalAlpha = starAlpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p)));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }

      // snow
      const wind = Math.sin(t * 0.25) * 0.35;
      for (const f of flakes) {
        f.ph += 0.01 * dt;
        f.x += (f.vx + wind + Math.sin(f.ph) * f.sw * 0.3) * dt;
        f.y += f.vy * dt;
        if (f.y > H + 10) { Object.assign(f, makeFlake(false)); }
        if (f.x > W + 10) f.x = -10; else if (f.x < -10) f.x = W + 10;
        ctx.globalAlpha = f.a;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) { last = performance.now(); requestAnimationFrame(draw); }
    });
    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------------
     Currency converter (live rate with graceful fallback)
  ------------------------------------------------------------------ */
  let rate = 1.37;
  const fxRateEl = $("#fxRate"), fxBadge = $("#fxBadge");
  const fxSlider = $("#fxSlider"), fxUsd = $("#fxUsd"), fxCad = $("#fxCad");

  const fmtMoney = (n) => (Math.abs(n - Math.round(n)) < 0.005 ? String(Math.round(n)) : n.toFixed(2));

  function renderFx() {
    if (fxRateEl) fxRateEl.textContent = rate.toFixed(2);
    $$("[data-rate-inline]").forEach((el) => (el.textContent = `CA$${rate.toFixed(2)}`));
    const usd = fxSlider ? parseFloat(fxSlider.value) : 100;
    if (fxUsd) fxUsd.textContent = usd.toLocaleString("en-US");
    if (fxCad) fxCad.textContent = Math.round(usd * rate).toLocaleString("en-US");
    if (fxSlider) fxSlider.setAttribute("aria-valuetext", `${usd} US dollars is about ${Math.round(usd * rate)} Canadian dollars`);
    $$("[data-usd-from]").forEach((el) => {
      const cad = parseFloat(el.dataset.usdFrom);
      el.textContent = fmtMoney(cad / rate);
    });
  }
  renderFx();
  if (fxSlider) fxSlider.addEventListener("input", renderFx);

  // Free, keyless public rate feed; fail silently to the approximate rate.
  (async () => {
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: ctrl.signal });
      clearTimeout(tm);
      if (!res.ok) return;
      const data = await res.json();
      const cad = data && data.rates && Number(data.rates.CAD);
      if (cad && cad > 1 && cad < 2) {
        rate = cad;
        renderFx();
        if (fxBadge) { fxBadge.textContent = "live rate"; fxBadge.classList.add("is-live"); }
      }
    } catch (_) { /* keep fallback */ }
  })();

  /* ------------------------------------------------------------------
     Toast
  ------------------------------------------------------------------ */
  const toast = $("#toast");
  let toastTimer = 0;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2600);
  }

  /* ------------------------------------------------------------------
     Share
  ------------------------------------------------------------------ */
  const shareBtn = $("#shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const url = location.href.split("#")[0];
      const data = {
        title: "David turns 30 on a mountain",
        text: "Banff Sunshine Village · Jan 15–18, 2027 · MLK weekend · zero PTO. You in?",
        url,
      };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(url);
        showToast("Link copied. Paste it in the group chat.");
      } catch (err) {
        if (err && err.name === "AbortError") return;
        try { await navigator.clipboard.writeText(url); showToast("Link copied."); }
        catch (_) { showToast(url); }
      }
    });
  }

  /* ------------------------------------------------------------------
     "I'm in" → confetti
  ------------------------------------------------------------------ */
  const imIn = $("#imIn"), ctaAfter = $("#ctaAfter");
  const confettiCanvas = $("#confetti");
  let confettiRunning = false;

  function burstConfetti() {
    if (!confettiCanvas || prefersReduced) return;
    const ctx = confettiCanvas.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    confettiCanvas.width = W * DPR; confettiCanvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const colors = ["#5df2c9", "#9fd6ff", "#ffb84d", "#ff6e9c", "#ffffff", "#8b7cff"];
    const parts = Array.from({ length: 180 }, () => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const sp = 9 + Math.random() * 9;
      return {
        x: W / 2, y: H * 0.72,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        c: colors[(Math.random() * colors.length) | 0], life: 1,
      };
    });
    const start = performance.now();
    confettiRunning = true;
    function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of parts) {
        p.vy += 0.35; p.vx *= 0.99;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        p.life = Math.max(0, 1 - Math.max(0, t - 1.6) / 1.2);
        if (p.y < H + 20 && p.life > 0) alive++;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0 && t < 3.2) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); confettiRunning = false; }
    }
    requestAnimationFrame(frame);
  }

  if (imIn) {
    imIn.addEventListener("click", () => {
      if (!confettiRunning) burstConfetti();
      imIn.textContent = "Let's gooo 🏂🎂";
      if (ctaAfter) ctaAfter.hidden = false;
      if (navigator.vibrate) { try { navigator.vibrate([30, 40, 60]); } catch (_) {} }
    });
  }

  /* ------------------------------------------------------------------
     FAQ: only one open at a time (keeps the page tidy on mobile)
  ------------------------------------------------------------------ */
  const faqItems = $$(".faq__item");
  faqItems.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) faqItems.forEach((o) => { if (o !== d) o.open = false; });
    });
  });
})();
