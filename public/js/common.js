import { MARKETS, marketStatus, localParts } from './markets.js';

export const REFRESH_MS = 15_000;

const nf2 = new Intl.NumberFormat('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtNum = v => v == null || isNaN(v) ? '—' : nf2.format(v);
export const fmtChg = v => v == null || isNaN(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '±') + nf2.format(Math.abs(v));
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

export async function fetchQuotes(symbols) {
  const q = symbols ? '?symbols=' + symbols.map(encodeURIComponent).join(',') : '';
  const r = await fetch('/api/quotes' + q, { cache: 'no-store' });
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
  if (lag < 90) return 'ほぼリアルタイム';
  return `約${Math.round(lag / 60)}分遅れ`;
}

export function summarize(m, quotes) {
  const sym = m.indices[0][0];
  const q = quotes[sym];
  const status = marketStatus(m, q?.time);
  return { m, sym, idxName: m.indices[0][1], q: q && !q.error ? q : null, status };
}

export function sparkSVG(values, cls) {
  if (!values || values.length < 2) return '<svg class="spark"></svg>';
  const w = 64, h = 24, min = Math.min(...values), max = Math.max(...values), r = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1) * w).toFixed(1)},${(h - 2 - (v - min) / r * (h - 4)).toFixed(1)}`).join(' ');
  const col = cls === 'up' ? 'var(--up)' : cls === 'down' ? 'var(--down)' : 'var(--flat)';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="${col}" stroke-width="1.5" points="${pts}"/></svg>`;
}

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
