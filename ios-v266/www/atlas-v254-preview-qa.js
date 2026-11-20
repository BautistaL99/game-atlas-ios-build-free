/* TEST CHANNEL ONLY — transient synthetic records, never a signed feed.
 * Render the actual Game Atlas detail view. No posts, localStorage or sign-in.
 * The test control does not appear on production hostnames.
 */
(function(root){'use strict';
 const hostname=String(root.location.hostname||'').toLowerCase();
 const allowed=/^(localhost|127\.0\.0\.1)$/.test(hostname)||/^gta6mapa--[a-z0-9-]+\.(?:web\.app|firebaseapp\.com)$/.test(hostname);
 if(!allowed||new URLSearchParams(root.location.search).get('atlas_qa')!=='1')return;
 const T=(es,en,pt)=>({es,en,pt});
 const title=T('PRUEBA, NO ES CONTENIDO REAL','TEST — NOT GAME DATA','TESTE, NÃO É DADO REAL');
 const src=[{label:'QA LOCAL, NO ES UNA FUENTE',url:'https://example.com/qa-only',checkedAt:''}];
 const fake=(id,cat,name,facts)=>({id,slug:id,category:cat,status:'verified',trackable:false,title:T('PRUEBA '+name,'TEST '+name,'TESTE '+name),summary:title,desc:title,
   sources:src,facts:facts.map(([key,value])=>({key,value,verified:true,source:'qa-local'})),
   tags:['qa-preview','solo-prueba'],facets:{qa_fixture:true}});
 const rawPhoto='https://www.rockstargames.com/VI/_next/static/media/ULTIMATE_EDITION_GROTTI_CHEETAH_01.0a.wy3s_ogjey.jpg';
 const qaCap=T('Imagen usada solo para probar el diseño','Photo used only for layout testing','Imagem usada somente para testar o layout');
 const qaImage=(path)=>({type:'qa',data:'./assets/qa/v254-'+path+'.svg',caption:qaCap});
 const qaGallery=path=>({src:'./assets/qa/v254-'+path+'.svg',caption:qaCap});
 const imageTest=(id,cat,name,options={})=>({...fake(id,cat,name,[['type','TEST: imagen controlada por QA']]),...options});
 const records={
  empty:fake('atlas-qa-v254-empty','vehiculos','Vehículo sin atributos',[]),
  unknown:fake('atlas-qa-v254-unknown','vehiculos','Datos desconocidos',[['engine','Unknown'],['speed','N/A'],['weight','?']]),
  full:fake('atlas-qa-v254-full','vehiculos','Vehículo con 18 atributos',[
   ['type','Sports'],['manufacturer','TEST Brand'],['model','TEST X'],['seats','2'],
   ['speed','TEST 220 km/h'],['acceleration','TEST 5.2 s'],['weight','TEST 1,400 kg'],
   ['engine','TEST V8'],['drive','TEST RWD'],['transmission','TEST manual'],
   ['body style','TEST coupe'],['colors','TEST red, blue, black'],
   ['price','TEST $100,000'],['unlock','TEST Chapter 3'],
   ['location','TEST, no verified coordinates'],['extra fact one','TEST extra one'],
   ['extra fact two','TEST extra two'],['extra fact three','TEST extra three']]),
  long:fake('atlas-qa-v254-long','armas','Arma con textos extremos',[
   ['damage','QA '+('long-test-description-'.repeat(8))],
   ['range','<img src=x onerror=alert(1)>'],['manufacturer','TEST Brand']]),
  mission:fake('atlas-qa-v254-mission','misiones','Misión sin ubicación vinculada',[
   ['chapter','TEST Chapter 1'],['prerequisites','TEST trigger'],
   ['reward','TEST reward'],['objectives','TEST objective']]),
  place:fake('atlas-qa-v254-place','mapa-lugares','Lugar sin coordenadas',[
   ['region','TEST Leonida'],['type','TEST landmark']]),
  'progress-1':fake('atlas-qa-v254-progress','vehiculos','Mismo vehículo / fase 1',[]),
  'progress-2':fake('atlas-qa-v254-progress','vehiculos','Mismo vehículo / fase 2',[
   ['type','TEST Sports'],['seats','TEST 2'],['engine','TEST V8']]),
  'progress-3':fake('atlas-qa-v254-progress','vehiculos','Mismo vehículo / fase 3',[
   ['type','TEST Sports'],['seats','TEST 2'],['engine','TEST V8'],['speed','TEST 220 km/h'],['colors','TEST blue'],['transmission','TEST manual']]),
  img_ok:imageTest('atlas-qa-v254-photo-ok','vehiculos','GROTTI CHEETAH - fotografía oficial',{
    image:{type:'official',remote:rawPhoto,recordId:'atlas-qa-v254-photo-ok',imageStatus:'verified',caption:qaCap,officialPage:'https://www.rockstargames.com/VI/media/screenshots'}}),
  img_multi:imageTest('atlas-qa-v254-photo-multi','vehiculos','Galería de proporciones (TEST)',{
    image:qaImage('wide'),gallery:[qaGallery('tall'),qaGallery('square')]}),
  img_vertical:imageTest('atlas-qa-v254-photo-vertical','personajes','Retrato vertical (TEST)',{image:qaImage('tall')}),
  img_horizontal:imageTest('atlas-qa-v254-photo-horizontal','mapa-lugares','Panorama horizontal (TEST)',{image:qaImage('wide')}),
  img_broken:imageTest('atlas-qa-v254-photo-broken','armas','Imagen inaccesible (TEST)',{image:qaImage('broken')}),
  img_missing:imageTest('atlas-qa-v254-photo-missing','vehiculos','Sin fotografía verificada (TEST)'),
  'img_progress-1':imageTest('atlas-qa-v254-photo-progress','vehiculos','Progreso imagen: fase 1, SIN FOTO'),
  'img_progress-2':imageTest('atlas-qa-v254-photo-progress','vehiculos','Progreso imagen: fase 2, 1 FOTO',{image:qaImage('wide')}),
  'img_progress-3':imageTest('atlas-qa-v254-photo-progress','vehiculos','Progreso imagen: fase 3, GALERÍA',{image:qaImage('wide'),gallery:[qaGallery('tall'),qaGallery('square')]})
 };
 let panel;
 function disableQAStateChanges(evt){
  if(!root.location.hash.includes('atlas-qa-v254-'))return;
  const node=evt.target.closest?.('[data-toggle]');
  if(node){evt.preventDefault();evt.stopImmediatePropagation()}
 }
 root.document.addEventListener('click',disableQAStateChanges,true);
 function load(key){
  const record=records[key];if(!record)return;
  if(typeof root.viApplySignedCatalog!=='function'){
   panel.querySelector('[data-ga-qa-status]').textContent='TEST FAIL: catálogo todavía no inicializado';return;
  }
  root.viApplySignedCatalog([record]);
  root.location.hash='#/ficha/'+encodeURIComponent(record.id);
  panel.querySelector('[data-ga-qa-status]').textContent='TEST '+key+' — solo esta pestaña. Si la foto externa falla, se muestra un mensaje, nunca otro elemento';
 }
 function start(){
  if(root.document.getElementById('ga-v254-qa-panel'))return;
  panel=root.document.createElement('aside');panel.id='ga-v254-qa-panel';
  panel.style.cssText='position:fixed;z-index:2147483635;right:8px;top:8px;max-width:min(92vw,390px);color:#fff;background:#142b35;border:2px solid #38d6bb;border-radius:12px;padding:12px;box-shadow:0 4px 28px #000a;font:13px/1.4 Arial,sans-serif;max-height:54vh;overflow:auto';
  panel.innerHTML='<button data-ga-qa-toggle type="button" aria-expanded="true" style="display:block;width:100%;text-align:left;background:#174852;color:#fff;font-weight:bold;padding:8px;border:1px solid #63d9bf;border-radius:8px;cursor:pointer">GAME ATLAS · QA V254.1 · MOSTRAR / OCULTAR</button><div data-ga-qa-controls><div style="font-weight:bold;margin-bottom:6px">FICHAS + IMÁGENES · SOLO PRUEBA</div><div style="margin-bottom:8px">Los datos que siguen son ficticios y NO se publican ni se guardan.</div>'+Object.keys(records).map(x=>'<button data-ga-qa-case="'+x+'" type="button" style="background:#194955;color:#fff;border:1px solid #73d4d2;border-radius:7px;padding:6px 9px;margin:3px;cursor:pointer">'+x+'</button>').join('')+'<div data-ga-qa-status style="margin-top:8px;font-size:12px;color:#b7f0e7">Elegí un caso para forzar una ficha en la interfaz real.</div><button data-ga-qa-reset type="button" style="margin-top:8px">Volver al catálogo real (recargar)</button></div>';
  const controls=panel.querySelector('[data-ga-qa-controls]');
  const toggle=panel.querySelector('[data-ga-qa-toggle]');
  const collapse=v=>{controls.hidden=v;toggle.setAttribute('aria-expanded',String(!v));panel.style.width=v?'min(72vw,290px)':''};
  if(root.innerWidth<700)collapse(true);
  panel.addEventListener('click',e=>{
   if(e.target.closest('[data-ga-qa-toggle]')){collapse(!controls.hidden);return}
   const btn=e.target.closest('[data-ga-qa-case]');
   if(btn){load(btn.dataset.gaQaCase);if(root.innerWidth<700)collapse(true)}
   if(e.target.closest('[data-ga-qa-reset]'))root.location.href=root.location.pathname;
  });
  root.document.body.appendChild(panel);
 }
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 root.gaV254QATest={cases:Object.keys(records),load};
})(window);
