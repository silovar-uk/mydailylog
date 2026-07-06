import './style.css';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const TYPES = {
  memo: ['📝', 'メモ'],
  meal: ['🍜', '食事'],
  expense: ['💴', '支出'],
  exercise: ['🏋️', '運動'],
  learning: ['📚', '学び'],
  game: ['🎮', 'ゲーム'],
  work: ['💼', '仕事'],
  reading: ['📖', '読書'],
  condition: ['🫧', '体調'],
  habit: ['✅', '習慣'],
  event: ['⭐', '特大イベント'],
  idea: ['💡', 'アイデア'],
  task: ['☑️', 'タスク'],
};

const QUICK = [
  ['🏋️', 'チョコザップ', 'exercise', 'チョコザップに行った'],
  ['💴', '支出', 'expense', ''],
  ['🍜', '食事', 'meal', ''],
  ['🎮', '学び', 'learning', ''],
  ['⭐', '特大', 'event', ''],
];

const ROUTE_COPY = {
  today: '今日を残す',
  calendar: '日を眺める',
  review: 'ふり返る',
  search: '探す',
  settings: '整える',
};

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
const icon = (type) => TYPES[type]?.[0] || '🏷️';
const label = (type) => TYPES[type]?.[1] || type;
const escapeHtml = (text = '') => String(text).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
}[char]));
const formatMoney = (amount) => amount === null || amount === undefined || amount === ''
  ? '' : `¥${Number(amount).toLocaleString('ja-JP')}`;
const importanceLabel = (importance) => ({ 0: '通常', 1: '大事', 2: '特大イベント' }[importance] || '通常');

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
  detailEntryId: null,
  eventContextId: null,
  reviewTab: 'summary',
};

function parseEntry(raw) {
  const content = raw.trim();
  let type = 'memo';
  let amount = null;
  let unit = null;
  let importance = 0;
  const tags = [];
  const yen = content.match(/(?:¥|￥|\b)([\d,]+)\s*円?|([\d,]+)円/);

  if (yen) {
    amount = Number((yen[1] || yen[2]).replace(/,/g, ''));
    unit = 'JPY';
    type = 'expense';
    tags.push('支出');
  }
  if (/チョコザップ|ジム|筋トレ|運動|歩いた|散歩|ストレッチ/.test(content)) {
    type = 'exercise';
    tags.push('運動');
  }
  if (/昼|朝|夜|食べ|ごはん|飯|ラーメン|そば|カフェ|コーヒー|自炊|外食/.test(content)) {
    if (!amount) type = 'meal';
    tags.push('食事');
  }
  if (/ゼルダ|スマブラ|ゲーム|SF6|スト6|将棋/.test(content)) {
    type = 'game';
    tags.push('ゲーム');
  }
  if (/読んだ|読書|ページ|本/.test(content)) {
    type = 'reading';
    tags.push('読書');
  }
  if (/眠い|寝不足|体調|疲れ|だるい|頭痛/.test(content)) {
    type = 'condition';
    tags.push('体調');
  }
  if (/特大|面接|会見|旅行|遠征|開幕|発表|引っ越し/.test(content)) {
    type = 'event';
    importance = 2;
    tags.push('イベント');
  }
  const time = (content.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/) || [])[0] || null;
  return { type, amount, unit, importance, tags: [...new Set(tags)], time };
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

function setRoute(route) {
  state.route = route;
  state.detailEntryId = null;
  state.eventContextId = null;
  state.reviewTab = route === 'review' ? state.reviewTab : 'summary';
  if (location.hash !== `#/${route}`) location.hash = `#/${route}`;
  render();
}

async function render() {
  $$('.modal-backdrop').forEach((modal) => modal.remove());
  const route = state.route;
  app().innerHTML = `
    <main class="shell">
      <header class="top">
        <div>
          <div class="brand">日々の棚</div>
          <div class="sub">${ROUTE_COPY[route]}</div>
        </div>
        <button class="theme" aria-label="テーマを切り替える" title="テーマを切り替える">◐</button>
      </header>
      <section id="view"></section>
      <nav class="nav" aria-label="メインメニュー">
        ${Object.entries({ today: '今日', calendar: 'カレンダー', review: '振り返り', search: '検索', settings: '設定' })
    .map(([key, text]) => `<button data-route="${key}" class="${route === key ? 'active' : ''}">${text}</button>`).join('')}
      </nav>
    </main>
    <div id="toast" aria-live="polite"></div>`;

  $$('[data-route]').forEach((button) => { button.onclick = () => setRoute(button.dataset.route); });
  $('.theme').onclick = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('mydailylog-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  };

  if (route === 'today') await renderToday();
  if (route === 'calendar') await renderCalendar();
  if (route === 'review') await renderReview();
  if (route === 'search') await renderSearch();
  if (route === 'settings') await renderSettings();
  if (state.detailEntryId) await renderEntryDetail(state.detailEntryId);
  if (state.eventContextId) await renderEventContext(state.eventContextId);
  if (state.toast) showToast(state.toast);
}

async function renderToday() {
  const date = state.date;
  const day = await getDay(date);
  const entries = (await db.byDate(date)).sort((a, b) => (b.time || b.createdAt).localeCompare(a.time || a.createdAt));
  $('#view').innerHTML = `
    <section class="dayhead">
      <div class="date-row">
        <button id="prev" aria-label="前の日">‹</button>
        <h1>${fmtDate(date)}</h1>
        <button id="next" aria-label="次の日">›</button>
      </div>
      <input id="daytitle" placeholder="この日のタイトル" value="${escapeHtml(day.title)}" aria-label="この日のタイトル" />
      <div class="mood-row">
        <span>気分</span>
        <div class="moods" aria-label="気分を選ぶ">
          ${[1, 2, 3, 4, 5].map((score) => `<button data-mood="${score}" class="${day.mood === score ? 'on' : ''}" aria-label="気分 ${score}">●</button>`).join('')}
        </div>
      </div>
      <div class="obi" aria-label="今日のログ量"><i style="width:${Math.min(100, entries.length * 12)}%"></i></div>
    </section>
    <section class="quick" aria-label="クイック入力">
      ${QUICK.map(([emoji, text, type, content]) => `<button data-quick="${type}" data-content="${escapeHtml(content)}">${emoji} ${text}</button>`).join('')}
    </section>
    <section class="entries">
      ${entries.length ? entries.map((entry) => entryCard(entry)).join('') : '<div class="empty">まだログがない。下の欄から、今日の断片を残そう。</div>'}
    </section>
    <section class="carry-over">
      <label for="carryover">明日へ持ち越すこと</label>
      <textarea id="carryover" placeholder="明日思い出したいことを、ひとことだけ">${escapeHtml(day.carryOver || '')}</textarea>
    </section>
    <section class="composer" aria-label="新しいログを追加">
      <textarea id="composer" placeholder="今日のログを書く…&#10;例：昼：そば 850円 / チョコザップ行った"></textarea>
      <button id="send" aria-label="ログを追加">↑</button>
    </section>`;

  $('#prev').onclick = () => { state.date = addDays(date, -1); render(); };
  $('#next').onclick = () => { state.date = addDays(date, 1); render(); };
  $('#daytitle').addEventListener('input', async (event) => { day.title = event.target.value; await saveDay(day); });
  $('#carryover').addEventListener('input', async (event) => { day.carryOver = event.target.value; await saveDay(day); });
  $$('[data-mood]').forEach((button) => {
    button.onclick = async () => { day.mood = Number(button.dataset.mood); await saveDay(day); render(); };
  });
  $('#send').onclick = saveComposer;
  $('#composer').addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') saveComposer();
  });
  $$('[data-quick]').forEach((button) => {
    button.onclick = () => quickAdd(button.dataset.quick, button.dataset.content);
  });
  bindCards();
}

function entryCard(entry, options = {}) {
  const { context = false } = options;
  const hasAmount = entry.amount !== null && entry.amount !== undefined && entry.amount !== '';
  const priority = entry.importance > 0
    ? `<span class="priority priority-${entry.importance}">${importanceLabel(entry.importance)}</span>` : '';
  const suggestion = entry.suggestion ? `
    <div class="suggest">
      候補：${icon(entry.suggestion.type)} ${label(entry.suggestion.type)}
      ${entry.suggestion.amount ? ` ${formatMoney(entry.suggestion.amount)}` : ''}
      <button data-apply="${entry.id}">適用</button>
    </div>` : '';
  return `
    <article class="card ${entry.importance === 2 ? 'is-major' : ''}">
      <button class="entry-open" data-open="${entry.id}" aria-label="${escapeHtml(entry.content)} を編集">
        <span class="entry-icon">${icon(entry.type)}</span>
        <span class="entry-body">
          <span class="entry-content">${escapeHtml(entry.content)}</span>
          <span class="meta">
            ${entry.time || ''}${hasAmount ? ` ${entry.unit === 'JPY' ? formatMoney(entry.amount) : `${entry.amount} ${entry.unit || ''}`}` : ''}
            ${entry.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}
          </span>
        </span>
        ${priority}
      </button>
      <button class="delete" data-delete="${entry.id}" aria-label="このログを削除">×</button>
      ${context ? `<button class="context-day" data-context-day="${entry.date}">この日を開く</button>` : ''}
      ${suggestion}
    </article>`;
}

function bindCards(parent = document, options = {}) {
  $$('[data-open]', parent).forEach((button) => {
    button.onclick = () => {
      if (options.closeEventContext) state.eventContextId = null;
      state.detailEntryId = button.dataset.open;
      render();
    };
  });
  $$('[data-delete]', parent).forEach((button) => {
    button.onclick = () => softDelete(button.dataset.delete);
  });
  $$('[data-apply]', parent).forEach((button) => { button.onclick = applySuggestion; });
  $$('[data-context-day]', parent).forEach((button) => {
    button.onclick = () => {
      state.date = button.dataset.contextDay;
      state.eventContextId = null;
      setRoute('today');
    };
  });
}

async function saveComposer() {
  const input = $('#composer');
  const raw = input.value.trim();
  if (!raw) return;
  const rows = raw.split('\n').map((row) => row.trim()).filter(Boolean);
  for (const content of rows) {
    const parsed = parseEntry(content);
    const entry = {
      id: uid(), date: state.date, time: parsed.time, content,
      type: 'memo', amount: null, unit: null, tags: [],
      importance: parsed.importance, metadata: {}, createdAt: iso(), updatedAt: iso(), deletedAt: null,
      suggestion: parsed.type !== 'memo' || parsed.amount !== null ? parsed : null,
    };
    await db.put('entries', entry);
  }
  input.value = '';
  render();
}

async function applySuggestion(event) {
  const entry = await db.get('entries', event.currentTarget.dataset.apply);
  if (!entry?.suggestion) return;
  Object.assign(entry, entry.suggestion, { suggestion: null, updatedAt: iso() });
  await db.put('entries', entry);
  render();
}

async function quickAdd(type, content) {
  const needsDetail = !content;
  const entry = {
    id: uid(), date: state.date, time: new Date().toTimeString().slice(0, 5),
    content: content || (type === 'event' ? '特大イベント' : `${label(type)}を記録`),
    type, amount: null, unit: null, tags: [label(type)],
    importance: type === 'event' ? 2 : 0,
    metadata: {}, createdAt: iso(), updatedAt: iso(), deletedAt: null,
  };
  await db.put('entries', entry);
  if (needsDetail) {
    state.detailEntryId = entry.id;
  } else {
    toast('記録した');
  }
  render();
}

async function softDelete(id) {
  const entry = await db.get('entries', id);
  if (!entry) return;
  entry.deletedAt = iso();
  await db.put('entries', entry);
  state.detailEntryId = null;
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

async function renderEntryDetail(id) {
  const entry = await db.get('entries', id);
  if (!entry || entry.deletedAt) {
    state.detailEntryId = null;
    return;
  }
  const root = document.createElement('div');
  root.className = 'modal-backdrop';
  root.id = 'detail-modal';
  root.innerHTML = `
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <header class="modal-header">
        <div>
          <p class="eyebrow">ログを整える</p>
          <h2 id="detail-title">${entry.importance === 2 ? '特大イベント' : 'ログの詳細'}</h2>
        </div>
        <button id="close-detail" class="close-modal" aria-label="編集を閉じる">×</button>
      </header>
      <form id="detail-form">
        <div class="form-grid two">
          <label>日付<input id="entry-date" type="date" value="${escapeHtml(entry.date)}" /></label>
          <label>時刻<input id="entry-time" type="time" value="${escapeHtml(entry.time || '')}" /></label>
        </div>
        <label>本文<textarea id="entry-content" rows="4" required>${escapeHtml(entry.content)}</textarea></label>
        <div class="form-grid two">
          <label>種類<select id="entry-type">
            ${Object.entries(TYPES).map(([type, [, typeLabel]]) => `<option value="${type}" ${entry.type === type ? 'selected' : ''}>${typeLabel}</option>`).join('')}
          </select></label>
          <label>重要度<select id="entry-importance">
            <option value="0" ${entry.importance === 0 ? 'selected' : ''}>通常</option>
            <option value="1" ${entry.importance === 1 ? 'selected' : ''}>大事</option>
            <option value="2" ${entry.importance === 2 ? 'selected' : ''}>特大イベント</option>
          </select></label>
        </div>
        <div class="form-grid money-grid">
          <label>数値<input id="entry-amount" type="number" inputmode="decimal" placeholder="850" value="${entry.amount ?? ''}" /></label>
          <label>単位<input id="entry-unit" list="unit-options" placeholder="JPY / min / 回" value="${escapeHtml(entry.unit || '')}" /></label>
          <datalist id="unit-options"><option value="JPY"></option><option value="min"></option><option value="回"></option><option value="kg"></option><option value="page"></option></datalist>
        </div>
        <label>タグ <span class="label-note">スペースまたは # で区切る</span>
          <input id="entry-tags" placeholder="食事 外食" value="${escapeHtml(entry.tags.join(' '))}" />
        </label>
        <p class="autosave" id="autosave-state">変更は自動保存</p>
      </form>
      <footer class="modal-footer">
        <button id="open-entry-day" class="secondary">この日を開く</button>
        <button id="delete-entry" class="danger-outline">削除</button>
      </footer>
    </section>`;
  document.body.append(root);

  let saveTimer;
  let saving = false;
  const form = $('#detail-form', root);
  const status = $('#autosave-state', root);
  const collect = () => ({
    ...entry,
    date: $('#entry-date', root).value || entry.date,
    time: $('#entry-time', root).value || null,
    content: $('#entry-content', root).value.trim() || entry.content,
    type: $('#entry-type', root).value,
    importance: Number($('#entry-importance', root).value),
    amount: $('#entry-amount', root).value === '' ? null : Number($('#entry-amount', root).value),
    unit: $('#entry-unit', root).value.trim() || null,
    tags: $('#entry-tags', root).value.split(/[\s#]+/).map((tag) => tag.trim()).filter(Boolean),
    suggestion: null,
    updatedAt: iso(),
  });
  const persist = async () => {
    clearTimeout(saveTimer);
    saving = true;
    status.textContent = '保存中…';
    Object.assign(entry, collect());
    await db.put('entries', entry);
    saving = false;
    status.textContent = '保存済み';
  };
  const scheduleSave = () => {
    status.textContent = '変更あり';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 350);
  };
  $$('input, textarea, select', form).forEach((input) => {
    input.addEventListener('input', scheduleSave);
    input.addEventListener('change', scheduleSave);
  });
  const escapeClose = (event) => {
    if (event.key === 'Escape' && document.body.contains(root)) close();
  };
  const close = async () => {
    document.removeEventListener('keydown', escapeClose);
    root.remove();
    await persist();
    state.detailEntryId = null;
    render();
  };
  $('#close-detail', root).onclick = close;
  root.addEventListener('click', (event) => { if (event.target === root) close(); });
  $('#open-entry-day', root).onclick = async () => {
    await persist();
    state.date = entry.date;
    state.detailEntryId = null;
    setRoute('today');
  };
  $('#delete-entry', root).onclick = () => softDelete(entry.id);
  document.addEventListener('keydown', escapeClose);
  $('#entry-content', root).focus();
}

async function renderCalendar() {
  const active = new Date(`${state.date}T12:00:00`);
  const first = new Date(active.getFullYear(), active.getMonth(), 1);
  const last = new Date(active.getFullYear(), active.getMonth() + 1, 0);
  const [entries, days] = await Promise.all([db.all('entries'), db.all('days')]);
  const dayMap = Object.fromEntries(days.map((day) => [day.date, day]));
  const activeEntries = entries.filter((entry) => !entry.deletedAt);
  $('#view').innerHTML = `
    <section class="calendar">
      <div class="calhead"><button id="previous-month" aria-label="前月">‹</button><h1>${active.getFullYear()}年${active.getMonth() + 1}月</h1><button id="next-month" aria-label="次月">›</button></div>
      <div class="week">${['日', '月', '火', '水', '木', '金', '土'].map((day) => `<span>${day}</span>`).join('')}</div>
      <div class="grid">
        ${Array(first.getDay()).fill('<i></i>').join('')}
        ${Array.from({ length: last.getDate() }, (_, index) => {
    const date = dayKey(new Date(active.getFullYear(), active.getMonth(), index + 1));
    const logs = activeEntries.filter((entry) => entry.date === date);
    const major = logs.some((entry) => entry.importance === 2 || entry.type === 'event');
    const mood = dayMap[date]?.mood || '';
    return `<button data-date="${date}" class="calday mood-${mood}" aria-label="${fmtShortDate(date)}、ログ ${logs.length} 件">
      <b>${index + 1}</b>${major ? '<span class="star">★</span>' : ''}<em style="height:${Math.min(34, logs.length * 5)}px"></em>${logs.length ? `<small>${logs.length}</small>` : ''}
    </button>`;
  }).join('')}
      </div>
    </section>`;
  $('#previous-month').onclick = () => { state.date = dayKey(new Date(active.getFullYear(), active.getMonth() - 1, 1)); render(); };
  $('#next-month').onclick = () => { state.date = dayKey(new Date(active.getFullYear(), active.getMonth() + 1, 1)); render(); };
  $$('[data-date]').forEach((button) => {
    button.onclick = () => { state.date = button.dataset.date; setRoute('today'); };
  });
}

async function renderReview() {
  const entries = (await db.all('entries')).filter((entry) => !entry.deletedAt);
  const month = state.date.slice(0, 7);
  const monthly = entries.filter((entry) => entry.date.startsWith(month));
  const totalExpense = monthly.filter((entry) => entry.unit === 'JPY' || entry.type === 'expense')
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const gym = monthly.filter((entry) => entry.type === 'exercise' && /チョコザップ/.test(entry.content)).length;
  const byType = Object.keys(TYPES).map((type) => [type, monthly.filter((entry) => entry.type === type).length]).filter(([, count]) => count);
  const events = entries.filter((entry) => entry.importance === 2 || entry.type === 'event')
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const summaryContent = `
    <div class="stats">
      <div><b>${formatMoney(totalExpense)}</b><span>支出</span></div>
      <div><b>${gym}回</b><span>チョコザップ</span></div>
      <div><b>${monthly.length}</b><span>ログ</span></div>
    </div>
    <h2>テーマ別</h2>
    ${byType.length ? byType.map(([type, count]) => `<div class="barrow"><span>${icon(type)} ${label(type)}</span><div><i style="width:${Math.max(8, (count / (monthly.length || 1)) * 100)}%"></i></div><b>${count}</b></div>`).join('') : '<div class="empty">今月のログがまだない。</div>'}`;
  const eventContent = events.length ? `
    <p class="section-copy">特大イベントを開くと、前後3日のログを一続きで読める。</p>
    <div class="event-list">
      ${events.map((entry) => `<article class="event-card">
        <div class="event-date">${fmtShortDate(entry.date)}</div>
        <button data-event-context="${entry.id}">
          <span>${icon(entry.type)}</span><strong>${escapeHtml(entry.content)}</strong><small>${entry.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ') || '前後3日を見る'}</small>
        </button>
      </article>`).join('')}
    </div>` : '<div class="empty">特大イベントはまだない。ログ詳細から「特大イベント」を選ぶとここに並ぶ。</div>';
  $('#view').innerHTML = `
    <section class="review">
      <h1>${month.replace('-', '年')}月の振り返り</h1>
      <div class="review-tabs" role="tablist">
        <button data-review-tab="summary" class="${state.reviewTab === 'summary' ? 'active' : ''}">集計</button>
        <button data-review-tab="events" class="${state.reviewTab === 'events' ? 'active' : ''}">イベント</button>
      </div>
      <div class="review-content">${state.reviewTab === 'summary' ? summaryContent : eventContent}</div>
    </section>`;
  $$('[data-review-tab]').forEach((button) => {
    button.onclick = () => { state.reviewTab = button.dataset.reviewTab; render(); };
  });
  $$('[data-event-context]').forEach((button) => {
    button.onclick = () => { state.eventContextId = button.dataset.eventContext; render(); };
  });
}

async function renderEventContext(id) {
  const event = await db.get('entries', id);
  if (!event || event.deletedAt) {
    state.eventContextId = null;
    return;
  }
  const dates = Array.from({ length: 7 }, (_, index) => addDays(event.date, index - 3));
  const groups = await Promise.all(dates.map(async (date) => ({
    date,
    day: await getDay(date),
    entries: (await db.byDate(date)).sort((a, b) => (a.time || a.createdAt).localeCompare(b.time || b.createdAt)),
  })));
  const root = document.createElement('div');
  root.className = 'modal-backdrop context-backdrop';
  root.id = 'event-context-modal';
  root.innerHTML = `
    <section class="modal context-modal" role="dialog" aria-modal="true" aria-labelledby="context-title">
      <header class="modal-header">
        <div>
          <p class="eyebrow">前後3日の記録</p>
          <h2 id="context-title">${escapeHtml(event.content)}</h2>
          <p class="context-sub">${fmtShortDate(event.date)} を中心に読む</p>
        </div>
        <button id="close-context" class="close-modal" aria-label="イベント表示を閉じる">×</button>
      </header>
      <div class="context-timeline">
        ${groups.map(({ date, day, entries }) => `
          <section class="context-day ${date === event.date ? 'is-event-day' : ''}">
            <button data-context-day="${date}" class="context-day-title">
              <span>${fmtShortDate(date)}${date === event.date ? '　イベント当日' : ''}</span>
              <strong>${escapeHtml(day.title || 'タイトルなし')}</strong>
            </button>
            <div class="context-entries">${entries.length ? entries.map((entry) => entryCard(entry, { context: true })).join('') : '<p class="context-empty">ログなし</p>'}</div>
          </section>`).join('')}
      </div>
    </section>`;
  document.body.append(root);
  const escapeClose = (eventKey) => {
    if (eventKey.key === 'Escape' && document.body.contains(root)) close();
  };
  const close = () => {
    document.removeEventListener('keydown', escapeClose);
    root.remove();
    state.eventContextId = null;
    render();
  };
  $('#close-context', root).onclick = close;
  root.addEventListener('click', (eventTarget) => { if (eventTarget.target === root) close(); });
  bindCards(root, { closeEventContext: true });
  document.addEventListener('keydown', escapeClose);
}

async function renderSearch() {
  const entries = (await db.all('entries')).filter((entry) => !entry.deletedAt);
  $('#view').innerHTML = `
    <section class="search">
      <h1>ログを探す</h1>
      <input id="query" placeholder="例：ゼルダ / チョコザップ / 850円" value="${escapeHtml(state.query)}" />
      <div id="results"></div>
    </section>`;
  const draw = () => {
    const query = $('#query').value.toLowerCase().trim();
    state.query = query;
    const results = query ? entries.filter((entry) => [entry.content, entry.type, ...entry.tags, String(entry.amount ?? '')]
      .join(' ').toLowerCase().includes(query)) : entries.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
    $('#results').innerHTML = results.length ? results.map((entry) => entryCard(entry)).join('') : '<div class="empty">見つからなかった。</div>';
    bindCards($('#results'));
  };
  $('#query').oninput = draw;
  draw();
}

async function renderSettings() {
  const settings = Object.fromEntries((await db.all('settings')).map((setting) => [setting.key, setting.value]));
  const lastBackup = settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleString('ja-JP') : 'まだ';
  const persistent = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
  $('#view').innerHTML = `
    <section class="settings">
      <h1>設定・出力</h1>
      <div class="panel">
        <h2>データの安心</h2>
        <p>最終バックアップ：<b>${lastBackup}</b></p>
        <p>端末ストレージ：<b>${persistent ? '保護を要求済み' : '通常保存'}</b></p>
        <button id="request-storage">この端末で保存を保護</button>
        <button id="export-json">JSONをバックアップ</button>
        <label class="file">JSONを復元<input id="import-json" type="file" accept="application/json" /></label>
        <button id="export-csv">CSVを書き出す</button>
      </div>
      <div class="panel">
        <h2>データ管理</h2>
        <button id="sample-data">サンプルデータを入れる</button>
        <button id="clear-data" class="danger">すべて削除</button>
      </div>
      <div class="panel">
        <h2>AI</h2>
        <p>現時点では、金額・時刻・既知キーワードを使った分類提案のみ。APIキーを使うAI整形・日次要約は次の段階で追加する。</p>
      </div>
    </section>`;
  $('#request-storage').onclick = async () => {
    const granted = navigator.storage?.persist ? await navigator.storage.persist() : false;
    toast(granted ? '保存を保護するよう依頼した' : 'このブラウザでは保護を設定できなかった');
    render();
  };
  $('#export-json').onclick = exportJSON;
  $('#export-csv').onclick = exportCSV;
  $('#import-json').onchange = importJSON;
  $('#sample-data').onclick = seedSample;
  $('#clear-data').onclick = clearData;
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
  const header = ['date', 'time', 'type', 'content', 'amount', 'unit', 'tags', 'importance'];
  const csv = [header.join(','), ...rows.map((entry) => header.map((key) => `"${String(key === 'tags' ? entry[key].join('|') : entry[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
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

async function clearData() {
  if (!confirm('すべてのログと日付タイトルを削除します。戻せません。')) return;
  for (const store of ['entries', 'days']) {
    const rows = await db.all(store);
    for (const row of rows) await db.delete(store, store === 'entries' ? row.id : row.date);
  }
  toast('全データを削除した');
  render();
}

async function seedSample() {
  const sample = [
    { offset: -3, content: '面接の想定問答を整理した。少し寝不足', type: 'work', tags: ['仕事', '面接準備'] },
    { offset: -2, content: 'カフェで1,100円。面接の練習をした', type: 'expense', amount: 1100, unit: 'JPY', tags: ['支出', 'カフェ'] },
    { offset: -1, content: 'チョコザップ行った。20分だけでも気分転換', type: 'exercise', tags: ['運動'] },
    { offset: 0, content: 'オズマPRの面接', type: 'event', importance: 2, tags: ['イベント', '面接'] },
    { offset: 0, content: '面接後はかなり疲れた。振り返りメモを残す', type: 'condition', tags: ['体調', '振り返り'] },
    { offset: 1, content: 'ゼルダ：空Nは着地隙がある。振りすぎ注意', type: 'game', tags: ['ゲーム', 'ゼルダ'] },
    { offset: 2, content: '昼：そば 850円', type: 'expense', amount: 850, unit: 'JPY', tags: ['食事', '支出'] },
  ];
  for (const item of sample) {
    const date = addDays(state.date, item.offset);
    await db.put('entries', {
      id: uid(), date, time: null, content: item.content, type: item.type,
      amount: item.amount ?? null, unit: item.unit ?? null, tags: item.tags,
      importance: item.importance ?? 0, metadata: {}, createdAt: iso(), updatedAt: iso(), deletedAt: null,
    });
  }
  await saveDay({ ...(await getDay(state.date)), title: '面接と振り返りの日' });
  toast('サンプルを追加した');
  render();
}

if (localStorage.getItem('mydailylog-theme') === 'dark') document.documentElement.classList.add('dark');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
window.addEventListener('hashchange', () => {
  const next = getInitialRoute();
  if (next !== state.route) {
    state.route = next;
    state.detailEntryId = null;
    state.eventContextId = null;
    render();
  }
});
render();
