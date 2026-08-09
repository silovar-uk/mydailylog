(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const DECORATED = 'logUxDecorated';
  let scheduled = false;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function allEntries() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result.filter((entry) => !entry.deletedAt));
      request.onerror = () => reject(request.error);
    });
  }

  async function putEntry(entry) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(entry);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
      hour12: false, timeZone: 'Asia/Tokyo',
    }).format(date);
  }

  function hasMeaningfulUpdate(entry) {
    const created = Date.parse(entry.createdAt || '');
    const updated = Date.parse(entry.updatedAt || '');
    return Number.isFinite(created) && Number.isFinite(updated) && updated - created > 2000;
  }

  function makeButton(className, label, active, symbol) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(active));
    button.innerHTML = `<span aria-hidden="true">${symbol}</span>`;
    return button;
  }

  function buildTimestamp(entry) {
    const wrap = document.createElement('div');
    wrap.className = 'log-card-timestamps';

    const created = document.createElement('span');
    created.textContent = `作成 ${formatDateTime(entry.createdAt) || '日時不明'}`;
    wrap.append(created);

    if (hasMeaningfulUpdate(entry)) {
      const updated = document.createElement('span');
      updated.textContent = `更新 ${formatDateTime(entry.updatedAt)}`;
      wrap.append(updated);
    }

    return wrap;
  }

  async function toggleFlag(entry, key, button, card) {
    const next = !entry[key];
    entry[key] = next;
    entry[`${key}At`] = next ? new Date().toISOString() : null;
    await putEntry(entry);

    button.setAttribute('aria-pressed', String(next));
    button.setAttribute('aria-label', key === 'pinned'
      ? (next ? 'ピン留めを外す' : 'ピン留めする')
      : (next ? 'お気に入りを外す' : 'お気に入りにする'));
    button.setAttribute('title', button.getAttribute('aria-label'));
    card.classList.toggle('is-pinned', key === 'pinned' ? next : Boolean(entry.pinned));
    card.classList.toggle('is-favorite', key === 'favorite' ? next : Boolean(entry.favorite));
    reorderPinnedCards();
  }

  function cleanLegacyClassification(card) {
    card.querySelectorAll('.entry-icon, .priority, .meta, .suggest').forEach((node) => node.remove());
    card.classList.add('classification-hidden');
  }

  function decorateCard(card, entry, index) {
    const opener = card.querySelector('.entry-open[data-open]');
    if (!opener || !entry) return;

    cleanLegacyClassification(card);
    card.dataset.entryId = entry.id;
    card.dataset.originalOrder = card.dataset.originalOrder || String(index);
    card.classList.toggle('is-pinned', Boolean(entry.pinned));
    card.classList.toggle('is-favorite', Boolean(entry.favorite));

    card.querySelector('.log-card-footer')?.remove();
    card.querySelector('.related-log-panel')?.remove();

    const footer = document.createElement('footer');
    footer.className = 'log-card-footer';

    const actions = document.createElement('div');
    actions.className = 'log-card-actions';

    const pin = makeButton('log-card-action log-card-pin', entry.pinned ? 'ピン留めを外す' : 'ピン留めする', Boolean(entry.pinned), '⌖');
    const favorite = makeButton('log-card-action log-card-favorite', entry.favorite ? 'お気に入りを外す' : 'お気に入りにする', Boolean(entry.favorite), '☆');
    actions.append(pin, favorite);

    footer.append(buildTimestamp(entry), actions);
    card.append(footer);

    pin.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFlag(entry, 'pinned', pin, card).catch(console.error);
    });
    favorite.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFlag(entry, 'favorite', favorite, card).catch(console.error);
    });

    card.dataset[DECORATED] = '1';
  }

  function reorderPinnedCards() {
    document.querySelectorAll('.entries').forEach((container) => {
      const cards = [...container.children].filter((node) => node.classList?.contains('card'));
      const sorted = [...cards].sort((left, right) => {
        const pinDifference = Number(right.classList.contains('is-pinned')) - Number(left.classList.contains('is-pinned'));
        if (pinDifference) return pinDifference;
        return Number(left.dataset.originalOrder || 0) - Number(right.dataset.originalOrder || 0);
      });
      if (sorted.some((card, index) => cards[index] !== card)) {
        sorted.forEach((card) => container.append(card));
      }
    });
  }

  function hideLegacyDetailFields() {
    document.querySelectorAll('#entry-type').forEach((field) => field.closest('.form-grid')?.setAttribute('hidden', ''));
    document.querySelectorAll('#entry-amount').forEach((field) => field.closest('.form-grid')?.setAttribute('hidden', ''));
    document.querySelectorAll('#entry-tags').forEach((field) => field.closest('label')?.setAttribute('hidden', ''));
  }

  function addMemoShortcutHint() {
    const headerCopy = document.querySelector('.side-memo-header > div');
    if (!headerCopy || headerCopy.querySelector('.side-memo-shortcut-hint')) return;
    const hint = document.createElement('span');
    hint.className = 'side-memo-shortcut-hint';
    hint.textContent = 'Alt + ← 開く  /  Alt + → 閉じる';
    headerCopy.append(hint);
  }

  async function decorate() {
    scheduled = false;
    hideLegacyDetailFields();
    addMemoShortcutHint();
    document.querySelectorAll('.quick').forEach((quick) => quick.remove());
    document.querySelectorAll('.related-log-panel, .related-log-preview-backdrop').forEach((node) => node.remove());

    const cards = [...document.querySelectorAll('.card')];
    if (!cards.length) return;

    let entries;
    try {
      entries = await allEntries();
    } catch (error) {
      console.error(error);
      return;
    }
    const byId = new Map(entries.map((entry) => [entry.id, entry]));

    cards.forEach((card, index) => {
      const id = card.querySelector('.entry-open[data-open]')?.dataset.open;
      if (!id) return;
      const existingFooter = card.querySelector('.log-card-footer');
      if (card.dataset[DECORATED] !== '1' || !existingFooter) {
        decorateCard(card, byId.get(id), index);
      }
    });

    reorderPinnedCards();
  }

  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(decorate, 30);
  }

  const observer = new MutationObserver(scheduleDecorate);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', scheduleDecorate);
  scheduleDecorate();
})();
