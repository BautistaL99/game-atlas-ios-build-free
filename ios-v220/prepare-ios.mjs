/* Stage/verify the standalone reviewed client; DO NOT overwrite or fetch web sources. */
import {stat,readFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),www=join(root,'www');
const must=['index.html','app-v137.js','online-updates.js','online-config.json','community-v206.js','news-v155.js','vi-i18n.js','mobile-v224-native.js','mobile-v224-native.css','mobile-v226-ios.js','mobile-v226-ios.css','partida-transfer-v225.js','partida-transfer-v225.css','assets/original/atlas-neon-coast-v219.svg'];
for(const f of must)if((await stat(join(www,f))).size===0)throw Error('Empty source: '+f);
const html=await readFile(join(www,'index.html'),'utf8');
if(!html.includes('name="vi-web-release" content="V220"'))throw Error('V220 marker missing');
if(/noindex,nofollow|preview-storage-v216\.js/.test(html))throw Error('Preview-only page');
for(const f of must.filter(x=>x.endsWith('.js')||x.endsWith('.css')))
 if(!html.includes('./'+f)){
  if(f==='online-updates.js'||f==='community-v206.js'||f==='news-v155.js'||f==='vi-i18n.js'||f==='app-v137.js'||f==='mobile-v224-native.js'||f==='mobile-v226-ios.js'||f==='partida-transfer-v225.js'||f==='mobile-v224-native.css'||f==='mobile-v226-ios.css'||f==='partida-transfer-v225.css')
   throw Error('HTML does not reference '+f);
 }
const conf=JSON.parse(await readFile(join(www,'online-config.json'),'utf8'));
if(conf.enabled!==true||!conf.publicKeyEd25519Base64||conf.schema!==1)throw Error('Signed feeds not configured');
console.log('Verified: V220 native iOS source, maps, signed news/wiki, iOS navigation and backup share.');
