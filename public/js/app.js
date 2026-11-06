import { MARKETS, REGIONS, byId, groupOf, allSymbols, ASSETS } from './markets.js';
import { STATIC, renderNav, fetchQuotes, summarize, colorFor, fmtNum, fmtPct, fmtChg, dirClass, flag, esc, timeIn, dateTimeIn, freshness, sparkSVG, badge, startClock, REFRESH_MS } from './common.js';

const $ = id => document.getElementById(id);
const wrap = $('map-wrap'), tip = $('tip');
const pointMarkets = MARKETS.filter(m => m.point);
let quotes = {}, features = [], globe = null, flat = null;
let mode = 'globe';
try { mode = localStorage.getItem('wm-map-mode') || 'globe'; } catch {}

startClock($('clock'));
renderNav($('mnav'), 'index');

// 地図の上に並べる主な価格（クリックで各ページへ）
const TICKER = [['futures', 'NIY=F', '日経先物'], ['futures', 'ES=F', 'S&P先物'], ['fx', 'USDJPY=X', 'ドル/円'], ['fx', 'EURJPY=X', 'ユーロ/円'],
  ['commodities', 'GC=F', '金'], ['commodities', 'CL=F', 'WTI原油'], ['crypto', 'BTC-USD', 'ビットコイン'], ['options', '^VIX', 'VIX']];
function renderTicker() {
  $('ticker').innerHTML = TICKER.map(([k, s, n]) => {
    const q = quotes[s] && !quotes[s].error ? quotes[s] : null, cls = dirClass(q?.changePct);
    const dpv = k === 'fx' ? 3 : undefined;
    return `<a class="tick" href="asset.html#${k}/${encodeURIComponent(s)}"><span class="n">${esc(n)}</span><span class="v num">${fmtNum(q?.price, dpv)}</span><span class="p num ${cls}">${fmtPct(q?.changePct)}</span></a>`;
  }).join('');
}
renderTicker();

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
    .showAtmosphere(true).atmosphereColor('#3b82f6').atmosphereAltitude(0.18)
    .showGraticules(true)
    .polygonsData(features)
    .polygonGeoJsonGeometry('geometry')
    .polygonCapColor(f => marketOf(f) ? colorFor(info(marketOf(f)).q?.changePct) : '#1f2633')
    .polygonSideColor(() => 'rgba(0,0,0,0.25)')
    .polygonStrokeColor(() => '#0a0e16')
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
    .onPointHover(p => { el.style.cursor = p ? 'pointer' : 'grab'; });
  globe.globeMaterial().color.set('#0f1d33');
  globe.pointOfView({ lat: 28, lng: 135, altitude: 1.9 });
  const ctl = globe.controls();
  ctl.autoRotate = true; ctl.autoRotateSpeed = 0.35;
  el.addEventListener('pointerdown', () => { ctl.autoRotate = false; });
  sizeGlobe();
}
let hovered = null;
function sizeGlobe() { if (globe) globe.width(wrap.clientWidth).height(wrap.clientHeight); }
function refreshGlobe() {
  if (!globe) return;
  globe.polygonCapColor(globe.polygonCapColor()).pointColor(globe.pointColor());
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
  const zoom = d3.zoom().scaleExtent([1, 10]).translateExtent([[0, 0], [W, H]])
    .on('zoom', ev => { g.attr('transform', ev.transform); pts.attr('r', 4.5 / Math.sqrt(ev.transform.k)); hideTip(); });
  svg.call(zoom).on('dblclick.zoom', null);
  flat = { countries, pts };
  refreshFlat();
}
function refreshFlat() {
  if (!flat) return;
  flat.countries.attr('fill', f => marketOf(f) ? colorFor(info(marketOf(f)).q?.changePct) : '#1f2633');
  flat.pts.attr('fill', m => colorFor(info(m).q?.changePct));
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

// ── 一覧 ──
function renderList() {
  const rows = MARKETS.map(info);
  const withQ = rows.filter(r => r.q);
  const up = withQ.filter(r => r.q.changePct > 0).length, down = withQ.filter(r => r.q.changePct < 0).length;
  const open = rows.filter(r => r.status.state === 'open').length;
  $('summary').innerHTML = `
    <div class="pill"><b class="up num">${up}</b>市場が上昇</div>
    <div class="pill"><b class="down num">${down}</b>市場が下落</div>
    <div class="pill"><b class="num" style="color:var(--up)">${open}</b>市場が取引中</div>`;
  $('count').textContent = `${MARKETS.length}の国と地域`;
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

// ── データ更新 ──
async function refresh() {
  try {
    const data = await fetchQuotes([...allSymbols(), ...TICKER.map(t => t[1])]);
    quotes = data.quotes;
    $('loading').hidden = true;
    $('updated').textContent = STATIC ? `株価は ${dateTimeIn('Asia/Tokyo', new Date(data.serverTime * 1000))} 時点` : `自動更新中（15秒ごと）· 最終 ${timeIn('Asia/Tokyo', data.serverTime)}`;
    refreshGlobe(); refreshFlat(); renderList(); renderTicker();
  } catch (e) {
    $('updated').textContent = '更新に失敗しました。再試行します…';
  }
}

(async function main() {
  const topo = await (await fetch('vendor/countries-110m.json')).json();
  features = topojson.feature(topo, topo.objects.countries).features.filter(f => f.id !== '010'); // 南極を除く
  renderList();
  setMode(mode);
  await refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
