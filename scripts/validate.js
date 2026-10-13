// 用法：node validate.js <pagcor|trends> <index.html 路徑>
// 通過：印出 OK 與統計，exit 0；失敗：印出 FAIL 與原因，exit 1
const fs = require('fs'), vm = require('vm');
const [mode, file] = process.argv.slice(2);
const html = fs.readFileSync(file, 'utf8');
const errs = [];
for (const t of ['</script>', '</body>', '</html>']) if (!html.includes(t)) errs.push('缺少 ' + t);
const s = html.indexOf('<script>'), e = html.lastIndexOf('</script>');
if (s < 0 || e < 0) { console.log('FAIL', errs.concat('找不到 <script> 區塊')); process.exit(1); }
const js = html.slice(s + 8, e);
try { new vm.Script(js); } catch (x) { errs.push('JS 語法錯誤：' + x.message); }
const stop = mode === 'pagcor' ? 'const TODAY' : 'const PLATFORM_META';
const cut = js.indexOf(stop);
let D, A;
if (cut < 0) errs.push('找不到 ' + stop);
else {
  try {
    const r = vm.runInNewContext(js.slice(0, cut) + '\n;({D: DATA, A: (typeof ACTIVE_LAWS!=="undefined"?ACTIVE_LAWS:null)})', {});
    D = r.D; A = r.A;
  } catch (x) { errs.push('DATA 無法執行：' + x.message); }
}
const stats = {};
if (D) {
  const ids = new Set();
  let total = 0;
  if (mode === 'pagcor') {
    const today = (js.match(/const TODAY = "([^"]+)"/) || [])[1];
    const cm = (js.match(/const CURRENT_MONTH = "([^"]+)"/) || [])[1];
    if (!today) errs.push('缺少 const TODAY');
    if (!cm) errs.push('缺少 const CURRENT_MONTH');
    else if (!D[cm]) errs.push('DATA 沒有 CURRENT_MONTH 對應的月份 ' + cm);
    for (const [m, arr] of Object.entries(D)) {
      if (!Array.isArray(arr)) { errs.push(m + ' 不是陣列'); continue; }
      for (const c of arr) {
        total++;
        // 舊卡片（2026-04~06）沒有 month 欄位，容許缺少；有寫就必須和所在月份一致
        for (const k of ['id', 'date_added', 'category', 'title_zh', 'summary'])
          if (!c[k]) errs.push(`${c.id || '(無id)'} 缺少 ${k}`);
        if (c.month && c.month !== m) errs.push(`${c.id} month=${c.month} 卻放在 ${m}`);
        if (!Array.isArray(c.sources) || !c.sources.length || c.sources.some(x => !/^https?:\/\//.test(x.url || '')))
          errs.push(`${c.id} sources 缺少有效 URL`);
        if (ids.has(c.id)) errs.push('重複 id ' + c.id); ids.add(c.id);
      }
      stats[m] = arr.length;
    }
    if (!Array.isArray(A)) errs.push('ACTIVE_LAWS 不是陣列');
    stats.TODAY = today; stats.CURRENT_MONTH = cm;
  } else {
    const weeks = Object.keys(D);
    if (weeks.length > 8) errs.push('超過 8 週：' + weeks.length);
    for (const [w, v] of Object.entries(D)) {
      if (!/^\d{4}-W\d{2}$/.test(w)) errs.push('週次格式錯誤 ' + w);
      if (!v || !Array.isArray(v.cards)) { errs.push(w + ' 缺少 cards 陣列'); continue; }
      if (!/^\d{4}-\d{2}-\d{2} ~ \d{4}-\d{2}-\d{2}$/.test(v.period || '')) errs.push(w + ' period 格式錯誤');
      if (!v.updated_at) errs.push(w + ' 缺少 updated_at');
      for (const c of v.cards) {
        total++;
        for (const k of ['id', 'title', 'summary', 'category', 'detail']) if (!c[k]) errs.push(`${c.id || '(無id)'} 缺少 ${k}`);
        if (!['social', 'entertainment', 'gaming'].includes(c.category)) errs.push(`${c.id} category 錯誤`);
        if (ids.has(c.id)) errs.push('重複 id ' + c.id); ids.add(c.id);
      }
      stats[w] = v.period + '｜' + v.cards.length + ' 張';
    }
  }
  stats.total = total;
}
if (errs.length) { console.log('FAIL'); errs.slice(0, 30).forEach(x => console.log(' - ' + x)); process.exit(1); }
console.log('OK', JSON.stringify(stats));
