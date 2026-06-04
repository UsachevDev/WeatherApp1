/* =========================================================================
 * Weather FX — a lightweight canvas particle system that reacts to the
 * current condition (rain, drizzle, snow, thunder, clear night stars,
 * drifting clouds, fog). Driven by createWeatherFX().set(group, isDay).
 * ========================================================================= */

export function createWeatherFX(canvas) {
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let cw = 0, ch = 0, dpr = 1;
  let particles = [];
  let mode = "clear";
  let isDay = true;
  let raf = null;
  let last = 0;
  let flash = 0;          // lightning brightness 0..1
  let nextBolt = 2 + Math.random() * 4;

  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- particle factories (CSS-pixel space) ---------- */
  const rainDrop = (heavy) => ({
    x: rand(-40, cw),
    y: rand(-ch, ch),
    len: rand(heavy ? 14 : 8, heavy ? 26 : 16),
    vy: rand(heavy ? 900 : 520, heavy ? 1300 : 780),
    vx: rand(-60, -20),
    a: rand(0.25, 0.55),
  });
  const snowFlake = () => ({
    x: rand(0, cw),
    y: rand(-ch, ch),
    r: rand(1.2, 3.4),
    vy: rand(24, 70),
    sway: rand(8, 26),
    phase: rand(0, Math.PI * 2),
    a: rand(0.5, 0.95),
  });
  const star = () => ({
    x: rand(0, cw),
    y: rand(0, ch * 0.7),
    r: rand(0.5, 1.6),
    tw: rand(0.6, 2.4),
    phase: rand(0, Math.PI * 2),
  });
  const cloud = () => ({
    x: rand(-0.2 * cw, cw),
    y: rand(0, ch * 0.5),
    s: rand(0.6, 1.6),
    vx: rand(6, 20) * (Math.random() < 0.5 ? -1 : 1),
    a: rand(0.05, 0.14),
  });

  function build() {
    particles = [];
    if (reduce) return;
    const area = cw * ch;
    if (mode === "rain" || mode === "thunder" || mode === "drizzle") {
      const heavy = mode !== "drizzle";
      const n = Math.min(heavy ? 320 : 170, Math.round(area / 4200));
      for (let i = 0; i < n; i++) particles.push(rainDrop(heavy));
    } else if (mode === "snow") {
      const n = Math.min(220, Math.round(area / 6500));
      for (let i = 0; i < n; i++) particles.push(snowFlake());
    } else if (mode === "clear" && !isDay) {
      const n = Math.min(180, Math.round(area / 8500));
      for (let i = 0; i < n; i++) particles.push(star());
    } else if (mode === "clouds" || mode === "fog") {
      const n = mode === "fog" ? 8 : 5;
      for (let i = 0; i < n; i++) particles.push(cloud());
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  /* ---------- drawing ---------- */
  function drawCloud(c) {
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 220 * c.s);
    g.addColorStop(0, `rgba(255,255,255,${c.a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 220 * c.s, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((t - last) / 1000 || 0, 0.05);
    last = t;
    ctx.clearRect(0, 0, cw, ch);

    if (mode === "rain" || mode === "thunder" || mode === "drizzle") {
      ctx.lineCap = "round";
      ctx.lineWidth = mode === "drizzle" ? 1 : 1.4;
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > ch + 20) { p.y = rand(-60, -10); p.x = rand(-40, cw); }
        if (p.x < -50) p.x = cw + 20;
        ctx.strokeStyle = `rgba(190,210,235,${p.a})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.02, p.y + p.len);
        ctx.stroke();
      }
      if (mode === "thunder") {
        nextBolt -= dt;
        if (nextBolt <= 0) { flash = 1; nextBolt = rand(2.5, 7); }
        if (flash > 0) {
          ctx.fillStyle = `rgba(220,225,255,${flash * 0.5})`;
          ctx.fillRect(0, 0, cw, ch);
          flash = Math.max(0, flash - dt * 3.2);
        }
      }
    } else if (mode === "snow") {
      for (const p of particles) {
        p.phase += dt;
        p.y += p.vy * dt;
        p.x += Math.sin(p.phase) * p.sway * dt;
        if (p.y > ch + 6) { p.y = -6; p.x = rand(0, cw); }
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mode === "clear" && !isDay) {
      for (const p of particles) {
        p.phase += dt * p.tw;
        const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(p.phase));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mode === "clouds" || mode === "fog") {
      for (const p of particles) {
        p.x += p.vx * dt;
        if (p.x > cw + 260) p.x = -260;
        if (p.x < -260) p.x = cw + 260;
        drawCloud(p);
      }
    }
  }

  function start() {
    if (reduce) { renderStaticFrame(); return; }
    if (raf == null) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function stop() {
    if (raf != null) { cancelAnimationFrame(raf); raf = null; }
  }
  function renderStaticFrame() {
    ctx.clearRect(0, 0, cw, ch);
    if (mode === "clear" && !isDay) {
      for (const p of particles) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    } else if (mode === "clouds" || mode === "fog") {
      for (const p of particles) drawCloud(p);
    }
  }

  /* ---------- public API ---------- */
  function set(group, day) {
    mode = group || "clear";
    isDay = !!day;
    build();
    if (reduce) renderStaticFrame();
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
  start();
  return { set, resize, start, stop };
}
