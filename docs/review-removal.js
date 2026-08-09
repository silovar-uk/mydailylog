(() => {
  'use strict';

  let scheduled = false;

  const NAV_LABELS = {
    today: ['📝 今日', '今日'],
    calendar: ['📅 日めくり', '日めくり'],
    search: ['🔎 検索', '検索'],
    settings: ['⚙️ 設定', '設定'],
  };

  function redirectRemovedRoute() {
    if (location.hash !== '#/review') return false;
    location.hash = '#/today';
    return true;
  }

  function normalizeReviewWording() {
    const selectors = [
      '.sub',
      '.nav button',
      '.panel h2',
      '.panel p',
      '.section-copy',
      '.review-tabs button',
    ];

    document.querySelectorAll(selectors.join(',')).forEach((element) => {
      if (element.textContent.includes('ふり返る')) {
        element.textContent = element.textContent.replaceAll('ふり返る', '振り返る');
      }
      if (element.textContent.includes('ふり返り')) {
        element.textContent = element.textContent.replaceAll('ふり返り', '振り返り');
      }
    });
  }

  function syncNavLabels() {
    Object.entries(NAV_LABELS).forEach(([route, [label, ariaLabel]]) => {
      const button = document.querySelector(`[data-route="${route}"]`);
      if (!button) return;
      if (button.textContent !== label) button.textContent = label;
      button.setAttribute('aria-label', ariaLabel);
    });
  }

  function removeReviewUi() {
    scheduled = false;

    if (redirectRemovedRoute()) return;

    document.querySelectorAll('[data-route="review"]').forEach((button) => button.remove());

    const nav = document.querySelector('.nav');
    if (nav) nav.classList.add('nav-without-review');

    document.querySelectorAll('.review, .review-tabs, .stats, .barrow').forEach((element) => element.remove());
    normalizeReviewWording();
    syncNavLabels();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(removeReviewUi);
  }

  const style = document.createElement('style');
  style.textContent = `
    .nav.nav-without-review {
      grid-template-columns: repeat(4, 1fr) !important;
    }
  `;
  document.head.append(style);

  window.addEventListener('hashchange', () => {
    if (!redirectRemovedRoute()) schedule();
  });

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (!redirectRemovedRoute()) schedule();
})();
