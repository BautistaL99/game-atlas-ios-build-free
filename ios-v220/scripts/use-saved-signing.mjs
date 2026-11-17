// Reutiliza un certificado y perfil instalados previamente en GitHub Secrets.
// No crea certificados nuevos, no revoca nada y no sube .ipa a GitHub público.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const required=['GA_DIST_P12_B64','GA_DIST_P12_PASSWORD','GA_PROFILE_B64','GA_APPLE_TEAM_ID','RUNNER_TEMP','GITHUB_ENV'];
for(const name of required)if(!process.env[name])throw Error('Falta GitHub Secret de firma reutilizable: '+name+'. Ejecutar una vez el asistente Windows.');
const root=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP,'ga-saved-sign-'));
fs.chmodSync(root,0o700);
const p12=path.join(root,'ga-distribution.p12');
const mobile=path.join(root,'ga.mobileprovision');
fs.writeFileSync(p12,Buffer.from(process.env.GA_DIST_P12_B64,'base64'),{mode:0o600});
fs.writeFileSync(mobile,Buffer.from(process.env.GA_PROFILE_B64,'base64'),{mode:0o600});
function run(cmd,args){
  const result=spawnSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  if(result.status!==0){
    const msg=String(result.stderr||'').replaceAll(process.env.GA_DIST_P12_PASSWORD,'[OCULTO]');
    console.error(msg.slice(0,400));
    throw Error('Falló importación de firma: '+cmd);
  }
  return result.stdout||'';
}
const plist=run('security',['cms','-D','-i',mobile]);
const plistPath=path.join(root,'profile.plist');
fs.writeFileSync(plistPath,plist,{mode:0o600});
const attr=k=>run('/usr/libexec/PlistBuddy',['-c','Print :'+k,plistPath]).trim();
const team=attr('TeamIdentifier:0'),name=attr('Name'),uuid=attr('UUID');
if(team!==process.env.GA_APPLE_TEAM_ID)throw Error('Team ID incorrecto en GitHub Secret GA_APPLE_TEAM_ID.');
const appID=attr('Entitlements:application-identifier');
if(!appID.endsWith('.com.indie.viassistant'))throw Error('Perfil de firma no corresponde al Bundle ID de Game Atlas.');
const target=path.join(os.homedir(),'Library','MobileDevice','Provisioning Profiles');
fs.mkdirSync(target,{recursive:true});
fs.copyFileSync(mobile,path.join(target,uuid+'.mobileprovision'));
const password=crypto.randomBytes(26).toString('hex');
const keychain=path.join(root,'build.keychain-db');
run('security',['create-keychain','-p',password,keychain]);
run('security',['unlock-keychain','-p',password,keychain]);
run('security',['set-keychain-settings','-lut','21600',keychain]);
run('security',['import',p12,'-k',keychain,'-P',process.env.GA_DIST_P12_PASSWORD,'-T','/usr/bin/codesign','-T','/usr/bin/security']);
run('security',['set-key-partition-list','-S','apple-tool:,apple:','-s','-k',password,keychain]);
run('security',['list-keychains','-d','user','-s',keychain]);
run('security',['default-keychain','-d','user','-s',keychain]);
if(!run('security',['find-identity','-v','-p','codesigning',keychain]).includes('Apple Distribution'))throw Error('Certificado Apple Distribution no válido en p12.');
fs.appendFileSync(process.env.GITHUB_ENV,'GA_APPLE_TEAM_ID='+team+'\nGA_PROFILE_NAME='+name+'\nGA_PROFILE_UUID='+uuid+'\n');
console.log('Firma Apple Distribution persistente preparada para Xcode.');
