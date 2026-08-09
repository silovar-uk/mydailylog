(() => {
  'use strict';

  const BRAND_NAME = '徒然日記';

  function syncUi() {
    document.querySelectorAll('.brand').forEach((brand) => {
      if (brand.textContent !== BRAND_NAME) brand.textContent = BRAND_NAME;
    });

    document.querySelectorAll('.carry-over').forEach((section) => section.remove());
  }

  const observer = new MutationObserver(syncUi);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  syncUi();
})();
