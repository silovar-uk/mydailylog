(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const BUTTON_ID = 'copy-day-logs';

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

  function timeFor(entry) {
    if (entry?.time) return entry.time;
    if (!entry?.createdAt) return '';
    const date = new Date(entry.createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Tokyo',
    }).format(date);
  }

  function sortValue(entry) {
    if (entry?.date && entry?.time) {
      const parsed = new Date(`${entry.date}T${entry.time}:00+09:00`).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }
    const created = new Date(entry?.createdAt || 0).getTime();
    return Number.isNaN(created) ? 0 : created;
  }

  function markdownBullet(entry) {
    const content = String(entry?.content || '').trim();
    const time = timeFor(entry);
    if (!content) return '';

    const lines = content.split(/\r?\n/);
    const startsWithTime = time && new RegExp(`^${time.replace(':', '\\:')}(?:\\s|　|[：:：-])`).test(lines[0]);
    const prefix = startsWithTime || !time ? '- ' : `- ${time} `;
    return `${prefix}${lines[0]}${lines.slice(1).map((line) => `\n  ${line}`).join('')}`;
  }

  function dateHeading(entries) {
    const date = entries.find((entry) => entry?.date)?.date;
    if (date) return date.replace(/-/g, '/');

    const visible = document.querySelector('.date-row h1')?.textContent?.trim();
    return visible || 'この日';
  }

  async function visibleEntries() {
    const ids = [...document.querySelectorAll('.entries [data-open]')]
      .map((button) => button.dataset.open)
      .filter(Boolean);
    const uniqueIds = [...new Set(ids)];
    const entries = (await Promise.all(uniqueIds.map((id) => getEntry(id).catch(() => null))))
      .filter((entry) => entry && !entry.deletedAt);

    return entries.sort((a, b) => {
      const byTimestamp = sortValue(a) - sortValue(b);
      if (byTimestamp !== 0) return byTimestamp;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
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

  function setButtonState(button, label, state = '') {
    if (!button) return;
    button.textContent = label;
    button.dataset.state = state;
  }

  async function copyDay(button) {
    if (button.dataset.busy === '1') return;
    button.dataset.busy = '1';
    setButtonState(button, 'コピー中…', 'busy');

    try {
      const entries = await visibleEntries();
      if (!entries.length) {
        setButtonState(button, 'ログなし', 'empty');
        return;
      }

      const body = entries.map(markdownBullet).filter(Boolean).join('\n');
      const markdown = `# ${dateHeading(entries)}\n${body}`;
      await writeClipboard(markdown);
      setButtonState(button, 'コピー済み ✓', 'success');
    } catch (error) {
      console.error('[day-copy] copy failed', error);
      setButtonState(button, 'コピー失敗', 'error');
    } finally {
      button.dataset.busy = '0';
      window.setTimeout(() => setButtonState(button, 'この日をコピー'), 1800);
    }
  }

  function enhanceDayHeader() {
    const dateRow = document.querySelector('.dayhead .date-row');
    if (!dateRow || dateRow.querySelector(`#${BUTTON_ID}`)) return;

    const next = dateRow.querySelector('#next');
    if (!next) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = 'この日をコピー';
    button.setAttribute('aria-label', 'この日のログをMarkdownでコピー');
    button.title = 'この日のログをMarkdownでコピー';
    button.addEventListener('click', () => copyDay(button));

    dateRow.classList.add('has-day-copy');
    dateRow.insertBefore(button, next);
  }

  const observer = new MutationObserver(enhanceDayHeader);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceDayHeader();
})();
