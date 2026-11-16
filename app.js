'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const DATA=['criteria','styles','materials','plants_fauna','norms','vessels','care_templates','diagnostics'];
const NS=['ui','rules','care','diag','catalog'];
const DB={},I18N={ru:{},en:{}};
let lang='ru',D=null,PRESETS=[],dragIdx=null,booted=false;
const TABS=['build','plants','fauna','setup','care'];
const PAGE=24;
const state={tab:'build',buildTab:'composition',careTab:'sheet',sel:[],
  vessel:{preset:'vessel_jar_3l',shape:'jar',diameter:14,height:20,width:20,depth:20,neck:null,closure:'sealable',volumeLabel:null},
  system:'closed',placement:'east_west',water:'soft',experience:'beginner',style:'tropical_jungle',
  flags:{grow:false,winter:false,water:false},items:[],stones:[],decor:[],substrate:null,
  filters:{plants:{group:'all',q:'',sort:'name',only:true,shown:PAGE},fauna:{group:'all',q:'',sort:'name',only:true,shown:PAGE}}};
const FL={air_humidity:{ru:'Влажность воздуха',en:'Air humidity'},soil_humidity:{ru:'Влажность грунта',en:'Soil moisture'},substrate:{ru:'Субстрат',en:'Substrate'},light:{ru:'Свет',en:'Light'},temperature:{ru:'Температура',en:'Temperature'}};
const SUPP={ru:{
  tab:{build:'Сборка',setup:'Условия'},
  setup:{hint:'Тара, система, место и материалы',stone:'Камень',decor:'Декор',substrate:'Субстрат',add:'Добавить…'},
  build:{composition:'Состав',issues:'Проверка',details:'Детали',recipes:'Рецепты',saved:'Мои банки',actions:'Действия',free:'свободно',layers:'Слои',apply:'Собрать',random:'Случайный рецепт',applied:'Рецепт «{n}» собран',fix_first:'Сначала уберите запреты — их нельзя обойти',workable:'Сборка жизнеспособна, но требует внимания',ready:'Условия согласованы — можно сажать',no_issues:'Ни одного замечания — редкий случай',no_recipes:'Рецепты не загружены',no_recipes_sub:'Добавьте data/presets.json — появятся готовые сборки',recipes_sub:'Проверенные сборки в один клик — потом меняйте под себя',select_all:'Выбрать все',clear_sel:'Снять',delete_sel:'Удалить выбранные',picked:'Выбрано: {n}'},
  filter:{only_compatible:'Только совместимые',hidden:'Скрыто несовместимых: {n}'},
  rail:{open:'Открыть сборку',controls:'Живые настройки'},
  dock:{volume:'Объём',height:'Высота',reset:'Сброс условий',random:'Случайный рецепт',share:'Ссылка'},
  btn:{download_care:'Скачать памятку',print:'Печать / PDF',reset_filters:'Сбросить фильтры',show_more:'Показать ещё {n}',up:'Выше',down:'Ниже'},
  state:{empty_catalog_title:'Здесь пусто',empty_catalog_text:'Сбросьте фильтры или выберите другую группу.',empty_care_title:'Памятка пуста',empty_care_text:'Добавьте растения — советы появятся автоматически.',empty_saved_title:'Пока нет сохранённых банок',empty_saved_text:'Соберите композицию и нажмите «Сохранить сборку».'},
  toast:{care_downloaded:'Памятка скачана',bulk_deleted:'Удалено: {n}'},
  similar:{title:'Похожие виды'},
  care:{sheet:'Памятка',generated:'Сгенерировано Florarium Combinator'},
  vessel:{custom:'Своя ёмкость'},
  theme:{light:'Светлая тема',dark:'Тёмная тема'},
  norms:{seasonal:{summer_shading:'Летом притеняйте банку от прямого солнца и проветривайте от перегрева',wintering_months_default:'Ноябрь — февраль'},water:'Нормы полива',placement_map:'Свет по месту установки',light_norms:'Нормы освещения',condensation:'Норма конденсата',ventilation:'График проветривания',fauna_defaults:{nematode_dosing:'Нематоды вносятся по инструкции производителя'}},
  why:{basis:'Основание',rule:'Проверка совместимости',norm:'Норма ухода',species:'Карточка вида',material:'Свойства материала',practice:'Практика ухода',diag:'Диагностика',calc:'Расчёт по вашей ёмкости'}},
 en:{
  tab:{build:'Build',setup:'Setup'},
  setup:{hint:'Vessel, system, placement and materials',stone:'Stone',decor:'Decor',substrate:'Substrate',add:'Add…'},
  build:{composition:'Composition',issues:'Check',details:'Details',recipes:'Recipes',saved:'My jars',actions:'Actions',free:'free',layers:'Layers',apply:'Build',random:'Surprise me',applied:'Recipe “{n}” applied',fix_first:'Clear the blockers first — they cannot be bypassed',workable:'Viable, but needs attention',ready:'Conditions align — ready to plant',no_issues:'No notes at all — a rare case',no_recipes:'No recipes loaded',no_recipes_sub:'Add data/presets.json to get ready-made builds',recipes_sub:'Vetted builds in one click — tweak them afterwards',select_all:'Select all',clear_sel:'Clear',delete_sel:'Delete selected',picked:'Selected: {n}'},
  filter:{only_compatible:'Compatible only',hidden:'Hidden incompatible: {n}'},
  rail:{open:'Open build',controls:'Live controls'},
  dock:{volume:'Volume',height:'Height',reset:'Reset conditions',random:'Random recipe',share:'Link'},
  btn:{download_care:'Download care guide',print:'Print / PDF',reset_filters:'Reset filters',show_more:'Show {n} more',up:'Move up',down:'Move down'},
  state:{empty_catalog_title:'Nothing here',empty_catalog_text:'Reset the filters or pick another group.',empty_care_title:'No care notes',empty_care_text:'Add plants and the tips will appear.',empty_saved_title:'No saved jars yet',empty_saved_text:'Build a composition and press “Save build”.'},
  toast:{care_downloaded:'Care guide downloaded',bulk_deleted:'Removed: {n}'},
  similar:{title:'Similar species'},
  care:{sheet:'Care sheet',generated:'Generated by Florarium Combinator'},
  vessel:{custom:'Custom vessel'},
  theme:{light:'Light theme',dark:'Dark theme'},
  norms:{seasonal:{summer_shading:'In summer shade the jar from direct sun and ventilate against overheating',wintering_months_default:'November — February'},water:'Watering standards',placement_map:'Light by placement',light_norms:'Lighting standards',condensation:'Condensation norm',ventilation:'Airing schedule',fauna_defaults:{nematode_dosing:'Apply nematodes per the manufacturer’s instructions'}},
  why:{basis:'Basis',rule:'Compatibility check',norm:'Care standard',species:'Species card',material:'Material properties',practice:'Care practice',diag:'Diagnostics',calc:'Computed from your vessel'}}};
const ICON={
  build:'<svg viewBox="0 0 24 24" class="ic"><path d="M8 3h8M9 3v3.2C9 8 6 9.6 6 13v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6c0-3.4-3-5-3-6.8V3"/><path d="M6.5 16h11"/></svg>',
  plants:'<svg viewBox="0 0 24 24" class="ic"><path d="M12 21c5-3 8-7 8-12-5 0-9 3-12 8"/><path d="M12 21C7 18 4 14 4 9c5 0 9 3 12 8"/></svg>',
  fauna:'<svg viewBox="0 0 24 24" class="ic"><ellipse cx="12" cy="13" rx="6" ry="5"/><path d="M12 8V5M9 5.5 7.5 3.5M15 5.5 16.5 3.5M6 11 3 9.5M6 15l-3 1.5M18 11l3-1.5M18 15l3 1.5"/></svg>',
  setup:'<svg viewBox="0 0 24 24" class="ic"><path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h9M17 17h3"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="15" cy="17" r="2"/></svg>',
  care:'<svg viewBox="0 0 24 24" class="ic"><path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 4v5h5M8 13h7M8 17h5"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>',
  search:'<svg viewBox="0 0 24 24" class="ic"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  x:'<svg viewBox="0 0 24 24" class="ic"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  chev:'<svg viewBox="0 0 24 24" class="ic"><path d="m9 5 7 7-7 7"/></svg>',
  dice:'<svg viewBox="0 0 24 24" class="ic"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/></svg>',
  reset:'<svg viewBox="0 0 24 24" class="ic"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5V10h5.5"/></svg>',
  link:'<svg viewBox="0 0 24 24" class="ic"><path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.4 6.4"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.4-1.4"/></svg>',
  leaf:'<svg viewBox="0 0 24 24"><path d="M12 21c5-3 8-7 8-12-5 0-9 3-12 8"/><path d="M12 21C7 18 4 14 4 9c5 0 9 3 12 8"/></svg>'
};
const KEY_RE=/^[a-z][a-z0-9_]*(\.[a-z0-9_[\]=]+)+$/i;
const dig=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function dataLookup(path){if(!booted)return null;const r=path.split('.')[0];if(r==='norms')return dig(DB.norms,path.slice(6));if(r==='materials')return dig(DB.materials,path.slice(10));if(r==='vessels')return dig(DB.vessels,path.slice(8));return null;}
function humanize(p){const s=String(p).split('.').filter(Boolean).pop()||'';const w=s.replace(/\[.*?\]/g,'').replace(/[_-]+/g,' ').trim();return w?w.charAt(0).toUpperCase()+w.slice(1):(lang==='ru'?'Параметр':'Parameter');}
function raw(path){let s=dig(I18N[lang],path);if(s==null)s=dig(I18N.en,path);if(s==null)s=dig(SUPP[lang],path);if(s==null)s=dig(SUPP.en,path);if(s==null){const d=dataLookup(path);if(typeof d==='string'||typeof d==='number')s=d;}return s==null?null:s;}
function t(path,vars){vars=vars||{};const s=raw(path);return String(s==null?humanize(path):s).replace(/\{(\w+)\}/g,(_,k)=>vars[k]!=null?vars[k]:'');}
const L=(k,ru,en)=>{const s=raw(k);return s==null?(lang==='ru'?ru:en):String(s);};
function sourceLabel(src){const s=String(src||''),w=k=>dig(SUPP[lang],'why.'+k)||dig(SUPP.en,'why.'+k);let kind='practice';
  if(/^r_/.test(s))kind='rule';else if(/^norms\b/.test(s))kind='norm';else if(/^plants_fauna\b/.test(s))kind='species';else if(/^materials\b/.test(s))kind='material';else if(/^diagnostics\b/.test(s))kind='diag';else if(/×|derived|footprint/.test(s))kind='calc';
  return w('basis')+': '+w(kind);}
function sweepKeys(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;return KEY_RE.test(n.nodeValue.trim())?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});const list=[];while(w.nextNode())list.push(w.currentNode);list.forEach(n=>{const k=n.nodeValue.trim(),s=raw(k);n.nodeValue=s!=null?String(s):humanize(k);});}
try{lang=localStorage.getItem('flor.lang')||'ru';const f=JSON.parse(localStorage.getItem('flor.filters')||'null');if(f){if(typeof f.plants==='boolean')state.filters.plants.only=f.plants;if(typeof f.fauna==='boolean')state.filters.fauna.only=f.fauna;}}catch(e){}
const saveFilters=()=>{try{localStorage.setItem('flor.filters',JSON.stringify({plants:state.filters.plants.only,fauna:state.filters.fauna.only}));}catch(e){}};
window.__ph=()=>'<div class="ph">'+ICON.leaf+'</div>';
window.__imgErr=function(img){const fb=img.getAttribute('data-fb');if(fb){img.setAttribute('data-fb','');img.src=fb;}else img.outerHTML=window.__ph();};

async function j(u){const c=new AbortController(),to=setTimeout(()=>c.abort(),15000);try{const r=await fetch(u,{cache:'no-store',signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(to);}}
async function boot(){
  try{
    for(const n of DATA){try{DB[n]=await j('data/'+n+'.json');}catch(e){throw new Error('data/'+n+'.json — '+e.message);}}
    for(const l of ['ru','en'])for(const n of NS){try{const c=await j('i18n/'+l+'/'+n+'.json');delete c.meta;if(n==='care'||n==='diag')I18N[l][n]=c;else Object.assign(I18N[l],c);}catch(e){throw new Error('i18n/'+l+'/'+n+'.json — '+e.message);}}
    DB.plants=DB.plants_fauna.plants||[];DB.fauna=DB.plants_fauna.fauna||DB.plants_fauna.invertebrates||[];
    try{const p=await j('data/presets.json');PRESETS=p.presets||[];}catch(e){PRESETS=[];}
    restoreURL();if(!state.items.length)seed();
    D=derive();booted=true;
    let th='light';try{th=localStorage.getItem('flor.theme')||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch(e){}
    $('#boot').classList.add('hidden');applyTheme(th);buildStatic();render();window.__florReady=true;
  }catch(e){console.error(e);window.__florFail('Не удалось загрузить данные: '+e.message+'. Проверьте файлы в /data и /i18n и обновите страницу (Ctrl+F5).');}
}
const nm=o=>!o?'':(lang==='ru'?o.name_ru:o.name_en)||o.name_latin||o.name_ru||'';
const fmt=n=>Number(n||0).toLocaleString(lang==='ru'?'ru-RU':'en-US',{maximumFractionDigits:1});
const enumT=(e,v)=>v==null?'—':t('enum.'+e+'.'+v);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function applyTheme(v){document.documentElement.setAttribute('data-theme',v);const b=$('#themeBtn');if(b){b.innerHTML=v==='dark'?ICON.sun:ICON.moon;b.title=t(v==='dark'?'theme.light':'theme.dark');}}

function seed(){state.items=[{kind:'plant',id:'plant_fittonia'},{kind:'plant',id:'plant_leucobryum_glaucum'},{kind:'plant',id:'plant_soleirolia_soleirolii'},{kind:'fauna',id:'fauna_collembola'}];state.stones=['ohko'];state.decor=['driftwood'];state.substrate='tropical';}
function encodeState(){const v=state.vessel,p=new URLSearchParams();p.set('v',String(Math.round((D&&D.volume||0)*10)/10));p.set('sys',state.system);p.set('place',state.placement);p.set('water',state.water);p.set('exp',state.experience);if(state.style)p.set('style',state.style);p.set('shape',v.shape);p.set('h',v.height);p.set('d',v.diameter||'');p.set('w',v.width||'');p.set('dp',v.depth||'');p.set('items',state.items.map(i=>{const o=obj(i);return o?o.slug:'';}).filter(Boolean).join(','));p.set('stones',state.stones.join(','));p.set('decor',state.decor.join(','));if(state.substrate)p.set('sub',state.substrate);p.set('fl',[state.flags.grow,state.flags.winter,state.flags.water].map(b=>b?1:0).join(''));return p;}
function restoreURL(){
  const p=new URLSearchParams(location.search);if(!p.has('sys'))return;
  state.system=p.get('sys');state.placement=p.get('place')||'east_west';state.water=p.get('water')||'soft';state.experience=p.get('exp')||'beginner';state.style=p.get('style')||'';
  const v=state.vessel;v.preset='custom';v.shape=p.get('shape')||'jar';v.height=+p.get('h')||20;v.diameter=+p.get('d')||14;v.width=+p.get('w')||20;v.depth=+p.get('dp')||20;
  const m=(DB.vessels.presets||[]).find(pr=>{if(pr.shape!==v.shape)return false;const d=pr.dims_cm||{};if(Math.abs((d.height_cm||0)-v.height)>.5)return false;if(['cube','tank','geo_house'].includes(v.shape))return Math.abs((d.width_cm||0)-v.width)<.5&&Math.abs((d.depth_cm||0)-v.depth)<.5;return Math.abs((d.diameter_cm||0)-v.diameter)<.5;});
  if(m){v.preset=m.id;v.closure=m.closure_default||v.closure;v.neck=m.neck_diameter_cm||null;v.volumeLabel=m.volume_liters_label||null;}
  else if(v.shape==='bottle'&&p.get('v'))v.volumeLabel=+p.get('v')||null;
  const all=DB.plants.concat(DB.fauna);
  state.items=(p.get('items')||'').split(',').filter(Boolean).map(s=>{const o=all.find(x=>x.slug===s);return o?{kind:o.id.indexOf('plant_')===0?'plant':'fauna',id:o.id}:null;}).filter(Boolean);
  state.stones=(p.get('stones')||'').split(',').filter(Boolean);state.decor=(p.get('decor')||'').split(',').filter(Boolean);state.substrate=p.get('sub')||null;
  const f=p.get('fl')||'000';state.flags={grow:f[0]==='1',winter:f[1]==='1',water:f[2]==='1'};
}
const store={all:()=>{try{return JSON.parse(localStorage.getItem('florarium.builds.v1')||'[]');}catch(e){return[];}},
  save(n){const a=store.all();a.unshift({id:Date.now(),name:n,created:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))});localStorage.setItem('florarium.builds.v1',JSON.stringify(a));},
  del(id){localStorage.setItem('florarium.builds.v1',JSON.stringify(store.all().filter(x=>x.id!==id)));},
  load(id){const b=store.all().find(x=>x.id===id);if(!b)return;const s=JSON.parse(JSON.stringify(b.state));delete s.tab;delete s.buildTab;delete s.careTab;delete s.sel;Object.assign(state,s);if(!state.filters||!state.filters.plants)state.filters={plants:{group:'all',q:'',sort:'name',only:true,shown:PAGE},fauna:{group:'all',q:'',sort:'name',only:true,shown:PAGE}};state.sel=[];state.tab='build';state.buildTab='composition';buildStatic();render();toast(t('toast.saved'));}};

function obj(i){return (i.kind==='plant'?DB.plants:DB.fauna).find(x=>x.id===i.id);}
const selP=()=>state.items.filter(i=>i.kind==='plant').map(obj).filter(Boolean);
const selF=()=>state.items.filter(i=>i.kind==='fauna').map(obj).filter(Boolean);
const stones=()=>state.stones.map(id=>DB.materials.stones.find(s=>s.id===id)).filter(Boolean);
const decor=()=>state.decor.map(id=>DB.materials.decor.find(s=>s.id===id)).filter(Boolean);
const inter=a=>a.length?a.reduce((x,y)=>x.filter(v=>y.indexOf(v)>=0),a[0].slice()):[];
function habit(p){const l=p.layer_form||[];if(l.length===1&&l[0]==='mount')return 'mount';if(l.some(x=>x==='bush'||x==='accent'))return 'upright';if(l.indexOf('vine')>=0)return 'trailing';return 'groundcover';}
function currentSub(){if(state.substrate)return state.substrate;const c=inter(selP().concat(selF()).map(x=>x.substrate));return c[0]||'tropical';}
const subObj=()=>DB.materials.substrates.find(s=>s.id===currentSub());
const compName=id=>{const c=(DB.materials.components||[]).find(x=>x.id===id);return c?nm(c):humanize(id);};
function applyVesselPreset(p){const d=p.dims_cm||{},v=state.vessel;v.preset=p.id;v.shape=p.shape;v.closure=p.closure_default||v.closure;v.neck=p.neck_diameter_cm||null;v.volumeLabel=p.volume_liters_label||null;if(d.diameter_cm!=null)v.diameter=d.diameter_cm;if(d.height_cm!=null)v.height=d.height_cm;if(d.width_cm!=null)v.width=d.width_cm;if(d.depth_cm!=null)v.depth=d.depth_cm;if(!p.systems.includes(state.system))state.system=p.systems[0];}

function derive(){
  const v=state.vessel,N=DB.norms,pi=Math.PI,d=v.diameter||14,h=v.height||20,w=v.width||20,dp=v.depth||20;let vol,foot;
  if(v.shape==='bowl'){vol=pi*(d/2)*(d/2)*h*.65;foot=pi*(d/2)*(d/2)*.8;}
  else if(v.shape==='sphere'){vol=4/3*pi*Math.pow(d/2,3)*.85;foot=pi*(d/2)*(d/2)*.6;}
  else if(v.shape==='bottle'){vol=v.volumeLabel?v.volumeLabel*1000:pi*(d/2)*(d/2)*h*.7;foot=pi*(d/2)*(d/2)*.8;}
  else if(v.shape==='geo_house'){vol=w*dp*h*.9;foot=w*dp;}
  else if(v.shape==='cube'||v.shape==='tank'){vol=w*dp*h;foot=w*dp;}
  else{vol=pi*(d/2)*(d/2)*h;foot=pi*(d/2)*(d/2);}
  vol/=1000;
  const drain=Math.min(N.layers.drainage.max_cm,Math.max(N.layers.drainage.min_cm,h*.2));
  const sub=subObj(),depth=sub?sub.depth_cm[0]:5,free=Math.max(0,h-drain-.3-depth-2.5);
  const P=selP(),F=selF(),all=P.concat(F),fields=['air_humidity','soil_humidity','substrate','light','temperature'],cor={};
  fields.forEach(f=>cor[f]=all.length?inter(all.map(x=>x[f]||[])):[]);
  const place=N.placement_map[state.placement]||{light:['bright_indirect']};
  const phParts=P.map(x=>x.ph_tolerance||[]);if(sub)phParts.push(sub.ph_zones);stones().forEach(s=>phParts.push(s.ph_zones));if(state.water==='tap_hard')phParts.push(['slightly_acid','neutral','alkaline']);
  const ph=P.length?inter(phParts):(sub?sub.ph_zones:[]);
  const bk={upright_trailing:{used:0,limit:foot*.8},groundcover:{used:0,limit:foot*.9},mount:{used:0,limit:Infinity}};
  P.forEach(p=>{const hb=habit(p),area=(N.planting.footprint_cm2_per_size[p.size]||100)*(p.growth_rate==='aggressive'?2:1);if(hb==='mount')bk.mount.used++;else if(hb==='groundcover')bk.groundcover.used+=area;else bk.upright_trailing.used+=area;});
  return {volume:vol,footprint:foot,freeHeight:free,drainage:drain,depth:depth,corridors:cor,lightAvail:place.light,ph:ph,buckets:bk,place:place};
}
function findPair(f){const all=selP().concat(selF());for(let i=0;i<all.length;i++)for(let k=i+1;k<all.length;k++)if(!all[i][f].some(x=>all[k][f].indexOf(x)>=0))return[nm(all[i]),nm(all[k])];return['—','—'];}
function evaluate(){
  const P=selP(),F=selF(),S=stones(),DC=decor(),hits=[],add=(id,sev,vars)=>hits.push({id,sev,vars:vars||{}}),sys=state.system,vol=D.volume;
  const preset=DB.vessels.presets.find(x=>x.id===state.vessel.preset);
  const allowed=preset?preset.systems:(state.vessel.closure==='sealable'?['closed','semi','open']:state.vessel.closure==='vented'?['semi','open']:['open']);
  if(allowed.indexOf(sys)<0)add('r_vessel_closure','block',{shape:enumT('vessel_shape',state.vessel.shape)});
  if((state.vessel.neck&&state.vessel.neck<8)||['bottle','sphere'].indexOf(state.vessel.shape)>=0)add('r_narrow_neck','warning');
  if(state.placement==='south_direct'&&sys==='closed')add('r_closed_direct_sun','block');
  if(state.placement==='south_direct'&&sys==='semi')add('r_semi_direct_sun','warning');
  P.forEach(p=>{
    if(!p.system_type.includes(sys))add('r_system_type_mismatch','block',{species:nm(p),system:enumT('system_type',sys)});
    if(sys==='closed'&&p.airflow==='high')add('r_system_airflow_high','block',{species:nm(p)});
    if(sys==='closed'&&p.airflow==='mid')add('r_system_airflow_medium','warning',{species:nm(p)});
    if(sys==='closed'&&p.condensation!=='yes')add('r_condensation_closed','block',{species:nm(p)});
    if(sys==='semi'&&p.condensation==='no')add('r_condensation_semi','block',{species:nm(p)});
    if((p.habitat.includes('aquatic')||p.habitat.includes('paludarium'))&&!state.flags.water)add('r_habitat_aquatic','block',{species:nm(p)});
    const mv=sys==='closed'?p.min_volume_closed_liters:p.min_volume_open_liters;
    if(vol<mv)add(sys==='closed'?'r_volume_plant_closed':'r_volume_plant_open','block',{species:nm(p),min_volume:mv,volume:fmt(vol)});
    if(p.growth_rate==='aggressive'&&vol<5)add('r_growth_aggressive','warning',{species:nm(p),interval:p.trim_interval_weeks||3});
    if(p.requires_grow_light&&!state.flags.grow&&state.placement!=='lamp_only')add('r_grow_light','warning',{species:nm(p)});
    if(p.dormancy!=='none'&&sys==='closed'&&!state.flags.winter)add('r_dormancy','warning',{species:nm(p)});
    if(state.experience==='beginner'&&p.care_level==='expert')add('r_experience','warning',{species:nm(p)});
    if(p.monocarpic)add('r_monocarpic','info',{species:nm(p)});
    if(p.needs_day_night_drop&&sys==='closed')add('r_day_night_drop','warning',{species:nm(p)});
    if(!p.layer_form.includes('vine')&&!p.layer_form.includes('mount')){if(p.height_cm>D.freeHeight*1.5)add('r_height_no_fit','block',{species:nm(p),height:p.height_cm,free_height:fmt(D.freeHeight)});else if(p.height_cm>D.freeHeight)add('r_height_overflow','warning',{species:nm(p),height:p.height_cm,free_height:fmt(D.freeHeight)});}
    if(D.freeHeight<8&&p.size!=='micro'&&!p.layer_form.includes('carpet'))add('r_shallow','block',{species:nm(p)});
    if(state.water==='tap_hard'&&p.water_quality==='distilled_only')add('r_water_distilled_required','block',{species:nm(p)});
    if(state.water==='tap_hard'&&p.water_quality==='soft')add('r_water_soft_recommended','warning',{species:nm(p)});
    if(p.habitat.includes('epiphyte')&&!DC.some(x=>x.is_mount)&&!S.length)add('r_epiphyte_mount','info',{species:nm(p)});
  });
  F.forEach(f=>{
    if(!f.system_type.includes(sys))add('r_system_type_mismatch','block',{species:nm(f),system:enumT('system_type',sys)});
    if(vol<f.min_volume_liters)add('r_volume_fauna','block',{species:nm(f),min_volume:f.min_volume_liters,volume:fmt(vol)});
    if(f.digging==='burrowing'&&vol<10)add('r_digging_small','block',{species:nm(f)});
    if(f.plant_interest==='eats_live'&&vol<10)add('r_plant_interest_large','block',{species:nm(f)});
    if(f.plant_interest==='nibbles'&&vol<5)add('r_plant_interest_small','warning',{species:nm(f)});
    if(f.fauna_toxicity==='toxic_secret'&&F.length>1)add('r_fauna_secret','warning',{fauna:nm(f)});
    if(f.feeding==='needs_feeding'&&sys==='closed')add('r_feeding_closed','warning',{species:nm(f)});
    if(f.role.includes('pest'))add('r_fauna_pest','warning',{species:nm(f)});
    if(state.style&&['iwagumi_rocky','minimal_modern'].includes(state.style)&&f.digging==='burrowing')add('r_digging_style','warning',{species:nm(f)});
  });
  P.forEach(p=>{if(p.plant_toxicity==='toxic_if_eaten')F.forEach(f=>{if(f.plant_interest!=='none')add('r_toxicity_plant_fauna','warning',{plant:nm(p),fauna:nm(f)});});});
  const cl=new Set(P.concat(F).map(x=>x.climate).filter(x=>x&&x!=='any'));if(cl.has('tropical')&&cl.has('temperate')&&!state.flags.winter)add('r_climate_mix','warning');
  const agg=P.filter(p=>p.growth_rate==='aggressive').length;if(agg>2)add('r_multiple_aggressive','warning',{count:agg});
  const pr=F.filter(f=>f.role.includes('predator')).length;if(pr>1)add('r_multiple_predators','warning',{count:pr});
  if(['closed','semi'].includes(sys)&&!F.some(f=>f.role.includes('cleanup')))add('r_no_cleanup_crew','warning');
  if(sys==='open'&&F.length)add('r_open_fauna_cover','warning');
  if(state.flags.water&&D.footprint<300)add('r_paludarium_min','warning');
  ['air_humidity','soil_humidity','substrate','light','temperature'].forEach(f=>{if(P.concat(F).length>1&&!D.corridors[f].length){const q=findPair(f);add('r_global_intersection','block',{field:FL[f][lang],a:q[0],b:q[1]});}});
  if(D.corridors.light.length&&P.some(p=>!D.corridors.light.includes(p.light_optimum)))add('r_light_optimum_mismatch','warning');
  if(P.length&&!D.ph.length){const a=P.find(p=>!p.ph_tolerance.includes('neutral'))||P[0];add('r_ph_conflict','block',{species:nm(a)});}else if(P.length&&D.ph.length===1)add('r_ph_narrow','warning');
  S.forEach(s=>{if(s.ph_test_required)add('r_ph_test_required','warning',{stone:nm(s)});});
  if(F.some(f=>f.feeding==='needs_feeding')&&['carnivore_acid','moss_acid'].includes(currentSub()))add('r_calcium_vs_acid','warning');
  if(DC.some(x=>x.is_feeding)&&F.some(f=>f.feeding==='needs_feeding'))add('r_litter_feeding','info');
  S.forEach(s=>{if(s.sharp_edges&&F.length)add('r_stone_sharp_fauna','info',{stone:nm(s)});});
  ['upright_trailing','groundcover'].forEach(b=>{const x=D.buckets[b],r=x.limit&&isFinite(x.limit)?x.used/x.limit:0;if(r>1.25)add('r_overcrowding_hard','block',{bucket:b});else if(r>1)add('r_overcrowding','warning',{bucket:b});});
  const seen=new Set();return hits.filter(h=>{const k=h.id+JSON.stringify(h.vars);if(seen.has(k))return false;seen.add(k);return true;});
}
function itemStatus(o){
  const isP=o.id.indexOf('plant_')===0,sys=state.system;
  if(state.items.some(i=>i.id===o.id))return{level:'added'};
  if(!o.system_type.includes(sys))return{level:'block',reason:t('rules.r_system_type_mismatch.msg',{species:nm(o),system:enumT('system_type',sys)})};
  if(isP){const mv=sys==='closed'?o.min_volume_closed_liters:o.min_volume_open_liters;if(D.volume<mv)return{level:'block',reason:t('rules.r_volume_plant_closed.msg',{species:nm(o),min_volume:mv,volume:fmt(D.volume)})};if(sys==='closed'&&o.condensation!=='yes')return{level:'block',reason:t('rules.r_condensation_closed.msg',{species:nm(o)})};if(sys==='closed'&&o.airflow==='high')return{level:'block',reason:t('rules.r_system_airflow_high.msg',{species:nm(o)})};}
  else if(D.volume<o.min_volume_liters)return{level:'block',reason:t('rules.r_volume_fauna.msg',{species:nm(o),min_volume:o.min_volume_liters,volume:fmt(D.volume)})};
  const all=selP().concat(selF(),[o]);for(const f of ['air_humidity','soil_humidity','substrate','light','temperature'])if(!inter(all.map(x=>x[f]||[])).length)return{level:'block',reason:t('conflict.'+f+'.msg',{a:nm(o),b:selP()[0]?nm(selP()[0]):'—'})};
  return{level:'ok'};
}
function imgHTML(o,cls){const im=o.image||{},local=im.file||'',remote=im.source_url||'',src=local||remote;if(!src)return window.__ph();const fb=local&&remote?remote:'';return '<img class="'+(cls||'')+'" src="'+esc(src)+'" alt="'+esc(nm(o))+'" loading="lazy" referrerpolicy="no-referrer" data-fb="'+esc(fb)+'" onerror="__imgErr(this)">';}
const thumbSrc=o=>{const im=(o&&o.image)||{};return im.file||im.source_url||'';};

/* ── shell ── */
const tabLabel=k=>({build:t('tab.build'),plants:t('step.plants'),fauna:t('step.fauna'),setup:t('tab.setup'),care:t('nav.care')})[k];
function buildStatic(){
  document.documentElement.lang=lang;$('#langBtn').textContent=lang.toUpperCase();
  $$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  $('#tabnav').innerHTML=TABS.map(k=>'<button data-go="'+k+'" class="'+(state.tab===k?'on':'')+'">'+ICON[k]+'<span>'+tabLabel(k)+'</span></button>').join('');
  $('#tabbar').innerHTML=TABS.map(k=>'<button data-go="'+k+'" class="'+(state.tab===k?'on':'')+'" data-tabbtn="'+k+'">'+ICON[k]+'<span>'+tabLabel(k)+'</span></button>').join('');
  ['plants','fauna'].forEach(kind=>{
    $('#'+kind+'Toolbar').innerHTML='<div class="search">'+ICON.search+'<input type="search" id="q-'+kind+'" autocomplete="off" placeholder="'+(lang==='ru'?'Поиск…':'Search…')+'" value="'+esc(state.filters[kind].q)+'"></div>'+
      '<select class="select" id="sort-'+kind+'">'+[['name',lang==='ru'?'По имени':'Name'],['care',lang==='ru'?'По сложности':'Care'],['size',lang==='ru'?'По размеру':'Size']].map(x=>'<option value="'+x[0]+'"'+(state.filters[kind].sort===x[0]?' selected':'')+'>'+x[1]+'</option>').join('')+'</select>';
  });
  buildRailControls();buildDock();applyTheme(document.documentElement.getAttribute('data-theme')||'light');
}
function vesselOptions(){return DB.vessels.presets.map(p=>'<option value="'+p.id+'"'+(p.id===state.vessel.preset?' selected':'')+'>'+nm(p)+' · '+fmt(p.volume_liters_approx)+' '+t('units.l')+'</option>').join('')+(state.vessel.preset==='custom'?'<option value="custom" selected>'+t('vessel.custom')+'</option>':'');}
function placeOptions(){return DB.criteria.enums.placement.values.map(p=>'<option value="'+p+'"'+(p===state.placement?' selected':'')+'>'+enumT('placement',p)+'</option>').join('');}
function waterOptions(){return DB.criteria.enums.water_type.values.map(w=>'<option value="'+w+'"'+(w===state.water?' selected':'')+'>'+enumT('water_type',w)+'</option>').join('');}
function styleOptions(){return '<option value="">—</option>'+DB.styles.styles.map(s=>'<option value="'+s.id+'"'+(s.id===state.style?' selected':'')+'>'+t('styles.'+s.id+'.name')+'</option>').join('');}
function sysSeg(){return '<div class="seg">'+['closed','semi','open'].map(s=>'<button data-sys="'+s+'" class="'+(state.system===s?'on':'')+'">'+enumT('system_type',s)+'</button>').join('')+'</div>';}
function expSeg(){return '<div class="seg">'+['beginner','experienced'].map(e=>'<button data-exp="'+e+'" class="'+(state.experience===e?'on':'')+'">'+enumT('experience',e)+'</button>').join('')+'</div>';}
const flagLabel=k=>({grow:t('input.grow_light'),winter:t('input.wintering'),water:t('input.open_water')})[k];
function buildRailControls(){
  $('#railControls').innerHTML='<div class="rc-title">'+ICON.setup+t('rail.controls')+'</div>'+
    '<div class="rc-row"><span class="rc-l">'+t('step.vessel')+'</span><select class="select" data-ctl="vessel">'+vesselOptions()+'</select></div>'+
    '<div class="rc-row"><span class="rc-l">'+t('input.system')+'</span>'+sysSeg()+'</div>'+
    '<div class="rc-row"><span class="rc-l"><span>'+t('derived.volume')+'</span><b data-out="vol"></b></span><input class="range" type="range" min="1" max="15" step="0.5" data-ctl="vol"></div>'+
    '<div class="rc-row"><span class="rc-l"><span>'+t('input.height')+'</span><b data-out="h"></b></span><input class="range" type="range" min="8" max="45" step="1" data-ctl="h"></div>'+
    '<div class="rc-row"><span class="rc-l">'+t('input.placement')+'</span><select class="select" data-ctl="place">'+placeOptions()+'</select></div>'+
    '<div class="rc-row"><span class="rc-l">'+t('input.water')+'</span><select class="select" data-ctl="water">'+waterOptions()+'</select></div>'+
    '<div class="rc-row"><span class="rc-l">'+t('input.style')+'</span><select class="select" data-ctl="style">'+styleOptions()+'</select></div>'+
    '<div class="rc-row"><span class="rc-l">'+t('input.experience')+'</span>'+expSeg()+'</div>'+
    '<div class="rc-toggles">'+['grow','winter','water'].map(k=>'<button class="chip-t'+(state.flags[k]?' on':'')+'" data-flagchip="'+k+'"><span class="dotc"></span>'+flagLabel(k)+'</button>').join('')+'</div>'+
    '<div class="rc-actions"><button class="btn ghost" data-act="reset">'+ICON.reset+t('dock.reset')+'</button><button class="btn ghost" data-act="random">'+ICON.dice+'</button></div>';
}
function buildDock(){
  $('#dock').innerHTML=
    '<div class="pod">'+sysSeg()+'</div>'+
    '<div class="pod"><span class="pod-l">'+t('dock.volume')+'</span><span class="stepper"><button data-step="vol:-0.5" aria-label="−">−</button><b data-out="vol"></b><button data-step="vol:0.5" aria-label="+">+</button></span></div>'+
    '<div class="pod"><span class="pod-l">'+t('dock.height')+'</span><span class="stepper"><button data-step="h:-1" aria-label="−">−</button><b data-out="h"></b><button data-step="h:1" aria-label="+">+</button></span></div>'+
    '<div class="pod"><span class="pod-l">'+t('input.placement')+'</span><select data-ctl="place">'+placeOptions()+'</select></div>'+
    '<div class="pod"><span class="pod-l">'+t('input.water')+'</span><select data-ctl="water">'+waterOptions()+'</select></div>'+
    '<div class="pod"><span class="pod-l">'+t('input.style')+'</span><select data-ctl="style">'+styleOptions()+'</select></div>'+
    ['grow','winter','water'].map(k=>'<button class="chip-t'+(state.flags[k]?' on':'')+'" data-flagchip="'+k+'"><span class="dotc"></span>'+flagLabel(k)+'</button>').join('')+
    '<button class="chip-t" data-act="reset">'+ICON.reset+t('dock.reset')+'</button>'+
    '<button class="chip-t" data-act="random">'+ICON.dice+t('dock.random')+'</button>'+
    '<button class="chip-t" data-act="share">'+ICON.link+t('dock.share')+'</button>';
}
function syncControls(){
  $$('[data-out="vol"]').forEach(e=>e.textContent=fmt(D.volume)+' '+t('units.l'));
  $$('[data-out="h"]').forEach(e=>e.textContent=state.vessel.height+' '+t('units.cm'));
  $$('[data-ctl="vol"]').forEach(e=>{e.value=Math.min(15,Math.max(1,D.volume));e.style.setProperty('--p',((e.value-1)/14*100)+'%');});
  $$('[data-ctl="h"]').forEach(e=>{e.value=state.vessel.height;e.style.setProperty('--p',((e.value-8)/37*100)+'%');});
  $$('[data-ctl="place"]').forEach(e=>e.value=state.placement);
  $$('[data-ctl="water"]').forEach(e=>e.value=state.water);
  $$('[data-ctl="style"]').forEach(e=>e.value=state.style||'');
  $$('[data-ctl="vessel"]').forEach(e=>{if(!e.querySelector('[value="custom"]')&&state.vessel.preset==='custom')e.insertAdjacentHTML('beforeend','<option value="custom">'+t('vessel.custom')+'</option>');e.value=state.vessel.preset;});
  $$('[data-sys]').forEach(b=>b.classList.toggle('on',b.dataset.sys===state.system));
  $$('[data-exp]').forEach(b=>b.classList.toggle('on',b.dataset.exp===state.experience));
  $$('[data-flagchip]').forEach(b=>b.classList.toggle('on',!!state.flags[b.dataset.flagchip]));
  $$('#setupBody [data-flag]').forEach(c=>c.checked=!!state.flags[c.dataset.flag]);
}
function render(opts){
  opts=opts||{};if(!booted)return;
  D=derive();const hits=evaluate();
  document.body.dataset.tab=state.tab;
  TABS.forEach(k=>{const p=$('#pane-'+k);if(p)p.classList.toggle('hidden',k!==state.tab);});
  $$('#tabnav button,#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.go===state.tab));
  const bl=hits.filter(h=>h.sev==='block').length;
  const bb=$('#tabbar [data-tabbtn="build"]');if(bb){const o=bb.querySelector('.badge');if(o)o.remove();if(bl)bb.insertAdjacentHTML('beforeend','<span class="badge" aria-live="polite">'+bl+'</span>');}
  renderStatus(hits);
  if(state.tab==='build')renderBuild(hits);
  if(state.tab==='plants')renderCatalog('plants');
  if(state.tab==='fauna')renderCatalog('fauna');
  if(state.tab==='setup'&&!opts.skipSetup)renderSetup();
  if(state.tab==='care')renderCare();
  renderRail(hits);syncControls();sweepKeys($('#shell'));sweepKeys($('#dock'));
}
function renderStatus(hits){
  const el=$('#statusStrip'),bl=hits.filter(h=>h.sev==='block').length,wa=hits.filter(h=>h.sev==='warning').length;
  el.innerHTML='<span class="s-orb '+(bl?'block':wa?'warn':'ok')+'"></span><span class="s-text">'+selP().length+' '+t('step.plants').toLowerCase()+' · '+selF().length+' '+t('step.fauna').toLowerCase()+' <i>· '+fmt(D.volume)+' '+t('units.l')+'</i></span>'+(bl?'<span class="badge">'+bl+'</span>':'')+ICON.chev;
}
function go(tab){if(!TABS.includes(tab))return;state.tab=tab;render();window.scrollTo({top:0,behavior:'smooth'});}

/* ── build ── */
function renderBuild(hits){
  const bl=hits.filter(h=>h.sev==='block'),wa=hits.filter(h=>h.sev==='warning'),inf=hits.filter(h=>h.sev==='info');
  const lvl=bl.length?'block':wa.length?'warn':'ok';
  const title=bl.length?t('compat.blocks_title'):wa.length?t('compat.warnings_title'):t('compat.all_good');
  const note=bl.length?t('build.fix_first'):wa.length?t('build.workable'):t('build.ready');
  $('#pvMeta').innerHTML='<span class="tag size">'+fmt(D.volume)+' '+t('units.l')+'</span><span class="tag light">'+enumT('system_type',state.system)+'</span><span class="tag care">'+enumT('vessel_shape',state.vessel.shape)+'</span>';
  $('#verdictCard').innerHTML='<div class="verdict-head"><span class="verdict-orb '+lvl+'"></span><span><span class="verdict-title">'+title+'</span><span class="verdict-note">'+note+'</span></span></div>'+
    '<div class="stat-row"><div class="stat"><b>'+selP().length+'</b><span>'+t('step.plants')+'</span></div><div class="stat"><b>'+selF().length+'</b><span>'+t('step.fauna')+'</span></div><div class="stat"><b>'+fmt(D.freeHeight)+'</b><span>'+t('units.cm')+' '+t('build.free')+'</span></div><div class="stat"><b>'+fmt(D.footprint)+'</b><span>'+t('units.cm2')+'</span></div></div>'+
    '<div class="quick-actions"><button class="btn primary" id="careBtn"'+(bl.length?' disabled':'')+'>'+t('btn.finalize')+'</button><button class="btn ghost" data-go="plants">'+t('btn.add')+' '+t('step.plants').toLowerCase()+'</button><button class="btn ghost" data-go="setup">'+tabLabel('setup')+'</button></div>';
  const bt=[['composition',t('build.composition'),state.items.length],['issues',t('build.issues'),bl.length+wa.length+inf.length],['details',t('build.details'),0],['recipes',t('build.recipes'),PRESETS.length],['saved',t('build.saved'),store.all().length]];
  $('#buildSubtabs').innerHTML=bt.map(x=>'<button data-btab="'+x[0]+'" class="'+(state.buildTab===x[0]?'on':'')+'" role="tab" aria-selected="'+(state.buildTab===x[0])+'">'+x[1]+(x[2]?'<span class="badge'+(x[0]==='issues'&&bl.length?'':' soft')+'" aria-live="polite">'+x[2]+'</span>':'')+'</button>').join('');
  const body=$('#buildBody');
  if(state.buildTab==='composition')body.innerHTML=compositionHTML()+metersHTML()+actionsHTML(bl.length);
  else if(state.buildTab==='issues')body.innerHTML=issuesHTML(hits);
  else if(state.buildTab==='details')body.innerHTML=detailsHTML();
  else if(state.buildTab==='recipes')body.innerHTML=recipesHTML();
  else body.innerHTML=savedHTML();
  sweepKeys(body);
}
function compositionHTML(){
  const picked=state.sel.length;
  const bulk=picked?'<div class="bulkbar"><span class="grow">'+t('build.picked').replace('{n}',picked)+'</span><button class="btn sm ghost" data-act="selclear">'+t('build.clear_sel')+'</button><button class="btn sm danger" data-act="seldel">'+t('build.delete_sel')+'</button></div>':'<div class="bulkbar" style="background:var(--glass2);border-color:var(--line)"><span class="grow sub">'+t('step.plants')+' · '+t('step.fauna')+'</span><button class="btn sm ghost" data-act="selall">'+t('build.select_all')+'</button></div>';
  return '<div class="section"><h3>'+t('build.composition')+'</h3>'+bulk+'<div class="sel-list">'+(state.items.map((it,i)=>{const o=obj(it);if(!o)return'';const on=state.sel.includes(o.id);
    return '<div class="sel-row'+(on?' picked':'')+'" draggable="true" data-idx="'+i+'"><input class="sel-check" type="checkbox" data-sel="'+esc(o.id)+'"'+(on?' checked':'')+' aria-label="'+esc(nm(o))+'">'+imgHTML(o,'sel-thumb')+'<span class="sel-info"><span class="sel-name">'+nm(o)+'</span><span class="sel-meta">'+t('group.'+o.group)+'</span></span><span class="move"><button data-move="'+i+':-1"'+(i===0?' disabled':'')+' aria-label="'+t('btn.up')+'">▲</button><button data-move="'+i+':1"'+(i===state.items.length-1?' disabled':'')+' aria-label="'+t('btn.down')+'">▼</button></span><button class="sel-x" data-rm="'+i+'" aria-label="'+t('btn.remove')+'">'+ICON.x+'</button></div>';}).join('')||'<div class="empty small"><div class="empty-orb"></div><p>'+t('state.empty_body')+'</p><button class="btn ghost" data-go="plants">'+t('state.empty_action')+'</button></div>')+'</div></div>';
}
function metersHTML(){return '<div class="section"><h3>'+t('derived.capacity')+'</h3>'+meter(t('enum.layer_form.bush'),D.buckets.upright_trailing)+meter(t('enum.layer_form.carpet'),D.buckets.groundcover)+'</div>';}
function meter(label,b){const r=b.limit&&isFinite(b.limit)?b.used/b.limit:0,cls=r>1.25?'block':r>1?'warn':'';return '<div class="meter"><div class="meter-top"><span>'+label+'</span><span>'+fmt(b.used)+' / '+fmt(b.limit)+' '+t('units.cm2')+'</span></div><div class="meter-bar"><div class="meter-fill '+cls+'" style="width:'+Math.min(100,r*100)+'%"></div></div></div>';}
function actionsHTML(dis){return '<div class="section"><h3>'+t('build.actions')+'</h3><div class="actions"><button class="btn primary" id="dlCareBtn"'+(dis?' disabled':'')+'>'+t('btn.download_care')+'</button><button class="btn ghost" data-act="save">'+t('btn.save')+'</button><button class="btn ghost" data-act="share">'+t('btn.copy_link')+'</button><button class="btn ghost" data-act="ai">'+t('btn.check_ai')+'</button></div></div>';}
function issuesHTML(hits){
  if(!hits.length)return '<div class="empty"><div class="empty-orb"></div><h3>'+t('compat.all_good')+'</h3><p class="sub">'+t('build.no_issues')+'</p></div>';
  const sev=s=>t('severity.'+(s==='block'?'block':s==='warning'?'warning':'info'));
  return ['block','warning','info'].map(s=>{const g=hits.filter(h=>h.sev===s);return g.length?'<div class="section"><h3>'+sev(s)+' · '+g.length+'</h3>'+g.map(h=>'<div class="issue '+h.sev+'"><div class="issue-head">'+sev(h.sev)+'</div><div>'+t('rules.'+h.id+'.msg',h.vars)+'</div><div class="issue-remedy">'+t('rules.'+h.id+'.remedy',h.vars)+'</div></div>').join('')+'</div>':'';}).join('');
}
function detailsHTML(){
  const sub=subObj(),N=DB.norms,ch=(N.layers.charcoal&&N.layers.charcoal.thickness_cm)?N.layers.charcoal.thickness_cm[0]:.5;
  return '<div class="section"><h3>'+t('derived.ph_corridor')+'</h3><div class="tags">'+(D.ph.map(z=>'<span class="tag size">'+enumT('ph_zone',z)+'</span>').join('')||'<span class="sub">—</span>')+'</div></div>'+
    '<div class="section"><h3>'+t('build.layers')+'</h3><dl class="kv"><dt>'+t('bom.drainage')+'</dt><dd>'+fmt(D.drainage)+' '+t('units.cm')+'</dd><dt>'+t('bom.separator')+'</dt><dd>0.3 '+t('units.cm')+'</dd><dt>'+t('bom.charcoal')+'</dt><dd>'+fmt(ch)+' '+t('units.cm')+'</dd><dt>'+t('bom.substrate')+'</dt><dd>'+fmt(D.depth)+' '+t('units.cm')+'</dd></dl></div>'+
    (sub?'<div class="section"><h3>'+nm(sub)+'</h3><p class="sub">'+sub.recipe.map(r=>Math.round(r.pct)+'% '+compName(r.component)).join(' · ')+'</p></div>':'')+
    '<div class="section"><h3>'+t('bom.title')+'</h3><dl class="kv"><dt>'+t('bom.drainage')+'</dt><dd>'+fmt(D.footprint*D.drainage/1000)+' '+t('units.l')+'</dd><dt>'+t('bom.substrate')+'</dt><dd>'+fmt(D.footprint*D.depth/1000)+' '+t('units.l')+'</dd><dt>'+t('bom.charcoal')+'</dt><dd>'+Math.round(D.volume*15)+' '+t('units.ml')+'</dd></dl><p class="sub" style="margin-top:9px">'+t('bom.total_note')+'</p></div>';
}
function jarIcon(shape){const p={bowl:'M4 14 L4 30 Q4 44 21 44 Q38 44 38 30 L38 14',sphere:'M21 6 A15 15 0 1 1 20.9 6 Z',cube:'M5 10 H37 V44 H5 Z',bottle:'M15 4 L15 14 L6 22 L6 44 L36 44 L36 22 L27 14 L27 4',geo_house:'M21 4 L38 18 L38 44 L4 44 L4 18 Z',tank:'M3 12 H39 V44 H3 Z'}[shape]||'M8 8 Q8 4 12 4 H30 Q34 4 34 8 L34 40 Q34 44 30 44 H12 Q8 44 8 40 Z';return '<svg viewBox="0 0 42 48" aria-hidden="true"><path d="'+p+'"/><path d="M6 38 H36" opacity=".45"/><path d="M6 33 H36" opacity=".25"/></svg>';}
function recipesHTML(){
  if(!PRESETS.length)return '<div class="empty"><div class="empty-orb"></div><h3>'+t('build.no_recipes')+'</h3><p class="sub">'+t('build.no_recipes_sub')+'</p></div>';
  const all=DB.plants.concat(DB.fauna);
  return '<div class="section"><h3>'+t('build.recipes')+'</h3><p class="sub" style="margin-bottom:12px">'+t('build.recipes_sub')+'</p><div class="recipes">'+PRESETS.map(p=>{
    const v=(DB.vessels.presets||[]).find(x=>x.id===p.vessel)||{};
    const objs=(p.items||[]).map(s=>all.find(x=>x.slug===s)).filter(Boolean);
    const av=objs.slice(0,4).map(o=>{const s=thumbSrc(o);return s?'<img src="'+esc(s)+'" alt="'+esc(nm(o))+'" title="'+esc(nm(o))+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=window.__ph()">':'<span class="av" title="'+esc(nm(o))+'">'+ICON.leaf+'</span>';}).join('')+(objs.length>4?'<span class="more">+'+(objs.length-4)+'</span>':'');
    return '<article class="recipe"><div class="recipe-top"><span class="recipe-jar">'+jarIcon(v.shape)+'</span><span><span class="recipe-name">'+esc(nm(p)||p.name_ru)+'</span><span class="recipe-vol">'+(v.volume_liters_approx||'?')+' '+t('units.l')+' · '+enumT('system_type',p.system)+'</span></span></div><p class="recipe-desc">'+esc(lang==='ru'?p.desc_ru:(p.desc_en||p.desc_ru))+'</p><div class="recipe-foot"><span class="avatars">'+av+'</span><button class="recipe-go" data-recipe="'+esc(p.id)+'">'+t('build.apply')+'</button></div></article>';
  }).join('')+'</div><div style="margin-top:12px"><button class="btn ghost" data-act="random">'+ICON.dice+t('build.random')+'</button></div></div>';
}
function savedHTML(){
  const a=store.all();
  if(!a.length)return '<div class="empty"><div class="empty-orb"></div><h3>'+t('state.empty_saved_title')+'</h3><p class="sub">'+t('state.empty_saved_text')+'</p><button class="btn ghost" data-act="save">'+t('btn.save')+'</button></div>';
  return '<div class="section"><h3>'+t('saved.title')+' · '+a.length+'</h3><div class="saved-grid">'+a.map(b=>'<div class="saved-card"><h3>'+esc(b.name)+'</h3><div class="saved-meta">'+new Date(b.created).toLocaleDateString(lang==='ru'?'ru-RU':'en-US')+' · '+b.state.items.length+' '+t('units.pcs')+'</div><div class="saved-actions"><button class="btn primary" data-load="'+b.id+'">'+t('btn.load')+'</button><button class="btn ghost" data-del="'+b.id+'">'+t('btn.delete')+'</button></div></div>').join('')+'</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="export">'+t('btn.export')+'</button><label class="btn ghost"><span>'+t('btn.import')+'</span><input type="file" id="importFile" accept="application/json" hidden></label></div></div>';
}

/* ── catalog ── */
function renderCatalog(kind){
  const f=state.filters[kind],list=kind==='plants'?DB.plants:DB.fauna,groups=[...new Set(list.map(x=>x.group))];
  $('#'+kind+'Chips').innerHTML='<button class="chip'+(f.group==='all'?' on':'')+'" data-group="'+kind+':all">'+t('btn.show_all')+'</button>'+groups.map(g=>'<button class="chip'+(f.group===g?' on':'')+'" data-group="'+kind+':'+g+'">'+t('group.'+g)+'</button>').join('')+
    '<label class="pill-toggle'+(f.only?' on':'')+'"><input type="checkbox" id="only-'+kind+'"'+(f.only?' checked':'')+'><span>'+t('filter.only_compatible')+'</span></label>';
  renderGrid(kind);
}
function renderGrid(kind){
  const f=state.filters[kind],list=kind==='plants'?DB.plants:DB.fauna;
  let items=list.filter(o=>{if(f.group!=='all'&&o.group!==f.group)return false;if(f.q&&(`${o.name_ru} ${o.name_en||''} ${o.name_latin}`.toLowerCase().indexOf(f.q.toLowerCase())<0))return false;if(state.style&&o.styles&&!o.styles.includes(state.style))return false;return true;});
  const st=new Map();items.forEach(o=>st.set(o.id,itemStatus(o)));
  const total=items.length;if(f.only)items=items.filter(o=>st.get(o.id).level!=='block');
  const hidden=total-items.length;
  const co={easy:0,medium:1,expert:2},so={micro:0,mini:1,large:2};
  items.sort((a,b)=>f.sort==='care'?(co[a.care_level]||0)-(co[b.care_level]||0):f.sort==='size'?(so[a.size]||0)-(so[b.size]||0):nm(a).localeCompare(nm(b)));
  const rest=Math.max(0,items.length-f.shown),page=items.slice(0,f.shown);
  $('#'+kind+'Count').textContent=items.length+' '+(lang==='ru'?'из':'of')+' '+list.length+(state.style?' · '+t('styles.'+state.style+'.name'):'');
  const cards=page.map((o,i)=>{const s=st.get(o.id),added=s.level==='added',isP=o.id.indexOf('plant_')===0;
    const tags=isP?'<span class="tag light">'+enumT('light',o.light_optimum)+'</span><span class="tag care">'+enumT('care_level',o.care_level)+'</span><span class="tag size">'+enumT('size',o.size)+'</span>':'<span class="tag care">'+o.role.map(r=>enumT('fauna_role',r)).join(' · ')+'</span>';
    return '<article class="tile'+(s.level==='block'?' blocked':'')+'" data-open="'+o.id+'" tabindex="0" role="button" aria-label="'+esc(nm(o))+'" style="animation-delay:'+Math.min(i,10)*24+'ms"><div class="tile-photo">'+imgHTML(o)+'<span class="dot '+(added?'added':s.level)+'" title="'+esc(s.reason||'')+'"></span></div><div class="tile-body"><div class="tile-name">'+nm(o)+'</div><div class="tile-latin">'+o.name_latin+'</div><div class="tags">'+tags+'</div><button class="tile-add'+(added?' added':'')+'" data-add="'+o.id+'"'+(s.level==='block'?' disabled':'')+'>'+(added?t('btn.remove'):s.level==='block'?t('severity.block'):t('btn.add'))+'</button></div></article>';}).join('');
  const more=rest?'<div class="grid-note"><button class="btn ghost" data-more="'+kind+'">'+t('btn.show_more').replace('{n}',Math.min(PAGE,rest))+'</button></div>':'';
  const note=hidden?'<div class="grid-note"><span>'+t('filter.hidden').replace('{n}',hidden)+'</span><button class="link-btn" data-showhidden="'+kind+'">'+t('btn.show_all')+'</button></div>':'';
  const empty=items.length?'':'<div class="empty"><div class="empty-orb"></div><h3>'+t('state.empty_catalog_title')+'</h3><p class="sub">'+t('state.empty_catalog_text')+'</p><button class="btn ghost" data-reset="'+kind+'">'+t('btn.reset_filters')+'</button></div>';
  $('#'+kind+'Grid').innerHTML=cards+more+note+empty;sweepKeys($('#'+kind+'Grid'));
}

/* ── setup ── */
function renderSetup(){
  const v=state.vessel;
  const card=(title,icon,inner)=>'<div class="setup-card"><h3>'+icon+title+'</h3>'+inner+'</div>';
  const row=(label,inner,val)=>'<div class="row"><div class="row-label"><span>'+label+'</span>'+(val?'<span class="row-val">'+val+'</span>':'')+'</div>'+inner+'</div>';
  $('#setupBody').innerHTML=
    card(t('step.vessel'),ICON.build,
      row(t('step.vessel'),'<select class="select" style="width:100%" data-ctl="vessel">'+vesselOptions()+'</select>')+
      row(t('derived.volume'),'<input class="range" type="range" min="1" max="15" step="0.5" data-ctl="vol">','<b data-out="vol"></b>')+
      row(t('input.height'),'<input class="range" type="range" min="8" max="45" step="1" data-ctl="h">','<b data-out="h"></b>'))+
    card(t('input.system'),ICON.setup,
      row(t('input.system'),sysSeg())+row(t('input.experience'),expSeg())+
      [['grow','input.grow_light'],['winter','input.wintering'],['water','input.open_water']].map(x=>'<label class="toggle-row"><span>'+t(x[1])+'</span><span class="sw"><input type="checkbox" data-flag="'+x[0]+'"'+(state.flags[x[0]]?' checked':'')+'><i></i></span></label>').join(''))+
    card(t('input.placement'),ICON.care,
      row(t('input.placement'),'<select class="select" style="width:100%" data-ctl="place">'+placeOptions()+'</select>')+
      row(t('input.water'),'<select class="select" style="width:100%" data-ctl="water">'+waterOptions()+'</select>')+
      row(t('input.style'),'<select class="select" style="width:100%" data-ctl="style">'+styleOptions()+'</select>')+
      '<p class="sub" style="margin-top:9px">'+t('input.hint_placement')+'</p>')+
    card(t('step.hardscape'),ICON.plants,
      row(t('setup.stone'),'<select class="select" style="width:100%" id="stoneSelect"><option value="">'+t('setup.add')+'</option>'+DB.materials.stones.map(s=>'<option value="'+s.id+'">'+nm(s)+'</option>').join('')+'</select>')+
      row(t('setup.decor'),'<select class="select" style="width:100%" id="decorSelect"><option value="">'+t('setup.add')+'</option>'+DB.materials.decor.map(s=>'<option value="'+s.id+'">'+nm(s)+'</option>').join('')+'</select>')+
      '<div class="mat-chips">'+state.stones.map(id=>{const s=DB.materials.stones.find(x=>x.id===id);return s?'<button class="mat-chip" data-rm-stone="'+id+'">'+nm(s)+' ×</button>':'';}).join('')+state.decor.map(id=>{const s=DB.materials.decor.find(x=>x.id===id);return s?'<button class="mat-chip" data-rm-decor="'+id+'">'+nm(s)+' ×</button>':'';}).join('')+'</div>')+
    card(t('bom.substrate'),ICON.care,
      row(t('setup.substrate'),'<select class="select" style="width:100%" id="subSelect">'+DB.materials.substrates.map(s=>'<option value="'+s.id+'"'+(s.id===currentSub()?' selected':'')+'>'+nm(s)+'</option>').join('')+'</select>')+
      (subObj()?'<p class="sub">'+subObj().recipe.map(r=>Math.round(r.pct)+'% '+compName(r.component)).join(' · ')+'</p>':''));
  sweepKeys($('#setupBody'));
}

/* ── care ── */
function matchFilter(o,f){if(f.trim_interval_weeks_not_null)return o.trim_interval_weeks!=null;if(f.feeding)return o.feeding===f.feeding;if(f.starter_count_not_null)return o.starter_count!=null;return true;}
const lightKey=()=>D.corridors.light[0]||'bright_indirect';
function careVars(tpl,item){
  const P=selP(),N=DB.norms,sub=subObj(),names=a=>a.map(nm).join(', '),lk=lightKey();
  const v={stone_names:names(stones()),days:'3–5',components:sub?sub.recipe.map(r=>compName(r.component)).join(', '):'',lead_time_weeks:N.fauna_defaults.cleanup_crew_lead_time_weeks.join('–'),layer_order:(DB.materials.meta.layer_order||[]).map(x=>t('bom.'+x)).join(' → '),dose_ml:N.water.closed_calibration_dose_ml_per_3l.join('–'),recheck_hours:N.water.closed_calibration_recheck_hours,placement_label:enumT('placement',state.placement),photoperiod_h:N.light_norms.photoperiod_hours[lk].join('–'),distance_cm:N.light_norms.led_distance_cm.join('–'),boost_h:N.light_norms.winter_boost_hours,interval_weeks:currentSub()==='succulent_mineral'?N.water.open_succulent_interval_weeks.join('–'):N.water.open_tropical_interval_weeks.join('–'),tray_cm:'1–2',normal:t('norms.condensation.normal'),over_sign:t('norms.condensation.over_sign'),over_action:t('norms.condensation.over_action'),under_sign:t('norms.condensation.under_sign'),under_action:t('norms.condensation.under_action'),schedule:state.system==='closed'?t('norms.ventilation.closed_schedule'):t('norms.ventilation.semi_schedule'),months:t('norms.seasonal.wintering_months_default'),temp_c:'10–15',refresh_weeks:N.maintenance.litter_refresh_interval_weeks.join('–'),drainage_l:fmt(D.footprint*D.drainage/1000),substrate_l:fmt(D.footprint*D.depth/1000),charcoal_ml:Math.round(D.volume*15),substrate_name:sub?nm(sub):'',ppfd_range:N.light_norms.ppfd_umol_m2_s[lk].join('–'),species:names(P)};
  if(item){v.name=nm(item);v.species=nm(item);v.interval_weeks=item.trim_interval_weeks;v.mechanism=enumT('spread_mechanism',item.spread_mechanism||'none');v.interval_days=item.feeding_plan?item.feeding_plan.interval_days:7;v.items=item.feeding_plan?item.feeding_plan.items.map(x=>humanize(x)).join(', '):'';v.count_min=item.starter_count?item.starter_count.min:'';v.count_recommended=item.starter_count?item.starter_count.recommended:'';}
  return v;
}
function cond(c){
  if(!c||c.always)return true;const P=selP(),F=selF();
  return Object.keys(c).every(k=>{const val=c[k];switch(k){
    case 'system_in':return val.includes(state.system);
    case 'substrate_in':return val.includes(currentSub());
    case 'any_plant':return P.some(p=>Object.keys(val).every(f=>p[f]===val[f]));
    case 'any_plant_flag':return P.some(p=>p[val]);
    case 'any_plant_habitat':return P.some(p=>p.habitat.includes(val));
    case 'any_fauna':return F.some(x=>Object.keys(val).every(f=>x[f]===val[f]));
    case 'any_fauna_role':return F.some(x=>x.role.some(r=>val.includes(r)));
    case 'no_fauna_role':return !F.some(x=>x.role.some(r=>val.includes(r)));
    case 'input_flag':return val==='has_grow_light_false'?!state.flags.grow:!!state.flags[{has_open_water:'water',has_wintering:'winter',has_grow_light:'grow'}[val]];
    case 'input_is':return state[val.field]===val.value;
    case 'light_corridor_has':return D.corridors.light.includes(val);
    case 'stone_any':return stones().some(s=>Object.keys(val).every(f=>s[f]===val[f]));
    case 'stone_prep_has':return stones().some(s=>(s.prep||[]).includes(val));
    case 'decor_any':return decor().some(d=>Object.keys(val).every(f=>d[f]===val[f]));
    default:return true;}});
}
function careBlocks(){const P=selP(),F=selF(),out=[];DB.care_templates.templates.forEach(tpl=>{if(tpl.foreach){(tpl.foreach==='plants'?P:F).filter(o=>!tpl.filter||matchFilter(o,tpl.filter)).forEach(o=>out.push({tpl,vars:careVars(tpl,o)}));}else if(cond(tpl.when))out.push({tpl,vars:careVars(tpl)});});return out;}
function renderCare(){
  const preset=DB.vessels.presets.find(v=>v.id===state.vessel.preset);
  $('#careSub').textContent=(preset?nm(preset):t('vessel.custom'))+' · '+enumT('system_type',state.system)+' · '+fmt(D.volume)+' '+t('units.l');
  $('#careSubtabs').innerHTML=[['sheet',t('care.sheet')],['diag',t('nav.diag')]].map(x=>'<button data-ctab="'+x[0]+'" class="'+(state.careTab===x[0]?'on':'')+'" role="tab" aria-selected="'+(state.careTab===x[0])+'">'+x[1]+'</button>').join('');
  const body=$('#careBody');
  if(state.careTab==='diag'){
    body.innerHTML=DB.diagnostics.symptoms.map(s=>{const cs=s.causes.map(c=>Object.assign({},c,{score:c.base_weight+c.boosts.reduce((a,b)=>a+(cond(b.when)?b.add:0),0)})).sort((a,b)=>b.score-a.score).slice(0,3);
      return '<div class="diag-item"><button class="diag-q" data-diag="'+s.id+'"><span>'+t('diag.'+s.id+'.name')+'</span>'+ICON.chev+'</button><div class="diag-a">'+cs.map(c=>'<div class="cause"><div class="cause-title">'+t(c.cause_key)+'</div><div class="cause-fix">'+t(c.fix_key)+'</div><div class="cause-prev">'+t(c.prevention_key)+'</div></div>').join('')+'</div></div>';}).join('');
    sweepKeys(body);return;
  }
  const blocks=careBlocks();
  const toolbar='<div class="care-toolbar"><button class="btn primary" id="dlCareBtn">'+t('btn.download_care')+'</button><button class="btn ghost" id="printCareBtn">'+t('btn.print')+'</button></div>';
  const cards=DB.care_templates.sections.map(sec=>{const bs=blocks.filter(b=>b.tpl.section===sec.id);return bs.length?'<div class="care-card"><h3>'+t('care.section.'+sec.id)+'</h3>'+bs.map(b=>'<div class="care-item">'+t(b.tpl.text_key,b.vars)+'<span class="why">'+esc(sourceLabel(b.tpl.source))+'</span></div>').join('')+'</div>':'';}).join('');
  body.innerHTML='<div class="care-grid">'+toolbar+(cards||'<div class="empty"><div class="empty-orb"></div><h3>'+t('state.empty_care_title')+'</h3><p class="sub">'+t('state.empty_care_text')+'</p><button class="btn ghost" data-go="plants">'+t('state.empty_action')+'</button></div>')+'</div>';
  sweepKeys(body);
}
function careText(){
  const P=selP(),F=selF(),preset=DB.vessels.presets.find(v=>v.id===state.vessel.preset),sub=subObj(),out=[];
  out.push(t('app.title'));
  out.push((preset?nm(preset):t('vessel.custom'))+' · '+fmt(D.volume)+' '+t('units.l')+' · '+enumT('system_type',state.system));
  out.push(t('input.placement')+': '+enumT('placement',state.placement)+'  |  '+t('input.water')+': '+enumT('water_type',state.water));
  out.push(t('bom.substrate')+': '+(sub?nm(sub):'—'));
  const hs=stones().concat(decor()).map(nm);if(hs.length)out.push(t('step.hardscape')+': '+hs.join(', '));
  out.push('');out.push(t('step.plants')+':');P.forEach(p=>out.push('  - '+nm(p)+' ('+p.name_latin+')'));
  if(F.length){out.push('');out.push(t('step.fauna')+':');F.forEach(f=>out.push('  - '+nm(f)+' ('+f.name_latin+')'));}
  const blocks=careBlocks();
  DB.care_templates.sections.forEach(sec=>{const bs=blocks.filter(b=>b.tpl.section===sec.id);if(!bs.length)return;out.push('');out.push('--- '+t('care.section.'+sec.id).toUpperCase()+' ---');bs.forEach(b=>out.push('* '+t(b.tpl.text_key,b.vars)));});
  out.push('');out.push(new Date().toLocaleDateString(lang==='ru'?'ru-RU':'en-US')+' · '+t('care.generated'));
  return out.join('\n');
}
function downloadCare(){const b=new Blob([careText()],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='florarium-care-'+Date.now()+'.txt';a.click();URL.revokeObjectURL(a.href);toast(t('toast.care_downloaded'));}
function printCare(){if(state.tab!=='care'){state.tab='care';state.careTab='sheet';render();}setTimeout(()=>window.print(),180);}

/* ── rail ── */
function renderRail(hits){
  const st=$('#railStatus'),rb=$('#railBody');if(!st||!rb)return;
  const bl=hits.filter(h=>h.sev==='block').length,wa=hits.filter(h=>h.sev==='warning').length,first=hits.find(h=>h.sev===(bl?'block':'warning'));
  st.innerHTML='<div class="rail-head"><span class="rail-orb '+(bl?'block':wa?'warn':'ok')+'"></span><span><span class="rail-title">'+(bl?t('compat.blocks_title'):wa?t('compat.warnings_title'):t('compat.all_good'))+'</span><span class="rail-note">'+fmt(D.volume)+' '+t('units.l')+' · '+selP().length+'+'+selF().length+'</span></span></div>';
  rb.innerHTML='<div class="rail-list">'+(state.items.map((it,i)=>{const o=obj(it);return o?'<div class="rail-row">'+imgHTML(o)+'<span>'+nm(o)+'</span><button class="sel-x" data-rm="'+i+'" aria-label="'+t('btn.remove')+'">'+ICON.x+'</button></div>':'';}).join('')||'<p class="sub">'+t('state.empty_body')+'</p>')+'</div>'+
    (first?'<div class="issue '+(bl?'block':'warning')+'"><div class="issue-head">'+(bl?bl+' '+t('severity.block').toLowerCase():wa+' '+t('severity.warning').toLowerCase())+'</div><div class="issue-remedy">'+t('rules.'+first.id+'.msg',first.vars)+'</div></div>':'')+
    '<div class="rail-actions"><button class="btn primary wide" data-go="build">'+t('rail.open')+'</button><button class="btn ghost" data-act="save">'+t('btn.save')+'</button><button class="btn ghost" data-act="share">'+t('btn.copy_link')+'</button></div>';
  sweepKeys(st);sweepKeys(rb);
}

/* ── sheet / modal / toast ── */
function similar(o){
  const pool=(o.id.indexOf('plant_')===0?DB.plants:DB.fauna).filter(x=>x.id!==o.id);
  const sc=x=>{let s=0;if(x.group===o.group)s+=2;if((x.layer_form||[]).some(l=>(o.layer_form||[]).includes(l)))s+=2;if(x.care_level&&x.care_level===o.care_level)s+=1;if(x.size&&x.size===o.size)s+=1;if((x.system_type||[]).some(y=>(o.system_type||[]).includes(y)))s+=1;return s;};
  return pool.map(x=>({x,s:sc(x)})).filter(v=>v.s>=3).sort((a,b)=>b.s-a.s).slice(0,3).map(v=>v.x);
}
function openSheet(o){
  const im=o.image||{},note=raw('notes.'+o.id),kv=(l,v)=>v?'<dt>'+l+'</dt><dd>'+v+'</dd>':'',sim=similar(o);
  $('#sheetBody').innerHTML=imgHTML(o,'sheet-photo')+'<h2 id="sheetTitle">'+nm(o)+'</h2><div class="latin">'+o.name_latin+'</div><div class="tags"><span class="tag care">'+t('group.'+o.group)+'</span>'+(o.size?'<span class="tag size">'+enumT('size',o.size)+'</span>':'')+(o.care_level?'<span class="tag light">'+enumT('care_level',o.care_level)+'</span>':'')+'</div>'+(note?'<div class="sheet-note">'+note+'</div>':'')+
    '<dl class="kv">'+kv(t('input.system'),(o.system_type||[]).map(x=>enumT('system_type',x)).join(', '))+kv(FL.light[lang],(o.light||[]).map(x=>enumT('light',x)).join(', '))+kv(FL.air_humidity[lang],(o.air_humidity||[]).map(x=>enumT('air_humidity',x)).join(', '))+kv(FL.soil_humidity[lang],(o.soil_humidity||[]).map(x=>enumT('soil_humidity',x)).join(', '))+kv(FL.temperature[lang],(o.temperature||[]).map(x=>enumT('temperature',x)).join(', '))+(o.role?kv(t('step.fauna'),o.role.map(x=>enumT('fauna_role',x)).join(', ')):'')+'</dl>'+
    '<div class="sheet-links"><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q='+encodeURIComponent(o.name_latin)+'">'+t('caption.search_google')+'</a><a class="btn ghost" target="_blank" rel="noopener" href="https://yandex.ru/images/search?text='+encodeURIComponent(o.name_latin)+'">'+t('caption.search_yandex')+'</a></div>'+
    '<div class="credit">'+(im.attribution||(im.author?t('caption.credit',{author:im.author,license:im.license})+' · <a href="'+im.source_url+'" target="_blank" rel="noopener">'+t('caption.source')+'</a>':t('caption.illustration')))+'</div>'+
    '<button class="btn primary" style="width:100%;margin-top:16px" data-add="'+o.id+'">'+(state.items.some(i=>i.id===o.id)?t('btn.remove'):t('btn.add'))+'</button>'+
    (sim.length?'<div class="similar"><h3>'+t('similar.title')+'</h3><div class="sim-row">'+sim.map(x=>'<button class="sim" data-similar="'+x.id+'">'+imgHTML(x)+'<span>'+nm(x)+'</span></button>').join('')+'</div></div>':'');
  $('#sheet').classList.remove('hidden');$('#scrim').classList.remove('hidden');$('#sheet').scrollTop=0;sweepKeys($('#sheetBody'));
}
function closeAll(){['sheet','saveModal','aiModal'].forEach(id=>$('#'+id).classList.add('hidden'));$('#scrim').classList.add('hidden');}
function openModal(id){$('#'+id).classList.remove('hidden');$('#scrim').classList.remove('hidden');}
function toast(msg,undo,img){
  const el=document.createElement('div');el.className='toast';
  el.innerHTML=(img?'<img src="'+esc(img)+'" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML=window.__ph()">':'')+'<span>'+esc(msg)+'</span>'+(undo?'<button type="button">'+(lang==='ru'?'Вернуть':'Undo')+'</button>':'');
  $('#toasts').append(el);
  if(undo)el.querySelector('button').onclick=()=>{undo();el.remove();};
  setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(10px)';setTimeout(()=>el.remove(),250);},undo?7000:3200);
}
function aiPrompt(){
  const P=selP(),F=selF(),pl=p=>t('ai.plant_line',{name_ru:p.name_ru,latin:p.name_latin,layer:p.layer_form.map(x=>enumT('layer_form',x)).join('/'),growth:enumT('growth_rate',p.growth_rate),air:p.air_humidity.map(x=>enumT('air_humidity',x)).join('/'),cond:enumT('condensation',p.condensation)}),fa=f=>t('ai.fauna_line',{name_ru:f.name_ru,role:f.role.map(x=>enumT('fauna_role',x)).join('/'),interest:enumT('plant_interest',f.plant_interest)});
  let s=t('ai.prompt',{volume:fmt(D.volume),system:enumT('system_type',state.system),shape:enumT('vessel_shape',state.vessel.shape),placement:enumT('placement',state.placement),water:enumT('water_type',state.water),substrate:subObj()?nm(subObj()):'—',hardscape:stones().concat(decor()).map(nm).join(', ')||'—',plants:P.map(pl).join('\n')||'—',fauna:F.map(fa).join('\n')||'—'});
  return s.length>2000?s.slice(0,1997)+'…':s;
}
async function copyText(s){try{await navigator.clipboard.writeText(s);return true;}catch(e){const ta=document.createElement('textarea');ta.value=s;document.body.append(ta);ta.select();try{document.execCommand('copy');}catch(x){}ta.remove();return true;}}
async function shareBuild(){const q=encodeState().toString();await copyText(location.origin+location.pathname+'?'+q);history.replaceState(null,'','?'+q);toast(t('toast.link_copied'));}

/* ── mutations ── */
function addItem(id){
  const o=DB.plants.concat(DB.fauna).find(x=>x.id===id);if(!o)return;
  const i=state.items.findIndex(x=>x.id===id);
  if(i>=0){removeItem(i);return;}
  state.items.push({kind:o.id.indexOf('plant_')===0?'plant':'fauna',id});render();
  const node=document.querySelector('[data-open="'+id+'"]');if(node){node.classList.add('pop');setTimeout(()=>node.classList.remove('pop'),360);}
  toast(nm(o)+' ✓',null,thumbSrc(o));
}
function removeItem(i){const it=state.items[i],o=obj(it);state.items.splice(i,1);state.sel=state.sel.filter(x=>x!==(o&&o.id));render();toast(nm(o)+' — '+t('btn.remove').toLowerCase(),()=>{state.items.splice(i,0,it);render();},thumbSrc(o));}
function bulkDelete(){
  const removed=state.items.map((it,i)=>({it,i,o:obj(it)})).filter(x=>x.o&&state.sel.includes(x.o.id));
  if(!removed.length)return;
  state.items=state.items.filter(it=>{const o=obj(it);return !(o&&state.sel.includes(o.id));});
  const n=removed.length;state.sel=[];render();
  toast(t('toast.bulk_deleted').replace('{n}',n),()=>{removed.forEach(x=>state.items.splice(Math.min(x.i,state.items.length),0,x.it));render();});
}
function moveItem(i,dir){const j=i+dir;if(j<0||j>=state.items.length)return;const [it]=state.items.splice(i,1);state.items.splice(j,0,it);render();}
function resetConditions(){
  const p=DB.vessels.presets.find(x=>x.id==='vessel_jar_3l');if(p)applyVesselPreset(p);
  state.system='closed';state.placement='east_west';state.water='soft';state.experience='beginner';state.style='tropical_jungle';state.flags={grow:false,winter:false,water:false};
  state.filters.plants.shown=PAGE;state.filters.fauna.shown=PAGE;
  buildStatic();render();toast(t('dock.reset'));
}
function snapshot(){const s=state;return JSON.parse(JSON.stringify({items:s.items,stones:s.stones,decor:s.decor,substrate:s.substrate,vessel:s.vessel,system:s.system,placement:s.placement,water:s.water,experience:s.experience,style:s.style,flags:s.flags}));}
function applyPreset(p){
  const prev=snapshot(),all=DB.plants.concat(DB.fauna);
  state.items=(p.items||[]).map(s=>{const o=all.find(x=>x.slug===s);return o?{kind:o.id.indexOf('plant_')===0?'plant':'fauna',id:o.id}:null;}).filter(Boolean);
  state.stones=(p.stones||[]).slice();state.decor=(p.decor||[]).slice();state.substrate=p.substrate||null;
  state.placement=p.placement;state.water=p.water;state.experience=p.experience;state.style=p.style||'';
  state.flags=Object.assign({grow:false,winter:false,water:false},p.flags);state.sel=[];
  const pr=(DB.vessels.presets||[]).find(v=>v.id===p.vessel);if(pr)applyVesselPreset(pr);
  state.system=p.system;state.tab='build';state.buildTab='composition';
  buildStatic();render();
  toast(t('build.applied').replace('{n}',nm(p)||p.name_ru),()=>{Object.assign(state,prev);state.sel=[];buildStatic();render();});
}
function randomRecipe(){if(PRESETS.length)applyPreset(PRESETS[Math.floor(Math.random()*PRESETS.length)]);}

/* ── events ── */
document.addEventListener('click',async e=>{
  const act=e.target.closest('[data-act]');
  if(act){const a=act.dataset.act;
    if(a==='reset')resetConditions();
    else if(a==='random')randomRecipe();
    else if(a==='share')await shareBuild();
    else if(a==='save'){$('#saveName').value='';openModal('saveModal');}
    else if(a==='ai'){$('#aiPrompt').value=aiPrompt();$('#aiTargets').innerHTML='<button class="ai-target" data-ai="google">'+t('ai.target_google')+'</button><button class="ai-target" data-ai="perplexity">'+t('ai.target_perplexity')+'</button>';openModal('aiModal');}
    else if(a==='selall'){state.sel=state.items.map(obj).filter(Boolean).map(o=>o.id);render();}
    else if(a==='selclear'){state.sel=[];render();}
    else if(a==='seldel')bulkDelete();
    else if(a==='export'){const b=new Blob([JSON.stringify(store.all(),null,2)],{type:'application/json'}),x=document.createElement('a');x.href=URL.createObjectURL(b);x.download='florarium-builds.json';x.click();URL.revokeObjectURL(x.href);}
    return;}
  const step=e.target.closest('[data-step]');
  if(step){const[k,d]=step.dataset.step.split(':');
    if(k==='h')state.vessel.height=Math.min(45,Math.max(8,state.vessel.height+ +d));
    else{const target=Math.min(15,Math.max(1,D.volume+ +d));state.vessel.height=Math.min(45,Math.max(8,Math.round(state.vessel.height*(target/(D.volume||1)))));}
    state.vessel.preset='custom';render();return;}
  const fc=e.target.closest('[data-flagchip]');if(fc){const k=fc.dataset.flagchip;state.flags[k]=!state.flags[k];render();return;}
  const mv=e.target.closest('[data-move]');if(mv){const[i,d]=mv.dataset.move.split(':');moveItem(+i,+d);return;}
  const sim=e.target.closest('[data-similar]');if(sim){const o=DB.plants.concat(DB.fauna).find(x=>x.id===sim.dataset.similar);if(o)openSheet(o);return;}
  const more=e.target.closest('[data-more]');if(more){const k=more.dataset.more;state.filters[k].shown+=PAGE;renderGrid(k);return;}
  const nav=e.target.closest('[data-go]');if(nav){e.preventDefault();go(nav.dataset.go);return;}
  const add=e.target.closest('[data-add]');if(add){addItem(add.dataset.add);if(!$('#sheet').classList.contains('hidden'))closeAll();return;}
  const open=e.target.closest('[data-open]');if(open&&!e.target.closest('button')&&!e.target.closest('input')){const o=DB.plants.concat(DB.fauna).find(x=>x.id===open.dataset.open);if(o)openSheet(o);return;}
  const rm=e.target.closest('[data-rm]');if(rm){removeItem(+rm.dataset.rm);return;}
  const bt=e.target.closest('[data-btab]');if(bt){state.buildTab=bt.dataset.btab;render();return;}
  const ct=e.target.closest('[data-ctab]');if(ct){state.careTab=ct.dataset.ctab;render();return;}
  const gr=e.target.closest('[data-group]');if(gr){const[k,g]=gr.dataset.group.split(':');state.filters[k].group=g;state.filters[k].shown=PAGE;renderCatalog(k);return;}
  const sh=e.target.closest('[data-showhidden]');if(sh){const k=sh.dataset.showhidden;state.filters[k].only=false;state.filters[k].shown=PAGE;saveFilters();renderCatalog(k);return;}
  const rs=e.target.closest('[data-reset]');if(rs){const k=rs.dataset.reset;state.filters[k]={group:'all',q:'',sort:'name',only:false,shown:PAGE};const q=$('#q-'+k);if(q)q.value='';saveFilters();renderCatalog(k);return;}
  const sys=e.target.closest('[data-sys]');if(sys){state.system=sys.dataset.sys;render();return;}
  const exp=e.target.closest('[data-exp]');if(exp){state.experience=exp.dataset.exp;render();return;}
  const rstone=e.target.closest('[data-rm-stone]');if(rstone){state.stones=state.stones.filter(x=>x!==rstone.dataset.rmStone);render();return;}
  const rdecor=e.target.closest('[data-rm-decor]');if(rdecor){state.decor=state.decor.filter(x=>x!==rdecor.dataset.rmDecor);render();return;}
  const rec=e.target.closest('[data-recipe]');if(rec){const p=PRESETS.find(x=>x.id===rec.dataset.recipe);if(p)applyPreset(p);return;}
  if(e.target.closest('#themeBtn')){const n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';try{localStorage.setItem('flor.theme',n);}catch(x){}applyTheme(n);return;}
  if(e.target.closest('#langBtn')){lang=lang==='ru'?'en':'ru';try{localStorage.setItem('flor.lang',lang);}catch(x){}buildStatic();render();return;}
  if(e.target.closest('#careBtn')){state.tab='care';state.careTab='sheet';render();window.scrollTo({top:0,behavior:'smooth'});return;}
  if(e.target.closest('#dlCareBtn')){downloadCare();return;}
  if(e.target.closest('#printCareBtn')){printCare();return;}
  if(e.target.closest('#saveConfirm')){store.save($('#saveName').value.trim()||t('saved.name_placeholder'));closeAll();toast(t('toast.saved'));render();return;}
  if(e.target.closest('#aiCopy')){await copyText($('#aiPrompt').value);toast(t('toast.ai_copied'));return;}
  const at=e.target.closest('[data-ai]');if(at){const s=$('#aiPrompt').value;await copyText(s);window.open(at.dataset.ai==='google'?'https://www.google.com/search?udm=50&q='+encodeURIComponent(s):'https://www.perplexity.ai/?q='+encodeURIComponent(s),'_blank','noopener');toast(t('toast.ai_copied'));return;}
  const dg=e.target.closest('[data-diag]');if(dg){dg.closest('.diag-item').classList.toggle('open');return;}
  const ld=e.target.closest('[data-load]');if(ld){store.load(ld.dataset.load);return;}
  const dl=e.target.closest('[data-del]');if(dl){const id=+dl.dataset.del,b=store.all().find(x=>x.id===id);store.del(id);render();toast(t('toast.deleted'),()=>{if(b){const a=store.all();a.push(b);localStorage.setItem('florarium.builds.v1',JSON.stringify(a));render();}});return;}
  if(e.target.closest('[data-close]')){closeAll();return;}
  if(e.target.closest('#sheetClose')||e.target.id==='scrim'){closeAll();return;}
});
document.addEventListener('input',e=>{
  const id=e.target.id,ctl=e.target.dataset.ctl;
  if(id==='q-plants'||id==='q-fauna'){const k=id.slice(2);state.filters[k].q=e.target.value;state.filters[k].shown=PAGE;renderGrid(k);return;}
  if(ctl==='vol'){const target=+e.target.value;state.vessel.height=Math.min(45,Math.max(8,Math.round(state.vessel.height*(target/(D.volume||1)))));state.vessel.preset='custom';render({skipSetup:true});return;}
  if(ctl==='h'){state.vessel.height=+e.target.value;state.vessel.preset='custom';render({skipSetup:true});return;}
});
document.addEventListener('change',e=>{
  const id=e.target.id,ctl=e.target.dataset.ctl;
  if(ctl==='vessel'){const p=DB.vessels.presets.find(x=>x.id===e.target.value);if(p)applyVesselPreset(p);render();return;}
  if(ctl==='place'){state.placement=e.target.value;render();return;}
  if(ctl==='water'){state.water=e.target.value;render();return;}
  if(ctl==='style'){state.style=e.target.value;state.filters.plants.group='all';state.filters.fauna.group='all';state.filters.plants.shown=PAGE;state.filters.fauna.shown=PAGE;render();return;}
  if(e.target.dataset.sel){const sid=e.target.dataset.sel;state.sel=e.target.checked?state.sel.concat([sid]):state.sel.filter(x=>x!==sid);render();return;}
  if(id==='subSelect'){state.substrate=e.target.value;render();return;}
  if(id==='stoneSelect'&&e.target.value){if(!state.stones.includes(e.target.value))state.stones.push(e.target.value);render();return;}
  if(id==='decorSelect'&&e.target.value){if(!state.decor.includes(e.target.value))state.decor.push(e.target.value);render();return;}
  if(id==='sort-plants'||id==='sort-fauna'){const k=id.slice(5);state.filters[k].sort=e.target.value;state.filters[k].shown=PAGE;renderGrid(k);return;}
  if(id==='only-plants'||id==='only-fauna'){const k=id.slice(5);state.filters[k].only=e.target.checked;state.filters[k].shown=PAGE;saveFilters();renderCatalog(k);return;}
  if(e.target.dataset.flag){state.flags[e.target.dataset.flag]=e.target.checked;render();return;}
  if(id==='importFile'){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const a=JSON.parse(r.result);if(Array.isArray(a)){localStorage.setItem('florarium.builds.v1',JSON.stringify(a));render();toast(t('toast.imported'));}}catch(x){toast(t('toast.import_error'));}};r.readAsText(f);return;}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeAll();return;}
  const tile=e.target.closest&&e.target.closest('.tile');if(!tile)return;
  const grid=tile.parentElement,tiles=[...grid.querySelectorAll('.tile')],i=tiles.indexOf(tile);
  if(e.key==='Enter'){e.preventDefault();const o=DB.plants.concat(DB.fauna).find(x=>x.id===tile.dataset.open);if(o)openSheet(o);return;}
  if(e.key===' '){e.preventDefault();addItem(tile.dataset.open);const n=document.querySelector('[data-open="'+tile.dataset.open+'"]');if(n)n.focus();return;}
  if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)){
    e.preventDefault();
    const cols=Math.max(1,getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
    const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:e.key==='ArrowDown'?cols:-cols;
    const n=tiles[Math.min(tiles.length-1,Math.max(0,i+d))];if(n)n.focus();
  }
});
document.addEventListener('dragstart',e=>{const r=e.target.closest('.sel-row');if(r){dragIdx=+r.dataset.idx;r.classList.add('dragging');}});
document.addEventListener('dragend',e=>{const r=e.target.closest('.sel-row');if(r)r.classList.remove('dragging');});
document.addEventListener('dragover',e=>{if(e.target.closest('.sel-row'))e.preventDefault();});
document.addEventListener('drop',e=>{const r=e.target.closest('.sel-row');if(r&&dragIdx!=null){const to=+r.dataset.idx,it=state.items.splice(dragIdx,1)[0];state.items.splice(to,0,it);dragIdx=null;render();}});
window.__fc={get state(){return state;},get D(){return D;},get DB(){return DB;},t:t};
boot();
