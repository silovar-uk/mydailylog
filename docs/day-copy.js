(() => {
  'use strict';

  const DB_NAME = 'mydailylog';
  const STORE = 'entries';
  const BUTTON_ID = 'copy-day-logs';
  const CHATGPT_BUTTON_ID = 'chatgpt-day-logs';
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

  function escapeMarkdownTitle(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/\*/g, '\\*');
  }

  function markdownBullet(entry) {
    const content = String(entry?.content || '').trim();
    const title = String(entry?.title || entry?.metadata?.title || '').trim();
    const time = timeFor(entry);
    if (!content) return '';

    const lines = content.split(/\r?\n/);
    const startsWithTime = time && new RegExp(`^${time.replace(':', '\\:')}(?:\\s|　|[：:：-])`).test(lines[0]);
    const prefix = startsWithTime || !time ? '- ' : `- ${time} `;

    if (title) {
      const body = lines.map((line) => `  ${line}`).join('\n');
      return `${prefix}**${escapeMarkdownTitle(title)}**\n${body}`;
    }

    return `${prefix}${lines[0]}${lines.slice(1).map((line) => `\n  ${line}`).join('')}`;
  }

  function headingForDate(date) {
    return date ? date.replace(/-/g, '/') : 'この日';
  }

  function visibleDateKey() {
    return [...document.querySelectorAll('.entries [data-open]')]
      .map((button) => button.dataset.open)
      .filter(Boolean);
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

  function markdownForEntries(entries, date) {
    const sorted = sortEntries(entries);
    if (!sorted.length) return '';
    const resolvedDate = date || sorted[0]?.date;
    const body = sorted.map(markdownBullet).filter(Boolean).join('\n');
    return `# ${headingForDate(resolvedDate)}\n${body}`;
  }

  function promptForEntries(entries, date) {
    const sorted = sortEntries(entries);
    if (!sorted.length) return '';
    const resolvedDate = date || sorted[0]?.date;
    const markdown = markdownForEntries(sorted, resolvedDate);
    return [
      `以下は${headingForDate(resolvedDate)}の日記です。`,
      'この日記について一緒に振り返ってください。要約だけで終わらず、印象に残る出来事や変化、気になった点を拾いながら対話してください。必要なら質問は一度に1つずつしてください。',
      '',
      markdown,
    ].join('\n');
  }

  function openPendingChatWindow() {
    const popup = window.open('about:blank', '_blank');
    if (!popup) return null;
    try {
      popup.opener = null;
      popup.document.title = 'ChatGPTを開いています…';
      popup.document.body.style.cssText = 'font-family:system-ui,sans-serif;padding:24px;line-height:1.6;color:#222';
      popup.document.body.textContent = 'ChatGPTを開いています…';
    } catch (error) {
      // Some browsers restrict access immediately. Navigation can still succeed.
    }
    return popup;
  }

  function navigateToChatGPT(popup, url) {
    if (popup && !popup.closed) {
      popup.location.replace(url);
      return;
    }
    window.location.assign(url);
  }

  async function copyEntries(entries, date, button) {
    if (button.dataset.busy === '1') return;
    button.dataset.busy = '1';
    const compact = button.dataset.compact === '1';
    setButtonState(button, compact ? '…' : 'コピー中…', 'busy');

    try {
      const markdown = markdownForEntries(entries, date);
      if (!markdown) {
        setButtonState(button, compact ? '–' : 'メモなし', 'empty');
        return;
      }

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

  async function openEntriesInChatGPT(entries, date, button, popup) {
    const prompt = promptForEntries(entries, date);
    if (!prompt) {
      if (popup && !popup.closed) popup.close();
      setButtonState(button, 'メモなし', 'empty');
      return;
    }

    const promptUrl = `${CHATGPT_BASE_URL}?prompt=${encodeURIComponent(prompt)}`;
    if (promptUrl.length <= CHATGPT_PROMPT_URL_LIMIT) {
      navigateToChatGPT(popup, promptUrl);
      setButtonState(button, 'ChatGPTを開いた ↗', 'success');
      return;
    }

    await writeClipboard(prompt);
    navigateToChatGPT(popup, CHATGPT_BASE_URL);
    setButtonState(button, '長文をコピーして開いた', 'success');
  }

  async function openCurrentDayInChatGPT(button) {
    if (button.dataset.busy === '1') return;
    button.dataset.busy = '1';
    setButtonState(button, '準備中…', 'busy');
    const popup = openPendingChatWindow();

    try {
      const entries = await currentDayEntries();
      await openEntriesInChatGPT(entries, entries[0]?.date || null, button, popup);
    } catch (error) {
      console.error('[day-copy] ChatGPT handoff failed', error);
      if (popup && !popup.closed) popup.close();
      setButtonState(button, '接続できず', 'error');
    } finally {
      button.dataset.busy = '0';
      window.setTimeout(() => setButtonState(button, defaultLabel(button)), 2400);
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
    if (!dateRow || dateRow.querySelector(`#${BUTTON_ID}`) || dateRow.querySelector(`#${CHATGPT_BUTTON_ID}`)) return;

    const next = dateRow.querySelector('#next');
    if (!next) return;

    const actions = document.createElement('div');
    actions.className = 'day-actions';

    const copyButton = document.createElement('button');
    copyButton.id = BUTTON_ID;
    copyButton.type = 'button';
    copyButton.textContent = 'この日をコピー';
    copyButton.dataset.defaultLabel = 'この日をコピー';
    copyButton.setAttribute('aria-label', 'この日のメモをMarkdownでコピー');
    copyButton.title = 'この日のメモをMarkdownでコピー';
    copyButton.addEventListener('click', () => copyCurrentDay(copyButton));

    const chatButton = document.createElement('button');
    chatButton.id = CHATGPT_BUTTON_ID;
    chatButton.type = 'button';
    chatButton.textContent = 'ChatGPTで話す ↗';
    chatButton.dataset.defaultLabel = 'ChatGPTで話す ↗';
    chatButton.setAttribute('aria-label', 'この日のメモをChatGPTに渡して振り返る');
    chatButton.title = 'この日のメモをChatGPTに渡して振り返る';
    chatButton.addEventListener('click', () => openCurrentDayInChatGPT(chatButton));

    actions.append(copyButton, chatButton);
    dateRow.classList.add('has-day-copy');
    dateRow.insertBefore(actions, next);
  }

  function makeCompactCopyButton(date, className, label = '⧉') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.dataset.defaultLabel = label;
    button.dataset.compact = '1';
    button.dataset.copyDate = date;
    button.setAttribute('aria-label', `${headingForDate(date)}のメモをMarkdownでコピー`);
    button.title = `${headingForDate(date)}のメモをコピー`;
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
      section.setAttribute('aria-label', '日ごとのメモをコピー');
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
