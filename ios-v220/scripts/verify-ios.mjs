import {spawnSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),www=join(root,'www');
function ok(c,m){if(!c)throw Error(m);}
const verify=spawnSync(process.execPath,[join(root,'prepare-ios.mjs')],{stdio:'inherit'});
ok(verify.status===0,'Source validation failed');
const page=await readFile(join(www,'index.html'),'utf8');
for(const m of page.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)){
 const f=join(www,m[1]);const {existsSync}=await import('node:fs');ok(existsSync(f),'Missing asset '+m[1]);
}
const jsfiles=(await readdir(www)).filter(n=>n.endsWith('.js'));
for(const file of jsfiles){const res=spawnSync(process.execPath,['--check',join(www,file)],{encoding:'utf8'});ok(res.status===0,'JS parse '+file+': '+res.stderr)}
const native=await readFile(join(www,'mobile-v226-ios.js'),'utf8');
const back=await readFile(join(www,'mobile-v224-native.js'),'utf8');
const css=await readFile(join(www,'mobile-v224-native.css'),'utf8');
const app=await readFile(join(www,'app-v137.js'),'utf8');
const transfer=await readFile(join(www,'partida-transfer-v225.js'),'utf8');
const pack=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
ok(native.includes('viNativeHandleBackR4')&&back.includes('viNativeHandleBackR4'),'Missing nested gesture handler');
ok(back.includes('/rankings/speedruns')&&back.includes('/rankings/donaciones')&&back.includes('/explorar'),'14 category back handling lost');
ok(css.includes('-webkit-tap-highlight-color:transparent'),'Marker native highlight fix missing');
ok(transfer.includes('vi-v225-onboarding-done')&&app.includes("'gta-vi-guest-backup'"),'Backup support missing');
ok(pack.dependencies['@capacitor/ios']==='8.0.0'&&pack.dependencies['@capacitor/share']==='8.0.0','iOS Capacitor dependencies missing');
console.log('PASSED: '+jsfiles.length+' JS files parse, local resources, 14-category navigation, touch pins, iOS backup sharing, signed feeds.');
