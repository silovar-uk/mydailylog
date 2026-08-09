(() => {
  'use strict';

  let scheduled = false;

  function countCharacters(value) {
    const text = String(value || '').trim();
    if (!text) return 0;

    if (typeof Intl?.Segmenter === 'function') {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
      return [...segmenter.segment(text)].length;
    }

    return Array.from(text).length;
  }

  function decorateCard(card) {
    const content = card.querySelector('.entry-content');
    const timestamps = card.querySelector('.log-card-timestamps');
    if (!content || !timestamps) return;

    const count = countCharacters(content.textContent);
    let badge = timestamps.querySelector('.memo-char-count');

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'memo-char-count';
      badge.setAttribute('aria-label', '本文の文字数');
      timestamps.append(badge);
    }

    badge.textContent = `${count}字`;
  }

  function sync() {
    scheduled = false;
    document.querySelectorAll('.card').forEach(decorateCard);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  schedule();
})();
