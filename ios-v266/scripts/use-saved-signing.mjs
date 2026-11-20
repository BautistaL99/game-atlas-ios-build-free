// Restore an EXISTING Apple Distribution identity; never create new or revoke certificates.
// Secrets must exist only in GitHub Actions settings, never in this public source ZIP.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const required=['GA_DIST_P12_B64','GA_DIST_P12_PASSWORD','GA_PROFILE_B64','GA_APPLE_TEAM_ID','RUNNER_TEMP','GITHUB_ENV'];
for(const name of required)if(!process.env[name])throw Error('Missing existing App Store signing secret '+name);
const dir=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP,'ga-v266-ios-'));
fs.chmodSync(dir,0o700);
const p12=path.join(dir,'distribution.p12'),profile=path.join(dir,'profile.mobileprovision');
fs.writeFileSync(p12,Buffer.from(process.env.GA_DIST_P12_B64,'base64'),{mode:0o600});
fs.writeFileSync(profile,Buffer.from(process.env.GA_PROFILE_B64,'base64'),{mode:0o600});
function run(cmd,args){
 const result=spawnSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 if(result.status!==0){
  const safe=String(result.stderr||'').replaceAll(process.env.GA_DIST_P12_PASSWORD,'[REDACTED]');
  throw Error(cmd+' failed to configure existing signing identity: '+safe.slice(0,300));
 }
 return result.stdout||'';
}
const plist=path.join(dir,'profile.plist');
fs.writeFileSync(plist,run('security',['cms','-D','-i',profile]),{mode:0o600});
const attr=name=>run('/usr/libexec/PlistBuddy',['-c','Print :'+name,plist]).trim();
const team=attr('TeamIdentifier:0'),name=attr('Name'),uuid=attr('UUID');
if(team!==process.env.GA_APPLE_TEAM_ID)throw Error('Existing provisioning team differs from stored Apple team');
if(!attr('Entitlements:application-identifier').endsWith('.com.indie.viassistant'))throw Error('Existing profile is not for Game Atlas');
const dest=path.join(os.homedir(),'Library','MobileDevice','Provisioning Profiles');
fs.mkdirSync(dest,{recursive:true});fs.copyFileSync(profile,path.join(dest,uuid+'.mobileprovision'));
const password=crypto.randomBytes(24).toString('hex');
const keychain=path.join(dir,'build.keychain-db');
run('security',['create-keychain','-p',password,keychain]);
run('security',['unlock-keychain','-p',password,keychain]);
run('security',['set-keychain-settings','-lut','21600',keychain]);
run('security',['import',p12,'-k',keychain,'-P',process.env.GA_DIST_P12_PASSWORD,'-T','/usr/bin/codesign','-T','/usr/bin/security']);
run('security',['set-key-partition-list','-S','apple-tool:,apple:','-s','-k',password,keychain]);
run('security',['list-keychains','-d','user','-s',keychain]);
run('security',['default-keychain','-d','user','-s',keychain]);
if(!run('security',['find-identity','-v','-p','codesigning',keychain]).includes('Apple Distribution'))
 throw Error('Stored certificate is not an Apple Distribution identity');
fs.appendFileSync(process.env.GITHUB_ENV,`GA_APPLE_TEAM_ID=${team}\nGA_PROFILE_NAME=${name}\nGA_PROFILE_UUID=${uuid}\n`);
console.log('Existing App Store distribution certificate and provisioning profile loaded.');
