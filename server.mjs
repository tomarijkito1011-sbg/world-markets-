// 世界の株式市場ダッシュボード — サーバー
// ・public/ の画面を配信
// ・Yahoo Finance から株価を取得して中継（ブラウザから直接は取得できないため）
// ・開場中の市場は短い間隔、閉場中は長い間隔でキャッシュし、取得元への負荷を抑える
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKETS, ASSETS, scheduleState, assetStatus } from './public/js/markets.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const OPEN_TTL = 10_000;      // 開場中: 10秒
const CLOSED_TTL = 5 * 60_000; // 閉場中: 5分
const UA = 'Mozilla/5.0 (WorldMarkets dashboard)';

const VENDOR = {
  'globe.gl.min.js': 'node_modules/globe.gl/dist/globe.gl.min.js',
  'd3.min.js': 'node_modules/d3/dist/d3.min.js',
  'topojson-client.min.js': 'node_modules/topojson-client/dist/topojson-client.min.js',
  'countries-110m.json': 'node_modules/world-atlas/countries-110m.json',
  'lightweight-charts.js': 'node_modules/lightweight-charts/dist/lightweight-charts.standalone.production.js',
};
const MIME = { '.webmanifest': 'application/manifest+json', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

const symbolMarket = {};
for (const m of MARKETS) for (const [s] of m.indices) symbolMarket[s] = m;
const symbolAsset = {};
for (const a of ASSETS) for (const [s] of a.items) symbolAsset[s] = a;
const known = s => !!(symbolMarket[s] || symbolAsset[s]);

// ── Yahoo Finance ──
// query1 が失敗したときは query2（同じ内容の別サーバー）で取り直す
async function yfetch(pathQuery) {
  let last;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try {
      const r = await fetch(`https://${host}${pathQuery}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12_000) });
      if (r.status >= 500 || r.status === 429) { last = new Error(`HTTP ${r.status}`); continue; }
      return r;
    } catch (e) { last = e; }
  }
  throw last;
}
async function yahooChart(symbol, range, interval) {
  const r = await yfetch(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`);
  const j = await r.json().catch(() => null);
  const res = j?.chart?.result?.[0];
  if (!res) throw new Error(j?.chart?.error?.description || `HTTP ${r.status}`);
  return res;
}

const cache = new Map(); // key -> { t, data, promise }
async function cached(key, ttl, fn) {
  const c = cache.get(key);
  if (c?.data && Date.now() - c.t < ttl) return c.data;
  if (c?.promise) return c.promise;
  const promise = fn().then(data => { cache.set(key, { t: Date.now(), data }); return data; })
    .catch(e => { cache.set(key, { ...c, promise: null }); if (c?.data) return c.data; throw e; });
  cache.set(key, { ...c, promise });
  return promise;
}

function quoteTTL(symbol) {
  const m = symbolMarket[symbol], a = symbolAsset[symbol];
  const st = m ? scheduleState(m).state : a ? assetStatus(a.schedule).state : 'open';
  return st === 'open' ? OPEN_TTL : CLOSED_TTL;
}

// ── TOPIX（指数そのもの） ──
// 指数値・前日比・高値・安値は Yahoo!ファイナンス（日本）の TOPIX（998405.T）のページから取る。
// チャートの線は取得先がないため、連動ETF(1306)の値動きを TOPIX の水準に換算して描く。
const TOPIX = '998405.T', TOPIX_ETF = '1306.T';
const num = v => v == null ? null : Number(String(v).replace(/,/g, ''));
async function topixOfficial() {
  const r = await fetch('https://finance.yahoo.co.jp/quote/998405.T', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
  const html = (await r.text()).replace(/\\"/g, '"');
  const pb = html.match(/"priceBoard":\{"code":"998405\.T".*?"price":\{"changePrice":"([^"]+)","changePriceRate":"([^"]+)".*?"value":"([^"]+)"/);
  const val = k => html.match(new RegExp(`"value":"([^"]+)"[^}]*"wordKey":"${k}"`))?.[1];
  if (!pb) throw new Error('TOPIX not found');
  return { price: num(pb[3]), change: num(pb[1]), changePct: num(pb[2]), prevClose: num(val('previousPrice')), high: num(val('highPrice')), low: num(val('lowPrice')) };
}
async function getTopixQuote() {
  return cached('q:' + TOPIX, quoteTTL(TOPIX_ETF), async () => {
    const [o, etf] = await Promise.all([topixOfficial(), getQuote(TOPIX_ETF)]);
    const k = o.price / etf.price;
    return { symbol: TOPIX, price: o.price, prevClose: o.prevClose, change: o.change, changePct: o.changePct, high: o.high, low: o.low,
      currency: 'JPY', time: etf.time, fetchedAt: Math.floor(Date.now() / 1000), spark: (etf.spark || []).map(v => v * k), source: 'Yahoo!ファイナンス（TOPIX 998405）' };
  });
}

async function getQuote(symbol) {
  if (symbol === TOPIX) return getTopixQuote();
  return cached('q:' + symbol, quoteTTL(symbol), async () => {
    const res = await yahooChart(symbol, '1d', '5m');
    const m = res.meta;
    const closes = (res.indicators?.quote?.[0]?.close || []).filter(v => v != null);
    const price = m.regularMarketPrice ?? closes.at(-1);
    const prev = m.previousClose ?? m.chartPreviousClose;
    return {
      symbol, price, prevClose: prev,
      change: price != null && prev ? price - prev : null,
      changePct: price != null && prev ? (price / prev - 1) * 100 : null,
      high: m.regularMarketDayHigh ?? null, low: m.regularMarketDayLow ?? null,
      currency: m.currency, time: m.regularMarketTime, fetchedAt: Math.floor(Date.now() / 1000),
      spark: closes.length > 60 ? closes.filter((_, i) => i % Math.ceil(closes.length / 60) === 0) : closes,
    };
  });
}

// 同時アクセス数を制限して並列取得
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]).catch(e => ({ symbol: items[k], error: e.message })); }
  }));
  return out;
}

const RANGES = { '1d': ['1d', '2m'], '5d': ['5d', '15m'], '1mo': ['1mo', '60m'], '1y': ['1y', '1d'], '5y': ['5y', '1wk'] };
const CHART_TTL = { '1d': 15_000, '5d': 60_000, '1mo': 5 * 60_000, '1y': 30 * 60_000, '5y': 60 * 60_000 };

async function getChart(symbol, range) {
  if (symbol === TOPIX) {
    const [etf, q] = await Promise.all([getChart(TOPIX_ETF, range), getTopixQuote()]);
    const last = etf.points.at(-1)?.[1];
    let f = v => v * q.price / last;
    // 1日チャートは「前日終値」と「現在値」の2点で合わせる
    if (range === '1d' && etf.prevClose && last !== etf.prevClose) {
      const a = (q.price - q.prevClose) / (last - etf.prevClose), b = q.price - a * last;
      f = v => a * v + b;
    }
    return { ...etf, symbol, prevClose: range === '1d' ? q.prevClose : etf.prevClose && f(etf.prevClose), points: etf.points.map(([t, v]) => [t, f(v)]), derived: true };
  }
  const [r, iv] = RANGES[range];
  const ttl = range === '1d' ? quoteTTL(symbol) === OPEN_TTL ? CHART_TTL['1d'] : CLOSED_TTL : CHART_TTL[range];
  return cached(`c:${symbol}:${range}`, ttl, async () => {
    const res = await yahooChart(symbol, r, iv);
    const ts = res.timestamp || [], cl = res.indicators?.quote?.[0]?.close || [];
    const points = [];
    for (let k = 0; k < ts.length; k++) if (cl[k] != null) points.push([ts[k], cl[k]]);
    return { symbol, range, gmtoffset: res.meta.gmtoffset || 0, prevClose: res.meta.previousClose ?? res.meta.chartPreviousClose, points };
  });
}

// ── 指数の構成銘柄 ──
// 銘柄リストは public/data/constituents/<記号>.json（scripts/fetch-constituents.mjs で作成）
const safeName = s => s.replace(/[^A-Za-z0-9]/g, '_');
async function loadList(index) {
  return cached('list:' + index, 3600_000, async () => JSON.parse(await fs.readFile(path.join(ROOT, 'public/data/constituents', safeName(index) + '.json'), 'utf8')));
}
// 複数銘柄の価格を一度に取得（spark は1回に最大20銘柄）
async function sparkBatch(symbols) {
  const r = await yfetch(`/v7/finance/spark?symbols=${symbols.map(encodeURIComponent).join(',')}&range=1d&interval=1d`);
  const j = await r.json();
  const out = {};
  for (const it of j?.spark?.result || []) {
    const m = it.response?.[0]?.meta; if (!m) continue;
    out[it.symbol] = { price: m.regularMarketPrice, prev: m.previousClose ?? m.chartPreviousClose, high: m.regularMarketDayHigh, low: m.regularMarketDayLow,
      currency: m.currency, time: m.regularMarketTime, name: m.longName || m.shortName };
  }
  return out;
}
// 発行済株式数（四半期→年次の順に最新値）。1日キャッシュ
// 株式数はファイルにも保存して、サーバーを再起動しても取り直さなくて済むようにする
const SHARES_FILE = path.join(ROOT, 'data/shares.json');
const SHARES_TTL = 30 * 86400_000; // 発行済株式数はめったに変わらないので30日使う
let shareStore = {};
try { shareStore = JSON.parse(await fs.readFile(SHARES_FILE, 'utf8')); } catch {}
for (const [k, v] of Object.entries(shareStore)) if (Date.now() - v.t < SHARES_TTL) cache.set('sh:' + k, { t: v.t, data: v.data });
let saveTimer = null;
const saveShares = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.mkdir(path.dirname(SHARES_FILE), { recursive: true }).then(() => fs.writeFile(SHARES_FILE, JSON.stringify(shareStore, null, 0))).catch(() => {}), 3000); };
async function getShares(symbol) {
  const c = cache.get('sh:' + symbol);
  if (c?.data && Date.now() - c.t < SHARES_TTL) return c.data;
  return cached('sh:' + symbol, SHARES_TTL, async () => {
    const now = Math.floor(Date.now() / 1000);
    const r = await yfetch(`/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}?type=quarterlyOrdinarySharesNumber,annualOrdinarySharesNumber&period1=${now - 3 * 365 * 86400}&period2=${now}`);
    const j = await r.json();
    let best = null;
    for (const res of j?.timeseries?.result || []) {
      const t = res.meta?.type?.[0]; const arr = (res[t] || []).filter(Boolean);
      const last = arr.at(-1); if (!last) continue;
      if (!best || last.asOfDate > best.asOfDate) best = { asOfDate: last.asOfDate, shares: last.reportedValue.raw };
    }
    if (best) { shareStore[symbol] = { t: Date.now(), data: best }; saveShares(); }
    return best;
  });
}
// 100分の1単位の通貨（ペンス・セント・アゴロト）を本来の通貨に直す
const bgShares = new Set(), sharesTried = new Set();
const MINOR = { GBp: ['GBP', 100], GBX: ['GBP', 100], ZAc: ['ZAR', 100], ILA: ['ILS', 100] };
async function getConstituents(index) {
  const list = await loadList(index);
  const m = symbolMarket[index];
  const open = m ? scheduleState(m).state === 'open' : false;
  return cached('k:' + index, open ? 20_000 : 5 * 60_000, async () => {
    const syms = list.items.map(i => i.s);
    const chunks = []; for (let i = 0; i < syms.length; i += 20) chunks.push(syms.slice(i, i + 20));
    const prices = Object.assign({}, ...(await pool(chunks, 4, c => sparkBatch(c).catch(() => ({})))));
    // 株式数: 銘柄が多い指数（TOPIXなど）は、まだ取れていない分を裏で集めて、取れた分から時価総額を出す
    let shares;
    if (syms.length <= 600) shares = await pool(syms, 6, s => getShares(s).catch(() => null));
    else {
      shares = syms.map(s => cache.get('sh:' + s)?.data || null);
      const missing = syms.filter((s, i) => !shares[i] && !sharesTried.has(s));
      if (missing.length && !bgShares.has(index)) {
        bgShares.add(index);
        pool(missing, 6, s => getShares(s).catch(() => null).finally(() => sharesTried.add(s))).finally(() => { bgShares.delete(index); cache.delete('k:' + index); });
      }
    }
    const rows = list.items.map((it, k) => {
      const p = prices[it.s]; if (!p || p.price == null) return { ...it, error: true };
      let { price, prev, high, low, currency } = p;
      const minor = MINOR[currency];
      if (minor) { const d = minor[1]; price /= d; prev = prev != null ? prev / d : prev; high = high != null ? high / d : high; low = low != null ? low / d : low; currency = minor[0]; }
      const sh = shares[k]?.shares;
      return { ...it, w: it.w, price, prev, change: prev ? price - prev : null, pct: prev ? (price / prev - 1) * 100 : null, high, low,
        currency, time: p.time, mcap: sh ? sh * price : null, en: p.name };
    });
    return { index, name: list.name, source: list.source, asOf: list.asOf, serverTime: Math.floor(Date.now() / 1000), pending: bgShares.has(index), rows };
  });
}

// ── HTTP ──
function send(res, code, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(code, { 'Content-Type': type, ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function serveFile(res, file, cacheCtl = 'no-cache') {
  try {
    const buf = await fs.readFile(file);
    send(res, 200, buf, MIME[path.extname(file)] || 'application/octet-stream', { 'Cache-Control': cacheCtl });
  } catch { send(res, 404, 'Not found', 'text/plain'); }
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/api/quotes') {
      const syms = u.searchParams.get('symbols')?.split(',').filter(known) || Object.keys(symbolMarket);
      const list = await pool([...new Set(syms)], 8, getQuote);
      return send(res, 200, { serverTime: Math.floor(Date.now() / 1000), quotes: Object.fromEntries(list.map(q => [q.symbol, q])) }, undefined, { 'Cache-Control': 'no-store' });
    }
    if (u.pathname === '/api/constituents') {
      const ix = u.searchParams.get('index');
      if (!symbolMarket[ix]) return send(res, 400, { error: 'bad params' });
      try { return send(res, 200, await getConstituents(ix), undefined, { 'Cache-Control': 'no-store' }); }
      catch { return send(res, 404, { error: 'no list' }); }
    }
    if (u.pathname === '/api/chart') {
      const s = u.searchParams.get('symbol'), r = u.searchParams.get('range') || '1d';
      if (!known(s) || !RANGES[r]) return send(res, 400, { error: 'bad params' });
      return send(res, 200, await getChart(s, r), undefined, { 'Cache-Control': 'no-store' });
    }
    if (u.pathname.startsWith('/vendor/')) {
      const f = VENDOR[u.pathname.slice(8)];
      return f ? serveFile(res, path.join(ROOT, f), 'public, max-age=86400') : send(res, 404, 'Not found', 'text/plain');
    }
    let p = u.pathname === '/' ? '/index.html' : u.pathname;
    if (p === '/country') p = '/country.html';
    const file = path.normalize(path.join(ROOT, 'public', p));
    if (!file.startsWith(path.join(ROOT, 'public'))) return send(res, 403, 'Forbidden', 'text/plain');
    return serveFile(res, file);
  } catch (e) {
    console.error(e);
    send(res, 502, { error: e.message });
  }
});

server.listen(PORT, () => console.log(`World Markets: http://localhost:${PORT}`));
