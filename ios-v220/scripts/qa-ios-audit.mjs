/** Offline iOS pre-release audit: bundled content, languages and signed bridges. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const www=path.resolve('www');
const get=n=>fs.readFileSync(path.join(www,n),'utf8');
const main=get('app-v137.js'),i18n=get('vi-i18n.js'),native=get('mobile-v226-ios.js'),route=get('routes-v145.js');
const updates=get('online-updates.js'),community=get('community-v206.js'),compare=get('compare-metrics-v161.js');
const config=JSON.parse(get('online-config.json'));
const start=main.indexOf('const records=')+'const records='.length;
const end=main.indexOf(';\n',start);
assert(start>20&&end>start,'Catalog JSON not found');
const records=JSON.parse(main.slice(start,end)),langs=['es','en','pt'];
for(const r of records){
 assert(typeof r.id==='string'&&r.id.length>0,'Missing ID');
 for(const field of ['title','summary'])for(const l of langs)
  assert(typeof r[field]?.[l]==='string'&&r[field][l].trim(),'Missing '+field+'.'+l+' on '+r.id);
}
const ids=records.map(r=>r.id);
assert(new Set(ids).size===ids.length,'Duplicate IDs');
const categories=[...new Set(records.map(r=>r.category))].sort();
assert(config.enabled===true&&config.manifestUrl.startsWith('https://'),'Signed catalog not configured');
assert(updates.includes('crypto.subtle.verify')&&community.includes('crypto.subtle.verify'),'Missing signed feed verification');
assert(updates.includes('validMapVersion')&&main.includes('window.viCurrentMapVersion'),'Signed basemap transition unsupported');
assert(main.includes('viIosApplyRemoteMap')&&get('ios-v242-remote-map.js').includes('SHA-256'),'Remote map integrity validation missing');
assert(main.includes('viApplyCommunityFeed')&&main.includes('viApplySignedCatalog'),'Catalog integration missing');
assert(main.includes('viMapRouteShow')&&route.includes('mapVersion'),'Route versioning missing');
assert(native.includes('viNativeHandleBackR4'),'Native back gesture handler missing');
assert(compare.includes('viIosCompareNavLockUntil'),'Comparator forward-navigation guard missing');
assert(fs.existsSync(path.join(www,'assets/leonida-yanis-v17.webp')),'Packaged basemap missing');
assert(langs.every(l=>i18n.includes(l)),'Locale missing');
const withSpeed=records.filter(r=>r.category==='vehiculos'&&Object.keys(r.facets||{}).some(k=>['velocidad','speed','top_speed','max_speed'].some(s=>k.includes(s))));
console.log('PASS: '+records.length+' fichas base con títulos y resúmenes ES/EN/PT; IDs únicos');
console.log('Categorías: '+JSON.stringify(Object.fromEntries(categories.map(k=>[k,records.filter(r=>r.category===k).length]))));
console.log('PASS: feeds firmados, mapa, rutas ilustrativas, navegación iOS y comparador');
console.log('INFO: '+withSpeed.length+' fichas de vehículos con estadísticas de velocidad identificadas');
console.log('INFO: rutas por calles, publicidad y desbloqueo sin anuncios quedan fuera de este QA');
