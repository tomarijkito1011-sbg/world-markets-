import { MARKETS, byCode, tzOffset, groupOf, GROUPS } from './markets.js';
import { STATIC, statusOf, fetchConstituents, fmtMoney, fmtCap, currencyName, fetchQuotes, fetchChart, fmtNum, fmtPct, fmtChg, dirClass, flag, esc, timeIn, dateTimeIn, freshness, badge, startClock, summarize, sparkSVG, REFRESH_MS } from './common.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const code = (location.hash.slice(1) || params.get('m') || '').toUpperCase();
const m = byCode[code];
if (!m) location.replace('index.html');
addEventListener('hashchange', () => location.reload());

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
  const st = statusOf(m, quotes[m.indices[0][0]]?.time);
  $('status').innerHTML = badge(st);
  return st;
}

// ── タブ ──
function renderTabs() {
  const tabIdx = m.indices.filter(i => groupOf(i) === '主要指数' || i[0] === symbol);
  $('tabs').innerHTML = tabIdx.length > 1 ? tabIdx.map(([s, n]) => `<button data-s="${esc(s)}" class="${s === symbol ? 'active' : ''}">${esc(n)}</button>`).join('') : '';
  $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => selectSymbol(b.dataset.s));
}
function selectSymbol(s) {
  symbol = s; syncURL(); renderTabs(); renderQuote(); renderOthers(); loadChart(); loadMembers();
}
function syncURL() {}

// ── 株価 ──
function renderQuote() {
  const q = quotes[symbol];
  const st = renderStatus();
  $('idxname').textContent = `${idxName(symbol)}（${symbol}）${q?.currency ? ' · ' + q.currency : ''}${/ETF/.test(idxName(symbol)) ? ' · 指数に連動するETFの価格です' : ''}`;
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
  const q = quotes[s]; const cls = dirClass(q?.changePct); const st = statusOf(mk, quotes[mk.indices[0][0]]?.time);
  const href = linkSelf ? '#' + m.code : `country.html#${mk.code}`;
  return `<a class="mini ${linkSelf && s === symbol ? 'sel' : ''}" href="${href}" data-s="${esc(s)}">
    <div class="h"><span>${linkSelf ? '' : flag(mk.code) + ' '}${esc(linkSelf ? name : mk.name)}</span>${linkSelf ? '' : badge(st)}</div>
    <div class="s">${esc(linkSelf ? s : name)}</div>
    <div class="p"><span class="v num">${fmtNum(q?.price)}</span><span class="num ${cls}" style="font-weight:700">${fmtPct(q?.changePct)}</span></div>
    ${sparkSVG(q?.spark, cls).replace('class="spark"', 'class="spark" style="width:100%;height:28px;margin-top:6px"')}</a>`;
}
function renderOthers() {
  const others = m.indices.filter(([sym]) => sym !== symbol);
  if (!others.length) {
    $('others').innerHTML = `<div class="empty">${esc(m.name)}で表示できる指数は現在「${esc(idxName(symbol))}」のみです。</div>`;
  } else {
    // 分類ごとに見出しを付けて並べる
    $('others').innerHTML = GROUPS.map(g => {
      const items = others.filter(i => groupOf(i) === g);
      if (!items.length) return '';
      return `<h3 class="grp">${esc(g)} <span class="count">${items.length}</span></h3>
        <div class="cards">${items.map(([sym, n]) => miniCard(m, sym, n, true)).join('')}</div>`;
    }).join('');
  }
  $('others-count').textContent = others.length ? `${others.length}指数` : '';
  $('others').querySelectorAll('a.mini').forEach(a => a.onclick = e => { e.preventDefault(); selectSymbol(a.dataset.s); scrollTo({ top: 0, behavior: 'smooth' }); });
  $('region').innerHTML = regionMarkets.map(x => miniCard(x, x.indices[0][0], x.indices[0][1], false)).join('') || '<div class="empty">ほかの市場はありません。</div>';
}

async function refreshQuotes() {
  const syms = [...m.indices.map(i => i[0]), ...regionMarkets.map(x => x.indices[0][0])];
  try {
    const d = await fetchQuotes(syms);
    quotes = d.quotes;
    $('updated').textContent = STATIC ? `株価は ${dateTimeIn('Asia/Tokyo', new Date(d.serverTime * 1000))} 時点` : `自動更新中（15秒ごと）· 最終 ${timeIn('Asia/Tokyo', d.serverTime)}`;
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
    const d = await fetchChart(symbol, range);
    if (req !== chartReq) return;
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
    $('chart-note').innerHTML = `${chgTxt}${chgTxt ? ' · ' : ''}時刻は現地時間（${esc(m.tz)}）${d.derived ? '<br>※ TOPIXの指数値・前日比・高値・安値は実際の指数の値です。チャートの線だけは指数の時系列を取得できないため、連動ETF（1306）の値動きをTOPIXの水準に換算して描いています。' : ''}`;
  } catch (e) {
    if (req !== chartReq) return;
    $('chart-msg').hidden = false; $('chart-msg').textContent = 'チャートを取得できませんでした';
  }
}

// 1日チャートの最新点を株価に合わせて更新
function updateLastPoint() {
  const q = quotes[symbol];
  if (range !== '1d' || !q?.time || !chartData.length || statusOf(m, q.time).state !== 'open') return;
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
setInterval(() => { if (!document.hidden && range === '1d' && statusOf(m, quotes[symbol]?.time).state === 'open') loadChart(true); }, 60_000);

// ── 構成銘柄の一覧 ──
let members = null, sortKey = 'mcap', mReq = 0;
const yahooUrl = s => s.endsWith('.T') ? `https://finance.yahoo.co.jp/quote/${s}` : `https://finance.yahoo.com/quote/${encodeURIComponent(s)}`;
async function loadMembers() {
  const req = ++mReq, ix = symbol;
  const d = await fetchConstituents(ix).catch(() => null);
  if (req !== mReq) return;
  members = d;
  $('members').hidden = false;
  if (!d) {
    $('m-title').textContent = `${idxName(ix)}の構成銘柄`;
    $('m-sub').textContent = '';
    $('m-summary').innerHTML = ''; $('m-note').textContent = '';
    $('m-body').innerHTML = `<tr><td colspan="6" class="muted" style="padding:20px;white-space:normal">この指数の構成銘柄データはまだありません。主要国の代表指数（日経平均、NYダウ、S&P500、ナスダック100、FTSE100、DAX など）で見られます。</td></tr>`;
    return;
  }
  renderMembers();
}
function renderMembers() {
  const d = members; if (!d) return;
  const rows = d.rows.filter(r => !r.error);
  const cur = rows.find(r => r.currency)?.currency;
  $('m-title').textContent = `${d.name}の構成銘柄`;
  $('m-sub').textContent = `${d.rows.length}銘柄 · 価格の通貨: ${currencyName(cur)}${cur ? `（${cur}）` : ''}`;
  const up = rows.filter(r => r.pct > 0.0001).length, down = rows.filter(r => r.pct < -0.0001).length;
  const cap = rows.reduce((a, r) => a + (r.mcap || 0), 0);
  $('m-summary').innerHTML = `<span><b class="up">${up}</b>値上がり</span><span><b class="down">${down}</b>値下がり</span><span><b class="flat">${rows.length - up - down}</b>変わらず</span><span>時価総額の合計 <b style="color:var(--text)">${fmtCap(cap, cur)}</b></span>`;
  const q = $('m-search').value.trim().toLowerCase();
  let list = d.rows.filter(r => !q || (r.n || '').toLowerCase().includes(q) || (r.en || '').toLowerCase().includes(q) || r.s.toLowerCase().includes(q));
  const capKey = r => r.mcap ?? (r.w ? r.w * 1e13 : 0);
  const by = { mcap: (a, b) => capKey(b) - capKey(a), up: (a, b) => (b.pct ?? -1e9) - (a.pct ?? -1e9), down: (a, b) => (a.pct ?? 1e9) - (b.pct ?? 1e9), code: (a, b) => a.s.localeCompare(b.s, 'ja', { numeric: true }) }[sortKey];
  list = [...list].sort(by);
  const code = s => s.replace(/\.(T|L|DE|PA|HK|NS|BO|TO|AX|SW|AS|MC|MI|ST|SI)$/, '');
  $('m-body').innerHTML = list.length ? list.map(r => {
    const cls = dirClass(r.pct);
    const sub = [r.n && r.en && r.n !== r.en && !r.s.endsWith('.T') ? r.en : '', r.sector, r.w != null ? `ウエイト ${r.w.toFixed(r.w >= 0.1 ? 2 : 3)}%` : ''].filter(Boolean).join(' · ');
    return `<tr><td class="c-code">${esc(code(r.s))}</td>
      <td class="nm"><a href="${yahooUrl(r.s)}" target="_blank" rel="noopener">${esc(r.n || r.en || r.s)}</a>${sub ? `<small>${esc(sub)}</small>` : ''}</td>
      <td class="r mono">${fmtMoney(r.price, r.currency)}<small class="m-only ${cls}">${fmtMoney(r.change, r.currency, true)}</small></td>
      <td class="r mono c-chg ${cls}">${fmtMoney(r.change, r.currency, true)}</td>
      <td class="r"><span class="pc ${cls}">${fmtPct(r.pct)}</span></td>
      <td class="r mono">${fmtCap(r.mcap, r.currency)}</td></tr>`;
  }).join('') : `<tr><td colspan="6" class="muted" style="padding:20px">「${esc(q)}」に当てはまる銘柄はありません。</td></tr>`;
  const pending = d.pending ? d.rows.filter(r => !r.error && r.mcap == null).length : 0;
  $('m-note').innerHTML = `${pending ? `時価総額を集計中です（残り${pending}銘柄。少し待って開き直すと表示されます）。` : ''}銘柄リストの出典: ${esc(d.source)}（${esc(d.asOf)} 時点）。時価総額は「現在値 × 直近の決算で報告された発行済株式数」で計算した概算です。銘柄名を押すと Yahoo!ファイナンスが開きます。${STATIC ? '' : ''}`;
}
$('m-search').addEventListener('input', renderMembers);
$('m-sort').querySelectorAll('button').forEach(b => b.onclick = () => {
  sortKey = b.dataset.k;
  $('m-sort').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
  renderMembers();
});
loadMembers();
setInterval(() => { if (!document.hidden && !STATIC && statusOf(m, quotes[symbol]?.time).state === 'open') loadMembers(); }, 30_000);
