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
      align-items: stretch;
    }

    .nav.nav-without-review button {
      display: flex;
      min-height: 52px;
      align-items: flex-end;
      justify-content: center;
      padding: 0 4px 9px;
      line-height: 1;
    }

    .nav.nav-without-review .nav-item-inner {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      line-height: 1;
      white-space: nowrap;
    }

    .nav.nav-without-review .nav-emoji {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.15em;
      height: 1.15em;
      flex: 0 0 1.15em;
      font-size: 13px;
      line-height: 1;
    }

    .nav.nav-without-review .nav-label {
      display: inline-block;
      line-height: 1;
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
