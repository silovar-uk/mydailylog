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

  async function getEntriesByDate(date) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).index('date').getAll(date);
      request.onsuccess = () => resolve(request.result.filter((entry) => !entry.deletedAt));
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllEntries() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result.filter((entry) => !entry.deletedAt));
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

  function sortEntries(entries) {
    return entries.slice().sort((a, b) => {
      const byTimestamp = sortValue(a) - sortValue(b);
      if (byTimestamp !== 0) return byTimestamp;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });
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

  function headingForDate(date) {
    return date ? date.replace(/-/g, '/') : 'この日';
  }

  function visibleDateKey() {
    const ids = [...document.querySelectorAll('.entries [data-open]')]
      .map((button) => button.dataset.open)
      .filter(Boolean);
    return ids;
  }

  async function currentDayEntries() {
    const ids = visibleDateKey();
    const entries = (await Promise.all([...new Set(ids)].map((id) => getEntry(id).catch(() => null))))
      .filter((entry) => entry && !entry.deletedAt);
    return sortEntries(entries);
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

  function defaultLabel(button) {
    return button.dataset.defaultLabel || 'この日をコピー';
  }

  function setButtonState(button, label, state = '') {
    if (!button) return;
    button.textContent = label;
    button.dataset.state = state;
  }

  async function copyEntries(entries, date, button) {
    if (button.dataset.busy === '1') return;
    button.dataset.busy = '1';
    const compact = button.dataset.compact === '1';
    setButtonState(button, compact ? '…' : 'コピー中…', 'busy');

    try {
      const sorted = sortEntries(entries);
      if (!sorted.length) {
        setButtonState(button, compact ? '–' : 'ログなし', 'empty');
        return;
      }

      const resolvedDate = date || sorted[0]?.date;
      const body = sorted.map(markdownBullet).filter(Boolean).join('\n');
      const markdown = `# ${headingForDate(resolvedDate)}\n${body}`;
      await writeClipboard(markdown);
      setButtonState(button, compact ? '✓' : 'コピー済み ✓', 'success');
    } catch (error) {
      console.error('[day-copy] copy failed', error);
      setButtonState(button, compact ? '!' : 'コピー失敗', 'error');
    } finally {
      button.dataset.busy = '0';
      window.setTimeout(() => setButtonState(button, defaultLabel(button)), 1800);
    }
  }

  async function copyDate(date, button) {
    const entries = await getEntriesByDate(date).catch(() => []);
    await copyEntries(entries, date, button);
  }

  async function copyCurrentDay(button) {
    const entries = await currentDayEntries();
    await copyEntries(entries, entries[0]?.date || null, button);
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
    button.dataset.defaultLabel = 'この日をコピー';
    button.setAttribute('aria-label', 'この日のログをMarkdownでコピー');
    button.title = 'この日のログをMarkdownでコピー';
    button.addEventListener('click', () => copyCurrentDay(button));

    dateRow.classList.add('has-day-copy');
    dateRow.insertBefore(button, next);
  }

  function makeCompactCopyButton(date, className, label = '⧉') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.dataset.defaultLabel = label;
    button.dataset.compact = '1';
    button.dataset.copyDate = date;
    button.setAttribute('aria-label', `${headingForDate(date)}のログをMarkdownでコピー`);
    button.title = `${headingForDate(date)}のログをコピー`;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      copyDate(date, button);
    });
    return button;
  }

  function enhanceCalendar() {
    const calendar = document.querySelector('.calendar .grid');
    if (!calendar) return;

    [...calendar.querySelectorAll(':scope > .calday')].forEach((dayButton) => {
      if (dayButton.dataset.dayCopyWrapped === '1') return;
      dayButton.dataset.dayCopyWrapped = '1';

      const date = dayButton.dataset.date;
      const hasLogs = Boolean(dayButton.querySelector('small'));
      if (!date || !hasLogs) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'calday-copy-wrap';
      dayButton.parentNode.insertBefore(wrapper, dayButton);
      wrapper.append(dayButton);
      wrapper.append(makeCompactCopyButton(date, 'calendar-day-copy', '⧉'));
    });
  }

  function reviewMonthKey() {
    const heading = document.querySelector('.review > h1')?.textContent || '';
    const match = heading.match(/(\d{4})年(\d{1,2})月/);
    return match ? `${match[1]}-${match[2].padStart(2, '0')}` : null;
  }

  function shortDate(date) {
    const [, month, day] = date.split('-');
    return `${Number(month)}/${Number(day)}`;
  }

  async function enhanceReview() {
    const review = document.querySelector('.review');
    if (!review || review.querySelector('.review-day-copy-section') || review.dataset.dayCopyPending === '1') return;

    const month = reviewMonthKey();
    if (!month) return;
    review.dataset.dayCopyPending = '1';

    try {
      const entries = await getAllEntries();
      if (!document.body.contains(review) || review.querySelector('.review-day-copy-section')) return;

      const counts = new Map();
      entries.filter((entry) => entry.date?.startsWith(month)).forEach((entry) => {
        counts.set(entry.date, (counts.get(entry.date) || 0) + 1);
      });
      if (!counts.size) return;

      const section = document.createElement('section');
      section.className = 'review-day-copy-section';
      section.setAttribute('aria-label', '日ごとのログをコピー');
      const title = document.createElement('h2');
      title.textContent = '日ごとにコピー';
      const list = document.createElement('div');
      list.className = 'review-day-copy-list';

      [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([date, count]) => {
        const button = makeCompactCopyButton(date, 'review-day-copy', `${shortDate(date)} · ${count}件`);
        button.dataset.compact = '0';
        button.dataset.defaultLabel = `${shortDate(date)} · ${count}件`;
        list.append(button);
      });

      section.append(title, list);
      const tabs = review.querySelector('.review-tabs');
      tabs?.after(section);
    } finally {
      if (document.body.contains(review)) review.dataset.dayCopyPending = '0';
    }
  }

  function enhanceEventContext() {
    document.querySelectorAll('#event-context-modal .context-day').forEach((section) => {
      if (section.querySelector('.context-day-copy')) return;
      const dayButton = section.querySelector('[data-context-day]');
      const date = dayButton?.dataset.contextDay;
      const hasLogs = Boolean(section.querySelector('.context-entries [data-open]'));
      if (!date || !hasLogs) return;
      section.append(makeCompactCopyButton(date, 'context-day-copy', '⧉'));
    });
  }

  function enhance() {
    enhanceDayHeader();
    enhanceCalendar();
    enhanceReview();
    enhanceEventContext();
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhance();
})();
