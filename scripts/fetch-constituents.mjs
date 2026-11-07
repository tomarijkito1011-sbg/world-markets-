// 指数の構成銘柄リストを作り、public/data/constituents/<記号>.json に保存する。
// 出典: Wikipedia（構成銘柄）、日本取引所グループ（日本企業の名前と業種）
// 使い方: NODE_USE_ENV_PROXY=1 node scripts/fetch-constituents.mjs [JPXのdata_j.xlsxのパス]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as cheerio from 'cheerio';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const OUT = 'public/data/constituents';
const CACHE = process.env.WIKI_CACHE || '.cache/wiki';
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const safe = s => s.replace(/[^A-Za-z0-9]/g, '_');
const today = new Date().toISOString().slice(0, 10);

async function wiki(page) {
  const f = path.join(CACHE, encodeURIComponent(page) + '.html');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const [lang, ...t] = page.split(':'); const title = t.join(':');
  // 記事本文のHTML（?action=render）を取得する。API は混み合うと 429 を返すため使わない
  for (let a = 0; a < 5; a++) {
    const r = await fetch(`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}?action=render`,
      { headers: { 'User-Agent': 'WorldMarketsDashboard/0.1 (personal non-commercial project)' } });
    if (r.status === 429) { await sleep(8000 * (a + 1)); continue; }
    if (!r.ok) throw new Error(`HTTP ${r.status} ${page}`);
    const html = await r.text();
    fs.writeFileSync(f, html); await sleep(2500);
    return html;
  }
  throw new Error('rate limited ' + page);
}
const clean = s => s.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();

// 表から銘柄を取り出す（見出しの名前で列を探す）
function fromTable(html, { ticker, name, sector, min = 10, max = 1e9 }) {
  const $ = cheerio.load(html);
  for (const t of $('table').toArray()) {
    const rows = $(t).find('tr').toArray();
    const hdrRow = rows.find(r => $(r).find('th').length >= 2); if (!hdrRow) continue;
    const hdr = $(hdrRow).find('th,td').toArray().map(x => clean($(x).text()));
    const ti = hdr.findIndex(h => ticker.test(h)), ni = hdr.findIndex(h => name.test(h)), si = sector ? hdr.findIndex(h => sector.test(h)) : -1;
    if (ti < 0 || ni < 0) continue;
    const items = [];
    for (const r of rows.slice(rows.indexOf(hdrRow) + 1)) {
      const c = $(r).find('th,td').toArray().map(x => clean($(x).text()));
      if (c.length < hdr.length - 1 || !c[ti]) continue;
      items.push({ t: c[ti], n: c[ni], sector: si >= 0 ? c[si] : undefined });
    }
    if (items.length >= min && items.length <= max) return items;
  }
  throw new Error('table not found');
}

// 日本企業の名前と業種（JPX）
const jpx = {};
const xlsxPath = process.argv[2];
if (xlsxPath) {
  const wb = XLSX.readFile(xlsxPath);
  for (const r of XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).slice(1)) jpx[String(r[1])] = { n: String(r[2]).normalize('NFKC'), sector: r[5] };
}

const SOURCES = [
  { index: '^N225', name: '日経平均株価', page: 'en:Nikkei 225', custom: html => {
      const text = cheerio.load(html).root().text();
      const codes = [...new Set([...text.matchAll(/(?:TYO|TSE)\s*:\s*([0-9]{3}[0-9A-Z])\b/g)].map(m => m[1]))];
      return codes.map(c => ({ s: c + '.T', code: c, n: jpx[c]?.n, sector: jpx[c]?.sector }));
    } },
  { index: '^GSPC', name: 'S&P 500', page: 'en:List of S&P 500 companies', ticker: /^symbol$/i, name: /^security$/i, sector: /GICS Sector/i, min: 400 },
  // NYダウ: 最新の30社は社名だけの表なので、S&P500 のリストで記号を引く（S&P500 を先に作っておく）
  { index: '^DJI', name: 'NYダウ', page: 'en:Historical components of the Dow Jones Industrial Average', custom: html => {
      const $ = cheerio.load(html);
      const tbl = $('table').toArray().find(t => $(t).find('td').length >= 28);
      const cells = $(tbl).find('th,td').toArray().map(x => clean($(x).text()));
      const stop = cells.findIndex(c => /dropped from/i.test(c));
      const names = (stop >= 0 ? cells.slice(0, stop) : cells).filter(c => c && !c.includes('↓')).map(c => c.replace(/[↑†]/g, '').replace(/\(formerly.*$/i, '').trim());
      const ALIAS = { 'international business machines corporation': 'IBM' };
      const sp = JSON.parse(fs.readFileSync(path.join(OUT, '_GSPC.json'), 'utf8')).items;
      const norm = x => x.toLowerCase().replace(/^the /, '').replace(/[.,'’&()]/g, ' ').replace(/\b(inc|company|corporation|corp|co|group|incorporated|class [abc])\b/g, '').replace(/\s+/g, ' ').trim();
      return names.map(nm => {
        const k = norm(nm);
        const hit = (ALIAS[nm.toLowerCase()] && sp.find(i => i.s === ALIAS[nm.toLowerCase()])) || sp.find(i => norm(i.n) === k) || sp.find(i => norm(i.n).startsWith(k) || k.startsWith(norm(i.n)));
        if (!hit) console.warn('  DJI: no match for', nm);
        return hit ? { s: hit.s, n: nm, sector: hit.sector } : null;
      }).filter(Boolean);
    } },
  { index: '^FTSE', name: 'FTSE 100', page: 'en:FTSE 100 Index', ticker: /^(ticker|EPIC)$/i, name: /^company$/i, sector: /sector/i, suffix: '.L', map: t => t.replace(/\.$/, '').replace(/\./g, '-') },
  { index: '^GDAXI', name: 'DAX', page: 'en:DAX', ticker: /^ticker$/i, name: /^company$/i, sector: /sector/i, suffix: '.DE' },
  { index: '^FCHI', name: 'CAC 40', page: 'en:CAC 40', ticker: /^ticker$/i, name: /^company$/i, sector: /^sector$/i, suffix: '.PA' },
  { index: '^HSI', name: 'ハンセン指数', page: 'en:Hang Seng Index', ticker: /^ticker$/i, name: /^name$/i, sector: /sub-index/i, map: t => t.replace(/\D/g, '').padStart(4, '0').slice(-4), suffix: '.HK' },
  { index: '^NSEI', name: 'NIFTY 50', page: 'en:NIFTY 50', ticker: /symbol/i, name: /company/i, sector: /sector/i, suffix: '.NS' },
  { index: '^BSESN', name: 'SENSEX', page: 'en:BSE SENSEX', ticker: /symbol|code/i, name: /company/i, sector: /sector/i, suffix: '.BO' },
  { index: '^GSPTSE', name: 'S&P/TSX 60（総合指数の上位60社）', page: 'en:S&P/TSX 60', ticker: /symbol|ticker/i, name: /company/i, sector: /sector/i, suffix: '.TO', map: t => t.replace(/\./g, '-') },
  { index: '^AXJO', name: 'S&P/ASX 50（ASX200の上位50社）', page: 'en:S&P/ASX 50', ticker: /code|ticker|symbol/i, name: /company/i, sector: /sector/i, suffix: '.AX' },
  { index: '^SSMI', name: 'SMI', page: 'en:Swiss Market Index', ticker: /ticker|symbol/i, name: /^(company|name)$/i, sector: /industry|sector/i, suffix: '.SW' },
  { index: '^AEX', name: 'AEX', page: 'en:AEX index', ticker: /ticker|symbol/i, name: /company/i, sector: /ICB|sector|industry/i, suffix: '.AS' },
  { index: '^IBEX', name: 'IBEX 35', page: 'en:IBEX 35', ticker: /ticker|symbol/i, name: /company/i, sector: /sector/i, suffix: '.MC' },
  { index: 'FTSEMIB.MI', name: 'FTSE MIB', page: 'en:FTSE MIB', ticker: /ticker|symbol/i, name: /company/i, sector: /ICB|sector/i, suffix: '.MI' },
  { index: '^OMX', name: 'OMXストックホルム30', page: 'en:OMX Stockholm 30', ticker: /ticker|symbol/i, name: /company|name/i, sector: /sector|ICB/i, suffix: '.ST', map: t => t.replace(/ /g, '-') },
  { index: '^STI', name: 'STI', page: 'en:Straits Times Index', ticker: /ticker|symbol|code/i, name: /company|name/i, sector: /sector|industry/i, suffix: '.SI' },
];

const only = process.env.ONLY?.split(',');
for (const src of SOURCES) {
  if (only && !only.includes(src.index)) continue;
  try {
    let items, lastErr;
    for (const pg of [].concat(src.page)) {
      try { const html = await wiki(pg); items = src.custom ? src.custom(html) : fromTable(html, src); break; } catch (e) { lastErr = e; }
    }
    if (!items) throw lastErr;
    if (!src.custom) items = items.map(it => {
      // 「SGX: C38U」のような取引所名を外し、他市場の記号（例 AIR.PA）はそのまま使う
      let t = (src.map ? src.map(it.t) : it.t).replace(/^[A-Z]+\s*:\s*/, '').replace(/\s.*$/, '');
      if (/\.[A-Z]{1,2}$/.test(t) && src.suffix && t !== t.replace(/\.[A-Z]{1,2}$/, '') && /\.(PA|DE|AS|MI|MC|L|SW|BR|HE|ST|CO|OL|LS|IR|VI)$/.test(t)) return { s: t, n: it.n, sector: it.sector };
      t = t.replace(/\.(?=[A-Z]$)/, '-') + (src.suffix || '');
      return { s: t, n: it.n, sector: it.sector };
    });
    items = items.filter((x, i, a) => x.s && a.findIndex(y => y.s === x.s) === i);
    const out = { index: src.index, name: src.name, source: src.custom ? 'Wikipedia（構成銘柄）・日本取引所グループ（銘柄名・業種）' : 'Wikipedia', asOf: today, items };
    fs.writeFileSync(path.join(OUT, safe(src.index) + '.json'), JSON.stringify(out, null, 0));
    console.log('OK ', src.index, items.length, items.slice(0, 3).map(i => `${i.s}:${i.n}`).join(' / '));
  } catch (e) { console.log('NG ', src.index, e.message); }
}
