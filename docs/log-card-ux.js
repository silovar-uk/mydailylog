(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const DECORATED = 'logUxDecorated';
  const STOP_WORDS = new Set([
    '今日', '昨日', '明日', 'こと', 'これ', 'それ', 'ため', 'もの', 'ところ',
    'した', 'する', 'ある', 'いる', 'です', 'ます', 'だった', 'なった', '思った',
    '行った', 'やった', 'できた', 'について', 'から', 'まで', 'また', 'かなり',
  ]);
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
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Tokyo',
    }).format(date);
  }

  function formatLogDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00+09:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      timeZone: 'Asia/Tokyo',
    }).format(date);
  }

  function hasMeaningfulUpdate(entry) {
    const created = Date.parse(entry.createdAt || '');
    const updated = Date.parse(entry.updatedAt || '');
    return Number.isFinite(created) && Number.isFinite(updated) && updated - created > 2000;
  }

  function normalizeText(value = '') {
    return String(value)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\u3000\s]+/g, ' ')
      .trim();
  }

  function tokenize(entry) {
    const text = normalizeText(`${entry.title || entry.metadata?.title || ''} ${entry.content || ''}`);
    const tokens = new Set();

    for (const word of text.match(/[a-z0-9][a-z0-9+._-]{1,}/g) || []) {
      tokens.add(word);
    }

    for (const run of text.match(/[一-龠々〆ヵヶぁ-んァ-ヴー]{2,}/g) || []) {
      if (!STOP_WORDS.has(run) && run.length <= 18) tokens.add(run);
      const max = Math.min(run.length - 1, 18);
      for (let index = 0; index < max; index += 1) {
        const pair = run.slice(index, index + 2);
        if (!STOP_WORDS.has(pair)) tokens.add(pair);
      }
    }

    return tokens;
  }

  function relatedEntries(target, entries) {
    const targetTokens = tokenize(target);
    if (!targetTokens.size) return [];

    return entries
      .filter((entry) => entry.id !== target.id)
      .map((entry) => {
        const candidateTokens = tokenize(entry);
        let common = 0;
        targetTokens.forEach((token) => {
          if (candidateTokens.has(token)) common += token.length >= 4 ? 2 : 1;
        });

        const targetTitle = normalizeText(target.title || target.metadata?.title || '');
        const candidateTitle = normalizeText(entry.title || entry.metadata?.title || '');
        if (targetTitle && candidateTitle && targetTitle === candidateTitle) common += 5;

        const dayGap = Math.abs(Date.parse(`${target.date}T12:00:00+09:00`) - Date.parse(`${entry.date}T12:00:00+09:00`)) / 86400000;
        const proximity = Number.isFinite(dayGap) && dayGap <= 30 ? 0.25 : 0;
        return { entry, score: common + proximity };
      })
      .filter(({ score }) => score >= 2)
      .sort((left, right) => right.score - left.score || String(right.entry.createdAt).localeCompare(String(left.entry.createdAt)))
      .slice(0, 3)
      .map(({ entry }) => entry);
  }

  function excerpt(entry, length = 46) {
    const title = entry.title || entry.metadata?.title;
    const source = title || entry.content || '無題のログ';
    return source.length > length ? `${source.slice(0, length)}…` : source;
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

  function showPreview(entry) {
    document.querySelector('#related-log-preview')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'related-log-preview';
    backdrop.className = 'related-log-preview-backdrop';

    const dialog = document.createElement('section');
    dialog.className = 'related-log-preview';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'related-log-preview-title');

    const header = document.createElement('header');
    header.innerHTML = `
      <div>
        <p>関連ログ</p>
        <h2 id="related-log-preview-title"></h2>
      </div>
      <button type="button" class="related-log-preview-close" aria-label="閉じる">×</button>
    `;
    header.querySelector('h2').textContent = entry.title || entry.metadata?.title || '無題のログ';

    const date = document.createElement('div');
    date.className = 'related-log-preview-date';
    date.textContent = formatLogDate(entry.date);

    const content = document.createElement('div');
    content.className = 'related-log-preview-content';
    content.textContent = entry.content || '';

    const metadata = buildTimestamp(entry);
    metadata.classList.add('related-log-preview-timestamps');

    dialog.append(header, date, content, metadata);
    backdrop.append(dialog);
    document.body.append(backdrop);

    const close = () => {
      document.removeEventListener('keydown', onKeydown);
      backdrop.remove();
    };
    const onKeydown = (event) => {
      if (event.key === 'Escape') close();
    };

    header.querySelector('.related-log-preview-close').addEventListener('click', close);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close();
    });
    document.addEventListener('keydown', onKeydown);
  }

  function openRelated(entry) {
    const visible = [...document.querySelectorAll('.entry-open[data-open]')]
      .find((button) => button.dataset.open === entry.id);
    const card = visible?.closest('.card');

    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('is-related-highlight');
      requestAnimationFrame(() => card.classList.add('is-related-highlight'));
      window.setTimeout(() => card.classList.remove('is-related-highlight'), 1800);
      return;
    }

    showPreview(entry);
  }

  function buildRelatedPanel(related) {
    const panel = document.createElement('div');
    panel.className = 'related-log-panel';
    panel.hidden = true;

    const heading = document.createElement('p');
    heading.textContent = '内容が近いログ';
    panel.append(heading);

    related.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'related-log-link';
      button.innerHTML = '<span class="related-log-date"></span><strong></strong>';
      button.querySelector('.related-log-date').textContent = formatLogDate(entry.date);
      button.querySelector('strong').textContent = excerpt(entry);
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openRelated(entry);
      });
      panel.append(button);
    });

    return panel;
  }

  async function toggleFlag(entry, key, button, card) {
    const next = !entry[key];
    entry[key] = next;
    entry[`${key}At`] = next ? new Date().toISOString() : null;
    await putEntry(entry);

    button.setAttribute('aria-pressed', String(next));
    button.setAttribute('aria-label', key === 'pinned' ? (next ? 'ピン留めを外す' : 'ピン留めする') : (next ? 'お気に入りを外す' : 'お気に入りにする'));
    button.setAttribute('title', button.getAttribute('aria-label'));
    card.classList.toggle('is-pinned', key === 'pinned' ? next : Boolean(entry.pinned));
    card.classList.toggle('is-favorite', key === 'favorite' ? next : Boolean(entry.favorite));
    reorderPinnedCards();
  }

  function cleanLegacyClassification(card) {
    card.querySelectorAll('.entry-icon, .priority, .meta, .suggest').forEach((node) => node.remove());
    card.classList.add('classification-hidden');
  }

  function decorateCard(card, entry, entries, index) {
    const opener = card.querySelector('.entry-open[data-open]');
    if (!opener || !entry) return;

    cleanLegacyClassification(card);
    card.dataset.entryId = entry.id;
    card.dataset.originalOrder = card.dataset.originalOrder || String(index);
    card.classList.toggle('is-pinned', Boolean(entry.pinned));
    card.classList.toggle('is-favorite', Boolean(entry.favorite));

    card.querySelector('.log-card-footer')?.remove();
    card.querySelector('.related-log-panel')?.remove();

    const related = relatedEntries(entry, entries);
    const footer = document.createElement('footer');
    footer.className = 'log-card-footer';

    const actions = document.createElement('div');
    actions.className = 'log-card-actions';

    const pin = makeButton('log-card-action log-card-pin', entry.pinned ? 'ピン留めを外す' : 'ピン留めする', Boolean(entry.pinned), '⌖');
    const favorite = makeButton('log-card-action log-card-favorite', entry.favorite ? 'お気に入りを外す' : 'お気に入りにする', Boolean(entry.favorite), '☆');
    actions.append(pin, favorite);

    let relatedToggle = null;
    let relatedPanel = null;
    if (related.length) {
      relatedToggle = document.createElement('button');
      relatedToggle.type = 'button';
      relatedToggle.className = 'log-card-related-toggle';
      relatedToggle.setAttribute('aria-expanded', 'false');
      relatedToggle.innerHTML = `<span aria-hidden="true">↗</span> 関連 ${related.length}`;
      actions.append(relatedToggle);
      relatedPanel = buildRelatedPanel(related);
    }

    footer.append(buildTimestamp(entry), actions);
    card.append(footer);
    if (relatedPanel) card.append(relatedPanel);

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
    relatedToggle?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = relatedToggle.getAttribute('aria-expanded') !== 'true';
      relatedToggle.setAttribute('aria-expanded', String(open));
      relatedPanel.hidden = !open;
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
      const changed = sorted.some((card, index) => cards[index] !== card);
      if (changed) sorted.forEach((card) => container.append(card));
    });
  }

  function hideLegacyDetailFields() {
    document.querySelectorAll('#entry-type').forEach((field) => {
      const grid = field.closest('.form-grid');
      if (grid) grid.hidden = true;
    });
    document.querySelectorAll('#entry-amount').forEach((field) => {
      const grid = field.closest('.form-grid');
      if (grid) grid.hidden = true;
    });
    document.querySelectorAll('#entry-tags').forEach((field) => {
      const label = field.closest('label');
      if (label) label.hidden = true;
    });
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

    const cards = [...document.querySelectorAll('.card')];
    if (!cards.length) return;
    const pendingCards = cards.filter((card) => {
      const existingFooter = card.querySelector('.log-card-footer');
      return card.dataset[DECORATED] !== '1' || !existingFooter;
    });
    if (!pendingCards.length) {
      reorderPinnedCards();
      return;
    }

    let entries;
    try {
      entries = await allEntries();
    } catch (error) {
      console.error(error);
      return;
    }
    const byId = new Map(entries.map((entry) => [entry.id, entry]));

    pendingCards.forEach((card) => {
      const id = card.querySelector('.entry-open[data-open]')?.dataset.open;
      if (!id) return;
      decorateCard(card, byId.get(id), entries, cards.indexOf(card));
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