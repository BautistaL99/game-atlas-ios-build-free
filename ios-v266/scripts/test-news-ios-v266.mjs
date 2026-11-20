import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const src=resolve(dirname(fileURLToPath(import.meta.url)),'../www');
const officialAlbum={
 id:'rockstar-585094a46f8882dd13607ab2',category:'actualizaciones',status:'verified',
 publishedAt:'2026-11-20',title:{es:'Álbum GTA VI',en:'GTA VI Album',pt:'Álbum GTA VI'},summary:{es:'El álbum',en:'The album',pt:'O álbum'},
 image:{type:'official',remote:'https://media-rockstargames-com.akamaized.net/tina-uploads/posts/k4a8955a93o747/e47c077621ea90ee966fcab7221f8db961e5d60c.jpg',
 officialPage:'https://www.rockstargames.com/newswire/article/k4a8955a93o747/grand-theft-auto-vi-the-album-now-available'},
 sources:[{url:'https://www.rockstargames.com/newswire/article/k4a8955a93o747/grand-theft-auto-vi-the-album-now-available'}]
};
const escaped=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function ctx(stories=[officialAlbum]){
 const handlers=[];
 const target={hostname:'localhost',search:'',hash:''};
 const ctx={URL,URLSearchParams,location:target,
  document:{addEventListener:(event,listener)=>{if(event==='error')handlers.push(listener)}},
  records:stories,locale:'es',esc:escaped,tr:value=>typeof value==='string'?value:value.es,
  thumb:()=>'<span class="neutral-placeholder">SIN FOTO</span>',store:()=>[],
  Intl,Date,Set,Map,console};
 ctx.window=ctx;ctx.window.location=target;
 vm.createContext(ctx);
 for(const name of ['atlas-v254-dynamic-media.js','news-photo-manifest-v258.js','news-v155.js']){
  vm.runInContext(readFileSync(join(src,name),'utf8'),ctx,{filename:name});
 }
 return {ctx,handlers};
}
test('V266 iOS image renderer accepts the exact Rockstar URL instead of silently discarding it',()=>{
 const {ctx:c}=ctx();const photos=c.viDynamicMediaV254.photos(officialAlbum);
 assert.equal(photos.length,1);
 assert.equal(photos[0].src,officialAlbum.image.remote);
});
test('V266 news uses exact Rockstar article photo even when a verified signed editorial fallback exists',()=>{
 const {ctx:c}=ctx();
 c.viDynamicMediaV254.registerSignedImage(officialAlbum.id,'blob:signed-v266');
 officialAlbum.image.data='blob:signed-v266';
 const html=c.viNewsPage('/noticias');
 assert(html.includes('src="'+officialAlbum.image.remote+'"'), 'original press photo first');
 assert(html.includes('data-vi-news-signed-fallback="blob:signed-v266"'), 'signed editorial art available as fallback');
 assert(!html.includes('ga-v254-image-empty'), 'no empty news image area');
 delete officialAlbum.image.data;
});
test('If the original image is inaccessible on iPhone, the same signed story illustration is used',()=>{
 const {ctx:c,handlers}=ctx();
 const img={tagName:'IMG',src:'https://media-rockstargames-com.akamaized.net/1.jpg',attrs:{'data-vi-news-signed-fallback':'blob:signed-v266'},style:{},
  classList:{contains:x=>x==='v258-source-news-image',remove:()=>{}},
  hasAttribute(key){return key in this.attrs},getAttribute(key){return this.attrs[key]||null},removeAttribute(key){delete this.attrs[key]},
  closest:()=>({classList:{add:()=>{}}})};
 for(const handler of handlers)handler({target:img});
 assert.equal(img.src,'blob:signed-v266');
 assert.equal(img.attrs['data-vi-news-signed-fallback'],undefined);
});
test('Record-specific Rockstar association blocks unrelated news photographs',()=>{
 const {ctx:c}=ctx();
 assert.equal(c.viSameRockstarNewsPostV266(officialAlbum.image.remote,officialAlbum.sources[0].url),true);
 assert.equal(c.viSameRockstarNewsPostV266(officialAlbum.image.remote,'https://www.rockstargames.com/newswire/article/wrong123/other-news'),false);
 assert.equal(c.viSameRockstarNewsPostV266('https://example.org/example.jpg',officialAlbum.sources[0].url),false);
 assert.equal(c.viSameRockstarNewsPostV266('javascript:alert(1)',officialAlbum.sources[0].url),false);
});
test('Signed artwork is allowed ONLY when registered by the validated downloader',()=>{
 const {ctx:c}=ctx();
 const fake={...officialAlbum,id:'rockstar-safe-test',image:{data:'blob:unapproved'},sources:officialAlbum.sources};
 assert.equal(c.viDynamicMediaV254.photos(fake).length,0);
 c.viDynamicMediaV254.registerSignedImage(fake.id,'blob:signed-safe-test');
 fake.image.data='blob:signed-safe-test';
 assert.equal(c.viDynamicMediaV254.photos(fake)[0].src,'blob:signed-safe-test');
});
test('The 19 and 20 November photos are from the corresponding original articles',()=>{
 const {ctx:c}=ctx();
 for(const id of ['rockstar-d2760b55b1af3f1db47400ad','rockstar-585094a46f8882dd13607ab2']){
  const x=c.viV258NewsPhotos[id];assert(x);
  assert(c.viSameRockstarNewsPostV266(x.image,x.sourceUrl));
  assert.equal(x.mediaType,'exact-official-news-photo');
 }
});
test('News still sorts verified official and community reporting independently',()=>{
 const fake={id:'community-sample',category:'actualizaciones',status:'verified',facets:{community:1},
  publishedAt:'2026-11-21',title:{es:'Rumor',en:'Rumor',pt:'Boato'},summary:{es:'Comunidad',en:'Community',pt:'Comunidade'},sources:[{url:'https://gta.wiki/wiki/example'}]};
 const {ctx:c}=ctx([fake,officialAlbum]);
 assert.equal(c.viNewsItems(false).length,1);
 assert.equal(c.viNewsItems(true).length,1);
 assert.equal(c.viNewsItems(null)[0].id,fake.id);
});
test('iOS edge Back gesture delegates to existing R18 nested navigation without touching map',()=>{
 const events={},calls=[];
 const ctx={URL,URLSearchParams,Date,console,location:{hash:'#/explorar/armas'},
  Capacitor:{getPlatform:()=>'ios'},
  document:{documentElement:{classList:{add:s=>calls.push('class:'+s)}},addEventListener:(event,fn)=>{events[event]=fn}},
  viNativeHandleBackR4:()=>{calls.push('back');return true}};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(readFileSync(join(src,'mobile-v226-ios.js'),'utf8'),ctx);
 const target={closest:()=>false};
 events.touchstart({touches:[{clientX:5,clientY:250}],target});
 events.touchend({changedTouches:[{clientX:140,clientY:255}]});
 assert.equal(calls.filter(x=>x==='back').length,1);
 assert.equal(typeof ctx.viIosExportBackup,'function');
});
test('Home News now selects the same verified article photo as the dedicated News tab',()=>{
 const app=readFileSync(join(src,'app-v137.js'),'utf8');
 assert(app.includes('exactNews=entry.kind===\'official\'&&linked&&window.viSameRockstarNewsPostV266?.('));
 assert(app.includes('photo=exactNews||linked?.image?.remote||linked?.image?.data'));
});
