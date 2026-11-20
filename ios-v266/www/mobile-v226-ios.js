/* Game Atlas iOS native bridge: left-edge navigation and optional Files backup.
   This operates ONLY in Capacitor iOS, never Android/Web or the signed catalog. */
(()=>{'use strict';
 const isiOS=()=>window.Capacitor?.getPlatform?.()==='ios';
 if(!isiOS())return;
 document.documentElement.classList.add('vi-ios-app');
 const route=()=>{try{return decodeURIComponent((location.hash||'#/').slice(1)).split('?')[0]}catch{return '/'}};
 const detail=p=>/^\/(?:ficha|detalle)\/[^/]+/.test(p)||/^\/explorar\/[^/]+/.test(p)||/^\/noticias\/[^/]+/.test(p)||/^\/rankings\/(?:speedruns|donaciones)$/.test(p)||p==='/noticias';
 const blocked=e=>!!e.target?.closest?.('.atlas-map,.atlas-pin-editor,.atlas-popup,.atlas-filters,.mobile-more[open],input,textarea,select,[contenteditable="true"],.vi-map-filter-chips');
 let touch=null;
 document.addEventListener('touchstart',e=>{
  touch=null;if(e.touches.length!==1)return;
  const from=route(),t=e.touches[0];
  if(!detail(from)||t.clientX>32||blocked(e))return;
  touch={x:t.clientX,y:t.clientY,at:Date.now(),from};
 },{capture:true,passive:true});
 document.addEventListener('touchcancel',()=>{touch=null},{capture:true,passive:true});
 document.addEventListener('touchend',e=>{
  const start=touch;touch=null;
  if(!start||e.changedTouches.length!==1||Date.now()-start.at>1300)return;
  const end=e.changedTouches[0],dx=end.clientX-start.x,dy=end.clientY-start.y;
  if(dx<75||Math.abs(dy)>Math.abs(dx)*.55||route()!==start.from)return;
  window.viNativeHandleBackR4?.();
 },{capture:true,passive:true});
 window.viIosExportBackup=async(data,filename)=>{
  if(!isiOS()||data?.format!=='gta-vi-guest-backup'||data?.schema!==2)throw Error('Invalid native iOS backup');
  const fs=window.Capacitor?.Plugins?.Filesystem||window.Capacitor?.registerPlugin?.('Filesystem');
  const share=window.Capacitor?.Plugins?.Share||window.Capacitor?.registerPlugin?.('Share');
  if(!fs?.writeFile||!share?.share)throw Error('Missing native iOS Filesystem/Share plugins');
  const result=await fs.writeFile({path:filename,data:JSON.stringify(data,null,2),directory:'CACHE',encoding:'utf8'});
  if(!result?.uri)throw Error('Native iOS backup file URI unavailable');
  return share.share({title:'Mi partida - Game Atlas',url:result.uri,dialogTitle:'Guardar copia de Mi partida'});
 };
})();
