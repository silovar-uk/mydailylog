(() => {
  'use strict';

  const isTodayRoute = () => !location.hash || location.hash === '#/today';

  function getElements() {
    return {
      panel: document.querySelector('#side-memo-panel'),
      toggle: document.querySelector('#side-memo-toggle'),
      close: document.querySelector('#side-memo-close'),
    };
  }

  function decorateShortcutLabels() {
    const { toggle, close } = getElements();
    if (toggle) title(toggle, 'メモを開く（Alt + ←）');
    if (close) title(close, 'メモを閉じる（Alt + →）');
  }

  function title(element, text) {
    if (element.title !== text) element.title = text;
  }

  function openMemo() {
    if (!isTodayRoute()) return;
    const { panel, toggle } = getElements();
    if (!panel || !toggle || panel.classList.contains('is-open')) return;
    toggle.click();
  }

  function closeMemo() {
    const { panel, close } = getElements();
    if (!panel?.classList.contains('is-open')) return;
    close?.click();
  }

  document.addEventListener('keydown', (event) => {
    if (
      event.isComposing
      || !event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
      || !['ArrowLeft', 'ArrowRight'].includes(event.key)
      || !isTodayRoute()
    ) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.key === 'ArrowLeft') openMemo();
    if (event.key === 'ArrowRight') closeMemo();
  }, true);

  const observer = new MutationObserver(decorateShortcutLabels);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  decorateShortcutLabels();
})();
