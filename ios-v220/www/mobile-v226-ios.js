/* Game Atlas iOS V220 — intentional edge Back gesture + native JSON sharing.
   On iPhone, a horizontal swipe from the LEFT edge of an Explore detail
   must return to Explore; it must not call history.back() twice. Does not
   touch localStorage, catalog signatures, map coordinates, or user data. */
(()=>{'use strict';
 const isiOS=()=>window.Capacitor?.getPlatform?.()==='ios';
 if(!isiOS())return;
 document.documentElement.classList.add('vi-ios-app');
 const route=()=>{try{return decodeURIComponent((location.hash||'#/').slice(1)).split('?')[0]}catch{return '/'}};
 const isDetail=p=>/^\/(?:ficha|detalle)\/[^/]+/.test(p)||/^\/explorar\/[^/]+/.test(p)||/^\/noticias\/[^/]+/.test(p)||/^\/rankings\/(?:speedruns|donaciones)$/.test(p)||p==='/noticias';
 let touch=null;
 const blocked=e=>!!e.target?.closest?.('.atlas-map,.atlas-pin-editor,.atlas-popup,.atlas-filters,.mobile-more[open],input,textarea,select,[contenteditable="true"],.vi-map-filter-chips');
 document.addEventListener('touchstart',e=>{
  touch=null;
  if(e.touches.length!==1)return;
  const p=route(),t=e.touches[0];
  if(!isDetail(p)||t.clientX>32||blocked(e))return;
  touch={x:t.clientX,y:t.clientY,at:Date.now(),from:p};
 },{capture:true,passive:true});
 document.addEventListener('touchcancel',()=>{touch=null},{capture:true,passive:true});
 document.addEventListener('touchend',e=>{
  const start=touch;touch=null;
  if(!start||e.changedTouches.length!==1||Date.now()-start.at>1300)return;
  const end=e.changedTouches[0],dx=end.clientX-start.x,dy=end.clientY-start.y;
  if(dx<75||Math.abs(dy)>Math.abs(dx)*0.55)return;
  // Native WKWebView or another handler may already have navigated.
  if(route()!==start.from)return;
  // Delegates to the single reviewed 14-entry handler. It uses replaceState
  // and consumes duplicate gestures to prevent momentary intermediate pages.
  window.viNativeHandleBackR4?.();
 },{capture:true,passive:true});
 // The main backup exporter builds + validates the same schema-2 JSON as
 // Android/Web. iOS saves it through the native Filesystem + Share plugins,
 // allowing the user to choose 'Save to Files'. No cloud upload by us.
 window.viIosExportBackup=async(data,filename)=>{
  if(!isiOS())throw Error('Not on iOS');
  if(data?.format!=='gta-vi-guest-backup'||data?.schema!==2)throw Error('Invalid backup');
  const fs=window.Capacitor?.Plugins?.Filesystem||window.Capacitor?.registerPlugin?.('Filesystem');
  const share=window.Capacitor?.Plugins?.Share||window.Capacitor?.registerPlugin?.('Share');
  if(!fs?.writeFile||!share?.share)throw Error('Missing iOS Filesystem/Share plugin');
  const result=await fs.writeFile({path:filename,data:JSON.stringify(data,null,2),directory:'CACHE',encoding:'utf8'});
  if(!result?.uri)throw Error('Share file URI unavailable');
  return share.share({title:'Mi partida - Game Atlas',url:result.uri,dialogTitle:'Guardar copia de Mi partida'});
 };
})();
