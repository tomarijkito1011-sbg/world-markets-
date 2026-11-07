// 書き出したデータが壊れていないか確かめる（壊れていたら公開しない）。
// 問題がなければ、公開するデータファイルの一覧を dist-artifact/publish-files.json に書く。
import fs from 'node:fs';
import path from 'node:path';
import { allSymbols, assetSymbols } from '../public/js/markets.js';

const OUT = 'dist-artifact';
const problems = [];
const q = JSON.parse(fs.readFileSync(path.join(OUT, 'data/quotes.json'), 'utf8'));
const syms = [...new Set([...allSymbols(), ...assetSymbols()])];
const ok = syms.filter(s => q.quotes[s] && !q.quotes[s].error && q.quotes[s].price != null);
if (ok.length < syms.length * 0.9) problems.push(`価格が取れた銘柄が少なすぎます: ${ok.length}/${syms.length}`);
if (Date.now() / 1000 - q.serverTime > 3 * 3600) problems.push('quotes.json が古すぎます');
for (const key of ['^N225', '^GSPC', 'USDJPY=X', 'BTC-USD']) if (!ok.includes(key)) problems.push(`主要な銘柄が取れていません: ${key}`);

const kdir = path.join(OUT, 'data/k');
const kfiles = fs.existsSync(kdir) ? fs.readdirSync(kdir) : [];
for (const f of kfiles) {
  const d = JSON.parse(fs.readFileSync(path.join(kdir, f), 'utf8'));
  const good = d.rows.filter(r => !r.error && r.price != null).length;
  if (good < d.rows.length * 0.8) problems.push(`構成銘柄の価格が足りません: ${d.index} ${good}/${d.rows.length}`);
}
const cfiles = fs.readdirSync(path.join(OUT, 'data/c'));
const emptyCharts = cfiles.filter(f => { const d = JSON.parse(fs.readFileSync(path.join(OUT, 'data/c', f), 'utf8')); return !d['1d']?.points?.length && !d['1y']?.points?.length; });
if (emptyCharts.length > cfiles.length * 0.1) problems.push(`チャートが空のファイルが多すぎます: ${emptyCharts.length}/${cfiles.length}`);

if (problems.length) { console.error('NG: 公開しません\n- ' + problems.join('\n- ')); process.exit(1); }
const files = ['data/quotes.json', ...cfiles.map(f => 'data/c/' + f), ...kfiles.map(f => 'data/k/' + f)].sort();
fs.writeFileSync(path.join(OUT, 'publish-files.json'), JSON.stringify(files));
console.log(`OK: 価格 ${ok.length}/${syms.length}、チャート ${cfiles.length}件、構成銘柄 ${kfiles.length}指数、公開するファイル ${files.length}件`);
console.log(`価格の時点: ${new Date(q.serverTime * 1000).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}（日本時間）`);
