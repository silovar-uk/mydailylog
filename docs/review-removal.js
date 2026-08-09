(() => {
  'use strict';

  let scheduled = false;

  const NAV_LABELS = {
    today: ['📝', '今日'],
    calendar: ['📅', '日めくり'],
    search: ['🔎', '検索'],
    settings: ['⚙️', '設定'],
  };

  function redirectRemovedRoute() {
    if (location.hash !== '#/review') return false;
    location.hash = '#/today';
    return true;
  }

  function syncNavLabels() {
    Object.entries(NAV_LABELS).forEach(([route, [emoji, label]]) => {
      const button = document.querySelector(`[data-route="${route}"]`);
      if (!button) return;

      const expectedKey = `${emoji}:${label}`;
      if (button.dataset.navLabelKey !== expectedKey || !button.querySelector('.nav-item-inner')) {
        const inner = document.createElement('span');
        inner.className = 'nav-item-inner';

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'nav-emoji';
        emojiSpan.setAttribute('aria-hidden', 'true');
        emojiSpan.textContent = emoji;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'nav-label';
        labelSpan.textContent = label;

        inner.append(emojiSpan, labelSpan);
        button.replaceChildren(inner);
        button.dataset.navLabelKey = expectedKey;
      }

      button.setAttribute('aria-label', label);
    });
  }

  function cleanRemovedUi() {
    document.querySelectorAll('[data-route="review"], .review, .review-tabs, .stats, .barrow').forEach((node) => node.remove());
    document.querySelectorAll('.obi').forEach((node) => node.remove());
    document.querySelectorAll('.related-log-panel, .related-log-preview-backdrop, .log-card-related-toggle').forEach((node) => node.remove());
  }

  function refreshUi() {
    scheduled = false;
    if (redirectRemovedRoute()) return;

    cleanRemovedUi();

    const nav = document.querySelector('.nav');
    if (nav) nav.classList.add('nav-without-review');

    syncNavLabels();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refreshUi);
  }

  const style = document.createElement('style');
  style.textContent = `
    .obi,
    .related-log-panel,
    .related-log-preview-backdrop,
    .log-card-related-toggle {
      display: none !important;
    }

    .nav.nav-without-review {
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      align-items: stretch;
    }

    .nav.nav-without-review button {
      display: flex;
      min-width: 0;
      min-height: 58px;
      align-items: flex-end;
      justify-content: center;
      padding: 5px 3px 8px;
      line-height: 1;
    }

    .nav.nav-without-review .nav-item-inner {
      display: flex;
      min-width: 0;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 3px;
      line-height: 1;
      white-space: nowrap;
    }

    .nav.nav-without-review .nav-emoji {
      display: flex;
      width: 20px;
      height: 18px;
      align-items: flex-end;
      justify-content: center;
      font-size: 15px;
      line-height: 1;
    }

    .nav.nav-without-review .nav-label {
      display: block;
      font-size: 11px;
      line-height: 13px;
      letter-spacing: 0;
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
