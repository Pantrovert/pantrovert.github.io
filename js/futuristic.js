(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- Nav ---------- */
  const burger = $('.burger'), nav = $('.nav');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));

  const sections = $$('main section[id]').filter(s => $(`.nav a[href="#${s.id}"]`));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) $$('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  }
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Sky + altitude HUD ---------- */
  const stops = [[0, [16, 64, 94]], [.35, [10, 42, 66]], [.7, [5, 15, 26]], [1, [1, 4, 9]]];
  const skyAt = p => {
    for (let i = 1; i < stops.length; i++) {
      if (p <= stops[i][0]) {
        const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (p - a) / (b - a);
        return ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
      }
    }
    return stops[stops.length - 1][1];
  };
  const layerAt = m => m < 12000 ? 'Troposphere' : m < 50000 ? 'Stratosphere' : m < 85000 ? 'Mesosphere' : m < 99500 ? 'Thermosphere' : 'Kármán line';
  const altV = $('#altV'), machV = $('#machV'), layerV = $('#layerV'), tape = $('#tape');
  let progress = 0, scrollY = window.scrollY, lastY = scrollY, vel = 0;

  const readScroll = () => {
    scrollY = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    root.style.setProperty('--sky', `rgb(${skyAt(progress).join(',')})`);
    root.style.setProperty('--glow', String(clamp(1 - progress * 1.4, 0, 1)));
    const alt = Math.round(progress * 100000);
    altV.textContent = alt.toLocaleString('en-US') + ' m';
    layerV.textContent = layerAt(alt);
    const y = Math.round(scrollY * 0.5);
    tape.style.backgroundPosition = `100% ${y}px, 100% ${y}px`;
  };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);

  /* ---------- Stars ---------- */
  const sc = $('#stars'), sx = sc.getContext('2d');
  let stars = [], sw = 0, sh = 0;
  const initStars = () => {
    sw = innerWidth; sh = innerHeight;
    sc.width = sw * dpr; sc.height = sh * dpr;
    stars = Array.from({ length: Math.round(sw * sh / 7000) }, () => ({
      x: Math.random() * sw, y: Math.random() * sh,
      r: Math.random() * 1.2 + .3, z: Math.random() * .9 + .1, tw: Math.random() * 6.28
    }));
  };
  const drawStars = t => {
    const op = clamp((progress - .1) / .5, 0, 1);
    sc.style.opacity = op;
    if (op < .01) return;
    sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sx.clearRect(0, 0, sw, sh);
    for (const s of stars) {
      const y = (((s.y - scrollY * s.z * .18) % sh) + sh) % sh;
      const a = .35 + .65 * (reduce ? .6 : .5 + .5 * Math.sin(t * .0015 + s.tw));
      sx.globalAlpha = a * s.z;
      sx.fillStyle = '#E4F0FC';
      sx.beginPath(); sx.arc(s.x, y, s.r, 0, 6.283); sx.fill();
    }
    sx.globalAlpha = 1;
  };
  initStars();
  addEventListener('resize', initStars);

  /* ---------- Rotor (hero) ---------- */
  const hero = $('#home'), rc = $('#rotor'), rx = rc.getContext('2d');
  const rpmV = $('#rpmV'), bpfV = $('#bpfV');
  let rpmTarget = 150, rpm = reduce ? 150 : 0, theta = .4, heroVisible = true, tt = 0, trail = [];
  const sizeRotor = () => { const r = rc.getBoundingClientRect(); rc.width = Math.round(r.width * dpr); rc.height = Math.round(r.height * dpr); };
  sizeRotor(); addEventListener('resize', sizeRotor);

  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    rpmTarget = 60 + clamp((e.clientX - r.left) / r.width, 0, 1) * 380;
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe(hero);

  const drawBlades = (cx, cy, R, ang, alpha, tip) => {
    for (let i = 0; i < 4; i++) {
      const flex = Math.sin(tt * 9 + i * 1.7) * R * .022 * (rpm / 300);
      rx.save(); rx.translate(cx, cy); rx.rotate(ang + i * Math.PI / 2);
      rx.beginPath();
      rx.moveTo(R * .09, -R * .035); rx.lineTo(R * .97, -R * .012 + flex);
      rx.lineTo(R, R * .012 + flex); rx.lineTo(R * .09, R * .035); rx.closePath();
      rx.fillStyle = `rgba(228,240,252,${alpha * .5})`; rx.fill();
      rx.strokeStyle = `rgba(228,240,252,${alpha})`; rx.lineWidth = dpr; rx.stroke();
      if (tip) { rx.fillStyle = '#FFC857'; rx.beginPath(); rx.arc(R, flex, 4 * dpr, 0, 6.283); rx.fill(); }
      rx.restore();
    }
  };

  const drawRotor = dt => {
    const W = rc.width, H = rc.height, cx = W / 2, cy = H / 2, R = W * .46;
    rx.clearRect(0, 0, W, H);
    rx.lineWidth = dpr;
    rx.strokeStyle = 'rgba(228,240,252,.15)';
    [.25, .5, .75, 1.04].forEach(f => { rx.beginPath(); rx.arc(cx, cy, R * f, 0, 6.283); rx.stroke(); });
    for (let d = 0; d < 360; d += 10) {
      const a = d * Math.PI / 180, major = d % 90 === 0, r1 = R * 1.07, r2 = R * (major ? 1.15 : 1.11);
      rx.beginPath(); rx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); rx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      rx.strokeStyle = major ? 'rgba(255,200,87,.7)' : 'rgba(228,240,252,.25)'; rx.stroke();
    }
    rx.save(); rx.setLineDash([4 * dpr, 9 * dpr]); rx.strokeStyle = 'rgba(255,200,87,.45)';
    rx.beginPath(); rx.arc(cx, cy, R, 0, 6.283); rx.stroke(); rx.restore();

    const dTheta = rpm * 2 * Math.PI / 60 * dt;
    if (dTheta > .02) for (let k = 11; k >= 1; k--) drawBlades(cx, cy, R, theta - k * dTheta * .55, .5 * Math.pow(1 - k / 12, 1.8), false);
    drawBlades(cx, cy, R, theta, .95, true);

    // hub + 1P vibration trace (the hub wobbles once per revolution)
    const amp = (2 + rpm / 70) * dpr, hx = cx + Math.cos(theta * 1) * amp, hy = cy + Math.sin(theta * 1) * amp;
    trail.push([hx, hy]); if (trail.length > 36) trail.shift();
    rx.beginPath(); trail.forEach(([x, y], i) => i ? rx.lineTo(x, y) : rx.moveTo(x, y));
    rx.strokeStyle = 'rgba(255,200,87,.6)'; rx.stroke();
    rx.fillStyle = '#08121b'; rx.beginPath(); rx.arc(cx, cy, R * .07, 0, 6.283); rx.fill();
    rx.strokeStyle = '#FFC857'; rx.lineWidth = 2 * dpr; rx.stroke();
    rx.fillStyle = '#FFC857'; rx.beginPath(); rx.arc(hx, hy, 3.5 * dpr, 0, 6.283); rx.fill();
  };

  /* ---------- Main loop ---------- */
  let prev = performance.now(), hudT = 0;
  const frame = now => {
    const dt = Math.min((now - prev) / 1000, .05); prev = now;
    // airspeed from scroll velocity
    const inst = dt > 0 ? (scrollY - lastY) / dt : 0; lastY = scrollY;
    vel += (inst - vel) * Math.min(1, dt * 6);
    hudT += dt;
    if (hudT > .08) { machV.textContent = 'Mach ' + clamp(Math.abs(vel) / 900, 0, 5).toFixed(1); hudT = 0; }

    if (heroVisible && !reduce) {
      rpm += (rpmTarget - rpm) * Math.min(1, dt * 1.6);
      theta += rpm * 2 * Math.PI / 60 * dt; tt += dt;
      drawRotor(dt);
      rpmV.textContent = Math.round(rpm);
      bpfV.textContent = (rpm / 60 * 4).toFixed(1);
    }
    if (!reduce) drawStars(now);
    requestAnimationFrame(frame);
  };
  readScroll();
  if (reduce) { drawRotor(0); drawStars(0); rpmV.textContent = rpm; bpfV.textContent = (rpm / 60 * 4).toFixed(1); addEventListener('scroll', () => drawStars(0), { passive: true }); }
  else requestAnimationFrame(frame);

  /* ---------- Project preview that follows the pointer ---------- */
  const peek = $('#peek'), peekImg = $('img', peek);
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.prow').forEach(row => {
      row.addEventListener('pointerenter', () => { peekImg.src = row.dataset.img; peek.classList.add('on'); });
      row.addEventListener('pointerleave', () => peek.classList.remove('on'));
      row.addEventListener('pointermove', e => {
        const w = peek.offsetWidth, h = peek.offsetHeight;
        let x = e.clientX + 32; if (x + w > innerWidth - 12) x = e.clientX - w - 32;
        const y = clamp(e.clientY - h / 2, 12, innerHeight - h - 12);
        peek.style.transform = `translate(${x}px,${y}px)`;
      });
    });
  }

  /* ---------- Radar ---------- */
  const blips = $$('.blip'), panelT = $('#panelT'), panelP = $('#panelP');
  const pick = b => {
    blips.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    panelT.textContent = b.dataset.t; panelP.textContent = b.dataset.p;
  };
  blips.forEach(b => { b.addEventListener('click', () => pick(b)); b.addEventListener('pointerenter', () => pick(b)); b.addEventListener('focus', () => pick(b)); });
})();
