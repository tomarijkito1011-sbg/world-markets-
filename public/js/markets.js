// 市場の定義（サーバーとブラウザの両方で使う）
// id: world-atlas の国コード（ISO 3166-1 数値）。地図に形がない小さな市場は point（緯度経度）で表示する。
export const MARKETS = [
  // ── 北米・南米 ──
  { code: 'US', id: '840', name: 'アメリカ', region: '北米', tz: 'America/New_York', sessions: [['09:30', '16:00']],
    indices: [['^GSPC', 'S&P 500'], ['^DJI', 'NYダウ'], ['^IXIC', 'ナスダック総合'], ['^RUT', 'ラッセル2000']] },
  { code: 'CA', id: '124', name: 'カナダ', region: '北米', tz: 'America/Toronto', sessions: [['09:30', '16:00']],
    indices: [['^GSPTSE', 'S&P/TSX総合']] },
  { code: 'MX', id: '484', name: 'メキシコ', region: '中南米', tz: 'America/Mexico_City', sessions: [['08:30', '15:00']],
    indices: [['^MXX', 'IPC']] },
  { code: 'BR', id: '076', name: 'ブラジル', region: '中南米', tz: 'America/Sao_Paulo', sessions: [['10:00', '17:00']],
    indices: [['^BVSP', 'ボベスパ']] },
  { code: 'CO', id: '170', name: 'コロンビア', region: '中南米', tz: 'America/Bogota', sessions: [['09:30', '16:00']],
    indices: [['^SPCOSLCP', 'S&P コロンビア・セレクト']] },

  // ── ヨーロッパ ──
  { code: 'GB', id: '826', name: 'イギリス', region: 'ヨーロッパ', tz: 'Europe/London', sessions: [['08:00', '16:30']],
    indices: [['^FTSE', 'FTSE 100'], ['^FTMC', 'FTSE 250']] },
  { code: 'IE', id: '372', name: 'アイルランド', region: 'ヨーロッパ', tz: 'Europe/Dublin', sessions: [['08:00', '16:30']],
    indices: [['^ISEQ', 'ISEQ全株']] },
  { code: 'DE', id: '276', name: 'ドイツ', region: 'ヨーロッパ', tz: 'Europe/Berlin', sessions: [['09:00', '17:30']],
    indices: [['^GDAXI', 'DAX'], ['^MDAXI', 'MDAX']] },
  { code: 'FR', id: '250', name: 'フランス', region: 'ヨーロッパ', tz: 'Europe/Paris', sessions: [['09:00', '17:30']],
    indices: [['^FCHI', 'CAC 40']] },
  { code: 'IT', id: '380', name: 'イタリア', region: 'ヨーロッパ', tz: 'Europe/Rome', sessions: [['09:00', '17:30']],
    indices: [['FTSEMIB.MI', 'FTSE MIB']] },
  { code: 'ES', id: '724', name: 'スペイン', region: 'ヨーロッパ', tz: 'Europe/Madrid', sessions: [['09:00', '17:30']],
    indices: [['^IBEX', 'IBEX 35']] },
  { code: 'PT', id: '620', name: 'ポルトガル', region: 'ヨーロッパ', tz: 'Europe/Lisbon', sessions: [['08:00', '16:30']],
    indices: [['PSI20.LS', 'PSI']] },
  { code: 'NL', id: '528', name: 'オランダ', region: 'ヨーロッパ', tz: 'Europe/Amsterdam', sessions: [['09:00', '17:30']],
    indices: [['^AEX', 'AEX']] },
  { code: 'BE', id: '056', name: 'ベルギー', region: 'ヨーロッパ', tz: 'Europe/Brussels', sessions: [['09:00', '17:30']],
    indices: [['^BFX', 'BEL 20']] },
  { code: 'CH', id: '756', name: 'スイス', region: 'ヨーロッパ', tz: 'Europe/Zurich', sessions: [['09:00', '17:30']],
    indices: [['^SSMI', 'SMI']] },
  { code: 'AT', id: '040', name: 'オーストリア', region: 'ヨーロッパ', tz: 'Europe/Vienna', sessions: [['09:00', '17:30']],
    indices: [['^ATX', 'ATX']] },
  { code: 'SE', id: '752', name: 'スウェーデン', region: 'ヨーロッパ', tz: 'Europe/Stockholm', sessions: [['09:00', '17:30']],
    indices: [['^OMX', 'OMXストックホルム30']] },
  { code: 'NO', id: '578', name: 'ノルウェー', region: 'ヨーロッパ', tz: 'Europe/Oslo', sessions: [['09:00', '16:20']],
    indices: [['OSEBX.OL', 'オスロ証取ベンチマーク']] },
  { code: 'DK', id: '208', name: 'デンマーク', region: 'ヨーロッパ', tz: 'Europe/Copenhagen', sessions: [['09:00', '17:00']],
    indices: [['^OMXC25', 'OMXコペンハーゲン25']] },
  { code: 'FI', id: '246', name: 'フィンランド', region: 'ヨーロッパ', tz: 'Europe/Helsinki', sessions: [['10:00', '18:30']],
    indices: [['^OMXH25', 'OMXヘルシンキ25']] },
  { code: 'PL', id: '616', name: 'ポーランド', region: 'ヨーロッパ', tz: 'Europe/Warsaw', sessions: [['09:00', '17:00']],
    indices: [['WIG20.WA', 'WIG20']] },
  { code: 'TR', id: '792', name: 'トルコ', region: 'ヨーロッパ', tz: 'Europe/Istanbul', sessions: [['10:00', '18:00']],
    indices: [['XU100.IS', 'BIST 100']] },

  // ── 中東・アフリカ ──
  { code: 'IL', id: '376', name: 'イスラエル', region: '中東・アフリカ', tz: 'Asia/Jerusalem', sessions: [['10:00', '17:25']],
    indices: [['^TA125.TA', 'TA-125']] },
  { code: 'SA', id: '682', name: 'サウジアラビア', region: '中東・アフリカ', tz: 'Asia/Riyadh', sessions: [['10:00', '15:00']], days: [0, 1, 2, 3, 4],
    indices: [['^TASI.SR', 'タダウル全株']] },
  { code: 'EG', id: '818', name: 'エジプト', region: '中東・アフリカ', tz: 'Africa/Cairo', sessions: [['10:00', '14:30']], days: [0, 1, 2, 3, 4],
    indices: [['^CASE30', 'EGX 30']] },
  { code: 'ZA', id: '710', name: '南アフリカ', region: '中東・アフリカ', tz: 'Africa/Johannesburg', sessions: [['09:00', '17:00']],
    indices: [['^J203.JO', 'JSE全株']] },

  // ── アジア・オセアニア ──
  { code: 'JP', id: '392', name: '日本', region: 'アジア・オセアニア', tz: 'Asia/Tokyo', sessions: [['09:00', '11:30'], ['12:30', '15:30']],
    indices: [['^N225', '日経平均株価'], ['1306.T', 'TOPIX（連動ETF 1306）']] },
  { code: 'CN', id: '156', name: '中国', region: 'アジア・オセアニア', tz: 'Asia/Shanghai', sessions: [['09:30', '11:30'], ['13:00', '15:00']],
    indices: [['000001.SS', '上海総合'], ['399001.SZ', '深セン成分'], ['000300.SS', 'CSI 300']] },
  { code: 'HK', point: [22.32, 114.17], name: '香港', region: 'アジア・オセアニア', tz: 'Asia/Hong_Kong', sessions: [['09:30', '12:00'], ['13:00', '16:00']],
    indices: [['^HSI', 'ハンセン指数']] },
  { code: 'TW', id: '158', name: '台湾', region: 'アジア・オセアニア', tz: 'Asia/Taipei', sessions: [['09:00', '13:30']],
    indices: [['^TWII', '台湾加権指数']] },
  { code: 'KR', id: '410', name: '韓国', region: 'アジア・オセアニア', tz: 'Asia/Seoul', sessions: [['09:00', '15:30']],
    indices: [['^KS11', 'KOSPI'], ['^KQ11', 'KOSDAQ']] },
  { code: 'IN', id: '356', name: 'インド', region: 'アジア・オセアニア', tz: 'Asia/Kolkata', sessions: [['09:15', '15:30']],
    indices: [['^BSESN', 'SENSEX'], ['^NSEI', 'NIFTY 50']] },
  { code: 'SG', point: [1.35, 103.82], name: 'シンガポール', region: 'アジア・オセアニア', tz: 'Asia/Singapore', sessions: [['09:00', '12:00'], ['13:00', '17:00']],
    indices: [['^STI', 'STI']] },
  { code: 'MY', id: '458', name: 'マレーシア', region: 'アジア・オセアニア', tz: 'Asia/Kuala_Lumpur', sessions: [['09:00', '12:30'], ['14:30', '17:00']],
    indices: [['^KLSE', 'KLCI']] },
  { code: 'ID', id: '360', name: 'インドネシア', region: 'アジア・オセアニア', tz: 'Asia/Jakarta', sessions: [['09:00', '12:00'], ['13:30', '16:00']],
    indices: [['^JKSE', 'ジャカルタ総合']] },
  { code: 'TH', id: '764', name: 'タイ', region: 'アジア・オセアニア', tz: 'Asia/Bangkok', sessions: [['10:00', '12:30'], ['14:30', '16:30']],
    indices: [['^SET.BK', 'SET指数']] },
  { code: 'PH', id: '608', name: 'フィリピン', region: 'アジア・オセアニア', tz: 'Asia/Manila', sessions: [['09:30', '12:00'], ['13:00', '15:00']],
    indices: [['PSEI.PS', 'PSEi']] },
  { code: 'VN', id: '704', name: 'ベトナム', region: 'アジア・オセアニア', tz: 'Asia/Ho_Chi_Minh', sessions: [['09:00', '11:30'], ['13:00', '14:45']],
    indices: [['^VNINDEX.VN', 'VN指数']] },
  { code: 'AU', id: '036', name: 'オーストラリア', region: 'アジア・オセアニア', tz: 'Australia/Sydney', sessions: [['10:00', '16:00']],
    indices: [['^AXJO', 'S&P/ASX 200'], ['^AORD', 'オールオーディナリーズ']] },
  { code: 'NZ', id: '554', name: 'ニュージーランド', region: 'アジア・オセアニア', tz: 'Pacific/Auckland', sessions: [['10:00', '16:45']],
    indices: [['^NZ50', 'NZX 50']] },
];

export const REGIONS = ['北米', '中南米', 'ヨーロッパ', '中東・アフリカ', 'アジア・オセアニア'];

export const byCode = Object.fromEntries(MARKETS.map(m => [m.code, m]));
export const byId = Object.fromEntries(MARKETS.filter(m => m.id).map(m => [m.id, m]));
export const allSymbols = () => MARKETS.flatMap(m => m.indices.map(i => i[0]));

const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

// 指定タイムゾーンの曜日・分・時刻文字列
export function localParts(tz, date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(x => [x.type, x.value]));
  const h = Number(p.hour) % 24, mi = Number(p.minute);
  return { wd: WD[p.weekday], min: h * 60 + mi, y: +p.year, mo: +p.month, d: +p.day, h, mi, s: +p.second };
}

// UTC からのずれ（分）
export function tzOffset(tz, date = new Date()) {
  const p = localParts(tz, date);
  const asUTC = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

// 取引スケジュール上の状態: open / break / pre / after / weekend
export function scheduleState(m, date = new Date()) {
  const { wd, min } = localParts(m.tz, date);
  const days = m.days || [1, 2, 3, 4, 5];
  if (!days.includes(wd)) return { state: 'weekend' };
  const ss = m.sessions.map(([a, b]) => [toMin(a), toMin(b)]);
  for (const [a, b] of ss) if (min >= a && min < b) return { state: 'open', sinceOpen: min - ss[0][0] };
  if (min < ss[0][0]) return { state: 'pre' };
  if (min >= ss[ss.length - 1][1]) return { state: 'after' };
  return { state: 'break' };
}

// 株価の最終時刻も見て、祝日などの休場を推定する
export function marketStatus(m, quoteTime, date = new Date()) {
  const s = scheduleState(m, date);
  if (s.state === 'open' && quoteTime && s.sinceOpen > 40 && date.getTime() / 1000 - quoteTime > 3600) {
    return { state: 'holiday', label: '休場（祝日など）' };
  }
  const labels = { open: '開場中', break: '昼休み', pre: '開場前', after: '取引終了', weekend: '休場（週末）' };
  return { state: s.state, label: labels[s.state] };
}
