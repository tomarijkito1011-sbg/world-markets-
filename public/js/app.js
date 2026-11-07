import { MARKETS, REGIONS, byId, byCode, groupOf, allSymbols, ASSETS, CITY, LABELED, nextOpening } from './markets.js';
import { STATIC, ICONS, renderNav, mountSettings, getTheme, fetchQuotes, summarize, colorFor, fmtNum, fmtPct, fmtChg, dirClass, flag, esc, timeIn, dateTimeIn, freshness, sparkSVG, badge, startClock, REFRESH_MS } from './common.js';

const $ = id => document.getElementById(id);
const wrap = $('map-wrap'), tip = $('tip');
const pointMarkets = MARKETS.filter(m => m.point);
let quotes = {}, features = [], globe = null, flat = null;
let mode = 'globe';
try { mode = localStorage.getItem('wm-map-mode') || 'globe'; } catch {}

startClock($('clock'));
renderNav($('mnav'), 'index');
mountSettings($('settings'));
// 地図・地球儀の色（テーマごと）
const MAPC = () => getTheme() === 'light'
  ? { none: '#e3e8ef', stroke: '#ffffff', globe: '#cfe0f5', atmo: '#7fb0ff', side: 'rgba(15,23,42,0.08)' }
  : { none: '#1f2633', stroke: '#0a0e16', globe: '#0d1a30', atmo: '#3b82f6', side: 'rgba(0,0,0,0.25)' };

// 投資対象ごとの色
const CAT_COLOR = { index: '#4c8dff', futures: '#a78bfa', options: '#f59e0b', commodities: '#eab308', fx: '#2dd4bf', crypto: '#fb923c' };
const HEADLINES = ASSETS.map(a => a.headline);

// ── 星空の背景 ──
(function stars() {
  const c = $('stars'), ctx = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pts = [];
  const resize = () => {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    c.width = r.width * dpr; c.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = Array.from({ length: Math.round(r.width * r.height / 2600) }, () => ({ x: Math.random() * r.width, y: Math.random() * r.height, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6.28 }));
  };
  const draw = t => {
    const r = c.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    const light = getTheme() === 'light';
    for (const s of pts) { ctx.globalAlpha = (light ? 0.1 : 0.25) + (light ? 0.2 : 0.55) * (0.5 + 0.5 * Math.sin(s.p + t / 1400)); ctx.fillStyle = light ? '#7b93b8' : '#cfe0ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); }
    if (!reduce && !document.hidden) requestAnimationFrame(draw);
  };
  resize(); requestAnimationFrame(draw);
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) requestAnimationFrame(draw); });
})();

const info = m => summarize(m, quotes);
const marketOf = f => byId[f.id];
const goto = m => { location.href = `country.html#${m.code}`; };

function tipHTML(m) {
  const { q, status } = info(m);
  // その国の主要指数をすべて表示（指数名・ポイント・前日比％）
  // ツールチップには主要指数だけを出し、残りは件数で示す
  const main = m.indices.filter(i => groupOf(i) === '主要指数');
  const more = m.indices.length - main.length;
  const rows = main.map(([sym, name]) => {
    const x = quotes[sym] && !quotes[sym].error ? quotes[sym] : null;
    const cls = dirClass(x?.changePct);
    return `<div class="t-idx">
      <div class="t-name">${esc(name)}</div>
      <div class="t-vals"><span class="t-price num">${fmtNum(x?.price)}</span><span class="t-pct num ${cls}">${fmtPct(x?.changePct)}</span></div>
      <div class="t-chg num ${cls}">前日比 ${fmtChg(x?.change)}</div>
    </div>`;
  }).join('');
  return `<div class="t-head"><span style="font-size:20px">${flag(m.code)}</span>${esc(m.name)} ${badge(status)}</div>
    ${rows}
    ${more > 0 ? `<div class="t-more">ほか${more}指数は詳細ページで</div>` : ''}
    <div class="t-foot">現地 ${timeIn(m.tz, q?.time, false)} 時点 · ${esc(freshness(q, status))} · クリックで詳細</div>`;
}
function noMarketTip(name) {
  return `<div class="t-head">${esc(name || '')}</div><div class="muted" style="font-size:12px">この国の市場データは未対応です</div>`;
}

// ── 3D地球儀 ──
function initGlobe() {
  const el = $('globe');
  globe = Globe()(el)
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true).atmosphereColor(MAPC().atmo).atmosphereAltitude(0.18)
    .showGraticules(true)
    .polygonsData(features)
    .polygonGeoJsonGeometry('geometry')
    .polygonCapColor(f => marketOf(f) ? colorFor(info(marketOf(f)).q?.changePct) : MAPC().none)
    .polygonSideColor(() => MAPC().side)
    .polygonStrokeColor(() => MAPC().stroke)
    .polygonAltitude(f => f === hovered ? 0.035 : marketOf(f) ? 0.012 : 0.005)
    .polygonLabel(f => `<div class="tip" style="display:block;position:static">${marketOf(f) ? tipHTML(marketOf(f)) : noMarketTip(f.properties.name)}</div>`)
    .onPolygonHover(f => { hovered = f; globe.polygonAltitude(globe.polygonAltitude()); el.style.cursor = f && marketOf(f) ? 'pointer' : 'grab'; })
    .onPolygonClick(f => { const m = marketOf(f); if (m) goto(m); })
    .pointsData(pointMarkets)
    .pointLat(m => m.point[0]).pointLng(m => m.point[1])
    .pointColor(m => colorFor(info(m).q?.changePct))
    .pointAltitude(0.03).pointRadius(0.9)
    .pointLabel(m => `<div class="tip" style="display:block;position:static">${tipHTML(m)}</div>`)
    .onPointClick(goto)
    .onPointHover(p => { el.style.cursor = p ? 'pointer' : 'grab'; })
    // 取引中の市場に光の輪
    .ringsData([]).ringLat(d => d.lat).ringLng(d => d.lng).ringAltitude(0.015)
    .ringColor(() => t => `rgba(74,222,128,${1 - t})`).ringMaxRadius(4.5).ringPropagationSpeed(2.2).ringRepeatPeriod(1300)
    // 主要市場の騰落率ラベル
    .htmlElementsData(LABELED.map(c => byCode[c])).htmlLat(m => CITY[m.code][0]).htmlLng(m => CITY[m.code][1]).htmlAltitude(0.02)
    .htmlElement(m => { const d = document.createElement('div'); d.className = 'globe-label'; m._label = d; fillLabel(m); return d; });
  if (globe.htmlElementVisibilityModifier) globe.htmlElementVisibilityModifier((el, visible) => { el.style.opacity = visible ? 1 : 0; });
  globe.globeMaterial().color.set(MAPC().globe);
  globe.pointOfView({ lat: 28, lng: 128, altitude: 1.65 });
  const ctl = globe.controls();
  ctl.autoRotate = true; ctl.autoRotateSpeed = 0.35;
  el.addEventListener('pointerdown', () => { ctl.autoRotate = false; });
  sizeGlobe();
}
let hovered = null;
function sizeGlobe() { if (globe) globe.width(wrap.clientWidth).height(wrap.clientHeight); }
function fillLabel(m) {
  if (!m._label) return;
  const { q } = info(m), cls = dirClass(q?.changePct);
  m._label.innerHTML = `${esc(m.name)}<span class="${cls}">${fmtPct(q?.changePct)}</span>`;
}
function refreshGlobe() {
  if (!globe) return;
  globe.polygonCapColor(globe.polygonCapColor()).pointColor(globe.pointColor());
  LABELED.forEach(c => fillLabel(byCode[c]));
  globe.ringsData(MARKETS.filter(m => info(m).status.state === 'open').map(m => ({ lat: CITY[m.code][0], lng: CITY[m.code][1] })));
}

// ── 平面地図 ──
function initFlat() {
  const el = $('flat');
  const W = 960, H = 500;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');
  const g = svg.append('g');
  // 経度150度を中心にして日本が真ん中に来るようにする
  const proj = d3.geoNaturalEarth1().rotate([-150, 0]).fitExtent([[8, 8], [W - 8, H - 8]], { type: 'Sphere' });
  const path = d3.geoPath(proj);
  g.append('path').attr('class', 'sphere').attr('d', path({ type: 'Sphere' }));
  g.append('path').attr('class', 'graticule').attr('d', path(d3.geoGraticule10()));
  const countries = g.selectAll('path.country').data(features).join('path')
    .attr('class', f => 'country' + (marketOf(f) ? ' has' : ''))
    .attr('d', path)
    .on('mousemove', (ev, f) => showTip(ev, marketOf(f) ? tipHTML(marketOf(f)) : noMarketTip(f.properties.name)))
    .on('mouseleave', hideTip)
    .on('click', (ev, f) => { const m = marketOf(f); if (m) goto(m); });
  const pts = g.selectAll('circle.mk-point').data(pointMarkets).join('circle')
    .attr('class', 'mk-point').attr('r', 4.5)
    .attr('cx', m => proj([m.point[1], m.point[0]])[0]).attr('cy', m => proj([m.point[1], m.point[0]])[1])
    .on('mousemove', (ev, m) => showTip(ev, tipHTML(m)))
    .on('mouseleave', hideTip)
    .on('click', (ev, m) => goto(m));
  const labels = g.selectAll('text.flat-label').data(LABELED.map(c => byCode[c])).join('text')
    .attr('class', 'flat-label').attr('text-anchor', 'middle')
    .attr('x', m => proj([CITY[m.code][1], CITY[m.code][0]])[0]).attr('y', m => proj([CITY[m.code][1], CITY[m.code][0]])[1] - 6);
  const zoom = d3.zoom().scaleExtent([1, 10]).translateExtent([[0, 0], [W, H]])
    .on('zoom', ev => { g.attr('transform', ev.transform); pts.attr('r', 4.5 / Math.sqrt(ev.transform.k)); labels.attr('font-size', 9 / Math.sqrt(ev.transform.k)); hideTip(); });
  svg.call(zoom).on('dblclick.zoom', null);
  flat = { countries, pts, labels };
  refreshFlat();
}
function refreshFlat() {
  if (!flat) return;
  flat.countries.attr('fill', f => marketOf(f) ? colorFor(info(marketOf(f)).q?.changePct) : MAPC().none);
  flat.pts.attr('fill', m => colorFor(info(m).q?.changePct));
  flat.labels.text(m => fmtPct(info(m).q?.changePct)).attr('fill', m => { const c = dirClass(info(m).q?.changePct); const L = getTheme() === 'light'; return c === 'up' ? (L ? '#15803d' : '#86efac') : c === 'down' ? (L ? '#b91c1c' : '#fca5a5') : (L ? '#475569' : '#cbd5e1'); });
}
function showTip(ev, html) {
  tip.innerHTML = html; tip.style.display = 'block';
  const r = tip.getBoundingClientRect();
  let x = ev.clientX + 16, y = ev.clientY + 16;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 16;
  if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 16;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { tip.style.display = 'none'; }

// ── 表示切り替え ──
function setMode(m) {
  mode = m;
  try { localStorage.setItem('wm-map-mode', m); } catch {}
  const isGlobe = m === 'globe';
  $('globe').hidden = !isGlobe; $('flat').hidden = isGlobe;
  $('btn-globe').classList.toggle('active', isGlobe); $('btn-flat').classList.toggle('active', !isGlobe);
  $('btn-globe').setAttribute('aria-pressed', isGlobe); $('btn-flat').setAttribute('aria-pressed', !isGlobe);
  $('hint').textContent = isGlobe ? 'ドラッグで回転・ホイールで拡大 ／ 国をクリックで詳細' : 'ドラッグで移動・ホイールで拡大 ／ 国をクリックで詳細';
  hideTip();
  if (isGlobe) { if (!globe) initGlobe(); else { globe.resumeAnimation(); sizeGlobe(); } }
  else { if (globe) globe.pauseAnimation(); if (!flat) initFlat(); }
}
$('btn-globe').onclick = () => setMode('globe');
$('btn-flat').onclick = () => setMode('flat');
addEventListener('resize', sizeGlobe);
if (window.ResizeObserver) new ResizeObserver(sizeGlobe).observe(wrap);

// ── 一覧 ──
function renderList() {
  const rows = MARKETS.map(info);
  $('count').textContent = `${MARKETS.length}の国と地域 · 押すと詳細ページへ`;
  $('list').innerHTML = REGIONS.map(reg => {
    const items = rows.filter(r => r.m.region === reg);
    return `<div class="region"><h3>${esc(reg)}</h3>${items.map(({ m, q, status, idxName }) => {
      const cls = dirClass(q?.changePct);
      return `<a class="row" href="country.html#${m.code}">
        <div class="nm"><div class="c">${flag(m.code)} ${esc(m.name)}</div><div class="i">${esc(idxName)} ${badge(status)}</div></div>
        <div class="sp">${sparkSVG(q?.spark, cls)}</div>
        <div class="px num">${fmtNum(q?.price)}</div>
        <div class="ch num ${cls}">${fmtPct(q?.changePct)}</div></a>`;
    }).join('')}</div>`;
  }).join('');
}

// テーマが変わったら、CSSで変えられない地図・地球儀・カードの色を塗り直す
window.addEventListener('wm-theme', () => {
  if (globe) { const c = MAPC(); globe.globeMaterial().color.set(c.globe); globe.atmosphereColor(c.atmo).polygonSideColor(globe.polygonSideColor()).polygonStrokeColor(globe.polygonStrokeColor()); }
  refreshGlobe(); refreshFlat(); renderList(); renderCats(); renderRanks();
});

// ── 左側のまとめ ──
function renderPanel() {
  const rows = MARKETS.map(info).filter(r => r.q?.changePct != null);
  const up = rows.filter(r => r.q.changePct > 0.005).length, down = rows.filter(r => r.q.changePct < -0.005).length, fl = rows.length - up - down;
  const avg = rows.length ? rows.reduce((a, r) => a + r.q.changePct, 0) / rows.length : null;
  $('avg').textContent = fmtPct(avg); $('avg').className = 'mono ' + dirClass(avg);
  $('avg-note').textContent = rows.length ? `${rows.length}市場の単純平均` : '';
  $('n-up').textContent = up; $('n-down').textContent = down; $('n-flat').textContent = fl;
  const tot = rows.length || 1;
  $('breadth').innerHTML = `<i style="width:${up / tot * 100}%;background:var(--up)"></i><i style="width:${fl / tot * 100}%;background:#4b5563"></i><i style="width:${down / tot * 100}%;background:var(--down)"></i>`;
  const open = MARKETS.filter(m => info(m).status.state === 'open');
  if (open.length) {
    $('openline').innerHTML = `いま取引中 <b>${open.length}</b>市場<br>${open.map(m => `<span class="chip">${flag(m.code)} ${esc(m.name)}</span>`).join('')}`;
  } else {
    const n = nextOpening();
    $('openline').innerHTML = n ? `いま取引中の市場はありません。<br>次に開くのは <b>${flag(n.m.code)} ${esc(n.m.name)}</b>（日本時間 ${dateTimeIn('Asia/Tokyo', n.at).replace(/^\d+\//, '').replace(/:\d\d$/, '')}）` : '';
  }
}

// ── マーケット別のカード ──
function renderCats() {
  const idxRows = MARKETS.map(info).filter(r => r.q);
  const jp = info(byCode.JP);
  const cards = [{ key: 'index', name: '株価指数', short: '世界40か国の株価', href: '#list-head', hName: '日経平均株価', q: jp.q }]
    .concat(ASSETS.map(a => ({ key: a.key, name: a.name, short: a.short, href: `asset.html#${a.key}`, hName: a.items.find(i => i[0] === a.headline)?.[1], q: quotes[a.headline] && !quotes[a.headline].error ? quotes[a.headline] : null, dp: a.key === 'fx' ? 3 : undefined })));
  $('cats').innerHTML = cards.map(c => {
    const cls = dirClass(c.q?.changePct), col = CAT_COLOR[c.key];
    return `<a class="cat" href="${c.href}">
      <div class="top"><div class="icon" style="background:${col}22;color:${col}">${ICONS[c.key]}</div><div><h3>${esc(c.name)}</h3><div class="sub">${esc(c.short)}</div></div></div>
      ${sparkSVG(c.q?.spark, cls)}
      <div class="head"><div><div class="nm">${esc(c.hName || '')}</div><div class="v">${fmtNum(c.q?.price, c.dp)}</div></div><span class="p ${cls}">${fmtPct(c.q?.changePct)}</span></div>
      <div class="go">${c.key === 'index' ? '国別の一覧を見る ↓' : `${esc(c.name)}のページへ →`}</div></a>`;
  }).join('');
}

// ── ランキング ──
function renderRanks() {
  const rows = MARKETS.map(info).filter(r => r.q?.changePct != null);
  const max = Math.max(1, ...rows.map(r => Math.abs(r.q.changePct)));
  const list = (arr, cls) => arr.map((r, i) => `<a href="country.html#${r.m.code}"><span class="no">${i + 1}</span><span>${flag(r.m.code)} ${esc(r.m.name)} <span class="muted" style="font-size:11px">${esc(r.idxName)}</span></span>
      <span class="bar" style="width:${Math.abs(r.q.changePct) / max * 100}%;background:var(--${cls})"></span><span class="pc ${cls}">${fmtPct(r.q.changePct)}</span></a>`).join('');
  const sorted = [...rows].sort((a, b) => b.q.changePct - a.q.changePct);
  $('ranks').innerHTML = `<div class="rank"><h3><span class="up">▲</span>値上がり TOP5</h3>${list(sorted.slice(0, 5), 'up')}</div>
    <div class="rank"><h3><span class="down">▼</span>値下がり TOP5</h3>${list(sorted.slice(-5).reverse(), 'down')}</div>`;
}

// ── データ更新 ──
async function refresh() {
  try {
    const data = await fetchQuotes([...allSymbols(), ...HEADLINES]);
    quotes = data.quotes;
    $('loading').hidden = true;
    $('src-time').textContent = STATIC ? `価格は ${dateTimeIn('Asia/Tokyo', new Date(data.serverTime * 1000))} 時点（約1時間ごとに自動更新）` : '開場中は約15秒ごとに自動更新';
    $('updated').textContent = STATIC ? `株価は ${dateTimeIn('Asia/Tokyo', new Date(data.serverTime * 1000))} 時点` : `自動更新中（15秒ごと）· 最終 ${timeIn('Asia/Tokyo', data.serverTime)}`;
    refreshGlobe(); refreshFlat(); renderList(); renderPanel(); renderCats(); renderRanks();
  } catch (e) {
    $('updated').textContent = '更新に失敗しました。再試行します…';
  }
}

(async function main() {
  const topo = await (await fetch('vendor/countries-110m.json')).json();
  features = topojson.feature(topo, topo.objects.countries).features.filter(f => f.id !== '010'); // 南極を除く
  renderList(); renderPanel(); renderCats(); renderRanks();
  setMode(mode);
  setInterval(renderPanel, 60_000);
  await refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
