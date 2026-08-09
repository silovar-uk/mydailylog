(() => {
  'use strict';

  let scheduled = false;

  const HISTORY = [
    {
      date: '2026/08/10',
      items: [
        '既存メモをその場で編集できる動線を安定化。編集中は編集欄を大きく表示。',
        '編集中と表示後の両方で文字数を確認できるようにした。',
        'メモのタイトルを約20pxに拡大し、本文との区別を強めた。',
        '「その日のコピー」にタイトルを含め、個別メモにもコピーボタンを追加。',
        'スマホの下部メニューを横書き・低い高さにし、落ち着いた配色へ調整。',
        '設定画面に更新履歴を追加。',
      ],
    },
    {
      date: '2026/08/09',
      items: [
        '「ログ」の表記を「メモ」へ整理。',
        '振り返り・関連メモ・今日のメモ量ゲージなど、不要な機能を整理。',
        'データ保存の説明とJSON出力まわりの表記を見直した。',
      ],
    },
  ];

  function buildHistoryPanel() {
    const panel = document.createElement('section');
    panel.id = 'settings-update-history';
    panel.className = 'panel settings-update-history';

    const heading = document.createElement('h2');
    heading.textContent = '更新履歴';
    panel.append(heading);

    const intro = document.createElement('p');
    intro.className = 'update-history-intro';
    intro.textContent = '最近変わったところ。新しい変更は上に追加していきます。';
    panel.append(intro);

    const list = document.createElement('div');
    list.className = 'update-history-list';

    HISTORY.forEach((entry) => {
      const group = document.createElement('section');
      group.className = 'update-history-group';

      const date = document.createElement('time');
      date.className = 'update-history-date';
      date.textContent = entry.date;
      group.append(date);

      const items = document.createElement('ul');
      entry.items.forEach((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        items.append(item);
      });
      group.append(items);
      list.append(group);
    });

    panel.append(list);
    return panel;
  }

  function syncUpdateHistory() {
    scheduled = false;
    const settings = document.querySelector('.settings');
    if (!settings || settings.querySelector('#settings-update-history')) return;
    settings.append(buildHistoryPanel());
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(syncUpdateHistory);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
