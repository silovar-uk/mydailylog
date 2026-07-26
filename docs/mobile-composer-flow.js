(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 799px)';
  const STYLE_ID = 'mobile-composer-flow-style';

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 799px) {
        .composer[data-mobile-title-flow="1"] {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 44px;
          grid-template-rows: auto auto;
          align-items: end;
        }

        .composer[data-mobile-title-flow="1"] #composer-title {
          width: 100%;
          min-width: 0;
          border: 0;
          background: transparent;
          padding: 7px;
          font-family: 'Shippori Mincho', serif;
          font-size: 16px;
          line-height: 1.6;
        }

        .composer[data-mobile-title-flow="1"][data-mobile-composer-step="title"] #composer-title {
          grid-column: 1;
          grid-row: 1;
        }

        .composer[data-mobile-title-flow="1"][data-mobile-composer-step="title"] #composer {
          display: none;
        }

        .composer[data-mobile-title-flow="1"][data-mobile-composer-step="title"] #send {
          grid-column: 2;
          grid-row: 1;
        }

        .composer[data-mobile-title-flow="1"][data-mobile-composer-step="body"] #composer-title {
          grid-column: 1 / -1;
          grid-row: 1;
          border-bottom: 1px solid var(--line);
          padding-bottom: 8px;
        }

        .composer[data-mobile-title-flow="1"][data-mobile-composer-step="body"] #composer {
          display: block;
          grid-column: 1;
          grid-row: 2;
          min-width: 0;
        }

        .composer[data-mobile-title-flow="1"][data-mobile-composer-step="body"] #send {
          grid-column: 2;
          grid-row: 2;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setStep(composer, step, focusBody = false) {
    const textarea = composer.querySelector('#composer');
    const send = composer.querySelector('#send');
    if (!textarea || !send) return;

    composer.dataset.mobileComposerStep = step;
    send.setAttribute('aria-label', step === 'title' ? '本文入力へ進む' : 'ログを追加');
    send.setAttribute('title', step === 'title' ? '本文入力へ進む' : 'ログを追加');

    if (focusBody) {
      textarea.focus();
      const end = textarea.value.length;
      textarea.setSelectionRange?.(end, end);
    }
  }

  function enhanceComposer() {
    ensureStyles();

    const composer = document.querySelector('.composer');
    const title = composer?.querySelector('#composer-title');
    const textarea = composer?.querySelector('#composer');
    const send = composer?.querySelector('#send');
    if (!composer || !title || !textarea || !send) return;

    composer.dataset.mobileTitleFlow = '1';

    if (!isMobile()) {
      setStep(composer, 'body');
      return;
    }

    if (!composer.dataset.mobileComposerStep) {
      setStep(composer, 'title');
    }
  }

  function moveToBody(event) {
    const composer = event.target?.closest?.('.composer[data-mobile-title-flow="1"]');
    if (!composer || !isMobile() || composer.dataset.mobileComposerStep !== 'title') return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    setStep(composer, 'body', true);
    return true;
  }

  document.addEventListener('click', (event) => {
    if (!event.target?.closest?.('#send')) return;
    moveToBody(event);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!event.target?.matches?.('#composer-title')) return;
    if (event.key !== 'Enter' || event.isComposing) return;
    moveToBody(event);
  }, true);

  const observer = new MutationObserver(enhanceComposer);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.matchMedia(MOBILE_QUERY).addEventListener?.('change', enhanceComposer);
  enhanceComposer();
})();
