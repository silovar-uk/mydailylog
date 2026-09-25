const DB_NAME = 'mydailylog';
const DB_VERSION = 1;
const RECENT_LIMIT = 5;

let recentIds = [];
let currentEntry = null;
let lastTrigger = null;

function tokyoDayKey(date = new Date()) {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

function randomIndex(length) {
  if (length <= 1) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] % length;
  }
  return Math.floor(Math.random() * length);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('entries')) {
        const entries = database.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('date', 'date');
      }
      if (!database.objectStoreNames.contains('days')) database.createObjectStore('days', { keyPath: 'date' });
      if (!database.objectStoreNames.contains('settings')) database.createObjectStore('settings', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function allEntries() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction('entries').objectStore('entries').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function drawEntry() {
  const today = tokyoDayKey();
  const entries = (await allEntries()).filter((entry) => {
    if (!entry || entry.deletedAt || !entry.date || entry.date >= today) return false;
    return String(entry.title || '').trim() || String(entry.content || '').trim();
  });

  if (!entries.length) return null;

  let pool = entries.filter((entry) => !recentIds.includes(entry.id));
  if (!pool.length) {
    recentIds = [];
    pool = entries;
  }

  const byDate = new Map();
  pool.forEach((entry) => {
    if (!byDate.has(entry.date)) byDate.set(entry.date, []);
    byDate.get(entry.date).push(entry);
  });

  const dates = [...byDate.keys()];
  const pickedDate = dates[randomIndex(dates.length)];
  const dateEntries = byDate.get(pickedDate);
  const entry = dateEntries[randomIndex(dateEntries.length)];

  recentIds = [entry.id, ...recentIds.filter((id) => id !== entry.id)].slice(0, RECENT_LIMIT);
  return entry;
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(dateKey + 'T12:00:00+09:00'));
}

function distanceFromToday(dateKey) {
  const today = new Date(tokyoDayKey() + 'T12:00:00+09:00');
  const target = new Date(dateKey + 'T12:00:00+09:00');
  const days = Math.max(1, Math.round((today - target) / 86400000));
  return days === 1 ? '昨日' : days + '日前';
}

function mountRoot() {
  let root = document.getElementById('random-draw-root');
  if (root) return root;

  root = document.createElement('div');
  root.id = 'random-draw-root';
  root.hidden = true;
  root.innerHTML = [
    '<div class="random-draw-backdrop">',
      '<section class="random-draw-sheet" role="dialog" aria-modal="true" aria-labelledby="random-draw-heading">',
        '<button type="button" class="random-draw-close" aria-label="閉じる">×</button>',
        '<p class="random-draw-kicker">過去の自分から一枚</p>',
        '<div class="random-draw-paper">',
          '<span class="random-draw-stamp" aria-hidden="true">再</span>',
          '<div class="random-draw-meta">',
            '<time class="random-draw-date"></time>',
            '<span class="random-draw-distance"></span>',
          '</div>',
          '<div class="random-draw-favorite" hidden>★ お気に入り</div>',
          '<h2 id="random-draw-heading" class="random-draw-title"></h2>',
          '<p class="random-draw-content"></p>',
        '</div>',
        '<div class="random-draw-actions">',
          '<button type="button" class="random-draw-open-day">この日を開く</button>',
          '<button type="button" class="random-draw-again">もう一枚</button>',
        '</div>',
      '</section>',
    '</div>',
  ].join('');
  document.body.appendChild(root);

  const backdrop = root.querySelector('.random-draw-backdrop');
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeDrawer();
  });
  root.querySelector('.random-draw-close').addEventListener('click', closeDrawer);
  root.querySelector('.random-draw-again').addEventListener('click', drawAndOpen);
  root.querySelector('.random-draw-open-day').addEventListener('click', () => {
    if (!currentEntry?.date) return;
    const date = currentEntry.date;
    closeDrawer({ restoreFocus: false });
    window.dispatchEvent(new CustomEvent('mydailylog:open-day', { detail: { date } }));
  });

  return root;
}

function animatePaper(root) {
  const paper = root.querySelector('.random-draw-paper');
  paper.classList.remove('is-drawn');
  void paper.offsetWidth;
  paper.classList.add('is-drawn');
}

function renderEmpty(root) {
  currentEntry = null;
  root.querySelector('.random-draw-meta').hidden = true;
  root.querySelector('.random-draw-favorite').hidden = true;
  root.querySelector('.random-draw-title').hidden = false;
  root.querySelector('.random-draw-title').textContent = 'まだ引ける一枚がない';
  root.querySelector('.random-draw-content').textContent = '昨日までのメモができると、ここから偶然の一枚を引ける。';
  root.querySelector('.random-draw-open-day').hidden = true;
  root.querySelector('.random-draw-again').hidden = true;
  root.querySelector('.random-draw-stamp').textContent = '待';
}

function renderEntry(root, entry) {
  currentEntry = entry;
  root.querySelector('.random-draw-meta').hidden = false;
  root.querySelector('.random-draw-date').textContent = formatDate(entry.date);
  root.querySelector('.random-draw-distance').textContent = distanceFromToday(entry.date);
  root.querySelector('.random-draw-favorite').hidden = !entry.favorite;

  const title = root.querySelector('.random-draw-title');
  const normalizedTitle = String(entry.title || '').trim();
  title.textContent = normalizedTitle;
  title.hidden = !normalizedTitle;

  root.querySelector('.random-draw-content').textContent = String(entry.content || '').trim() || '（本文なし）';
  root.querySelector('.random-draw-open-day').hidden = false;
  root.querySelector('.random-draw-again').hidden = false;
  root.querySelector('.random-draw-stamp').textContent = '再';
  animatePaper(root);
}

function openDrawer(root) {
  root.hidden = false;
  document.body.classList.add('random-draw-open');
  requestAnimationFrame(() => {
    root.classList.add('is-open');
    root.querySelector('.random-draw-close')?.focus({ preventScroll: true });
  });
}

function closeDrawer({ restoreFocus = true } = {}) {
  const root = document.getElementById('random-draw-root');
  if (!root || root.hidden) return;
  root.classList.remove('is-open');
  document.body.classList.remove('random-draw-open');
  const finish = () => {
    root.hidden = true;
    if (restoreFocus) lastTrigger?.focus({ preventScroll: true });
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else setTimeout(finish, 180);
}

async function drawAndOpen() {
  const root = mountRoot();
  openDrawer(root);
  root.querySelector('.random-draw-sheet').setAttribute('aria-busy', 'true');
  try {
    const entry = await drawEntry();
    if (entry) renderEntry(root, entry);
    else renderEmpty(root);
  } catch (error) {
    currentEntry = null;
    root.querySelector('.random-draw-meta').hidden = true;
    root.querySelector('.random-draw-favorite').hidden = true;
    root.querySelector('.random-draw-title').hidden = false;
    root.querySelector('.random-draw-title').textContent = '一枚を引けなかった';
    root.querySelector('.random-draw-content').textContent = 'もう一度試してみてください。';
    root.querySelector('.random-draw-open-day').hidden = true;
    root.querySelector('.random-draw-again').hidden = false;
    console.error('random draw failed', error);
  } finally {
    root.querySelector('.random-draw-sheet').removeAttribute('aria-busy');
  }
}

function ensureTrigger() {
  const top = document.querySelector('.top');
  const paperMode = top?.querySelector('.paper-mode');
  if (!top || !paperMode || top.querySelector('.random-draw-trigger')) return;

  let actions = top.querySelector('.top-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'top-actions';
    top.insertBefore(actions, paperMode);
    actions.appendChild(paperMode);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'random-draw-trigger';
  button.textContent = '一枚引く';
  button.setAttribute('aria-haspopup', 'dialog');
  button.title = '過去のメモから一枚引く';
  button.addEventListener('click', () => {
    lastTrigger = button;
    drawAndOpen();
  });
  actions.insertBefore(button, paperMode);
}

function bootRandomDraw() {
  mountRoot();
  ensureTrigger();

  const app = document.getElementById('app');
  if (app) {
    const observer = new MutationObserver(ensureTrigger);
    observer.observe(app, { childList: true, subtree: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !document.getElementById('random-draw-root')?.hidden) {
      event.preventDefault();
      closeDrawer();
    }
  });
}

bootRandomDraw();
