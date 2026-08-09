(() => {
  'use strict';

  let scheduled = false;

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

  function removeReviewUi() {
    scheduled = false;

    if (redirectRemovedRoute()) return;

    document.querySelectorAll('[data-route="review"]').forEach((button) => button.remove());

    const nav = document.querySelector('.nav');
    if (nav) nav.classList.add('nav-without-review');

    document.querySelectorAll('.review, .review-tabs, .stats, .barrow').forEach((element) => element.remove());
    normalizeReviewWording();
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
