(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const SELECTORS = {
    composer: '#composer',
    send: '#send',
    title: '#composer-title',
  };
  const pendingTitles = new Map();

  const nowIso = () => new Date().toISOString();
  const uid = () => crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const escapeHtml = (text = '') => String(text).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
  }[char]));

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putEntry(entry) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
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

  function displayedDateKey() {
    const heading = document.querySelector('.date-row h1')?.textContent || '';
    const match = heading.match(/(\d{1,2})月(\d{1,2})日/);
    if (!match) return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const currentYear = new Date().getFullYear();
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  function enhanceComposer() {
    const composer = document.querySelector('.composer');
    const textarea = document.querySelector(SELECTORS.composer);
    if (!composer || !textarea || document.querySelector(SELECTORS.title)) return;

    const title = document.createElement('input');
    title.id = 'composer-title';
    title.type = 'text';
    title.autocomplete = 'off';
    title.placeholder = '題名（任意）';
    title.setAttribute('aria-label', 'ログの題名 任意');
    composer.insertBefore(title, textarea);
  }

  async function saveOneComposerEntry(event) {
    const textarea = document.querySelector(SELECTORS.composer);
    if (!textarea) return;
    const raw = textarea.value.trim();
    if (!raw) return;

    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    const titleInput = document.querySelector(SELECTORS.title);
    const title = titleInput?.value.trim() || '';
    const parsed = parseEntry(raw);
    const entry = {
      id: uid(),
      date: displayedDateKey(),
      time: parsed.time,
      title,
      content: raw,
      type: 'memo',
      amount: null,
      unit: null,
      tags: [],
      importance: parsed.importance,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
      deletedAt: null,
      suggestion: parsed.type !== 'memo' || parsed.amount !== null ? parsed : null,
    };
    await putEntry(entry);
    textarea.value = '';
    if (titleInput) titleInput.value = '';
    document.querySelector('[data-route="today"]')?.click();
  }

  function interceptComposerSubmit(event) {
    const send = event.target?.closest?.(SELECTORS.send);
    if (send) saveOneComposerEntry(event);
  }

  function interceptComposerShortcut(event) {
    if (!event.target?.matches?.(SELECTORS.composer)) return;
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') saveOneComposerEntry(event);
  }

  async function decorateCards() {
    const buttons = [...document.querySelectorAll('[data-open]')];
    await Promise.all(buttons.map(async (button) => {
      const id = button.dataset.open;
      if (!id || button.dataset.titleDecorated === '1') return;
      button.dataset.titleDecorated = '1';
      const entry = await getEntry(id).catch(() => null);
      const title = entry?.title || entry?.metadata?.title || '';
      const body = button.querySelector('.entry-body');
      const content = button.querySelector('.entry-content');
      if (!body || !content) return;
      body.querySelector('.runtime-entry-title')?.remove();
      if (title) {
        const titleNode = document.createElement('span');
        titleNode.className = 'runtime-entry-title';
        titleNode.textContent = title;
        body.insertBefore(titleNode, content);
      }
    }));
  }

  async function saveTitle(id, title) {
    const entry = await getEntry(id).catch(() => null);
    if (!entry) return;
    entry.title = title;
    entry.updatedAt = nowIso();
    await putEntry(entry);
  }

  async function enhanceDetailModal() {
    const modal = document.querySelector('#detail-modal');
    const form = modal?.querySelector('#detail-form');
    const content = modal?.querySelector('#entry-content');
    if (!modal || !form || !content || modal.querySelector('#entry-title-runtime')) return;

    const openButton = document.querySelector('[data-open]');
    const closeButton = modal.querySelector('#close-detail');
    const id = document.querySelector('.modal-backdrop#detail-modal') ? getCurrentDetailId() : null;
    if (!id) return;

    const entry = await getEntry(id).catch(() => null);
    const label = document.createElement('label');
    label.className = 'runtime-title-field';
    label.innerHTML = `題名（任意）<input id="entry-title-runtime" type="text" value="${escapeHtml(entry?.title || entry?.metadata?.title || '')}" placeholder="例：面接の振り返り / 今日のゲーム学び" />`;
    content.closest('label')?.before(label);

    const input = label.querySelector('#entry-title-runtime');
    input.addEventListener('input', () => {
      pendingTitles.set(id, input.value.trim());
      saveTitle(id, input.value.trim()).catch(() => {});
    });
  }

  function getCurrentDetailId() {
    const detailModal = document.querySelector('#detail-modal');
    if (!detailModal) return null;
    const ids = [...document.querySelectorAll('[data-open]')].map((button) => button.dataset.open).filter(Boolean);
    const modalTitle = detailModal.querySelector('#entry-content')?.value || '';
    const candidates = ids.map((id) => getEntry(id).then((entry) => (entry?.content === modalTitle ? id : null)).catch(() => null));
    // Async matching cannot return synchronously; use the most recently opened card as a fallback.
    return window.__mydailylogLastOpenId || ids[0] || null;
  }

  document.addEventListener('click', (event) => {
    const opener = event.target?.closest?.('[data-open]');
    if (opener?.dataset?.open) window.__mydailylogLastOpenId = opener.dataset.open;
  }, true);

  document.addEventListener('click', (event) => {
    const id = window.__mydailylogLastOpenId;
    if (!id || !pendingTitles.has(id)) return;
    if (event.target?.closest?.('#close-detail, #open-entry-day') || event.target?.id === 'detail-modal') {
      const title = pendingTitles.get(id);
      setTimeout(() => saveTitle(id, title).then(() => pendingTitles.delete(id)).catch(() => {}), 700);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    const id = window.__mydailylogLastOpenId;
    if (event.key !== 'Escape' || !id || !pendingTitles.has(id)) return;
    const title = pendingTitles.get(id);
    setTimeout(() => saveTitle(id, title).then(() => pendingTitles.delete(id)).catch(() => {}), 700);
  }, true);

  const observer = new MutationObserver(() => {
    enhanceComposer();
    decorateCards();
    enhanceDetailModal();
  });

  document.addEventListener('click', interceptComposerSubmit, true);
  document.addEventListener('keydown', interceptComposerShortcut, true);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceComposer();
  decorateCards();
  enhanceDetailModal();
})();
