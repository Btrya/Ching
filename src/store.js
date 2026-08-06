// 本地存储层（收藏 / 笔记 / 背诵统计 / 占卦记录）
// 无痕模式或 localStorage 不可用时，自动降级为内存对象，不抛错。

const NS = 'ching:';
const mem = {};

function read(key, def) {
  try {
    const s = localStorage.getItem(NS + key);
    return s ? JSON.parse(s) : def;
  } catch (e) {
    return key in mem ? mem[key] : def;
  }
}
function write(key, val) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(val));
  } catch (e) {
    mem[key] = val;
  }
}

/* ---------- 收藏（卦 id 集合） ---------- */
export function getFavorites() { return read('fav', []); }
export function isFavorite(id) { return getFavorites().includes(id); }
export function toggleFavorite(id) {
  const f = getFavorites();
  const i = f.indexOf(id);
  if (i >= 0) f.splice(i, 1);
  else f.push(id);
  write('fav', f);
  return i < 0; // 返回操作后是否为「已收藏」
}

/* ---------- 笔记（按卦 id 单独存） ---------- */
export function getNote(id) { return read('note:' + id, ''); }
export function setNote(id, txt) { write('note:' + id, txt); }

/* ---------- 背诵统计 { id: { right, wrong } } ---------- */
export function getQuizStats() { return read('quiz', {}); }
export function recordQuiz(id, ok) {
  const s = getQuizStats();
  const e = s[id] || { right: 0, wrong: 0 };
  if (ok) e.right++; else e.wrong++;
  s[id] = e;
  write('quiz', s);
  return s;
}
export function quizMastered() {
  const s = getQuizStats();
  let n = 0;
  for (const k in s) if (s[k].right >= 3 && s[k].right > s[k].wrong) n++;
  return n;
}
export function weakList() {
  const s = getQuizStats();
  return Object.keys(s).filter(k => s[k].wrong > 0).map(k => +k);
}

/* ---------- 占卦记录（最新在前，最多 20 条） ---------- */
export function getCasts() { return read('casts', []); }
export function addCast(rec) {
  const a = getCasts();
  a.unshift(rec);
  write('casts', a.slice(0, 20));
}
export function clearCasts() { write('casts', []); }
