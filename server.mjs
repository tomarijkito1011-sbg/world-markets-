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
async function yahooChart(symbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10_000) });
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

async function getQuote(symbol) {
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
