/* Sign a licensed GTA VI map data release using the EXISTING Ed25519
 * catalog signing key (NOT the Apple App Store Connect .p8 key).
 * Usage:
 * node scripts/sign-map-release.mjs release.json map.webp map-envelope-v242.json
 * Env GAME_ATLAS_MAP_SIGNING_KEY_PATH must point to the existing PEM private key.
 * Never commit keys or unsigned test payloads to a public repository.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'..');
const [source,imagePath,output]=process.argv.slice(2);
if(!source||!imagePath||!output)throw new Error('Uso: node scripts/sign-map-release.mjs release.json mapa.webp salida.json');
const privatePath=process.env.GAME_ATLAS_MAP_SIGNING_KEY_PATH;
if(!privatePath)throw new Error('Falta GAME_ATLAS_MAP_SIGNING_KEY_PATH: indicar la clave PRIVADA Ed25519 del catálogo firmado, NO la .p8 de Apple.');
const privateKey=crypto.createPrivateKey(fs.readFileSync(privatePath));
if(privateKey.asymmetricKeyType!=='ed25519')throw new Error('La clave debe ser Ed25519. La clave de Apple no sirve.');
const config=JSON.parse(fs.readFileSync(path.resolve(root,'www/online-config.json'),'utf8'));
const publicDer=crypto.createPublicKey(privateKey).export({format:'der',type:'spki'});
if(Buffer.from(config.publicKeyEd25519Base64,'base64').compare(publicDer.subarray(-32))!==0)throw new Error('La clave Ed25519 NO coincide con el publicKey de la app. Abortado.');
const json=JSON.parse(fs.readFileSync(source,'utf8'));
if(json.schema!==242||json.type!=='GAME_ATLAS_MAP_DATA'||!json.basemap||!Array.isArray(json.pins)||json.pins.length>5000)throw new Error('Formato del nuevo mapa incorrecto.');
const image=fs.readFileSync(imagePath);
if(!image.length||image.length>24*1024*1024)throw new Error('La imagen debe pesar entre 1 byte y 24 MB.');
const ext=path.extname(imagePath).toLowerCase();
if(ext!=='.webp'&&ext!=='.png')throw new Error('Imagen requerida: WEBP o PNG.');
json.basemap.sha256=crypto.createHash('sha256').update(image).digest('hex');
const payload=Buffer.from(JSON.stringify(json),'utf8').toString('base64');
const signature=crypto.sign(null,Buffer.from(payload,'utf8'),privateKey).toString('base64');
fs.writeFileSync(output,JSON.stringify({schema:242,payload,signature},null,2)+'\n',{mode:0o644});
console.log('Mapa firmado. Publicar primero la imagen en la URL declarada y luego '+output+' junto al catálogo remoto.');
console.log('Versión: '+json.basemap.id+' | revisión: '+json.revision+' | puntos: '+json.pins.length);