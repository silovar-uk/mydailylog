(() => {
  'use strict';

  let scheduled = false;

  const replaceText = (selector, from, to) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (node.textContent.trim() === from) node.textContent = to;
    });
  };

  function syncRouteCopy() {
    const routeCopy = new Map([
      ['今日を残す', 'ちっちゃく書いてみる'],
      ['日を眺める', '日付から見る'],
      ['ふり返る', 'ふり返る'],
      ['探す', '前に書いたことを探す'],
      ['整える', '設定を変える'],
    ]);

    document.querySelectorAll('.sub').forEach((node) => {
      const next = routeCopy.get(node.textContent.trim());
      if (next && node.textContent !== next) node.textContent = next;
    });
  }

  function syncTodayCopy() {
    replaceText('.empty', 'まだログがない。下の欄から、今日の断片を残そう。', '入力はこれから。ちょっとだけ書いてみよう。');

    const composer = document.querySelector('#composer');
    if (composer?.placeholder?.startsWith('今日のログを書く…')) {
      composer.placeholder = composer.placeholder.replace('今日のログを書く…', '今日のメモを書く…');
    }

    const heading = document.querySelector('.date-row h1')?.textContent || '';
    const match = heading.match(/(\d{1,2})月\s*(\d{1,2})日\s*\(([^)]+)\)/);
    const dayTitle = document.querySelector('#daytitle');
    if (match && dayTitle) {
      const placeholder = `${Number(match[1])}/${Number(match[2])}(${match[3]})のタイトル`;
      dayTitle.placeholder = placeholder;
      dayTitle.setAttribute('aria-label', placeholder);
    }
  }

  function syncEditCopy() {
    replaceText('#detail-modal .eyebrow', 'ログを整える', 'メモを整える');
    replaceText('#detail-title', 'ログの詳細', 'メモの詳細');
    replaceText('.inline-log-editor-heading strong', 'ログを整える', 'メモを整える');
    replaceText('.inline-log-editor-heading span', 'カードの中で、そのまま編集', 'そのまま編集');

    document.querySelectorAll('#composer-title, #entry-title-runtime').forEach((input) => {
      if (input.placeholder === '題名（任意）') input.placeholder = '題名（なくてもOK）';
    });

    document.querySelectorAll('.runtime-title-field').forEach((label) => {
      [...label.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('題名（任意）')) {
          node.textContent = node.textContent.replace('題名（任意）', '題名（なくてもOK）');
        }
      });
    });
  }

  function syncReviewCopy() {
    replaceText('.section-copy', '特大イベントを開くと、前後3日のログを一続きで読める。', '特大イベントを開くと、前後3日のメモを一続きで読める。');
  }

  function syncRelatedCopy() {
    replaceText('.related-log-preview header p', '関連ログ', '関連メモ');
    replaceText('.related-log-panel > p', '内容が近いログ', '内容が近いメモ');
    replaceText('.related-log-preview h2', '無題のログ', '無題のメモ');
    replaceText('.related-log-link strong', '無題のログ', '無題のメモ');
  }

  function syncSearchCopy() {
    replaceText('.search h1', 'ログを探す', 'メモを探す');
  }

  function syncMoodMeter() {
    const buttons = [...document.querySelectorAll('.moods button[data-mood]')];
    if (!buttons.length) return;

    const selected = Number(buttons.find((button) => button.classList.contains('on'))?.dataset.mood || 0);
    buttons.forEach((button) => {
      const level = Number(button.dataset.mood || 0);
      button.dataset.meterFilled = level > 0 && level <= selected ? 'true' : 'false';
      button.dataset.meterLevel = String(level);
    });
  }

  function sync() {
    scheduled = false;
    syncRouteCopy();
    syncTodayCopy();
    syncEditCopy();
    syncReviewCopy();
    syncRelatedCopy();
    syncSearchCopy();
    syncMoodMeter();
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scheduleSync();
})();
