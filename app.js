/* ═══ FLORARIUM COMBINATOR ═══ */
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DATA=['criteria','styles','materials','plants_fauna','norms','vessels','care_templates','diagnostics'];
const NS=['ui','rules','care','diag','catalog'];
const DB={}, I18N={ru:{},en:{}};
let lang=localStorage.getItem('flor.lang')||'ru';
let D=null; // derived
const state={
  view:'builder',
  vessel:{preset:'vessel_jar_3l',shape:'jar',diameter:14,height:20,width:20,depth:20,neck:null,closure:'sealable',volumeLabel:null},
  system:'closed',placement:'east_west',water:'soft',experience:'beginner',style:'tropical_jungle',
  flags:{grow:false,winter:false,water:false},
  items:[],stones:[],decor:[],substrate:null,
  filters:{tab:'plants',group:'all',q:'',sort:'name'}
};
let undoBuf=null;

/* ── load ── */
async function j(u){const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(u);return r.json()}
async function boot(){
  try{
    const arr=await Promise.all(DATA.map(n=>j(`data/${n}.json`)));
    DATA.forEach((n,i)=>DB[n]=arr[i]);
    for(const l of ['ru','en']){
      const files=await Promise.all(NS.map(n=>j(`i18n/${l}/${n}.json`)));
      NS.forEach((n,i)=>{const c={...files[i]};delete c.meta;
        if(n==='care'||n==='diag')I18N[l][n]=c;else Object.assign(I18N[l],c);});
    }
    DB.plants=DB.plants_fauna.plants;DB.fauna=DB.plants_fauna.fauna;
    restoreURL(); if(!state.items.length)seed();
    $('#boot').classList.add('hidden');$('#view-builder').classList.remove('hidden');
    buildStatic();update();
  }catch(e){console.error(e);$('#boot').classList.add('hidden');$('#bootError').classList.remove('hidden')}
}
function t(path,vars={}){
  let s=path.split('.').reduce((o,k)=>o?.[k],I18N[lang])??path.split('.').reduce((o,k)=>o?.[k],I18N.en)??path;
  return String(s).replace(/\{(\w+)\}/g,(_,k)=>vars[k]??`{${k}}`);
}
const nm=o=>lang==='ru'?o.name_ru:o.name_en;
const fmt=n=>Number(n).toLocaleString(lang==='ru'?'ru-RU':'en-US',{maximumFractionDigits:1});
const enumT=(e,v)=>t(`enum.${e}.${v}`);

/* ── seed / url / persist ── */
function seed(){
  state.items=[{kind:'plant',id:'plant_fittonia'},{kind:'plant',id:'plant_leucobryum_glaucum'},{kind:'plant',id:'plant_soleirolia_soleirolii'},{kind:'fauna',id:'fauna_collembola'}];
  state.stones=['ohko'];state.decor=['driftwood'];state.substrate='tropical';
}
function encodeState(){
  const v=state.vessel,p=new URLSearchParams();
  p.set('v','13');p.set('sys',state.system);p.set('place',state.placement);p.set('water',state.water);p.set('exp',state.experience);
  if(state.style)p.set('style',state.style);
  p.set('shape',v.shape);p.set('vol',D?.volume?.toFixed(1)||'');p.set('h',v.height);p.set('d',v.diameter||'');p.set('w',v.width||'');p.set('dp',v.depth||'');
  p.set('items',state.items.map(i=>obj(i)?.slug).filter(Boolean).join(','));
  p.set('stones',state.stones.join(','));p.set('decor',state.decor.join(','));if(state.substrate)p.set('sub',state.substrate);
  p.set('fl',[state.flags.grow,state.flags.winter,state.flags.water].map(b=>b?1:0).join(''));
  return p;
}
function restoreURL(){
  const p=new URLSearchParams(location.search);if(!p.has('sys'))return;
  state.system=p.get('sys');state.placement=p.get('place')||'east_west';state.water=p.get('water')||'soft';state.experience=p.get('exp')||'beginner';state.style=p.get('style')||'';
  const v=state.vessel;v.shape=p.get('shape')||'jar';v.height=+p.get('h')||20;v.diameter=+p.get('d')||14;v.width=+p.get('w')||20;v.depth=+p.get('dp')||20;
  const all=[...DB.plants,...DB.fauna];
  state.items=(p.get('items')||'').split(',').filter(Boolean).map(s=>{const o=all.find(x=>x.slug===s);return o?{kind:o.id.startsWith('plant_')?'plant':'fauna',id:o.id}:null}).filter(Boolean);
  state.stones=(p.get('stones')||'').split(',').filter(Boolean);state.decor=(p.get('decor')||'').split(',').filter(Boolean);state.substrate=p.get('sub')||null;
  const fl=p.get('fl')||'000';state.flags={grow:fl[0]==='1',winter:fl[1]==='1',water:fl[2]==='1'};
}
const store={
  all:()=>JSON.parse(localStorage.getItem('florarium.builds.v1')||'[]'),
  save(name){const a=store.all();a.unshift({id:Date.now(),name,created:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))});localStorage.setItem('florarium.builds.v1',JSON.stringify(a));},
  del(id){localStorage.setItem('florarium.builds.v1',JSON.stringify(store.all().filter(x=>x.id!==id)))},
  load(id){const b=store.all().find(x=>x.id===id);if(b){Object.assign(state,JSON.parse(JSON.stringify(b.state)));update();toast(t('toast.saved'))}}
};

/* ── helpers ── */
function obj(i){return (i.kind==='plant'?DB.plants:DB.fauna).find(x=>x.id===i.id)}
const selP=()=>state.items.filter(i=>i.kind==='plant').map(obj).filter(Boolean);
const selF=()=>state.items.filter(i=>i.kind==='fauna').map(obj).filter(Boolean);
const stones=()=>state.stones.map(id=>DB.materials.stones.find(s=>s.id===id)).filter(Boolean);
const decor=()=>state.decor.map(id=>DB.materials.decor.find(s=>s.id===id)).filter(Boolean);
const inter=arrs=>arrs.length?arrs.reduce((a,b)=>a.filter(x=>b.includes(x)),[...arrs[0]]):[];
function habit(p){const l=p.layer_form;if(l.length===1&&l[0]==='mount')return 'mount';if(l.some(x=>x==='bush'||x==='accent'))return 'upright';if(l.includes('vine'))return 'trailing';return 'groundcover'}
function currentSub(){
  if(state.substrate)return state.substrate;
  const c=inter([...selP(),...selF()].map(x=>x.substrate));return c[0]||'tropical';
}
function subObj(){return DB.materials.substrates.find(s=>s.id===currentSub())}

/* ── derived ── */
function derive(){
  const v=state.vessel,N=DB.norms,pi=Math.PI;
  let vol,foot;
  const d=v.diameter,h=v.height,w=v.width,dp=v.depth;
  switch(v.shape){
    case 'bowl':vol=pi*(d/2)**2*h*.65;foot=pi*(d/2)**2*.8;break;
    case 'sphere':vol=4/3*pi*(d/2)**3*.85;foot=pi*(d/2)**2*.6;break;
    case 'bottle':vol=v.volumeLabel?v.volumeLabel*1000:pi*(d/2)**2*h*.7;foot=pi*(d/2)**2*.8;break;
    case 'geo_house':vol=w*dp*h*.9;foot=w*dp;break;
    case 'cube':case 'tank':vol=w*dp*h;foot=w*dp;break;
    default:vol=pi*(d/2)**2*h;foot=pi*(d/2)**2;
  }
  vol/=1000;
  const drain=Math.min(N.layers.drainage.max_cm,Math.max(N.layers.drainage.min_cm,h*.2));
  const sub=subObj(),depth=sub?sub.depth_cm[0]:5;
  const free=Math.max(0,h-drain-.3-depth-2.5);
  const P=selP(),F=selF(),all=[...P,...F];
  const fields=['air_humidity','soil_humidity','substrate','light','temperature'];
  const corridors={};fields.forEach(f=>corridors[f]=all.length?inter(all.map(x=>x[f])):[]);
  const place=N.placement_map[state.placement]||{light:['bright_indirect']};
  const lightAvail=place.light;
  const ph=inter([...P.map(x=>x.ph_tolerance),sub?[sub.ph_zones]:[],...stones().map(s=>s.ph_zones),state.water==='tap_hard'?[['slightly_acid','neutral','alkaline']]:[]].filter(Boolean));
  const buckets={upright_trailing:{used:0,limit:foot*.8},groundcover:{used:0,limit:foot*.9},mount:{used:0,limit:Infinity}};
  P.forEach(p=>{const hb=habit(p);const area=(N.planting.footprint_cm2_per_size[p.size]||100)*(p.growth_rate==='aggressive'?2:1);
    if(hb==='mount')buckets.mount.used++;else if(hb==='groundcover')buckets.groundcover.used+=area;else buckets.upright_trailing.used+=area;});
  const subCands=all.length?inter(all.map(x=>x.substrate)):DB.materials.substrates.map(s=>s.id);
  return {volume:vol,footprint:foot,freeHeight:free,drainage:drain,depth,corridors,lightAvail,ph,buckets,subCands,place};
}

/* ── rules engine ── */
function evaluate(){
  const P=selP(),F=selF(),S=stones(),DC=decor(),hits=[];
  const add=(id,sev,vars={})=>hits.push({id,sev,vars});
  const sys=state.system,vol=D.volume;
  // vessel
  const preset=DB.vessels.presets.find(x=>x.id===state.vessel.preset);
  const allowed=preset?preset.systems:(state.vessel.closure==='sealable'?['closed','semi','open']:state.vessel.closure==='vented'?['semi','open']:['open']);
  if(!allowed.includes(sys))add('r_vessel_closure','block',{shape:enumT('vessel_shape',state.vessel.shape)});
  if((state.vessel.neck&&state.vessel.neck<8)||['bottle','sphere'].includes(state.vessel.shape))add('r_narrow_neck','warning');
  if(state.placement==='south_direct'&&sys==='closed')add('r_closed_direct_sun','block');
  if(state.placement==='south_direct'&&sys==='semi')add('r_semi_direct_sun','warning');
  if(D.freeHeight<8)P.forEach(p=>{if(p.size!=='micro'&&!p.layer_form.includes('carpet'))add('r_shallow','block',{species:nm(p)})});
  // plants
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
    if(!p.layer_form.includes('vine')&&!p.layer_form.includes('mount')){
      if(p.height_cm>D.freeHeight*1.5)add('r_height_no_fit','block',{species:nm(p),height:p.height_cm,free_height:fmt(D.freeHeight)});
      else if(p.height_cm>D.freeHeight)add('r_height_overflow','warning',{species:nm(p),height:p.height_cm,free_height:fmt(D.freeHeight)});
    }
    if(state.water==='tap_hard'&&p.water_quality==='distilled_only')add('r_water_distilled_required','block',{species:nm(p)});
    if(state.water==='tap_hard'&&p.water_quality==='soft')add('r_water_soft_recommended','warning',{species:nm(p)});
    if(p.habitat.includes('epiphyte')&&!DC.some(x=>x.is_mount)&&!S.length)add('r_epiphyte_mount','info',{species:nm(p)});
  });
  // fauna
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
  // pairs / assembly
  P.forEach(p=>{if(p.plant_toxicity==='toxic_if_eaten')F.forEach(f=>{if(f.plant_interest!=='none')add('r_toxicity_plant_fauna','warning',{plant:nm(p),fauna:nm(f)})})});
  const climates=new Set([...P,...F].map(x=>x.climate).filter(x=>x&&x!=='any'));
  if(climates.has('tropical')&&climates.has('temperate')&&!state.flags.winter)add('r_climate_mix','warning');
  const agg=P.filter(p=>p.growth_rate==='aggressive').length;if(agg>2)add('r_multiple_aggressive','warning',{count:agg});
  const pred=F.filter(f=>f.role.includes('predator')).length;if(pred>1)add('r_multiple_predators','warning',{count:pred});
  if(['closed','semi'].includes(sys)&&!F.some(f=>f.role.includes('cleanup')))add('r_no_cleanup_crew','warning');
  if(sys==='open'&&F.length)add('r_open_fauna_cover','warning');
  if(state.flags.water&&D.footprint<300)add('r_paludarium_min','warning');
  if(state.water==='tap_hard'&&P.some(p=>p.water_quality==='distilled_only'))add('r_water_distilled_required','block',{species:P.filter(p=>p.water_quality==='distilled_only').map(nm).join(', ')});
  // corridors
  ['air_humidity','soil_humidity','substrate','light','temperature'].forEach(f=>{
    if([...P,...F].length>1&&!D.corridors[f].length){
      const pair=findConflictPair(f);add('r_global_intersection','block',{field:enumT(f,f==='substrate'?'tropical':D.corridors[f][0]||''),a:pair[0],b:pair[1]});
    }
  });
  if(D.corridors.light.length&&P.some(p=>!D.corridors.light.includes(p.light_optimum)))add('r_light_optimum_mismatch','warning');
  // pH
  if(P.length&&!D.ph.length){const acid=P.find(p=>!p.ph_tolerance.includes('neutral'))||P[0];add('r_ph_conflict','block',{species:nm(acid)})}
  else if(P.length&&D.ph.length===1)add('r_ph_narrow','warning');
  S.forEach(s=>{if(s.ph_test_required)add('r_ph_test_required','warning',{stone:nm(s)})});
  if(F.some(f=>f.feeding==='needs_feeding')&&['carnivore_acid','moss_acid'].includes(currentSub()))add('r_calcium_vs_acid','warning');
  if(DC.some(x=>x.is_feeding)&&F.some(f=>f.feeding==='needs_feeding'))add('r_litter_feeding','info');
  S.forEach(s=>{if(s.sharp_edges&&F.length)add('r_stone_sharp_fauna','info',{stone:nm(s)})});
  // capacity
  ['upright_trailing','groundcover'].forEach(b=>{const x=D.buckets[b];const r=x.used/x.limit;
    if(r>1.25)add('r_overcrowding_hard','block',{bucket:b});else if(r>1)add('r_overcrowding','warning',{bucket:b});});
  // dedupe
  const seen=new Set();return hits.filter(h=>{const k=h.id+JSON.stringify(h.vars);if(seen.has(k))return false;seen.add(k);return true});
}
function findConflictPair(f){
  const all=[...selP(),...selF()];
  for(let i=0;i<all.length;i++)for(let k=i+1;k<all.length;k++)if(!all[i][f].some(x=>all[k][f].includes(x)))return[nm(all[i]),nm(all[k])];
  return['—','—'];
}
function itemStatus(o){
  const kind=o.id.startsWith('plant_')?'plant':'fauna';
  if(state.items.some(i=>i.id===o.id))return{level:'added'};
  const sys=state.system;
  if(!o.system_type.includes(sys))return{level:'block',reason:t('rules.r_system_type_mismatch.msg',{species:nm(o),system:enumT('system_type',sys)})};
  if(kind==='plant'){
    const mv=sys==='closed'?o.min_volume_closed_liters:o.min_volume_open_liters;
    if(D.volume<mv)return{level:'block',reason:t('rules.r_volume_plant_closed.msg',{species:nm(o),min_volume:mv,volume:fmt(D.volume)})};
    if(sys==='closed'&&o.condensation!=='yes')return{level:'block',reason:t('rules.r_condensation_closed.msg',{species:nm(o)})};
    if(sys==='closed'&&o.airflow==='high')return{level:'block',reason:t('rules.r_system_airflow_high.msg',{species:nm(o)})};
  }else{
    if(D.volume<o.min_volume_liters)return{level:'block',reason:t('rules.r_volume_fauna.msg',{species:nm(o),min_volume:o.min_volume_liters,volume:fmt(D.volume)})};
  }
  const all=[...selP(),...selF(),o];
  for(const f of ['air_humidity','soil_humidity','substrate','light','temperature']){
    if(!inter(all.map(x=>x[f])).length)return{level:'block',reason:t(`conflict.${f}.msg`,{a:nm(o),b:selP()[0]?nm(selP()[0]):'—'})};
  }
  return{level:'ok'};
}

/* ── render ── */
function buildStatic(){
  document.documentElement.lang=lang;
  $('#langBtn').textContent=lang.toUpperCase();
  $$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  $('#navLinks').innerHTML=['builder','care','diag','saved'].map(v=>`<button class="nav-link${state.view===v?' active':''}" data-view="${v}">${t('nav.'+(v==='diag'?'diag':v==='saved'?'saved':v))}</button>`).join('');
  $('#searchInput').placeholder=lang==='ru'?'Поиск растения или живности…':'Search plant or fauna…';
  renderConfig();renderMobile();
}
function renderConfig(){
  const v=state.vessel,N=DB.norms;
  const presets=DB.vessels.presets;
  $('#configPanel').innerHTML=`
    <div class="cfg-title">${t('step.vessel')} · ${t('step.system')}</div>
    <div class="cfg-block"><div class="cfg-label">${t('step.vessel')}</div>
      <select class="select" id="vesselSelect">${presets.map(p=>`<option value="${p.id}"${p.id===v.preset?' selected':''}>${nm(p)} · ${fmt(p.volume_liters_approx)} ${t('units.l')}</option>`).join('')}</select></div>
    <div class="cfg-block"><div class="cfg-label">${t('input.system')}</div>
      <div class="seg" id="sysSeg">${['closed','semi','open'].map(s=>`<button data-sys="${s}" class="${state.system===s?'on':''}">${enumT('system_type',s)}</button>`).join('')}</div></div>
    <div class="cfg-block"><div class="cfg-label"><span>${t('derived.volume')}</span><span class="cfg-val" id="volVal"></span></div>
      <input class="range" id="volRange" type="range" min="1" max="15" step="0.5" aria-label="${t('derived.volume')}"></div>
    <div class="cfg-block"><div class="cfg-label"><span>${t('input.height')}</span><span class="cfg-val" id="hVal"></span></div>
      <input class="range" id="hRange" type="range" min="8" max="45" step="1"></div>
    <div class="cfg-block"><div class="cfg-label">${t('input.placement')}</div>
      <select class="select" id="placeSelect">${Object.keys(DB.criteria.enums.placement.values).map?.call?'' : DB.criteria.enums.placement.values.map(p=>`<option value="${p}"${p===state.placement?' selected':''}>${enumT('placement',p)}</option>`).join('')}</select>
      <p class="sub" style="margin-top:6px">${t('input.hint_placement')}</p></div>
    <div class="cfg-block"><div class="cfg-label">${t('input.water')}</div>
      <select class="select" id="waterSelect">${DB.criteria.enums.water_type.values.map(w=>`<option value="${w}"${w===state.water?' selected':''}>${enumT('water_type',w)}</option>`).join('')}</select></div>
    <div class="cfg-block"><div class="cfg-label">${t('input.style')}</div>
      <select class="select" id="styleSelect"><option value="">—</option>${DB.styles.styles.map(s=>`<option value="${s.id}"${s.id===state.style?' selected':''}>${t('styles.'+s.id+'.name')}</option>`).join('')}</select></div>
    <div class="cfg-block"><div class="cfg-label">${t('input.experience')}</div>
      <div class="seg" id="expSeg">${['beginner','experienced'].map(e=>`<button data-exp="${e}" class="${state.experience===e?'on':''}">${enumT('experience',e)}</button>`).join('')}</div></div>
    <div class="cfg-block">
      ${[['grow','input.grow_light'],['winter','input.wintering'],['water','input.open_water']].map(([k,l])=>`<label class="toggle-row"><span>${t(l)}</span><span class="sw"><input type="checkbox" data-flag="${k}"${state.flags[k]?' checked':''}><i></i></span></label>`).join('')}
    </div>
    <div class="cfg-block"><div class="cfg-label">${t('step.hardscape')}</div>
      <select class="select" id="stoneSelect"><option value="">${lang==='ru'?'Добавить камень…':'Add stone…'}</option>${DB.materials.stones.map(s=>`<option value="${s.id}">${nm(s)}</option>`).join('')}</select>
      <select class="select" id="decorSelect" style="margin-top:8px"><option value="">${lang==='ru'?'Добавить декор…':'Add decor…'}</option>${DB.materials.decor.map(s=>`<option value="${s.id}">${nm(s)}</option>`).join('')}</select>
      <div class="ph-chips" style="margin-top:10px">${[...state.stones.map(id=>{const s=DB.materials.stones.find(x=>x.id===id);return s?`<button class="ph-chip" data-rm-stone="${id}">${nm(s)} ×</button>`:''}).join(''),...state.decor.map(id=>{const s=DB.materials.decor.find(x=>x.id===id);return s?`<button class="ph-chip" data-rm-decor="${id}">${nm(s)} ×</button>`:''}).join('')}</div>
    </div>`;
  syncRanges();
}
function syncRanges(){
  const vr=$('#volRange'),hr=$('#hRange');if(!vr)return;
  vr.value=Math.min(15,Math.max(1,D?.volume||3));vr.style.setProperty('--p',((vr.value-1)/14*100)+'%');
  hr.value=state.vessel.height;hr.style.setProperty('--p',((hr.value-8)/37*100)+'%');
  $('#volVal').textContent=`${fmt(D.volume)} ${t('units.l')}`;
  $('#hVal').textContent=`${state.vessel.height} ${t('units.cm')}`;
}
function renderCatalog(){
  const f=state.filters;
  $('#catalogTabs').innerHTML=`<button data-tab="plants" class="${f.tab==='plants'?'on':''}">${t('step.plants')}</button><button data-tab="fauna" class="${f.tab==='fauna'?'on':''}">${t('step.fauna')}</button>`;
  const list=f.tab==='plants'?DB.plants:DB.fauna;
  const groups=[...new Set(list.map(x=>x.group))];
  $('#groupChips').innerHTML=`<button class="chip${f.group==='all'?' on':''}" data-group="all">${t('btn.show_all')}</button>`+groups.map(g=>`<button class="chip${f.group===g?' on':''}" data-group="${g}">${t('group.'+g)}</button>`).join('');
  $('#sortSelect').innerHTML=[['name',lang==='ru'?'По имени':'Name'],['care',lang==='ru'?'По сложности':'Care'],['size',lang==='ru'?'По размеру':'Size']].map(([v,l])=>`<option value="${v}"${f.sort===v?' selected':''}>${l}</option>`).join('');
  let items=list.filter(o=>{
    if(f.group!=='all'&&o.group!==f.group)return false;
    if(f.q){const q=f.q.toLowerCase();if(!`${o.name_ru} ${o.name_en} ${o.name_latin}`.toLowerCase().includes(q))return false}
    if(state.style&&o.styles&&!o.styles.includes(state.style))return false;
    return true;
  });
  const careOrd={easy:0,medium:1,expert:2},sizeOrd={micro:0,mini:1,large:2};
  items.sort((a,b)=>f.sort==='care'?careOrd[a.care_level]-careOrd[b.care_level]:f.sort==='size'?sizeOrd[a.size]-sizeOrd[b.size]:nm(a).localeCompare(nm(b)));
  $('#catalogCards').innerHTML=items.map((o,i)=>{
    const st=itemStatus(o),added=st.level==='added';
    const tags=o.id.startsWith('plant_')?`<span class="tag light">${enumT('light',o.light_optimum)}</span><span class="tag care">${enumT('care_level',o.care_level)}</span><span class="tag size">${enumT('size',o.size)}</span>`:`<span class="tag care">${o.role.map(r=>enumT('fauna_role',r)).join(' · ')}</span>`;
    return `<article class="card${st.level==='block'?' blocked':''}" data-open="${o.id}" style="animation-delay:${Math.min(i,8)*30}ms">
      <div class="card-photo">${imgHTML(o)}<span class="status-dot ${st.level==='added'?'ok':st.level}" title="${st.reason||''}"></span></div>
      <div class="card-body"><div class="card-name">${nm(o)}</div><div class="card-latin">${o.name_latin}</div><div class="card-tags">${tags}</div>
      <button class="card-add${added?' added':''}" data-add="${o.id}" ${st.level==='block'?'disabled':''}>${added?t('btn.remove'):st.level==='block'?t('severity.block'):t('btn.add')}</button></div></article>`;
  }).join('')||`<div class="empty"><div class="empty-orb"></div><p>${t('state.no_fit')}</p></div>`;
}
function imgHTML(o,cls=''){
  const im=o.image||{};const src=im.file||im.source_url||'';
  const ph=`<div class="ph"><svg viewBox="0 0 24 24" class="ic"><path d="M12 21c5-3 8-7 8-12-5 0-9 3-12 8"/><path d="M12 21C7 18 4 14 4 9c5 0 9 3 12 8"/></svg></div>`;
  return src?`<img class="${cls}" src="${src}" alt="${nm(o)}" loading="lazy" onerror="this.remove()">${ph}`:''+ph;
}
function renderJar(hits){
  const blocks=hits.filter(h=>h.sev==='block'),warns=hits.filter(h=>h.sev==='warning'),infos=hits.filter(h=>h.sev==='info');
  const lvl=blocks.length?'block':warns.length?'warn':'ok';
  const title=blocks.length?t('compat.blocks_title'):warns.length?t('compat.warnings_title'):t('compat.all_good');
  const sub=subObj();
  $('#jarPanel').innerHTML=`
    <div class="jar-head"><div class="verdict-orb ${lvl}"></div><div><div class="verdict-title">${title}</div>
      <div class="verdict-counts">${blocks.length} ${t('severity.block').toLowerCase()} · ${warns.length} ${t('severity.warning').toLowerCase()} · ${infos.length} ${t('severity.info').toLowerCase()}</div></div></div>
    <div class="jar-section"><h3>${t('step.review')}</h3>
      <div class="ph-chips"><span class="ph-chip">${fmt(D.volume)} ${t('units.l')}</span><span class="ph-chip">${fmt(D.footprint)} ${t('units.cm2')}</span><span class="ph-chip">${fmt(D.freeHeight)} ${t('units.cm')}</span></div></div>
    <div class="jar-section"><h3>${t('step.plants')} · ${t('step.fauna')}</h3><div class="sel-list" id="selList">
      ${state.items.map((it,idx)=>{const o=obj(it);if(!o)return'';return `<div class="sel-row" draggable="true" data-idx="${idx}">
        ${imgHTML(o,'sel-thumb')}<div class="sel-info"><div class="sel-name">${nm(o)}</div><div class="sel-meta">${t('group.'+o.group)}</div></div>
        <button class="sel-remove" data-rm="${idx}" aria-label="${t('btn.remove')}"><svg viewBox="0 0 24 24" class="ic"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`}).join('')||`<p class="sub">${t('state.empty_body')}</p>`}
    </div></div>
    <div class="jar-section"><h3>${t('derived.capacity')}</h3>
      ${meter(t('enum.layer_form.bush'),D.buckets.upright_trailing)}
      ${meter(t('enum.layer_form.carpet'),D.buckets.groundcover)}
    </div>
    <div class="jar-section"><h3>${t('derived.ph_corridor')}</h3><div class="ph-chips">${D.ph.map(z=>`<span class="ph-chip">${enumT('ph_zone',z)}</span>`).join('')||`<span class="sub">—</span>`}</div></div>
    <div class="jar-section"><h3>${t('enum.substrate.tropical')&&sub?nm(sub):''}</h3>
      ${sub?`<p class="sub">${sub.recipe.map(r=>`${Math.round(r.pct)}% ${t('materials.components.'+r.component+'.notes')||r.component}`).join(' · ')}</p>`:''}</div>
    ${hits.length?`<div class="jar-section"><h3>${t('compat.warnings_title')}</h3>${hits.map(h=>`<div class="issue ${h.sev}"><div class="issue-head">${t('severity.'+(h.sev==='block'?'block':h.sev==='warning'?'warning':'info'))}</div><div>${t('rules.'+h.id+'.msg',h.vars)}</div><div class="issue-remedy">${t('rules.'+h.id+'.remedy',h.vars)}</div></div>`).join('')}</div>`:''}
    <div class="jar-actions">
      <button class="btn primary" id="careBtn" ${blocks.length?'disabled':''}>${t('btn.finalize')}</button>
      <button class="btn ghost" id="saveBtn">${t('btn.save')}</button>
      <button class="btn ghost" id="shareBtn">${t('btn.copy_link')}</button>
      <button class="btn ghost" id="aiBtn">${t('btn.check_ai')}</button>
    </div>`;
}
function meter(label,b){
  const r=b.limit?b.used/b.limit:0;const cls=r>1.25?'block':r>1?'warn':'';
  return `<div class="meter"><div class="meter-top"><span>${label}</span><span>${fmt(b.used)} / ${fmt(b.limit)} ${t('units.cm2')}</span></div><div class="meter-bar"><div class="meter-fill ${cls}" style="width:${Math.min(100,r*100)}%"></div></div></div>`;
}
function renderMobile(){
  $('#mobileBar').innerHTML=`<button class="btn ghost" data-view="builder">${t('nav.builder')}</button><button class="btn ghost" data-view="care">${t('nav.care')}</button><button class="btn ghost" data-view="saved">${t('nav.saved')}</button><button class="btn primary" id="mobileVerdict">${t('btn.finalize')}</button>`;
}
function renderCare(){
  const P=selP(),F=selF();
  $('#careSub').textContent=`${nm(DB.vessels.presets.find(v=>v.id===state.vessel.preset)||{name_ru:'Своя ёмкость',name_en:'Custom vessel'})} · ${enumT('system_type',state.system)} · ${fmt(D.volume)} ${t('units.l')}`;
  const blocks=DB.care_templates.templates.map(tpl=>{
    if(tpl.foreach){
      const arr=tpl.foreach==='plants'?P:F;
      return arr.filter(o=>!tpl.filter||matchFilter(o,tpl.filter)).map(o=>({tpl,vars:careVars(tpl,o)}));
    }
    if(!cond(tpl.when))return[];
    return[{tpl,vars:careVars(tpl)}];
  }).flat();
  const secs=DB.care_templates.sections;
  $('#careContent').innerHTML=secs.map(sec=>{
    const bs=blocks.filter(b=>b.tpl.section===sec.id);if(!bs.length)return'';
    return `<div class="care-card"><h3>${t('care.section.'+sec.id)}</h3>${bs.map(b=>`<div class="care-item">${t(b.tpl.text_key,b.vars)}<span class="why">${b.tpl.source}</span></div>`).join('')}</div>`;
  }).join('')||`<div class="empty"><div class="empty-orb"></div><p>${t('state.empty_body')}</p></div>`;
}
function matchFilter(o,f){if(f.trim_interval_weeks_not_null)return o.trim_interval_weeks!=null;if(f.feeding)return o.feeding===f.feeding;if(f.starter_count_not_null)return o.starter_count!=null;return true}
function careVars(tpl,item){
  const P=selP(),F=selF(),N=DB.norms,sub=subObj();
  const names=a=>a.map(nm).join(', ');
  const v={
    stone_names:names(stones()),days:'3–5',components:sub?sub.recipe.map(r=>r.component).join(', '):'',
    lead_time_weeks:N.fauna_defaults.cleanup_crew_lead_time_weeks.join('–'),layer_order:DB.materials.meta.layer_order.join(' → '),
    dose_ml:N.water.closed_calibration_dose_ml_per_3l.join('–'),recheck_hours:N.water.closed_calibration_recheck_hours,
    placement_label:enumT('placement',state.placement),photoperiod_h:N.light_norms.photoperiod_hours[currentLightKey()].join('–'),
    distance_cm:N.light_norms.led_distance_cm.join('–'),boost_h:N.light_norms.winter_boost_hours,
    interval_weeks:sub&&currentSub()==='succulent_mineral'?N.water.open_succulent_interval_weeks.join('–'):N.water.open_tropical_interval_weeks.join('–'),
    tray_cm:'1–2',normal:t('norms.condensation.normal'),over_sign:t('norms.condensation.over_sign'),over_action:t('norms.condensation.over_action'),
    under_sign:t('norms.condensation.under_sign'),under_action:t('norms.condensation.under_action'),
    schedule:state.system==='closed'?t('norms.ventilation.closed_schedule'):t('norms.ventilation.semi_schedule'),
    months:N.seasonal.wintering_months_default.join(', '),temp_c:'10–15',refresh_weeks:N.maintenance.litter_refresh_interval_weeks.join('–'),
    drainage_l:fmt(D.footprint*D.drainage/1000),substrate_l:fmt(D.footprint*D.depth/1000),charcoal_ml:Math.round(D.volume*15),substrate_name:sub?nm(sub):'',
    ppfd_range:N.light_norms.ppfd_umol_m2_s[currentLightKey()].join('–')
  };
  if(item){v.name=nm(item);v.species=nm(item);v.interval_weeks=item.trim_interval_weeks;v.mechanism=enumT('spread_mechanism',item.spread_mechanism||'none');
    v.interval_days=item.feeding_plan?.interval_days||7;v.items=(item.feeding_plan?.items||[]).join(', ');v.count_min=item.starter_count?.min;v.count_recommended=item.starter_count?.recommended;}
  else{v.species=names(P.filter(p=>tpl.when?.any_plant?.requires_grow_light?p.requires_grow_light:true));}
  return v;
}
function currentLightKey(){return D.corridors.light[0]||'bright_indirect'}
function cond(c){
  if(!c||c.always)return true;const P=selP(),F=selF();
  return Object.entries(c).every(([k,val])=>{
    switch(k){
      case 'system_in':return val.includes(state.system);
      case 'substrate_in':return val.includes(currentSub());
      case 'any_plant':return P.some(p=>Object.entries(val).every(([f,x])=>p[f]===x));
      case 'any_plant_flag':return P.some(p=>p[val]);
      case 'any_plant_habitat':return P.some(p=>p.habitat.includes(val));
      case 'any_fauna':return F.some(f=>Object.entries(val).every(([f2,x])=>f[f2]===x));
      case 'any_fauna_role':return F.some(f=>f.role.some(r=>val.includes(r)));
      case 'no_fauna_role':return !F.some(f=>f.role.some(r=>val.includes(r)));
      case 'input_flag':return val==='has_grow_light_false'?!state.flags.grow:!!state.flags[{has_open_water:'water',has_wintering:'wintering',has_grow_light:'grow'}[val]];
      case 'input_is':return state[val.field]===val.value;
      case 'light_corridor_has':return D.corridors.light.includes(val);
      case 'stone_any':return stones().some(s=>Object.entries(val).every(([f,x])=>s[f]===x));
      case 'stone_prep_has':return stones().some(s=>(s.prep||[]).includes(val));
      case 'decor_any':return decor().some(d=>Object.entries(val).every(([f,x])=>d[f]===x));
      default:return true;
    }
  });
}
function renderDiag(){
  $('#diagSub').textContent=lang==='ru'?'Причины ранжируются под вашу сборку':'Causes ranked for your build';
  $('#diagContent').innerHTML=DB.diagnostics.symptoms.map(s=>{
    const causes=s.causes.map(c=>({...c,score:c.base_weight+c.boosts.reduce((a,b)=>a+(cond(b.when)?b.add:0),0)})).sort((a,b)=>b.score-a.score).slice(0,3);
    return `<div class="diag-item"><button class="diag-q" data-diag="${s.id}"><span>${t('diag.'+s.id+'.name')}</span><span class="sub">${causes[0]?Math.round(causes[0].score):''}</span></button>
      <div class="diag-a">${causes.map(c=>{const key=c.cause_key.split('.').pop();return `<div class="cause"><div class="cause-title">${t(c.cause_key)}</div><div class="cause-fix">${t(c.fix_key)}</div><div class="cause-prev">${t(c.prevention_key)}</div></div>`}).join('')}</div></div>`;
  }).join('');
}
function renderSaved(){
  const a=store.all();
  $('#savedContent').innerHTML=a.length?a.map(b=>`<div class="saved-card"><h3>${esc(b.name)}</h3><div class="saved-meta">${new Date(b.created).toLocaleDateString(lang==='ru'?'ru-RU':'en-US')} · ${b.state.items.length} ${t('units.pcs')}</div>
    <div class="saved-actions"><button class="btn primary" data-load="${b.id}">${t('btn.load')}</button><button class="btn ghost" data-del="${b.id}">${t('btn.delete')}</button></div></div>`).join(''):`<div class="empty"><div class="empty-orb"></div><p>${t('saved.empty')}</p></div>`;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ── drawer / modals / toast ── */
function openDrawer(o){
  const im=o.image||{};
  $('#drawerBody').innerHTML=`
    ${imgHTML(o,'drawer-photo')}<h2 id="drawerTitle">${nm(o)}</h2><div class="latin">${o.name_latin}</div>
    <div class="drawer-tags"><span class="tag care">${t('group.'+o.group)}</span>${o.size?`<span class="tag size">${enumT('size',o.size)}</span>`:''}${o.care_level?`<span class="tag light">${enumT('care_level',o.care_level)}</span>`:''}</div>
    ${t('notes.'+o.id)!=='notes.'+o.id?`<div class="drawer-note">${t('notes.'+o.id)}</div>`:''}
    <dl class="kv">${kv('system_type',o.system_type?.map(x=>enumT('system_type',x)).join(', '))}${kv('light',o.light?.map(x=>enumT('light',x)).join(', '))}${kv('air_humidity',o.air_humidity?.map(x=>enumT('air_humidity',x)).join(', '))}${kv('soil_humidity',o.soil_humidity?.map(x=>enumT('soil_humidity',x)).join(', '))}${kv('temperature',o.temperature?.map(x=>enumT('temperature',x)).join(', '))}${o.role?kv('fauna_role',o.role.map(x=>enumT('fauna_role',x)).join(', ')):''}</dl>
    <div class="drawer-links"><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(o.name_latin)}">${t('caption.search_google')}</a><a class="btn ghost" target="_blank" rel="noopener" href="https://yandex.ru/images/search?text=${encodeURIComponent(o.name_latin)}">${t('caption.search_yandex')}</a></div>
    <div class="credit">${im.attribution|| (im.author?`${t('caption.credit',{author:im.author,license:im.license})} · <a href="${im.source_url}" target="_blank" rel="noopener">${t('caption.source')}</a>`:t('caption.illustration'))}</div>
    <button class="btn primary" style="width:100%;margin-top:18px" data-add="${o.id}">${state.items.some(i=>i.id===o.id)?t('btn.remove'):t('btn.add')}</button>`;
  show('drawer');
}
const kv=(k,v)=>v?`<dt>${t('enum.'+k+'.__')!=='enum.'+k+'.__'?k:t(k)}</dt><dd>${v}</dd>`:'';
function show(id){$('#'+id).classList.remove('hidden');$('#'+(id==='drawer'?'drawerScrim':id==='saveModal'?'saveScrim':'aiScrim')).classList.remove('hidden')}
function hide(id){$('#'+id).classList.add('hidden');$('#'+(id==='drawer'?'drawerScrim':id==='saveModal'?'saveScrim':'aiScrim')).classList.add('hidden')}
function toast(msg,undo){
  const el=document.createElement('div');el.className='toast';el.innerHTML=`<span>${msg}</span>${undo?'<button type="button">Undo</button>':''}`;
  $('#toasts').append(el);if(undo)el.querySelector('button').onclick=()=>{undo();el.remove()};
  setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(10px)';setTimeout(()=>el.remove(),250)},undo?6000:3200);
}

/* ── AI ── */
function aiPrompt(){
  const P=selP(),F=selF();
  const plantLine=p=>t('ai.plant_line',{name_ru:p.name_ru,latin:p.name_latin,layer:p.layer_form.map(x=>enumT('layer_form',x)).join('/'),growth:enumT('growth_rate',p.growth_rate),air:p.air_humidity.map(x=>enumT('air_humidity',x)).join('/'),cond:enumT('condensation',p.condensation)});
  const faunaLine=f=>t('ai.fauna_line',{name_ru:f.name_ru,role:f.role.map(x=>enumT('fauna_role',x)).join('/'),interest:enumT('plant_interest',f.plant_interest)});
  let s=t('ai.prompt',{volume:fmt(D.volume),system:enumT('system_type',state.system),shape:enumT('vessel_shape',state.vessel.shape),placement:enumT('placement',state.placement),water:enumT('water_type',state.water),substrate:subObj()?nm(subObj()):'—',hardscape:[...stones(),...decor()].map(nm).join(', ')||'—',plants:P.map(plantLine).join('\n')||'—',fauna:F.map(faunaLine).join('\n')||'—'});
  return s.length>2000?s.slice(0,1997)+'…':s;
}
function openAI(){
  $('#aiPrompt').value=aiPrompt();$('#aiHint').textContent=t('toast.ai_copied');
  $('#aiTargets').innerHTML=`<button class="ai-target" data-ai="google">${t('ai.target_google')}</button><button class="ai-target" data-ai="perplexity">${t('ai.target_perplexity')}</button>`;
  show('aiModal');
}
async function copyText(s){try{await navigator.clipboard.writeText(s);return true}catch{const ta=document.createElement('textarea');ta.value=s;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();return true}}

/* ── update / events ── */
function update(){
  D=derive();const hits=evaluate();
  if(state.view==='builder'){renderCatalog();renderJar(hits);syncRanges()}
  if(state.view==='care')renderCare();
  if(state.view==='diag')renderDiag();
  if(state.view==='saved')renderSaved();
  renderMobile();
}
function setView(v){
  state.view=v;$$('.view').forEach(x=>x.classList.add('hidden'));$('#view-'+v).classList.remove('hidden');
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  update();window.scrollTo({top:0,behavior:'smooth'});
}
function addItem(id){
  const o=[...DB.plants,...DB.fauna].find(x=>x.id===id);if(!o)return;
  const idx=state.items.findIndex(i=>i.id===id);
  if(idx>=0){removeItem(idx);return}
  const kind=o.id.startsWith('plant_')?'plant':'fauna';
  state.items.push({kind,id});update();toast(`${nm(o)} ✓`);
}
function removeItem(idx){
  const it=state.items[idx];const o=obj(it);undoBuf={it,idx};
  state.items.splice(idx,1);update();
  toast(`${nm(o)} ${t('btn.remove').toLowerCase()}`,()=>{state.items.splice(undoBuf.idx,0,undoBuf.it);update()});
}
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-view],.nav-link,[data-view-link]');
  if(el){e.preventDefault();setView(el.dataset.view||el.dataset.viewLink);return}
  const add=e.target.closest('[data-add]');if(add){addItem(add.dataset.add);if(!$('#drawer').classList.contains('hidden'))hide('drawer');return}
  const open=e.target.closest('[data-open]');if(open&&!e.target.closest('button')){const o=[...DB.plants,...DB.fauna].find(x=>x.id===open.dataset.open);openDrawer(o);return}
  const rm=e.target.closest('[data-rm]');if(rm){removeItem(+rm.dataset.rm);return}
  const tab=e.target.closest('[data-tab]');if(tab){state.filters.tab=tab.dataset.tab;state.filters.group='all';update();return}
  const gr=e.target.closest('[data-group]');if(gr){state.filters.group=gr.dataset.group;update();return}
  const sys=e.target.closest('[data-sys]');if(sys){state.system=sys.dataset.sys;renderConfig();update();return}
  const exp=e.target.closest('[data-exp]');if(exp){state.experience=exp.dataset.exp;renderConfig();update();return}
  const rs=e.target.closest('[data-rm-stone]');if(rs){state.stones=state.stones.filter(x=>x!==rs.dataset.rmStone);renderConfig();update();return}
  const rd=e.target.closest('[data-rm-decor]');if(rd){state.decor=state.decor.filter(x=>x!==rd.dataset.rmDecor);renderConfig();update();return}
  if(e.target.closest('#langBtn')){lang=lang==='ru'?'en':'ru';localStorage.setItem('flor.lang',lang);buildStatic();update();return}
  if(e.target.closest('#retryBtn')){location.reload();return}
  if(e.target.closest('#careBtn')||e.target.closest('#mobileVerdict')){setView('care');return}
  if(e.target.closest('#saveBtn')){$('#saveName').value='';show('saveModal');return}
  if(e.target.closest('#saveCancel')){hide('saveModal');return}
  if(e.target.closest('#saveConfirm')){const n=$('#saveName').value.trim()||t('saved.name_placeholder');store.save(n);hide('saveModal');toast(t('toast.saved'));return}
  if(e.target.closest('#shareBtn')){const url=location.origin+location.pathname+'?'+encodeState().toString();await copyText(url);history.replaceState(null,'','?'+encodeState().toString());toast(t('toast.link_copied'));return}
  if(e.target.closest('#aiBtn')){openAI();return}
  if(e.target.closest('#aiClose')){hide('aiModal');return}
  if(e.target.closest('#aiCopy')){await copyText($('#aiPrompt').value);toast(t('toast.ai_copied'));return}
  const at=e.target.closest('[data-ai]');if(at){await copyText($('#aiPrompt').value);const u=at.dataset.ai==='google'?'https://www.google.com/search?udm=50&q='+encodeURIComponent($('#aiPrompt').value):'https://www.perplexity.ai/?q='+encodeURIComponent($('#aiPrompt').value);window.open(u,'_blank','noopener');toast(t('toast.ai_copied'));return}
  if(e.target.closest('#drawerClose')||e.target.id==='drawerScrim'){hide('drawer');return}
  if(e.target.id==='saveScrim'){hide('saveModal');return}
  if(e.target.id==='aiScrim'){hide('aiModal');return}
  const dg=e.target.closest('[data-diag]');if(dg){dg.closest('.diag-item').classList.toggle('open');return}
  const ld=e.target.closest('[data-load]');if(ld){store.load(ld.dataset.load);setView('builder');return}
  const dl=e.target.closest('[data-del]');if(dl){store.del(dl.dataset.del);renderSaved();toast(t('toast.deleted'));return}
  if(e.target.closest('#exportBtn')){const blob=new Blob([JSON.stringify(store.all(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='florarium-builds.json';a.click();URL.revokeObjectURL(a.href);return}
});
document.addEventListener('input',e=>{
  if(e.target.id==='searchInput'){state.filters.q=e.target.value;renderCatalog();return}
  if(e.target.id==='volRange'){const target=+e.target.value;state.vessel.height=Math.round(state.vessel.height*(target/(D.volume||1)));state.vessel.preset='custom';renderConfig();update();return}
  if(e.target.id==='hRange'){state.vessel.height=+e.target.value;state.vessel.preset='custom';syncRanges();update();return}
});
document.addEventListener('change',e=>{
  const id=e.target.id;
  if(id==='vesselSelect'){const p=DB.vessels.presets.find(x=>x.id===e.target.value);if(p){Object.assign(state.vessel,{preset:p.id,shape:p.shape,closure:p.closure_default,neck:p.neck_diameter_cm||null,volumeLabel:p.volume_liters_label||null,...p.dims_cm});if(!['closed','semi','open'].some(s=>p.systems.includes(state.system)&&s===state.system))state.system=p.systems[0];}renderConfig();update();return}
  if(id==='placeSelect'){state.placement=placeSelect.value;update();return}
  if(id==='waterSelect'){state.water=e.target.value;update();return}
  if(id==='styleSelect'){state.style=e.target.value;state.filters.group='all';update();return}
  if(id==='sortSelect'){state.filters.sort=e.target.value;renderCatalog();return}
  if(id==='stoneSelect'&&e.target.value){if(!state.stones.includes(e.target.value))state.stones.push(e.target.value);renderConfig();update();return}
  if(id==='decorSelect'&&e.target.value){if(!state.decor.includes(e.target.value))state.decor.push(e.target.value);renderConfig();update();return}
  if(e.target.dataset.flag){state.flags[e.target.dataset.flag]=e.target.checked;update();return}
  if(e.target.id==='importFile'){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const a=JSON.parse(r.result);if(Array.isArray(a)){localStorage.setItem('florarium.builds.v1',JSON.stringify(a));renderSaved();toast(t('toast.imported'))}}catch{toast(t('toast.import_error'))}};r.readAsText(f);return}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){['drawer','saveModal','aiModal'].forEach(hide)}});
/* drag reorder */
let dragIdx=null;
document.addEventListener('dragstart',e=>{const r=e.target.closest('.sel-row');if(r){dragIdx=+r.dataset.idx;r.classList.add('dragging')}});
document.addEventListener('dragend',e=>{const r=e.target.closest('.sel-row');if(r)r.classList.remove('dragging')});
document.addEventListener('dragover',e=>{if(e.target.closest('.sel-row'))e.preventDefault()});
document.addEventListener('drop',e=>{const r=e.target.closest('.sel-row');if(r&&dragIdx!=null){const to=+r.dataset.idx;const [it]=state.items.splice(dragIdx,1);state.items.splice(to,0,it);dragIdx=null;update()}});
boot();
