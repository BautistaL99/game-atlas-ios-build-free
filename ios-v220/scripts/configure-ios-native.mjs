/* Called AFTER `npx cap add ios`; safe to rerun. Copies app icon and sets
 * public version/build only. Never touches Bundle ID or Apple signing keys. */
import {readFile,writeFile,copyFile,mkdir,stat} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const project=join(root,'ios/App/App.xcodeproj/project.pbxproj');
let pbx=await readFile(project,'utf8');
const old=pbx;pbx=pbx.replace(/MARKETING_VERSION\s*=\s*[^;]+;/g,'MARKETING_VERSION = 1.50.0;').replace(/CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g,'CURRENT_PROJECT_VERSION = 220;');
if(pbx===old)console.log('Version already set or Xcode settings not found; inspect settings manually.');
else await writeFile(project,pbx,'utf8');
const appicon=join(root,'ios/App/App/Assets.xcassets/AppIcon.appiconset');
await mkdir(appicon,{recursive:true});
await copyFile(join(root,'branding/GameAtlas-iOS-AppIcon-1024.png'),join(appicon,'GameAtlas-iOS-AppIcon-1024.png'));
await writeFile(join(appicon,'Contents.json'),JSON.stringify({images:[{filename:'GameAtlas-iOS-AppIcon-1024.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2)+'\n');
console.log('iOS version/build/app icon prepared. Select Apple Team + signing in Xcode.');
