import './style.css';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const ROUTE_COPY = {
  today: 'ちっちゃく書いてみる',
  calendar: '日付から見る',
  search: '前に書いたことを探す',
  settings: '設定を変える',
};

const NAV_ITEMS = {
  today: { label: '今日', icon: '<path d="M13 21h8"/><path d="m15 5 4 4"/><path d="M17 3a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>' },
  calendar: { label: '日めくり', icon: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>' },
  search: { label: '検索', icon: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' },
  settings: { label: '設定', icon: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>' },
};

const COLORS = [
  { key: 'default', label: '標準' },
  { key: 'cream', label: 'クリーム' },
  { key: 'blue', label: 'ブルー' },
  { key: 'green', label: 'グリーン' },
];

const CHATGPT_BASE_URL = 'https://chatgpt.com/';
const CHATGPT_PROMPT_URL_LIMIT = 7000;
const PAPER_MODE_KEY = 'mydailylog-paper-mode';
const DRAFT_PREFIX = 'mydailylog-composer-draft:';
const SIDE_MEMO_KEY = 'mydailylog-side-memo';
const SIDE_MEMO_OPEN_KEY = 'mydailylog-side-memo-open';

const iso = () => new Date().toISOString();
const uid = () => crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
const dayKey = (date = new Date()) => date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
const fmtDate = (date) => new Intl.DateTimeFormat('ja-JP', {
  month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Tokyo',
}).format(new Date(`${date}T12:00:00`));
const fmtShortDate = (date) => new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', timeZone: 'Asia/Tokyo',
}).format(new Date(`${date}T12:00:00`));
const addDays = (date, offset) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return dayKey(d);
};
const addMonths = (date, offset) => {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return dayKey(d);
};
const addYears = (date, offset) => {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDate();
  d.setFullYear(d.getFullYear() + offset);
  if (d.getDate() !== day) d.setDate(0);
  return dayKey(d);
};
const escapeHtml = (text = '') => String(text).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
}[char]));
const escapeMarkdown = (value = '') => String(value).replace(/\\/g, '\\\\').replace(/\*/g, '\\*');
const countCharacters = (value = '') => {
  const text = String(value).trim();
  if (!text) return 0;
  if (typeof Intl.Segmenter === 'function') return [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text)].length;
  return [...text].length;
};
const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tokyo' }).format(date);
};
const timeOf = (entry) => entry.time || entry.createdAt;
const isNightHour = () => {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Tokyo' }).format(new Date()));
  return hour >= 22 || hour < 5;
};
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ls = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

const db = {
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('mydailylog', 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        const entries = database.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('date', 'date');
        database.createObjectStore('days', { keyPath: 'date' });
        database.createObjectStore('settings', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async request(store, mode, action) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(store, mode);
      const objectStore = transaction.objectStore(store);
      let result;
      try {
        result = action(objectStore);
      } catch (error) {
        reject(error);
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
    });
  },
  put(store, value) { return this.request(store, 'readwrite', (objectStore) => objectStore.put(value)); },
  delete(store, key) { return this.request(store, 'readwrite', (objectStore) => objectStore.delete(key)); },
  get(store, key) {
    return new Promise(async (resolve, reject) => {
      const database = await this.open();
      const request = database.transaction(store).objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  all(store) {
    return new Promise(async (resolve, reject) => {
      const database = await this.open();
      const request = database.transaction(store).objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  byDate(date) {
    return new Promise(async (resolve, reject) => {
      const database = await this.open();
      const request = database.transaction('entries').objectStore('entries').index('date').getAll(date);
      request.onsuccess = () => resolve(request.result.filter((entry) => !entry.deletedAt));
      request.onerror = () => reject(request.error);
    });
  },
};

function getInitialRoute() {
  const route = location.hash.replace('#/', '');
  return Object.hasOwn(ROUTE_COPY, route) ? route : 'today';
}

let state = {
  route: getInitialRoute(),
  date: dayKey(),
  query: '',
  toast: null,
  editingId: null,
  justAddedId: null,
  menuOpenId: null,
  colorPopoverId: null,
  themeMenuOpen: false,
  bookmarkOpen: false,
};

let dayTidyUndo = null;
let draftSaveTimer = null;
let sideMemoSaveTimer = null;

function parseEntry(raw) {
  const content = raw.trim();
  let importance = 0;
  if (/特大|面接|会見|旅行|遠征|開幕|発表|引っ越し/.test(content)) importance = 2;
  const time = (content.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/) || [])[0] || null;
  return { importance, time };
}

async function getDay(date) {
  return (await db.get('days', date)) || {
    date, title: '', summary: '', mood: null, carryOver: '', updatedAt: iso(),
  };
}

async function saveDay(day) {
  day.updatedAt = iso();
  await db.put('days', day);
}

function app() { return $('#app'); }

/* ---------- paper mode (day / night, R4) ---------- */

function getPaperMode() {
  const stored = ls.get(PAPER_MODE_KEY, null);
  if (stored) return stored;
  const legacy = localStorage.getItem('mydailylog-theme');
  return legacy === 'dark' ? 'night' : 'auto';
}
function effectivePaper(mode) {
  if (mode === 'day' || mode === 'night') return mode;
  return isNightHour() ? 'night' : 'day';
}
function applyPaperMode() {
  document.documentElement.dataset.paper = effectivePaper(getPaperMode());
}
function setPaperMode(mode) {
  ls.set(PAPER_MODE_KEY, mode);
  applyPaperMode();
  render();
}
setInterval(() => { if (getPaperMode() === 'auto') applyPaperMode(); }, 5 * 60 * 1000);

/* ---------- view-transition page turn (R1) ---------- */

function withPageTransition(direction, update) {
  if (!document.startViewTransition || prefersReducedMotion()) { update(); return; }
  document.documentElement.dataset.pageDir = direction;
  const transition = document.startViewTransition(() => update());
  transition.finished.finally(() => { delete document.documentElement.dataset.pageDir; });
}

function bindSwipe(container, { onPrev, onNext }) {
  let startX = 0;
  let startY = 0;
  let tracking = false;
  container.addEventListener('touchstart', (event) => {
    const target = event.target;
    if (target.closest('textarea, input, button, select, .memo-actions')) { tracking = false; return; }
    tracking = true;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });
  container.addEventListener('touchend', (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0) onNext(); else onPrev();
  }, { passive: true });
}

/* ---------- render shell ---------- */

async function render() {
  $$('.color-popover').forEach((node) => node.remove());
  const route = state.route;
  app().innerHTML = `
    <main class="shell">
      <header class="top">
        <div class="brand">徒然日記</div>
        <div class="paper-mode${state.themeMenuOpen ? ' is-open' : ''}">
          <button class="theme" aria-label="紙の色を選ぶ" aria-haspopup="true" aria-expanded="${state.themeMenuOpen}">◐</button>
          <div class="theme-menu" role="menu">
            <button data-paper-mode="auto" class="${getPaperMode() === 'auto' ? 'on' : ''}">自動</button>
            <button data-paper-mode="day" class="${getPaperMode() === 'day' ? 'on' : ''}">昼</button>
            <button data-paper-mode="night" class="${getPaperMode() === 'night' ? 'on' : ''}">夜</button>
          </div>
        </div>
      </header>
      <section id="view"></section>
      <nav class="nav" aria-label="メインメニュー">
        ${Object.entries(NAV_ITEMS).map(([key, { label, icon }]) => `
          <button data-route="${key}" class="${route === key ? 'active' : ''}" aria-label="${label}">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
            <span>${label}</span>
          </button>`).join('')}
      </nav>
    </main>
    <div id="toast" aria-live="polite"></div>`;

  $$('[data-route]').forEach((button) => { button.onclick = () => setRoute(button.dataset.route); });
  const themeButton = $('.theme');
  themeButton.onclick = (event) => { event.stopPropagation(); state.themeMenuOpen = !state.themeMenuOpen; render(); };
  $$('[data-paper-mode]').forEach((button) => { button.onclick = () => setPaperMode(button.dataset.paperMode); });
  if (state.themeMenuOpen) {
    document.addEventListener('click', () => { state.themeMenuOpen = false; render(); }, { once: true });
  }

  if (route === 'today') await renderToday();
  if (route === 'calendar') await renderCalendar();
  if (route === 'search') await renderSearch();
  if (route === 'settings') await renderSettings();
  if (state.toast) showToast(state.toast);
  syncSideMemoVisibility();
}

function setRoute(route) {
  state.route = route;
  state.editingId = null;
  state.bookmarkOpen = false;
  if (location.hash !== `#/${route}`) location.hash = `#/${route}`;
  render();
}

/* ---------- today: the paper page ---------- */

async function renderToday() {
  const date = state.date;
  const day = await getDay(date);
  const entries = (await db.byDate(date)).sort((a, b) => {
    const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    return pinDiff || timeOf(a).localeCompare(timeOf(b));
  });
  const [dateYear, dateMonth, dateDay] = date.split('-').map(Number);
  const weekday = new Intl.DateTimeFormat('ja-JP', { weekday: 'short', timeZone: 'Asia/Tokyo' }).format(new Date(`${date}T12:00:00`));
  const moodFade = day.mood ? 78 - day.mood * 14 : 55;
  const draft = ls.get(`${DRAFT_PREFIX}${date}`, null);
  const bookmarkTargets = await getBookmarkTargets(date);

  $('#view').innerHTML = `
    <section class="paper" style="--mood-fade:${moodFade}%">
      <div class="paper-head">
        <button id="prev" aria-label="前の日">‹</button>
        <div>
          <button type="button" class="mobile-memo-toggle" data-side-memo-toggle aria-label="作業メモを開く"><span aria-hidden="true">✎</span>メモ</button>
          <div class="date-figure">
            <span class="date-num">${dateDay}</span>
            <span class="date-sub">${dateMonth}月<br>${weekday}曜</span>
          </div>
          <input id="daytitle" placeholder="${dateMonth}/${dateDay}(${weekday})のタイトル" value="${escapeHtml(day.title)}" aria-label="この日のタイトル" />
          <div class="mood-row">
            <span>気分</span>
            <div class="moods" aria-label="気分を選ぶ">
              ${[1, 2, 3, 4, 5].map((score) => `<button type="button" data-mood="${score}" data-level="${score}" class="${day.mood === score ? 'on' : ''}" aria-label="気分 ${score}"><i></i></button>`).join('')}
            </div>
          </div>
        </div>
        <button id="next" aria-label="次の日">›</button>
      </div>
      <div class="day-tools">
        <button id="copy-day-logs" data-default-label="この日をコピー">この日をコピー</button>
        <button id="chatgpt-day-logs" data-default-label="ChatGPTで話す ↗">ChatGPTで話す ↗</button>
        <button id="tidy-day-logs">整える</button>
        ${dayTidyUndo && dayTidyUndo.date === date ? '<button id="undo-day-tidy">元に戻す</button>' : ''}
      </div>
      ${bookmarkTargets.length ? renderBookmarkArea(bookmarkTargets) : ''}
      <div class="entries-paper">
        ${entries.length ? entries.map((entry, index) => memoArticle(entry, { first: index === 0 || (entries[index - 1].pinned && !entry.pinned) })).join('') : '<div class="empty">入力はこれから。ちょっとだけ書いてみよう。</div>'}
      </div>
      <div class="composer" aria-label="次の一行">
        <input id="composer-title" class="composer-title" type="text" autocomplete="off" placeholder="題名（なくてもOK）" value="${escapeHtml(draft?.title || '')}" aria-label="ログの題名 任意" />
        <div class="composer-row">
          <textarea id="composer" placeholder="今日のメモを書く…">${escapeHtml(draft?.text || '')}</textarea>
          <button type="button" class="send" id="send" aria-label="メモを追加">↑</button>
        </div>
        <span class="draft-status" id="draft-status" aria-live="polite">${draft?.text || draft?.title ? '下書きを復元' : ''}</span>
        <span class="composer-hint">Ctrl / Cmd + Enterで記録。複数行でも1つのメモとして保存。</span>
      </div>
    </section>`;

  $('#prev').onclick = () => { withPageTransition('prev', () => { state.date = addDays(date, -1); render(); }); };
  $('#next').onclick = () => { withPageTransition('next', () => { state.date = addDays(date, 1); render(); }); };
  $('#daytitle').addEventListener('input', async (event) => { day.title = event.target.value; await saveDay(day); });
  $$('[data-mood]').forEach((button) => {
    button.onclick = async () => { day.mood = day.mood === Number(button.dataset.mood) ? null : Number(button.dataset.mood); await saveDay(day); render(); };
  });

  bindComposer(date);
  bindDayTools(date);
  bindMemos($('.entries-paper'));
  bindBookmarks();

  const paper = $('.paper');
  bindSwipe(paper, {
    onPrev: () => $('#prev').click(),
    onNext: () => $('#next').click(),
  });
}

function memoArticle(entry, { first = false } = {}) {
  const isEditing = entry.id === state.editingId;
  const menuOpen = entry.id === state.menuOpenId;
  const title = entry.title ? `<h3 class="memo-title">${escapeHtml(entry.title)}</h3>` : '';
  const sealNew = entry.id === state.justAddedId ? ' seal-new' : '';
  const body = isEditing ? `
      <div class="memo-edit">
        <input class="memo-edit-title" type="text" autocomplete="off" placeholder="題名" value="${escapeHtml(entry.title || '')}" aria-label="題名" />
        <textarea class="memo-edit-content" placeholder="本文" aria-label="本文">${escapeHtml(entry.content)}</textarea>
        <div class="memo-edit-actions">
          <span class="memo-edit-status" data-status>${countCharacters(entry.content)}字　Ctrl / Cmd + Enterで確定・Escで取消</span>
          <div class="memo-edit-buttons">
            <button type="button" class="memo-edit-cancel">取消</button>
            <button type="button" class="memo-edit-save">確定</button>
          </div>
        </div>
      </div>`
    : `<div class="memo-body" data-open="${entry.id}">${title}<p class="memo-content">${escapeHtml(entry.content)}</p></div>`;

  return `
    <article class="memo${entry.pinned ? ' is-pinned' : ''}${isEditing ? ' is-editing' : ''}${menuOpen ? ' is-menu-open' : ''}" data-id="${entry.id}" data-color="${entry.cardColor || 'default'}">
      <div class="memo-time">
        <time>${entry.time || formatDateTime(entry.createdAt).split(' ').pop() || ''}</time>
        ${entry.pinned ? '<span aria-hidden="true">⌖</span>' : ''}
        ${entry.favorite ? '<span aria-hidden="true">★</span>' : ''}
        <span class="seal${first ? ' seal-first' : ''}${sealNew}" aria-hidden="true">記</span>
        <span class="memo-dot" aria-hidden="true"></span>
      </div>
      ${body}
      ${isEditing ? '' : `
      <button type="button" class="memo-more" data-menu-toggle="${entry.id}" aria-label="操作を表示">⋯</button>
      <div class="memo-actions">
        <button type="button" class="memo-action log-card-copy" data-copy="${entry.id}" aria-label="このメモをコピー" title="このメモをコピー"><span aria-hidden="true">⧉</span></button>
        <button type="button" class="memo-action log-card-chatgpt" data-gpt="${entry.id}" aria-label="このメモをChatGPTで話す" title="このメモをChatGPTで話す"><span aria-hidden="true">GPT</span></button>
        <button type="button" class="memo-action log-card-pin" data-pin="${entry.id}" aria-pressed="${Boolean(entry.pinned)}" aria-label="${entry.pinned ? 'ピン留めを外す' : 'ピン留めする'}"><span aria-hidden="true">⌖</span></button>
        <button type="button" class="memo-action log-card-favorite" data-favorite="${entry.id}" aria-pressed="${Boolean(entry.favorite)}" aria-label="${entry.favorite ? 'お気に入りを外す' : 'お気に入りにする'}"><span aria-hidden="true">☆</span></button>
        <span class="memo-action memo-color-swatch" data-color-trigger="${entry.id}" role="button" tabindex="0" aria-haspopup="true" aria-expanded="${state.colorPopoverId === entry.id}" aria-label="背景色を変更">🎨
          <div class="color-popover${state.colorPopoverId === entry.id ? ' is-open' : ''}">
            ${COLORS.map(({ key, label }) => `<button type="button" class="color-swatch" data-swatch="${key}" data-set-color="${entry.id}" data-color-key="${key}" aria-pressed="${(entry.cardColor || 'default') === key}" aria-label="${label}に変更" title="${label}"></button>`).join('')}
          </div>
        </span>
        <button type="button" class="memo-action memo-delete" data-delete="${entry.id}" aria-label="このメモを削除">×</button>
      </div>`}
    </article>`;
}

function closeAllMemoPopovers() {
  state.menuOpenId = null;
  state.colorPopoverId = null;
}

function bindMemos(container) {
  $$('.memo-body[data-open]', container).forEach((body) => {
    body.onclick = () => { state.editingId = body.dataset.open; render(); };
  });
  $$('[data-menu-toggle]', container).forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const id = button.dataset.menuToggle;
      state.menuOpenId = state.menuOpenId === id ? null : id;
      state.colorPopoverId = null;
      render();
    };
  });
  $$('[data-copy]', container).forEach((button) => { button.onclick = (event) => { event.stopPropagation(); copyMemo(button.dataset.copy, button); }; });
  $$('[data-gpt]', container).forEach((button) => { button.onclick = (event) => { event.stopPropagation(); openMemoInChatGPT(button.dataset.gpt, button); }; });
  $$('[data-pin]', container).forEach((button) => { button.onclick = (event) => { event.stopPropagation(); toggleEntryFlag(button.dataset.pin, 'pinned'); }; });
  $$('[data-favorite]', container).forEach((button) => { button.onclick = (event) => { event.stopPropagation(); toggleEntryFlag(button.dataset.favorite, 'favorite'); }; });
  $$('[data-color-trigger]', container).forEach((trigger) => {
    trigger.onclick = (event) => {
      event.stopPropagation();
      const id = trigger.dataset.colorTrigger;
      state.colorPopoverId = state.colorPopoverId === id ? null : id;
      state.menuOpenId = null;
      render();
    };
  });
  $$('[data-set-color]', container).forEach((swatch) => {
    swatch.onclick = (event) => {
      event.stopPropagation();
      setEntryColor(swatch.dataset.setColor, swatch.dataset.colorKey);
    };
  });
  $$('[data-delete]', container).forEach((button) => { button.onclick = (event) => { event.stopPropagation(); softDelete(button.dataset.delete); }; });

  const editing = $('.memo.is-editing', container);
  if (editing) bindMemoEdit(editing);

  if (state.menuOpenId || state.colorPopoverId) {
    document.addEventListener('click', () => { closeAllMemoPopovers(); render(); }, { once: true });
  }
}

function bindMemoEdit(memoNode) {
  const id = memoNode.dataset.id;
  const titleInput = $('.memo-edit-title', memoNode);
  const contentInput = $('.memo-edit-content', memoNode);
  const status = $('[data-status]', memoNode);
  let saving = false;

  const setStatus = (message = 'Ctrl / Cmd + Enterで確定・Escで取消') => {
    status.textContent = `${countCharacters(contentInput.value)}字　${message}`;
  };

  const cancel = () => { if (saving) return; state.editingId = null; render(); };
  const save = async () => {
    if (saving) return;
    const nextContent = contentInput.value.trim();
    if (!nextContent) { setStatus('本文を入力して'); contentInput.focus(); return; }
    saving = true;
    setStatus('保存中…');
    const entry = await db.get('entries', id);
    if (!entry) { state.editingId = null; render(); return; }
    entry.title = titleInput.value.trim();
    entry.content = nextContent;
    entry.updatedAt = iso();
    await db.put('entries', entry);
    state.editingId = null;
    render();
  };

  contentInput.addEventListener('input', () => setStatus());
  memoNode.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); save(); }
    if (event.key === 'Escape') { event.preventDefault(); cancel(); }
  });
  $('.memo-edit-cancel', memoNode).onclick = cancel;
  $('.memo-edit-save', memoNode).onclick = save;
  contentInput.focus();
  contentInput.setSelectionRange(contentInput.value.length, contentInput.value.length);
}

async function toggleEntryFlag(id, key) {
  const entry = await db.get('entries', id);
  if (!entry) return;
  entry[key] = !entry[key];
  entry[`${key}At`] = entry[key] ? iso() : null;
  entry.updatedAt = iso();
  await db.put('entries', entry);
  render();
}

async function setEntryColor(id, color) {
  const entry = await db.get('entries', id);
  if (!entry) return;
  entry.cardColor = COLORS.some((c) => c.key === color) ? color : 'default';
  entry.updatedAt = iso();
  await db.put('entries', entry);
  state.colorPopoverId = null;
  render();
}

function copyTextFor(entry) {
  const title = String(entry?.title || '').trim();
  const content = String(entry?.content || '').trim();
  if (title && content) return `**${escapeMarkdown(title)}**\n${content}`;
  return title || content;
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;opacity:0;';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy failed');
}

async function copyMemo(id, button) {
  if (button.dataset.busy === '1') return;
  button.dataset.busy = '1';
  const icon = $('span', button);
  try {
    const entry = await db.get('entries', id);
    const text = copyTextFor(entry);
    if (!text) throw new Error('empty memo');
    await writeClipboard(text);
    icon.textContent = '✓';
  } catch {
    icon.textContent = '!';
  } finally {
    setTimeout(() => { icon.textContent = '⧉'; button.dataset.busy = '0'; }, 1200);
  }
}

function chatGPTTextFor(entry) {
  const date = String(entry?.date || '').replace(/-/g, '/');
  const content = String(entry?.content || '').trim();
  if (!content) return '';
  return date ? `${date}\n\n${content}` : content;
}

async function openMemoInChatGPT(id, button) {
  if (button.dataset.busy === '1') return;
  button.dataset.busy = '1';
  const icon = $('span', button);
  const chatWindow = window.open('about:blank', '_blank');
  if (chatWindow) chatWindow.opener = null;
  try {
    const entry = await db.get('entries', id);
    const text = chatGPTTextFor(entry);
    if (!text) throw new Error('empty memo');
    const url = `${CHATGPT_BASE_URL}?prompt=${encodeURIComponent(text)}`;
    if (url.length <= CHATGPT_PROMPT_URL_LIMIT && chatWindow) {
      chatWindow.location.replace(url);
      icon.textContent = '✓';
    } else {
      await writeClipboard(text);
      if (chatWindow) chatWindow.location.replace(CHATGPT_BASE_URL);
      icon.textContent = '✓';
    }
  } catch {
    if (chatWindow && !chatWindow.closed) chatWindow.close();
    icon.textContent = '!';
  } finally {
    setTimeout(() => { icon.textContent = 'GPT'; button.dataset.busy = '0'; }, 1400);
  }
}

/* ---------- composer: next line (H2) ---------- */

function bindComposer(date) {
  const composer = $('.composer');
  const title = $('#composer-title');
  const textarea = $('#composer');
  const status = $('#draft-status');
  const draftKey = `${DRAFT_PREFIX}${date}`;

  const saveDraft = () => {
    if (!textarea.value.trim() && !title.value.trim()) { ls.remove(draftKey); status.textContent = ''; return; }
    ls.set(draftKey, { title: title.value, text: textarea.value, updatedAt: iso() });
    status.textContent = '下書き保存済み';
  };
  const scheduleDraft = () => {
    status.textContent = '保存中…';
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(saveDraft, 180);
  };

  const toggleActive = () => composer.classList.toggle('is-active', document.activeElement === textarea || Boolean(textarea.value.trim()));
  textarea.addEventListener('focus', toggleActive);
  textarea.addEventListener('blur', () => { toggleActive(); saveDraft(); });
  textarea.addEventListener('input', scheduleDraft);
  title.addEventListener('input', scheduleDraft);
  title.addEventListener('blur', saveDraft);
  title.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); textarea.focus(); }
  });

  $('#send').onclick = () => saveComposer(date);
  textarea.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') saveComposer(date);
  });
}

async function saveComposer(date) {
  const textarea = $('#composer');
  const titleInput = $('#composer-title');
  const raw = textarea.value.trim();
  if (!raw) return;
  const parsed = parseEntry(raw);
  const entry = {
    id: uid(), date, time: parsed.time, title: titleInput.value.trim(), content: raw,
    type: 'memo', amount: null, unit: null, tags: [], importance: parsed.importance,
    pinned: false, pinnedAt: null, favorite: false, favoriteAt: null, cardColor: 'default',
    metadata: {}, createdAt: iso(), updatedAt: iso(), deletedAt: null,
  };
  await db.put('entries', entry);
  ls.remove(`${DRAFT_PREFIX}${date}`);
  state.justAddedId = entry.id;
  render();
  setTimeout(() => { state.justAddedId = null; }, 900);
}

async function softDelete(id) {
  const entry = await db.get('entries', id);
  if (!entry) return;
  entry.deletedAt = iso();
  await db.put('entries', entry);
  state.editingId = null;
  toast('削除した', async () => {
    entry.deletedAt = null;
    entry.updatedAt = iso();
    await db.put('entries', entry);
    render();
  });
  render();
}

function toast(message, undo) {
  state.toast = { message, undo };
  showToast(state.toast);
}

function showToast(currentToast) {
  const toastRoot = $('#toast');
  if (!toastRoot) return;
  toastRoot.innerHTML = `<div>${currentToast.message}${currentToast.undo ? '<button id="undo">取り消す</button>' : ''}</div>`;
  if (currentToast.undo) {
    $('#undo').onclick = async () => {
      await currentToast.undo();
      state.toast = null;
      toastRoot.innerHTML = '';
    };
  }
  setTimeout(() => {
    if (state.toast === currentToast) {
      state.toast = null;
      toastRoot.innerHTML = '';
    }
  }, 5000);
}

/* ---------- day tools: copy / ChatGPT / tidy (H3, kept visible per user) ---------- */

function timeFor(entry) {
  if (entry.time) return entry.time;
  const date = new Date(entry.createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tokyo' }).format(date);
}
function sortForExport(entries) {
  return entries.slice().sort((a, b) => timeOf(a).localeCompare(timeOf(b)) || String(a.createdAt).localeCompare(String(b.createdAt)));
}
function markdownBullet(entry) {
  const content = String(entry.content || '').trim();
  const title = String(entry.title || '').trim();
  const time = timeFor(entry);
  if (!content) return '';
  const lines = content.split(/\r?\n/);
  const startsWithTime = time && new RegExp(`^${time.replace(':', '\\:')}(?:\\s|　|[：:-])`).test(lines[0]);
  const prefix = startsWithTime || !time ? '- ' : `- ${time} `;
  if (title) return `${prefix}**${escapeMarkdown(title)}**\n${lines.map((line) => `  ${line}`).join('\n')}`;
  return `${prefix}${lines[0]}${lines.slice(1).map((line) => `\n  ${line}`).join('')}`;
}
function markdownForDay(entries, date) {
  const sorted = sortForExport(entries);
  if (!sorted.length) return '';
  const body = sorted.map(markdownBullet).filter(Boolean).join('\n');
  return `# ${date.replace(/-/g, '/')}\n${body}`;
}

function setButtonState(button, label, state2 = '') {
  button.textContent = label;
  button.dataset.state = state2;
}

async function copyDayEntries(date, button) {
  if (button.dataset.busy === '1') return;
  button.dataset.busy = '1';
  setButtonState(button, 'コピー中…', 'busy');
  try {
    const entries = await db.byDate(date);
    const markdown = markdownForDay(entries, date);
    if (!markdown) { setButtonState(button, 'メモなし', 'empty'); return; }
    await writeClipboard(markdown);
    setButtonState(button, 'コピー済み ✓', 'success');
  } catch {
    setButtonState(button, 'コピー失敗', 'error');
  } finally {
    button.dataset.busy = '0';
    setTimeout(() => setButtonState(button, button.dataset.defaultLabel), 1800);
  }
}

function openPendingChatWindow() {
  const popup = window.open('about:blank', '_blank');
  if (!popup) return null;
  try {
    popup.opener = null;
    popup.document.title = 'ChatGPTを開いています…';
    popup.document.body.textContent = 'ChatGPTを開いています…';
  } catch { /* some browsers restrict immediate access */ }
  return popup;
}

async function openDayInChatGPT(date, button) {
  if (button.dataset.busy === '1') return;
  button.dataset.busy = '1';
  setButtonState(button, '準備中…', 'busy');
  const popup = openPendingChatWindow();
  try {
    const entries = await db.byDate(date);
    const markdown = markdownForDay(entries, date);
    if (!markdown) { if (popup) popup.close(); setButtonState(button, 'メモなし', 'empty'); return; }
    const prompt = [
      `以下は${date.replace(/-/g, '/')}の日記です。`,
      'この日記について一緒に振り返ってください。要約だけで終わらず、印象に残る出来事や変化、気になった点を拾いながら対話してください。必要なら質問は一度に1つずつしてください。',
      '', markdown,
    ].join('\n');
    const url = `${CHATGPT_BASE_URL}?prompt=${encodeURIComponent(prompt)}`;
    if (url.length <= CHATGPT_PROMPT_URL_LIMIT) {
      if (popup && !popup.closed) popup.location.replace(url); else window.location.assign(url);
      setButtonState(button, 'ChatGPTを開いた ↗', 'success');
    } else {
      await writeClipboard(prompt);
      if (popup && !popup.closed) popup.location.replace(CHATGPT_BASE_URL);
      setButtonState(button, '長文をコピーして開いた', 'success');
    }
  } catch {
    if (popup && !popup.closed) popup.close();
    setButtonState(button, '接続できず', 'error');
  } finally {
    button.dataset.busy = '0';
    setTimeout(() => setButtonState(button, button.dataset.defaultLabel), 2400);
  }
}

function normalizeText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, ' ')
    .replace(/[ \t]+$/gm, '');
}

async function tidyDay(date, button) {
  if (button.disabled) return;
  button.disabled = true;
  setButtonState(button, '整え中…', 'busy');
  try {
    const entries = await db.byDate(date);
    if (!entries.length) { setButtonState(button, 'メモなし', 'empty'); return; }
    const before = entries.map((entry) => ({ ...entry }));
    const after = entries.map((entry) => ({ ...entry, content: normalizeText(entry.content || ''), title: normalizeText(entry.title || '') }));
    const changed = after.filter((entry, index) => JSON.stringify(entry) !== JSON.stringify(before[index]));
    if (!changed.length) { setButtonState(button, '変更なし', 'empty'); return; }
    dayTidyUndo = { date, entries: before };
    for (const entry of changed) await db.put('entries', entry);
    setButtonState(button, '整えた ✓', 'success');
    setTimeout(render, 400);
  } catch {
    setButtonState(button, '失敗', 'error');
  } finally {
    button.disabled = false;
  }
}

async function undoTidy(button) {
  if (!dayTidyUndo || button.disabled) return;
  button.disabled = true;
  button.textContent = '戻し中…';
  for (const entry of dayTidyUndo.entries) await db.put('entries', entry);
  dayTidyUndo = null;
  render();
}

function bindDayTools(date) {
  const copyButton = $('#copy-day-logs');
  copyButton.onclick = () => copyDayEntries(date, copyButton);
  const gptButton = $('#chatgpt-day-logs');
  gptButton.onclick = () => openDayInChatGPT(date, gptButton);
  const tidyButton = $('#tidy-day-logs');
  tidyButton.onclick = () => tidyDay(date, tidyButton);
  const undoButton = $('#undo-day-tidy');
  if (undoButton) undoButton.onclick = () => undoTidy(undoButton);
}

/* ---------- bookmarks: same date a month / a year ago (R3) ---------- */

async function getBookmarkTargets(date) {
  const candidates = [
    { offset: addMonths(date, -1), label: '1か月前' },
    { offset: addYears(date, -1), label: '1年前' },
  ];
  const results = await Promise.all(candidates.map(async ({ offset, label }) => ({
    date: offset, label, entries: await db.byDate(offset),
  })));
  return results.filter((target) => target.entries.length);
}

function renderBookmarkArea(targets) {
  return `
    <div class="bookmarks">
      ${targets.map((target) => `<button type="button" class="bookmark-tab" data-bookmark="${target.date}">栞・${target.label}</button>`).join('')}
    </div>
    ${state.bookmarkOpen ? `
    <div class="bookmark-panel">
      ${targets.map((target) => `
        <div>
          <h3>${target.label}・${fmtShortDate(target.date)}</h3>
          <div class="entries-paper">${sortForExport(target.entries).map((entry) => memoArticle({ ...entry, id: `bookmark-${entry.id}` }, {})).join('')}</div>
          <button type="button" class="bookmark-open" data-open-day="${target.date}">この日を開く</button>
        </div>`).join('')}
    </div>` : ''}`;
}

function bindBookmarks() {
  $$('[data-bookmark]').forEach((button) => {
    button.onclick = () => { state.bookmarkOpen = !state.bookmarkOpen; render(); };
  });
  $$('[data-open-day]').forEach((button) => {
    button.onclick = () => { state.date = button.dataset.openDay; state.bookmarkOpen = false; render(); };
  });
}

/* ---------- calendar: ink grid (H6) ---------- */

async function renderCalendar() {
  const active = new Date(`${state.date}T12:00:00`);
  const first = new Date(active.getFullYear(), active.getMonth(), 1);
  const last = new Date(active.getFullYear(), active.getMonth() + 1, 0);
  const [entries, days] = await Promise.all([db.all('entries'), db.all('days')]);
  const dayMap = Object.fromEntries(days.map((day) => [day.date, day]));
  const activeEntries = entries.filter((entry) => !entry.deletedAt);
  const today = dayKey();
  const cells = Array.from({ length: last.getDate() }, (_, index) => {
    const date = dayKey(new Date(active.getFullYear(), active.getMonth(), index + 1));
    const logs = activeEntries.filter((entry) => entry.date === date);
    const chars = logs.reduce((sum, entry) => sum + countCharacters(entry.content), 0);
    const major = logs.some((entry) => entry.importance === 2 || entry.type === 'event');
    const title = dayMap[date]?.title || '';
    return { date, index, logs, chars, major, title };
  });

  $('#view').innerHTML = `
    <section class="calendar">
      <div class="calhead"><button id="previous-month" aria-label="前月">‹</button><h1>${active.getFullYear()}年${active.getMonth() + 1}月</h1><button id="next-month" aria-label="次月">›</button></div>
      <div class="week">${['日', '月', '火', '水', '木', '金', '土'].map((day) => `<span>${day}</span>`).join('')}</div>
      <div class="grid">
        ${Array(first.getDay()).fill('<i></i>').join('')}
        ${cells.map(({ date, index, logs, chars, major, title }) => `
        <div class="calday-copy-wrap">
          <button data-date="${date}" class="calday${date === today ? ' is-today' : ''}" style="--fill:${Math.min(85, chars / 6)}" aria-label="${fmtShortDate(date)}、メモ ${logs.length} 件">
            <b>${index + 1}</b>${major ? '<span class="star">★</span>' : ''}${title ? `<span class="cal-title">${escapeHtml(title)}</span>` : logs.length ? `<small>${logs.length}</small>` : ''}
          </button>
          ${logs.length ? `<button type="button" class="calendar-day-copy" data-copy-date="${date}" aria-label="${fmtShortDate(date)}のメモをコピー" title="コピー">⧉</button>` : ''}
        </div>`).join('')}
      </div>
    </section>`;
  $('#previous-month').onclick = () => withPageTransition('prev', () => { state.date = dayKey(new Date(active.getFullYear(), active.getMonth() - 1, 1)); render(); });
  $('#next-month').onclick = () => withPageTransition('next', () => { state.date = dayKey(new Date(active.getFullYear(), active.getMonth() + 1, 1)); render(); });
  $$('[data-date]').forEach((button) => { button.onclick = () => { state.date = button.dataset.date; setRoute('today'); }; });
  $$('[data-copy-date]').forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.dataset.defaultLabel = '⧉';
      copyCompactDay(button.dataset.copyDate, button);
    };
  });
}

async function copyCompactDay(date, button) {
  if (button.dataset.busy === '1') return;
  button.dataset.busy = '1';
  try {
    const entries = await db.byDate(date);
    const markdown = markdownForDay(entries, date);
    if (!markdown) { button.textContent = '–'; return; }
    await writeClipboard(markdown);
    button.textContent = '✓';
  } catch {
    button.textContent = '!';
  } finally {
    button.dataset.busy = '0';
    setTimeout(() => { button.textContent = '⧉'; }, 1400);
  }
}

/* ---------- search (D5: grouped by date) ---------- */

async function renderSearch() {
  const entries = (await db.all('entries')).filter((entry) => !entry.deletedAt);
  $('#view').innerHTML = `
    <section class="search">
      <h1>メモを探す</h1>
      <input id="query" placeholder="例：ゼルダ / チョコザップ" value="${escapeHtml(state.query)}" />
      <div id="results"></div>
    </section>`;
  const draw = () => {
    const query = $('#query').value.toLowerCase().trim();
    state.query = query;
    const results = query
      ? entries.filter((entry) => [entry.title, entry.content].join(' ').toLowerCase().includes(query))
      : entries.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 20);
    if (!results.length) { $('#results').innerHTML = '<div class="empty">見つからなかった。</div>'; return; }
    const byDate = new Map();
    results.forEach((entry) => {
      if (!byDate.has(entry.date)) byDate.set(entry.date, []);
      byDate.get(entry.date).push(entry);
    });
    const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
    $('#results').innerHTML = dates.map((date) => `
      <div class="search-group">
        <h2>${fmtShortDate(date)}</h2>
        <div class="entries-paper">${sortForExport(byDate.get(date)).map((entry) => memoArticle(entry, {})).join('')}</div>
      </div>`).join('');
    bindMemos($('#results'));
  };
  $('#query').oninput = draw;
  draw();
}

/* ---------- settings ---------- */

const UPDATE_HISTORY = [
  {
    date: '2026/09/25',
    items: [
      '17個の外部パッチをアプリ本体へ統合し、後からDOMを書き換えるMutationObserverを全廃。',
      'カードの枠を外し、日を一枚の紙として読む表示に変更。メモの色分けは余白の小さな点で表示。',
      'PCの入力欄を紙の末尾の「次の一行」に統合。スマホは下部の入力シートを継続。',
      '気分は日付の数字の墨の濃さで表現。日めくりの各日も、書いた文字量に応じた濃淡で表示。',
      '日付送りで紙がめくれる演出、メモを記録した瞬間の朱の印、1か月前・1年前の同じ日を示す栞を追加。',
      '22時以降は紙が行灯の色になる「夜」表示を追加。切り替えは自動・昼・夜の3択。',
      '検索結果を日付ごとの見出しでまとめ、スマホで「メモ」タブが翌日ボタンに重なる崩れなどを修正。',
    ],
  },
  {
    date: '2026/08/10',
    items: [
      '既存メモをクリックしたとき、その場で直接編集できる動線を安定化。',
      '編集中は新規メモ入力欄や他のカードを引っ込め、編集欄を画面いっぱいに近い大きさで表示。',
      '編集中にも本文の文字数がリアルタイムで分かるようにした。',
      'カードの作成・更新日時と同じ列に文字数を表示するよう整理。',
      'メモのタイトルを約20pxに拡大し、本文との区別を少し強めた。',
      '関連メモ機能、振り返り、今日のメモ量ゲージなど、使わない機能を整理・削除。',
      '「その日のコピー」に各メモのタイトルを含めるよう変更。',
      '各メモのカードにも個別コピーボタンを追加。',
      'スマホの下部メニューを横書き・低い高さに変更し、背景と絵文字のトーンを落ち着かせた。',
      '選択中のメニューだけ薄いグレージュ背景にして、現在地が分かるようにした。',
      '設定画面に更新履歴を追加し、過去の主な改修も遡って掲載。',
    ],
  },
  {
    date: '2026/08/09',
    items: [
      '画面内の「ログ」という表記を、基本的に「メモ」へ統一。保存済み本文には手を加えない方式にした。',
      '日付タイトルのプレースホルダーを「8月9日のタイトル」のような形式へ変更。',
      '気分の5段階表示を、選んだ位置まで連続して色が付くメーター表現へ調整。',
      '設定からAI関連パネルを外し、保存先の説明を「データ保存」として整理。',
      'JSON・CSVの出力やJSON取り込みの表記を、実際の操作が分かりやすい言葉へ変更。',
      '端末内のMyDailyLogデータを二重確認して削除できる機能を追加。',
      '日ごとの「整える」を追加。全角英数字・全角スペース・行末空白など、安全な機械的整形だけをまとめて実行できるようにした。',
      '編集画面の見出しや常時ラベルを減らし、空欄のときだけ「題名」「本文」をプレースホルダー表示する形へ簡素化。',
    ],
  },
  {
    date: '2026/08/07',
    items: [
      'その日に書いたメモをMarkdown形式でまとめてコピーできる「この日をコピー」を追加。',
      '日付・時刻・本文をAIや別のノートへ渡しやすい形に整えて出力。',
      '今日だけでなく、日めくりなど過去の日付からも同じコピー操作を使えるようにした。',
      'コピーボタンの見た目をSecondary Actionとして控えめにし、日誌本文を邪魔しない配置へ調整。',
    ],
  },
  {
    date: '2026/07/29',
    items: [
      'メモカードを「後から読み返す」ことを意識した表示へ改修。',
      'カードの不要な並び替えを抑え、表示が勝手に動く感覚を減らした。',
      '作成・更新などのメタ情報とカード操作を整理し、本文を主役にする方向へ調整。',
      '作業メモを閉じているときにも、ショートカットの存在が分かる小さなヒントを追加。',
      'オフライン用キャッシュを更新し、追加したUIがPWAでも反映されるよう調整。',
    ],
  },
  {
    date: '2026/07/22',
    items: [
      '入力途中のメモを自動保存し、画面を離れても下書きを戻せるようにした。',
      '日誌本文とは別に使える「作業メモ」のサイドパネルを追加。',
      '作業メモをすばやく開閉・操作するためのキーボードショートカットを追加。',
      '既存メモをカード上で編集するインライン編集を導入。',
      '画面移動時に編集中状態が残り続けないよう、編集状態のリセット処理を追加。',
      'インライン編集まわりのキャッシュと表示を安定化。',
    ],
  },
  {
    date: '2026/07/10',
    items: [
      'PCでの新規入力欄のレイアウトを調整し、長めの文章を書きやすくした。',
      '複数行で入力した文章を、行ごとに別メモへ分割せず一つのメモとして保存するよう変更。',
      '各メモに任意のタイトルを付けられるようにした。',
      'タイトル付き・複数行メモが公開版でも正しく読み込まれるよう、ランタイム拡張とキャッシュを更新。',
    ],
  },
  {
    date: '2026/07/06',
    items: [
      'My Daily Log / 徒然日記として初版を公開。',
      '日付ごとのメモ、日付タイトル、気分を記録できる基本画面を実装。',
      'カレンダー、全文検索を用意。',
      'データはIndexedDBへローカル保存し、JSONバックアップ／復元、CSV出力に対応。',
      'PWAとしてオフライン利用、ライト／ダークモードに対応。',
      'GitHub Pagesのルートから完成版のdocsアプリへ正しく遷移するよう公開設定を修正。',
    ],
  },
];

async function renderSettings() {
  const settings = Object.fromEntries((await db.all('settings')).map((setting) => [setting.key, setting.value]));
  const lastBackup = settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleString('ja-JP') : 'まだ';
  $('#view').innerHTML = `
    <section class="settings">
      <h1>設定・出力</h1>
      <div class="panel">
        <div class="storage-heading-row">
          <h2>データ保存</h2>
          <button type="button" class="storage-help-toggle" id="storage-help-toggle" aria-expanded="false" aria-controls="data-storage-help">?</button>
        </div>
        <div class="data-storage-help" id="data-storage-help" hidden>
          <p><strong>メモはクラウドには保存されません。</strong> この端末の、このブラウザ内に保存されます。</p>
          <p>保存先はブラウザのサイトデータ（IndexedDB）です。ログインや端末間の自動同期はありません。</p>
          <p>ブラウザのサイトデータを削除したり、端末やブラウザを変えたりすると、メモを引き継げない場合があります。残しておきたいメモは「JSONで出力」で保存してください。</p>
        </div>
        <p>最終JSONバックアップ：<b>${lastBackup}</b></p>
        <button id="export-json">JSONで出力</button>
        <label class="file">JSONを取り込む<input id="import-json" type="file" accept="application/json" /></label>
        <button id="export-csv">CSVで出力</button>
      </div>
      <div class="panel">
        <h2>データ管理</h2>
        <button id="sample-data">サンプルデータを入れてみる</button>
        <p class="storage-clear-note">メモ・日付タイトル・設定・作業メモ・入力途中の下書きを、このブラウザから削除します。</p>
        <button id="clear-device-storage" class="danger">端末ストレージをすべて削除</button>
      </div>
      <div class="panel settings-update-history">
        <h2>更新履歴</h2>
        <p class="update-history-intro">GitHubのコミット履歴をもとに、主な変更をまとめています。新しい変更は上に追加していきます。</p>
        <div class="update-history-list">
          ${UPDATE_HISTORY.map((entry) => `
            <section class="update-history-group">
              <time class="update-history-date">${entry.date}</time>
              <ul>${entry.items.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>
            </section>`).join('')}
        </div>
      </div>
    </section>`;

  const help = $('#data-storage-help');
  const helpToggle = $('#storage-help-toggle');
  helpToggle.onclick = () => {
    const open = help.hidden;
    help.hidden = !open;
    helpToggle.setAttribute('aria-expanded', String(open));
    helpToggle.classList.toggle('is-open', open);
  };
  $('#export-json').onclick = exportJSON;
  $('#export-csv').onclick = exportCSV;
  $('#import-json').onchange = importJSON;
  $('#sample-data').onclick = seedSample;
  $('#clear-device-storage').onclick = clearDeviceStorage;
}

function download(name, body, type = 'application/json') {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([body], { type }));
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function exportJSON() {
  const data = {
    schemaVersion: 2,
    exportedAt: iso(),
    entries: await db.all('entries'),
    days: await db.all('days'),
    settings: (await db.all('settings')).filter((setting) => setting.key !== 'aiKey'),
  };
  download(`mydailylog-backup-${dayKey()}.json`, JSON.stringify(data, null, 2));
  await db.put('settings', { key: 'lastBackupAt', value: iso() });
  toast('バックアップを保存した');
  render();
}

async function exportCSV() {
  const rows = (await db.all('entries')).filter((entry) => !entry.deletedAt);
  const header = ['date', 'time', 'title', 'content', 'importance'];
  const csv = [header.join(','), ...rows.map((entry) => header.map((key) => `"${String(entry[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
  download(`mydailylog-${dayKey()}.csv`, csv, 'text/csv;charset=utf-8');
}

async function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    for (const entry of data.entries || []) await db.put('entries', entry);
    for (const day of data.days || []) await db.put('days', day);
    toast('復元した');
    render();
  } catch {
    alert('JSONを読み込めなかった。バックアップファイルを確認して。');
  }
}

async function clearIndexedDbData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mydailylog');
    request.onerror = () => reject(request.error || new Error('IndexedDBを開けませんでした'));
    request.onsuccess = () => {
      const database = request.result;
      const storeNames = [...database.objectStoreNames];
      if (!storeNames.length) { database.close(); resolve(); return; }
      const transaction = database.transaction(storeNames, 'readwrite');
      storeNames.forEach((name) => transaction.objectStore(name).clear());
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  });
}

function clearOwnedWebStorage(storage) {
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith('mydailylog-')) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}

async function clearDeviceStorage() {
  if (!confirm('このブラウザに保存されているメモ、日付タイトル、設定、作業メモ、入力途中の下書きをすべて削除します。\n\nJSONバックアップとして保存済みのファイルは削除されません。\n\n続けますか？')) return;
  if (!confirm('最終確認です。\n\nこのブラウザ内の徒然日記のデータは元に戻せません。\n「端末ストレージをすべて削除」を実行しますか？')) return;
  try {
    await clearIndexedDbData();
    clearOwnedWebStorage(localStorage);
    clearOwnedWebStorage(sessionStorage);
    alert('このブラウザに保存されていた徒然日記のデータを削除しました。');
    location.reload();
  } catch {
    alert('データをすべて削除できませんでした。ブラウザを再読み込みして、もう一度試してください。');
  }
}

async function seedSample() {
  const sample = [
    { offset: -3, content: '面接の想定問答を整理した。少し寝不足' },
    { offset: -2, content: 'カフェで1,100円。面接の練習をした' },
    { offset: -1, content: 'チョコザップ行った。20分だけでも気分転換' },
    { offset: 0, content: 'オズマPRの面接' },
    { offset: 0, content: '面接後はかなり疲れた。振り返りメモを残す' },
    { offset: 1, content: 'ゼルダ：空Nは着地隙がある。振りすぎ注意' },
    { offset: 2, content: '昼：そば 850円' },
  ];
  for (const item of sample) {
    const date = addDays(state.date, item.offset);
    const parsed = parseEntry(item.content);
    await db.put('entries', {
      id: uid(), date, time: parsed.time, title: '', content: item.content,
      type: 'memo', amount: null, unit: null, tags: [], importance: parsed.importance,
      pinned: false, pinnedAt: null, favorite: false, favoriteAt: null, cardColor: 'default',
      metadata: {}, createdAt: iso(), updatedAt: iso(), deletedAt: null,
    });
  }
  await saveDay({ ...(await getDay(state.date)), title: '面接と振り返りの日' });
  toast('サンプルを追加した');
  render();
}

/* ---------- side memo drawer (draft-sidepanel + memo-shortcuts) ---------- */

function sideMemoStorageKey() {
  return `mydailylog-composer-draft:${state.date}`;
}

function isTodayRoute() { return state.route === 'today'; }

function ensureSideMemoDom() {
  if ($('#side-memo-panel')) return;
  const wide = window.matchMedia('(min-width: 1440px)').matches;
  const wantOpen = ls.get(SIDE_MEMO_OPEN_KEY, wide);
  const saved = ls.get(SIDE_MEMO_KEY, { text: '' });

  const backdrop = document.createElement('button');
  backdrop.id = 'side-memo-backdrop';
  backdrop.className = 'side-memo-backdrop';
  backdrop.type = 'button';
  backdrop.setAttribute('aria-label', 'メモを閉じる');

  const toggle = document.createElement('button');
  toggle.id = 'side-memo-toggle';
  toggle.className = 'side-memo-toggle';
  toggle.type = 'button';
  toggle.dataset.sideMemoToggle = '1';
  toggle.innerHTML = '<span aria-hidden="true">✎</span><b>メモ</b>';

  const panel = document.createElement('aside');
  panel.id = 'side-memo-panel';
  panel.className = 'side-memo-panel';
  panel.setAttribute('aria-label', '作業メモ');
  panel.innerHTML = `
    <header class="side-memo-header">
      <div>
        <p>PARALLEL NOTE</p>
        <h2>作業メモ</h2>
        <span>日誌とは別に、自動保存</span>
        <span class="side-memo-shortcut">Alt + ← 開く　/　Alt + → 閉じる</span>
      </div>
      <button id="side-memo-close" type="button" aria-label="メモを閉じる">×</button>
    </header>
    <textarea id="side-memo-text" placeholder="日誌に入れる前の断片、調べたいこと、あとで整理するメモ…"></textarea>
    <footer class="side-memo-footer">
      <span id="side-memo-status" aria-live="polite">保存済み</span>
      <button id="side-memo-clear" type="button">消去</button>
    </footer>`;
  document.body.append(backdrop, toggle, panel);

  const textarea = $('#side-memo-text', panel);
  const status = $('#side-memo-status', panel);
  textarea.value = saved?.text || '';

  const setOpen = (open, persist = true) => {
    const show = Boolean(open) && isTodayRoute();
    document.body.classList.toggle('side-memo-open', show);
    panel.classList.toggle('is-open', show);
    backdrop.classList.toggle('is-open', show);
    toggle.setAttribute('aria-expanded', String(show));
    if (persist) ls.set(SIDE_MEMO_OPEN_KEY, Boolean(open));
    if (show) setTimeout(() => textarea.focus({ preventScroll: true }), 80);
  };
  panel.__setOpen = setOpen;

  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  backdrop.addEventListener('click', () => setOpen(false));
  $('#side-memo-close', panel).addEventListener('click', () => setOpen(false));
  textarea.addEventListener('input', () => {
    status.textContent = '保存中…';
    clearTimeout(sideMemoSaveTimer);
    sideMemoSaveTimer = setTimeout(() => {
      ls.set(SIDE_MEMO_KEY, { text: textarea.value, updatedAt: iso() });
      status.textContent = '保存済み';
    }, 180);
  });
  textarea.addEventListener('blur', () => {
    clearTimeout(sideMemoSaveTimer);
    ls.set(SIDE_MEMO_KEY, { text: textarea.value, updatedAt: iso() });
    status.textContent = '保存済み';
  });
  $('#side-memo-clear', panel).addEventListener('click', () => {
    if (!textarea.value || confirm('作業メモを空にしますか？')) {
      textarea.value = '';
      ls.remove(SIDE_MEMO_KEY);
      status.textContent = '消去した';
      textarea.focus();
    }
  });

  setOpen(wantOpen, false);
}

function syncSideMemoVisibility() {
  ensureSideMemoDom();
  const panel = $('#side-memo-panel');
  const toggle = $('#side-memo-toggle');
  const backdrop = $('#side-memo-backdrop');
  const show = isTodayRoute();
  toggle.hidden = !show;
  panel.hidden = !show;
  backdrop.hidden = !show;
  if (show) panel.__setOpen(ls.get(SIDE_MEMO_OPEN_KEY, false), false);
  else panel.__setOpen(false, false);

  $$('[data-side-memo-toggle]').forEach((button) => {
    if (button.id === 'side-memo-toggle') return;
    button.onclick = () => toggle.click();
  });
}

document.addEventListener('keydown', (event) => {
  if (event.isComposing || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || !isTodayRoute()) return;
  const panel = $('#side-memo-panel');
  if (!panel) return;
  event.preventDefault();
  if (event.key === 'ArrowLeft' && !panel.classList.contains('is-open')) panel.__setOpen(true);
  if (event.key === 'ArrowRight' && panel.classList.contains('is-open')) panel.__setOpen(false);
});

window.addEventListener('pagehide', () => {
  const composer = $('#composer');
  if (composer && composer.value.trim()) ls.set(`${DRAFT_PREFIX}${state.date}`, { title: $('#composer-title')?.value || '', text: composer.value, updatedAt: iso() });
  const sideText = $('#side-memo-text');
  if (sideText) ls.set(SIDE_MEMO_KEY, { text: sideText.value, updatedAt: iso() });
});

/* ---------- boot ---------- */

applyPaperMode();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
window.addEventListener('hashchange', () => {
  const next = getInitialRoute();
  if (next !== state.route) {
    state.route = next;
    state.editingId = null;
    render();
  }
});
render();
