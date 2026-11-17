// One-time App Store distribution signing on ephemeral macOS runner.
// Does not revoke or modify existing team signing certificates.
// Uses the protected App Store Connect API key to create a matching certificate/profile.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const required = ['ASC_KEY_PATH', 'ASC_KEY_ID', 'ASC_ISSUER_ID', 'APPLE_TEAM_ID', 'RUNNER_TEMP', 'GITHUB_ENV'];
for (const k of required) if (!process.env[k]) throw Error('Falta configuración: '+k);
const bundle = 'com.indie.viassistant';
const dir = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP, 'ga-signing-'));
fs.chmodSync(dir, 0o700);
function run(cmd, args) {
  const p = spawnSync(cmd, args, {encoding:'utf8', stdio:['ignore','pipe','pipe']});
  if (p.status !== 0) {
    console.error((p.stderr || '').slice(0,700));
    throw Error('Falló preparación de firma con ' + cmd + ' (código '+p.status+')');
  }
  return p.stdout || '';
}
function enc(v) { return Buffer.from(JSON.stringify(v)).toString('base64url'); }
const now = Math.floor(Date.now()/1000);
const h = enc({alg:'ES256',kid:process.env.ASC_KEY_ID,typ:'JWT'});
const p = enc({iss:process.env.ASC_ISSUER_ID,iat:now-10,exp:now+600,aud:'appstoreconnect-v1'});
const sig = crypto.sign('sha256', Buffer.from(h+'.'+p), {
  key: fs.readFileSync(process.env.ASC_KEY_PATH), dsaEncoding:'ieee-p1363'
}).toString('base64url');
const jwt = h+'.'+p+'.'+sig;
async function api(uri, method='GET', body) {
  const response = await fetch('https://api.appstoreconnect.apple.com/v1/'+uri,{
    method,headers:{Authorization:'Bearer '+jwt,Accept:'application/json',
      ...(body ? {'Content-Type':'application/json'} : {})},
    ...(body ? {body:JSON.stringify(body)} : {}),
    signal:AbortSignal.timeout(30000)
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) {
    for (const err of (data.errors || []).slice(0,3)) {
      console.error('Apple: '+String(err.code||'')+' / '+String(err.title||'')+
        ' / '+String(err.detail||'').slice(0,200));
    }
    throw Error('Apple API '+method+' '+uri.split('?')[0]+' respondió HTTP '+response.status);
  }
  return data;
}
const bundles = await api('bundleIds?'+new URLSearchParams({'filter[identifier]':bundle,'limit':'10'}));
const item = (bundles.data || []).find(v => v.attributes?.identifier===bundle);
if(!item) throw Error('El Bundle ID '+bundle+' no está registrado en Apple Developer. No se creó certificado.');
console.log('Bundle ID confirmado en Apple: '+bundle);
const existing = await api('certificates?limit=200');
const distribution = (existing.data||[]).filter(c => c.attributes?.certificateType==='DISTRIBUTION' && c.attributes?.activated!==false);
console.log('Certificados Apple Distribution activos de la cuenta: '+distribution.length);
if(distribution.length >= 3) throw Error('La cuenta tiene 3 certificados Distribution activos. No se revocó ninguno. Se necesita usar un .p12 existente o liberar uno con autorización.');
const keyfile = path.join(dir,'distribution.key');
const csr = path.join(dir,'distribution.csr');
run('openssl',['genrsa','-out',keyfile,'2048']);
fs.chmodSync(keyfile,0o600);
run('openssl',['req','-new','-sha256','-key',keyfile,'-subj','/CN=Game Atlas CI Distribution','-out',csr]);
const created = await api('certificates','POST',{
  data:{type:'certificates',attributes:{certificateType:'DISTRIBUTION',csrContent:fs.readFileSync(csr,'utf8')}}
});
const certificateId = created.data?.id;
const cert64 = created.data?.attributes?.certificateContent;
if(!certificateId || !cert64) throw Error('Apple creó una respuesta de certificado incompleta.');
console.log('Certificado Apple Distribution creado para esta compilación.');
const der = path.join(dir,'distribution.cer');
const pem = path.join(dir,'distribution.pem');
fs.writeFileSync(der,Buffer.from(cert64,'base64'),{mode:0o600});
run('openssl',['x509','-inform','DER','-in',der,'-out',pem]);
const profileName = 'GameAtlas-AppStore-'+(process.env.GITHUB_RUN_ID||Date.now());
const createdProfile = await api('profiles','POST',{
  data:{
    type:'profiles',
    attributes:{name:profileName,profileType:'IOS_APP_STORE'},
    relationships:{
      bundleId:{data:{type:'bundleIds',id:item.id}},
      certificates:{data:[{type:'certificates',id:certificateId}]}
    }
  }
});
const profile = createdProfile.data?.attributes;
if(!profile?.profileContent || !profile?.uuid) throw Error('Perfil App Store de Apple incompleto.');
const mobileDir=path.join(os.homedir(),'Library','MobileDevice','Provisioning Profiles');
fs.mkdirSync(mobileDir,{recursive:true});
const mobile=path.join(mobileDir,profile.uuid+'.mobileprovision');
fs.writeFileSync(mobile,Buffer.from(profile.profileContent,'base64'),{mode:0o600});
const plist=run('security',['cms','-D','-i',mobile]);
const plistPath=path.join(dir,'provisioning.plist');
fs.writeFileSync(plistPath,plist,{mode:0o600});
const team=run('/usr/libexec/PlistBuddy',['-c','Print :TeamIdentifier:0',plistPath]).trim();
if(team!==process.env.APPLE_TEAM_ID) console.log('Team ID guardado no coincide; usaré automáticamente el Team ID certificado por Apple.');
fs.appendFileSync(process.env.GITHUB_ENV,'GA_APPLE_TEAM_ID='+team+'\n');
const pass=crypto.randomBytes(32).toString('hex');
const pkcs12=path.join(dir,'distribution.p12');
run('openssl',['pkcs12','-export','-inkey',keyfile,'-in',pem,'-out',pkcs12,'-passout','pass:'+pass]);
const keychain=path.join(dir,'build.keychain-db');
run('security',['create-keychain','-p',pass,keychain]);
run('security',['unlock-keychain','-p',pass,keychain]);
run('security',['set-keychain-settings','-lut','21600',keychain]);
run('security',['import',pkcs12,'-k',keychain,'-P',pass,'-T','/usr/bin/codesign','-T','/usr/bin/security']);
run('security',['set-key-partition-list','-S','apple-tool:,apple:','-s','-k',pass,keychain]);
run('security',['list-keychains','-d','user','-s',keychain]);
run('security',['default-keychain','-d','user','-s',keychain]);
const identity=run('security',['find-identity','-v','-p','codesigning',keychain]);
if(!identity.includes('Apple Distribution')) throw Error('No se encontró una identidad Apple Distribution en el keychain.');
fs.appendFileSync(process.env.GITHUB_ENV,'GA_PROFILE_NAME='+profileName+'\nGA_PROFILE_UUID='+profile.uuid+'\n');
console.log('Perfil App Store instalado y certificado en keychain. Firma manual lista.');
// All generated private assets stay on the temporary runner; no public artifacts.
