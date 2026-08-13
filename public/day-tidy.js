(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const BUTTON_ID = 'tidy-day-logs';
  const UNDO_ID = 'undo-day-tidy';

  let lastUndo = null;
  let busy = false;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function cloneEntry(entry) {
    if (typeof structuredClone === 'function') return structuredClone(entry);
    return JSON.parse(JSON.stringify(entry));
  }

  async function getEntry(id) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putEntries(entries) {
    if (!entries.length) return;
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      entries.forEach((entry) => store.put(entry));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function visibleIds() {
    return [...document.querySelectorAll('.entries [data-open]')]
      .map((button) => button.dataset.open)
      .filter(Boolean);
  }

  async function currentDayEntries() {
    const ids = [...new Set(visibleIds())];
    const entries = await Promise.all(ids.map((id) => getEntry(id).catch(() => null)));
    return entries.filter((entry) => entry && !entry.deletedAt);
  }

  function normalizeText(value) {
    if (typeof value !== 'string') return value;
    return value
      .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
      .replace(/　/g, ' ')
      .replace(/[ \t]+$/gm, '');
  }

  function tidyEntry(entry) {
    const next = cloneEntry(entry);
    next.content = normalizeText(next.content || '');

    if (typeof next.title === 'string') {
      next.title = normalizeText(next.title);
    }

    if (next.metadata && typeof next.metadata.title === 'string') {
      next.metadata = { ...next.metadata, title: normalizeText(next.metadata.title) };
    }

    return next;
  }

  function changed(before, after) {
    return JSON.stringify(before) !== JSON.stringify(after);
  }

  function refreshCurrentView() {
    const activeRoute = document.querySelector('[data-route].active');
    const fallbackRoute = document.querySelector('[data-route="today"]');
    (activeRoute || fallbackRoute)?.click();
  }

  function visibleDate(entries = []) {
    return entries.find((entry) => entry?.date)?.date || null;
  }

  function setButtonState(button, label, state = '') {
    if (!button) return;
    button.textContent = label;
    button.dataset.state = state;
  }

  async function tidyCurrentDay(button) {
    if (busy) return;
    busy = true;
    setButtonState(button, '整え中…', 'busy');

    try {
      const entries = await currentDayEntries();
      if (!entries.length) {
        setButtonState(button, 'メモなし', 'empty');
        return;
      }

      const before = entries.map(cloneEntry);
      const after = entries.map(tidyEntry);
      const updates = after.filter((entry, index) => changed(before[index], entry));

      if (!updates.length) {
        setButtonState(button, '変更なし', 'empty');
        return;
      }

      lastUndo = {
        date: visibleDate(entries),
        entries: before,
      };

      await putEntries(updates);
      setButtonState(button, '整えた ✓', 'success');
      window.setTimeout(refreshCurrentView, 120);
    } catch (error) {
      console.error('[day-tidy] tidy failed', error);
      setButtonState(button, '失敗', 'error');
    } finally {
      busy = false;
      window.setTimeout(() => {
        const current = document.querySelector(`#${BUTTON_ID}`);
        if (current && current.dataset.state !== 'success') setButtonState(current, '整える');
      }, 1600);
    }
  }

  async function undoLastTidy(button) {
    if (busy || !lastUndo?.entries?.length) return;
    busy = true;
    button.disabled = true;
    button.textContent = '戻し中…';

    try {
      await putEntries(lastUndo.entries.map(cloneEntry));
      lastUndo = null;
      refreshCurrentView();
    } catch (error) {
      console.error('[day-tidy] undo failed', error);
      button.disabled = false;
      button.textContent = '元に戻す';
    } finally {
      busy = false;
    }
  }

  function ensureTools(dateRow) {
    let tools = dateRow.querySelector('.day-tools');
    const copyButton = dateRow.querySelector('#copy-day-logs');

    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'day-tools';
      if (copyButton) {
        copyButton.parentNode.insertBefore(tools, copyButton);
        tools.append(copyButton);
      } else {
        const next = dateRow.querySelector('#next');
        next ? dateRow.insertBefore(tools, next) : dateRow.append(tools);
      }
    } else if (copyButton && copyButton.parentNode !== tools) {
      tools.prepend(copyButton);
    }

    return tools;
  }

  function enhanceDayHeader() {
    const dateRow = document.querySelector('.dayhead .date-row');
    if (!dateRow) return;

    const tools = ensureTools(dateRow);

    if (!tools.querySelector(`#${BUTTON_ID}`)) {
      const tidy = document.createElement('button');
      tidy.id = BUTTON_ID;
      tidy.type = 'button';
      tidy.textContent = '整える';
      tidy.setAttribute('aria-label', 'この日のメモを安全な範囲で整える');
      tidy.title = '全角英数字・全角スペース・行末の余分な空白を整える';
      tidy.addEventListener('click', () => tidyCurrentDay(tidy));
      tools.append(tidy);
    }

    const currentDate = [...document.querySelectorAll('.entries [data-open]')]
      .map((button) => button.closest('.card'))
      .map(() => null);
    void currentDate;

    const undo = tools.querySelector(`#${UNDO_ID}`);
    currentDayEntries().then((entries) => {
      if (!document.body.contains(tools)) return;
      const date = visibleDate(entries);
      const shouldShowUndo = Boolean(lastUndo && date && lastUndo.date === date);

      if (shouldShowUndo && !tools.querySelector(`#${UNDO_ID}`)) {
        const undoButton = document.createElement('button');
        undoButton.id = UNDO_ID;
        undoButton.type = 'button';
        undoButton.textContent = '元に戻す';
        undoButton.setAttribute('aria-label', '直前の整形を元に戻す');
        undoButton.addEventListener('click', () => undoLastTidy(undoButton));
        tools.append(undoButton);
      } else if (!shouldShowUndo && undo) {
        undo.remove();
      }
    }).catch(() => {});
  }

  function enhance() {
    enhanceDayHeader();
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhance();
})();
