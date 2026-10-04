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
     USD→CAD, last 5 years — single-series line chart (inline SVG)
  ------------------------------------------------------------------ */
  const FX_LINE = "#c58220";       // validated against the dark card surface
  const FX_SURFACE = "#0d1228";    // card surface, used for the 2px marker ring
  // Monthly averages of ECB reference rates, baked in as the offline fallback.
  const FX_HISTORY = [["2021-10",1.244],["2021-11",1.256],["2021-12",1.279],["2022-01",1.262],["2022-02",1.272],["2022-03",1.266],["2022-04",1.262],["2022-05",1.285],["2022-06",1.281],["2022-07",1.295],["2022-08",1.291],["2022-09",1.332],["2022-10",1.372],["2022-11",1.344],["2022-12",1.358],["2023-01",1.344],["2023-02",1.344],["2023-03",1.368],["2023-04",1.349],["2023-05",1.352],["2023-06",1.33],["2023-07",1.322],["2023-08",1.348],["2023-09",1.353],["2023-10",1.37],["2023-11",1.372],["2023-12",1.344],["2024-01",1.342],["2024-02",1.349],["2024-03",1.354],["2024-04",1.367],["2024-05",1.367],["2024-06",1.371],["2024-07",1.371],["2024-08",1.367],["2024-09",1.354],["2024-10",1.375],["2024-11",1.398],["2024-12",1.423],["2025-01",1.439],["2025-02",1.43],["2025-03",1.436],["2025-04",1.4],["2025-05",1.387],["2025-06",1.368],["2025-07",1.369],["2025-08",1.38],["2025-09",1.383],["2025-10",1.4],["2025-11",1.406],["2025-12",1.381],["2026-01",1.378],["2026-02",1.365],["2026-03",1.371],["2026-04",1.375],["2026-05",1.373],["2026-06",1.404],["2026-07",1.412],["2026-08",1.391],["2026-09",1.396],["2026-10",1.424]];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmtMonth = (ym) => { const [y, m] = ym.split("-"); return `${MONTHS[+m - 1]} ${y}`; };
  const fmtCad = (v) => `CA$${v.toFixed(2)}`;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs, text) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (text != null) el.textContent = text;
    return el;
  };

  const chartPlot = $("#fxChartPlot"), chartHead = $("#fxChartHeadline"),
        chartSub = $("#fxChartSub"), chartReadout = $("#fxChartReadout"),
        chartTbody = $("#fxChartTableBody");

  function monthlyAverages(ratesByDay) {
    const acc = new Map();
    for (const day of Object.keys(ratesByDay)) {
      const v = Number(ratesByDay[day] && ratesByDay[day].CAD);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !(v > 1 && v < 2)) continue;
      const ym = day.slice(0, 7);
      const a = acc.get(ym) || { s: 0, n: 0 };
      a.s += v; a.n++; acc.set(ym, a);
    }
    return Array.from(acc.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([ym, a]) => [ym, Math.round((a.s / a.n) * 1000) / 1000]);
  }

  let fxSeries = null;
  function renderFxChart(series) {
    if (!chartPlot || series.length < 2) return;
    fxSeries = series;
    // Size the drawing to the real pixel width so 11px labels stay 11px on every screen.
    const W = Math.max(280, Math.round(chartPlot.clientWidth || 340));
    const H = Math.round(Math.min(260, Math.max(190, W * 0.56)));
    const L = 44, R = 16, T = 30, B = 28;
    const n = series.length, vals = series.map((d) => d[1]);
    const first = vals[0], latest = vals[n - 1];
    const peak = Math.max(...vals), peakIdx = vals.indexOf(peak);
    const yMin = Math.floor((Math.min(...vals) - 0.02) * 20) / 20;
    const yMax = Math.ceil((peak + 0.02) * 20) / 20;
    const x = (i) => L + (i / (n - 1)) * (W - L - R);
    const y = (v) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);

    // Headline, computed from the data so it stays true as rates move.
    const pctUp = Math.round((latest / first - 1) * 100);
    const pctOff = Math.round(((peak - latest) / peak) * 100);
    const sinceTxt = `${fmtMonth(series[0][0])}`;
    let head;
    if (pctOff <= 0) head = "At a 5-year high.";
    else if (pctOff <= 5) head = `Within ${pctOff}% of a 5-year high.`;
    else head = `Up ${pctUp}% in five years.`;
    if (chartHead) chartHead.textContent = head;
    if (chartSub) {
      chartSub.textContent = "";
      chartSub.append("US$1 buys about ");
      const s = document.createElement("strong"); s.textContent = fmtCad(latest); chartSub.append(s);
      chartSub.append(` right now, up ${pctUp}% from ${fmtCad(first)} in ${sinceTxt}.`);
      if (pctOff > 0) chartSub.append(` The peak was ${fmtCad(peak)} in ${fmtMonth(series[peakIdx][0])}.`);
    }

    // Plot
    chartPlot.textContent = "";
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" });
    const defs = svgEl("defs", {});
    const grad = svgEl("linearGradient", { id: "fxWash", x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(svgEl("stop", { offset: "0%", "stop-color": FX_LINE, "stop-opacity": 0.22 }));
    grad.append(svgEl("stop", { offset: "100%", "stop-color": FX_LINE, "stop-opacity": 0 }));
    defs.append(grad); svg.append(defs);

    // Gridlines + y labels (recessive, hairline)
    const step = yMax - yMin > 0.25 ? 0.1 : 0.05;
    for (let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step) {
      const yy = y(v);
      svg.append(svgEl("line", { class: "fxchart__grid", x1: L, x2: W - R, y1: yy, y2: yy }));
      svg.append(svgEl("text", { x: L - 8, y: yy + 4, "text-anchor": "end" }, v.toFixed(2)));
    }
    // x labels: each January
    series.forEach((d, i) => {
      if (d[0].slice(5) === "01") svg.append(svgEl("text", { x: x(i), y: H - 8, "text-anchor": "middle" }, d[0].slice(0, 4)));
    });

    // Area wash + line
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    svg.append(svgEl("path", {
      d: `M${x(0).toFixed(1)},${(H - B).toFixed(1)} L${pts.join(" L")} L${x(n - 1).toFixed(1)},${(H - B).toFixed(1)} Z`,
      fill: "url(#fxWash)",
    }));
    svg.append(svgEl("path", {
      d: `M${pts.join(" L")}`, fill: "none", stroke: FX_LINE, "stroke-width": 2,
      "stroke-linejoin": "round", "stroke-linecap": "round",
    }));

    // Selective direct labels: start, peak, now
    const dot = (i, r) => svgEl("circle", { cx: x(i), cy: y(vals[i]), r, fill: FX_LINE, stroke: FX_SURFACE, "stroke-width": 2 });
    svg.append(svgEl("text", { class: "fxchart__lbl", x: x(0), y: y(first) - 10, "text-anchor": "start" }, fmtCad(first)));
    svg.append(dot(0, 4));
    if (peakIdx !== n - 1) {
      const anchor = x(peakIdx) > W * 0.7 ? "end" : x(peakIdx) < W * 0.3 ? "start" : "middle";
      svg.append(svgEl("text", { class: "fxchart__lbl fxchart__lbl--peak", x: x(peakIdx), y: y(peak) - 10, "text-anchor": anchor },
        `5-yr high · ${fmtCad(peak)}`));
      svg.append(dot(peakIdx, 4));
    }
    const nowAbove = y(latest) - 24 > T || peakIdx === n - 1;
    svg.append(svgEl("text", { class: "fxchart__lbl", x: x(n - 1), y: nowAbove && Math.abs(y(latest) - y(peak)) > 22 ? y(latest) - 12 : y(latest) + 20, "text-anchor": "end" },
      peakIdx === n - 1 ? `${fmtCad(latest)} · 5-yr high` : `${fmtCad(latest)} now`));
    svg.append(dot(n - 1, 5));

    // Hover layer: crosshair snaps to nearest month; readout sits below the plot.
    const xhair = svgEl("line", { class: "fxchart__xhair", x1: 0, x2: 0, y1: T - 6, y2: H - B, visibility: "hidden" });
    const focusDot = svgEl("circle", { r: 6, fill: FX_LINE, stroke: FX_SURFACE, "stroke-width": 2, visibility: "hidden" });
    svg.append(xhair, focusDot);
    chartPlot.append(svg);

    let active = -1;
    const defaultReadout = "Tap or hover the line to see any month.";
    function setActive(i) {
      active = Math.max(0, Math.min(n - 1, i));
      const xx = x(active), v = vals[active];
      xhair.setAttribute("x1", xx); xhair.setAttribute("x2", xx);
      focusDot.setAttribute("cx", xx); focusDot.setAttribute("cy", y(v));
      xhair.setAttribute("visibility", "visible"); focusDot.setAttribute("visibility", "visible");
      if (chartReadout) {
        chartReadout.textContent = "";
        const s = document.createElement("strong"); s.textContent = fmtCad(v);
        chartReadout.append(s, ` · ${fmtMonth(series[active][0])} · US$100 → CA$${Math.round(v * 100)}`);
      }
    }
    function clearActive() {
      active = -1;
      xhair.setAttribute("visibility", "hidden"); focusDot.setAttribute("visibility", "hidden");
      if (chartReadout) chartReadout.textContent = defaultReadout;
    }
    function fromPointer(ev) {
      const rect = svg.getBoundingClientRect();
      const px = ((ev.clientX - rect.left) / rect.width) * W;
      setActive(Math.round(((px - L) / (W - L - R)) * (n - 1)));
    }
    chartPlot.onpointermove = fromPointer;
    chartPlot.onpointerdown = fromPointer;
    chartPlot.onpointerleave = clearActive;
    chartPlot.onblur = clearActive;
    chartPlot.onkeydown = (ev) => {
      const k = ev.key;
      if (k === "ArrowLeft" || k === "ArrowRight") { ev.preventDefault(); setActive((active < 0 ? n - 1 : active) + (k === "ArrowLeft" ? -1 : 1)); }
      else if (k === "Home") { ev.preventDefault(); setActive(0); }
      else if (k === "End") { ev.preventDefault(); setActive(n - 1); }
      else if (k === "Escape") clearActive();
    };
    if (chartReadout) chartReadout.textContent = defaultReadout;

    // Table view (the no-hover path to every value)
    if (chartTbody) {
      chartTbody.textContent = "";
      for (const [ym, v] of series) {
        const tr = document.createElement("tr");
        const a = document.createElement("td"); a.textContent = fmtMonth(ym);
        const b = document.createElement("td"); b.textContent = v.toFixed(3);
        tr.append(a, b); chartTbody.append(tr);
      }
    }
  }

  renderFxChart(FX_HISTORY);
  if (chartPlot && "ResizeObserver" in window) {
    let lastW = chartPlot.clientWidth, rsTimer = 0;
    new ResizeObserver(() => {
      const w = chartPlot.clientWidth;
      if (!w || Math.abs(w - lastW) < 8) return;
      lastW = w;
      clearTimeout(rsTimer);
      rsTimer = setTimeout(() => renderFxChart(fxSeries || FX_HISTORY), 120);
    }).observe(chartPlot);
  }

  // Refresh the history from the same ECB feed; keep the baked data on any failure.
  (async () => {
    if (!chartPlot) return;
    try {
      const end = new Date(), start = new Date(end);
      start.setFullYear(start.getFullYear() - 5);
      const iso = (d) => d.toISOString().slice(0, 10);
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`https://api.frankfurter.dev/v1/${iso(start)}..${iso(end)}?base=USD&symbols=CAD`, { signal: ctrl.signal });
      clearTimeout(tm);
      if (!res.ok) return;
      const data = await res.json();
      const series = monthlyAverages((data && data.rates) || {});
      if (series.length >= 24) renderFxChart(series);
    } catch (_) { /* keep baked history */ }
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
