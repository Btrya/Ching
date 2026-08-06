/* 周易·习易 — 交互逻辑（ES Module） */
import './styles/main.css';
import { HEXAGRAMS, GUA_XU_GE, GE_PINYIN, QUXIANG_GE, BOOKS } from './data/hexagrams.js';
import { BOOKS_TEXT } from './data/books_text.js';
import { TUAN, DAXIANG, DAXIANG_BAIHUA, XIAO } from './data/wing.js';
import {
  getFavorites, isFavorite, toggleFavorite, getNote, setNote,
  recordQuiz, quizMastered, weakList, getCasts, addCast, clearCasts
} from './store.js';
import { PALACE_BY_ID, JING_BY_ID, PALACES } from './data/meta.js';

/* ---------- 工具 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const randInt = n => Math.floor(Math.random() * n);
function sample(arr, k) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1);[a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, k);
}
/* 由 6 爻（自下而上）生成卦象 HTML；渲染时自上而下 */
function hexHTML(array, small) {
  let html = '<div class="hex' + (small ? ' sm' : '') + '">';
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] === 1) html += '<div class="ln"></div>';
    else html += '<div class="ln yin"><i></i><i></i></div>';
  }
  return html + '</div>';
}

/* 检索表：卦象键(自下而上) -> 卦 */
const byKey = {};
HEXAGRAMS.forEach(h => { byKey[h.array.join('')] = h; });

/* ---------- 视图切换 ---------- */
function showView(name) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#view-' + name).classList.add('active');
  $$('nav.main a').forEach(a => a.classList.toggle('active', a.dataset.view === name));
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* 某些环境不支持 */ }
}

/* ---------- 首页卦序歌 / 取象歌（带拼音） ---------- */
let showPinyin = true;
function rubyWrap(text) {
  let html = '';
  for (const ch of text) {
    const p = GE_PINYIN[ch];
    if (p && showPinyin) html += `<ruby>${ch}<rt>${p}</rt></ruby>`;
    else html += ch;
  }
  return html;
}
function renderHome() {
  renderGeSong();
  renderQuxiangGe();
  const t = $('#ge-py-toggle');
  if (t) t.textContent = showPinyin ? '隐藏拼音' : '显示拼音';
}
function renderGeSong() {
  const box = $('#ge-content');
  if (!box) return;
  box.innerHTML = GUA_XU_GE.map(line =>
    `<div class="ge-line">${rubyWrap(line)}</div>`).join('');
}
function renderQuxiangGe() {
  const box = $('#quxiang-ge');
  if (!box) return;
  box.innerHTML = QUXIANG_GE.map(line =>
    `<div class="qx-line">${rubyWrap(line)}</div>`).join('');
}
function togglePinyin() {
  showPinyin = !showPinyin;
  renderGeSong();
  renderQuxiangGe();
  const t = $('#ge-py-toggle');
  if (t) t.textContent = showPinyin ? '隐藏拼音' : '显示拼音';
}

/* ---------- 六十四卦总览（支持搜索 / 上下经 / 八宫筛选） ---------- */
let ovState = { q: '', jing: 'all', palace: 'all' };
function favIds() { try { return getFavorites(); } catch (e) { return []; } }
function renderOverview() {
  const q = ovState.q.trim().toLowerCase();
  const grid = $('#overview-grid');
  const favs = favIds();
  const list = HEXAGRAMS.filter(h => {
    if (ovState.jing !== 'all' && JING_BY_ID[h.id] !== ovState.jing) return false;
    if (ovState.palace !== 'all' && PALACE_BY_ID[h.id] !== ovState.palace) return false;
    if (q) {
      const hay = (h.name + h.title + h.judgment + String(h.id) + (PALACE_BY_ID[h.id] || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  grid.innerHTML = list.map(h =>
    `<div class="card" data-id="${h.id}">
       <div class="seq">${String(h.id).padStart(2, '0')}${favs.includes(h.id) ? '<span class="star">★</span>' : ''}</div>
       ${hexHTML(h.array, true)}
       <div class="nm">${h.name}</div>
       <div class="tt">${h.title}</div>
     </div>`).join('');
  $$('#overview-grid .card').forEach(c =>
    c.addEventListener('click', () => openDetail(+c.dataset.id)));
}
function renderPalaceChips() {
  const box = $('#ov-palace');
  if (!box) return;
  const chips = ['all', ...PALACES];
  box.innerHTML = chips.map(p =>
    `<button class="chip ${p === 'all' ? 'on' : ''}" data-palace="${p}">${p === 'all' ? '全部' : p + '宫'}</button>`).join('');
}

/* ---------- 推荐书单 ---------- */
function renderBooks() {
  const wrap = $('#books-body');
  if (!wrap) return;
  const cats = ['基础义理', '占卜流派', '命理进阶'];
  const catTip = {
    '基础义理': '先懂《易经》在讲什么、怎么占怎么解',
    '占卜流派': '梅花易数、六爻纳甲，动手起卦断卦',
    '命理进阶': '八字子平，需先通干支，宜后学'
  };
  wrap.innerHTML = cats.map(cat => {
    const list = BOOKS.filter(b => b.cat === cat);
    if (!list.length) return '';
    return `<div class="book-cat">
      <h3 class="book-cat-title">${cat}<span class="book-cat-tip">${catTip[cat]}</span></h3>
      <div class="book-grid">${list.map(b => `
        <article class="book-card">
          <div class="book-top">
            <div class="book-title">${b.title}</div>
            <span class="book-level ${b.level === '入门' ? 'lv-ru' : 'lv-jin'}">${b.level}</span>
          </div>
          <div class="book-author">${b.author} · ${b.era}</div>
          <p class="book-blurb">${b.blurb}</p>
          <div class="book-fit">适合：${b.fit}</div>
          ${b.inSite
            ? `<button class="book-read in-site" data-textkey="${b.title}">阅读（站内）↺</button>`
            : (b.readUrl ? `<a class="book-read" href="${b.readUrl}" target="_blank" rel="noopener">${b.readLabel || '阅读'} ↗</a>` : '')}
        </article>`).join('')}</div>
    </div>`;
  }).join('');
}

/* ---------- 站内阅读器 ---------- */
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
let readerCur = 0;
function openReader(key) {
  const book = BOOKS_TEXT[key];
  if (!book) return;
  readerCur = 0;
  const ov = $('#reader-overlay');
  const toc = book.chapters.map((c, i) =>
    `<li><button class="toc-item" data-i="${i}">${escapeHtml(c.title)}</button></li>`).join('');
  const opts = book.chapters.map((c, i) =>
    `<option value="${i}">${escapeHtml(c.title)}</option>`).join('');
  ov.innerHTML = `<div class="reader-panel">
    <div class="reader-head">
      <div class="reader-meta">
        <span class="reader-title">${escapeHtml(book.title)}</span>
        <span class="reader-author">${escapeHtml(book.author || '')}</span>
      </div>
      <div class="reader-tools">
        <select class="reader-jump" aria-label="选择章节">${opts}</select>
        <button class="reader-close" aria-label="关闭阅读器">✕</button>
      </div>
    </div>
    <div class="reader-body">
      <nav class="reader-toc"><div class="reader-toc-h">目录</div><ul>${toc}</ul></nav>
      <article class="reader-content"></article>
    </div>
    <div class="reader-foot">原文为繁体（数据源：维基文库），仅供学习研究</div>
  </div>`;
  const content = ov.querySelector('.reader-content');
  const paint = () => {
    content.textContent = book.chapters[readerCur].text;
    content.scrollTop = 0;
    ov.querySelectorAll('.toc-item').forEach(b => b.classList.toggle('active', +b.dataset.i === readerCur));
    ov.querySelector('.reader-jump').value = String(readerCur);
  };
  ov.querySelector('.reader-close').onclick = closeReader;
  ov.querySelectorAll('.toc-item').forEach(b => b.onclick = () => { readerCur = +b.dataset.i; paint(); });
  ov.querySelector('.reader-jump').onchange = e => { readerCur = +e.target.value; paint(); };
  ov.onclick = e => { if (e.target === ov) closeReader(); };
  paint();
  ov.hidden = false;
  document.body.classList.add('reader-open');
}
function closeReader() {
  const ov = $('#reader-overlay');
  ov.hidden = true;
  ov.innerHTML = '';
  document.body.classList.remove('reader-open');
}
document.addEventListener('click', e => {
  const btn = e.target.closest('.book-read[data-textkey]');
  if (btn) { e.preventDefault(); openReader(btn.dataset.textkey); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const ov = $('#reader-overlay'); if (ov && !ov.hidden) closeReader(); }
});

/* ---------- 卦详情 ---------- */
function openDetail(id) {
  const h = HEXAGRAMS.find(x => x.id === id);
  if (!h) return;
  const idx = h.id - 1;
  const xiaoArr = XIAO[idx] || [];
  const fav = isFavorite(h.id);
  $('#detail-body').innerHTML = `
    <div class="detail-tools">
      <button class="fav-btn ${fav ? 'on' : ''}" id="fav-btn">${fav ? '★ 已收藏' : '☆ 收藏'}</button>
    </div>
    <div class="detail-head">
      <div class="detail-big">${hexHTML(h.array)}</div>
      <div class="detail-meta">
        <h2>${h.name}</h2>
        <div class="tt">${h.title} · 第 ${String(h.id).padStart(2, '0')} 卦</div>
        <div class="tags">
          <span>上卦 ${h.upper}（${h.upperNature}）</span>
          <span>下卦 ${h.lower}（${h.lowerNature}）</span>
          <span>${h.symbol}</span>
        </div>
      </div>
    </div>
    <div class="judge">
      <h3>卦辞</h3>
      <div class="txt">${h.judgment}</div>
    </div>
    <div class="tuan">
      <h3>彖传</h3>
      <div class="txt">${TUAN[idx] || ''}</div>
      <div class="tip">《彖传》为“十翼”之一，总释一卦之卦名、卦义与卦体（上下卦之德、刚柔往来），是理解本卦主旨的总纲。</div>
    </div>
    <div class="yaoci">
      <h3>爻辞 · 小象传</h3>
      ${h.lines.map((l, li) => `<div class="yl"><div class="yn">${l.name}</div><div class="yt">${l.text}</div>${xiaoArr[li] ? `<div class="yxiang"><span class="yx-lab">象</span>${xiaoArr[li]}</div>` : ''}</div>`).join('')}
    </div>
    <div class="daxiang">
      <h3>大象传</h3>
      <div class="txt">${DAXIANG[idx] || ''}</div>
      <div class="baihua"><span class="bh-lab">白话</span>${DAXIANG_BAIHUA[idx] || ''}</div>
      <div class="tip">《大象传》为“十翼”之一，由上下卦象推演君子修身、处世、治国之道，是《易经》最朗朗上口、也最具启发性的部分。</div>
    </div>
    <div class="note-box">
      <h3>我的笔记</h3>
      <textarea id="note-area" placeholder="写下你对这一卦的体会，仅保存在本机浏览器…">${escapeHtml(getNote(h.id))}</textarea>
      <div class="note-tip">笔记仅保存在你的本机浏览器</div>
    </div>`;
  // 收藏
  const fb = $('#fav-btn');
  if (fb) fb.onclick = () => {
    const on = toggleFavorite(h.id);
    fb.classList.toggle('on', on);
    fb.textContent = on ? '★ 已收藏' : '☆ 收藏';
    renderOverview(); // 刷新总览星标
  };
  // 笔记
  const na = $('#note-area');
  if (na) na.addEventListener('input', () => setNote(h.id, na.value));
  showView('detail');
}

/* ---------- 背诵 ---------- */
const quiz = { mode: 'see-diagram', score: 0, total: 0, cur: null, answered: false };
function startQuiz(mode) {
  quiz.mode = mode; quiz.score = 0; quiz.total = 0; quiz.answered = false;
  $$('.quiz-set button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  nextQuestion();
}
function nextQuestion() {
  quiz.answered = false;
  const q = $('#quiz-card'), fb = $('#quiz-feedback');
  fb.textContent = ''; fb.className = 'feedback';
  let h;
  if (quiz.mode === 'weak') {
    const weak = weakList();
    if (!weak.length) {
      q.innerHTML = '<div class="qhint">🎉 暂无薄弱卦——你还没答错，或先去其他模式练练。</div>';
      quiz.answered = true; quiz.cur = null; updateScore(); return;
    }
    h = sample(HEXAGRAMS.filter(x => weak.includes(x.id)), 1)[0];
  } else {
    h = sample(HEXAGRAMS, 1)[0];
  }
  quiz.cur = h;
  if (quiz.mode === 'see-diagram' || quiz.mode === 'weak') {
    const opts = sample(HEXAGRAMS.filter(x => x.id !== h.id), 3).concat(h);
    const sh = sample(opts, 4);
    q.innerHTML = `<div class="qhint">看卦象，选出正确的卦名</div>
      <div class="qhex">${hexHTML(h.array)}</div>
      <div class="choices">${sh.map((o, i) =>
        `<button class="choice" data-correct="${o.id === h.id}"><span class="opt">${'ABCD'[i]}</span>${o.name}（${o.title}）</button>`).join('')}</div>`;
    bindChoices(q, h);
  } else if (quiz.mode === 'see-name') {
    const opts = sample(HEXAGRAMS.filter(x => x.id !== h.id), 3).concat(h);
    const sh = sample(opts, 4);
    q.innerHTML = `<div class="qhint">看卦名，选出对应的卦象（仅看图形，不显示卦名）</div>
      <div class="qname">${h.name}</div>
      <div class="choices">${sh.map((o, i) =>
        `<button class="choice" data-correct="${o.id === h.id}"><span class="opt">${'ABCD'[i]}</span>${hexHTML(o.array, true)}</button>`).join('')}</div>`;
    bindChoices(q, h);
  } else if (quiz.mode === 'type-name') {
    q.innerHTML = `<div class="qhint">看卦象，写出卦名（可填单名如「屯」或全称「水雷屯」）</div>
      <div class="qhex">${hexHTML(h.array)}</div>
      <div class="choices" style="grid-template-columns:1fr">
        <input class="qinput" id="quiz-input" placeholder="在此输入卦名" autocomplete="off">
      </div>
      <div class="qactions"><button id="quiz-submit">提交</button></div>`;
    const submit = () => {
      if (quiz.answered) return;
      const v = $('#quiz-input').value.trim();
      const ok = v === h.name || v === h.title;
      resolveAnswer(ok, `正确答案：${h.name}（${h.title}）`);
    };
    $('#quiz-submit').addEventListener('click', submit);
    $('#quiz-input').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    setTimeout(() => $('#quiz-input') && $('#quiz-input').focus(), 50);
  } else if (quiz.mode === 'type-seq') {
    q.innerHTML = `<div class="qhint">看卦名，写出它在《周易》中的卦序（1–64）</div>
      <div class="qname">${h.name}</div>
      <div class="choices" style="grid-template-columns:1fr">
        <input class="qinput" id="quiz-input" placeholder="如 3" autocomplete="off">
      </div>
      <div class="qactions"><button id="quiz-submit">提交</button></div>`;
    const submit = () => {
      if (quiz.answered) return;
      const v = parseInt($('#quiz-input').value.trim(), 10);
      const ok = v === h.id;
      resolveAnswer(ok, `正确答案：第 ${h.id} 卦（${h.title}）`);
    };
    $('#quiz-submit').addEventListener('click', submit);
    $('#quiz-input').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    setTimeout(() => $('#quiz-input') && $('#quiz-input').focus(), 50);
  }
  updateScore();
}
function bindChoices(q, h) {
  $$('.choice', q).forEach(b => b.addEventListener('click', () => {
    if (quiz.answered) return;
    const correct = b.dataset.correct === 'true';
    $$('.choice', q).forEach(c => {
      if (c.dataset.correct === 'true') c.classList.add('correct');
      else if (c === b) c.classList.add('wrong');
    });
    resolveAnswer(correct, `正确答案：${h.name}（${h.title}）`);
  }));
}
function resolveAnswer(ok, msg) {
  quiz.answered = true; quiz.total++;
  if (ok) quiz.score++;
  if (quiz.cur) recordQuiz(quiz.cur.id, ok);
  const fb = $('#quiz-feedback');
  fb.textContent = (ok ? '✓ 答对了！' : '✗ ' + msg);
  fb.className = 'feedback ' + (ok ? 'ok' : 'no');
  updateScore();
  if (!$('#quiz-next')) {
    const btn = document.createElement('button');
    btn.id = 'quiz-next'; btn.textContent = '下一题 →';
    btn.style.cssText = 'margin-top:16px;background:#9e2b25;color:#fff;border:none;padding:10px 26px;border-radius:9px;cursor:pointer;font-family:inherit;font-size:16px;letter-spacing:2px;';
    btn.addEventListener('click', nextQuestion);
    $('#quiz-card').appendChild(btn);
  }
}
function updateScore() {
  $('#quiz-score').textContent = quiz.score;
  $('#quiz-total').textContent = quiz.total;
  const m = $('#quiz-mastered');
  if (m) m.textContent = quizMastered();
}

/* ---------- 占卦 ---------- */
let casting = false, currentMethod = 'coin', currentBenId = null;
function castLine() {
  // 三枚铜钱：正(字)=1, 反(背)=0
  const coins = [randInt(2), randInt(2), randInt(2)];
  const heads = coins.reduce((a, b) => a + b, 0);
  const val = heads === 3 ? 9 : heads === 2 ? 7 : heads === 1 ? 8 : 6; // 9老阳 7少阳 8少阴 6老阴
  return { coins, val };
}
/* 大衍之数（蓍草 49 策，三变成一爻）：每变分二、揲四、归奇，最终归为 6/7/8/9 */
function dayanLine() {
  let count = 49;
  for (let i = 0; i < 3; i++) {
    const left = Math.floor(Math.random() * (count - 1)) + 1;
    const right = count - left;
    const r1 = left % 4 || 4;
    const r2 = (right - (i === 0 ? 1 : 0)) % 4 || 4;
    count -= (r1 + r2 + (i === 0 ? 1 : 0));
  }
  return count / 4; // 6 老阴 / 7 少阳 / 8 少阴 / 9 老阳
}
async function doCast(method) {
  if (casting) return; casting = true;
  currentMethod = method || 'coin';
  $('#cast-btn').disabled = true;
  const isDayan = currentMethod === 'dayan';
  const lines = [];
  for (let i = 0; i < 6; i++) lines.push(isDayan ? { val: dayanLine() } : castLine());
  // 渲染硬币（逐爻揭示）
  const coinsBox = $('#coins-box');
  coinsBox.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:14px;justify-content:center;margin:6px 0;font-size:22px;';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8a7c69;width:46px;text-align:right;font-size:14px;';
    lbl.textContent = '第' + '初二三四五上'[i] + '爻';
    row.appendChild(lbl);
    const cs = document.createElement('span');
    cs.style.cssText = 'display:flex;gap:8px;';
    if (isDayan) {
      const s = document.createElement('span');
      s.textContent = lines[i].val === 9 ? '老阳 ○' : lines[i].val === 7 ? '少阳 —' : lines[i].val === 8 ? '少阴 – –' : '老阴 ×';
      s.style.cssText = 'color:#5b5147;font-size:15px;';
      cs.appendChild(s);
    } else {
      lines[i].coins.forEach(c => {
        const s = document.createElement('span');
        s.className = 'coin flip';
        s.textContent = c ? '正' : '反';
        s.style.cssText = 'display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:50%;border:1px solid #b08d57;' +
          (c ? 'background:#f7e9c9;color:#9e2b25;' : 'background:#f4ecd8;color:#5b5147;');
        cs.appendChild(s);
      });
      const v = document.createElement('span');
      v.style.cssText = 'color:#5b5147;width:40px;font-size:13px;';
      v.textContent = lines[i].val === 9 ? '老阳○' : lines[i].val === 7 ? '少阳—' : lines[i].val === 8 ? '少阴--' : '老阴×';
      cs.appendChild(v);
    }
    row.appendChild(cs);
    coinsBox.appendChild(row);
    await new Promise(r => setTimeout(r, 180));
  }
  // 计算本卦 / 变卦 / 动爻 / 互卦
  const ben = lines.map(l => (l.val === 9 || l.val === 7) ? 1 : 0);
  const benHex = byKey[ben.join('')];
  const bian = ben.map((b, i) => lines[i].val === 9 ? 0 : lines[i].val === 6 ? 1 : b);
  const bianHex = byKey[bian.join('')];
  const dong = lines.map((l, i) => (l.val === 9 || l.val === 6) ? i : -1).filter(i => i >= 0);
  // 互卦：下=二三四爻，上=三四五爻
  const hu = [ben[1], ben[2], ben[3], ben[2], ben[3], ben[4]];
  const huHex = byKey[hu.join('')];

  // 渲染结果
  let rh = `<div class="rh"><div class="lbl">本卦</div><div class="rh-big">${hexHTML(ben)}</div><div class="nm">${benHex.name}（${benHex.title}）</div></div>`;
  if (dong.length) {
    rh += `<div class="rh"><div class="lbl">变卦</div><div class="rh-big">${hexHTML(bian)}</div><div class="nm">${bianHex.name}（${bianHex.title}）</div></div>`;
    rh += `<div class="rh"><div class="lbl">互卦</div><div class="rh-big">${hexHTML(hu)}</div><div class="nm">${huHex.name}（${huHex.title}）</div></div>`;
  }
  $('#result-hex').innerHTML = rh;

  // 断语
  let duan = `<div class="duan"><div class="dt">本卦·${benHex.name} 卦辞</div><div class="dd">${benHex.judgment}</div></div>`;
  if (dong.length) {
    dong.forEach(i => {
      const ln = benHex.lines[i];
      duan += `<div class="duan"><div class="dt">本卦·${ln.name}（动爻）</div><div class="dd">${ln.text}</div></div>`;
    });
    if (bianHex.id !== benHex.id)
      duan += `<div class="duan"><div class="dt">之卦·${bianHex.name} 卦辞（变后所之）</div><div class="dd">${bianHex.judgment}</div></div>`;
    duan += `<div class="dylist">动爻：${dong.map(i => '第' + '初二三四五上'[i] + '爻').join('、')}</div>`;
  } else {
    duan += `<div class="dylist">无动爻（六爻皆静），以本卦卦辞断之。</div>`;
  }
  $('#result-duan').innerHTML = duan;
  $('#result-box').style.display = 'block';
  currentBenId = benHex.id;
  addCast({
    ts: Date.now(),
    method: currentMethod,
    benId: benHex.id, benName: benHex.name, benTitle: benHex.title,
    bianId: bianHex.id, bianName: bianHex.name,
    dong: dong.map(i => '初二三四五上'[i])
  });
  renderCastList();
  casting = false; $('#cast-btn').disabled = false;
}

/* ---------- 占卦记录列表 ---------- */
function fmtTime(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function renderCastList() {
  const box = $('#cast-list');
  if (!box) return;
  const list = getCasts();
  if (!list.length) { box.innerHTML = '<div class="ch-empty">还没有占卦记录，掷一卦试试。</div>'; return; }
  box.innerHTML = list.map(r => `
    <div class="ch-item" data-ben="${r.benId}">
      <div class="ch-main">
        <span class="ch-name">${escapeHtml(r.benName)}（${escapeHtml(r.benTitle)}）</span>
        ${r.bianId !== r.benId ? `<span class="ch-arrow">→</span><span class="ch-name">${escapeHtml(r.bianName)}</span>` : ''}
      </div>
      <div class="ch-meta">
        <span class="ch-method">${r.method === 'dayan' ? '大衍' : '铜钱'}</span>
        ${r.dong && r.dong.length ? `<span class="ch-dong">动：${r.dong.join('、')}</span>` : '<span class="ch-dong">静卦</span>'}
        <span class="ch-time">${fmtTime(r.ts)}</span>
      </div>
    </div>`).join('');
}

/* ---------- 初始化 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderOverview();
  renderBooks();
  renderPalaceChips();
  $('#brand-link').addEventListener('click', e => { e.preventDefault(); showView('home'); });
  $('#ge-py-toggle').addEventListener('click', togglePinyin);
  $$('nav.main a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showView(a.dataset.view); }));
  $('#detail-back').addEventListener('click', () => showView('overview'));
  // 总览搜索 / 筛选
  $('#ov-search').addEventListener('input', e => { ovState.q = e.target.value; renderOverview(); });
  $('#ov-jing').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    ovState.jing = b.dataset.jing;
    $$('#ov-jing .chip').forEach(c => c.classList.toggle('on', c === b));
    renderOverview();
  });
  $('#ov-palace').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    ovState.palace = b.dataset.palace;
    $$('#ov-palace .chip').forEach(c => c.classList.toggle('on', c === b));
    renderOverview();
  });
  // 背诵
  $$('.quiz-set button').forEach(b => b.addEventListener('click', () => startQuiz(b.dataset.mode)));
  startQuiz('see-diagram');
  // 占卦
  $$('.cm-btn').forEach(b => b.addEventListener('click', () => {
    $$('.cm-btn').forEach(x => x.classList.toggle('on', x === b));
    currentMethod = b.dataset.method;
  }));
  $('#cast-btn').addEventListener('click', () => doCast(currentMethod));
  $('#result-detail').addEventListener('click', () => { if (currentBenId) openDetail(currentBenId); });
  $('#clear-casts').addEventListener('click', () => { clearCasts(); renderCastList(); });
  renderCastList();
  document.addEventListener('click', e => {
    const it = e.target.closest('.ch-item');
    if (it) openDetail(+it.dataset.ben);
  });
  showView('home');
});
