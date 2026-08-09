(() => {
  'use strict';

  let scheduled = false;

  function findPanel(settings, headingText) {
    return [...settings.querySelectorAll('.panel')].find((panel) => panel.querySelector('h2')?.textContent.trim() === headingText);
  }

  function clearIndexedDbData() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('mydailylog');

      request.onerror = () => reject(request.error || new Error('IndexedDBを開けませんでした'));
      request.onsuccess = () => {
        const database = request.result;
        const storeNames = [...database.objectStoreNames];

        if (!storeNames.length) {
          database.close();
          resolve();
          return;
        }

        const transaction = database.transaction(storeNames, 'readwrite');
        storeNames.forEach((name) => transaction.objectStore(name).clear());
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error || new Error('IndexedDBを削除できませんでした'));
        };
      };
    });
  }

  function clearOwnedWebStorage(storage) {
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith('mydailylog-')) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  }

  async function clearDeviceStorage() {
    const firstCheck = window.confirm(
      'このブラウザに保存されているメモ、日付タイトル、設定、作業メモ、入力途中の下書きをすべて削除します。\n\nJSONバックアップとして保存済みのファイルは削除されません。\n\n続けますか？'
    );
    if (!firstCheck) return;

    const finalCheck = window.confirm(
      '最終確認です。\n\nこのブラウザ内のMyDailyLogデータは元に戻せません。\n「端末ストレージをすべて削除」を実行しますか？'
    );
    if (!finalCheck) return;

    try {
      await clearIndexedDbData();

      /* Remove live autosave fields before reload so pagehide handlers cannot
         write the just-deleted draft or side memo back into localStorage. */
      document.querySelector('.composer')?.remove();
      document.querySelector('#side-memo-panel')?.remove();

      clearOwnedWebStorage(localStorage);
      clearOwnedWebStorage(sessionStorage);

      window.alert('このブラウザに保存されていたMyDailyLogのデータを削除しました。');
      location.reload();
    } catch (error) {
      console.error(error);
      window.alert('データをすべて削除できませんでした。ブラウザを再読み込みして、もう一度試してください。');
    }
  }

  function syncStorageSummary(storagePanel) {
    storagePanel.querySelector('#request-storage')?.remove();

    [...storagePanel.querySelectorAll('p')].forEach((paragraph) => {
      const text = paragraph.textContent.trim();
      if (text.startsWith('端末ストレージ：')) {
        paragraph.remove();
        return;
      }

      if (text.startsWith('最終バックアップ：')) {
        const firstTextNode = [...paragraph.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
        if (firstTextNode) firstTextNode.textContent = firstTextNode.textContent.replace('最終バックアップ：', '最終JSONバックアップ：');
      }
    });
  }

  function syncActionLabels(settings) {
    const labels = new Map([
      ['#sample-data', 'サンプルデータを入れてみる'],
      ['#export-json', 'JSONで出力'],
      ['#export-csv', 'CSVで出力'],
    ]);

    labels.forEach((text, selector) => {
      const button = settings.querySelector(selector);
      if (button && button.textContent !== text) button.textContent = text;
    });

    const importInput = settings.querySelector('#import-json');
    const importLabel = importInput?.closest('label');
    if (importLabel) {
      const textNode = [...importLabel.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode && textNode.textContent.trim() !== 'JSONを取り込む') textNode.textContent = 'JSONを取り込む';
    }
  }

  function syncClearButton(settings) {
    const dataPanel = findPanel(settings, 'データ管理');
    if (!dataPanel) return;

    let button = dataPanel.querySelector('#clear-device-storage');
    const legacyButton = dataPanel.querySelector('#clear-data');

    if (legacyButton) {
      button = legacyButton.cloneNode(true);
      button.id = 'clear-device-storage';
      button.textContent = '端末ストレージをすべて削除';
      button.classList.add('danger');
      legacyButton.replaceWith(button);
    }

    if (!button) return;

    button.textContent = '端末ストレージをすべて削除';
    button.classList.add('danger');

    if (!button.dataset.fullStorageClearBound) {
      button.dataset.fullStorageClearBound = 'true';
      button.addEventListener('click', clearDeviceStorage);
    }

    if (!dataPanel.querySelector('.storage-clear-note')) {
      const note = document.createElement('p');
      note.className = 'storage-clear-note';
      note.textContent = 'メモ・日付タイトル・設定・作業メモ・入力途中の下書きを、このブラウザから削除します。';
      button.before(note);
    }
  }

  function syncSettingsStorageHelp() {
    scheduled = false;
    const settings = document.querySelector('.settings');
    if (!settings) return;

    const aiPanel = findPanel(settings, 'AI');
    if (aiPanel) aiPanel.remove();

    syncActionLabels(settings);
    syncClearButton(settings);

    const storagePanel = findPanel(settings, 'データの安心') || findPanel(settings, 'データ保存');
    if (!storagePanel) return;

    syncStorageSummary(storagePanel);

    const heading = storagePanel.querySelector('h2');
    if (heading) heading.textContent = 'データ保存';

    if (storagePanel.querySelector('.storage-heading-row')) return;

    const row = document.createElement('div');
    row.className = 'storage-heading-row';

    const helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.className = 'storage-help-toggle';
    helpButton.textContent = '?';
    helpButton.setAttribute('aria-label', '保存先について');
    helpButton.setAttribute('aria-expanded', 'false');
    helpButton.setAttribute('aria-controls', 'data-storage-help');

    const help = document.createElement('div');
    help.id = 'data-storage-help';
    help.className = 'data-storage-help';
    help.hidden = true;
    help.innerHTML = `
      <p><strong>メモはクラウドには保存されません。</strong> この端末の、このブラウザ内に保存されます。</p>
      <p>保存先はブラウザのサイトデータ（IndexedDB）です。ログインや端末間の自動同期はありません。</p>
      <p>ブラウザのサイトデータを削除したり、端末やブラウザを変えたりすると、メモを引き継げない場合があります。残しておきたいメモは「JSONで出力」で保存してください。</p>`;

    if (heading) row.append(heading);
    row.append(helpButton);
    storagePanel.prepend(row);
    row.after(help);

    helpButton.addEventListener('click', () => {
      const open = help.hidden;
      help.hidden = !open;
      helpButton.setAttribute('aria-expanded', String(open));
      helpButton.classList.toggle('is-open', open);
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(syncSettingsStorageHelp);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
