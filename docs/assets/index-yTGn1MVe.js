(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(o){if(o.ep)return;o.ep=!0;const i=a(o);fetch(o.href,i)}})();const c=(t,e=document)=>e.querySelector(t),h=(t,e=document)=>[...e.querySelectorAll(t)],ut={today:"ちっちゃく書いてみる",calendar:"日付から見る",search:"前に書いたことを探す",settings:"設定を変える"},pt={today:{label:"今日",icon:'<path d="M13 21h8"/><path d="m15 5 4 4"/><path d="M17 3a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'},calendar:{label:"日めくり",icon:'<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>'},search:{label:"検索",icon:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'},settings:{label:"設定",icon:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>'}},X=[{key:"default",label:"標準"},{key:"cream",label:"クリーム"},{key:"blue",label:"ブルー"},{key:"green",label:"グリーン"}],C="https://chatgpt.com/",z=7e3,Q="mydailylog-paper-mode",I="mydailylog-composer-draft:",T="mydailylog-side-memo",B="mydailylog-side-memo-open",g=()=>new Date().toISOString(),tt=()=>crypto.randomUUID?.()||`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,$=(t=new Date)=>t.toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"}),O=t=>new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"numeric",day:"numeric",weekday:"short",timeZone:"Asia/Tokyo"}).format(new Date(`${t}T12:00:00`)),_=(t,e)=>{const a=new Date(`${t}T12:00:00`);return a.setDate(a.getDate()+e),$(a)},mt=(t,e)=>{const a=new Date(`${t}T12:00:00`),n=a.getDate();return a.setDate(1),a.setMonth(a.getMonth()+e),a.setDate(Math.min(n,new Date(a.getFullYear(),a.getMonth()+1,0).getDate())),$(a)},ft=(t,e)=>{const a=new Date(`${t}T12:00:00`),n=a.getDate();return a.setFullYear(a.getFullYear()+e),a.getDate()!==n&&a.setDate(0),$(a)},k=(t="")=>String(t).replace(/[&<>'"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"})[e]),et=(t="")=>String(t).replace(/\\/g,"\\\\").replace(/\*/g,"\\*"),F=(t="")=>{const e=String(t).trim();return e?typeof Intl.Segmenter=="function"?[...new Intl.Segmenter("ja",{granularity:"grapheme"}).segment(e)].length:[...e].length:0},gt=t=>{if(!t)return"";const e=new Date(t);return Number.isNaN(e.getTime())?"":new Intl.DateTimeFormat("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:"Asia/Tokyo"}).format(e)},P=t=>t.time||t.createdAt,ht=()=>{const t=Number(new Intl.DateTimeFormat("en-US",{hour:"numeric",hourCycle:"h23",timeZone:"Asia/Tokyo"}).format(new Date));return t>=22||t<5},yt=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,v={get(t,e=null){try{const a=localStorage.getItem(t);return a===null?e:JSON.parse(a)}catch{return e}},set(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch{}},remove(t){try{localStorage.removeItem(t)}catch{}}},u={open(){return new Promise((t,e)=>{const a=indexedDB.open("mydailylog",1);a.onupgradeneeded=()=>{const n=a.result;n.createObjectStore("entries",{keyPath:"id"}).createIndex("date","date"),n.createObjectStore("days",{keyPath:"date"}),n.createObjectStore("settings",{keyPath:"key"})},a.onsuccess=()=>t(a.result),a.onerror=()=>e(a.error)})},async request(t,e,a){const n=await this.open();return new Promise((o,i)=>{const s=n.transaction(t,e),d=s.objectStore(t);let f;try{f=a(d)}catch(l){i(l)}s.oncomplete=()=>o(f),s.onerror=()=>i(s.error)})},put(t,e){return this.request(t,"readwrite",a=>a.put(e))},delete(t,e){return this.request(t,"readwrite",a=>a.delete(e))},get(t,e){return new Promise(async(a,n)=>{const i=(await this.open()).transaction(t).objectStore(t).get(e);i.onsuccess=()=>a(i.result),i.onerror=()=>n(i.error)})},all(t){return new Promise(async(e,a)=>{const o=(await this.open()).transaction(t).objectStore(t).getAll();o.onsuccess=()=>e(o.result),o.onerror=()=>a(o.error)})},byDate(t){return new Promise(async(e,a)=>{const o=(await this.open()).transaction("entries").objectStore("entries").index("date").getAll(t);o.onsuccess=()=>e(o.result.filter(i=>!i.deletedAt)),o.onerror=()=>a(o.error)})}};function at(){const t=location.hash.replace("#/","");return Object.hasOwn(ut,t)?t:"today"}let r={route:at(),date:$(),query:"",toast:null,editingId:null,justAddedId:null,menuOpenId:null,colorPopoverId:null,themeMenuOpen:!1,bookmarkOpen:!1},E=null,G=null,N=null;function nt(t){const e=t.trim();let a=0;/特大|面接|会見|旅行|遠征|開幕|発表|引っ越し/.test(e)&&(a=2);const n=(e.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)||[])[0]||null;return{importance:a,time:n}}async function ot(t){return await u.get("days",t)||{date:t,title:"",summary:"",mood:null,carryOver:"",updatedAt:g()}}async function R(t){t.updatedAt=g(),await u.put("days",t)}function bt(){return c("#app")}function S(){const t=v.get(Q,null);return t||(localStorage.getItem("mydailylog-theme")==="dark"?"night":"auto")}function vt(t){return t==="day"||t==="night"?t:ht()?"night":"day"}function J(){document.documentElement.dataset.paper=vt(S())}function wt(t){v.set(Q,t),J(),m()}setInterval(()=>{S()==="auto"&&J()},300*1e3);function L(t,e){if(!document.startViewTransition||yt()){e();return}document.documentElement.dataset.pageDir=t,document.startViewTransition(()=>e()).finished.finally(()=>{delete document.documentElement.dataset.pageDir})}function $t(t,{onPrev:e,onNext:a}){let n=0,o=0,i=!1;t.addEventListener("touchstart",s=>{if(s.target.closest("textarea, input, button, select, .memo-actions")){i=!1;return}i=!0,n=s.touches[0].clientX,o=s.touches[0].clientY},{passive:!0}),t.addEventListener("touchend",s=>{if(!i)return;i=!1;const d=s.changedTouches[0].clientX-n,f=s.changedTouches[0].clientY-o;Math.abs(d)<70||Math.abs(d)<Math.abs(f)*1.4||(d<0?a():e())},{passive:!0})}async function m(){h(".color-popover").forEach(a=>a.remove());const t=r.route;bt().innerHTML=`
    <main class="shell">
      <header class="top">
        <div class="brand">徒然日記</div>
        <div class="paper-mode${r.themeMenuOpen?" is-open":""}">
          <button class="theme" aria-label="紙の色を選ぶ" aria-haspopup="true" aria-expanded="${r.themeMenuOpen}">◐</button>
          <div class="theme-menu" role="menu">
            <button data-paper-mode="auto" class="${S()==="auto"?"on":""}">自動</button>
            <button data-paper-mode="day" class="${S()==="day"?"on":""}">昼</button>
            <button data-paper-mode="night" class="${S()==="night"?"on":""}">夜</button>
          </div>
        </div>
      </header>
      <section id="view"></section>
      <nav class="nav" aria-label="メインメニュー">
        ${Object.entries(pt).map(([a,{label:n,icon:o}])=>`
          <button data-route="${a}" class="${t===a?"active":""}" aria-label="${n}">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${o}</svg>
            <span>${n}</span>
          </button>`).join("")}
      </nav>
    </main>
    <div id="toast" aria-live="polite"></div>`,h("[data-route]").forEach(a=>{a.onclick=()=>st(a.dataset.route)});const e=c(".theme");e.onclick=a=>{a.stopPropagation(),r.themeMenuOpen=!r.themeMenuOpen,m()},h("[data-paper-mode]").forEach(a=>{a.onclick=()=>wt(a.dataset.paperMode)}),r.themeMenuOpen&&document.addEventListener("click",()=>{r.themeMenuOpen=!1,m()},{once:!0}),t==="today"&&await kt(),t==="calendar"&&await Ht(),t==="search"&&await Kt(),t==="settings"&&await Ut(),r.toast&&rt(r.toast),ee()}function st(t){r.route=t,r.editingId=null,r.bookmarkOpen=!1,location.hash!==`#/${t}`&&(location.hash=`#/${t}`),m()}window.addEventListener("mydailylog:open-day",t=>{const e=t.detail?.date;/^\d{4}-\d{2}-\d{2}$/.test(e)&&(r.date=e,r.route="today",r.editingId=null,r.menuOpenId=null,r.colorPopoverId=null,r.themeMenuOpen=!1,r.bookmarkOpen=!1,location.hash!=="#/today"&&history.pushState(null,"","#/today"),m())});async function kt(){const t=r.date,e=await ot(t),a=(await u.byDate(t)).sort((p,w)=>+!!w.pinned-+!!p.pinned||P(p).localeCompare(P(w))),[n,o,i]=t.split("-").map(Number),s=new Intl.DateTimeFormat("ja-JP",{weekday:"short",timeZone:"Asia/Tokyo"}).format(new Date(`${t}T12:00:00`)),d=e.mood?78-e.mood*14:55,f=v.get(`${I}${t}`,null),l=await Ft(t);c("#view").innerHTML=`
    <section class="paper" style="--mood-fade:${d}%">
      <div class="paper-head">
        <button id="prev" aria-label="前の日">‹</button>
        <div>
          <button type="button" class="mobile-memo-toggle" data-side-memo-toggle aria-label="作業メモを開く"><span aria-hidden="true">✎</span>メモ</button>
          <div class="date-figure">
            <span class="date-num">${i}</span>
            <span class="date-sub">${o}月<br>${s}曜</span>
          </div>
          <input id="daytitle" placeholder="${o}/${i}(${s})のタイトル" value="${k(e.title)}" aria-label="この日のタイトル" />
          <div class="mood-row">
            <span>気分</span>
            <div class="moods" aria-label="気分を選ぶ">
              ${[1,2,3,4,5].map(p=>`<button type="button" data-mood="${p}" data-level="${p}" class="${e.mood===p?"on":""}" aria-label="気分 ${p}"><i></i></button>`).join("")}
            </div>
          </div>
        </div>
        <button id="next" aria-label="次の日">›</button>
      </div>
      <div class="day-tools">
        <button id="copy-day-logs" data-default-label="この日をコピー">この日をコピー</button>
        <button id="chatgpt-day-logs" data-default-label="ChatGPTで話す ↗">ChatGPTで話す ↗</button>
        <button id="tidy-day-logs">整える</button>
        ${E&&E.date===t?'<button id="undo-day-tidy">元に戻す</button>':""}
      </div>
      ${l.length?Jt(l):""}
      <div class="entries-paper">
        ${a.length?a.map((p,w)=>q(p,{first:w===0||a[w-1].pinned&&!p.pinned})).join(""):'<div class="empty">入力はこれから。ちょっとだけ書いてみよう。</div>'}
      </div>
      <div class="composer" aria-label="今日に書く">
        <div class="composer-head">
          <span class="composer-label">今日に書く</span>
          <span class="composer-write-seal" aria-hidden="true">書</span>
        </div>
        <input id="composer-title" class="composer-title" type="text" autocomplete="off" placeholder="題名（なくてもOK）" value="${k(f?.title||"")}" aria-label="ログの題名 任意" />
        <div class="composer-row">
          <textarea id="composer" placeholder="今日のメモを書く…">${k(f?.text||"")}</textarea>
          <button type="button" class="send" id="send" aria-label="メモを追加">↑</button>
        </div>
        <div class="composer-meta">
          <span class="composer-hint">Ctrl / Cmd + Enterで記録</span>
          <span class="draft-status" id="draft-status" aria-live="polite">${f?.text||f?.title?"下書きを復元":""}</span>
        </div>
      </div>
    </section>`,c("#prev").onclick=()=>{L("prev",()=>{r.date=_(t,-1),m()})},c("#next").onclick=()=>{L("next",()=>{r.date=_(t,1),m()})},c("#daytitle").addEventListener("input",async p=>{e.title=p.target.value,await R(e)}),h("[data-mood]").forEach(p=>{p.onclick=async()=>{e.mood=e.mood===Number(p.dataset.mood)?null:Number(p.dataset.mood),await R(e),m()}}),Ct(t),Rt(t),it(c(".entries-paper")),qt();const y=c(".paper");$t(y,{onPrev:()=>c("#prev").click(),onNext:()=>c("#next").click()})}function q(t,{first:e=!1}={}){const a=t.id===r.editingId,n=t.id===r.menuOpenId,o=t.title?`<h3 class="memo-title">${k(t.title)}</h3>`:"",i=t.id===r.justAddedId?" seal-new":"",s=a?`
      <div class="memo-edit">
        <input class="memo-edit-title" type="text" autocomplete="off" placeholder="題名" value="${k(t.title||"")}" aria-label="題名" />
        <textarea class="memo-edit-content" placeholder="本文" aria-label="本文">${k(t.content)}</textarea>
        <div class="memo-edit-actions">
          <span class="memo-edit-status" data-status>${F(t.content)}字　Ctrl / Cmd + Enterで確定・Escで取消</span>
          <div class="memo-edit-buttons">
            <button type="button" class="memo-edit-cancel">取消</button>
            <button type="button" class="memo-edit-save">確定</button>
          </div>
        </div>
      </div>`:`<div class="memo-body" data-open="${t.id}">${o}<p class="memo-content">${k(t.content)}</p></div>`;return`
    <article class="memo${t.pinned?" is-pinned":""}${a?" is-editing":""}${n?" is-menu-open":""}" data-id="${t.id}" data-color="${t.cardColor||"default"}">
      <div class="memo-time">
        <time>${t.time||gt(t.createdAt).split(" ").pop()||""}</time>
        ${t.pinned?'<span aria-hidden="true">⌖</span>':""}
        ${t.favorite?'<span aria-hidden="true">★</span>':""}
        <span class="seal${e?" seal-first":""}${i}" aria-hidden="true">記</span>
        <span class="memo-dot" aria-hidden="true"></span>
      </div>
      ${s}
      ${a?"":`
      <button type="button" class="memo-more" data-menu-toggle="${t.id}" aria-label="操作を表示">⋯</button>
      <div class="memo-actions">
        <button type="button" class="memo-action log-card-copy" data-copy="${t.id}" aria-label="このメモをコピー" title="このメモをコピー"><span aria-hidden="true">⧉</span></button>
        <button type="button" class="memo-action log-card-chatgpt" data-gpt="${t.id}" aria-label="このメモをChatGPTで話す" title="このメモをChatGPTで話す"><span aria-hidden="true">GPT</span></button>
        <button type="button" class="memo-action log-card-pin" data-pin="${t.id}" aria-pressed="${!!t.pinned}" aria-label="${t.pinned?"ピン留めを外す":"ピン留めする"}"><span aria-hidden="true">⌖</span></button>
        <button type="button" class="memo-action log-card-favorite" data-favorite="${t.id}" aria-pressed="${!!t.favorite}" aria-label="${t.favorite?"お気に入りを外す":"お気に入りにする"}"><span aria-hidden="true">☆</span></button>
        <span class="memo-action memo-color-swatch" data-color-trigger="${t.id}" role="button" tabindex="0" aria-haspopup="true" aria-expanded="${r.colorPopoverId===t.id}" aria-label="背景色を変更">🎨
          <div class="color-popover${r.colorPopoverId===t.id?" is-open":""}">
            ${X.map(({key:d,label:f})=>`<button type="button" class="color-swatch" data-swatch="${d}" data-set-color="${t.id}" data-color-key="${d}" aria-pressed="${(t.cardColor||"default")===d}" aria-label="${f}に変更" title="${f}"></button>`).join("")}
          </div>
        </span>
        <button type="button" class="memo-action memo-delete" data-delete="${t.id}" aria-label="このメモを削除">×</button>
      </div>`}
    </article>`}function xt(){r.menuOpenId=null,r.colorPopoverId=null}function it(t){h(".memo-body[data-open]",t).forEach(a=>{a.onclick=()=>{r.editingId=a.dataset.open,m()}}),h("[data-menu-toggle]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation();const o=a.dataset.menuToggle;r.menuOpenId=r.menuOpenId===o?null:o,r.colorPopoverId=null,m()}}),h("[data-copy]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation(),Dt(a.dataset.copy,a)}}),h("[data-gpt]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation(),Mt(a.dataset.gpt,a)}}),h("[data-pin]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation(),U(a.dataset.pin,"pinned")}}),h("[data-favorite]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation(),U(a.dataset.favorite,"favorite")}}),h("[data-color-trigger]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation();const o=a.dataset.colorTrigger;r.colorPopoverId=r.colorPopoverId===o?null:o,r.menuOpenId=null,m()}}),h("[data-set-color]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation(),Tt(a.dataset.setColor,a.dataset.colorKey)}}),h("[data-delete]",t).forEach(a=>{a.onclick=n=>{n.stopPropagation(),Ot(a.dataset.delete)}});const e=c(".memo.is-editing",t);e&&Et(e),(r.menuOpenId||r.colorPopoverId)&&document.addEventListener("click",()=>{xt(),m()},{once:!0})}function Et(t){const e=t.dataset.id,a=c(".memo-edit-title",t),n=c(".memo-edit-content",t),o=c("[data-status]",t);let i=!1;const s=(l="Ctrl / Cmd + Enterで確定・Escで取消")=>{o.textContent=`${F(n.value)}字　${l}`},d=()=>{i||(r.editingId=null,m())},f=async()=>{if(i)return;const l=n.value.trim();if(!l){s("本文を入力して"),n.focus();return}i=!0,s("保存中…");const y=await u.get("entries",e);if(!y){r.editingId=null,m();return}y.title=a.value.trim(),y.content=l,y.updatedAt=g(),await u.put("entries",y),r.editingId=null,m()};n.addEventListener("input",()=>s()),t.addEventListener("keydown",l=>{(l.ctrlKey||l.metaKey)&&l.key==="Enter"&&(l.preventDefault(),f()),l.key==="Escape"&&(l.preventDefault(),d())}),c(".memo-edit-cancel",t).onclick=d,c(".memo-edit-save",t).onclick=f,n.focus(),n.setSelectionRange(n.value.length,n.value.length)}async function U(t,e){const a=await u.get("entries",t);a&&(a[e]=!a[e],a[`${e}At`]=a[e]?g():null,a.updatedAt=g(),await u.put("entries",a),m())}async function Tt(t,e){const a=await u.get("entries",t);a&&(a.cardColor=X.some(n=>n.key===e)?e:"default",a.updatedAt=g(),await u.put("entries",a),r.colorPopoverId=null,m())}function St(t){const e=String(t?.title||"").trim(),a=String(t?.content||"").trim();return e&&a?`**${et(e)}**
${a}`:e||a}async function D(t){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(t);return}const e=document.createElement("textarea");e.value=t,e.setAttribute("readonly",""),e.style.cssText="position:fixed;opacity:0;",document.body.append(e),e.select();const a=document.execCommand("copy");if(e.remove(),!a)throw new Error("copy failed")}async function Dt(t,e){if(e.dataset.busy==="1")return;e.dataset.busy="1";const a=c("span",e);try{const n=await u.get("entries",t),o=St(n);if(!o)throw new Error("empty memo");await D(o),a.textContent="✓"}catch{a.textContent="!"}finally{setTimeout(()=>{a.textContent="⧉",e.dataset.busy="0"},1200)}}function At(t){const e=String(t?.date||"").replace(/-/g,"/"),a=String(t?.content||"").trim();return a?e?`${e}

${a}`:a:""}async function Mt(t,e){if(e.dataset.busy==="1")return;e.dataset.busy="1";const a=c("span",e),n=window.open("about:blank","_blank");n&&(n.opener=null);try{const o=await u.get("entries",t),i=At(o);if(!i)throw new Error("empty memo");const s=`${C}?prompt=${encodeURIComponent(i)}`;s.length<=z&&n?(n.location.replace(s),a.textContent="✓"):(await D(i),n&&n.location.replace(C),a.textContent="✓")}catch{n&&!n.closed&&n.close(),a.textContent="!"}finally{setTimeout(()=>{a.textContent="GPT",e.dataset.busy="0"},1400)}}function Ct(t){const e=c(".composer"),a=c("#composer-title"),n=c("#composer"),o=c("#draft-status"),i=`${I}${t}`,s=()=>{if(!n.value.trim()&&!a.value.trim()){v.remove(i),o.textContent="";return}v.set(i,{title:a.value,text:n.value,updatedAt:g()}),o.textContent="下書き保存済み"},d=()=>{o.textContent="保存中…",clearTimeout(G),G=setTimeout(s,180)},f=()=>e.classList.toggle("is-active",document.activeElement===n||!!n.value.trim());n.addEventListener("focus",f),n.addEventListener("blur",()=>{f(),s()}),n.addEventListener("input",d),a.addEventListener("input",d),a.addEventListener("blur",s),a.addEventListener("keydown",l=>{l.key==="Enter"&&!l.isComposing&&(l.preventDefault(),n.focus())}),c("#send").onclick=()=>V(t),n.addEventListener("keydown",l=>{(l.metaKey||l.ctrlKey)&&l.key==="Enter"&&V(t)})}async function V(t){const e=c("#composer"),a=c("#composer-title"),n=e.value.trim();if(!n)return;const o=nt(n),i={id:tt(),date:t,time:o.time,title:a.value.trim(),content:n,type:"memo",amount:null,unit:null,tags:[],importance:o.importance,pinned:!1,pinnedAt:null,favorite:!1,favoriteAt:null,cardColor:"default",metadata:{},createdAt:g(),updatedAt:g(),deletedAt:null};await u.put("entries",i),v.remove(`${I}${t}`),r.justAddedId=i.id,m(),setTimeout(()=>{r.justAddedId=null},900)}async function Ot(t){const e=await u.get("entries",t);e&&(e.deletedAt=g(),await u.put("entries",e),r.editingId=null,j("削除した",async()=>{e.deletedAt=null,e.updatedAt=g(),await u.put("entries",e),m()}),m())}function j(t,e){r.toast={message:t,undo:e},rt(r.toast)}function rt(t){const e=c("#toast");e&&(e.innerHTML=`<div>${t.message}${t.undo?'<button id="undo">取り消す</button>':""}</div>`,t.undo&&(c("#undo").onclick=async()=>{await t.undo(),r.toast=null,e.innerHTML=""}),setTimeout(()=>{r.toast===t&&(r.toast=null,e.innerHTML="")},5e3))}function Pt(t){if(t.time)return t.time;const e=new Date(t.createdAt);return Number.isNaN(e.getTime())?"":new Intl.DateTimeFormat("ja-JP",{hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:"Asia/Tokyo"}).format(e)}function H(t){return t.slice().sort((e,a)=>P(e).localeCompare(P(a))||String(e.createdAt).localeCompare(String(a.createdAt)))}function Lt(t){const e=String(t.content||"").trim(),a=String(t.title||"").trim(),n=Pt(t);if(!e)return"";const o=e.split(/\r?\n/),s=n&&new RegExp(`^${n.replace(":","\\:")}(?:\\s|　|[：:-])`).test(o[0])||!n?"- ":`- ${n} `;return a?`${s}**${et(a)}**
${o.map(d=>`  ${d}`).join(`
`)}`:`${s}${o[0]}${o.slice(1).map(d=>`
  ${d}`).join("")}`}function Y(t,e){const a=H(t);if(!a.length)return"";const n=a.map(Lt).filter(Boolean).join(`
`);return`# ${e.replace(/-/g,"/")}
${n}`}function b(t,e,a=""){t.textContent=e,t.dataset.state=a}async function It(t,e){if(e.dataset.busy!=="1"){e.dataset.busy="1",b(e,"コピー中…","busy");try{const a=await u.byDate(t),n=Y(a,t);if(!n){b(e,"メモなし","empty");return}await D(n),b(e,"コピー済み ✓","success")}catch{b(e,"コピー失敗","error")}finally{e.dataset.busy="0",setTimeout(()=>b(e,e.dataset.defaultLabel),1800)}}}function jt(){const t=window.open("about:blank","_blank");if(!t)return null;try{t.opener=null,t.document.title="ChatGPTを開いています…",t.document.body.textContent="ChatGPTを開いています…"}catch{}return t}async function Nt(t,e){if(e.dataset.busy==="1")return;e.dataset.busy="1",b(e,"準備中…","busy");const a=jt();try{const n=await u.byDate(t),o=Y(n,t);if(!o){a&&a.close(),b(e,"メモなし","empty");return}const i=[`以下は${t.replace(/-/g,"/")}の日記です。`,"この日記について一緒に振り返ってください。要約だけで終わらず、印象に残る出来事や変化、気になった点を拾いながら対話してください。必要なら質問は一度に1つずつしてください。","",o].join(`
`),s=`${C}?prompt=${encodeURIComponent(i)}`;s.length<=z?(a&&!a.closed?a.location.replace(s):window.location.assign(s),b(e,"ChatGPTを開いた ↗","success")):(await D(i),a&&!a.closed&&a.location.replace(C),b(e,"長文をコピーして開いた","success"))}catch{a&&!a.closed&&a.close(),b(e,"接続できず","error")}finally{e.dataset.busy="0",setTimeout(()=>b(e,e.dataset.defaultLabel),2400)}}function W(t){return typeof t!="string"?t:t.replace(/[０-９Ａ-Ｚａ-ｚ]/g,e=>String.fromCharCode(e.charCodeAt(0)-65248)).replace(/　/g," ").replace(/[ \t]+$/gm,"")}async function Bt(t,e){if(!e.disabled){e.disabled=!0,b(e,"整え中…","busy");try{const a=await u.byDate(t);if(!a.length){b(e,"メモなし","empty");return}const n=a.map(s=>({...s})),i=a.map(s=>({...s,content:W(s.content||""),title:W(s.title||"")})).filter((s,d)=>JSON.stringify(s)!==JSON.stringify(n[d]));if(!i.length){b(e,"変更なし","empty");return}E={date:t,entries:n};for(const s of i)await u.put("entries",s);b(e,"整えた ✓","success"),setTimeout(m,400)}catch{b(e,"失敗","error")}finally{e.disabled=!1}}}async function _t(t){if(!(!E||t.disabled)){t.disabled=!0,t.textContent="戻し中…";for(const e of E.entries)await u.put("entries",e);E=null,m()}}function Rt(t){const e=c("#copy-day-logs");e.onclick=()=>It(t,e);const a=c("#chatgpt-day-logs");a.onclick=()=>Nt(t,a);const n=c("#tidy-day-logs");n.onclick=()=>Bt(t,n);const o=c("#undo-day-tidy");o&&(o.onclick=()=>_t(o))}async function Ft(t){const e=[{offset:mt(t,-1),label:"1か月前"},{offset:ft(t,-1),label:"1年前"}];return(await Promise.all(e.map(async({offset:n,label:o})=>({date:n,label:o,entries:await u.byDate(n)})))).filter(n=>n.entries.length)}function Jt(t){return`
    <div class="bookmarks">
      ${t.map(e=>`<button type="button" class="bookmark-tab" data-bookmark="${e.date}">栞・${e.label}</button>`).join("")}
    </div>
    ${r.bookmarkOpen?`
    <div class="bookmark-panel">
      ${t.map(e=>`
        <div>
          <h3>${e.label}・${O(e.date)}</h3>
          <div class="entries-paper">${H(e.entries).map(a=>q({...a,id:`bookmark-${a.id}`},{})).join("")}</div>
          <button type="button" class="bookmark-open" data-open-day="${e.date}">この日を開く</button>
        </div>`).join("")}
    </div>`:""}`}function qt(){h("[data-bookmark]").forEach(t=>{t.onclick=()=>{r.bookmarkOpen=!r.bookmarkOpen,m()}}),h("[data-open-day]").forEach(t=>{t.onclick=()=>{r.date=t.dataset.openDay,r.bookmarkOpen=!1,m()}})}async function Ht(){const t=new Date(`${r.date}T12:00:00`),e=new Date(t.getFullYear(),t.getMonth(),1),a=new Date(t.getFullYear(),t.getMonth()+1,0),[n,o]=await Promise.all([u.all("entries"),u.all("days")]),i=Object.fromEntries(o.map(l=>[l.date,l])),s=n.filter(l=>!l.deletedAt),d=$(),f=Array.from({length:a.getDate()},(l,y)=>{const p=$(new Date(t.getFullYear(),t.getMonth(),y+1)),w=s.filter(x=>x.date===p),A=w.reduce((x,dt)=>x+F(dt.content),0),M=w.some(x=>x.importance===2||x.type==="event"),lt=i[p]?.title||"";return{date:p,index:y,logs:w,chars:A,major:M,title:lt}});c("#view").innerHTML=`
    <section class="calendar">
      <div class="calhead"><button id="previous-month" aria-label="前月">‹</button><h1>${t.getFullYear()}年${t.getMonth()+1}月</h1><button id="next-month" aria-label="次月">›</button></div>
      <div class="week">${["日","月","火","水","木","金","土"].map(l=>`<span>${l}</span>`).join("")}</div>
      <div class="grid">
        ${Array(e.getDay()).fill("<i></i>").join("")}
        ${f.map(({date:l,index:y,logs:p,chars:w,major:A,title:M})=>`
        <div class="calday-copy-wrap">
          <button data-date="${l}" class="calday${l===d?" is-today":""}" style="--fill:${Math.min(85,w/6)}" aria-label="${O(l)}、メモ ${p.length} 件">
            <b>${y+1}</b>${A?'<span class="star">★</span>':""}${M?`<span class="cal-title">${k(M)}</span>`:p.length?`<small>${p.length}</small>`:""}
          </button>
          ${p.length?`<button type="button" class="calendar-day-copy" data-copy-date="${l}" aria-label="${O(l)}のメモをコピー" title="コピー">⧉</button>`:""}
        </div>`).join("")}
      </div>
    </section>`,c("#previous-month").onclick=()=>L("prev",()=>{r.date=$(new Date(t.getFullYear(),t.getMonth()-1,1)),m()}),c("#next-month").onclick=()=>L("next",()=>{r.date=$(new Date(t.getFullYear(),t.getMonth()+1,1)),m()}),h("[data-date]").forEach(l=>{l.onclick=()=>{r.date=l.dataset.date,st("today")}}),h("[data-copy-date]").forEach(l=>{l.onclick=y=>{y.preventDefault(),y.stopPropagation(),l.dataset.defaultLabel="⧉",Yt(l.dataset.copyDate,l)}})}async function Yt(t,e){if(e.dataset.busy!=="1"){e.dataset.busy="1";try{const a=await u.byDate(t),n=Y(a,t);if(!n){e.textContent="–";return}await D(n),e.textContent="✓"}catch{e.textContent="!"}finally{e.dataset.busy="0",setTimeout(()=>{e.textContent="⧉"},1400)}}}async function Kt(){const t=(await u.all("entries")).filter(a=>!a.deletedAt);c("#view").innerHTML=`
    <section class="search">
      <h1>メモを探す</h1>
      <input id="query" placeholder="例：ゼルダ / チョコザップ" value="${k(r.query)}" />
      <div id="results"></div>
    </section>`;const e=()=>{const a=c("#query").value.toLowerCase().trim();r.query=a;const n=a?t.filter(s=>[s.title,s.content].join(" ").toLowerCase().includes(a)):t.slice().sort((s,d)=>String(d.createdAt).localeCompare(String(s.createdAt))).slice(0,20);if(!n.length){c("#results").innerHTML='<div class="empty">見つからなかった。</div>';return}const o=new Map;n.forEach(s=>{o.has(s.date)||o.set(s.date,[]),o.get(s.date).push(s)});const i=[...o.keys()].sort((s,d)=>d.localeCompare(s));c("#results").innerHTML=i.map(s=>`
      <div class="search-group">
        <h2>${O(s)}</h2>
        <div class="entries-paper">${H(o.get(s)).map(d=>q(d,{})).join("")}</div>
      </div>`).join(""),it(c("#results"))};c("#query").oninput=e,e()}const Gt=[{date:"2026/09/25",items:["記入欄を「今日に書く」として独立。薄い紙色、常時ラベル、フォーカス強調、「書」の朱印で書く場所を見つけやすくした。","過去のメモから偶然の一枚に再会できる「一枚引く」を追加。日単位で抽選し、直近5件は重複しにくいよう調整。","17個の外部パッチをアプリ本体へ統合し、後からDOMを書き換えるMutationObserverを全廃。","カードの枠を外し、日を一枚の紙として読む表示に変更。メモの色分けは余白の小さな点で表示。","PCの入力欄を紙の末尾の「次の一行」に統合。スマホは下部の入力シートを継続。","気分は日付の数字の墨の濃さで表現。日めくりの各日も、書いた文字量に応じた濃淡で表示。","日付送りで紙がめくれる演出、メモを記録した瞬間の朱の印、1か月前・1年前の同じ日を示す栞を追加。","22時以降は紙が行灯の色になる「夜」表示を追加。切り替えは自動・昼・夜の3択。","検索結果を日付ごとの見出しでまとめ、スマホで「メモ」タブが翌日ボタンに重なる崩れなどを修正。"]},{date:"2026/08/10",items:["既存メモをクリックしたとき、その場で直接編集できる動線を安定化。","編集中は新規メモ入力欄や他のカードを引っ込め、編集欄を画面いっぱいに近い大きさで表示。","編集中にも本文の文字数がリアルタイムで分かるようにした。","カードの作成・更新日時と同じ列に文字数を表示するよう整理。","メモのタイトルを約20pxに拡大し、本文との区別を少し強めた。","関連メモ機能、振り返り、今日のメモ量ゲージなど、使わない機能を整理・削除。","「その日のコピー」に各メモのタイトルを含めるよう変更。","各メモのカードにも個別コピーボタンを追加。","スマホの下部メニューを横書き・低い高さに変更し、背景と絵文字のトーンを落ち着かせた。","選択中のメニューだけ薄いグレージュ背景にして、現在地が分かるようにした。","設定画面に更新履歴を追加し、過去の主な改修も遡って掲載。"]},{date:"2026/08/09",items:["画面内の「ログ」という表記を、基本的に「メモ」へ統一。保存済み本文には手を加えない方式にした。","日付タイトルのプレースホルダーを「8月9日のタイトル」のような形式へ変更。","気分の5段階表示を、選んだ位置まで連続して色が付くメーター表現へ調整。","設定からAI関連パネルを外し、保存先の説明を「データ保存」として整理。","JSON・CSVの出力やJSON取り込みの表記を、実際の操作が分かりやすい言葉へ変更。","端末内のMyDailyLogデータを二重確認して削除できる機能を追加。","日ごとの「整える」を追加。全角英数字・全角スペース・行末空白など、安全な機械的整形だけをまとめて実行できるようにした。","編集画面の見出しや常時ラベルを減らし、空欄のときだけ「題名」「本文」をプレースホルダー表示する形へ簡素化。"]},{date:"2026/08/07",items:["その日に書いたメモをMarkdown形式でまとめてコピーできる「この日をコピー」を追加。","日付・時刻・本文をAIや別のノートへ渡しやすい形に整えて出力。","今日だけでなく、日めくりなど過去の日付からも同じコピー操作を使えるようにした。","コピーボタンの見た目をSecondary Actionとして控えめにし、日誌本文を邪魔しない配置へ調整。"]},{date:"2026/07/29",items:["メモカードを「後から読み返す」ことを意識した表示へ改修。","カードの不要な並び替えを抑え、表示が勝手に動く感覚を減らした。","作成・更新などのメタ情報とカード操作を整理し、本文を主役にする方向へ調整。","作業メモを閉じているときにも、ショートカットの存在が分かる小さなヒントを追加。","オフライン用キャッシュを更新し、追加したUIがPWAでも反映されるよう調整。"]},{date:"2026/07/22",items:["入力途中のメモを自動保存し、画面を離れても下書きを戻せるようにした。","日誌本文とは別に使える「作業メモ」のサイドパネルを追加。","作業メモをすばやく開閉・操作するためのキーボードショートカットを追加。","既存メモをカード上で編集するインライン編集を導入。","画面移動時に編集中状態が残り続けないよう、編集状態のリセット処理を追加。","インライン編集まわりのキャッシュと表示を安定化。"]},{date:"2026/07/10",items:["PCでの新規入力欄のレイアウトを調整し、長めの文章を書きやすくした。","複数行で入力した文章を、行ごとに別メモへ分割せず一つのメモとして保存するよう変更。","各メモに任意のタイトルを付けられるようにした。","タイトル付き・複数行メモが公開版でも正しく読み込まれるよう、ランタイム拡張とキャッシュを更新。"]},{date:"2026/07/06",items:["My Daily Log / 徒然日記として初版を公開。","日付ごとのメモ、日付タイトル、気分を記録できる基本画面を実装。","カレンダー、全文検索を用意。","データはIndexedDBへローカル保存し、JSONバックアップ／復元、CSV出力に対応。","PWAとしてオフライン利用、ライト／ダークモードに対応。","GitHub Pagesのルートから完成版のdocsアプリへ正しく遷移するよう公開設定を修正。"]}];async function Ut(){const t=Object.fromEntries((await u.all("settings")).map(o=>[o.key,o.value])),e=t.lastBackupAt?new Date(t.lastBackupAt).toLocaleString("ja-JP"):"まだ";c("#view").innerHTML=`
    <section class="settings">
      <h1>設定・出力</h1>
      <div class="panel">
        <div class="storage-heading-row">
          <h2>データ保存</h2>
          <button type="button" class="storage-help-toggle" id="storage-help-toggle" aria-expanded="false" aria-controls="data-storage-help">?</button>
        </div>
        <div class="data-storage-help" id="data-storage-help" hidden>
          <p><strong>メモはクラウドには保存されません。</strong> この端末の、このブラウザ内に保存されます。</p>
          <p>保存先はブラウザのサイトデータ（IndexedDB）です。ログインや端末間の自動同期はありません。</p>
          <p>ブラウザのサイトデータを削除したり、端末やブラウザを変えたりすると、メモを引き継げない場合があります。残しておきたいメモは「JSONで出力」で保存してください。</p>
        </div>
        <p>最終JSONバックアップ：<b>${e}</b></p>
        <button id="export-json">JSONで出力</button>
        <label class="file">JSONを取り込む<input id="import-json" type="file" accept="application/json" /></label>
        <button id="export-csv">CSVで出力</button>
      </div>
      <div class="panel">
        <h2>データ管理</h2>
        <button id="sample-data">サンプルデータを入れてみる</button>
        <p class="storage-clear-note">メモ・日付タイトル・設定・作業メモ・入力途中の下書きを、このブラウザから削除します。</p>
        <button id="clear-device-storage" class="danger">端末ストレージをすべて削除</button>
      </div>
      <div class="panel settings-update-history">
        <h2>更新履歴</h2>
        <p class="update-history-intro">GitHubのコミット履歴をもとに、主な変更をまとめています。新しい変更は上に追加していきます。</p>
        <div class="update-history-list">
          ${Gt.map(o=>`
            <section class="update-history-group">
              <time class="update-history-date">${o.date}</time>
              <ul>${o.items.map(i=>`<li>${k(i)}</li>`).join("")}</ul>
            </section>`).join("")}
        </div>
      </div>
    </section>`;const a=c("#data-storage-help"),n=c("#storage-help-toggle");n.onclick=()=>{const o=a.hidden;a.hidden=!o,n.setAttribute("aria-expanded",String(o)),n.classList.toggle("is-open",o)},c("#export-json").onclick=Vt,c("#export-csv").onclick=Wt,c("#import-json").onchange=Zt,c("#sample-data").onclick=Qt,c("#clear-device-storage").onclick=zt}function ct(t,e,a="application/json"){const n=document.createElement("a");n.href=URL.createObjectURL(new Blob([e],{type:a})),n.download=t,n.click(),URL.revokeObjectURL(n.href)}async function Vt(){const t={schemaVersion:2,exportedAt:g(),entries:await u.all("entries"),days:await u.all("days"),settings:(await u.all("settings")).filter(e=>e.key!=="aiKey")};ct(`mydailylog-backup-${$()}.json`,JSON.stringify(t,null,2)),await u.put("settings",{key:"lastBackupAt",value:g()}),j("バックアップを保存した"),m()}async function Wt(){const t=(await u.all("entries")).filter(n=>!n.deletedAt),e=["date","time","title","content","importance"],a=[e.join(","),...t.map(n=>e.map(o=>`"${String(n[o]??"").replaceAll('"','""')}"`).join(","))].join(`
`);ct(`mydailylog-${$()}.csv`,a,"text/csv;charset=utf-8")}async function Zt(t){const e=t.target.files[0];if(e)try{const a=JSON.parse(await e.text());for(const n of a.entries||[])await u.put("entries",n);for(const n of a.days||[])await u.put("days",n);j("復元した"),m()}catch{alert("JSONを読み込めなかった。バックアップファイルを確認して。")}}async function Xt(){return new Promise((t,e)=>{const a=indexedDB.open("mydailylog");a.onerror=()=>e(a.error||new Error("IndexedDBを開けませんでした")),a.onsuccess=()=>{const n=a.result,o=[...n.objectStoreNames];if(!o.length){n.close(),t();return}const i=n.transaction(o,"readwrite");o.forEach(s=>i.objectStore(s).clear()),i.oncomplete=()=>{n.close(),t()},i.onerror=()=>{n.close(),e(i.error)}}})}function Z(t){const e=[];for(let a=0;a<t.length;a+=1){const n=t.key(a);n?.startsWith("mydailylog-")&&e.push(n)}e.forEach(a=>t.removeItem(a))}async function zt(){if(confirm(`このブラウザに保存されているメモ、日付タイトル、設定、作業メモ、入力途中の下書きをすべて削除します。

JSONバックアップとして保存済みのファイルは削除されません。

続けますか？`)&&confirm(`最終確認です。

このブラウザ内の徒然日記のデータは元に戻せません。
「端末ストレージをすべて削除」を実行しますか？`))try{await Xt(),Z(localStorage),Z(sessionStorage),alert("このブラウザに保存されていた徒然日記のデータを削除しました。"),location.reload()}catch{alert("データをすべて削除できませんでした。ブラウザを再読み込みして、もう一度試してください。")}}async function Qt(){const t=[{offset:-3,content:"面接の想定問答を整理した。少し寝不足"},{offset:-2,content:"カフェで1,100円。面接の練習をした"},{offset:-1,content:"チョコザップ行った。20分だけでも気分転換"},{offset:0,content:"オズマPRの面接"},{offset:0,content:"面接後はかなり疲れた。振り返りメモを残す"},{offset:1,content:"ゼルダ：空Nは着地隙がある。振りすぎ注意"},{offset:2,content:"昼：そば 850円"}];for(const e of t){const a=_(r.date,e.offset),n=nt(e.content);await u.put("entries",{id:tt(),date:a,time:n.time,title:"",content:e.content,type:"memo",amount:null,unit:null,tags:[],importance:n.importance,pinned:!1,pinnedAt:null,favorite:!1,favoriteAt:null,cardColor:"default",metadata:{},createdAt:g(),updatedAt:g(),deletedAt:null})}await R({...await ot(r.date),title:"面接と振り返りの日"}),j("サンプルを追加した"),m()}function K(){return r.route==="today"}function te(){if(c("#side-memo-panel"))return;const t=window.matchMedia("(min-width: 1440px)").matches,e=v.get(B,t),a=v.get(T,{text:""}),n=document.createElement("button");n.id="side-memo-backdrop",n.className="side-memo-backdrop",n.type="button",n.setAttribute("aria-label","メモを閉じる");const o=document.createElement("button");o.id="side-memo-toggle",o.className="side-memo-toggle",o.type="button",o.dataset.sideMemoToggle="1",o.innerHTML='<span aria-hidden="true">✎</span><b>メモ</b>';const i=document.createElement("aside");i.id="side-memo-panel",i.className="side-memo-panel",i.setAttribute("aria-label","作業メモ"),i.innerHTML=`
    <header class="side-memo-header">
      <div>
        <p>PARALLEL NOTE</p>
        <h2>作業メモ</h2>
        <span>日誌とは別に、自動保存</span>
        <span class="side-memo-shortcut">Alt + ← 開く　/　Alt + → 閉じる</span>
      </div>
      <button id="side-memo-close" type="button" aria-label="メモを閉じる">×</button>
    </header>
    <textarea id="side-memo-text" placeholder="日誌に入れる前の断片、調べたいこと、あとで整理するメモ…"></textarea>
    <footer class="side-memo-footer">
      <span id="side-memo-status" aria-live="polite">保存済み</span>
      <button id="side-memo-clear" type="button">消去</button>
    </footer>`,document.body.append(n,o,i);const s=c("#side-memo-text",i),d=c("#side-memo-status",i);s.value=a?.text||"";const f=(l,y=!0)=>{const p=!!l&&K();document.body.classList.toggle("side-memo-open",p),i.classList.toggle("is-open",p),n.classList.toggle("is-open",p),o.setAttribute("aria-expanded",String(p)),y&&v.set(B,!!l),p&&setTimeout(()=>s.focus({preventScroll:!0}),80)};i.__setOpen=f,o.addEventListener("click",()=>f(!i.classList.contains("is-open"))),n.addEventListener("click",()=>f(!1)),c("#side-memo-close",i).addEventListener("click",()=>f(!1)),s.addEventListener("input",()=>{d.textContent="保存中…",clearTimeout(N),N=setTimeout(()=>{v.set(T,{text:s.value,updatedAt:g()}),d.textContent="保存済み"},180)}),s.addEventListener("blur",()=>{clearTimeout(N),v.set(T,{text:s.value,updatedAt:g()}),d.textContent="保存済み"}),c("#side-memo-clear",i).addEventListener("click",()=>{(!s.value||confirm("作業メモを空にしますか？"))&&(s.value="",v.remove(T),d.textContent="消去した",s.focus())}),f(e,!1)}function ee(){te();const t=c("#side-memo-panel"),e=c("#side-memo-toggle"),a=c("#side-memo-backdrop"),n=K();e.hidden=!n,t.hidden=!n,a.hidden=!n,n?t.__setOpen(v.get(B,!1),!1):t.__setOpen(!1,!1),h("[data-side-memo-toggle]").forEach(o=>{o.id!=="side-memo-toggle"&&(o.onclick=()=>e.click())})}document.addEventListener("keydown",t=>{if(t.isComposing||!t.altKey||t.ctrlKey||t.metaKey||t.shiftKey||!["ArrowLeft","ArrowRight"].includes(t.key)||!K())return;const e=c("#side-memo-panel");e&&(t.preventDefault(),t.key==="ArrowLeft"&&!e.classList.contains("is-open")&&e.__setOpen(!0),t.key==="ArrowRight"&&e.classList.contains("is-open")&&e.__setOpen(!1))});window.addEventListener("pagehide",()=>{const t=c("#composer");t&&t.value.trim()&&v.set(`${I}${r.date}`,{title:c("#composer-title")?.value||"",text:t.value,updatedAt:g()});const e=c("#side-memo-text");e&&v.set(T,{text:e.value,updatedAt:g()})});J();"serviceWorker"in navigator&&navigator.serviceWorker.register("./sw.js").catch(()=>{});window.addEventListener("hashchange",()=>{const t=at();t!==r.route&&(r.route=t,r.editingId=null,m())});m();
