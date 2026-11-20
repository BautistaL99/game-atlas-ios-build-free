/* Game Atlas V260: tile overlay for the exact YANIS V17 projection used by
 * the existing 926 markers. Source: GTADB CC BY 4.0, pinned historical Git
 * revision 6acc1b555ed68255078b850f5d4a984610fa1910.
 * This does not modify or reproject a single pin. Map is still unofficial.
 * Loaded only in the user's visible map window; fallback base remains behind.
 * Tile file names are (z, ROW Y, COL X): matched to upstream maps.js.
 * Never display a partially loaded patchwork over the local fallback.
 */
(function(root){
 'use strict';
 const COMMIT='6acc1b555ed68255078b850f5d4a984610fa1910';
 const BASE=`https://raw.githubusercontent.com/rolux/gtadb.org/${COMMIT}/maps/tiles/6/yanis,17`;
 const R9_LOCAL_TILES=root.location?.hostname==='127.0.0.1'&&root.location?.port==='8879';
 const WORLD={x0:-10496,y0:11008,width:13440,height:17920};
 // GTADB fixed 32768m square world. Image pixel to world mapping is 1:8.96m.
 const GRID_MIN=-16384,GRID_TOP=16384,GRID_SIZE=32768;
 const MAX_LEVEL=5, MAX_TILES=100;
 let scheduled=false,last=null,requestId=0;
 const state={drawn:0,loaded:0,failed:0,level:null,ready:false};
 function update(detail){
   if(!detail||![detail.scale,detail.tx,detail.ty,detail.viewW,detail.viewH,detail.mapW,detail.mapH].every(Number.isFinite))return;
   last=detail;
   if(scheduled)return;
   scheduled=true;
   root.requestAnimationFrame(()=>{scheduled=false;paint(last)});
 }
 function paint(d){
   const layer=root.document.getElementById('v259MapTiles');
   if(!layer||!d||d.scale<=0)return;
   layer.style.visibility='visible';
   // Avoid applying the V17 overlay to any future incompatible basemap.
   if(Math.abs(d.mapW/d.mapH-.75)>.001||d.mapW<700||d.mapW>3000){layer.replaceChildren();state.ready=false;return}
   const px0=Math.max(0,(-d.tx)/d.scale);
   const py0=Math.max(0,(-d.ty)/d.scale);
   const px1=Math.min(d.mapW,(d.viewW-d.tx)/d.scale);
   const py1=Math.min(d.mapH,(d.viewH-d.ty)/d.scale);
   if(px1<=px0||py1<=py0){layer.replaceChildren();state.ready=false;return}
   const stageMetersPerPixel=WORLD.width/d.mapW;
   const stageTileAtZero=GRID_SIZE/4/stageMetersPerPixel;
   // Pick the resolution for approximately 220 px per displayed tile.
   let z=Math.round(Math.log2(Math.max(.125,d.scale*stageTileAtZero/220)));
   z=Math.max(0,Math.min(MAX_LEVEL,z));
   function windowFor(level){
     const span=(GRID_SIZE/4)/Math.pow(2,level);
     const a=Math.max(0,Math.floor((WORLD.x0+px0*stageMetersPerPixel-GRID_MIN)/span));
     const b=Math.min(4*Math.pow(2,level)-1,Math.floor((WORLD.x0+px1*stageMetersPerPixel-GRID_MIN)/span));
     const c=Math.max(0,Math.floor((GRID_TOP-WORLD.y0+py0*stageMetersPerPixel)/span));
     const e=Math.min(4*Math.pow(2,level)-1,Math.floor((GRID_TOP-WORLD.y0+py1*stageMetersPerPixel)/span));
     return {a,b,c,e,span,count:(b-a+1)*(e-c+1)};
   }
   let w=windowFor(z);
   while(w.count>MAX_TILES&&z>0){z--;w=windowFor(z)}
   if(w.count>MAX_TILES){state.ready=false;return;}
   // Reuse existing loaded images across pan and zoom, remove offscreen tiles.
   const required=new Map();
   for(let x=w.a;x<=w.b;x++)for(let y=w.c;y<=w.e;y++){
     const left=((GRID_MIN+x*w.span-WORLD.x0)/WORLD.width)*d.mapW;
     const top=((WORLD.y0-(GRID_TOP-y*w.span))/WORLD.height)*d.mapH;
     const width=w.span/WORLD.width*d.mapW;
     const height=w.span/WORLD.height*d.mapH;
     required.set(`${z}:${x}:${y}`,{x,y,left,top,width,height});
   }
   for(const tile of [...layer.children])if(!required.has(tile.dataset.key))tile.remove();
   let loaded=0, failed=0;
   for(const [key,t] of required){
     let img=[...layer.children].find(node=>node.dataset.key===key);
     if(!img){
       img=root.document.createElement('img');img.dataset.key=key;
       img.alt='';img.decoding='async';img.loading='eager';img.draggable=false;
       img.className='v259-map-tile';img.style.opacity='0';
       img.addEventListener('load',()=>{img.style.opacity='1';state.loaded++;update(last)},{once:true});
       img.addEventListener('error',()=>{if(R9_LOCAL_TILES&&!img.dataset.remoteFallback){img.dataset.remoteFallback='1';const v=img.dataset.key.split(':');img.src=`${BASE}/${v[0]}/${v[0]},${v[2]},${v[1]}.jpg`;return;}if(!img.dataset.failed){state.failed++;img.dataset.failed='true';img.style.display='none';update(last);}});
       layer.appendChild(img);
       // Use the immutable snapshot, preventing unannounced map version changes.
       img.src=R9_LOCAL_TILES?`/atlas-map-tiles-v17/${z}/${z},${t.y},${t.x}.jpg`:`${BASE}/${z}/${z},${t.y},${t.x}.jpg`;
     }
     img.style.left=`${t.left.toFixed(4)}px`;
     img.style.top=`${t.top.toFixed(4)}px`;
     img.style.width=`${(t.width+.12).toFixed(4)}px`;
     img.style.height=`${(t.height+.12).toFixed(4)}px`;
     loaded+=Number(img.complete&&img.naturalWidth>0);
     failed+=Number(img.dataset.failed==='true'||(img.complete&&img.naturalWidth===0));
   }
   // Atomic layer: all visible tiles must succeed before replacing the fallback.
   state.ready=loaded===required.size&&failed===0;
   layer.style.visibility=loaded>0?'visible':'hidden';
   state.partialHD=loaded>0&&loaded<required.size;
   state.level=z;state.drawn=required.size;state.visibleLoaded=loaded;state.visibleFailed=failed;
 }
 root.viMapTilesV259={update,stats:()=>({...state}),source:'GTADB YANIS V17 · CC BY 4.0 · corrected row/column tiles',world:WORLD};
})(window);
