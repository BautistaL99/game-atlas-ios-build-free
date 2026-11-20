/* V266 R13 – isolated fixes, no new data claims and no automatic publishing. */
(function(){'use strict';
 const isInside=(node,selector)=>node&&node.closest&&node.closest(selector);
 // Newswire: image, title, body and background open the same internal entry.
 // Buttons/links keep their original destination; no click hijacking.
 document.addEventListener('click',e=>{
  const card=isInside(e.target,'.vi-news-card');
  if(!card||isInside(e.target,'a,button,input,textarea,select,details summary'))return;
  const entry=card.querySelector('.vi-news-image-link[href^="#/ficha/"]');
  if(entry){e.preventDefault();entry.click()}
 });
 // First-run Android/iOS: the recovery hint should open the IMPORT area,
 // not just the top of My Game. Leave the original importer and consent flow intact.
 let pendingGuestBackup=false;
 document.addEventListener('click',e=>{
  if(isInside(e.target,'.vi-v227-transfer-welcome a[href="#/partida"]'))pendingGuestBackup=true;
 },true);
 window.addEventListener('hashchange',()=>{
  if(!pendingGuestBackup||!location.hash.startsWith('#/partida'))return;
  pendingGuestBackup=false;
  setTimeout(()=>{
   const section=document.querySelector('.guest-backup');
   if(section)section.scrollIntoView({block:'start',behavior:'smooth'});
  },90);
 });
 // Restore the actual nested #root scroll when returning to a category from a ficha.
 let lastList=null;
 function scrollHost(){const el=document.querySelector('#root');return el&&el.scrollHeight>el.clientHeight+20?el:document.scrollingElement}
 document.addEventListener('click',e=>{
  const link=isInside(e.target,'a[href^="#/ficha/"]');
  if(!link||!location.hash.includes('/explorar/'))return;
  const el=scrollHost();lastList={route:location.hash,y:el?.scrollTop||0,time:Date.now()};
 },true);
 window.addEventListener('hashchange',()=>{
  if(!lastList||location.hash!==lastList.route||Date.now()-lastList.time>120000)return;
  const snapshot=lastList;lastList=null;
  setTimeout(()=>{const el=scrollHost();if(el)el.scrollTop=snapshot.y;},75);
 });
 // When the user expands Tipos / Estado, don't allow two collapsed/expanded
 // components to fight for focus or reset the sheet: ensure inner scroll remains functional.
 document.addEventListener('toggle',e=>{
  if(!isInside(e.target,'#atlas-map-filter-panel details'))return;
  const body=document.querySelector('#atlas-map-filter-panel .atlas-filter-scroll');
  if(body&&body.scrollHeight>body.clientHeight)body.style.overflowY='auto';
 },true);
})();
