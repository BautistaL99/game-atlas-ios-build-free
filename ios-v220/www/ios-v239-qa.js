/* V239 - iOS-only QA improvements. Leaves signed catalog, map coordinates,
   routes, user saves and all web/Android source repositories untouched. */
(()=>{'use strict';
  const isIOS=()=>window.Capacitor?.getPlatform?.()==='ios';
  if(!isIOS())return;
  document.documentElement.classList.add('vi-ios-app');
  const route=()=>{try{return decodeURIComponent((location.hash||'').slice(1)).split('?')[0]||'/';}catch{return '/';}};
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const dictionary={
    es:['dónde encontrar autos','dónde encontrar armas','dónde encontrar vehículos','dónde encontrar motos','dónde encontrar lugares','auto más rápido','arma con más daño','personaje empresario','qué me falta en vehículos'],
    en:['where to find cars','where to find weapons','where to find vehicles','where to find motorcycles','where to find places','fastest car','highest damage weapon','businessman character','missing vehicles'],
    pt:['onde encontrar carros','onde encontrar armas','onde encontrar veículos','onde encontrar motos','onde encontrar lugares','carro mais rápido','arma com mais dano','personagem empresário','veículos que faltam']
  };
  const lang=()=>{let l=document.documentElement.lang?.slice(0,2);return dictionary[l]?l:'es';};
  const kinds=new Set(['searchInput','headerSearchInput','homeSearchInput','mapSearchText']);
  const suggest=(value)=>{
    const q=norm(value);if(q.length<3)return [];
    return dictionary[lang()].filter(x=>norm(x).startsWith(q)&&norm(x)!==q).slice(0,5);
  };
  const popupFor=input=>{
    let parent=input.closest('.search-box,.top-search-wrap,.home-smart-search,.atlas-search-label');
    if(!parent)return null;
    let box=parent.querySelector(':scope > .vi-ios-autocomplete');
    if(!box){box=document.createElement('div');box.className='vi-ios-autocomplete';box.hidden=true;box.setAttribute('role','listbox');box.setAttribute('aria-label',lang()==='en'?'Search suggestions':lang()==='pt'?'Sugestões de busca':'Sugerencias de búsqueda');parent.appendChild(box)}
    return box;
  };
  let currentInput=null;
  function refreshSuggestions(input){
    if(!input||!input.isConnected||!kinds.has(input.id))return;
    const box=popupFor(input);if(!box)return;
    const candidates=suggest(input.value);
    box.replaceChildren();box.hidden=!candidates.length;
    input.setAttribute('aria-expanded',String(!!candidates.length));
    for(const word of candidates){
      const b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.textContent=word;
      b.addEventListener('click',()=>{
        input.value=word;input.dispatchEvent(new Event('input',{bubbles:true}));
        box.hidden=true;input.setAttribute('aria-expanded','false');
        if(input.id==='searchInput')moveResultsForward();
        input.focus({preventScroll:true});
      });box.appendChild(b);
    }
  }
  function moveResultsForward(){
    if(route()!=='/buscar')return;
    const results=document.getElementById('searchResults');
    const chips=document.querySelector('.search-chips');
    if(results&&chips&&chips.nextElementSibling!==results){chips.after(results)}
    if(results){results.setAttribute('aria-live','polite');results.setAttribute('aria-relevant','additions text')}
  }
  // Preserve the position of category filters when only the filter changes.
  document.addEventListener('click',e=>{
    const a=e.target?.closest?.('.filter-tabs a.filter-tab[href^="#/explorar/"]');
    if(!a||!route().startsWith('/explorar/'))return;
    const target=a.getAttribute('href');if(!target)return;
    const nextPath=decodeURIComponent(target.slice(1)).split('?')[0];
    if(nextPath!==route())return;
    e.preventDefault();
    if(location.hash===target)return;
    const oldTabs=document.querySelector('.filter-tabs');
    const previousY=window.scrollY;
    const previousTop=oldTabs?.getBoundingClientRect().top??0;
    history.replaceState(history.state,'',target);
    window.viRefreshApp?.();
    const restore=()=>{
      const nextTabs=document.querySelector('.filter-tabs');
      if(!nextTabs)return;
      const offset=nextTabs.getBoundingClientRect().top-previousTop;
      window.scrollTo({top:Math.max(0,previousY+offset),behavior:'instant'});
    };
    restore();requestAnimationFrame(restore);
  },true);
  // The native picker sometimes sends a synthetic navigation after the third
  // compare slot change. Keep the selected comparison route for this gesture.
  document.addEventListener('change',e=>{
    if(route()!=='/comparar'||!e.target?.matches?.('[data-vi-compare-slot],[data-vi-compare-cat]'))return;
    const before=location.hash;
    setTimeout(()=>{
      if(route()==='/explorar' && before.startsWith('#/comparar')){
        history.replaceState(history.state,'',before);
        window.viRefreshApp?.();
      }
    },50);
  },false);
  document.addEventListener('input',e=>{
    if(kinds.has(e.target?.id)){
      currentInput=e.target;refreshSuggestions(e.target);
      if(e.target.id==='searchInput')requestAnimationFrame(moveResultsForward);
    }
  },false);
  document.addEventListener('focusin',e=>{if(kinds.has(e.target?.id)){currentInput=e.target;refreshSuggestions(e.target)}},false);
  document.addEventListener('focusout',e=>{
    if(!kinds.has(e.target?.id))return;
    const target=e.target;
    setTimeout(()=>{if(!target?.closest('.search-box,.top-search-wrap,.home-smart-search,.atlas-search-label')?.contains(document.activeElement)){
      const box=popupFor(target);if(box)box.hidden=true;
    }},180);
  },false);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&currentInput){const box=popupFor(currentInput);if(box)box.hidden=true}
  },false);
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;moveResultsForward()})}
  const root=document.getElementById('root');
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:false});
  addEventListener('hashchange',schedule,{passive:true});schedule();
})();
