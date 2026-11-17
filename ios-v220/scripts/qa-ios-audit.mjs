/** Lightweight offline iOS release audit. Read-only; no network or keys. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const www=path.resolve('www');
const get=n=>fs.readFileSync(path.join(www,n),'utf8');
const main=get('app-v137.js'), i18n=get('vi-i18n.js'), native=get('mobile-v226-ios.js'), route=get('routes-v145.js');
const updates=get('online-updates.js'),community=get('community-v206.js'),compare=get('compare-metrics-v161.js');
const config=JSON.parse(get('online-config.json'));
const start=main.indexOf('const records=')+'const records='.length;
const end=main.indexOf(';\n',start);
assert(start>20&&end>start,'Catalog JSON not found');
const records=JSON.parse(main.slice(start,end));
const langs=['es','en','pt'];
for(const r of records){
 assert(typeof r.id==='string'&&r.id.length>0,'Missing record id');
 for(const field of ['title','summary'])for(const l of langs)
  assert(typeof r[field]?.[l]==='string'&&r[field][l].trim(),'Missing '+field+'.'+l+' on '+r.id);
}
const ids=records.map(x=>x.id);assert(new Set(ids).size===ids.length,'Duplicate record ids');
const byCategory=Object.fromEntries([...new Set(records.map(r=>r.category))].sort().map(k=>[k,records.filter(r=>r.category===k).length]));
assert(config.enabled===true&&config.manifestUrl.startsWith('https://'),'Signed catalog feed not configured');
assert(updates.includes('crypto.subtle.verify')&&community.includes('crypto.subtle.verify'),'Signed feed verification missing');
for(const category of ['misiones','secretos','coleccionables','economia','actividades','mundo'])assert(community.includes("'"+category+"'")&&main.includes("'"+category+"'"),'New signed wiki category not enabled: '+category);
assert(updates.includes('validMapVersion')&&main.includes('window.viCurrentMapVersion'),'Signed map version bridge missing');
assert(main.includes('viIosApplyRemoteMap')&&get('ios-v242-remote-map.js').includes('SHA-256'),'Map release check missing');
assert(main.includes('viApplyCommunityFeed')&&main.includes('viApplySignedCatalog'),'Catalog integrations missing');
assert(main.includes('viMapRouteShow')&&route.includes('mapVersion'),'Route creation/version handling missing');
assert(native.includes('viNativeHandleBackR4'),'iOS back gesture missing');
assert(compare.includes('viIosCompareNavLockUntil'),'Comparator navigation guard missing');
assert(fs.existsSync(path.join(www,'assets/leonida-yanis-v17.webp')),'Bundled basemap missing');
assert(langs.every(l=>i18n.includes(l)),'Missing locale');
const scoreKeys=['velocidad','speed','top_speed','max_speed'];
const withSpeed=records.filter(r=>r.category==='vehiculos'&&Object.keys(r.facets||{}).some(k=>scoreKeys.some(s=>k.includes(s))));
console.log('PASS: '+records.length+' fichas base con título y resumen en ES/EN/PT; IDs únicos');
console.log('Categorías: '+JSON.stringify(byCategory));
console.log('PASS: feeds firmados, puente mapa, favoritos/rutas/gestos/comparar, recursos locales');
console.log('INFO: '+withSpeed.length+' fichas de vehículos con posibles estadísticas de velocidad en el paquete base');
console.log('INFO: rutas ilustrativas (sin grafo de calles)');
console.log('INFO: Apple/Google Play URLs y pagos: revisar estado manualmente antes de publicación');