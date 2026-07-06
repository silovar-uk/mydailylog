(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const l of o)if(l.type==="childList")for(const d of l.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&n(d)}).observe(document,{childList:!0,subtree:!0});function a(o){const l={};return o.integrity&&(l.integrity=o.integrity),o.referrerPolicy&&(l.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?l.credentials="include":o.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function n(o){if(o.ep)return;o.ep=!0;const l=a(o);fetch(o.href,l)}})();const r=(t,e=document)=>e.querySelector(t),b=(t,e=document)=>[...e.querySelectorAll(t)],S={memo:["📝","メモ"],meal:["🍜","食事"],expense:["💴","支出"],exercise:["🏋️","運動"],learning:["📚","学び"],game:["🎮","ゲーム"],work:["💼","仕事"],reading:["📖","読書"],condition:["🫧","体調"],habit:["✅","習慣"],event:["⭐","特大イベント"],idea:["💡","アイデア"],task:["☑️","タスク"]},F=[["🏋️","チョコザップ","exercise","チョコザップに行った"],["💴","支出","expense",""],["🍜","食事","meal",""],["🎮","学び","learning",""],["⭐","特大","event",""]],M={today:"今日を残す",calendar:"日を眺める",review:"ふり返る",search:"探す",settings:"整える"},g=()=>new Date().toISOString(),D=()=>crypto.randomUUID?.()||`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,h=(t=new Date)=>t.toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"}),R=t=>new Intl.DateTimeFormat("ja-JP",{month:"long",day:"numeric",weekday:"short",timeZone:"Asia/Tokyo"}).format(new Date(`${t}T12:00:00`)),k=t=>new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"numeric",day:"numeric",weekday:"short",timeZone:"Asia/Tokyo"}).format(new Date(`${t}T12:00:00`)),E=(t,e)=>{const a=new Date(`${t}T12:00:00`);return a.setDate(a.getDate()+e),h(a)},j=t=>S[t]?.[0]||"🏷️",A=t=>S[t]?.[1]||t,y=(t="")=>String(t).replace(/[&<>'"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"})[e]),C=t=>t==null||t===""?"":`¥${Number(t).toLocaleString("ja-JP")}`,B=t=>({0:"通常",1:"大事",2:"特大イベント"})[t]||"通常",u={open(){return new Promise((t,e)=>{const a=indexedDB.open("mydailylog",1);a.onupgradeneeded=()=>{const n=a.result;n.createObjectStore("entries",{keyPath:"id"}).createIndex("date","date"),n.createObjectStore("days",{keyPath:"date"}),n.createObjectStore("settings",{keyPath:"key"})},a.onsuccess=()=>t(a.result),a.onerror=()=>e(a.error)})},async request(t,e,a){const n=await this.open();return new Promise((o,l)=>{const d=n.transaction(t,e),c=d.objectStore(t);let v;try{v=a(c)}catch(s){l(s)}d.oncomplete=()=>o(v),d.onerror=()=>l(d.error)})},put(t,e){return this.request(t,"readwrite",a=>a.put(e))},delete(t,e){return this.request(t,"readwrite",a=>a.delete(e))},get(t,e){return new Promise(async(a,n)=>{const l=(await this.open()).transaction(t).objectStore(t).get(e);l.onsuccess=()=>a(l.result),l.onerror=()=>n(l.error)})},all(t){return new Promise(async(e,a)=>{const o=(await this.open()).transaction(t).objectStore(t).getAll();o.onsuccess=()=>e(o.result),o.onerror=()=>a(o.error)})},byDate(t){return new Promise(async(e,a)=>{const o=(await this.open()).transaction("entries").objectStore("entries").index("date").getAll(t);o.onsuccess=()=>e(o.result.filter(l=>!l.deletedAt)),o.onerror=()=>a(o.error)})}};function N(){const t=location.hash.replace("#/","");return Object.hasOwn(M,t)?t:"today"}let i={route:N(),date:h(),query:"",toast:null,detailEntryId:null,eventContextId:null,reviewTab:"summary"};function U(t){const e=t.trim();let a="memo",n=null,o=null,l=0;const d=[],c=e.match(/(?:¥|￥|\b)([\d,]+)\s*円?|([\d,]+)円/);c&&(n=Number((c[1]||c[2]).replace(/,/g,"")),o="JPY",a="expense",d.push("支出")),/チョコザップ|ジム|筋トレ|運動|歩いた|散歩|ストレッチ/.test(e)&&(a="exercise",d.push("運動")),/昼|朝|夜|食べ|ごはん|飯|ラーメン|そば|カフェ|コーヒー|自炊|外食/.test(e)&&(n||(a="meal"),d.push("食事")),/ゼルダ|スマブラ|ゲーム|SF6|スト6|将棋/.test(e)&&(a="game",d.push("ゲーム")),/読んだ|読書|ページ|本/.test(e)&&(a="reading",d.push("読書")),/眠い|寝不足|体調|疲れ|だるい|頭痛/.test(e)&&(a="condition",d.push("体調")),/特大|面接|会見|旅行|遠征|開幕|発表|引っ越し/.test(e)&&(a="event",l=2,d.push("イベント"));const v=(e.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)||[])[0]||null;return{type:a,amount:n,unit:o,importance:l,tags:[...new Set(d)],time:v}}async function I(t){return await u.get("days",t)||{date:t,title:"",summary:"",mood:null,carryOver:"",updatedAt:g()}}async function x(t){t.updatedAt=g(),await u.put("days",t)}function K(){return r("#app")}function L(t){i.route=t,i.detailEntryId=null,i.eventContextId=null,i.reviewTab=t==="review"?i.reviewTab:"summary",location.hash!==`#/${t}`&&(location.hash=`#/${t}`),m()}async function m(){b(".modal-backdrop").forEach(e=>e.remove());const t=i.route;K().innerHTML=`
    <main class="shell">
      <header class="top">
        <div>
          <div class="brand">日々の棚</div>
          <div class="sub">${M[t]}</div>
        </div>
        <button class="theme" aria-label="テーマを切り替える" title="テーマを切り替える">◐</button>
      </header>
      <section id="view"></section>
      <nav class="nav" aria-label="メインメニュー">
        ${Object.entries({today:"今日",calendar:"カレンダー",review:"振り返り",search:"検索",settings:"設定"}).map(([e,a])=>`<button data-route="${e}" class="${t===e?"active":""}">${a}</button>`).join("")}
      </nav>
    </main>
    <div id="toast" aria-live="polite"></div>`,b("[data-route]").forEach(e=>{e.onclick=()=>L(e.dataset.route)}),r(".theme").onclick=()=>{document.documentElement.classList.toggle("dark"),localStorage.setItem("mydailylog-theme",document.documentElement.classList.contains("dark")?"dark":"light")},t==="today"&&await V(),t==="calendar"&&await Q(),t==="review"&&await z(),t==="search"&&await X(),t==="settings"&&await tt(),i.detailEntryId&&await _(i.detailEntryId),i.eventContextId&&await G(i.eventContextId),i.toast&&Y(i.toast)}async function V(){const t=i.date,e=await I(t),a=(await u.byDate(t)).sort((n,o)=>(o.time||o.createdAt).localeCompare(n.time||n.createdAt));r("#view").innerHTML=`
    <section class="dayhead">
      <div class="date-row">
        <button id="prev" aria-label="前の日">‹</button>
        <h1>${R(t)}</h1>
        <button id="next" aria-label="次の日">›</button>
      </div>
      <input id="daytitle" placeholder="この日のタイトル" value="${y(e.title)}" aria-label="この日のタイトル" />
      <div class="mood-row">
        <span>気分</span>
        <div class="moods" aria-label="気分を選ぶ">
          ${[1,2,3,4,5].map(n=>`<button data-mood="${n}" class="${e.mood===n?"on":""}" aria-label="気分 ${n}">●</button>`).join("")}
        </div>
      </div>
      <div class="obi" aria-label="今日のログ量"><i style="width:${Math.min(100,a.length*12)}%"></i></div>
    </section>
    <section class="quick" aria-label="クイック入力">
      ${F.map(([n,o,l,d])=>`<button data-quick="${l}" data-content="${y(d)}">${n} ${o}</button>`).join("")}
    </section>
    <section class="entries">
      ${a.length?a.map(n=>O(n)).join(""):'<div class="empty">まだログがない。下の欄から、今日の断片を残そう。</div>'}
    </section>
    <section class="carry-over">
      <label for="carryover">明日へ持ち越すこと</label>
      <textarea id="carryover" placeholder="明日思い出したいことを、ひとことだけ">${y(e.carryOver||"")}</textarea>
    </section>
    <section class="composer" aria-label="新しいログを追加">
      <textarea id="composer" placeholder="今日のログを書く…&#10;例：昼：そば 850円 / チョコザップ行った"></textarea>
      <button id="send" aria-label="ログを追加">↑</button>
    </section>`,r("#prev").onclick=()=>{i.date=E(t,-1),m()},r("#next").onclick=()=>{i.date=E(t,1),m()},r("#daytitle").addEventListener("input",async n=>{e.title=n.target.value,await x(e)}),r("#carryover").addEventListener("input",async n=>{e.carryOver=n.target.value,await x(e)}),b("[data-mood]").forEach(n=>{n.onclick=async()=>{e.mood=Number(n.dataset.mood),await x(e),m()}}),r("#send").onclick=q,r("#composer").addEventListener("keydown",n=>{(n.metaKey||n.ctrlKey)&&n.key==="Enter"&&q()}),b("[data-quick]").forEach(n=>{n.onclick=()=>Z(n.dataset.quick,n.dataset.content)}),P()}function O(t,e={}){const{context:a=!1}=e,n=t.amount!==null&&t.amount!==void 0&&t.amount!=="",o=t.importance>0?`<span class="priority priority-${t.importance}">${B(t.importance)}</span>`:"",l=t.suggestion?`
    <div class="suggest">
      候補：${j(t.suggestion.type)} ${A(t.suggestion.type)}
      ${t.suggestion.amount?` ${C(t.suggestion.amount)}`:""}
      <button data-apply="${t.id}">適用</button>
    </div>`:"";return`
    <article class="card ${t.importance===2?"is-major":""}">
      <button class="entry-open" data-open="${t.id}" aria-label="${y(t.content)} を編集">
        <span class="entry-icon">${j(t.type)}</span>
        <span class="entry-body">
          <span class="entry-content">${y(t.content)}</span>
          <span class="meta">
            ${t.time||""}${n?` ${t.unit==="JPY"?C(t.amount):`${t.amount} ${t.unit||""}`}`:""}
            ${t.tags.map(d=>`#${y(d)}`).join(" ")}
          </span>
        </span>
        ${o}
      </button>
      <button class="delete" data-delete="${t.id}" aria-label="このログを削除">×</button>
      ${a?`<button class="context-day" data-context-day="${t.date}">この日を開く</button>`:""}
      ${l}
    </article>`}function P(t=document,e={}){b("[data-open]",t).forEach(a=>{a.onclick=()=>{e.closeEventContext&&(i.eventContextId=null),i.detailEntryId=a.dataset.open,m()}}),b("[data-delete]",t).forEach(a=>{a.onclick=()=>J(a.dataset.delete)}),b("[data-apply]",t).forEach(a=>{a.onclick=W}),b("[data-context-day]",t).forEach(a=>{a.onclick=()=>{i.date=a.dataset.contextDay,i.eventContextId=null,L("today")}})}async function q(){const t=r("#composer"),e=t.value.trim();if(!e)return;const a=e.split(`
`).map(n=>n.trim()).filter(Boolean);for(const n of a){const o=U(n),l={id:D(),date:i.date,time:o.time,content:n,type:"memo",amount:null,unit:null,tags:[],importance:o.importance,metadata:{},createdAt:g(),updatedAt:g(),deletedAt:null,suggestion:o.type!=="memo"||o.amount!==null?o:null};await u.put("entries",l)}t.value="",m()}async function W(t){const e=await u.get("entries",t.currentTarget.dataset.apply);e?.suggestion&&(Object.assign(e,e.suggestion,{suggestion:null,updatedAt:g()}),await u.put("entries",e),m())}async function Z(t,e){const a=!e,n={id:D(),date:i.date,time:new Date().toTimeString().slice(0,5),content:e||(t==="event"?"特大イベント":`${A(t)}を記録`),type:t,amount:null,unit:null,tags:[A(t)],importance:t==="event"?2:0,metadata:{},createdAt:g(),updatedAt:g(),deletedAt:null};await u.put("entries",n),a?i.detailEntryId=n.id:w("記録した"),m()}async function J(t){const e=await u.get("entries",t);e&&(e.deletedAt=g(),await u.put("entries",e),i.detailEntryId=null,w("削除した",async()=>{e.deletedAt=null,e.updatedAt=g(),await u.put("entries",e),m()}),m())}function w(t,e){i.toast={message:t,undo:e},Y(i.toast)}function Y(t){const e=r("#toast");e&&(e.innerHTML=`<div>${t.message}${t.undo?'<button id="undo">取り消す</button>':""}</div>`,t.undo&&(r("#undo").onclick=async()=>{await t.undo(),i.toast=null,e.innerHTML=""}),setTimeout(()=>{i.toast===t&&(i.toast=null,e.innerHTML="")},5e3))}async function _(t){const e=await u.get("entries",t);if(!e||e.deletedAt){i.detailEntryId=null;return}const a=document.createElement("div");a.className="modal-backdrop",a.id="detail-modal",a.innerHTML=`
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <header class="modal-header">
        <div>
          <p class="eyebrow">ログを整える</p>
          <h2 id="detail-title">${e.importance===2?"特大イベント":"ログの詳細"}</h2>
        </div>
        <button id="close-detail" class="close-modal" aria-label="編集を閉じる">×</button>
      </header>
      <form id="detail-form">
        <div class="form-grid two">
          <label>日付<input id="entry-date" type="date" value="${y(e.date)}" /></label>
          <label>時刻<input id="entry-time" type="time" value="${y(e.time||"")}" /></label>
        </div>
        <label>本文<textarea id="entry-content" rows="4" required>${y(e.content)}</textarea></label>
        <div class="form-grid two">
          <label>種類<select id="entry-type">
            ${Object.entries(S).map(([f,[,T]])=>`<option value="${f}" ${e.type===f?"selected":""}>${T}</option>`).join("")}
          </select></label>
          <label>重要度<select id="entry-importance">
            <option value="0" ${e.importance===0?"selected":""}>通常</option>
            <option value="1" ${e.importance===1?"selected":""}>大事</option>
            <option value="2" ${e.importance===2?"selected":""}>特大イベント</option>
          </select></label>
        </div>
        <div class="form-grid money-grid">
          <label>数値<input id="entry-amount" type="number" inputmode="decimal" placeholder="850" value="${e.amount??""}" /></label>
          <label>単位<input id="entry-unit" list="unit-options" placeholder="JPY / min / 回" value="${y(e.unit||"")}" /></label>
          <datalist id="unit-options"><option value="JPY"></option><option value="min"></option><option value="回"></option><option value="kg"></option><option value="page"></option></datalist>
        </div>
        <label>タグ <span class="label-note">スペースまたは # で区切る</span>
          <input id="entry-tags" placeholder="食事 外食" value="${y(e.tags.join(" "))}" />
        </label>
        <p class="autosave" id="autosave-state">変更は自動保存</p>
      </form>
      <footer class="modal-footer">
        <button id="open-entry-day" class="secondary">この日を開く</button>
        <button id="delete-entry" class="danger-outline">削除</button>
      </footer>
    </section>`,document.body.append(a);let n;const o=r("#detail-form",a),l=r("#autosave-state",a),d=()=>({...e,date:r("#entry-date",a).value||e.date,time:r("#entry-time",a).value||null,content:r("#entry-content",a).value.trim()||e.content,type:r("#entry-type",a).value,importance:Number(r("#entry-importance",a).value),amount:r("#entry-amount",a).value===""?null:Number(r("#entry-amount",a).value),unit:r("#entry-unit",a).value.trim()||null,tags:r("#entry-tags",a).value.split(/[\s#]+/).map(f=>f.trim()).filter(Boolean),suggestion:null,updatedAt:g()}),c=async()=>{clearTimeout(n),l.textContent="保存中…",Object.assign(e,d()),await u.put("entries",e),l.textContent="保存済み"},v=()=>{l.textContent="変更あり",clearTimeout(n),n=setTimeout(c,350)};b("input, textarea, select",o).forEach(f=>{f.addEventListener("input",v),f.addEventListener("change",v)});const s=f=>{f.key==="Escape"&&document.body.contains(a)&&p()},p=async()=>{document.removeEventListener("keydown",s),a.remove(),await c(),i.detailEntryId=null,m()};r("#close-detail",a).onclick=p,a.addEventListener("click",f=>{f.target===a&&p()}),r("#open-entry-day",a).onclick=async()=>{await c(),i.date=e.date,i.detailEntryId=null,L("today")},r("#delete-entry",a).onclick=()=>J(e.id),document.addEventListener("keydown",s),r("#entry-content",a).focus()}async function Q(){const t=new Date(`${i.date}T12:00:00`),e=new Date(t.getFullYear(),t.getMonth(),1),a=new Date(t.getFullYear(),t.getMonth()+1,0),[n,o]=await Promise.all([u.all("entries"),u.all("days")]),l=Object.fromEntries(o.map(c=>[c.date,c])),d=n.filter(c=>!c.deletedAt);r("#view").innerHTML=`
    <section class="calendar">
      <div class="calhead"><button id="previous-month" aria-label="前月">‹</button><h1>${t.getFullYear()}年${t.getMonth()+1}月</h1><button id="next-month" aria-label="次月">›</button></div>
      <div class="week">${["日","月","火","水","木","金","土"].map(c=>`<span>${c}</span>`).join("")}</div>
      <div class="grid">
        ${Array(e.getDay()).fill("<i></i>").join("")}
        ${Array.from({length:a.getDate()},(c,v)=>{const s=h(new Date(t.getFullYear(),t.getMonth(),v+1)),p=d.filter($=>$.date===s),f=p.some($=>$.importance===2||$.type==="event"),T=l[s]?.mood||"";return`<button data-date="${s}" class="calday mood-${T}" aria-label="${k(s)}、ログ ${p.length} 件">
      <b>${v+1}</b>${f?'<span class="star">★</span>':""}<em style="height:${Math.min(34,p.length*5)}px"></em>${p.length?`<small>${p.length}</small>`:""}
    </button>`}).join("")}
      </div>
    </section>`,r("#previous-month").onclick=()=>{i.date=h(new Date(t.getFullYear(),t.getMonth()-1,1)),m()},r("#next-month").onclick=()=>{i.date=h(new Date(t.getFullYear(),t.getMonth()+1,1)),m()},b("[data-date]").forEach(c=>{c.onclick=()=>{i.date=c.dataset.date,L("today")}})}async function z(){const t=(await u.all("entries")).filter(s=>!s.deletedAt),e=i.date.slice(0,7),a=t.filter(s=>s.date.startsWith(e)),n=a.filter(s=>s.unit==="JPY"||s.type==="expense").reduce((s,p)=>s+(Number(p.amount)||0),0),o=a.filter(s=>s.type==="exercise"&&/チョコザップ/.test(s.content)).length,l=Object.keys(S).map(s=>[s,a.filter(p=>p.type===s).length]).filter(([,s])=>s),d=t.filter(s=>s.importance===2||s.type==="event").sort((s,p)=>p.date.localeCompare(s.date)||p.createdAt.localeCompare(s.createdAt)),c=`
    <div class="stats">
      <div><b>${C(n)}</b><span>支出</span></div>
      <div><b>${o}回</b><span>チョコザップ</span></div>
      <div><b>${a.length}</b><span>ログ</span></div>
    </div>
    <h2>テーマ別</h2>
    ${l.length?l.map(([s,p])=>`<div class="barrow"><span>${j(s)} ${A(s)}</span><div><i style="width:${Math.max(8,p/(a.length||1)*100)}%"></i></div><b>${p}</b></div>`).join(""):'<div class="empty">今月のログがまだない。</div>'}`,v=d.length?`
    <p class="section-copy">特大イベントを開くと、前後3日のログを一続きで読める。</p>
    <div class="event-list">
      ${d.map(s=>`<article class="event-card">
        <div class="event-date">${k(s.date)}</div>
        <button data-event-context="${s.id}">
          <span>${j(s.type)}</span><strong>${y(s.content)}</strong><small>${s.tags.map(p=>`#${y(p)}`).join(" ")||"前後3日を見る"}</small>
        </button>
      </article>`).join("")}
    </div>`:'<div class="empty">特大イベントはまだない。ログ詳細から「特大イベント」を選ぶとここに並ぶ。</div>';r("#view").innerHTML=`
    <section class="review">
      <h1>${e.replace("-","年")}月の振り返り</h1>
      <div class="review-tabs" role="tablist">
        <button data-review-tab="summary" class="${i.reviewTab==="summary"?"active":""}">集計</button>
        <button data-review-tab="events" class="${i.reviewTab==="events"?"active":""}">イベント</button>
      </div>
      <div class="review-content">${i.reviewTab==="summary"?c:v}</div>
    </section>`,b("[data-review-tab]").forEach(s=>{s.onclick=()=>{i.reviewTab=s.dataset.reviewTab,m()}}),b("[data-event-context]").forEach(s=>{s.onclick=()=>{i.eventContextId=s.dataset.eventContext,m()}})}async function G(t){const e=await u.get("entries",t);if(!e||e.deletedAt){i.eventContextId=null;return}const a=Array.from({length:7},(c,v)=>E(e.date,v-3)),n=await Promise.all(a.map(async c=>({date:c,day:await I(c),entries:(await u.byDate(c)).sort((v,s)=>(v.time||v.createdAt).localeCompare(s.time||s.createdAt))}))),o=document.createElement("div");o.className="modal-backdrop context-backdrop",o.id="event-context-modal",o.innerHTML=`
    <section class="modal context-modal" role="dialog" aria-modal="true" aria-labelledby="context-title">
      <header class="modal-header">
        <div>
          <p class="eyebrow">前後3日の記録</p>
          <h2 id="context-title">${y(e.content)}</h2>
          <p class="context-sub">${k(e.date)} を中心に読む</p>
        </div>
        <button id="close-context" class="close-modal" aria-label="イベント表示を閉じる">×</button>
      </header>
      <div class="context-timeline">
        ${n.map(({date:c,day:v,entries:s})=>`
          <section class="context-day ${c===e.date?"is-event-day":""}">
            <button data-context-day="${c}" class="context-day-title">
              <span>${k(c)}${c===e.date?"　イベント当日":""}</span>
              <strong>${y(v.title||"タイトルなし")}</strong>
            </button>
            <div class="context-entries">${s.length?s.map(p=>O(p,{context:!0})).join(""):'<p class="context-empty">ログなし</p>'}</div>
          </section>`).join("")}
      </div>
    </section>`,document.body.append(o);const l=c=>{c.key==="Escape"&&document.body.contains(o)&&d()},d=()=>{document.removeEventListener("keydown",l),o.remove(),i.eventContextId=null,m()};r("#close-context",o).onclick=d,o.addEventListener("click",c=>{c.target===o&&d()}),P(o,{closeEventContext:!0}),document.addEventListener("keydown",l)}async function X(){const t=(await u.all("entries")).filter(a=>!a.deletedAt);r("#view").innerHTML=`
    <section class="search">
      <h1>ログを探す</h1>
      <input id="query" placeholder="例：ゼルダ / チョコザップ / 850円" value="${y(i.query)}" />
      <div id="results"></div>
    </section>`;const e=()=>{const a=r("#query").value.toLowerCase().trim();i.query=a;const n=a?t.filter(o=>[o.content,o.type,...o.tags,String(o.amount??"")].join(" ").toLowerCase().includes(a)):t.slice().sort((o,l)=>l.createdAt.localeCompare(o.createdAt)).slice(0,20);r("#results").innerHTML=n.length?n.map(o=>O(o)).join(""):'<div class="empty">見つからなかった。</div>',P(r("#results"))};r("#query").oninput=e,e()}async function tt(){const t=Object.fromEntries((await u.all("settings")).map(n=>[n.key,n.value])),e=t.lastBackupAt?new Date(t.lastBackupAt).toLocaleString("ja-JP"):"まだ",a=navigator.storage?.persisted?await navigator.storage.persisted():!1;r("#view").innerHTML=`
    <section class="settings">
      <h1>設定・出力</h1>
      <div class="panel">
        <h2>データの安心</h2>
        <p>最終バックアップ：<b>${e}</b></p>
        <p>端末ストレージ：<b>${a?"保護を要求済み":"通常保存"}</b></p>
        <button id="request-storage">この端末で保存を保護</button>
        <button id="export-json">JSONをバックアップ</button>
        <label class="file">JSONを復元<input id="import-json" type="file" accept="application/json" /></label>
        <button id="export-csv">CSVを書き出す</button>
      </div>
      <div class="panel">
        <h2>データ管理</h2>
        <button id="sample-data">サンプルデータを入れる</button>
        <button id="clear-data" class="danger">すべて削除</button>
      </div>
      <div class="panel">
        <h2>AI</h2>
        <p>現時点では、金額・時刻・既知キーワードを使った分類提案のみ。APIキーを使うAI整形・日次要約は次の段階で追加する。</p>
      </div>
    </section>`,r("#request-storage").onclick=async()=>{const n=navigator.storage?.persist?await navigator.storage.persist():!1;w(n?"保存を保護するよう依頼した":"このブラウザでは保護を設定できなかった"),m()},r("#export-json").onclick=et,r("#export-csv").onclick=at,r("#import-json").onchange=nt,r("#sample-data").onclick=st,r("#clear-data").onclick=ot}function H(t,e,a="application/json"){const n=document.createElement("a");n.href=URL.createObjectURL(new Blob([e],{type:a})),n.download=t,n.click(),URL.revokeObjectURL(n.href)}async function et(){const t={schemaVersion:2,exportedAt:g(),entries:await u.all("entries"),days:await u.all("days"),settings:(await u.all("settings")).filter(e=>e.key!=="aiKey")};H(`mydailylog-backup-${h()}.json`,JSON.stringify(t,null,2)),await u.put("settings",{key:"lastBackupAt",value:g()}),w("バックアップを保存した"),m()}async function at(){const t=(await u.all("entries")).filter(n=>!n.deletedAt),e=["date","time","type","content","amount","unit","tags","importance"],a=[e.join(","),...t.map(n=>e.map(o=>`"${String(o==="tags"?n[o].join("|"):n[o]??"").replaceAll('"','""')}"`).join(","))].join(`
`);H(`mydailylog-${h()}.csv`,a,"text/csv;charset=utf-8")}async function nt(t){const e=t.target.files[0];if(e)try{const a=JSON.parse(await e.text());for(const n of a.entries||[])await u.put("entries",n);for(const n of a.days||[])await u.put("days",n);w("復元した"),m()}catch{alert("JSONを読み込めなかった。バックアップファイルを確認して。")}}async function ot(){if(confirm("すべてのログと日付タイトルを削除します。戻せません。")){for(const t of["entries","days"]){const e=await u.all(t);for(const a of e)await u.delete(t,t==="entries"?a.id:a.date)}w("全データを削除した"),m()}}async function st(){const t=[{offset:-3,content:"面接の想定問答を整理した。少し寝不足",type:"work",tags:["仕事","面接準備"]},{offset:-2,content:"カフェで1,100円。面接の練習をした",type:"expense",amount:1100,unit:"JPY",tags:["支出","カフェ"]},{offset:-1,content:"チョコザップ行った。20分だけでも気分転換",type:"exercise",tags:["運動"]},{offset:0,content:"オズマPRの面接",type:"event",importance:2,tags:["イベント","面接"]},{offset:0,content:"面接後はかなり疲れた。振り返りメモを残す",type:"condition",tags:["体調","振り返り"]},{offset:1,content:"ゼルダ：空Nは着地隙がある。振りすぎ注意",type:"game",tags:["ゲーム","ゼルダ"]},{offset:2,content:"昼：そば 850円",type:"expense",amount:850,unit:"JPY",tags:["食事","支出"]}];for(const e of t){const a=E(i.date,e.offset);await u.put("entries",{id:D(),date:a,time:null,content:e.content,type:e.type,amount:e.amount??null,unit:e.unit??null,tags:e.tags,importance:e.importance??0,metadata:{},createdAt:g(),updatedAt:g(),deletedAt:null})}await x({...await I(i.date),title:"面接と振り返りの日"}),w("サンプルを追加した"),m()}localStorage.getItem("mydailylog-theme")==="dark"&&document.documentElement.classList.add("dark");"serviceWorker"in navigator&&navigator.serviceWorker.register("./sw.js").catch(()=>{});window.addEventListener("hashchange",()=>{const t=N();t!==i.route&&(i.route=t,i.detailEntryId=null,i.eventContextId=null,m())});m();
