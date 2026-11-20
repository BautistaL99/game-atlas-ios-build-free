// V266 R18 native iOS: no source downloads or HTML replacement. One-to-one source.
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const www=join(root,'www');
const must=['index.html','app-v137.js','app-v137.css','news-v155.js','news-photo-manifest-v258.js',
 'atlas-v254-dynamic-media.js','online-updates.js','online-config.json','community-v206.js',
 'mobile-v224-native.js','mobile-v224-native.css','mobile-v226-ios.js','mobile-v226-ios.css','partida-transfer-v225.js',
 'assets/leonida-yanis-v17.webp','assets/original/atlas-neon-coast-v219.svg','privacy.html'];
for(const name of must){const f=join(www,name);if((await stat(f)).size===0)throw Error('Empty/missing V266 R18 resource '+name)}
const index=await readFile(join(www,'index.html'),'utf8');
if(!index.includes('name="vi-web-release" content="V266-R18-IOS"'))throw Error('Wrong source: expected V266 R18 iOS');
if(!index.includes('news-v155.js?rev=v266-r18-ios-photo-priority')||!index.includes('atlas-v254-dynamic-media.js?rev=v266-r18-ios-safe-photo'))throw Error('News fix missing from native client');
const config=JSON.parse(await readFile(join(www,'online-config.json'),'utf8'));
if(config.schema!==1||!config.enabled||!config.manifestUrl.includes('catalog-envelope.json')||!config.publicKeyEd25519Base64)throw Error('Remote signed catalog is not configured');
console.log('OK: V266 R18 native source, signed remote updates, ES/EN/PT news and exact iOS media fix.');
