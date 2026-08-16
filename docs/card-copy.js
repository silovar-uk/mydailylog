(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const CHATGPT_BASE_URL = 'https://chatgpt.com/';
  const CHATGPT_PROMPT_URL_LIMIT = 7000;

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

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('copy failed');
  }

  function escapeMarkdownTitle(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/\*/g, '\\*');
  }

  function copyTextFor(entry) {
    const title = String(entry?.title || entry?.metadata?.title || '').trim();
    const content = String(entry?.content || '').trim();

    if (title && content) return `**${escapeMarkdownTitle(title)}**\n${content}`;
    if (title) return `**${escapeMarkdownTitle(title)}**`;
    return content;
  }

  function chatGPTTextFor(entry) {
    const date = String(entry?.date || '').trim().replace(/-/g, '/');
    const content = String(entry?.content || '').trim();
    if (!content) return '';
    return date ? `${date}\n\n${content}` : content;
  }

  function chatGPTUrlFor(text) {
    return `${CHATGPT_BASE_URL}?prompt=${encodeURIComponent(text)}`;
  }

  function setButtonState(button, symbol, label) {
    const icon = button.querySelector('span');
    if (icon) icon.textContent = symbol;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  }

  async function copyCard(card, button) {
    const id = card.querySelector('.entry-open[data-open]')?.dataset.open || card.dataset.entryId;
    if (!id || button.dataset.busy === '1') return;

    button.dataset.busy = '1';
    try {
      const entry = await getEntry(id);
      const text = copyTextFor(entry);
      if (!text) throw new Error('empty memo');
      await writeClipboard(text);
      setButtonState(button, '✓', 'コピー済み');
    } catch (error) {
      console.error('[card-copy] copy failed', error);
      setButtonState(button, '!', 'コピーできなかった');
    } finally {
      window.setTimeout(() => {
        setButtonState(button, '⧉', 'このメモをコピー');
        button.dataset.busy = '0';
      }, 1200);
    }
  }

  async function openCardInChatGPT(card, button) {
    const id = card.querySelector('.entry-open[data-open]')?.dataset.open || card.dataset.entryId;
    if (!id || button.dataset.busy === '1') return;

    button.dataset.busy = '1';

    // Open synchronously from the click so mobile browsers do not block the new tab
    // while IndexedDB is being read.
    const chatWindow = window.open('about:blank', '_blank');
    if (chatWindow) chatWindow.opener = null;

    try {
      const entry = await getEntry(id);
      const text = chatGPTTextFor(entry);
      if (!text) throw new Error('empty memo');

      const url = chatGPTUrlFor(text);
      if (url.length <= CHATGPT_PROMPT_URL_LIMIT && chatWindow) {
        chatWindow.location.replace(url);
        setButtonState(button, '✓', 'ChatGPTで開いた');
      } else {
        await writeClipboard(text);
        if (chatWindow) chatWindow.location.replace(CHATGPT_BASE_URL);
        setButtonState(button, '✓', '日付とメモをコピーしてChatGPTを開いた');
      }
    } catch (error) {
      console.error('[card-copy] ChatGPT handoff failed', error);
      if (chatWindow && !chatWindow.closed) chatWindow.close();
      setButtonState(button, '!', 'ChatGPTで開けなかった');
    } finally {
      window.setTimeout(() => {
        setButtonState(button, 'GPT', 'このメモをChatGPTで話す');
        button.dataset.busy = '0';
      }, 1400);
    }
  }

  function makeCopyButton(card) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'log-card-action log-card-copy';
    button.setAttribute('aria-label', 'このメモをコピー');
    button.setAttribute('title', 'このメモをコピー');
    button.innerHTML = '<span aria-hidden="true">⧉</span>';

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      copyCard(card, button);
    });

    return button;
  }

  function makeChatGPTButton(card) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'log-card-action log-card-chatgpt';
    button.setAttribute('aria-label', 'このメモをChatGPTで話す');
    button.setAttribute('title', 'このメモをChatGPTで話す');
    button.innerHTML = '<span aria-hidden="true">GPT</span>';

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCardInChatGPT(card, button);
    });

    return button;
  }

  function enhanceCard(card) {
    const actions = card.querySelector('.log-card-actions');
    if (!actions) return;

    if (!actions.querySelector('.log-card-copy')) actions.prepend(makeCopyButton(card));
    if (!actions.querySelector('.log-card-chatgpt')) {
      const copyButton = actions.querySelector('.log-card-copy');
      const chatButton = makeChatGPTButton(card);
      if (copyButton) copyButton.after(chatButton);
      else actions.prepend(chatButton);
    }
  }

  function enhance() {
    document.querySelectorAll('.card').forEach(enhanceCard);
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => queueMicrotask(enhance));
  enhance();
})();
