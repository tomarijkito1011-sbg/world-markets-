// Claude のアーティファクト（サーバーなし）用に、画面と株価データ一式を dist-artifact/ に書き出す。
// 使い方: サーバーを起動した状態で  node scripts/build-artifact.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { MARKETS } from '../public/js/markets.js';

const BASE = process.env.WM_SERVER || 'http://localhost:3000';
const OUT = 'dist-artifact';
const RANGES = ['1d', '5d', '1mo', '1y', '5y'];
const safe = s => s.replace(/[^A-Za-z0-9]/g, '_');
const get = async u => { const r = await fetch(BASE + u); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.json(); };

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(path.join(OUT, 'data/c'), { recursive: true });
await fs.mkdir(path.join(OUT, 'vendor'), { recursive: true });

// 画面ファイル
await fs.cp('public/css', path.join(OUT, 'css'), { recursive: true });
await fs.cp('public/js', path.join(OUT, 'js'), { recursive: true });
for (const [name, src] of Object.entries({
  'globe.gl.min.js': 'node_modules/globe.gl/dist/globe.gl.min.js',
  'd3.min.js': 'node_modules/d3/dist/d3.min.js',
  'topojson-client.min.js': 'node_modules/topojson-client/dist/topojson-client.min.js',
  'countries-110m.json': 'node_modules/world-atlas/countries-110m.json',
  'lightweight-charts.js': 'node_modules/lightweight-charts/dist/lightweight-charts.standalone.production.js',
})) await fs.copyFile(src, path.join(OUT, 'vendor', name));

const flagScript = '<script>window.WM_STATIC = 1;</script>';
const stripPwa = s => s.replace(/<link rel="manifest"[^>]*>\n|<link rel="apple-touch-icon"[^>]*>\n|<meta name="apple-mobile[^>]*>\n/g, '');
// トップページ: アーティファクトが外枠（doctype/head/body）を付けるので中身だけにする
let index = stripPwa(await fs.readFile('public/index.html', 'utf8'));
const title = index.match(/<title>.*?<\/title>/)[0];
const headExtra = [...index.matchAll(/<link rel="(?:stylesheet|icon)"[^>]*>/g)].map(m => m[0]).join('\n');
const body = index.slice(index.indexOf('<body>') + 6, index.indexOf('</body>'));
index = `${title.replace(/<title>.*<\/title>/, '<title>World Markets</title>')}\n${headExtra}\n${body.replace('<script type="module"', flagScript + '\n<script type="module"')}`;
await fs.writeFile(path.join(OUT, 'index.html'), index);
let country = stripPwa(await fs.readFile('public/country.html', 'utf8'));
country = country.replace('<script type="module"', flagScript + '\n<script type="module"');
await fs.writeFile(path.join(OUT, 'country.html'), country);

// 株価データ
const quotes = await get('/api/quotes');
await fs.writeFile(path.join(OUT, 'data/quotes.json'), JSON.stringify(quotes));
let n = 0;
for (const m of MARKETS) for (const [sym] of m.indices) {
  const all = {};
  for (const r of RANGES) {
    try { all[r] = await get(`/api/chart?symbol=${encodeURIComponent(sym)}&range=${r}`); } catch (e) { console.warn('skip', sym, r, e.message); }
  }
  await fs.writeFile(path.join(OUT, 'data/c', safe(sym) + '.json'), JSON.stringify(all));
  n++;
}
console.log(`built ${OUT}: ${n} charts, quotes at ${new Date(quotes.serverTime * 1000).toISOString()}`);
