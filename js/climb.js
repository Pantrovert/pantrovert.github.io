/* Shared "climb" behaviour: sky colour, stars, altitude rail, nav. Pages add per-frame work via Climb.hooks. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const root = document.documentElement;
  const Climb = window.Climb = { $, $$, clamp, reduce, dpr, hooks: [] };

  const burger = $('.burger'), nav = $('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  const stops = [[0, [16, 64, 94]], [.35, [10, 42, 66]], [.7, [5, 15, 26]], [1, [1, 4, 9]]];
  const skyAt = p => {
    for (let i = 1; i < stops.length; i++) if (p <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (p - a) / (b - a);
      return ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
    }
    return stops[3][1];
  };
  const layerAt = m => m < 12000 ? 'Troposphere' : m < 50000 ? 'Stratosphere' : m < 85000 ? 'Mesosphere' : m < 99500 ? 'Thermosphere' : 'Kármán line';
  const altV = $('#altV'), machV = $('#machV'), layerV = $('#layerV'), tape = $('#tape');
  let progress = 0, scrollY = window.scrollY, lastY = window.scrollY, vel = 0;

  const readScroll = () => {
    scrollY = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    root.style.setProperty('--sky', `rgb(${skyAt(progress).join(',')})`);
    root.style.setProperty('--glow', String(clamp(1 - progress * 1.4, 0, 1)));
    const alt = Math.round(progress * 100000);
    if (altV) altV.textContent = alt.toLocaleString('en-US') + ' m';
    if (layerV) layerV.textContent = layerAt(alt);
    if (tape) { const y = Math.round(scrollY * .5); tape.style.backgroundPosition = `100% ${y}px, 100% ${y}px`; }
  };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);

  const sc = $('#stars'), sx = sc.getContext('2d');
  let stars = [], sw = 0, sh = 0;
  const initStars = () => {
    sw = innerWidth; sh = innerHeight; sc.width = sw * dpr; sc.height = sh * dpr;
    stars = Array.from({ length: Math.round(sw * sh / 7000) }, () => ({ x: Math.random() * sw, y: Math.random() * sh, r: Math.random() * 1.2 + .3, z: Math.random() * .9 + .1, tw: Math.random() * 6.28 }));
  };
  const drawStars = t => {
    const op = clamp((progress - .1) / .5, 0, 1); sc.style.opacity = op;
    if (op < .01) return;
    sx.setTransform(dpr, 0, 0, dpr, 0, 0); sx.clearRect(0, 0, sw, sh); sx.fillStyle = '#E4F0FC';
    for (const s of stars) {
      const y = (((s.y - scrollY * s.z * .18) % sh) + sh) % sh;
      sx.globalAlpha = (.35 + .65 * (reduce ? .6 : .5 + .5 * Math.sin(t * .0015 + s.tw))) * s.z;
      sx.beginPath(); sx.arc(s.x, y, s.r, 0, 6.283); sx.fill();
    }
    sx.globalAlpha = 1;
  };
  initStars(); addEventListener('resize', initStars); readScroll();

  let prev = performance.now(), hudT = 0;
  const frame = now => {
    const dt = Math.min((now - prev) / 1000, .05); prev = now;
    const inst = dt > 0 ? (scrollY - lastY) / dt : 0; lastY = scrollY;
    vel += (inst - vel) * Math.min(1, dt * 6); hudT += dt;
    if (hudT > .08 && machV) { machV.textContent = 'Mach ' + clamp(Math.abs(vel) / 900, 0, 5).toFixed(1); hudT = 0; }
    for (const h of Climb.hooks) h(dt, now);
    drawStars(now);
    requestAnimationFrame(frame);
  };
  if (reduce) {
    // Reduced-motion: no autoplay loop, but the rail still follows the person's own scrolling.
    drawStars(0);
    let t0 = performance.now(), y0 = scrollY, timer;
    addEventListener('scroll', () => {
      drawStars(0);
      const now = performance.now(), dt = (now - t0) / 1000;
      if (dt > 0 && machV) machV.textContent = 'Mach ' + clamp(Math.abs((scrollY - y0) / dt) / 900, 0, 5).toFixed(1);
      t0 = now; y0 = scrollY;
      clearTimeout(timer); timer = setTimeout(() => { if (machV) machV.textContent = 'Mach 0.0'; }, 250);
    }, { passive: true });
  }
  else requestAnimationFrame(frame);
})();
