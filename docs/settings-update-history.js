(() => {
  'use strict';

  let scheduled = false;

  const HISTORY = [
    {
      date: '2026/08/10',
      items: [
        '既存メモをクリックしたとき、その場で直接編集できる動線を安定化。',
        '編集中は新規メモ入力欄や他のカードを引っ込め、編集欄を画面いっぱいに近い大きさで表示。',
        '編集中にも本文の文字数がリアルタイムで分かるようにした。',
        'カードの作成・更新日時と同じ列に文字数を表示するよう整理。',
        'メモのタイトルを約20pxに拡大し、本文との区別を少し強めた。',
        '関連メモ機能、振り返り、今日のメモ量ゲージなど、使わない機能を整理・削除。',
        '「その日のコピー」に各メモのタイトルを含めるよう変更。',
        '各メモのカードにも個別コピーボタンを追加。',
        'スマホの下部メニューを横書き・低い高さに変更し、背景と絵文字のトーンを落ち着かせた。',
        '選択中のメニューだけ薄いグレージュ背景にして、現在地が分かるようにした。',
        '設定画面に更新履歴を追加し、過去の主な改修も遡って掲載。',
      ],
    },
    {
      date: '2026/08/09',
      items: [
        '画面内の「ログ」という表記を、基本的に「メモ」へ統一。保存済み本文には手を加えない方式にした。',
        '日付タイトルのプレースホルダーを「8月9日のタイトル」のような形式へ変更。',
        '気分の5段階表示を、選んだ位置まで連続して色が付くメーター表現へ調整。',
        '設定からAI関連パネルを外し、保存先の説明を「データ保存」として整理。',
        'JSON・CSVの出力やJSON取り込みの表記を、実際の操作が分かりやすい言葉へ変更。',
        '端末内のMyDailyLogデータを二重確認して削除できる機能を追加。',
        '日ごとの「整える」を追加。全角英数字・全角スペース・行末空白など、安全な機械的整形だけをまとめて実行できるようにした。',
        '編集画面の見出しや常時ラベルを減らし、空欄のときだけ「題名」「本文」をプレースホルダー表示する形へ簡素化。',
      ],
    },
    {
      date: '2026/08/07',
      items: [
        'その日に書いたメモをMarkdown形式でまとめてコピーできる「この日をコピー」を追加。',
        '日付・時刻・本文をAIや別のノートへ渡しやすい形に整えて出力。',
        '今日だけでなく、日めくりなど過去の日付からも同じコピー操作を使えるようにした。',
        'コピーボタンの見た目をSecondary Actionとして控えめにし、日誌本文を邪魔しない配置へ調整。',
      ],
    },
    {
      date: '2026/07/29',
      items: [
        'メモカードを「後から読み返す」ことを意識した表示へ改修。',
        'カードの不要な並び替えを抑え、表示が勝手に動く感覚を減らした。',
        '作成・更新などのメタ情報とカード操作を整理し、本文を主役にする方向へ調整。',
        '作業メモを閉じているときにも、ショートカットの存在が分かる小さなヒントを追加。',
        'オフライン用キャッシュを更新し、追加したUIがPWAでも反映されるよう調整。',
      ],
    },
    {
      date: '2026/07/22',
      items: [
        '入力途中のメモを自動保存し、画面を離れても下書きを戻せるようにした。',
        '日誌本文とは別に使える「作業メモ」のサイドパネルを追加。',
        '作業メモをすばやく開閉・操作するためのキーボードショートカットを追加。',
        '既存メモをカード上で編集するインライン編集を導入。',
        '画面移動時に編集中状態が残り続けないよう、編集状態のリセット処理を追加。',
        'インライン編集まわりのキャッシュと表示を安定化。',
      ],
    },
    {
      date: '2026/07/10',
      items: [
        'PCでの新規入力欄のレイアウトを調整し、長めの文章を書きやすくした。',
        '複数行で入力した文章を、行ごとに別メモへ分割せず一つのメモとして保存するよう変更。',
        '各メモに任意のタイトルを付けられるようにした。',
        'タイトル付き・複数行メモが公開版でも正しく読み込まれるよう、ランタイム拡張とキャッシュを更新。',
      ],
    },
    {
      date: '2026/07/06',
      items: [
        'My Daily Log / 「日々の棚」として初版を公開。',
        '日付ごとのメモ、日付タイトル、気分、持ち越しメモを記録できる基本画面を実装。',
        '自由入力に加えて、食事・支出・運動などをすばやく残すクイック入力を用意。',
        '入力内容から食事・支出・運動・ゲームなどをルールベースで分類する仕組みを搭載。',
        'メモの本文・日付・時刻・種類・金額・タグ・重要度などを編集できる詳細画面を実装。',
        '「特大イベント」の前後の日を続けて読むイベントビューを搭載。',
        'カレンダー、月別集計、全文検索を用意。',
        'データはIndexedDBへローカル保存し、JSONバックアップ／復元、CSV出力に対応。',
        'PWAとしてオフライン利用、ライト／ダークモードに対応。',
        'GitHub Pagesのルートから完成版のdocsアプリへ正しく遷移するよう公開設定を修正。',
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
    intro.textContent = 'GitHubのコミット履歴をもとに、主な変更をまとめています。新しい変更は上に追加していきます。';
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
