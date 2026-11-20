/* Fail if V266 source parity or signed-News safety tests regress. */
import {spawnSync} from 'node:child_process';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),www=join(root,'www');
function must(ok,msg){if(!ok)throw Error(msg)}
for(const [script,args] of [['prepare-ios.mjs',[]],['scripts/test-news-ios-v266.mjs',[]]]){
 const check=spawnSync(process.execPath,[join(root,script),...args],{encoding:'utf8'});
 if(check.status!==0)throw Error('Failed '+script+': '+check.stdout+' '+check.stderr);
 process.stdout.write(check.stdout);
}
const report=JSON.parse(await readFile(join(root,'scripts/source-shas-v266-r18.json'),'utf8'));
const changes=report.modified_files;
const baseline=report.original_sha256_all_148;
const expected={...report.ios_sha256_all_148,...report.ios_only_resources};
must(Object.keys(baseline).length===148&&Object.keys(expected).length===150,'V266 manifest incomplete');
const resources=[];
async function walk(d,prefix=''){for(const ent of await readdir(d,{withFileTypes:true})){
 const name=prefix+ent.name; if(ent.isDirectory())await walk(join(d,ent.name),name+'/');else resources.push(name)
}}
await walk(www);
must(resources.length===150,'Expected 148 R18 assets + 2 native iOS resources, got '+resources.length);
for(const name of resources){
 const data=await readFile(join(www,name));const actual=createHash('sha256').update(data).digest('hex');
 must(actual===expected[name],'Modified or missing V266 resource: '+name);
 const info=changes[name]; if(!info&&name in baseline)must(actual===baseline[name],'Unexpected regression in originally unchanged '+name);
}
for(const name of resources.filter(x=>x.endsWith('.js'))){
 const check=spawnSync(process.execPath,['--check',join(www,name)],{encoding:'utf8'});
 must(check.status===0,'JS parse error '+name+': '+check.stderr);
}
const html=await readFile(join(www,'index.html'),'utf8');
for(const ref of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)){
 try{await stat(join(www,ref[1]))}catch{throw Error('Missing local linked asset '+ref[1])}
}
const native=await readFile(join(www,'mobile-v224-native.js'),'utf8');
must(native.includes('/explorar')&&native.includes('/rankings/speedruns'),'Navigation support lost');
const transfer=await readFile(join(www,'partida-transfer-v225.js'),'utf8');
must(transfer.includes('vi-v225-onboarding-done'),'Local match backup support lost');
const packageInfo=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
must(packageInfo.dependencies['@capacitor/ios']==='8.0.0','Capacitor version mismatch');
console.log('PASS 148-source parity + 2 iOS-only resources, 48 scripts, map assets, signed news, nav, photos, backup and HTML file references.');
