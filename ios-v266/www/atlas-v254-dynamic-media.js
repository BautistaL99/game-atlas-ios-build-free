/* Game Atlas V254.1 — stable image renderer for the WEB PREVIEW.
 * Exact per-record media only, no name-based guesses. Existing signed image/gallery fields
 * are accepted only with safe providers; third-party art requires separate rights review.
 * QA-only SVGs are NOT actual GTA VI screenshots and never become catalog items.
 */
(function(root){'use strict';
 const preview=/^(localhost|127\.0\.0\.1|gta6mapa--[a-z0-9-]+\.(?:web\.app|firebaseapp\.com))$/i.test(root.location?.hostname||'');
 const qa=preview&&new URLSearchParams(root.location.search).get('atlas_qa')==='1';
 const words={
  es:{missing:'Imagen del elemento aún no verificada',broken:'No se pudo cargar la imagen verificada',source:'Imagen promocional de Rockstar Games',image:'Imagen',gallery:'Imágenes verificadas'},
  en:{missing:'No verified image for this item yet',broken:'Verified image could not be loaded',source:'Rockstar Games promotional image',image:'Image',gallery:'Verified images'},
  pt:{missing:'Imagem deste item ainda não verificada',broken:'Não foi possível carregar a imagem verificada',source:'Imagem promocional da Rockstar Games',image:'Imagem',gallery:'Imagens verificadas'}
 };
 const exactOfficial={
  '95-grotti-cheetah':['ULTIMATE_EDITION_GROTTI_CHEETAH_01.0a.wy3s_ogjey.jpg','ULTIMATE_EDITION_GROTTI_CHEETAH_02.0rkrlsu_dg~ww.jpg','ULTIMATE_EDITION_GROTTI_CHEETAH_03.0v3_dryhtjarc.jpg','ULTIMATE_EDITION_GROTTI_CHEETAH_04.0caq_y0_f1rvt.jpg'],
  '67-vapid-dominator-buggy':['ULTIMATE_EDITION_VAPID_BUGGY_01.0jxfiql~371ik.jpg','ULTIMATE_EDITION_VAPID_BUGGY_02.0tf15jp~61bkj.jpg','ULTIMATE_EDITION_VAPID_BUGGY_03.0s2rbkg98-0ac.jpg','ULTIMATE_EDITION_VAPID_BUGGY_04.0_29d.bgfvon7.jpg'],
  '55-vapid-stanier':['VINTAGE_VICE_CITY_PACK_VAPID_STANIER_01.004m_8d1~qngy.jpg'],
  'ganado-retro-build':['ULTIMATE_EDITION_VAPID_GANADO_RETRO_BUILD_01.062dgvkwdynw5.jpg'],
  'shitzu-squalo':['ULTIMATE_EDITION_SQUALO_01.0cim7hj58ypb1.jpg','ULTIMATE_EDITION_SQUALO_02.09qplkj.rjnk7.jpg','ULTIMATE_EDITION_SQUALO_03.0quncwrsw97j1.jpg','ULTIMATE_EDITION_SQUALO_04.00vlesedwtiuy.jpg'],
  'dinka-enduro':['ULTIMATE_EDITION_SAFEHOUSE_VEHICLES_02.0-2n5rm9n8.rq.jpg'],
  'crest-kayak':['ULTIMATE_EDITION_SAFEHOUSE_VEHICLES_03.0c9.qtpdi.tf..jpg'],
  'hawk-little-morgan-revolvers':['ULTIMATE_EDITION_HAWK_AND_LITTLE_MORGAN_REVOLVERS_01.0~3pdc~~sing4.jpg','ULTIMATE_EDITION_HAWK_AND_LITTLE_MORGAN_REVOLVERS_02.04e_9jco7lluf.jpg'],
  'jason-duval':['Jason_Duval_01.07m377xeb6jhq.jpg','Jason_Duval_02.1486~7_v40cn..jpg'],
  'lucia-caminos':['Lucia_Caminos_01.0a7yqvewctkfp.jpg','Lucia_Caminos_02.16n.5umvlu_48.jpg'],
  'boobie-ike':['Boobie_Ike_01.0-wji2pg5anfs.jpg'],
  'brian-heder':['Brian_Heder_01.0r.ute88os9k-.jpg'],
  'cal-hampton':['Cal_Hampton_01.0xlil231_osh4.jpg'],
  'dre-quan-priest':['DreQuan_Priest_01.0_0~wi-ipdj35.jpg'],
  'raul-bautista':['Raul_Bautista_01.0md1ii-yrn96r.jpg'],
  'real-dimez':['Real_Dimez_01.0djwwboo8-glx.jpg'],
  'rideout-customs':['ULTIMATE_EDITION_RIDEOUT_CUSTOMS_01.065-ms8~k8vbq.jpg','ULTIMATE_EDITION_RIDEOUT_CUSTOMS_02.0u9jg4xxbm_yd.jpg'],
  'electric-fang-tattoo':['ULTIMATE_EDITION_ELECTRIC_FANG_01.04tsytu7qp2b-.jpg'],
  'one-eyed-willies':['ULTIMATE_EDITION_ONE_EYED_WILLIE_01.0n7-__or5f.b6.jpg'],
  'stock-305':['ULTIMATE_EDITION_STOCK_305_01.0vuq0m5_1j-17.jpg'],
  'saras-unisex-salon':['ULTIMATE_EDITION_SARAS_SALON_01.0gn7dwlvcgz17.jpg'],
  'vice-city':['Vice_City_11.09paum3g942sc.jpg'],
  'leonida-keys':['Leonida_Keys_01.0zgz7tveur6y8.jpg'],
  'port-gellhorn':['Port_Gellhorn_01.0fmisvza-5-cq.jpg'],
  'grassrivers':['Grassrivers_01.1096rw4lbjur_.jpg'],
  'ambrosia':['Ambrosia_01.0rqphs0gazkm..jpg'],
  'mount-kalaga':['Mount_Kalaga_National_Park_01.0v5fl0f83hjv_.jpg']
 };
 const rockstarPrefix='https://www.rockstargames.com/VI/_next/static/media/';
 // Accept blob: only after the existing signed downloader verifies the asset SHA-256.
 const verifiedSignedBlobs=new Map();
 const registerSignedImage=(id,url)=>{if(typeof id==='string'&&/^[a-z0-9_-]{1,150}$/.test(id)&&typeof url==='string'&&url.startsWith('blob:'))verifiedSignedBlobs.set(id,url)};
 const exactSrc=name=>rockstarPrefix+name;
 const escape=x=>String(x===undefined||x===null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const tr=(x,lang)=>typeof x==='string'?x:x&&typeof x==='object'?(x[lang]||x.en||x.es||''):'';
 const language=x=>['en','es','pt'].includes(x)?x:'en';
 const blank=x=>!x||typeof x!=='string'||!x.trim();
 function accepted(src){
  if(blank(src)||src.length>600)return false;
  // local QA fixtures are only loaded when the test panel is explicitly active
  if(qa&&/^\.\/assets\/qa\/v254-(?:wide|tall|square|broken)\.svg$/.test(src))return true;
  // Do not accept illustrations, arbitrary HTTP hosts, data:, blob:, script or fake redirects.
  try{
   const u=new URL(src);
   if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return false;
   if(u.hostname==='www.rockstargames.com')return /^\/VI\/_next\/static\/media\/[a-zA-Z0-9._~%+-]+\.(?:jpe?g|png|webp)$/i.test(u.pathname)&&(!u.search||u.search==='?akim=1&imdensity=1&imwidth=1280');
   if(u.hostname==='media-rockstargames-com.akamaized.net')return /^\/tina-uploads\/posts\/[a-z0-9_-]+\/[a-f0-9]{40}\.(?:jpe?g|png|webp)$/i.test(u.pathname)&&!u.search;
  }catch{}
  return false;
 }
 function make(item){
  const out=[],seen=new Set();
  function put(src,credit,source){
   if(typeof src!=='string'||!src||!(accepted(src)||(verifiedSignedBlobs.has(item?.id)&&verifiedSignedBlobs.get(item?.id)===src))||seen.has(src)||out.length>=8)return;
   const title=item?.title||{};
   seen.add(src);out.push({src,alt:tr(title,'en')||'Game Atlas',credit:credit||{},source:source||''});
  }
  const main=item?.image;
  if(main&&main.type!=='concept'&&main.type!=='illustration'&&main.type!=='generic'&&
     (!main.recordId||main.recordId===item?.id)&&(!main.imageStatus||main.imageStatus==='verified')&&main.type!=='unverified'){
   // Prefer the original remote image from the verified source only when there
   // is no SHA-256-verified signed blob. A previously empty comparison
   // (undefined === undefined) used to throw away a valid remote URL.
   const signedPhoto=verifiedSignedBlobs.get(item?.id);
   const primary=typeof signedPhoto==='string'&&signedPhoto.startsWith('blob:')
     ?signedPhoto:(main.remote||main.data);
   put(primary,main.caption,main.officialPage);
  }
  // This explicit list maps screenshot filenames to the exact object/character/location;
  // no generic place or family cover is recycled as a different car or gun.
  if(exactOfficial[item?.id])for(const name of exactOfficial[item.id])
   put(exactSrc(name),words.en.source,'https://www.rockstargames.com/VI/media/screenshots');
  for(const row of Array.isArray(item?.gallery)?item.gallery.slice(0,10):[]){
   if(!row||row.recordId&&row.recordId!==item?.id||row.imageStatus&&row.imageStatus!=='verified')continue;
   if(!row.caption||!['en','es','pt'].every(x=>typeof row.caption[x]==='string'&&row.caption[x].trim()))continue;
   if(row.sourceUrl&&!/^https:\/\/www\.rockstargames\.com\/VI(?:\/|$)/.test(row.sourceUrl))continue;
   put(row.src,row.caption,row.sourceUrl);
  }
  return out;
 }
 function placeholder(lang,kind){
  const l=words[language(lang)],msg=kind==='broken'?l.broken:l.missing;
  return '<span class="ga-v254-image-unavailable" role="img" aria-label="'+escape(msg)+'"><span aria-hidden="true">▧</span><small>'+escape(msg)+'</small></span>';
 }
 function tile(item,cls,lang){
  const imgs=make(item),cl=/^(?:thumb|search-thumb|detail-thumb)$/.test(cls)?cls:'thumb';
  if(!imgs.length)return '<span class="'+cl+' ga-v254-image-tile ga-v254-image-empty">'+placeholder(lang)+'</span>';
  const first=imgs[0];return '<span class="'+cl+' ga-v254-image-tile ga-v254-image-real"><img data-ga-v254-real-image src="'+escape(first.src)+'" alt="'+escape(tr(item.title,lang)||first.alt)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">'+placeholder(lang,'broken')+'</span>';
 }
 function media(item,lang){
  const imgs=make(item),l=words[language(lang)];
  if(!imgs.length)return '<div class="ga-v254-media-stage ga-v254-image-empty">'+placeholder(lang)+'</div>';
  const slides=imgs.map((im,i)=>'<div class="vi-gallery-slide ga-v254-media-slide" data-vi-gallery-slide="'+i+'"'+(i?' hidden':'')+'><span class="ga-v254-photo-frame"><img class="detail-thumb ga-v254-photo" data-ga-v254-real-image src="'+escape(im.src)+'" alt="'+escape(tr(item.title,lang)||im.alt)+'" loading="'+(i?'lazy':'eager')+'" decoding="async" referrerpolicy="no-referrer">'+placeholder(lang,'broken')+'</span></div>').join('');
  if(imgs.length===1)return '<div class="ga-v254-media-stage">'+slides+'</div>';
  const thumbs=imgs.map((im,i)=>'<button type="button" data-vi-gallery-index="'+i+'" aria-label="'+escape(l.image)+' '+(i+1)+'" aria-pressed="'+(!i)+'"><span class="ga-v254-mini-photo"><img data-ga-v254-real-image src="'+escape(im.src)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">'+placeholder(lang,'broken')+'</span></button>').join('');
  return '<section class="vi-gallery ga-v254-media-gallery" aria-label="'+escape(l.gallery)+'" data-active="0"><div class="vi-gallery-stage ga-v254-media-stage">'+slides+'<button type="button" class="vi-gallery-nav vi-prev" data-vi-gallery-arrow="-1" aria-label="Previous image">‹</button><button type="button" class="vi-gallery-nav vi-next" data-vi-gallery-arrow="1" aria-label="Next image">›</button><span class="vi-gallery-counter">1 / '+imgs.length+'</span></div><div class="vi-gallery-thumbs">'+thumbs+'</div></section>';
 }
 function caption(item,lang){
  const imgs=make(item),l=words[language(lang)];
  if(!imgs.length)return escape(l.missing);
  if(qa&&imgs[0].src.startsWith('./assets/qa/'))return escape(lang==='es'?'Imagen sintética de prueba, no corresponde a GTA VI':lang==='pt'?'Imagem sintética de teste, não representa GTA VI':'Synthetic test image, not actual GTA VI content');
  if(verifiedSignedBlobs.get(item?.id)===imgs[0].src)return escape(lang==='es'?'Imagen validada del catálogo firmado':lang==='pt'?'Imagem validada do catálogo assinado':'Verified image from signed catalog');
  return escape(l.source)+' · <a href="https://www.rockstargames.com/VI/media/screenshots" target="_blank" rel="noopener noreferrer">'+escape(lang==='es'?'Ver fuente':lang==='pt'?'Ver fonte':'View source')+' ↗</a>';
 }
 if(typeof document!=='undefined')document.addEventListener('error',event=>{
  const img=event.target;
  if(img?.tagName!=='IMG'||!img.hasAttribute('data-ga-v254-real-image'))return;
  // Catch earlier than existing fallback handlers. Never substitute an unrelated image.
  img.removeAttribute('data-ga-v254-real-image');
  img.classList.add('ga-v254-image-load-failed');
  const frame=img.closest('.ga-v254-image-tile,.ga-v254-photo-frame,.ga-v254-mini-photo');
  if(frame)frame.classList.add('ga-v254-image-failed');
 },true);
 root.viDynamicMediaV254={tile,media,caption,photos:make,accepted,registerSignedImage,exactIds:Object.keys(exactOfficial),qaEnabled:qa};
})(window);
