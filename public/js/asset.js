import { ASSETS, assetByKey, assetStatus, SCHEDULE_TEXT } from './markets.js';
import { STATIC, ICONS, fetchQuotes, fetchChart, fmtNum, fmtPct, fmtChg, dirClass, mountSettings, themeColors, esc, timeIn, dateTimeIn, badge, startClock, colorFor, renderNav, REFRESH_MS } from './common.js';

const $ = id => document.getElementById(id);
const RANGES = ['1d', '5d', '1mo', '1y', '5y'];
const RANGE_LABEL = { '1d': '1日', '5d': '1週間', '1mo': '1か月', '1y': '1年', '5y': '5年' };
const JST_OFFSET = 9 * 3600;

let asset = null, symbol = null, range = '1d', quotes = {};
startClock($('clock'));
mountSettings($('settings'));

// 価格の小数桁（為替は円がらみ3桁・それ以外5桁）
function dp(v) {
  if (v == null) return 2;
  if (asset?.key === 'fx') return Math.abs(v) >= 20 ? 3 : Math.abs(v) >= 1 ? 5 : 6;
  return undefined; // 自動
}
const nameOf = s => asset.items.find(i => i[0] === s)?.[1] || s;

// ── URL（#fx または #fx/USDJPY=X） ──
function readHash() {
  const [k, s] = decodeURIComponent(location.hash.slice(1)).split('/');
  asset = assetByKey[k] || ASSETS[0];
  symbol = asset.items.some(i => i[0] === s) ? s : asset.items[0][0];
}
addEventListener('hashchange', () => { readHash(); setup(); });

function setup() {
  document.title = `${asset.name} — World Markets`;
  renderNav($('mnav'), asset.key);
  $('aname').textContent = asset.name;
  $('adesc').textContent = asset.desc;
  const col = { futures: '#a78bfa', options: '#f59e0b', commodities: '#eab308', fx: '#2dd4bf', crypto: '#fb923c' }[asset.key];
  $('about').innerHTML = `<div class="icon" style="background:${col}22;color:${col}">${ICONS[asset.key]}</div><div><b>${esc(asset.name)}とは？</b><p>${esc(asset.about)}</p></div>`;
  $('hours').textContent = SCHEDULE_TEXT[asset.schedule];
  quotes = {};
  renderTiles(); renderQuote(); renderStatus();
  refreshQuotes().then(() => loadChart());
}

function renderStatus() { $('status').innerHTML = badge(assetStatus(asset.schedule)); }

// ── 一覧（色付きタイル） ──
function renderTiles() {
  const groups = [...new Set(asset.items.map(i => i[2]))];
  $('tiles').innerHTML = groups.map(g => {
    const items = asset.items.filter(i => i[2] === g);
    return `<h3 class="grp">${esc(g)} <span class="count">${items.length}</span></h3>
      <div class="tiles">${items.map(([s, n]) => {
        const q = quotes[s] && !quotes[s].error ? quotes[s] : null;
        return `<button class="tile ${s === symbol ? 'sel' : ''}" data-s="${esc(s)}" style="background:${colorFor(q?.changePct)}">
          <span class="n">${esc(n)}</span><span class="v num">${fmtNum(q?.price, dp(q?.price))}</span><span class="p num">${fmtPct(q?.changePct)}</span></button>`;
      }).join('')}</div>`;
  }).join('');
  $('tiles').querySelectorAll('.tile').forEach(b => b.onclick = () => {
    symbol = b.dataset.s;
    history.replaceState(null, '', `#${asset.key}/${encodeURIComponent(symbol)}`);
    renderTiles(); renderQuote(); loadChart();
    $('idxname').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function renderQuote() {
  const q = quotes[symbol];
  const st = assetStatus(asset.schedule);
  $('idxname').textContent = `${nameOf(symbol)}（${symbol}）${q?.currency ? ' · ' + q.currency : ''}`;
  if (!q || q.error) {
    for (const id of ['price', 'chg', 's-chg', 's-high', 's-low', 's-prev', 's-time', 's-fresh']) $(id).textContent = '—';
    if (q?.error) $('chg').textContent = 'データを取得できませんでした';
    return;
  }
  const cls = dirClass(q.changePct), d = dp(q.price);
  $('price').textContent = fmtNum(q.price, d);
  $('chg').className = 'chg num ' + cls;
  $('chg').textContent = `${fmtChg(q.change, d)}（${fmtPct(q.changePct)}）`;
  $('s-chg').className = 'v num ' + cls; $('s-chg').textContent = `${fmtChg(q.change, d)} / ${fmtPct(q.changePct)}`;
  $('s-high').textContent = fmtNum(q.high, d);
  $('s-low').textContent = fmtNum(q.low, d);
  $('s-prev').textContent = fmtNum(q.prevClose, d);
  $('s-time').textContent = q.time ? dateTimeIn('Asia/Tokyo', new Date(q.time * 1000)).replace(/^\d+\//, '') : '—';
  const lag = Date.now() / 1000 - q.time;
  $('s-fresh').textContent = STATIC ? '保存時点の値' : st.state !== 'open' ? '休場前の最終値' : lag < 90 ? 'ほぼリアルタイム' : `約${Math.round(lag / 60)}分遅れ`;
}

async function refreshQuotes() {
  const key = asset.key;
  try {
    const d = await fetchQuotes(asset.items.map(i => i[0]));
    if (key !== asset.key) return;
    quotes = d.quotes;
    $('updated').textContent = STATIC ? `価格は ${dateTimeIn('Asia/Tokyo', new Date(d.serverTime * 1000))} 時点` : `自動更新中（15秒ごと）· 最終 ${timeIn('Asia/Tokyo', d.serverTime)}`;
    renderTiles(); renderQuote(); renderStatus(); updateLastPoint();
  } catch { $('updated').textContent = '更新に失敗しました。再試行します…'; }
}

// ── チャート（時刻は日本時間） ──
const chart = LightweightCharts.createChart($('chart'), {
  autoSize: true,
  layout: { background: { color: 'transparent' }, textColor: themeColors().text, fontFamily: 'Inter, "Hiragino Sans", "Noto Sans JP", sans-serif' },
  grid: { vertLines: { color: themeColors().grid }, horzLines: { color: themeColors().grid } },
  rightPriceScale: { borderColor: themeColors().border },
  timeScale: { borderColor: themeColors().border, timeVisible: true, secondsVisible: false },
  crosshair: { mode: LightweightCharts.CrosshairMode.Magnet },
  localization: { locale: 'ja-JP', priceFormatter: p => fmtNum(p, dp(p)) },
});
const series = chart.addAreaSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
let prevLine = null, chartData = [], chartReq = 0;

async function loadChart(silent = false) {
  const req = ++chartReq;
  $('chart-title').textContent = `${nameOf(symbol)} · ${RANGE_LABEL[range]}`;
  if (!silent) { $('chart-msg').hidden = false; $('chart-msg').textContent = 'チャートを読み込み中…'; }
  try {
    const d = await fetchChart(symbol, range);
    if (req !== chartReq) return;
    chartData = d.points.map(([t, v]) => ({ time: t + JST_OFFSET, value: v }))
      .filter((p, i, a) => i === a.length - 1 || a[i + 1].time !== p.time);
    const q = quotes[symbol], last0 = chartData.at(-1);
    if (q?.time && q.price != null && last0 && ['1y', '5y'].includes(range) && q.time + JST_OFFSET > last0.time) {
      const span = range === '1y' ? 86400 : 7 * 86400;
      if (q.time + JST_OFFSET - last0.time < span) last0.value = q.price; else chartData.push({ time: q.time + JST_OFFSET, value: q.price });
    }
    series.setData(chartData);
    if (prevLine) { series.removePriceLine(prevLine); prevLine = null; }
    const base = range === '1d' ? d.prevClose : chartData[0]?.value;
    if (range === '1d' && d.prevClose) prevLine = series.createPriceLine({ price: d.prevClose, color: themeColors().ref, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '前日終値' });
    const last = chartData.at(-1)?.value, up = last == null || base == null || last >= base;
    const tc = themeColors(); series.applyOptions({ lineColor: up ? tc.up : tc.down, topColor: up ? tc.upFill : tc.downFill, bottomColor: 'rgba(0,0,0,0)' });
    chart.applyOptions({ timeScale: { timeVisible: ['1d', '5d', '1mo'].includes(range) } });
    if (!silent) chart.timeScale().fitContent();
    $('chart-msg').hidden = chartData.length > 0;
    $('chart-msg').textContent = 'この期間のデータがありません';
    const chgTxt = base && last ? `期間の騰落: <span class="${dirClass(last - base)}">${fmtPct((last / base - 1) * 100)}</span> · ` : '';
    $('chart-note').innerHTML = `${chgTxt}時刻は日本時間`;
  } catch {
    if (req !== chartReq) return;
    $('chart-msg').hidden = false; $('chart-msg').textContent = 'チャートを取得できませんでした';
  }
}
function updateLastPoint() {
  const q = quotes[symbol];
  if (range !== '1d' || !q?.time || !chartData.length || assetStatus(asset.schedule).state !== 'open') return;
  const t = q.time + JST_OFFSET, last = chartData.at(-1);
  if (t >= last.time) { const p = { time: t, value: q.price }; if (t === last.time) chartData[chartData.length - 1] = p; else chartData.push(p); series.update(p); }
}

$('ranges').querySelectorAll('button').forEach(b => b.onclick = () => {
  range = b.dataset.r;
  $('ranges').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
  loadChart();
});

readHash(); setup();
setInterval(() => { if (!document.hidden) refreshQuotes(); }, REFRESH_MS);
setInterval(() => { renderStatus(); }, 30_000);
setInterval(() => { if (!document.hidden && range === '1d' && assetStatus(asset.schedule).state === 'open') loadChart(true); }, 60_000);

// テーマが変わったらチャートの色を塗り直す
window.addEventListener('wm-theme', () => {
  renderTiles();
  const c = themeColors();
  chart.applyOptions({ layout: { textColor: c.text }, grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } }, rightPriceScale: { borderColor: c.border }, timeScale: { borderColor: c.border } });
  loadChart(true);
});
