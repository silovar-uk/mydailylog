(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 799px)';
  const STYLE_ID = 'mobile-composer-flow-style';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 799px) {
        html {
          scroll-padding-bottom: calc(190px + env(safe-area-inset-bottom));
        }

        .composer[data-mobile-title-flow="1"] {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 44px;
          grid-template-areas:
            "title title"
            "body send";
          align-items: end;
          gap: 6px 8px;
          padding-top: 8px;
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
        }

        .composer[data-mobile-title-flow="1"] #composer-title {
          grid-area: title;
          display: block;
          width: 100%;
          min-width: 0;
          border: 0;
          border-bottom: 1px solid var(--line);
          border-radius: 0;
          background: transparent;
          padding: 5px 4px 8px;
          color: var(--ink);
          font-family: 'Shippori Mincho', serif;
          font-size: 16px;
          line-height: 1.45;
        }

        .composer[data-mobile-title-flow="1"] #composer {
          grid-area: body;
          display: block;
          width: 100%;
          min-width: 0;
          min-height: 72px;
          max-height: min(28vh, 180px);
          resize: none;
          padding: 9px 7px;
          line-height: 1.65;
          overflow-y: auto;
        }

        .composer[data-mobile-title-flow="1"] #send {
          grid-area: send;
          align-self: end;
          min-width: 44px;
          min-height: 44px;
        }

        .composer[data-mobile-title-flow="1"] #composer-title:focus,
        .composer[data-mobile-title-flow="1"] #composer:focus {
          outline: none;
        }

        .composer[data-mobile-title-flow="1"] #composer-title:focus {
          border-bottom-color: var(--seal);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceComposer() {
    ensureStyles();

    const composer = document.querySelector('.composer');
    const title = composer?.querySelector('#composer-title');
    const textarea = composer?.querySelector('#composer');
    const send = composer?.querySelector('#send');
    if (!composer || !title || !textarea || !send) return;

    composer.dataset.mobileTitleFlow = '1';
    delete composer.dataset.mobileComposerStep;
    send.setAttribute('aria-label', 'ログを追加');
    send.setAttribute('title', 'ログを追加');

    if (window.matchMedia(MOBILE_QUERY).matches) {
      title.setAttribute('enterkeyhint', 'next');
      textarea.setAttribute('enterkeyhint', 'enter');
    }
  }

  document.addEventListener('keydown', (event) => {
    if (!event.target?.matches?.('#composer-title')) return;
    if (event.key !== 'Enter' || event.isComposing || !window.matchMedia(MOBILE_QUERY).matches) return;

    event.preventDefault();
    const textarea = document.querySelector('#composer');
    textarea?.focus();
    const end = textarea?.value?.length || 0;
    textarea?.setSelectionRange?.(end, end);
  });

  const observer = new MutationObserver(enhanceComposer);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.matchMedia(MOBILE_QUERY).addEventListener?.('change', enhanceComposer);
  enhanceComposer();
})();