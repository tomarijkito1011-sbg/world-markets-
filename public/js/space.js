// トップページの宇宙の背景（すべてキャンバスに手描き。外部画像は使わない）
// 遠くの太陽・月・火星・木星・土星・冥王星、星雲、天の川、またたく星、流れ星。
// マウスの動きに合わせて、遠いものほど小さく動く（奥行きの表現）。
export function initSpace(canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, stars = [], layer = null, shoots = [], mx = 0, my = 0, tx = 0, ty = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // 天体の位置（キャンバスに対する割合）。d は奥行き（大きいほど遠く、動きが小さい）
  const BODIES = [
    { key: 'sun', name: '太陽', x: 0.965, y: 0.1, r: 0.05, d: 0.2 },
    { key: 'moon', name: '月', x: 0.47, y: 0.2, r: 0.014, d: 1 },
    { key: 'mars', name: '火星', x: 0.81, y: 0.85, r: 0.02, d: 0.7 },
    { key: 'jupiter', name: '木星', x: 0.95, y: 0.64, r: 0.045, d: 0.5 },
    { key: 'saturn', name: '土星', x: 0.885, y: 0.31, r: 0.03, d: 0.45 },
    { key: 'pluto', name: '冥王星', x: 0.4, y: 0.9, r: 0.005, d: 0.25 },
  ];

  function sphere(g, x, y, r, base, dark, light, lx, ly) {
    // 光の当たる向き（太陽の方向）から影をつけた球
    const gr = g.createRadialGradient(x + lx * r * 0.5, y + ly * r * 0.5, r * 0.05, x, y, r);
    gr.addColorStop(0, light); gr.addColorStop(0.45, base); gr.addColorStop(1, dark);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  function bands(g, x, y, r, colors, tilt = 0) {
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
    g.translate(x, y); g.rotate(tilt);
    colors.forEach((c, i) => { g.fillStyle = c; g.globalAlpha = 0.35; g.fillRect(-r, -r + (2 * r * i) / colors.length, 2 * r, (2 * r) / colors.length * 0.6); });
    g.restore(); g.globalAlpha = 1;
  }
  function label(g, text, x, y) {
    g.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
    g.fillStyle = 'rgba(200,214,240,.55)'; g.textAlign = 'center'; g.fillText(text, x, y);
  }

  // 動かない部分（星雲・天の川・天体）を一度だけ描いておく
  function buildLayer() {
    layer = document.createElement('canvas');
    layer.width = W * dpr; layer.height = H * dpr;
    const g = layer.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = Math.min(W, H);
    // 星雲
    for (const [x, y, r, c] of [[0.72, 0.3, 0.55, 'rgba(88,64,180,.16)'], [0.3, 0.75, 0.5, 'rgba(30,120,170,.12)'], [0.95, 0.85, 0.4, 'rgba(180,60,120,.10)'], [0.15, 0.3, 0.45, 'rgba(60,90,200,.10)']]) {
      const gr = g.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * Math.max(W, H));
      gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    // 天の川（斜めの帯に細かい星を集める）
    g.save(); g.translate(W / 2, H / 2); g.rotate(-0.42);
    const band = g.createLinearGradient(0, -H * 0.25, 0, H * 0.25);
    band.addColorStop(0, 'rgba(160,180,255,0)'); band.addColorStop(0.5, 'rgba(160,180,255,.07)'); band.addColorStop(1, 'rgba(160,180,255,0)');
    g.fillStyle = band; g.fillRect(-W, -H * 0.25, W * 2, H * 0.5);
    for (let i = 0; i < W * H / 900; i++) {
      const yy = (Math.random() + Math.random() + Math.random() - 1.5) * H * 0.18;
      g.fillStyle = `rgba(220,228,255,${rnd(0.08, 0.45)})`; g.fillRect(rnd(-W, W), yy, rnd(0.4, 1.1), rnd(0.4, 1.1));
    }
    g.restore();
    layer.m = m;
  }

  function drawBodies(g) {
    const m = Math.min(W, H);
    const sun = BODIES[0];
    const sx = sun.x * W + tx * sun.d, sy = sun.y * H + ty * sun.d;
    for (const b of BODIES) {
      const x = b.x * W + tx * b.d, y = b.y * H + ty * b.d, r = Math.max(b.r * m, b.key === 'pluto' ? 2.2 : 3);
      // 太陽の方向（影の向き）
      const ang = Math.atan2(sy - y, sx - x), lx = Math.cos(ang), ly = Math.sin(ang);
      if (b.key === 'sun') {
        const glow = g.createRadialGradient(x, y, 0, x, y, r * 9);
        glow.addColorStop(0, 'rgba(255,244,214,.95)'); glow.addColorStop(0.08, 'rgba(255,214,140,.65)'); glow.addColorStop(0.3, 'rgba(255,160,70,.18)'); glow.addColorStop(1, 'rgba(255,140,60,0)');
        g.fillStyle = glow; g.beginPath(); g.arc(x, y, r * 9, 0, Math.PI * 2); g.fill();
        sphere(g, x, y, r, '#ffd27a', '#ff9a3c', '#fffbe8', 0, 0);
        label(g, b.name, x, y + r + 16);
      } else if (b.key === 'moon') {
        sphere(g, x, y, r, '#b9bcc4', '#3a3d46', '#f1f2f5', lx, ly);
        g.fillStyle = 'rgba(80,84,96,.35)';
        for (const [cx, cy, cr] of [[-.3, -.2, .22], [.25, .15, .15], [.05, .4, .12]]) { g.beginPath(); g.arc(x + cx * r, y + cy * r, cr * r, 0, Math.PI * 2); g.fill(); }
        label(g, b.name, x, y + r + 14);
      } else if (b.key === 'mars') {
        sphere(g, x, y, r, '#c1502e', '#3d130a', '#f39a6b', lx, ly);
        bands(g, x, y, r, ['#8e3a20', '#d9774c', '#7a2e18', '#c8653c'], 0.3);
        label(g, b.name, x, y + r + 15);
      } else if (b.key === 'jupiter') {
        sphere(g, x, y, r, '#d5b48d', '#4a3420', '#f6e3c6', lx, ly);
        bands(g, x, y, r, ['#a77b52', '#f1dcc0', '#b9895c', '#e8cfae', '#9c6f47', '#efd9bb', '#b98a60'], 0.05);
        g.fillStyle = 'rgba(176,80,50,.55)'; g.beginPath(); g.ellipse(x - r * 0.25, y + r * 0.28, r * 0.18, r * 0.1, 0.05, 0, Math.PI * 2); g.fill();
        label(g, b.name, x - r * 0.4, y + r + 15);
      } else if (b.key === 'saturn') {
        const tilt = -0.38;
        const ring = (front) => {
          g.save(); g.translate(x, y); g.rotate(tilt);
          for (const [k, a] of [[2.25, .22], [2.0, .5], [1.75, .35], [1.5, .45]]) {
            g.strokeStyle = `rgba(226,205,160,${a})`; g.lineWidth = r * 0.16;
            g.beginPath(); g.ellipse(0, 0, r * k, r * k * 0.32, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); g.stroke();
          }
          g.restore();
        };
        ring(false);
        sphere(g, x, y, r, '#e3c98f', '#4d3b1e', '#fbefcf', lx, ly);
        bands(g, x, y, r, ['#c9a86b', '#efdcae', '#b89458', '#e6cf9c'], tilt);
        ring(true);
        label(g, b.name, x, y + r * 1.4 + 16);
      } else if (b.key === 'pluto') {
        sphere(g, x, y, r, '#c9b8a6', '#4b4038', '#f2e8dc', lx, ly);
        g.strokeStyle = 'rgba(200,214,240,.25)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r + 5, 0, Math.PI * 2); g.stroke();
        label(g, b.name, x, y + r + 18);
      }
    }
  }

  function resize() {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round(W * H / 1800) }, () => {
      const big = Math.random() < 0.06;
      return { x: Math.random() * W, y: Math.random() * H, r: big ? rnd(1.1, 1.8) : rnd(0.25, 1), p: Math.random() * 6.28, s: rnd(0.4, 1.6), d: rnd(0.05, 0.25),
        c: ['#ffffff', '#cfe0ff', '#ffe9c8', '#ffd2d2', '#d8ccff'][Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 4)] };
    });
    buildLayer();
    if (reduce) draw(0);
  }

  function draw(t) {
    if (!W) return;
    tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(layer, tx * 0.08 - 0, ty * 0.08 - 0, W, H);
    for (const s of stars) {
      const a = 0.35 + 0.6 * (0.5 + 0.5 * Math.sin(s.p + t / 900 * s.s));
      ctx.globalAlpha = a; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x + tx * s.d, s.y + ty * s.d, s.r, 0, Math.PI * 2); ctx.fill();
      if (s.r > 1.1) { ctx.globalAlpha = a * 0.35; ctx.fillRect(s.x + tx * s.d - s.r * 3, s.y + ty * s.d - 0.3, s.r * 6, 0.6); ctx.fillRect(s.x + tx * s.d - 0.3, s.y + ty * s.d - s.r * 3, 0.6, s.r * 6); }
    }
    ctx.globalAlpha = 1;
    drawBodies(ctx);
    // 流れ星（方向・速さ・長さ・明るさはすべてランダム。同時に数本流れることもある）
    if (!reduce) {
      if (shoots.length < 5 && Math.random() < 0.018) {
        const ang = rnd(0, Math.PI * 2), sp = rnd(5, 13);
        shoots.push({ x: rnd(W * 0.05, W * 0.95), y: rnd(H * 0.05, H * 0.95), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          len: rnd(8, 20), w: rnd(0.8, 2.2), life: 1, fade: rnd(0.012, 0.03), hue: Math.random() < 0.75 ? '255,255,255' : ['190,215,255', '255,225,180', '200,255,230'][Math.floor(Math.random() * 3)] });
      }
      for (const m of shoots) {
        const ex = m.x - m.vx * m.len, ey = m.y - m.vy * m.len;
        const g = ctx.createLinearGradient(m.x, m.y, ex, ey);
        g.addColorStop(0, `rgba(${m.hue},${m.life})`); g.addColorStop(1, `rgba(${m.hue},0)`);
        ctx.strokeStyle = g; ctx.lineWidth = m.w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey); ctx.stroke();
        // 先頭の光る点
        ctx.globalAlpha = m.life; ctx.fillStyle = `rgb(${m.hue})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.w * 1.1, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        m.x += m.vx; m.y += m.vy; m.life -= m.fade;
      }
      shoots = shoots.filter(m => m.life > 0 && m.x > -200 && m.x < W + 200 && m.y > -200 && m.y < H + 200);
    }
  }
  let running = false;
  const loop = t => { if (!running) return; draw(t); if (!document.hidden) requestAnimationFrame(loop); };

  addEventListener('resize', () => { if (running) resize(); });
  if (!reduce) canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * -24; my = ((e.clientY - r.top) / r.height - 0.5) * -16;
  });
  document.addEventListener('visibilitychange', () => { if (running && !document.hidden && !reduce) requestAnimationFrame(loop); });
  return {
    start() { if (running) return; running = true; canvas.hidden = false; resize(); if (!reduce) requestAnimationFrame(loop); },
    stop() { running = false; canvas.hidden = true; },
  };
}
