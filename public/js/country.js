import { MARKETS, byCode, marketStatus, tzOffset } from './markets.js';
import { fetchQuotes, fmtNum, fmtPct, fmtChg, dirClass, flag, esc, timeIn, dateTimeIn, freshness, badge, startClock, summarize, sparkSVG, REFRESH_MS } from './common.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const m = byCode[(params.get('m') || '').toUpperCase()];
if (!m) location.replace('/');

let symbol = m.indices.some(i => i[0] === params.get('s')) ? params.get('s') : m.indices[0][0];
let range = ['1d', '5d', '1mo', '1y', '5y'].includes(params.get('r')) ? params.get('r') : '1d';
let quotes = {};
const regionMarkets = MARKETS.filter(x => x.region === m.region && x.code !== m.code);
const idxName = s => m.indices.find(i => i[0] === s)?.[1] || s;

document.title = `${m.name}の株式市場 — World Markets`;
$('flag').textContent = flag(m.code);
$('cname').textContent = m.name;
$('tzname').textContent = `（${m.tz}）`;
startClock($('clock'));

// 取引時間（現地＋日本時間）
function hoursText() {
  const local = m.sessions.map(([a, b]) => `${a}–${b}`).join(' / ');
  const diff = tzOffset('Asia/Tokyo') - tzOffset(m.tz);
  const conv = t => { let [h, mi] = t.split(':').map(Number); let x = h * 60 + mi + diff; const nd = x >= 1440 ? '翌' : x < 0 ? '前日' : ''; x = (x % 1440 + 1440) % 1440; return `${nd}${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
  const days = (m.days || [1, 2, 3, 4, 5]).map(d => '日月火水木金土'[d]).join('');
  $('hours').textContent = `${local}（現地・${days}）`;
  $('hours-jst').textContent = m.tz === 'Asia/Tokyo' ? '' : `＝ 日本時間 ${m.sessions.map(([a, b]) => `${conv(a)}–${conv(b)}`).join(' / ')}`;
}
hoursText();
setInterval(() => { $('localtime').textContent = dateTimeIn(m.tz); renderStatus(); }, 1000);
$('localtime').textContent = dateTimeIn(m.tz);

function renderStatus() {
  const st = marketStatus(m, quotes[m.indices[0][0]]?.time);
  $('status').innerHTML = badge(st);
  return st;
}

// ── タブ ──
function renderTabs() {
  $('tabs').innerHTML = m.indices.length > 1 ? m.indices.map(([s, n]) => `<button data-s="${esc(s)}" class="${s === symbol ? 'active' : ''}">${esc(n)}</button>`).join('') : '';
  $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => selectSymbol(b.dataset.s));
}
function selectSymbol(s) {
  symbol = s; syncURL(); renderTabs(); renderQuote(); renderOthers(); loadChart();
}
function syncURL() {
  const u = new URL(location.href); u.searchParams.set('m', m.code); u.searchParams.set('s', symbol); u.searchParams.set('r', range);
  history.replaceState(null, '', u);
}

// ── 株価 ──
function renderQuote() {
  const q = quotes[symbol];
  const st = renderStatus();
  $('idxname').textContent = `${idxName(symbol)}（${symbol}）${q?.currency ? ' · ' + q.currency : ''}`;
  if (!q || q.error) { $('price').textContent = '—'; $('chg').textContent = q?.error ? 'データを取得できませんでした' : '—'; return; }
  const cls = dirClass(q.changePct);
  $('price').textContent = fmtNum(q.price);
  $('chg').className = 'chg num ' + cls;
  $('chg').textContent = `${fmtChg(q.change)}（${fmtPct(q.changePct)}）`;
  $('s-chg').className = 'v num ' + cls; $('s-chg').textContent = `${fmtChg(q.change)} / ${fmtPct(q.changePct)}`;
  $('s-high').textContent = fmtNum(q.high);
  $('s-low').textContent = fmtNum(q.low);
  $('s-prev').textContent = fmtNum(q.prevClose);
  $('s-time').textContent = timeIn(m.tz, q.time);
  $('s-fresh').textContent = freshness(q, st) || '—';
}

function miniCard(mk, s, name, linkSelf) {
  const q = quotes[s]; const cls = dirClass(q?.changePct); const st = marketStatus(mk, quotes[mk.indices[0][0]]?.time);
  const href = linkSelf ? '#' : `/country.html?m=${mk.code}`;
  return `<a class="mini ${linkSelf && s === symbol ? 'sel' : ''}" href="${href}" data-s="${esc(s)}">
    <div class="h"><span>${linkSelf ? '' : flag(mk.code) + ' '}${esc(linkSelf ? name : mk.name)}</span>${badge(st)}</div>
    <div class="s">${esc(linkSelf ? s : name)}</div>
    <div class="p"><span class="v num">${fmtNum(q?.price)}</span><span class="num ${cls}" style="font-weight:700">${fmtPct(q?.changePct)}</span></div>
    ${sparkSVG(q?.spark, cls).replace('class="spark"', 'class="spark" style="width:100%;height:28px;margin-top:6px"')}</a>`;
}
function renderOthers() {
  const others = m.indices.filter(([s]) => s !== symbol);
  $('others').innerHTML = others.length ? others.map(([s, n]) => miniCard(m, s, n, true)).join('')
    : `<div class="empty">${esc(m.name)}で表示できる指数は現在「${esc(idxName(symbol))}」のみです。</div>`;
  $('others').querySelectorAll('a.mini').forEach(a => a.onclick = e => { e.preventDefault(); selectSymbol(a.dataset.s); scrollTo({ top: 0, behavior: 'smooth' }); });
  $('region').innerHTML = regionMarkets.map(x => miniCard(x, x.indices[0][0], x.indices[0][1], false)).join('') || '<div class="empty">ほかの市場はありません。</div>';
}

async function refreshQuotes() {
  const syms = [...m.indices.map(i => i[0]), ...regionMarkets.map(x => x.indices[0][0])];
  try {
    const d = await fetchQuotes(syms);
    quotes = d.quotes;
    $('updated').textContent = `自動更新中（15秒ごと）· 最終 ${timeIn('Asia/Tokyo', d.serverTime)}`;
    renderQuote(); renderOthers();
    updateLastPoint();
  } catch { $('updated').textContent = '更新に失敗しました。再試行します…'; }
}

// ── チャート ──
const chart = LightweightCharts.createChart($('chart'), {
  autoSize: true,
  layout: { background: { color: 'transparent' }, textColor: '#8c97ab', fontFamily: 'Inter, "Hiragino Sans", "Noto Sans JP", sans-serif' },
  grid: { vertLines: { color: 'rgba(35,44,63,.6)' }, horzLines: { color: 'rgba(35,44,63,.6)' } },
  rightPriceScale: { borderColor: '#232c3f' },
  timeScale: { borderColor: '#232c3f', timeVisible: true, secondsVisible: false },
  crosshair: { mode: LightweightCharts.CrosshairMode.Magnet },
  localization: { locale: 'ja-JP', priceFormatter: p => Math.abs(p) >= 1000 ? Math.round(p).toLocaleString('ja-JP') : fmtNum(p) },
});
const series = chart.addAreaSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
let prevLine = null, chartData = [], chartOffset = 0, chartReq = 0;
const RANGE_LABEL = { '1d': '1日', '5d': '1週間', '1mo': '1か月', '1y': '1年', '5y': '5年' };

function colorize(up) {
  const c = up ? '#22c55e' : '#ef4444';
  series.applyOptions({ lineColor: c, topColor: up ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)', bottomColor: 'rgba(0,0,0,0)' });
}

async function loadChart(silent = false) {
  const req = ++chartReq;
  $('chart-title').textContent = `${idxName(symbol)} · ${RANGE_LABEL[range]}`;
  if (!silent) { $('chart-msg').hidden = false; $('chart-msg').textContent = 'チャートを読み込み中…'; }
  try {
    const r = await fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`, { cache: 'no-store' });
    const d = await r.json();
    if (req !== chartReq) return;
    if (!r.ok) throw new Error(d.error);
    chartOffset = d.gmtoffset;
    chartData = d.points.map(([t, v]) => ({ time: t + chartOffset, value: v }));
    // 同じ時刻が重なる場合は後の値を使う
    chartData = chartData.filter((p, i, a) => i === a.length - 1 || a[i + 1].time !== p.time);
    // 日足・週足に今日の値がまだ入っていない場合は最新の株価を足す
    const q = quotes[symbol], lastPt = chartData.at(-1);
    if (q?.time && q.price != null && lastPt && q.time + chartOffset > lastPt.time) {
      const span = { '1y': 86400, '5y': 7 * 86400 }[range];
      if (span && q.time + chartOffset - lastPt.time < span) lastPt.value = q.price;
      else if (span) chartData.push({ time: q.time + chartOffset, value: q.price });
    }
    series.setData(chartData);
    if (prevLine) { series.removePriceLine(prevLine); prevLine = null; }
    const base = range === '1d' ? d.prevClose : chartData[0]?.value;
    if (range === '1d' && d.prevClose) prevLine = series.createPriceLine({ price: d.prevClose, color: '#6b7280', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '前日終値' });
    const last = chartData.at(-1)?.value;
    colorize(last == null || base == null || last >= base);
    chart.applyOptions({ timeScale: { timeVisible: ['1d', '5d', '1mo'].includes(range) } });
    if (!silent) chart.timeScale().fitContent();
    $('chart-msg').hidden = chartData.length > 0;
    $('chart-msg').textContent = 'この期間のデータがありません';
    const chgTxt = base && last ? `期間の騰落: <span class="${dirClass(last - base)}">${fmtPct((last / base - 1) * 100)}</span>` : '';
    $('chart-note').innerHTML = `${chgTxt}${chgTxt ? ' · ' : ''}時刻は現地時間（${esc(m.tz)}）`;
  } catch (e) {
    if (req !== chartReq) return;
    $('chart-msg').hidden = false; $('chart-msg').textContent = 'チャートを取得できませんでした';
  }
}

// 1日チャートの最新点を株価に合わせて更新
function updateLastPoint() {
  const q = quotes[symbol];
  if (range !== '1d' || !q?.time || !chartData.length || marketStatus(m, q.time).state !== 'open') return;
  const t = q.time + chartOffset;
  const last = chartData.at(-1);
  if (t >= last.time) { const p = { time: t, value: q.price }; if (t === last.time) chartData[chartData.length - 1] = p; else chartData.push(p); series.update(p); }
}

$('ranges').querySelectorAll('button').forEach(b => {
  b.classList.toggle('active', b.dataset.r === range);
  b.onclick = () => {
    range = b.dataset.r; syncURL();
    $('ranges').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
    loadChart();
  };
});

renderTabs(); renderStatus(); renderOthers();
refreshQuotes().then(() => loadChart());
setInterval(() => { if (!document.hidden) refreshQuotes(); }, REFRESH_MS);
setInterval(() => { if (!document.hidden && range === '1d' && marketStatus(m, quotes[symbol]?.time).state === 'open') loadChart(true); }, 60_000);
