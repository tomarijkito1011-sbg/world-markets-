// 市場の定義（サーバーとブラウザの両方で使う）
// id: world-atlas の国コード（ISO 3166-1 数値）。地図に形がない小さな市場は point（緯度経度）で表示する。
export const MARKETS = [
  // ── 北米・南米 ──
  { code: 'US', id: '840', name: 'アメリカ', region: '北米', tz: 'America/New_York', sessions: [['09:30', '16:00']],
    indices: [['^GSPC', 'S&P 500', '主要指数'], ['^DJI', 'NYダウ', '主要指数'], ['^IXIC', 'ナスダック総合', '主要指数'], ['^NDX', 'ナスダック100', '主要指数'], ['^RUT', 'ラッセル2000', '主要指数'], ['^OEX', 'S&P 100', '規模・スタイル'], ['^SP400', 'S&P 中型株400', '規模・スタイル'], ['^SP600', 'S&P 小型株600', '規模・スタイル'], ['^NYA', 'NYSE総合', '規模・スタイル'], ['^W5000', 'ウィルシャー5000', '規模・スタイル'], ['^DWCF', 'ダウ・ジョーンズ米国総合', '規模・スタイル'], ['^XAX', 'NYSEアメリカン総合', '規模・スタイル'], ['^SOX', 'フィラデルフィア半導体（SOX）', '業種・テーマ'], ['^IXCO', 'ナスダック・コンピューター', '業種・テーマ'], ['^DJT', 'ダウ輸送株20種', '業種・テーマ'], ['^DJU', 'ダウ公共株15種', '業種・テーマ'], ['^VIX', 'VIX（恐怖指数）', 'その他']] },
  { code: 'CA', id: '124', name: 'カナダ', region: '北米', tz: 'America/Toronto', sessions: [['09:30', '16:00']],
    indices: [['^GSPTSE', 'S&P/TSX総合', '主要指数'], ['TX60.TS', 'S&P/TSX 60', '主要指数'], ['^SPCDNX', 'S&P/TSXベンチャー総合', '規模・スタイル']] },
  { code: 'MX', id: '484', name: 'メキシコ', region: '中南米', tz: 'America/Mexico_City', sessions: [['08:30', '15:00']],
    indices: [['^MXX', 'IPC']] },
  { code: 'BR', id: '076', name: 'ブラジル', region: '中南米', tz: 'America/Sao_Paulo', sessions: [['10:00', '17:00']],
    indices: [['^BVSP', 'ボベスパ', '主要指数'], ['^IBX50', 'IBrX 50', '主要指数'], ['SMLL.SA', '小型株指数', '規模・スタイル'], ['IDIV.SA', '配当指数', '業種・テーマ'], ['IFIX.SA', '不動産ファンド指数', '業種・テーマ']] },
  { code: 'CO', id: '170', name: 'コロンビア', region: '中南米', tz: 'America/Bogota', sessions: [['09:30', '16:00']],
    indices: [['^SPCOSLCP', 'S&P コロンビア・セレクト']] },

  // ── ヨーロッパ ──
  { code: 'GB', id: '826', name: 'イギリス', region: 'ヨーロッパ', tz: 'Europe/London', sessions: [['08:00', '16:30']],
    indices: [['^FTSE', 'FTSE 100', '主要指数'], ['^FTMC', 'FTSE 250', '主要指数'], ['^FTAS', 'FTSE全株', '規模・スタイル'], ['^FTAI', 'FTSE AIM全株', '規模・スタイル'], ['^BUK100P', 'Cboe UK 100', '規模・スタイル']] },
  { code: 'IE', id: '372', name: 'アイルランド', region: 'ヨーロッパ', tz: 'Europe/Dublin', sessions: [['08:00', '16:30']],
    indices: [['^ISEQ', 'ISEQ全株']] },
  { code: 'DE', id: '276', name: 'ドイツ', region: 'ヨーロッパ', tz: 'Europe/Berlin', sessions: [['09:00', '17:30']],
    indices: [['^GDAXI', 'DAX', '主要指数'], ['^MDAXI', 'MDAX', '規模・スタイル'], ['^SDAXI', 'SDAX', '規模・スタイル'], ['^TECDAX', 'TecDAX', '業種・テーマ'], ['^STOXX50E', 'ユーロ・ストックス50', '欧州全体']] },
  { code: 'FR', id: '250', name: 'フランス', region: 'ヨーロッパ', tz: 'Europe/Paris', sessions: [['09:00', '17:30']],
    indices: [['^FCHI', 'CAC 40', '主要指数'], ['^SBF120', 'SBF 120', '規模・スタイル'], ['^CN20', 'CAC Next 20', '規模・スタイル'], ['^N100', 'ユーロネクスト100', '欧州全体'], ['^STOXX50E', 'ユーロ・ストックス50', '欧州全体']] },
  { code: 'IT', id: '380', name: 'イタリア', region: 'ヨーロッパ', tz: 'Europe/Rome', sessions: [['09:00', '17:30']],
    indices: [['FTSEMIB.MI', 'FTSE MIB']] },
  { code: 'ES', id: '724', name: 'スペイン', region: 'ヨーロッパ', tz: 'Europe/Madrid', sessions: [['09:00', '17:30']],
    indices: [['^IBEX', 'IBEX 35']] },
  { code: 'PT', id: '620', name: 'ポルトガル', region: 'ヨーロッパ', tz: 'Europe/Lisbon', sessions: [['08:00', '16:30']],
    indices: [['PSI20.LS', 'PSI']] },
  { code: 'NL', id: '528', name: 'オランダ', region: 'ヨーロッパ', tz: 'Europe/Amsterdam', sessions: [['09:00', '17:30']],
    indices: [['^AEX', 'AEX', '主要指数'], ['^AMX', 'AMX（中型株）', '規模・スタイル'], ['^N100', 'ユーロネクスト100', '欧州全体']] },
  { code: 'BE', id: '056', name: 'ベルギー', region: 'ヨーロッパ', tz: 'Europe/Brussels', sessions: [['09:00', '17:30']],
    indices: [['^BFX', 'BEL 20']] },
  { code: 'CH', id: '756', name: 'スイス', region: 'ヨーロッパ', tz: 'Europe/Zurich', sessions: [['09:00', '17:30']],
    indices: [['^SSMI', 'SMI', '主要指数'], ['^SSHI', 'SPI（スイス全株）', '規模・スタイル']] },
  { code: 'AT', id: '040', name: 'オーストリア', region: 'ヨーロッパ', tz: 'Europe/Vienna', sessions: [['09:00', '17:30']],
    indices: [['^ATX', 'ATX', '主要指数'], ['^ATX5', 'ATX five', '規模・スタイル'], ['^ATXPRIME', 'ATXプライム', '規模・スタイル']] },
  { code: 'SE', id: '752', name: 'スウェーデン', region: 'ヨーロッパ', tz: 'Europe/Stockholm', sessions: [['09:00', '17:30']],
    indices: [['^OMX', 'OMXストックホルム30', '主要指数'], ['^OMXSPI', 'ストックホルム全株', '規模・スタイル']] },
  { code: 'NO', id: '578', name: 'ノルウェー', region: 'ヨーロッパ', tz: 'Europe/Oslo', sessions: [['09:00', '16:20']],
    indices: [['OSEBX.OL', 'オスロ証取ベンチマーク', '主要指数'], ['OBX.OL', 'OBX', '主要指数']] },
  { code: 'DK', id: '208', name: 'デンマーク', region: 'ヨーロッパ', tz: 'Europe/Copenhagen', sessions: [['09:00', '17:00']],
    indices: [['^OMXC25', 'OMXコペンハーゲン25', '主要指数'], ['^OMXCPI', 'コペンハーゲン全株', '規模・スタイル']] },
  { code: 'FI', id: '246', name: 'フィンランド', region: 'ヨーロッパ', tz: 'Europe/Helsinki', sessions: [['10:00', '18:30']],
    indices: [['^OMXH25', 'OMXヘルシンキ25', '主要指数'], ['^OMXHPI', 'ヘルシンキ全株', '規模・スタイル']] },
  { code: 'PL', id: '616', name: 'ポーランド', region: 'ヨーロッパ', tz: 'Europe/Warsaw', sessions: [['09:00', '17:00']],
    indices: [['WIG20.WA', 'WIG20', '主要指数'], ['WIG.WA', 'WIG（全株）', '規模・スタイル'], ['MWIG40.WA', 'mWIG40（中型株）', '規模・スタイル'], ['SWIG80.WA', 'sWIG80（小型株）', '規模・スタイル']] },
  { code: 'TR', id: '792', name: 'トルコ', region: 'ヨーロッパ', tz: 'Europe/Istanbul', sessions: [['10:00', '18:00']],
    indices: [['XU100.IS', 'BIST 100', '主要指数'], ['XU030.IS', 'BIST 30', '主要指数'], ['XBANK.IS', 'BIST 銀行', '業種・テーマ']] },

  // ── 中東・アフリカ ──
  { code: 'IL', id: '376', name: 'イスラエル', region: '中東・アフリカ', tz: 'Asia/Jerusalem', sessions: [['10:00', '17:25']],
    indices: [['^TA125.TA', 'TA-125', '主要指数'], ['TA35.TA', 'TA-35', '主要指数']] },
  { code: 'SA', id: '682', name: 'サウジアラビア', region: '中東・アフリカ', tz: 'Asia/Riyadh', sessions: [['10:00', '15:00']], days: [0, 1, 2, 3, 4],
    indices: [['^TASI.SR', 'タダウル全株']] },
  { code: 'EG', id: '818', name: 'エジプト', region: '中東・アフリカ', tz: 'Africa/Cairo', sessions: [['10:00', '14:30']], days: [0, 1, 2, 3, 4],
    indices: [['^CASE30', 'EGX 30']] },
  { code: 'ZA', id: '710', name: '南アフリカ', region: '中東・アフリカ', tz: 'Africa/Johannesburg', sessions: [['09:00', '17:00']],
    indices: [['^J203.JO', 'JSE全株', '主要指数'], ['^J200.JO', 'JSEトップ40', '主要指数'], ['^J580.JO', 'JSE金融', '業種・テーマ'], ['^JN0U.JO', 'トップ40（米ドル建て）', 'その他']] },

  // ── アジア・オセアニア ──
  { code: 'JP', id: '392', name: '日本', region: 'アジア・オセアニア', tz: 'Asia/Tokyo', sessions: [['09:00', '11:30'], ['12:30', '15:30']],
    indices: [['^N225', '日経平均株価', '主要指数'], ['998405.T', 'TOPIX（東証株価指数）', '主要指数'], ['1551.T', '東証スタンダード市場TOP20（連動ETF 1551）', '主要指数'], ['2516.T', '東証グロース市場250指数（連動ETF 2516）', '主要指数'], ['^N500', '日経500', '規模・スタイル'], ['1591.T', 'JPX日経400（連動ETF）', '規模・スタイル'], ['1563.T', '東証グロース・コア（連動ETF）', '規模・スタイル'], ['1489.T', '日経高配当株50（連動ETF）', '規模・スタイル'], ['1343.T', '東証REIT指数（連動ETF）', '規模・スタイル'], ['1617.T', 'TOPIX-17 食品（ETF）', '業種・テーマ'], ['1618.T', 'TOPIX-17 エネルギー資源（ETF）', '業種・テーマ'], ['1619.T', 'TOPIX-17 建設・資材（ETF）', '業種・テーマ'], ['1620.T', 'TOPIX-17 素材・化学（ETF）', '業種・テーマ'], ['1621.T', 'TOPIX-17 医薬品（ETF）', '業種・テーマ'], ['1622.T', 'TOPIX-17 自動車・輸送機（ETF）', '業種・テーマ'], ['1623.T', 'TOPIX-17 鉄鋼・非鉄（ETF）', '業種・テーマ'], ['1624.T', 'TOPIX-17 機械（ETF）', '業種・テーマ'], ['1625.T', 'TOPIX-17 電機・精密（ETF）', '業種・テーマ'], ['1626.T', 'TOPIX-17 情報通信・サービスその他（ETF）', '業種・テーマ'], ['1627.T', 'TOPIX-17 電力・ガス（ETF）', '業種・テーマ'], ['1628.T', 'TOPIX-17 運輸・物流（ETF）', '業種・テーマ'], ['1629.T', 'TOPIX-17 商社・卸売（ETF）', '業種・テーマ'], ['1630.T', 'TOPIX-17 小売（ETF）', '業種・テーマ'], ['1631.T', 'TOPIX-17 銀行（ETF）', '業種・テーマ'], ['1632.T', 'TOPIX-17 金融（除く銀行）（ETF）', '業種・テーマ'], ['1633.T', 'TOPIX-17 不動産（ETF）', '業種・テーマ']] },
  { code: 'CN', id: '156', name: '中国', region: 'アジア・オセアニア', tz: 'Asia/Shanghai', sessions: [['09:30', '11:30'], ['13:00', '15:00']],
    indices: [['000001.SS', '上海総合', '主要指数'], ['399001.SZ', '深セン成分', '主要指数'], ['000300.SS', 'CSI 300', '主要指数'], ['000016.SS', '上海50', '規模・スタイル'], ['000905.SS', 'CSI 500（中型株）', '規模・スタイル'], ['000852.SS', 'CSI 1000（小型株）', '規模・スタイル'], ['399006.SZ', '創業板指数（ChiNext）', '業種・テーマ'], ['000688.SS', '科創50（STAR50）', '業種・テーマ']] },
  { code: 'HK', point: [22.32, 114.17], name: '香港', region: 'アジア・オセアニア', tz: 'Asia/Hong_Kong', sessions: [['09:30', '12:00'], ['13:00', '16:00']],
    indices: [['^HSI', 'ハンセン指数', '主要指数'], ['^HSCE', 'ハンセン中国企業株（H株）', '主要指数'], ['HSTECH.HK', 'ハンセンテック', '業種・テーマ'], ['^HSCC', 'レッドチップ指数', '業種・テーマ']] },
  { code: 'TW', id: '158', name: '台湾', region: 'アジア・オセアニア', tz: 'Asia/Taipei', sessions: [['09:00', '13:30']],
    indices: [['^TWII', '台湾加権指数']] },
  { code: 'KR', id: '410', name: '韓国', region: 'アジア・オセアニア', tz: 'Asia/Seoul', sessions: [['09:00', '15:30']],
    indices: [['^KS11', 'KOSPI', '主要指数'], ['^KQ11', 'KOSDAQ', '主要指数'], ['^KS200', 'KOSPI 200', '主要指数']] },
  { code: 'IN', id: '356', name: 'インド', region: 'アジア・オセアニア', tz: 'Asia/Kolkata', sessions: [['09:15', '15:30']],
    indices: [['^BSESN', 'SENSEX', '主要指数'], ['^NSEI', 'NIFTY 50', '主要指数'], ['^CRSLDX', 'NIFTY 500', '規模・スタイル'], ['^NSEMDCP50', 'NIFTY 中型株50', '規模・スタイル'], ['^CNXSC', 'NIFTY 小型株100', '規模・スタイル'], ['^NSEBANK', 'NIFTY 銀行', '業種・テーマ'], ['^CNXIT', 'NIFTY IT', '業種・テーマ'], ['^CNXAUTO', 'NIFTY 自動車', '業種・テーマ'], ['^CNXPHARMA', 'NIFTY 医薬品', '業種・テーマ'], ['^CNXFMCG', 'NIFTY 日用品', '業種・テーマ'], ['^CNXMETAL', 'NIFTY 金属', '業種・テーマ']] },
  { code: 'SG', point: [1.35, 103.82], name: 'シンガポール', region: 'アジア・オセアニア', tz: 'Asia/Singapore', sessions: [['09:00', '12:00'], ['13:00', '17:00']],
    indices: [['^STI', 'STI']] },
  { code: 'MY', id: '458', name: 'マレーシア', region: 'アジア・オセアニア', tz: 'Asia/Kuala_Lumpur', sessions: [['09:00', '12:30'], ['14:30', '17:00']],
    indices: [['^KLSE', 'KLCI']] },
  { code: 'ID', id: '360', name: 'インドネシア', region: 'アジア・オセアニア', tz: 'Asia/Jakarta', sessions: [['09:00', '12:00'], ['13:30', '16:00']],
    indices: [['^JKSE', 'ジャカルタ総合', '主要指数'], ['^JKLQ45', 'LQ45', '主要指数']] },
  { code: 'TH', id: '764', name: 'タイ', region: 'アジア・オセアニア', tz: 'Asia/Bangkok', sessions: [['10:00', '12:30'], ['14:30', '16:30']],
    indices: [['^SET.BK', 'SET指数', '主要指数'], ['^SET50.BK', 'SET50', '主要指数']] },
  { code: 'PH', id: '608', name: 'フィリピン', region: 'アジア・オセアニア', tz: 'Asia/Manila', sessions: [['09:30', '12:00'], ['13:00', '15:00']],
    indices: [['PSEI.PS', 'PSEi']] },
  { code: 'VN', id: '704', name: 'ベトナム', region: 'アジア・オセアニア', tz: 'Asia/Ho_Chi_Minh', sessions: [['09:00', '11:30'], ['13:00', '14:45']],
    indices: [['^VNINDEX.VN', 'VN指数']] },
  { code: 'AU', id: '036', name: 'オーストラリア', region: 'アジア・オセアニア', tz: 'Australia/Sydney', sessions: [['10:00', '16:00']],
    indices: [['^AXJO', 'S&P/ASX 200', '主要指数'], ['^AORD', 'オールオーディナリーズ', '主要指数'], ['^ATLI', 'S&P/ASX 20', '規模・スタイル'], ['^AXKO', 'S&P/ASX 300', '規模・スタイル'], ['^AXSO', 'S&P/ASX 小型株', '規模・スタイル'], ['^AXFJ', 'ASX200 金融', '業種・テーマ'], ['^AXJR', 'ASX200 資源', '業種・テーマ'], ['^AXMJ', 'ASX200 素材', '業種・テーマ']] },
  { code: 'NZ', id: '554', name: 'ニュージーランド', region: 'アジア・オセアニア', tz: 'Pacific/Auckland', sessions: [['10:00', '16:45']],
    indices: [['^NZ50', 'NZX 50']] },
];

export const REGIONS = ['北米', '中南米', 'ヨーロッパ', '中東・アフリカ', 'アジア・オセアニア'];

export const byCode = Object.fromEntries(MARKETS.map(m => [m.code, m]));
export const byId = Object.fromEntries(MARKETS.filter(m => m.id).map(m => [m.id, m]));
// 指数の分類（[記号, 名前, 分類] の3つ目。省略時は主要指数）
export const groupOf = i => i[2] || '主要指数';
export const GROUPS = ['主要指数', '規模・スタイル', '業種・テーマ', '欧州全体', 'その他'];
export const allSymbols = () => [...new Set(MARKETS.flatMap(m => m.indices.map(i => i[0])))];

const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

// 指定タイムゾーンの曜日・分・時刻文字列
const fmtCache = {};
export function localParts(tz, date = new Date()) {
  const f = fmtCache[tz] ||= new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(date).map(x => [x.type, x.value]));
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

// ── 株価指数以外の投資対象（トップ画面の「先物」「オプション」などの項目） ──
// schedule: futures（CMEのほぼ24時間取引）/ fx（平日24時間）/ crypto（365日24時間）/ us（米国株の取引時間）
export const ASSETS = [
  { key: 'futures', short: '株価指数・国債の先物', about: '先物は「将来の決まった日に、今決めた価格で売買する」取引です。株式市場が閉まっている夜間も取引されるため、翌日の株価の手がかりとしてよく見られます。', headline: 'NIY=F', name: '先物', schedule: 'futures',
    desc: '株価指数・債券・通貨の先物です。主に米CMEで、平日はほぼ24時間取引されています。',
    items: [
      ['ES=F', 'S&P 500 先物（E-mini）', '株価指数先物'], ['NQ=F', 'ナスダック100 先物', '株価指数先物'], ['YM=F', 'NYダウ 先物', '株価指数先物'],
      ['RTY=F', 'ラッセル2000 先物', '株価指数先物'], ['NIY=F', '日経225 先物（CME・円建て）', '株価指数先物'], ['NKD=F', '日経225 先物（CME・ドル建て）', '株価指数先物'],
      ['ZT=F', '米国債2年 先物', '債券先物'], ['ZF=F', '米国債5年 先物', '債券先物'], ['ZN=F', '米国債10年 先物', '債券先物'], ['ZB=F', '米国債30年 先物', '債券先物'],
      ['6E=F', 'ユーロ 先物', '通貨先物'], ['6J=F', '日本円 先物', '通貨先物'],
    ] },
  { key: 'options', short: '相場の“不安度”を見る', about: 'オプションは「決まった価格で買う・売る権利」の取引です。その価格から計算されるVIXなどの指数は、投資家がどれだけ大きな値動きを警戒しているかを表します。VIXは20以下なら落ち着き、30以上なら不安が強い目安です。', headline: '^VIX', name: 'オプション', schedule: 'us',
    desc: 'オプションの価格から計算される「予想変動率（ボラティリティ）」の指数です。値が高いほど、市場が大きな値動きを警戒していることを示します。',
    items: [
      ['^VIX', 'VIX（S&P500・30日）', '株価のボラティリティ'], ['^VIX9D', 'VIX 9日', '株価のボラティリティ'], ['^VIX3M', 'VIX 3か月', '株価のボラティリティ'],
      ['^VXN', 'ナスダック100 ボラティリティ', '株価のボラティリティ'], ['^VXD', 'NYダウ ボラティリティ', '株価のボラティリティ'], ['^VXEEM', '新興国株 ボラティリティ', '株価のボラティリティ'],
      ['^VVIX', 'VVIX（VIXの変動率）', 'オプション市場の指標'], ['^SKEW', 'SKEW（急落への備え）', 'オプション市場の指標'],
      ['^OVX', '原油 ボラティリティ', '商品のボラティリティ'], ['^GVZ', '金 ボラティリティ', '商品のボラティリティ'], ['^VXSLV', '銀 ボラティリティ', '商品のボラティリティ'],
    ] },
  { key: 'commodities', short: '金・原油・穀物などの商品', about: 'コモディティーは金や原油、小麦などの「商品」です。景気やインフレ、世界情勢の影響を受けやすく、株とは違う動きをすることがあります。', headline: 'GC=F', name: 'コモディティー', schedule: 'futures',
    desc: '金・原油・穀物などの商品先物です（期近物、米ドル建て）。',
    items: [
      ['^SPGSCI', 'S&P GSCI（商品総合）', '総合'],
      ['GC=F', '金', '貴金属'], ['SI=F', '銀', '貴金属'], ['PL=F', 'プラチナ', '貴金属'], ['PA=F', 'パラジウム', '貴金属'],
      ['HG=F', '銅', '非鉄金属'], ['ALI=F', 'アルミニウム', '非鉄金属'],
      ['CL=F', 'WTI原油', 'エネルギー'], ['BZ=F', '北海ブレント原油', 'エネルギー'], ['NG=F', '天然ガス', 'エネルギー'], ['RB=F', 'ガソリン', 'エネルギー'], ['HO=F', 'ヒーティングオイル', 'エネルギー'],
      ['ZC=F', 'トウモロコシ', '穀物'], ['ZW=F', '小麦', '穀物'], ['ZS=F', '大豆', '穀物'],
      ['KC=F', 'コーヒー', 'ソフト'], ['SB=F', '砂糖', 'ソフト'], ['CC=F', 'ココア', 'ソフト'], ['CT=F', '綿花', 'ソフト'], ['OJ=F', 'オレンジジュース', 'ソフト'],
      ['LE=F', '生牛', '畜産'], ['HE=F', '豚赤身', '畜産'],
    ] },
  { key: 'fx', short: 'ドル円など通貨の交換レート', about: '為替は通貨どうしの交換レートです。「米ドル/円 158円」は1ドルを158円で交換できるという意味で、数字が上がるほど円安（ドル高）です。', headline: 'USDJPY=X', name: '為替', schedule: 'fx',
    desc: '主要通貨の為替レートです。平日は24時間取引されています。',
    items: [
      ['USDJPY=X', '米ドル/円', '対円'], ['EURJPY=X', 'ユーロ/円', '対円'], ['GBPJPY=X', '英ポンド/円', '対円'], ['AUDJPY=X', '豪ドル/円', '対円'],
      ['NZDJPY=X', 'NZドル/円', '対円'], ['CADJPY=X', 'カナダドル/円', '対円'], ['CHFJPY=X', 'スイスフラン/円', '対円'], ['CNYJPY=X', '人民元/円', '対円'],
      ['KRWJPY=X', '韓国ウォン/円', '対円'], ['INRJPY=X', 'インドルピー/円', '対円'], ['MXNJPY=X', 'メキシコペソ/円', '対円'], ['TRYJPY=X', 'トルコリラ/円', '対円'], ['ZARJPY=X', '南アランド/円', '対円'],
      ['EURUSD=X', 'ユーロ/米ドル', '主要通貨ペア'], ['GBPUSD=X', '英ポンド/米ドル', '主要通貨ペア'], ['AUDUSD=X', '豪ドル/米ドル', '主要通貨ペア'],
      ['USDCHF=X', '米ドル/スイスフラン', '主要通貨ペア'], ['USDCAD=X', '米ドル/カナダドル', '主要通貨ペア'], ['USDCNY=X', '米ドル/人民元', '主要通貨ペア'], ['USDINR=X', '米ドル/インドルピー', '主要通貨ペア'],
      ['DX-Y.NYB', 'ドル指数（DXY）', '指数'],
    ] },
  { key: 'crypto', short: 'ビットコインなどの暗号資産', about: '仮想通貨（暗号資産）はインターネット上で取引されるデジタルなお金です。土日も含めて24時間動き、値動きが大きいのが特徴です。', headline: 'BTC-USD', name: '仮想通貨', schedule: 'crypto',
    desc: '主な暗号資産の価格です。365日24時間取引されています。前日比は過去24時間ではなく、UTC 0時（日本時間 9時）からの変化です。',
    items: [
      ['BTC-USD', 'ビットコイン', '主要'], ['ETH-USD', 'イーサリアム', '主要'], ['XRP-USD', 'XRP', '主要'], ['BNB-USD', 'BNB', '主要'], ['SOL-USD', 'ソラナ', '主要'],
      ['DOGE-USD', 'ドージコイン', 'アルトコイン'], ['ADA-USD', 'カルダノ', 'アルトコイン'], ['TRX-USD', 'トロン', 'アルトコイン'], ['AVAX-USD', 'アバランチ', 'アルトコイン'],
      ['LINK-USD', 'チェーンリンク', 'アルトコイン'], ['DOT-USD', 'ポルカドット', 'アルトコイン'], ['LTC-USD', 'ライトコイン', 'アルトコイン'], ['BCH-USD', 'ビットコインキャッシュ', 'アルトコイン'], ['SHIB-USD', '柴犬コイン', 'アルトコイン'],
      ['USDT-USD', 'テザー（USDT）', 'ステーブルコイン'],
      ['BTC-JPY', 'ビットコイン（円建て）', '円建て'], ['ETH-JPY', 'イーサリアム（円建て）', '円建て'],
    ] },
];
export const assetByKey = Object.fromEntries(ASSETS.map(a => [a.key, a]));
export const assetSymbols = () => [...new Set(ASSETS.flatMap(a => a.items.map(i => i[0])))];

// 取引時間の説明
export const SCHEDULE_TEXT = {
  futures: '日曜18:00〜金曜17:00（ニューヨーク時間）。毎日17:00〜18:00は休止',
  fx: '月曜早朝〜土曜早朝（日本時間）の平日24時間',
  crypto: '365日24時間',
  us: '平日 9:30〜16:15（ニューヨーク時間）',
};

// 投資対象ごとの取引状態
export function assetStatus(schedule, date = new Date()) {
  if (schedule === 'crypto') return { state: 'open', label: '24時間取引' };
  if (schedule === 'us') {
    const s = scheduleState({ tz: 'America/New_York', sessions: [['09:30', '16:15']] }, date).state;
    return { state: s === 'open' ? 'open' : s === 'weekend' ? 'weekend' : 'after', label: s === 'open' ? '取引中' : s === 'weekend' ? '休場（週末）' : '取引時間外' };
  }
  const { wd, min } = localParts('America/New_York', date);
  const reopen = schedule === 'futures' ? 18 * 60 : 17 * 60;
  if (wd === 6 || (wd === 5 && min >= 17 * 60) || (wd === 0 && min < reopen)) return { state: 'weekend', label: '休場（週末）' };
  if (schedule === 'futures' && min >= 17 * 60 && min < 18 * 60) return { state: 'break', label: '取引休止中' };
  return { state: 'open', label: '取引中' };
}

// 各市場の取引所がある都市（地球儀の光の輪・ラベルの位置）
export const CITY = {
  US: [40.71, -74.01], CA: [43.65, -79.38], MX: [19.43, -99.13], BR: [-23.55, -46.63], CO: [4.71, -74.07],
  GB: [51.51, -0.13], IE: [53.35, -6.26], DE: [50.11, 8.68], FR: [48.86, 2.35], IT: [45.46, 9.19], ES: [40.42, -3.7], PT: [38.72, -9.14],
  NL: [52.37, 4.9], BE: [50.85, 4.35], CH: [47.37, 8.54], AT: [48.21, 16.37], SE: [59.33, 18.07], NO: [59.91, 10.75], DK: [55.68, 12.57],
  FI: [60.17, 24.94], PL: [52.23, 21.01], TR: [41.01, 28.98], IL: [32.09, 34.78], SA: [24.71, 46.68], EG: [30.04, 31.24], ZA: [-26.2, 28.05],
  JP: [35.68, 139.69], CN: [31.23, 121.47], HK: [22.32, 114.17], TW: [25.03, 121.57], KR: [37.57, 126.98], IN: [19.08, 72.88],
  SG: [1.35, 103.82], MY: [3.14, 101.69], ID: [-6.21, 106.85], TH: [13.76, 100.5], PH: [14.6, 120.98], VN: [10.82, 106.63],
  AU: [-33.87, 151.21], NZ: [-41.29, 174.78],
};
// 地球儀の上に騰落率を常に表示する主要市場
export const LABELED = ['US', 'CA', 'BR', 'GB', 'DE', 'FR', 'IN', 'CN', 'HK', 'JP', 'KR', 'AU', 'ZA', 'SA', 'TW', 'MX'];

// 次に取引が始まる市場（15分刻みで最大3日先まで探す）
export function nextOpening(date = new Date()) {
  let best = null;
  for (const m of MARKETS) {
    if (scheduleState(m, date).state === 'open') continue;
    for (let k = 1; k <= 288; k++) {
      const t = new Date(date.getTime() + k * 15 * 60000);
      if (scheduleState(m, t).state === 'open') { if (!best || k < best.k) best = { m, k, at: t }; break; }
      if (best && k >= best.k) break;
    }
  }
  if (best) { // 1分単位で開始時刻を詰める
    for (let mi = (best.k - 1) * 15 + 1; mi <= best.k * 15; mi++) {
      const t = new Date(Math.floor(date.getTime() / 60000) * 60000 + mi * 60000);
      if (scheduleState(best.m, t).state === 'open') { best.at = t; break; }
    }
  }
  return best;
}
