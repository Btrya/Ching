/* 周易·习易 — 交互逻辑（ES Module） */
import './styles/main.css';
import { HEXAGRAMS, GUA_XU_GE, GE_PINYIN, QUXIANG_GE, BOOKS } from './data/hexagrams.js';
import { TUAN, DAXIANG, XIAO } from './data/wing.js';

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

/* ---------- 六十四卦总览 ---------- */
function renderOverview() {
  const grid = $('#overview-grid');
  grid.innerHTML = HEXAGRAMS.map(h =>
    `<div class="card" data-id="${h.id}">
       <div class="seq">${String(h.id).padStart(2, '0')}</div>
       ${hexHTML(h.array, true)}
       <div class="nm">${h.name}</div>
       <div class="tt">${h.title}</div>
     </div>`).join('');
  $$('#overview-grid .card').forEach(c =>
    c.addEventListener('click', () => openDetail(+c.dataset.id)));
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
          ${b.readUrl ? `<a class="book-read" href="${b.readUrl}" target="_blank" rel="noopener">${b.readLabel || '阅读'} ↗</a>` : ''}
        </article>`).join('')}</div>
    </div>`;
  }).join('');
}

/* ---------- 卦详情 ---------- */
function openDetail(id) {
  const h = HEXAGRAMS.find(x => x.id === id);
  if (!h) return;
  const idx = h.id - 1;
  const xiaoArr = XIAO[idx] || [];
  $('#detail-body').innerHTML = `
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
      <div class="tip">《大象传》为“十翼”之一，由上下卦象推演君子修身、处世、治国之道，是《易经》最朗朗上口、也最具启发性的部分。</div>
    </div>`;
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
  quiz.answered = false; quiz.cur = sample(HEXAGRAMS, 1)[0];
  const q = $('#quiz-card'), fb = $('#quiz-feedback');
  fb.textContent = ''; fb.className = 'feedback';
  const h = quiz.cur;
  if (quiz.mode === 'see-diagram') {
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
}

/* ---------- 占卦 ---------- */
let casting = false;
function castLine() {
  // 三枚铜钱：正(字)=1, 反(背)=0
  const coins = [randInt(2), randInt(2), randInt(2)];
  const heads = coins.reduce((a, b) => a + b, 0);
  const val = heads === 3 ? 9 : heads === 2 ? 7 : heads === 1 ? 8 : 6; // 9老阳 7少阳 8少阴 6老阴
  return { coins, val };
}
async function doCast() {
  if (casting) return; casting = true;
  $('#cast-btn').disabled = true;
  const lines = [];
  for (let i = 0; i < 6; i++) lines.push(castLine());
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
    row.appendChild(cs); row.appendChild(v);
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
  casting = false; $('#cast-btn').disabled = false;
}

/* ---------- 初始化 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderOverview();
  renderBooks();
  $('#brand-link').addEventListener('click', e => { e.preventDefault(); showView('home'); });
  $('#ge-py-toggle').addEventListener('click', togglePinyin);
  $$('nav.main a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showView(a.dataset.view); }));
  $('#detail-back').addEventListener('click', () => showView('overview'));
  // 背诵
  $$('.quiz-set button').forEach(b => b.addEventListener('click', () => startQuiz(b.dataset.mode)));
  startQuiz('see-diagram');
  // 占卦
  $('#cast-btn').addEventListener('click', doCast);
  showView('home');
});
