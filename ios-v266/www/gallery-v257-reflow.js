/* V257 — anchor gallery arrows beside the *displayed photograph*, not the entire stage.
 * No new images, no external downloads, no mutation of player data. */
(()=>{'use strict';
 function align(g){
  const stage=g?.querySelector('.ga-v254-media-stage, .vi-gallery-stage');
  const pic=stage?.querySelector('.vi-gallery-slide:not([hidden]) img');
  if(!pic||!pic.naturalWidth||!pic.naturalHeight)return;
  const width=stage.clientWidth,height=stage.clientHeight;if(width<80||height<80)return;
  const shownWidth=Math.min(width,height*pic.naturalWidth/pic.naturalHeight);
  const inset=Math.max(9,Math.floor((width-shownWidth)/2)+9);
  stage.style.setProperty('--v257-gallery-inset',inset+'px');
 }
 function all(){document.querySelectorAll('.ga-v254-media-gallery').forEach(align)}
 document.addEventListener('load',e=>{if(e.target.matches?.('.ga-v254-media-gallery img'))requestAnimationFrame(all)},true);
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-vi-gallery-arrow],[data-vi-gallery-index]'))requestAnimationFrame(all)},true);
 addEventListener('hashchange',()=>requestAnimationFrame(all));
 addEventListener('resize',()=>requestAnimationFrame(all),{passive:true});
 const observer=new MutationObserver(()=>requestAnimationFrame(all));
 function start(){observer.observe(document.getElementById('root')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});all()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
