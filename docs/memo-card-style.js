(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const COLOR_KEY = 'cardColor';
  const COLORS = [
    { key: 'default', label: '標準' },
    { key: 'cream', label: 'クリーム' },
    { key: 'blue', label: 'ブルー' },
    { key: 'green', label: 'グリーン' },
  ];
  let scheduled = false;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getEntry(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
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

  function normalizeColor(value) {
    return COLORS.some(({ key }) => key === value) ? value : 'default';
  }

  function pinSvg() {
    return `
      <svg class="pushpin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8.2 3.5h7.6l-1.2 5 2.8 2.8v1.5H13v5.4l-1 2.3-1-2.3v-5.4H6.6v-1.5l2.8-2.8-1.2-5Z" />
      </svg>`;
  }

  function paletteSvg() {
    return `
      <svg class="palette-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path class="palette-shell" d="M11.8 3.1c-5.1 0-9 3.7-9 8.5 0 4.7 3.6 8.2 8 8.2h1.2c1.4 0 2.2-.8 2.2-1.8 0-.7-.4-1.2-.9-1.7-.5-.5-.2-1.3.6-1.3h2.2c3 0 5-2.2 5-5 0-4-4-6.9-9.3-6.9Z" />
        <circle class="palette-thumb-hole" cx="16.6" cy="8.2" r="1.7" />
        <circle class="palette-dot-cream" cx="8.3" cy="7.1" r="1.45" />
        <circle class="palette-dot-blue" cx="6.3" cy="11.4" r="1.45" />
        <circle class="palette-dot-green" cx="9.1" cy="15.1" r="1.45" />
      </svg>`;
  }

  function closeOtherPickers(except) {
    document.querySelectorAll('.memo-color-picker.is-open').forEach((picker) => {
      if (picker === except) return;
      picker.classList.remove('is-open');
      picker.querySelector('.memo-color-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }

  function applyColor(card, color) {
    card.dataset.cardColor = normalizeColor(color);
  }

  function enhancePin(card) {
    const pin = card.querySelector('.log-card-pin');
    if (!pin) return;
    const span = pin.querySelector('span');
    if (span && !span.querySelector('.pushpin-icon')) span.innerHTML = pinSvg();
    pin.classList.add('has-pushpin-icon');
  }

  async function persistColor(card, entry, color) {
    const next = normalizeColor(color);
    entry[COLOR_KEY] = next;
    entry.updatedAt = new Date().toISOString();
    await putEntry(entry);
    applyColor(card, next);
  }

  function makeColorPicker(card, entry) {
    const wrapper = document.createElement('div');
    wrapper.className = 'memo-color-picker';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'log-card-action memo-color-trigger';
    trigger.setAttribute('aria-label', '背景色を変更');
    trigger.setAttribute('title', '背景色を変更');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = paletteSvg();

    const palette = document.createElement('div');
    palette.className = 'memo-color-palette';
    palette.setAttribute('role', 'group');
    palette.setAttribute('aria-label', 'メモの背景色');

    COLORS.forEach(({ key, label }) => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = `memo-color-swatch swatch-${key}`;
      swatch.dataset.memoColor = key;
      swatch.setAttribute('aria-label', `${label}に変更`);
      swatch.setAttribute('title', label);
      swatch.setAttribute('aria-pressed', String(normalizeColor(entry[COLOR_KEY]) === key));
      swatch.innerHTML = '<span aria-hidden="true"></span>';
      swatch.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await persistColor(card, entry, key);
          palette.querySelectorAll('.memo-color-swatch').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.memoColor === key));
          });
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        } catch (error) {
          console.error(error);
        }
      });
      palette.append(swatch);
    });

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const willOpen = !wrapper.classList.contains('is-open');
      closeOtherPickers(wrapper);
      wrapper.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });

    wrapper.addEventListener('click', (event) => event.stopPropagation());
    wrapper.append(trigger, palette);
    return wrapper;
  }

  async function enhanceCard(card) {
    const id = card.dataset.entryId || card.querySelector('.entry-open[data-open]')?.dataset.open;
    const actions = card.querySelector('.log-card-actions');
    if (!id || !actions) return;

    enhancePin(card);

    let entry;
    try {
      entry = await getEntry(id);
    } catch (error) {
      console.error(error);
      return;
    }
    if (!entry || entry.deletedAt || !document.body.contains(card)) return;

    applyColor(card, entry[COLOR_KEY]);

    let picker = actions.querySelector('.memo-color-picker');
    if (!picker) {
      picker = makeColorPicker(card, entry);
      actions.prepend(picker);
    }

    card.dataset.memoCardStyleEnhanced = '1';
  }

  async function enhanceAll() {
    scheduled = false;
    const cards = [...document.querySelectorAll('.card')];
    await Promise.all(cards.map((card) => enhanceCard(card)));
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(enhanceAll, 55);
  }

  document.addEventListener('click', () => closeOtherPickers(null));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeOtherPickers(null);
  });

  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', scheduleEnhance);
  scheduleEnhance();
})();
