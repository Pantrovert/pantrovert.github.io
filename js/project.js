/* Interactive physics panels for the project pages. Each demo is a small, honest model of the topic. */
(() => {
  const { $, clamp, reduce, dpr } = window.Climb;
  const panel = $('#demo'); if (!panel) return;
  const cv = $('canvas', panel), g = cv.getContext('2d'), hud = $('#hud');
  const kind = document.body.dataset.demo;
  const ICE = a => `rgba(228,240,252,${a})`, AMBER = '#FFC857', ION = '#6FB7FF';
  const mix = (a, b, t) => a + (b - a) * t;
  const ptr = { x: .5, y: .5 };
  let W = 0, H = 0;
  const fit = () => { const r = cv.getBoundingClientRect(); W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr); };
  fit(); addEventListener('resize', fit);
  panel.addEventListener('pointermove', e => { const r = panel.getBoundingClientRect(); ptr.x = clamp((e.clientX - r.left) / r.width, 0, 1); ptr.y = clamp((e.clientY - r.top) / r.height, 0, 1); });
  const setHud = rows => { hud.innerHTML = rows.map(([k, v, amber]) => `<span>${k} <b class="${amber ? 'amber' : ''}">${v}</b></span>`).join(''); };
  const text = (s, x, y, a = 'left', col = ICE(.55)) => { g.font = `${10 * dpr}px "Martian Mono",monospace`; g.textAlign = a; g.fillStyle = col; g.fillText(s, x, y); };

  /* ---------- Airfoil: streamlines around a cambered 10% section ---------- */
  const airfoil = () => {
    const T = .10, M = .015, P = .4, N = 280;
    const yt = x => 5 * T * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1015 * x ** 4);
    const yc = x => x < P ? M / (P * P) * (2 * P * x - x * x) : M / ((1 - P) ** 2) * ((1 - 2 * P) + 2 * P * x - x * x);
    let alpha = 4, ps = [];
    const spawn = (p, anywhere) => { p.x = anywhere ? Math.random() * W : -10; p.y = H * (.1 + Math.random() * .8); p.h = []; };
    for (let i = 0; i < N; i++) { const p = {}; spawn(p, true); ps.push(p); }
    return dt => {
      const tA = -4 + (1 - ptr.y) * 20; alpha += (tA - alpha) * Math.min(1, dt * 3);
      const a = alpha * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      const c = W * .5, ox = W * .5, oy = H * .5, U = W * .38;
      const cl = (2 * Math.PI * a + .13) * (alpha > 14 ? Math.max(.55, 1 - (alpha - 14) * .08) : 1), stall = alpha > 14;
      const tc = (x, y) => { const dx = (x - .25) * c, dy = -y * c; return [ox + dx * ca - dy * sa, oy + dx * sa + dy * ca]; };
      const src = []; for (let i = 0; i <= 24; i++) { const x = i / 24; const [px, py] = tc(x, yc(x)); src.push([px, py, yt(x)]); }
      const [vx0, vy0] = tc(.25, 0), G = U * c * .13 * cl;
      g.clearRect(0, 0, W, H);
      g.lineWidth = dpr;
      for (const p of ps) {
        let vx = U, vy = 0;
        for (const [sx, sy, th] of src) { const dx = p.x - sx, dy = p.y - sy, r2 = dx * dx + dy * dy + (c * .02) ** 2, k = U * c * (.0035 + th * .07); vx += k * dx / r2; vy += k * dy / r2; }
        const dx = p.x - vx0, dy = p.y - vy0, r2 = dx * dx + dy * dy + (c * .05) ** 2;
        vx += G * -dy / r2; vy += G * dx / r2;
        if (stall && p.x > ox && p.y < oy) vy += (Math.random() - .5) * U * 1.4;
        const sp = Math.hypot(vx, vy); if (sp > U * 3) { vx *= U * 3 / sp; vy *= U * 3 / sp; }
        p.h.push([p.x, p.y, sp / U]); if (p.h.length > 9) p.h.shift();
        p.x += vx * dt; p.y += vy * dt;
        const u = (p.x - ox) * ca + (p.y - oy) * sa, v = -(p.x - ox) * sa + (p.y - oy) * ca, x = u / c + .25, y = -v / c;
        if (p.x > W + 10 || p.y < -20 || p.y > H + 20 || (x > 0 && x < 1 && Math.abs(y - yc(x)) < yt(x) + .004)) spawn(p, false);
        for (let i = 1; i < p.h.length; i++) {
          const [x1, y1] = p.h[i - 1], [x2, y2, s] = p.h[i], t = clamp((s - 1) / .6, 0, 1);
          g.strokeStyle = `rgba(${Math.round(mix(111, 255, t))},${Math.round(mix(183, 200, t))},${Math.round(mix(255, 87, t))},${i / p.h.length * .75})`;
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        }
      }
      g.beginPath();
      for (let i = 0; i <= 40; i++) { const x = (1 - Math.cos(Math.PI * i / 40)) / 2, [px, py] = tc(x, yc(x) + yt(x)); i ? g.lineTo(px, py) : g.moveTo(px, py); }
      for (let i = 40; i >= 0; i--) { const x = (1 - Math.cos(Math.PI * i / 40)) / 2, [px, py] = tc(x, yc(x) - yt(x)); g.lineTo(px, py); }
      g.closePath(); g.fillStyle = 'rgba(3,10,17,.92)'; g.fill(); g.strokeStyle = ICE(.9); g.lineWidth = 1.5 * dpr; g.stroke();
      g.setLineDash([4 * dpr, 6 * dpr]); g.strokeStyle = ICE(.3); g.beginPath(); const [l1, l2] = tc(0, 0), [t1, t2] = tc(1, 0); g.moveTo(l1, l2); g.lineTo(t1, t2); g.stroke(); g.setLineDash([]);
      g.fillStyle = AMBER; g.beginPath(); g.arc(vx0, vy0, 3.5 * dpr, 0, 6.283); g.fill();
      setHud([['Angle of attack', alpha.toFixed(1) + '°'], ['Lift coefficient', cl.toFixed(2), true], [stall ? 'Flow separated' : 'Flow attached', stall ? 'stall' : 'ok']]);
    };
  };

  /* ---------- Hypersonic: Mach cone, shock heating ---------- */
  const hyper = () => {
    let Mach = 3, rings = [], acc = 0;
    return dt => {
      const tM = .6 + Math.pow(ptr.x, 1.2) * 9.4; Mach += (tM - Mach) * Math.min(1, dt * 3);
      const a = W * .14, V = Mach * a, cy = H * .5, nx = W * .74;
      const T0 = 217 * (1 + .2 * Mach * Mach), mu = Mach > 1 ? Math.asin(1 / Mach) : 0;
      acc += dt; if (acc > .09) { rings.push({ x: nx, r: 0 }); acc = 0; }
      rings.forEach(r => { r.x -= V * dt; r.r += a * dt; }); rings = rings.filter(r => r.r < W * .8 && r.x > -W * .5);
      g.clearRect(0, 0, W, H); g.lineWidth = dpr;
      rings.forEach(r => { g.strokeStyle = ION_A(clamp(1 - r.r / (W * .55), 0, 1) * .55); g.beginPath(); g.arc(r.x, cy, r.r, 0, 6.283); g.stroke(); });
      if (Mach > 1.02) {
        g.strokeStyle = AMBER; g.lineWidth = 1.6 * dpr; const L = nx * .98, d = Math.tan(mu) * L;
        g.beginPath(); g.moveTo(nx - L, cy - d); g.lineTo(nx, cy); g.lineTo(nx - L, cy + d); g.stroke();
      }
      const glowR = (22 + clamp((T0 - 200) / 4400, 0, 1) * 170) * dpr, gr = g.createRadialGradient(nx, cy, 0, nx, cy, glowR);
      gr.addColorStop(0, `rgba(255,${Math.round(mix(230, 120, clamp(T0 / 4600, 0, 1)))},${Math.round(mix(180, 40, clamp(T0 / 4600, 0, 1)))},.75)`); gr.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(nx, cy, glowR, 0, 6.283); g.fill();
      const L = W * .26, hh = H * .045;
      g.beginPath(); g.moveTo(nx, cy); g.lineTo(nx - L, cy - hh); g.lineTo(nx - L, cy + hh); g.closePath();
      g.fillStyle = 'rgba(3,10,17,.95)'; g.fill(); g.strokeStyle = ICE(.95); g.lineWidth = 1.5 * dpr; g.stroke();
      const regime = Mach < .8 ? 'subsonic' : Mach < 1.2 ? 'transonic' : Mach < 5 ? 'supersonic' : 'hypersonic';
      setHud([['Mach', Mach.toFixed(1), true], ['Mach angle', Mach > 1 ? (mu * 180 / Math.PI).toFixed(0) + '°' : 'none'], ['Nose stagnation temp', Math.round(T0).toLocaleString('en-US') + ' K'], [regime, '']]);
    };
  };
  const ION_A = a => `rgba(111,183,255,${a})`;

  /* ---------- Vibration: spring and a mass that gets lighter ---------- */
  const varmass = () => {
    const k = (2 * Math.PI * .9) ** 2, c = .12, MMIN = .22;
    let x = .6, v = 0, m = 1, phase = 'burn', hold = 0, buf = [], drops = [];
    panel.addEventListener('pointerdown', () => { v += 2.2; });
    return dt => {
      const rate = .04 + ptr.x * .3;
      if (phase === 'burn') { m -= rate * dt; if (m <= MMIN) { m = MMIN; phase = 'hold'; hold = 2.2; } if (Math.random() < rate * 60 * dt) drops.push({ y: 0, v: 40 + Math.random() * 40, a: 1 }); }
      else if (phase === 'hold') { hold -= dt; if (hold <= 0) phase = 'fill'; }
      else { m += .7 * dt; if (m >= 1) { m = 1; phase = 'burn'; x += .55; } }
      const n = 6, h = dt / n; for (let i = 0; i < n; i++) { const acc = (-c * v - k * x) / m; v += acc * h; x += v * h; }
      buf.push(x); const keep = Math.floor(W * .62 / (2 * dpr)); if (buf.length > keep) buf.splice(0, buf.length - keep);
      g.clearRect(0, 0, W, H); g.lineWidth = 1.5 * dpr;
      const ax = W * .15, ceil = H * .14, eq = H * .55, bw = W * .13, bh = H * .06 + m * H * .13, cyb = eq + x * H * .2, top = cyb - bh / 2;
      g.strokeStyle = ICE(.6); g.beginPath(); g.moveTo(ax - bw * .8, ceil); g.lineTo(ax + bw * .8, ceil); g.stroke();
      g.beginPath(); g.moveTo(ax, ceil); const segs = 11; for (let i = 1; i <= segs; i++) { const yy = ceil + (top - ceil) * i / (segs + 1); g.lineTo(ax + (i % 2 ? 1 : -1) * W * .03, yy); } g.lineTo(ax, top); g.stroke();
      g.fillStyle = 'rgba(3,10,17,.92)'; g.fillRect(ax - bw / 2, top, bw, bh); g.strokeStyle = ICE(.9); g.strokeRect(ax - bw / 2, top, bw, bh);
      drops.forEach(d => { d.y += d.v * dt * dpr; d.a -= dt * .8; g.fillStyle = `rgba(255,200,87,${Math.max(d.a, 0)})`; g.beginPath(); g.arc(ax + (Math.random() - .5) * bw * .5, cyb + bh / 2 + d.y, 2.5 * dpr, 0, 6.283); g.fill(); }); drops = drops.filter(d => d.a > 0);
      g.setLineDash([4 * dpr, 6 * dpr]); g.strokeStyle = ICE(.25); g.beginPath(); g.moveTo(ax - bw, eq); g.lineTo(ax + bw, eq); g.stroke(); g.setLineDash([]);
      const x0 = W * .34, gw = W * .62, my = H * .5; g.strokeStyle = ICE(.2); g.beginPath(); g.moveTo(x0, my); g.lineTo(x0 + gw, my); g.stroke();
      g.strokeStyle = ION; g.lineWidth = 1.6 * dpr; g.beginPath(); buf.forEach((b, i) => { const px = x0 + gw - (buf.length - 1 - i) * 2 * dpr, py = my + b * H * .25; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
      text('displacement over time', x0, H * .12);
      const wn = Math.sqrt(k / m); setHud([['Mass', (m * 100).toFixed(0) + '%', true], ['Natural frequency', (wn / (2 * Math.PI)).toFixed(2) + ' Hz'], [phase === 'burn' ? 'Losing mass' : phase === 'hold' ? 'Light' : 'Refilling', '']]);
    };
  };

  /* ---------- Helicopter: tail-boom resonance vs rotor speed ---------- */
  const heli = () => {
    let rpm = 250, tt = 0; const fn = 14, zeta = .06, B = 1.875, sig = .7341;
    const phi = s => { const b = B * s; return (Math.cosh(b) - Math.cos(b)) - sig * (Math.sinh(b) - Math.sin(b)); };
    const gain = f => 1 / Math.sqrt((1 - (f / fn) ** 2) ** 2 + (2 * zeta * f / fn) ** 2);
    const harm = [['1P', 1, .35], ['2P', 2, .2], ['4P', 4, 1]];
    return dt => {
      rpm += ((120 + ptr.x * 380) - rpm) * Math.min(1, dt * 3); tt += dt * .12;
      const f1 = rpm / 60;
      let tip = 0; harm.forEach(([, n, amp]) => { const f = n * f1; tip += amp * Math.min(gain(f), 12) * Math.sin(2 * Math.PI * f * tt); });
      const tipN = clamp(tip / 12, -1, 1), x0 = W * .2, x1 = W * .92, y0 = H * .26, L = x1 - x0, tipPhi = phi(1);
      g.clearRect(0, 0, W, H);
      g.strokeStyle = ICE(.3); g.lineWidth = dpr; g.beginPath(); g.ellipse(x0, y0 - H * .1, W * .12, H * .03, 0, 0, 6.283); g.stroke();
      g.strokeStyle = ICE(.5); g.beginPath(); g.moveTo(x0, y0 - H * .1); g.lineTo(x0, y0); g.stroke();
      g.strokeStyle = ICE(.95); g.lineWidth = 7 * dpr; g.lineCap = 'round'; g.beginPath();
      for (let i = 0; i <= 40; i++) { const s = i / 40, px = x0 + s * L, py = y0 + (phi(s) / tipPhi) * tipN * H * .16; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.lineCap = 'butt';
      g.fillStyle = 'rgba(3,10,17,.95)'; g.beginPath(); g.arc(x0, y0, 16 * dpr, 0, 6.283); g.fill(); g.strokeStyle = AMBER; g.lineWidth = 2 * dpr; g.stroke();
      [.4, .7, 1].forEach(s => { g.fillStyle = AMBER; g.beginPath(); g.arc(x0 + s * L, y0 + (phi(s) / tipPhi) * tipN * H * .16, 4 * dpr, 0, 6.283); g.fill(); });
      text('tail boom, slowed to 12% speed', x0, H * .08);
      const bx0 = W * .08, bx1 = W * .94, base = H * .9, fx = f => bx0 + f / 40 * (bx1 - bx0);
      g.strokeStyle = ICE(.3); g.lineWidth = dpr; g.beginPath(); g.moveTo(bx0, base); g.lineTo(bx1, base); g.stroke();
      g.setLineDash([4 * dpr, 6 * dpr]); g.strokeStyle = AMBER; g.beginPath(); g.moveTo(fx(fn), base); g.lineTo(fx(fn), H * .52); g.stroke(); g.setLineDash([]);
      text('boom natural frequency', fx(fn) + 6 * dpr, H * .55, 'left', AMBER);
      harm.forEach(([label, n, amp]) => {
        const f = n * f1; if (f > 40) return; const h = clamp(amp * gain(f) / 12, .02, 1) * H * .3, hot = n === 4 && Math.abs(f - fn) < 2.5;
        g.fillStyle = hot ? AMBER : ION; g.fillRect(fx(f) - 5 * dpr, base - h, 10 * dpr, h); text(label, fx(f), base + 14 * dpr, 'center');
      });
      text('frequency, Hz', bx1, base + 14 * dpr, 'right');
      const f4 = 4 * f1, risk = Math.abs(f4 - fn) < 2.5;
      setHud([['Rotor', Math.round(rpm) + ' rpm'], ['4P forcing', f4.toFixed(1) + ' Hz'], ['Boom response at 4P', '×' + Math.min(gain(f4), 99).toFixed(1), risk], [risk ? 'Resonance risk' : 'Clear of resonance', '']]);
    };
  };

  const step = { airfoil, hyper, varmass, heli }[kind]; if (!step) return;
  const run = step();
  if (reduce) {
    // Reduced-motion: no autoplay, but the panel still responds while the person hovers or touches it.
    for (let i = 0; i < 120; i++) run(.016);
    let live = false, last = 0;
    const loop = now => { if (!live) return; run(Math.min((now - last) / 1000, .05)); last = now; requestAnimationFrame(loop); };
    const start = () => { if (live) return; live = true; last = performance.now(); requestAnimationFrame(loop); };
    panel.addEventListener('pointerenter', start);
    panel.addEventListener('pointerdown', start);
    panel.addEventListener('pointerleave', () => { live = false; });
  } else window.Climb.hooks.push((dt) => run(dt));
})();
