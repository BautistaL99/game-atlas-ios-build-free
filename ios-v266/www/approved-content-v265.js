/* Game Atlas V265 approved-data client. Fetches JSON ONLY; ED25519 signatures required.
 * Runs separately from existing news/wiki feed. No code, HTML or CSS is fetched. */
(()=>{'use strict';
 const CFG='./approved-content-config-v265.json';
 const SIZE=2500000,IMAGE_SIZE=900000,TIMEOUT=12000;
 let settings=null,checking=false,last=-1,pending=null,previous=null,activeImages=new Map(),imageHashes=new Map();
 // R14: only verified image bytes are persisted; failures can be retried without changing a published revision.
 const VERIFIED_OWNER_CACHE='ga-v265-owner-images-sha256';
 let imageUpdatePromise=null,lastError=null,lastSuccessfulCheck=null,imageFailures=new Set();
 const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const hex=v=>Array.from(new Uint8Array(v),x=>x.toString(16).padStart(2,'0')).join('');
 const keyName=()=>`ga-v265-owner-approved-${settings.channel}`;
 const trustedUrl=raw=>{const u=new URL(raw,location.href);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.hash)throw Error('Bad feed URL');if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('Secure feed required');return u;};
 async function readSettings(){
  const r=await fetch(CFG,{cache:'no-store'});if(!r.ok)throw Error('Approval config unavailable');
  const c=await r.json();if(c.enabled!==true)return null;
  if(!['preview','production'].includes(c.channel)||typeof c.publicKeyEd25519Base64!=='string'||c.publicKeyEd25519Base64.length!==44)throw Error('Approval key not configured');
  if(!['preview','production'].includes(c.channel))throw Error('Bad channel');
  const endpoint=trustedUrl(c.channel==='preview'?c.previewUrl:c.productionUrl);
  return {channel:c.channel,key:c.publicKeyEd25519Base64,url:endpoint.href,refreshMs:Math.max(15,Math.min(1440,Number(c.checkMinutes)||60))*60000};
 }
 async function validateEnvelope(env){
  if(!env||env.schema!==265||typeof env.payload!=='string'||env.payload.length>SIZE||!(/^[A-Za-z0-9+/=]+$/).test(env.payload)||typeof env.signature!=='string'||env.signature.length>140)throw Error('Invalid approved feed');
  const key=b64(settings.key),sig=b64(env.signature);if(key.length!==32||sig.length!==64)throw Error('Key/signature size');
  const pub=await crypto.subtle.importKey('raw',key,'Ed25519',false,['verify']);
  // Signature on payload BASE64 text to match existing signed-catalog convention.
  if(!await crypto.subtle.verify('Ed25519',pub,sig,new TextEncoder().encode(env.payload)))throw Error('Approval signature rejected');
  const bytes=b64(env.payload);if(bytes.length>SIZE)throw Error('Approved payload too large');
  const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  return window.viApprovedSchemaV265.validate(parsed);
 }
 function editing(){return !!document.querySelector('#vi-route-create,.atlas-pin-editor,.vi-route-import')||!!document.querySelector('input:focus,textarea:focus,[contenteditable="true"]:focus');}
 function flush(){
  if(!pending||editing())return;
  const parsed=pending;pending=null;
  if(!window.viApplyReviewedContentV265(parsed.changes)){
   console.warn('Approved catalog not applied: ID conflict. Kept previous verified records.');return;
  }
  last=parsed.revision;
  try{localStorage.setItem(keyName(),JSON.stringify(previous))}catch(e){console.warn('Approved data loaded but cache could not be saved:',e.message)}
  void updateImages(parsed.changes);
  dispatchEvent(new CustomEvent('vi:approved-content-updated',{detail:{revision:last,count:parsed.changes.length,channel:settings.channel}}));
 }
 async function updateImages(changes){
  // Changes arriving during a previous image batch must NOT be discarded.
  if(imageUpdatePromise)return imageUpdatePromise.then(()=>updateImages(changes));
  imageUpdatePromise=doUpdateImages(changes).finally(()=>{imageUpdatePromise=null});
  return imageUpdatePromise;
 }
 async function doUpdateImages(changes){
  const newlyVerified=[],oldObjectUrls=[];
  for(const change of changes){if(!change.image||imageHashes.get(change.id)===change.image.sha256)continue;
   const data=change.image;
   try{
    const u=new URL(data.path.replace(/^updates\//,''),settings.url);
    if(u.origin!==new URL(settings.url).origin||!u.pathname.includes('/assets/'))throw Error('Asset host mismatch');
    const cache=(typeof caches!=='undefined'&&caches.open)?await caches.open(VERIFIED_OWNER_CACHE).catch(()=>null):null;
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),TIMEOUT);
    let r,fromNetwork=false;try{
     try{r=await fetch(u.href,{cache:'no-store',redirect:'error',signal:ctrl.signal});fromNetwork=!!r?.ok}
     catch(error){r=cache?await cache.match(u.href):null;if(!r)throw error}
    }finally{clearTimeout(timer)}
    if(!r.ok||Number(r.headers.get('content-length')||0)>IMAGE_SIZE)throw Error('Missing/large asset');
    const bytes=await r.arrayBuffer();if(bytes.byteLength>IMAGE_SIZE||hex(await crypto.subtle.digest('SHA-256',bytes))!==data.sha256)throw Error('Asset hash rejected');
    const b=new Uint8Array(bytes),h=String.fromCharCode(...b.slice(0,12));
    const kind=u.pathname.endsWith('.png')?'image/png':u.pathname.match(/\.jpe?g$/)?'image/jpeg':'image/webp';
    if(kind==='image/png'&&!(b[0]===137&&h.slice(1,4)==='PNG')||kind==='image/jpeg'&&!(b[0]===255&&b[1]===216)||kind==='image/webp'&&!(h.slice(0,4)==='RIFF'&&h.slice(8,12)==='WEBP'))throw Error('Image magic mismatch');
    if(fromNetwork&&cache)await cache.put(u.href,new Response(bytes.slice(0),{status:200,headers:{'Content-Type':kind}})).catch(()=>{});
    const blob=URL.createObjectURL(new Blob([bytes],{type:kind})),old=activeImages.get(change.id);
    newlyVerified.push({id:change.id,url:blob});activeImages.set(change.id,blob);imageHashes.set(change.id,data.sha256);imageFailures.delete(change.id);
    if(old)oldObjectUrls.push(old);
   }catch(e){imageFailures.add(change.id);console.warn('Approved image rejected, keeping existing one:',change.id,e.message)}
  }
  // R16: one re-render per successfully downloaded batch, not one for every
  // photograph. Revoke old object URLs only after the new DOM references exist.
  if(newlyVerified.length){
   window.viUpdateSignedImages?.(newlyVerified);
   for(const old of oldObjectUrls)URL.revokeObjectURL(old);
  }
 }
 async function poll(){if(!settings||checking||!navigator.onLine)return;checking=true;
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),TIMEOUT);
  try{
   const r=await fetch(settings.url,{cache:'no-store',redirect:'error',signal:ctrl.signal,headers:{Accept:'application/json'}});
   if(!r.ok||Number(r.headers.get('content-length')||0)>SIZE)throw Error('No approved feed');
   const raw=await r.text();if(raw.length>SIZE)throw Error('Oversized feed');
   const envelope=JSON.parse(raw),approved=await validateEnvelope(envelope);
   lastSuccessfulCheck=Date.now();lastError=null;
   if(approved.revision<last)return;
   if(approved.revision===last){if(imageFailures.size)void updateImages(approved.changes);return;}
   previous=envelope;pending=approved;flush();
  }catch(e){lastError=String(e?.message||e);console.warn('Approved content update skipped; previous data unchanged:',e.message)}finally{checking=false;clearTimeout(timer)}
 }
 async function boot(){try{
  settings=await readSettings();if(!settings)return;
  const cache=localStorage.getItem(keyName());
  if(cache){try{const env=JSON.parse(cache),data=await validateEnvelope(env);previous=env;pending=data;flush()}catch(e){console.warn('Invalid owner-approved cache ignored:',e.message)}}
  await poll();
  setInterval(()=>{if(!document.hidden)void poll()},settings.refreshMs);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){flush();void poll()}});
  window.addEventListener('online',()=>void poll());
  window.addEventListener('hashchange',()=>setTimeout(flush,150));
  document.addEventListener('focusout',()=>setTimeout(flush,200));
  // The earlier signed catalog might finish after our cache; keep approved values highest priority.
  window.addEventListener('vi:signed-catalog-updated',()=>{if(last>0&&previous)void validateEnvelope(previous).then(data=>{pending=data;flush()}).catch(()=>{})});
  window.addEventListener('vi:community-content-updated',()=>{if(previous)void validateEnvelope(previous).then(data=>{pending=data;flush()}).catch(()=>{})});
  window.viCheckApprovedContentV265=()=>void poll();
  window.viApprovedFeedStatusV265=()=>({enabled:true,channel:settings.channel,revision:last,pending:!!pending,imageFailures:[...imageFailures],lastError,lastSuccessfulCheck});
 }catch(e){console.warn('Owner approval updates disabled:',e.message)}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else void boot();
})();
