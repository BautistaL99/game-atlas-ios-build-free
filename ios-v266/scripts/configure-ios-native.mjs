/* Run AFTER Capacitor creates its Xcode project. Preserve existing Apple bundle ID. */
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=join(root,'ios/App/App.xcodeproj/project.pbxproj');
let source=await readFile(path,'utf8');
if(!source.includes('com.indie.viassistant'))throw Error('Unexpected Apple bundle ID');
const v=String(process.env.APP_STORE_VERSION||'1.0').trim();
if(!/^\d+\.\d+(?:\.\d+)?$/.test(v))throw Error('Invalid public App Store version');
const build=String(process.env.APP_STORE_BUILD_NUMBER||'26618');
if(!/^\d+$/.test(build))throw Error('Build number must be numeric');
if(!/MARKETING_VERSION\s*=/.test(source)||!/CURRENT_PROJECT_VERSION\s*=/.test(source))throw Error('Missing Xcode version fields');
source=source.replace(/MARKETING_VERSION\s*=\s*[^;]+;/g,`MARKETING_VERSION = ${v};`)
  .replace(/CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g,`CURRENT_PROJECT_VERSION = ${build};`);
await writeFile(path,source,'utf8');
const icons=join(root,'ios/App/App/Assets.xcassets/AppIcon.appiconset');
await mkdir(icons,{recursive:true});
await copyFile(join(root,'branding/GameAtlas-iOS-AppIcon-1024.png'),join(icons,'GameAtlas-iOS-AppIcon-1024.png'));
await writeFile(join(icons,'Contents.json'),JSON.stringify({images:[{
 filename:'GameAtlas-iOS-AppIcon-1024.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2)+'\n');
const info=join(root,'ios/App/App/Info.plist');
let plist=await readFile(info,'utf8');
if(!plist.includes('<key>CFBundleDisplayName</key>')){
 plist=plist.replace('</dict>','\t<key>CFBundleDisplayName</key>\n\t<string>Game Atlas</string>\n</dict>');
 await writeFile(info,plist,'utf8');
}
console.log(`Prepared Apple bundle com.indie.viassistant; App Store ${v} build ${build}`);
