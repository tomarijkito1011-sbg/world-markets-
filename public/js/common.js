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
// テーマごとの色（ダーク: 暗い地に鮮やかな色、ライト: 白地に淡い色から濃い色）
const PALETTE = {
  dark: { none: [43, 50, 64], neutral: [52, 58, 70], up: [34, 197, 94], down: [239, 68, 68], up0: [36, 83, 58], down0: [90, 45, 51] },
  light: { none: [221, 227, 236], neutral: [203, 213, 225], up: [22, 163, 74], down: [220, 38, 38], up0: [187, 240, 204], down0: [254, 205, 205] },
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export function colorFor(pct) {
  const P = PALETTE[getTheme()];
  if (pct == null || isNaN(pct)) return `rgb(${P.none})`;
  if (Math.abs(pct) < 0.005) return `rgb(${P.neutral})`;
  const t = Math.min(1, Math.sqrt(Math.abs(pct) / 3));
  return `rgb(${pct > 0 ? mix(P.up0, P.up, t) : mix(P.down0, P.down, t)})`;
}

// ── 表示テーマ（ライト／ダーク） ──
// 画面のモード: light / dark / leaders（世界のリーダーモード。色はダークと同じで、トップの背景だけ変わる）
export const MODES = ['light', 'dark', 'leaders'];
export function getMode() { const m = document.documentElement.dataset.wmTheme; return MODES.includes(m) ? m : 'dark'; }
export function getTheme() { return getMode() === 'light' ? 'light' : 'dark'; }
export function setTheme(t) {
  document.documentElement.dataset.wmTheme = t;
  try { localStorage.setItem('wm-theme', t); } catch {}
  window.dispatchEvent(new CustomEvent('wm-theme', { detail: t }));
}
// チャートなど、CSSで色を変えられない部品のための色
export const themeColors = () => getTheme() === 'light'
  ? { text: '#5d6879', grid: 'rgba(15,23,42,.07)', border: '#dfe4ec', up: '#16a34a', down: '#dc2626', upFill: 'rgba(22,163,74,.18)', downFill: 'rgba(220,38,38,.15)', ref: '#94a3b8' }
  : { text: '#8c97ab', grid: 'rgba(35,44,63,.6)', border: '#232c3f', up: '#22c55e', down: '#ef4444', upFill: 'rgba(34,197,94,.28)', downFill: 'rgba(239,68,68,.28)', ref: '#6b7280' };

// 右上の歯車ボタンと表示設定メニュー
const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
export function mountSettings(el) {
  if (!el) return;
  el.innerHTML = `<button class="gear" id="gear" aria-haspopup="true" aria-expanded="false" aria-label="表示設定" title="表示設定">${GEAR}</button>
    <div class="menu" id="settings-menu" hidden role="dialog" aria-label="表示設定">
      <h4>画面の色</h4>
      <div class="theme-opts" role="radiogroup" aria-label="画面の色">
        <button class="theme-opt" role="radio" data-t="light"><div class="sw light"><i></i><i></i><i></i></div><span>ライトモード</span></button>
        <button class="theme-opt" role="radio" data-t="dark"><div class="sw dark"><i></i><i></i><i></i></div><span>ダークモード</span></button>
        <button class="theme-opt" role="radio" data-t="leaders"><div class="sw leaders"><b>🙂</b><b>😅</b><b>😄</b></div><span>世界のリーダー</span></button>
      </div>
      <p class="menu-note">世界のリーダーモードでは、トップの背景を各国の「首相」「大統領」が流れていきます（実在の人物ではない架空のキャラクターです）。株価が上がった国は笑顔、下がった国は冷や汗をかきます。</p>
    </div>`;
  const btn = el.querySelector('#gear'), menu = el.querySelector('#settings-menu');
  const sync = () => el.querySelectorAll('.theme-opt').forEach(b => b.setAttribute('aria-checked', String(b.dataset.t === getMode())));
  const open = v => { menu.hidden = !v; btn.setAttribute('aria-expanded', String(v)); };
  btn.onclick = e => { e.stopPropagation(); open(menu.hidden); };
  el.querySelectorAll('.theme-opt').forEach(b => b.onclick = () => { setTheme(b.dataset.t); sync(); });
  document.addEventListener('click', e => { if (!el.contains(e.target)) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
  sync();
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

export async function fetchConstituents(index) {
  const r = await fetch(STATIC ? `data/k/${safeName(index)}.json` : `api/constituents?index=${encodeURIComponent(index)}`, { cache: 'no-store' });
  if (!r.ok) return null;
  return r.json();
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

// ── 通貨の表示（その国の通貨で表示する） ──
const CUR = {
  JPY: ['', '円', '円'], USD: ['$', '', 'ドル'], EUR: ['€', '', 'ユーロ'], GBP: ['£', '', 'ポンド'], HKD: ['HK$', '', '香港ドル'],
  INR: ['₹', '', 'ルピー'], CAD: ['C$', '', 'カナダドル'], AUD: ['A$', '', '豪ドル'], CHF: ['', ' CHF', 'スイスフラン'], SEK: ['', ' kr', 'スウェーデン・クローナ'],
  SGD: ['S$', '', 'シンガポールドル'], CNY: ['', '元', '人民元'], KRW: ['₩', '', 'ウォン'], TWD: ['NT$', '', '台湾ドル'], BRL: ['R$', '', 'レアル'],
  ZAR: ['R', '', 'ランド'], ILS: ['₪', '', 'シェケル'], NOK: ['', ' kr', 'ノルウェー・クローネ'], DKK: ['', ' kr', 'デンマーク・クローネ'], PLN: ['', ' zł', 'ズウォティ'],
};
export const currencyName = c => CUR[c]?.[2] || c || '';
const moneyDp = (v, c) => c === 'JPY' || c === 'KRW' ? (Math.abs(v) % 1 > 0.001 ? 1 : 0) : 2;
export function fmtMoney(v, c, signed = false) {
  if (v == null || isNaN(v)) return '—';
  const [pre, suf] = CUR[c] || ['', ' ' + (c || '')];
  const sign = signed ? (v > 0 ? '+' : v < 0 ? '−' : '±') : v < 0 ? '−' : '';
  return sign + pre + fmtNum(Math.abs(v), moneyDp(v, c)) + suf;
}
// 時価総額: 兆・億で表す（例: 41.61兆円、4.97兆ドル）
export function fmtCap(v, c) {
  if (v == null || isNaN(v) || v <= 0) return '—';
  const unit = currencyName(c);
  if (v >= 1e12) return `${(v / 1e12).toFixed(v >= 1e14 ? 1 : 2)}兆${unit}`;
  if (v >= 1e8) return `${Math.round(v / 1e8).toLocaleString('ja-JP')}億${unit}`;
  return `${Math.round(v / 1e4).toLocaleString('ja-JP')}万${unit}`;
}
