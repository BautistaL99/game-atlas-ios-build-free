import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const project = resolve('ios/App/App.xcodeproj/project.pbxproj');
let source = await readFile(project, 'utf8');
if (!source.includes('com.indie.viassistant')) throw new Error('Bundle ID no coincide con el registrado en Apple');
const storeVersion = String(process.env.APP_STORE_VERSION || '1.0').trim();
if (!/^\d+\.\d+(?:\.\d+)?$/.test(storeVersion)) throw new Error('Version invalida. Usa por ejemplo 1.0, 1.1 o 1.1.2.');
const run = String(process.env.GITHUB_RUN_NUMBER || '1');
if (!/^\d+$/.test(run)) throw new Error('Numero de compilacion invalido');
const nVersion = (source.match(/MARKETING_VERSION\s*=\s*[^;]+;/g)||[]).length;
const nBuild = (source.match(/CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g)||[]).length;
if (!nVersion || !nBuild) throw new Error('No se encontraron las versiones del proyecto Xcode');
source = source.replace(/MARKETING_VERSION\s*=\s*[^;]+;/g, `MARKETING_VERSION = ${storeVersion};`)
               .replace(/CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g, `CURRENT_PROJECT_VERSION = ${run};`);
await writeFile(project, source);
console.log(`App iOS preparada: version ${storeVersion}, build ${run}, Bundle ID com.indie.viassistant`);
