(() => {
  'use strict';

  let scheduled = false;

  function findPanel(settings, headingText) {
    return [...settings.querySelectorAll('.panel')].find((panel) => panel.querySelector('h2')?.textContent.trim() === headingText);
  }

  function syncSettingsStorageHelp() {
    scheduled = false;
    const settings = document.querySelector('.settings');
    if (!settings) return;

    const aiPanel = findPanel(settings, 'AI');
    if (aiPanel) aiPanel.remove();

    const storagePanel = findPanel(settings, 'データの安心') || findPanel(settings, 'データ保存');
    if (!storagePanel) return;

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
      <p>ブラウザのサイトデータを削除したり、端末やブラウザを変えたりすると、メモを引き継げない場合があります。残しておきたいメモは「JSONをバックアップ」で保存してください。</p>
      <p>「この端末で保存を保護」は、ブラウザにデータを消去されにくくするよう依頼する機能です。クラウド保存に切り替えるものではありません。</p>`;

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
