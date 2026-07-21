(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  let activeEditorId = null;
  let saving = false;

  const nowIso = () => new Date().toISOString();

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getEntry(id) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putEntry(entry) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(entry);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function refreshCurrentView() {
    activeEditorId = null;
    saving = false;
    const activeRoute = document.querySelector('[data-route].active');
    const fallbackRoute = document.querySelector('[data-route="today"]');
    (activeRoute || fallbackRoute)?.click();
  }

  function makeField(labelText, control) {
    const label = document.createElement('label');
    label.className = 'inline-log-field';
    const labelNode = document.createElement('span');
    labelNode.textContent = labelText;
    label.append(labelNode, control);
    return label;
  }

  async function openInlineEditor(opener) {
    const id = opener?.dataset?.open;
    const card = opener?.closest?.('.card');
    if (!id || !card || card.dataset.inlineEditing === 'true') return;

    activeEditorId = id;
    card.dataset.inlineEditing = 'true';
    card.classList.add('is-inline-editing');

    const entry = await getEntry(id).catch(() => null);
    if (!entry || !card.isConnected || activeEditorId !== id) {
      refreshCurrentView();
      return;
    }

    const form = document.createElement('form');
    form.className = 'inline-log-editor';
    form.dataset.inlineEditor = id;
    form.noValidate = true;

    const heading = document.createElement('div');
    heading.className = 'inline-log-editor-heading';
    heading.innerHTML = '<strong>ログを整える</strong><span>カードの中で、そのまま編集</span>';

    const title = document.createElement('input');
    title.type = 'text';
    title.className = 'inline-log-title';
    title.autocomplete = 'off';
    title.placeholder = '題名（任意）';
    title.value = entry.title || entry.metadata?.title || '';

    const content = document.createElement('textarea');
    content.className = 'inline-log-content';
    content.placeholder = 'ログ本文';
    content.value = entry.content || '';

    const status = document.createElement('span');
    status.className = 'inline-log-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Ctrl / Cmd + Enterで確定・Escで取消';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'inline-log-cancel';
    cancel.textContent = '取消';

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'inline-log-save';
    save.textContent = '確定';

    const actions = document.createElement('div');
    actions.className = 'inline-log-actions';
    const buttons = document.createElement('div');
    buttons.className = 'inline-log-buttons';
    buttons.append(cancel, save);
    actions.append(status, buttons);

    form.append(
      heading,
      makeField('題名', title),
      makeField('本文', content),
      actions,
    );

    card.replaceChildren(form);

    const cancelEdit = () => {
      if (saving) return;
      refreshCurrentView();
    };

    const saveEdit = async () => {
      if (saving) return;
      const nextContent = content.value.trim();
      if (!nextContent) {
        status.textContent = '本文を入力して';
        content.focus();
        return;
      }

      saving = true;
      save.disabled = true;
      cancel.disabled = true;
      status.textContent = '保存中…';

      entry.title = title.value.trim();
      entry.content = nextContent;
      entry.updatedAt = nowIso();

      try {
        await putEntry(entry);
        status.textContent = '保存した';
        window.setTimeout(refreshCurrentView, 100);
      } catch (error) {
        console.error(error);
        saving = false;
        save.disabled = false;
        cancel.disabled = false;
        status.textContent = '保存できなかった。もう一度試して';
      }
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveEdit();
    });

    form.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        saveEdit();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelEdit();
      }
    });

    cancel.addEventListener('click', cancelEdit);

    window.setTimeout(() => {
      content.focus({ preventScroll: true });
      content.setSelectionRange(content.value.length, content.value.length);
    }, 0);
  }

  document.addEventListener('click', (event) => {
    const opener = event.target?.closest?.('[data-open]');
    if (!opener) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (activeEditorId && activeEditorId !== opener.dataset.open) {
      refreshCurrentView();
      return;
    }

    openInlineEditor(opener);
  }, true);
})();
