/* Game Atlas V254 PREVIEW — stable dynamic fact templates.
 * Shared renderer, to be tested on Web before being bundled into Android/iOS.
 * Empty/unknown/unverified fields have NO DOM nodes. No remote script execution.
 */
(function (root) { 'use strict';
  const L = ['es','en','pt'];
  const names = (es,en,pt) => ({es,en,pt});
  const GROUPS = {
    basic:names('Características','Specifications','Características'),
    performance:names('Rendimiento','Performance','Desempenho'),
    appearance:names('Aspecto y equipamiento','Appearance & equipment','Aparência e equipamentos'),
    location:names('Ubicación','Location','Localização'),
    story:names('Historia y requisitos','Story & requirements','História e requisitos'),
    reward:names('Recompensas y obtención','Rewards & acquisition','Recompensas e obtenção'),
    other:names('Otros datos verificados','Other verified facts','Outros dados verificados')
  };
  const f=(id,group,es,en,pt,aliases=[])=>({id,group,label:names(es,en,pt),aliases});
  const base={
    vehiculos:[
      f('type','basic','Tipo','Type','Tipo',['class','clase','vehicle type']),f('brand','basic','Marca','Brand','Marca',['manufacturer','fabricante','make']),
      f('model','basic','Modelo','Model','Modelo'),f('seats','basic','Asientos','Seats','Assentos',['number of seats','seat capacity','capacidad de pasajeros']),
      f('speed','performance','Velocidad máxima','Top speed','Velocidade máxima',['velocity','top speed','max speed','velocidad','speed']),
      f('acceleration','performance','Aceleración','Acceleration','Aceleração'),f('braking','performance','Frenado','Braking','Frenagem'),
      f('weight','performance','Peso','Weight','Peso',['mass']),f('engine','performance','Motor','Engine','Motor',['motor']),
      f('drive','performance','Tracción','Drivetrain','Tração',['drivetrain','drive type']),f('transmission','performance','Transmisión','Transmission','Transmissão'),
      f('body','appearance','Carrocería','Body style','Carroceria',['body style','body type']),f('colors','appearance','Colores disponibles','Available colors','Cores disponíveis',['color','colour','colors','colours']),
      f('price','reward','Precio','Price','Preço',['cost']),f('unlock','reward','Desbloqueo','Unlock','Desbloqueio'),
      f('location','location','Ubicación','Location','Localização',['where to find','spawn','spawn location'])],
    armas:[
      f('type','basic','Tipo de arma','Weapon type','Tipo de arma',['type','weapon style']),f('manufacturer','basic','Fabricante','Manufacturer','Fabricante'),
      f('damage','performance','Daño','Damage','Dano'),f('range','performance','Alcance','Range','Alcance'),
      f('accuracy','performance','Precisión','Accuracy','Precisão'),f('fire_rate','performance','Cadencia','Fire rate','Cadência',['rate of fire']),
      f('magazine','basic','Capacidad del cargador','Magazine capacity','Capacidade do carregador',['magazine','capacity']),
      f('ammo','basic','Munición','Ammo','Munição',['ammunition','caliber']),f('firemode','basic','Modo de disparo','Fire mode','Modo de disparo'),
      f('mods','appearance','Mejoras','Upgrades','Melhorias',['upgrades','attachments']),f('price','reward','Precio','Price','Preço'),
      f('unlock','reward','Desbloqueo','Unlock','Desbloqueio'),f('location','location','Ubicación','Location','Localização')],
    personajes:[
      f('age','basic','Edad','Age','Idade'),f('gender','basic','Género','Gender','Gênero'),f('occupation','basic','Ocupación','Occupation','Ocupação'),
      f('status','basic','Estado','Status','Estado'),f('affiliations','story','Afiliaciones','Affiliations','Afiliações'),
      f('relationships','story','Relaciones','Relationships','Relações'),f('home','location','Residencia','Home','Residência'),
      f('missions','story','Misiones relacionadas','Related missions','Missões relacionadas'),f('voice','basic','Voz','Voice','Voz')],
    misiones:[
      f('protagonist','story','Protagonista','Protagonist','Protagonista'),f('chapter','story','Capítulo','Chapter','Capítulo'),
      f('prerequisites','story','Requisitos','Prerequisites','Pré-requisitos'),f('objectives','story','Objetivos','Objectives','Objetivos'),
      f('previous','story','Misión anterior','Previous mission','Missão anterior'),f('next','story','Siguiente misión','Next mission','Próxima missão'),
      f('reward','reward','Recompensa','Reward','Recompensa'),f('location','location','Ubicación','Location','Localização'),
      f('difficulty','basic','Dificultad','Difficulty','Dificuldade'),f('duration','basic','Duración media','Average duration','Duração média',['duración media','duracao media','average duration','time to complete','estimated duration','duracion','tempo medio'])],
    'mapa-lugares':[
      f('region','location','Región','Region','Região'),f('county','location','Condado','County','Condado'),
      f('coordinates','location','Coordenadas','Coordinates','Coordenadas'),f('location','location','Ubicación','Location','Localização'),
      f('type','basic','Tipo de lugar','Place type','Tipo de lugar'),f('services','basic','Servicios','Services','Serviços'),
      f('missions','story','Misiones relacionadas','Related missions','Missões relacionadas'),f('collectibles','story','Coleccionables','Collectibles','Colecionáveis'),
      f('interior','basic','Interior accesible','Accessible interior','Interior acessível')],
    coleccionables:[f('type','basic','Tipo','Type','Tipo'),f('total','basic','Cantidad','Total','Quantidade'),f('location','location','Ubicación','Location','Localização'),f('requirements','story','Requisitos','Requirements','Requisitos'),f('reward','reward','Recompensa','Reward','Recompensa')],
    secretos:[f('type','basic','Tipo','Type','Tipo'),f('hint','story','Pista','Hint','Dica'),f('discovery','story','Cómo descubrirlo','How to discover','Como descobrir',['trigger','activation','activación']),f('requirements','story','Requisitos','Requirements','Requisitos'),f('location','location','Ubicación','Location','Localização'),f('reward','reward','Recompensa','Reward','Recompensa')],
    actividades:[f('type','basic','Tipo','Type','Tipo'),f('participants','basic','Participantes','Participants','Participantes'),f('requirements','story','Requisitos','Requirements','Requisitos'),f('location','location','Ubicación','Location','Localização'),f('reward','reward','Recompensa','Reward','Recompensa')],
    economia:[f('type','basic','Tipo','Type','Tipo'),f('price','reward','Precio','Price','Preço'),f('income','reward','Ingresos','Income','Renda'),f('owner','basic','Propietario','Owner','Proprietário'),f('location','location','Ubicación','Location','Localização'),f('unlock','story','Desbloqueo','Unlock','Desbloqueio')],
    mundo:[f('type','basic','Tipo','Type','Tipo'),f('species','basic','Especie','Species','Espécie'),f('habitat','location','Hábitat','Habitat','Habitat'),f('location','location','Ubicación','Location','Localização'),f('rarity','basic','Rareza','Rarity','Raridade'),f('behavior','basic','Comportamiento','Behavior','Comportamento')],
    herramientas:[f('type','basic','Tipo','Type','Tipo'),f('usage','basic','Uso','Use','Uso')]
  };
  const index={};
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
  for(const [category,fields] of Object.entries(base)){
    const d=new Map();
    for(const field of fields)for(const label of [field.id,...L.map(l=>field.label[l]),...field.aliases]){
      const k=norm(label);if(k&&!d.has(k))d.set(k,field);
    }
    index[category]=d;
  }
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const empty=s=>{const x=String(s??'').trim();return !x||/^(?:unknown|desconocido|desconhecido|pending|pendiente|pendente|n\/a|not available|por confirmar|tbd|\?|—|-|null|undefined)$/i.test(x)};
  // V264: editorial translation of fixed *display values/labels* in older signed records.
  // This does not change underlying facts, stats, locations, or proper names.
  const legacy={
    'orden documentado en capitulo':['Orden documentado en capítulo','Documented order within chapter','Ordem documentada no capítulo'],
    'edicion anunciada':['Edición anunciada','Announced edition','Edição anunciada'],
    'estadisticas de rendimiento':['Estadísticas de rendimiento','Performance statistics','Estatísticas de desempenho'],
    'ubicaciones individuales':['Ubicaciones individuales','Individual locations','Localizações individuais'],
    'total de cartas':['Total de cartas','Total cards','Total de cartas'],
    'clase general':['Clase general','General class','Classe geral'],
    'estadisticas':['Estadísticas','Statistics','Estatísticas'],
    'coleccion':['Colección','Collection','Coleção'],
    'capitulo':['Capítulo','Chapter','Capítulo'],
    'tipo':['Tipo','Type','Tipo'],
    'principal':['Principal','Main','Principal'],
    'secundaria':['Secundaria','Side','Secundária'],
    'revolveres':['Revólveres','Revolvers','Revólveres'],
    'no publicadas':['No publicadas','Not published','Não publicadas'],
    'todavia no publicadas':['Todavía no publicadas','Not yet published','Ainda não publicadas'],
    'cartas':['Cartas','Cards','Cartas'],
    'pendientes de contraste':['Pendientes de contraste','Pending verification','Aguardando verificação'],
    'no disponible':['No disponible','Unavailable','Indisponível'],
    'sin datos verificados':['Sin datos verificados','No verified data','Sem dados verificados']
  };
  function localizeFactText(value,lang){
    const l=lang==='en'?1:lang==='pt'?2:0;
    const original=String(value??'');
    const k=norm(original);
    if(legacy[k])return legacy[k][l];
    const m=original.match(/^Cap[ií]tulo\s+(\d+)$/i);
    if(m)return (l===1?'Chapter ':'Capítulo ')+m[1];
    return original;
  }
  function entries(item,lang='en'){
    const locale=L.includes(lang)?lang:'en',category=item?.category||'';
    const fields=index[category]||new Map(),unique=new Set(),out=[];
    for(const fact of (Array.isArray(item?.facts)?item.facts:[]).slice(0,48)){
      if(!fact||fact.verified!==true||typeof fact.key!=='string'||typeof fact.value!=='string'||
         fact.key.length>80||fact.value.length>200||empty(fact.value))continue;
      const found=fields.get(norm(fact.key));
      const id=found?.id||norm(fact.key);
      if(!id||unique.has(id))continue;
      unique.add(id);
      out.push({id,group:found?.group||'other',label:fact.label?.[locale]||found?.label[locale]||localizeFactText(fact.key,locale),value:localizeFactText(fact.value,locale)});
    }
    const priority=new Map((base[category]||[]).map((x,i)=>[x.id,i]));
    const order=['basic','performance','appearance','location','story','reward','other'];
    out.sort((a,b)=>order.indexOf(a.group)-order.indexOf(b.group)||
      (priority.get(a.id)??999)-(priority.get(b.id)??999)||a.label.localeCompare(b.label));
    return out.slice(0,48);
  }
  function render(item,lang='en'){
    const locale=L.includes(lang)?lang:'en',groups=new Map();
    for(const entry of entries(item,locale)){
      if(!groups.has(entry.group))groups.set(entry.group,[]);
      groups.get(entry.group).push(entry);
    }
    if(!groups.size)return '';
    return '<section class="ga-v254-facts" data-ga-dynamic-template="'+esc(item.category||'other')+'">'+
      [...groups].map(([id,rows])=>'<div class="ga-v254-fact-section"><h3>'+esc(GROUPS[id][locale])+ '</h3>'+
      '<div class="ga-v254-fact-grid">'+rows.map(row=>'<div class="ga-v254-fact" data-fact="'+esc(row.id)+'">'+
      '<small>'+esc(row.label)+'</small><strong>'+esc(row.value)+'</strong></div>').join('')+'</div></div>').join('')+'</section>';
  }
  root.viDynamicFactsV254=Object.freeze({version:'V254-web-preview',templates:base,entries,render,empty});
})(window);
