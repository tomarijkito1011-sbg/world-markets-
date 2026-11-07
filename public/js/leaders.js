// 「世界のリーダーモード」の背景。
// 実在の人物ではない架空のキャラクター（似顔絵でもない）が、各国の「首相」「大統領」として右から左へ流れていく。
// 表情とセリフは、その国の代表的な株価指数の前日比で変わる（上がれば笑顔、下がれば冷や汗）。
const TITLE = {
  US: '大統領', FR: '大統領', KR: '大統領', BR: '大統領', MX: '大統領', CO: '大統領', ID: '大統領', PH: '大統領', TR: '大統領', ZA: '大統領',
  EG: '大統領', CH: '大統領', PL: '大統領', AT: '首相', FI: '首相', PT: '首相', IE: '首相', CN: '国家主席', VN: '国家主席', TW: '総統', HK: '行政長官', SA: '首相',
};
// ネクタイの色（国旗の色から）
const TIE = {
  US: ['#b22234', '#3c3b6e'], JP: ['#bc002d', '#ffffff'], GB: ['#012169', '#c8102e'], DE: ['#000000', '#dd0000', '#ffce00'], FR: ['#0055a4', '#ef4135'],
  CN: ['#de2910', '#ffde00'], IN: ['#ff9933', '#138808'], KR: ['#cd2e3a', '#0047a0'], BR: ['#009c3b', '#ffdf00'], CA: ['#d80621', '#ffffff'],
  AU: ['#00008b', '#ff0000'], IT: ['#009246', '#ce2b37'], ES: ['#aa151b', '#f1bf00'], MX: ['#006847', '#ce1126'], HK: ['#de2910', '#ffffff'], TW: ['#000095', '#fe0000'],
  SA: ['#006c35', '#ffffff'], ZA: ['#007749', '#ffb81c'], CH: ['#d52b1e', '#ffffff'], SE: ['#006aa7', '#fecc00'], TR: ['#e30a17', '#ffffff'], ID: ['#ce1126', '#ffffff'],
};
const SKIN = ['#f6d7c3', '#eac0a2', '#d9a27e', '#c68863', '#a86b47', '#8a5233', '#6b3d25'];
const HAIR = ['#1b1b1f', '#3b2a20', '#6b4a2e', '#a0a0a8', '#d8d8dc', '#c9a15a', '#2f2f3a'];
const SUIT = ['#1e2433', '#2b3348', '#3a2f2a', '#23313a', '#2e2e36'];
const LINES = {
  up: ['株価、絶好調です！', '支持率より株価が上がってます', '今日は私のおごりです！', '{i} {p}！最高の一日です', 'この調子でいきましょう！', '景気のいい話しかしません'],
  bigup: ['{i} {p}！祝賀会を開きます！', '歴史的な一日です！！', '記念切手を出しましょう'],
  down: ['想定内です…', '{i} {p}…見なかったことに', '明日は上がります（たぶん）', '記者会見は延期します', '長期的に見れば大丈夫です', 'ちょっと胃が痛いです'],
  bigdown: ['{i} {p}…緊急会議を開きます', '今日は早めに帰ります…', '誰か説明してください！'],
  flat: ['ノーコメントで', 'まあまあですね', '様子見です'],
  closed: ['本日は休場。のんびりします', '市場はお休み、私もお休み', '週末は家族サービスです'],
};
// 国コードから毎回同じ見た目になる乱数
function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }
const pick = (r, a) => a[Math.floor(r() * a.length)];

function drawCharacter(g, cx, cy, s, look, mood) {
  // 体（スーツ・シャツ・ネクタイ）
  g.fillStyle = look.suit;
  g.beginPath(); g.moveTo(cx - s * 1.05, cy + s * 1.9); g.quadraticCurveTo(cx - s * 1.0, cy + s * 0.95, cx - s * 0.35, cy + s * 0.85);
  g.lineTo(cx + s * 0.35, cy + s * 0.85); g.quadraticCurveTo(cx + s * 1.0, cy + s * 0.95, cx + s * 1.05, cy + s * 1.9); g.closePath(); g.fill();
  g.fillStyle = '#f4f6fa'; g.beginPath(); g.moveTo(cx - s * 0.3, cy + s * 0.85); g.lineTo(cx, cy + s * 1.35); g.lineTo(cx + s * 0.3, cy + s * 0.85); g.closePath(); g.fill();
  const tie = g.createLinearGradient(cx, cy + s * 0.9, cx, cy + s * 1.7);
  look.tie.forEach((c, i) => { tie.addColorStop(i / look.tie.length, c); tie.addColorStop((i + 1) / look.tie.length - 0.001, c); });
  g.fillStyle = tie; g.beginPath(); g.moveTo(cx - s * 0.09, cy + s * 0.9); g.lineTo(cx + s * 0.09, cy + s * 0.9); g.lineTo(cx + s * 0.13, cy + s * 1.55); g.lineTo(cx, cy + s * 1.72); g.lineTo(cx - s * 0.13, cy + s * 1.55); g.closePath(); g.fill();
  // 首と顔
  g.fillStyle = look.skin; g.fillRect(cx - s * 0.22, cy + s * 0.55, s * 0.44, s * 0.35);
  g.beginPath(); g.ellipse(cx, cy, s * 0.62, s * 0.72, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx - s * 0.62, cy + s * 0.05, s * 0.1, s * 0.16, 0, 0, Math.PI * 2); g.ellipse(cx + s * 0.62, cy + s * 0.05, s * 0.1, s * 0.16, 0, 0, Math.PI * 2); g.fill();
  // 髪型
  g.fillStyle = look.hair;
  switch (look.style) {
    case 0: // 横分け
      g.beginPath(); g.ellipse(cx, cy - s * 0.42, s * 0.66, s * 0.38, 0, Math.PI, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(cx - s * 0.66, cy - s * 0.4); g.quadraticCurveTo(cx - s * 0.1, cy - s * 0.75, cx + s * 0.66, cy - s * 0.25); g.lineTo(cx + s * 0.6, cy - s * 0.5); g.closePath(); g.fill(); break;
    case 1: // 短髪
      g.beginPath(); g.ellipse(cx, cy - s * 0.38, s * 0.64, s * 0.42, 0, Math.PI, Math.PI * 2); g.fill(); break;
    case 2: // ボブ
      g.beginPath(); g.ellipse(cx, cy - s * 0.2, s * 0.78, s * 0.68, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill();
      g.fillRect(cx - s * 0.78, cy - s * 0.25, s * 0.2, s * 0.65); g.fillRect(cx + s * 0.58, cy - s * 0.25, s * 0.2, s * 0.65); break;
    case 3: // くせ毛
      for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * 0.1); g.beginPath(); g.arc(cx + Math.cos(a) * s * 0.58, cy - s * 0.15 + Math.sin(a) * s * 0.62, s * 0.2, 0, Math.PI * 2); g.fill(); } break;
    case 4: // 側頭部だけ
      g.beginPath(); g.ellipse(cx - s * 0.58, cy - s * 0.15, s * 0.14, s * 0.28, 0.2, 0, Math.PI * 2); g.ellipse(cx + s * 0.58, cy - s * 0.15, s * 0.14, s * 0.28, -0.2, 0, Math.PI * 2); g.fill(); break;
    default: // まとめ髪
      g.beginPath(); g.ellipse(cx, cy - s * 0.4, s * 0.66, s * 0.4, 0, Math.PI, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx, cy - s * 0.92, s * 0.22, 0, Math.PI * 2); g.fill();
  }
  // 眉・目
  g.strokeStyle = look.hair === '#d8d8dc' ? '#9a9aa2' : look.hair; g.lineWidth = s * 0.06; g.lineCap = 'round';
  const brow = mood === 'down' || mood === 'bigdown' ? 0.08 : mood === 'bigup' ? -0.06 : 0;
  g.beginPath(); g.moveTo(cx - s * 0.36, cy - s * 0.2 - brow * s); g.lineTo(cx - s * 0.12, cy - s * 0.22 + brow * s); g.stroke();
  g.beginPath(); g.moveTo(cx + s * 0.36, cy - s * 0.2 - brow * s); g.lineTo(cx + s * 0.12, cy - s * 0.22 + brow * s); g.stroke();
  g.fillStyle = '#1b1b22';
  if (mood === 'bigup') { // 目を細めて大笑い
    g.lineWidth = s * 0.05; g.strokeStyle = '#1b1b22';
    g.beginPath(); g.arc(cx - s * 0.24, cy - s * 0.04, s * 0.09, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(cx + s * 0.24, cy - s * 0.04, s * 0.09, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  } else { g.beginPath(); g.arc(cx - s * 0.24, cy - s * 0.06, s * 0.065, 0, Math.PI * 2); g.arc(cx + s * 0.24, cy - s * 0.06, s * 0.065, 0, Math.PI * 2); g.fill(); }
  if (look.glasses) { g.strokeStyle = '#2a2a33'; g.lineWidth = s * 0.035; g.beginPath(); g.arc(cx - s * 0.24, cy - s * 0.06, s * 0.15, 0, Math.PI * 2); g.moveTo(cx + s * 0.39, cy - s * 0.06); g.arc(cx + s * 0.24, cy - s * 0.06, s * 0.15, 0, Math.PI * 2); g.moveTo(cx - s * 0.09, cy - s * 0.08); g.lineTo(cx + s * 0.09, cy - s * 0.08); g.stroke(); }
  // ほっぺ・口ひげ・口
  if (mood === 'up' || mood === 'bigup') { g.fillStyle = 'rgba(255,110,110,.35)'; g.beginPath(); g.arc(cx - s * 0.38, cy + s * 0.18, s * 0.1, 0, Math.PI * 2); g.arc(cx + s * 0.38, cy + s * 0.18, s * 0.1, 0, Math.PI * 2); g.fill(); }
  if (look.mustache) { g.fillStyle = look.hair; g.beginPath(); g.ellipse(cx - s * 0.12, cy + s * 0.24, s * 0.14, s * 0.06, 0.2, 0, Math.PI * 2); g.ellipse(cx + s * 0.12, cy + s * 0.24, s * 0.14, s * 0.06, -0.2, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = '#5a2626'; g.lineWidth = s * 0.05;
  g.beginPath();
  if (mood === 'bigup') { g.fillStyle = '#5a2626'; g.arc(cx, cy + s * 0.3, s * 0.2, 0, Math.PI); g.fill(); }
  else if (mood === 'up') g.arc(cx, cy + s * 0.22, s * 0.2, Math.PI * 0.15, Math.PI * 0.85);
  else if (mood === 'down' || mood === 'bigdown') g.arc(cx, cy + s * 0.48, s * 0.18, Math.PI * 1.2, Math.PI * 1.8);
  else { g.moveTo(cx - s * 0.14, cy + s * 0.36); g.lineTo(cx + s * 0.14, cy + s * 0.36); }
  g.stroke();
  // 冷や汗
  if (mood === 'down' || mood === 'bigdown') {
    g.fillStyle = 'rgba(120,190,255,.95)';
    for (const [dx, dy, k] of mood === 'bigdown' ? [[0.5, -0.45, 1], [-0.55, -0.35, 0.8]] : [[0.5, -0.45, 1]]) {
      const x = cx + dx * s, y = cy + dy * s, r = s * 0.09 * k;
      g.beginPath(); g.moveTo(x, y - r * 2); g.quadraticCurveTo(x + r * 1.2, y, x, y + r); g.quadraticCurveTo(x - r * 1.2, y, x, y - r * 2); g.fill();
    }
  }
}

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// 1人分の絵（キャラクター＋吹き出し＋名札）を作っておく
function makeSprite(row, s, dpr) {
  const r = seeded(row.code);
  const look = { skin: pick(r, SKIN), hair: pick(r, HAIR), suit: pick(r, SUIT), style: Math.floor(r() * 6), glasses: r() < 0.3, mustache: r() < 0.2, tie: TIE[row.code] || [pick(r, ['#c0392b', '#2e86de', '#16a085', '#8e44ad', '#d35400'])] };
  const p = row.pct;
  const mood = row.closedNoData ? 'flat' : p == null ? 'flat' : p >= 2 ? 'bigup' : p > 0.05 ? 'up' : p <= -2 ? 'bigdown' : p < -0.05 ? 'down' : 'flat';
  const pool = row.state !== 'open' && Math.random() < 0.35 ? LINES.closed : LINES[mood];
  const pctTxt = p == null ? '' : (p > 0 ? '+' : p < 0 ? '−' : '±') + Math.abs(p).toFixed(2) + '%';
  const line = pick(Math.random, pool).replace('{i}', row.idxName).replace('{p}', pctTxt);
  // 文字の長さに合わせて絵の幅を決める（吹き出しや名札が切れないように）
  const mg = document.createElement('canvas').getContext('2d');
  mg.font = `700 ${Math.round(s * 0.26)}px "Zen Kaku Gothic New","Hiragino Sans",sans-serif`;
  const lineW = mg.measureText(line).width;
  const tag0 = `${row.flag} ${row.name}の${TITLE[row.code] || '首相'}`;
  mg.font = `700 ${Math.round(s * 0.24)}px "Zen Kaku Gothic New","Hiragino Sans",sans-serif`;
  const tagW0 = mg.measureText(tag0).width;
  const W = Math.ceil(Math.max(s * 2.6, s * 2.05 + lineW + s * 0.6, tagW0 + s * 1.9)), H = Math.round(s * 4.6);
  const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = s * 1.25, cy = s * 1.85;
  drawCharacter(g, cx, cy, s, look, mood);
  // 吹き出し
  g.font = `700 ${Math.round(s * 0.26)}px "Zen Kaku Gothic New","Hiragino Sans",sans-serif`;
  const tw = lineW;
  const bx = s * 2.05, by = s * 0.25, bw = tw + s * 0.5, bh = s * 0.62;
  g.fillStyle = 'rgba(255,255,255,.95)'; roundRect(g, bx, by, bw, bh, s * 0.2); g.fill();
  g.beginPath(); g.moveTo(bx + s * 0.15, by + bh - 2); g.lineTo(bx - s * 0.25, by + bh + s * 0.35); g.lineTo(bx + s * 0.5, by + bh - 2); g.closePath(); g.fill();
  g.fillStyle = '#141a26'; g.textBaseline = 'middle'; g.fillText(line, bx + s * 0.25, by + bh / 2);
  // 名札（国旗・国名・肩書き・指数の前日比）
  const tag = `${row.flag} ${row.name}の${TITLE[row.code] || '首相'}`;
  g.font = `700 ${Math.round(s * 0.24)}px "Zen Kaku Gothic New","Hiragino Sans",sans-serif`;
  const tagW = g.measureText(tag).width;
  const pcol = p == null ? '#cbd5e1' : p > 0.005 ? '#4ade80' : p < -0.005 ? '#f87171' : '#cbd5e1';
  g.font = `600 ${Math.round(s * 0.22)}px "IBM Plex Mono",monospace`;
  const pw = g.measureText(pctTxt).width;
  const ty = s * 4.0, tx = s * 0.1, th = s * 0.46, tW = tagW + pw + s * 0.7;
  g.fillStyle = 'rgba(8,12,22,.82)'; roundRect(g, tx, ty, tW, th, s * 0.12); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = '#e6ebf3'; g.font = `700 ${Math.round(s * 0.24)}px "Zen Kaku Gothic New","Hiragino Sans",sans-serif`; g.fillText(tag, tx + s * 0.2, ty + th / 2);
  g.fillStyle = pcol; g.font = `600 ${Math.round(s * 0.22)}px "IBM Plex Mono",monospace`; g.fillText(pctTxt, tx + s * 0.4 + tagW, ty + th / 2);
  return { c, w: W, h: H };
}

export function initLeaders(canvas, getRows) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, running = false, lanes = [], queue = [], spotlights = [];
  const LANE_DEF = [{ y: 0.04, s: 0.055, v: 0.55, a: 0.7 }, { y: 0.37, s: 0.068, v: 0.8, a: 0.85 }, { y: 0.69, s: 0.06, v: 0.65, a: 0.75 }];

  function nextRow() {
    if (!queue.length) { queue = getRows().slice(); for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; } }
    return queue.shift();
  }
  function spawn(lane, x) {
    const row = nextRow(); if (!row) return;
    const s = Math.max(26, Math.min(W, H) * lane.s);
    const sp = makeSprite(row, s, dpr);
    lane.items.push({ x, sp });
  }
  function resize() {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lanes = LANE_DEF.map(d => ({ ...d, items: [] }));
    // 最初から画面に何人か並べておく
    for (const lane of lanes) { let x = Math.random() * 200 - 100; while (x < W) { spawn(lane, x); x += lane.items.at(-1).sp.w + 40 + Math.random() * 120; } }
    spotlights = Array.from({ length: 3 }, (_, i) => ({ x: W * (0.2 + i * 0.3), p: Math.random() * 6 }));
    if (reduce) draw(0);
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    // 記者会見場のようなスポットライト
    for (const sl of spotlights) {
      const x = sl.x + Math.sin(t / 2500 + sl.p) * W * 0.08;
      const g = ctx.createRadialGradient(x, H * 0.05, 0, x, H * 0.6, H * 0.9);
      g.addColorStop(0, 'rgba(255,236,190,.10)'); g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x + W * 0.25, H); ctx.lineTo(x - W * 0.25, H); ctx.closePath(); ctx.fill();
    }
    for (const lane of lanes) {
      for (const it of lane.items) {
        if (!reduce) it.x -= lane.v;
        const bob = reduce ? 0 : Math.sin((t / 300) + it.x / 60) * 2;
        ctx.globalAlpha = lane.a; ctx.drawImage(it.sp.c, it.x, lane.y * H + bob, it.sp.w, it.sp.h); ctx.globalAlpha = 1;
      }
      lane.items = lane.items.filter(it => it.x + it.sp.w > -10);
      const last = lane.items.at(-1);
      if (!last || last.x + last.sp.w < W - 30 - Math.random() * 60) spawn(lane, Math.max(W, last ? last.x + last.sp.w + 40 : W));
    }
  }
  const loop = t => { if (!running) return; draw(t); if (!document.hidden) requestAnimationFrame(loop); };
  addEventListener('resize', () => { if (running) resize(); });
  document.addEventListener('visibilitychange', () => { if (running && !document.hidden && !reduce) requestAnimationFrame(loop); });
  return {
    start() { if (running) return; running = true; canvas.hidden = false; resize(); if (!reduce) requestAnimationFrame(loop); },
    stop() { running = false; canvas.hidden = true; },
    refresh() { queue = []; }, // 株価が更新されたら、次に登場する人から新しい表情・セリフになる
  };
}
