(() => {
  'use strict';

  let scheduled = false;

  const replaceExactText = (selector, from, to) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (node.textContent.trim() === from) node.textContent = to;
    });
  };

  const replaceSystemText = (selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (node.textContent.includes('ログ')) node.textContent = node.textContent.replaceAll('ログ', 'メモ');
    });
  };

  const replaceAttr = (selector, attr) => {
    document.querySelectorAll(selector).forEach((node) => {
      const value = node.getAttribute(attr);
      if (value?.includes('ログ')) node.setAttribute(attr, value.replaceAll('ログ', 'メモ'));
    });
  };

  function syncVisibleTerminology() {
    replaceExactText('#detail-modal .eyebrow', 'ログを整える', 'メモを整える');
    replaceExactText('#detail-title', 'ログの詳細', 'メモの詳細');
    replaceExactText('.inline-log-editor-heading strong', 'ログを整える', 'メモを整える');
    replaceExactText('.search h1', 'ログを探す', 'メモを探す');
    replaceExactText('.related-log-preview header p', '関連ログ', '関連メモ');
    replaceExactText('.related-log-panel > p', '内容が近いログ', '内容が近いメモ');
    replaceExactText('.related-log-preview h2', '無題のログ', '無題のメモ');
    replaceExactText('.related-log-link strong', '無題のログ', '無題のメモ');
    replaceExactText('.review .stats span', 'ログ', 'メモ');

    replaceSystemText('.empty');
    replaceSystemText('.context-empty');
    replaceSystemText('.section-copy');
    replaceSystemText('#copy-day-logs');
    replaceSystemText('.calendar-day-copy');
    replaceSystemText('.review-day-copy');
    replaceSystemText('.context-day-copy');

    const composer = document.querySelector('#composer');
    if (composer?.placeholder?.includes('ログ')) composer.placeholder = composer.placeholder.replaceAll('ログ', 'メモ');

    const inlineContent = document.querySelector('.inline-log-content');
    if (inlineContent?.placeholder?.includes('ログ')) inlineContent.placeholder = inlineContent.placeholder.replaceAll('ログ', 'メモ');

    const titleInputs = document.querySelectorAll('#composer-title, #entry-title-runtime');
    titleInputs.forEach((input) => {
      const label = input.getAttribute('aria-label');
      if (label?.includes('ログ')) input.setAttribute('aria-label', label.replaceAll('ログ', 'メモ'));
    });

    const attrTargets = '.obi, .composer, #send, [data-delete], .calday, #copy-day-logs, .calendar-day-copy, .review-day-copy, .context-day-copy, .review-day-copy-section';
    replaceAttr(attrTargets, 'aria-label');
    replaceAttr(attrTargets, 'title');
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncVisibleTerminology();
    });
  }

  const nativeConfirm = window.confirm.bind(window);
  window.confirm = (message) => nativeConfirm(typeof message === 'string' ? message.replaceAll('ログ', 'メモ') : message);

  const nativeAlert = window.alert.bind(window);
  window.alert = (message) => nativeAlert(typeof message === 'string' ? message.replaceAll('ログ', 'メモ') : message);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
