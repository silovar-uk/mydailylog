(() => {
  'use strict';

  let scheduled = false;

  const NAV_ITEMS = {
    today: {
      label: '今日',
      icon: '<path d="M13 21h8"/><path d="m15 5 4 4"/><path d="M17 3a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    },
    calendar: {
      label: '日めくり',
      icon: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    },
    search: {
      label: '検索',
      icon: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    },
    settings: {
      label: '設定',
      icon: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
    },
  };

  function createNavIcon(pathMarkup) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.classList.add('nav-icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('focusable', 'false');
    icon.innerHTML = pathMarkup;
    return icon;
  }

  function redirectRemovedRoute() {
    if (location.hash !== '#/review') return false;
    location.hash = '#/today';
    return true;
  }

  function syncNavLabels() {
    Object.entries(NAV_ITEMS).forEach(([route, { icon, label }]) => {
      const button = document.querySelector(`[data-route="${route}"]`);
      if (!button) return;

      const expectedKey = `svg-v1:${label}`;
      if (button.dataset.navLabelKey !== expectedKey || !button.querySelector('.nav-item-inner')) {
        const inner = document.createElement('span');
        inner.className = 'nav-item-inner';

        const iconSlot = document.createElement('span');
        iconSlot.className = 'nav-icon-slot';
        iconSlot.setAttribute('aria-hidden', 'true');
        iconSlot.append(createNavIcon(icon));

        const labelSlot = document.createElement('span');
        labelSlot.className = 'nav-label-slot';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'nav-label';
        labelSpan.textContent = label;

        labelSlot.append(labelSpan);
        inner.append(iconSlot, labelSlot);
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
      min-height: 78px;
      align-items: flex-end;
      justify-content: center;
      padding: 5px 3px 7px;
      line-height: 1;
    }

    .nav.nav-without-review .nav-item-inner {
      display: grid;
      grid-template-rows: 20px 46px;
      justify-items: center;
      align-items: end;
      gap: 3px;
      min-width: 24px;
      height: 69px;
      line-height: 1;
    }

    .nav.nav-without-review .nav-icon-slot {
      display: grid;
      width: 20px;
      height: 20px;
      place-items: center;
      line-height: 1;
    }

    .nav.nav-without-review .nav-icon {
      display: block;
      width: 20px;
      height: 20px;
      overflow: visible;
      vector-effect: non-scaling-stroke;
    }

    .nav.nav-without-review .nav-label-slot {
      display: grid;
      width: 18px;
      height: 46px;
      align-items: end;
      justify-items: center;
    }

    .nav.nav-without-review .nav-label {
      display: block;
      width: 1em;
      height: 44px;
      color: inherit;
      font-size: 11px;
      line-height: 1;
      letter-spacing: .08em;
      text-align: end;
      white-space: nowrap;
      writing-mode: vertical-rl;
      text-orientation: upright;
    }

    @media (max-width: 799px) {
      .nav.nav-without-review {
        border-top-color: color-mix(in srgb, var(--line), transparent 28%);
        background: color-mix(in srgb, var(--soft), var(--paper) 30%);
      }

      .nav.nav-without-review button {
        min-height: 42px;
        margin: 2px 3px;
        align-items: center;
        padding: 3px 2px 4px;
        border-radius: 8px;
        background: transparent;
        color: color-mix(in srgb, var(--faint), transparent 14%);
        font-weight: 400;
        transition: background .14s ease, color .14s ease, box-shadow .14s ease, transform .08s ease;
      }

      .nav.nav-without-review .nav-item-inner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 0;
        height: auto;
        line-height: 1;
      }

      .nav.nav-without-review .nav-icon-slot {
        width: 16px;
        height: 16px;
        flex: 0 0 16px;
        opacity: .62;
      }

      .nav.nav-without-review .nav-icon {
        width: 16px;
        height: 16px;
      }

      .nav.nav-without-review .nav-label-slot {
        display: block;
        width: auto;
        height: auto;
      }

      .nav.nav-without-review .nav-label {
        display: block;
        width: auto;
        height: auto;
        font-size: 10.5px;
        line-height: 1;
        letter-spacing: .01em;
        text-align: center;
        white-space: nowrap;
        writing-mode: horizontal-tb;
        text-orientation: mixed;
      }

      .nav.nav-without-review button.active {
        background: color-mix(in srgb, var(--line), var(--soft) 58%);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--line), var(--faint) 14%);
        color: color-mix(in srgb, var(--ink), var(--faint) 18%);
        font-weight: 600;
        transform: translateY(1px);
      }

      .nav.nav-without-review button.active .nav-icon-slot {
        opacity: .88;
      }
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
