import { MARKETS, ASSETS, marketStatus, localParts } from './markets.js';

export const REFRESH_MS = 15_000;

const nfCache = {};
const nf = dp => nfCache[dp] ||= new Intl.NumberFormat('ja-JP', { minimumFractionDigits: dp, maximumFractionDigits: dp });
// 小数の桁数: 指定がなければ値の大きさに合わせる（1未満は桁を増やす）
export const autoDp = v => { const a = Math.abs(v); return a >= 10 ? 2 : a >= 1 ? 4 : a >= 0.01 ? 5 : a > 0 ? Math.min(10, 3 - Math.floor(Math.log10(a))) : 2; };
export const fmtNum = (v, dp) => v == null || isNaN(v) ? '—' : nf(dp ?? autoDp(v)).format(v);
export const fmtChg = (v, dp) => v == null || isNaN(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '±') + nf(dp ?? autoDp(v)).format(Math.abs(v));
export const fmtPct = v => v == null || isNaN(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(2) + '%';
export const dirClass = v => v == null || isNaN(v) ? 'flat' : v > 0.0001 ? 'up' : v < -0.0001 ? 'down' : 'flat';
export const flag = code => String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 騰落率 → 色（緑＝上昇、赤＝下落。±3%で最も濃い）
const NEUTRAL = [52, 58, 70], UP = [34, 197, 94], DOWN = [239, 68, 68], UP0 = [36, 83, 58], DOWN0 = [90, 45, 51];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export function colorFor(pct) {
  if (pct == null || isNaN(pct)) return 'rgb(43,50,64)';
  if (Math.abs(pct) < 0.005) return `rgb(${NEUTRAL})`;
  const t = Math.min(1, Math.sqrt(Math.abs(pct) / 3));
  return `rgb(${pct > 0 ? mix(UP0, UP, t) : mix(DOWN0, DOWN, t)})`;
}

// STATIC: サーバーなしで、保存済みの株価データ（data/）を表示するモード
export const STATIC = !!window.WM_STATIC;
const safeName = s => s.replace(/[^A-Za-z0-9]/g, '_');

export async function fetchChart(symbol, range) {
  if (STATIC) {
    const r = await fetch(`data/c/${safeName(symbol)}.json`, { cache: 'no-store' });
    if (!r.ok) throw new Error('chart ' + r.status);
    const d = (await r.json())[range];
    if (!d) throw new Error('no data');
    return d;
  }
  const r = await fetch(`api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`, { cache: 'no-store' });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
}

export async function fetchQuotes(symbols) {
  if (STATIC) {
    const r = await fetch('data/quotes.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('quotes ' + r.status);
    return r.json();
  }
  const q = symbols ? '?symbols=' + symbols.map(encodeURIComponent).join(',') : '';
  const r = await fetch('api/quotes' + q, { cache: 'no-store' });
  if (!r.ok) throw new Error('quotes ' + r.status);
  return r.json();
}

export function timeIn(tz, unix, withSec = true) {
  if (!unix) return '—';
  return new Intl.DateTimeFormat('ja-JP', { timeZone: tz, hour: '2-digit', minute: '2-digit', ...(withSec ? { second: '2-digit' } : {}), hourCycle: 'h23' }).format(new Date(unix * 1000));
}
export function dateTimeIn(tz, date = new Date()) {
  return new Intl.DateTimeFormat('ja-JP', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date);
}

// データの鮮度
export function freshness(q, status) {
  if (!q?.time) return '';
  const lag = Math.max(0, Date.now() / 1000 - q.time);
  if (status.state !== 'open') return '終値ベース';
  if (STATIC) return '保存時点の値';
  if (lag < 90) return 'ほぼリアルタイム';
  return `約${Math.round(lag / 60)}分遅れ`;
}

export function summarize(m, quotes) {
  const sym = m.indices[0][0];
  const q = quotes[sym];
  const status = statusOf(m, q?.time);
  return { m, sym, idxName: m.indices[0][1], q: q && !q.error ? q : null, status };
}

export function sparkSVG(values, cls) {
  if (!values || values.length < 2) return '<svg class="spark"></svg>';
  const w = 64, h = 24, min = Math.min(...values), max = Math.max(...values), r = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1) * w).toFixed(1)},${(h - 2 - (v - min) / r * (h - 4)).toFixed(1)}`).join(' ');
  const col = cls === 'up' ? 'var(--up)' : cls === 'down' ? 'var(--down)' : 'var(--flat)';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="${col}" stroke-width="1.5" points="${pts}"/></svg>`;
}

// 保存データ表示中は株価の時刻が古いので、祝日の推定を行わない
export const statusOf = (m, t) => marketStatus(m, STATIC ? null : t);

export function badge(status) {
  return `<span class="badge ${status.state}">${esc(status.label)}</span>`;
}

export function startClock(el) {
  const tick = () => {
    const p = localParts('Asia/Tokyo');
    el.innerHTML = `日本時間 <b class="num">${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}:${String(p.s).padStart(2, '0')}</b>`;
  };
  tick(); setInterval(tick, 1000);
}

export { MARKETS };

// 投資対象のアイコン（線画のSVG）
const svg = d => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONS = {
  index: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>'),
  futures: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 17l3-3 2 2 3-3"/>'),
  options: svg('<path d="M2 12h4l3-8 5 16 3-8h5"/>'),
  commodities: svg('<path d="M3 20h18l-2.5-6h-13z"/><path d="M7 14h10l-2-5H9z"/>'),
  fx: svg('<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>'),
  crypto: svg('<circle cx="12" cy="12" r="9"/><path d="M10 7.5h3a2 2 0 0 1 0 4h-3zM10 11.5h3.5a2 2 0 0 1 0 4H10zM10 7.5v8M11.5 6v1.5M11.5 15.5V17"/>'),
};

// 画面上部の切り替えメニュー（株価指数／先物／オプション／コモディティー／為替／仮想通貨）
export function renderNav(el, active) {
  const items = [['index', '株価指数', 'index.html', '世界40か国の株価'], ...ASSETS.map(a => [a.key, a.name, `asset.html#${a.key}`, a.short])];
  el.innerHTML = items.map(([k, n, href, sub]) => `<a href="${href}" class="${k === active ? 'active' : ''}"${k === active ? ' aria-current="page"' : ''} title="${esc(sub)}">${ICONS[k]}<span><b>${esc(n)}</b><small>${esc(sub)}</small></span></a>`).join('');
  try { el.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch {}
}
