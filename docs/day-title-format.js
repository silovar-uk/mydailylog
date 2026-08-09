(() => {
  'use strict';

  let scheduled = false;

  function syncDayTitlePlaceholder() {
    scheduled = false;
    const heading = document.querySelector('.date-row h1')?.textContent || '';
    const match = heading.match(/(\d{1,2})月\s*(\d{1,2})日/);
    const input = document.querySelector('#daytitle');
    if (!match || !input) return;

    const placeholder = `${Number(match[1])}月${Number(match[2])}日のタイトル`;
    input.placeholder = placeholder;
    input.setAttribute('aria-label', placeholder);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(syncDayTitlePlaceholder);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
