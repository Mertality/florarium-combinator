'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const DATA=['criteria','styles','materials','plants_fauna','norms','vessels','care_templates','diagnostics'];
const NS=['ui','rules','care','diag','catalog'];
const DB={},I18N={ru:{},en:{}};
let lang=localStorage.getItem('flor.lang')||'ru',D=null,dragIdx=null;
const state={view:'builder',vessel:{preset:'vessel_jar_3l',shape:'jar',diameter:14,height:20,width:20,depth:20,neck:null,closure:'sealable',volumeLabel:null},system:'closed',placement:'east_west',water:'soft',experience:'beginner',style:'tropical_jungle',flags:{grow:false,winter:false,water:false},items:[],stones:[],decor:[],substrate:null,filters:{tab:'plants',group:'all',q:'',sort:'name'}};
const FL={air_humidity:{ru:'Влажность воздуха',en:'Air humidity'},soil_humidity:{ru:'Влажность грунта',en:'Soil moisture'},substrate:{ru:'Субстрат',en:'Substrate'},light:{ru:'Свет',en:'Light'},temperature:{ru:'Температура',en:'Temperature'}};

window.__ph=()=>'<div class="ph"><svg viewBox="0 0 24 24" class="ic"><path d="M12 21c5-3 8-7 8-12-5 0-9 3-12 8"/><path d="M12 21C7 18 4 14 4 9c5 0 9 3 12 8"/></svg></div>';
window.__imgErr=function(img){const fb=img.getAttribute('data-fb');if(fb){img.setAttribute('data-fb','');img.src=fb;}else{img.outerHTML=window.__ph();}};

async function j(u){const c=new AbortController(),to=setTimeout(()=>c.abort(),15000);try{const r=await fetch(u,{cache:'no-store',signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(to);}}
async function boot(){
  try{
    for(const n of DATA){try{DB[n]=await j('data/'+n+'.json');}catch(e){throw new Error('data/'+n+'.json — '+e.message);}}
    for(const l of ['ru','en'])for(const n of NS){try{const c=await j('i18n/'+l+'/'+n+'.json');delete c.meta;if(n==='care'||n==='diag')I18N[l][n]=c;else Object.assign(I18N[l],c);}catch(e){throw new Error('i18n/'+l+'/'+n+'.json — '+e.message);}}
    DB.plants=DB.plants_fauna.plants||[];DB.fauna=DB.plants_fauna.fauna||[];
    restoreURL();if(!state.items.length)seed();
    D=derive();
    $('#boot').classList.add('hidden');$('#view-builder').classList.remove('hidden');
    buildStatic();update();window.__florReady=true;
  }catch(e){console.error(e);window.__florFail('Не удалось загрузить данные: '+e.message+'. Проверьте, что все файлы в /data и /i18n загружены, и обновите страницу (Ctrl+F5).');}
}
function t(path,vars){vars=vars||{};let s=path.split('.').reduce((o,k)=>o&&o[k],I18N[lang]);if(s==null)s=path.split('.').reduce((o,k)=>o&&o[k],I18N.en);if(s==null)s=path;return String(s).replace(/\{(\w+)\}/g,(_,k)=>vars[k]!=null?vars[k]:'{'+k+'}');}
const nm=o=>!o?'':(lang==='ru'?o.name_ru:o.name_en)||o.name_latin||'';
const fmt=n=>Number(n||0).toLocaleString(lang==='ru'?'ru-RU':'en-US',{maximumFractionDigits:1});
const enumT=(e,v)=>t('enum.'+e+'.'+v);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function seed(){state.items=[{kind:'plant',id:'plant_fittonia'},{kind:'plant',id:'plant_leucobryum_glaucum'},{kind:'plant',id:'plant_soleirolia_soleirolii'},{kind:'fauna',id:'fauna_collembola'}];state.stones=['ohko'];state.decor=['driftwood'];state.substrate='tropical';}
function encodeState(){const v=state.vessel,p=new URLSearchParams();p.set('v','13');p.set('sys',state.system);p.set('place',state.placement);p.set('water',state.water);p.set('exp',state.experience);if(state.style)p.set('style',state.style);p.set('shape',v.shape);p.set('h',v.height);p.set('d',v.diameter||'');p.set('w',v.width||'');p.set('dp',v.depth||'');p.set('items',state.items.map(i=>{const o=obj(i);return o?o.slug:'';}).filter(Boolean).join(','));p.set('stones',state.stones.join(','));p.set('decor',state.decor.join(','));if(state.substrate)p.set('sub',state.substrate);p.set('fl',[state.flags.grow,state.flags.winter,state.flags.water].map(b=>b?1:0).join(''));return p;}
function restoreURL(){const p=new URLSearchParams(location.search);if(!p.has('sys'))return;state.system=p.get('sys');state.placement=p.get('place')||'east_west';state.water=p.get('water')||'soft';state.experience=p.get('exp')||'beginner';state.style=p.get('style')||'';const v=state.vessel;v.shape=p.get('shape')||'jar';v.height=+p.get('h')||20;v.diameter=+p.get('d')||14;v.width=+p.get('w')||20;v.depth=+p.get('dp')||20;const all=DB.plants.concat(DB.fauna);state.items=(p.get('items')||'').split(',').filter(Boolean).map(s=>{const o=all.find(x=>x.slug===s);return o?{kind:o.id.indexOf('plant_')===0?'plant':'fauna',id:o.id}:null;}).filter(Boolean);state.stones=(p.get('stones')||'').split(',').filter(Boolean);state.decor=(p.get('decor')||'').split(',').filter(Boolean);state.substrate=p.get('sub')||null;const f=p.get('fl')||'000';state.flags={grow:f[0]==='1',winter:f[1]==='1',water:f[2]==='1'};}
const store={all:()=>{try{return JSON.parse(localStorage.getItem('florarium.builds.v1')||'[]');}catch(e){return[];}},save(name){const a=store.all();a.unshift({id:Date.now(),name:name,created:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))});localStorage.setItem('florarium.builds.v1',JSON.stringify(a));},del(id){localStorage.setItem('florarium.builds.v1',JSON.stringify(store.all().filter(x=>x.id!==id)));},load(id){const b=store.all().find(x=>x.id===id);if(b){Object.assign(state,JSON.parse(JSON.stringify(b.state)));D=derive();buildStatic();update();toast(t('toast.saved'));}}};

function obj(i){return (i.kind==='plant'?DB.plants:DB.fauna).find(x=>x.id===i.id);}
const selP=()=>state.items.filter(i=>i.kind==='plant').map(obj).filter(Boolean);
const selF=()=>state.items.filter(i=>i.kind==='fauna').map(obj).filter(Boolean);
const stones=()=>state.stones.map(id=>DB.materials.stones.find(s=>s.id===id)).filter(Boolean);
const decor=()=>state.decor.map(id=>DB.materials.decor.find(s=>s.id===id)).filter(Boolean);
const inter=a=>a.length?a.reduce((x,y)=>x.filter(v=>y.indexOf(v)>=0),a[0].slice()):[];
function habit(p){const l=p.layer_form||[];if(l.length===1&&l[0]==='mount')return 'mount';if(l.some(x=>x==='bush'||x==='accent'))return 'upright';if(l.indexOf('vine')>=0)return 'trailing';return 'groundcover';}
function currentSub(){if(state.substrate)return state.substrate;const c=inter(selP().concat(selF()).map(x=>x.substrate));return c[0]||'tropical';}
const subObj=()=>DB.materials.substrates.find(s=>s.id===currentSub());
const compName=id=>{const c=DB.materials.components.find(x=>x.id===id);return c?nm(c):id;};

function derive(){
  const v=state.vessel,N=DB.norms,pi=Math.PI,d=v.diameter||14,h=v.height||20,w=v.width||20,dp=v.depth||20;let vol,foot;
  if(v.shape==='bowl'){vol=pi*(d/2)*(d/2)*h*.65;foot=pi*(d/2)*(d/2)**.8;}
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
  const P=selP(),F=selF(),S=stones(),DC=decor(),hits=[],add=(id,sev,vars)=>hits.push({id:id,sev:sev,vars:vars||{}}),sys=state.system,vol=D.volume;
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
  ['air_humidity','soil_humidity','substrate','light','temperature'].forEach(f=>{if(P.concat(F).length>1&&!D.corridors[f].length){const pr=findPair(f);add('r_global_intersection','block',{field:FL[f][lang],a:pr[0],b:pr[1]});}});
  if(D.corridors.light.length&&P.some(p=>!D.corridors.light.includes(p.light_optimum)))add('r_light_optimum_mismatch','warning');
  if(P.length&&!D.ph.length){const a=P.find(p=>!p.ph_tolerance.includes('neutral'))||P[0];add('r_ph_conflict','block',{species:nm(a)});}else if(P.length&&D.ph.length===1)add('r_ph_narrow','warning');
  S.forEach(s=>{if(s.ph_test_required)add('r_ph_test_required','warning',{stone:nm(s)});});
  if(F.some(f=>f.feeding==='needs_feeding')&&['carnivore_acid','moss_acid'].includes(currentSub()))add('r_calcium_vs_acid','warning');
  if(DC.some(x=>x.is_feeding)&&F.some(f=>f.feeding==='needs_feeding'))add('r_litter_feeding','info');
  S.forEach(s=>{if(s.sharp_edges&&F.length)add('r_stone_sharp_fauna','info',{stone:nm(s)});});
  ['upright_trailing','groundcover'].forEach(b=>{const x=D.buckets[b],r=x.limit?x.used/x.limit:0;if(r>1.25)add('r_overcrowding_hard','block',{bucket:b});else if(r>1)add('r_overcrowding','warning',{bucket:b});});
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

function buildStatic(){document.documentElement.lang=lang;$('#langBtn').textContent=lang.toUpperCase();$$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));$('#navLinks').innerHTML=['builder','care','diag','saved'].map(v=>'<button class="nav-link'+(state.view===v?' active':'')+'" data-view="'+v+'">'+t('nav.'+v)+'</button>').join('');$('#searchInput').placeholder=lang==='ru'?'Поиск растения или живности…':'Search plant or fauna…';renderConfig();renderMobile();}
function renderConfig(){
  const v=state.vessel,ps=DB.vessels.presets;
  $('#configPanel').innerHTML=
  '<div class="cfg-title">'+t('step.vessel')+' · '+t('step.system')+'</div>'+
  '<div class="cfg-block"><div class="cfg-label">'+t('step.vessel')+'</div><select class="select" id="vesselSelect">'+ps.map(p=>'<option value="'+p.id+'"'+(p.id===v.preset?' selected':'')+'>'+nm(p)+' · '+fmt(p.volume_liters_approx)+' '+t('units.l')+'</option>').join('')+(v.preset==='custom'?'<option value="custom" selected>'+(lang==='ru'?'Своя ёмкость':'Custom')+'</option>':'')+'</select></div>'+
  '<div class="cfg-block"><div class="cfg-label">'+t('input.system')+'</div><div class="seg" id="sysSeg">'+['closed','semi','open'].map(s=>'<button data-sys="'+s+'" class="'+(state.system===s?'on':'')+'">'+enumT('system_type',s)+'</button>').join('')+'</div></div>'+
  '<div class="cfg-block"><div class="cfg-label"><span>'+t('derived.volume')+'</span><span class="cfg-val" id="volVal"></span></div><input class="range" id="volRange" type="range" min="1" max="15" step="0.5"></div>'+
  '<div class="cfg-block"><div class="cfg-label"><span>'+t('input.height')+'</span><span class="cfg-val" id="hVal"></span></div><input class="range" id="hRange" type="range" min="8" max="45" step="1"></div>'+
  '<div class="cfg-block"><div class="cfg-label">'+t('input.placement')+'</div><select class="select" id="placeSelect">'+DB.criteria.enums.placement.values.map(p=>'<option value="'+p+'"'+(p===state.placement?' selected':'')+'>'+enumT('placement',p)+'</option>').join('')+'</select><p class="sub" style="margin-top:6px">'+t('input.hint_placement')+'</p></div>'+
  '<div class="cfg-block"><div class="cfg-label">'+t('input.water')+'</div><select class="select" id="waterSelect">'+DB.criteria.enums.water_type.values.map(w=>'<option value="'+w+'"'+(w===state.water?' selected':'')+'>'+enumT('water_type',w)+'</option>').join('')+'</select></div>'+
  '<div class="cfg-block"><div class="cfg-label">'+t('input.style')+'</div><select class="select" id="styleSelect"><option value="">—</option>'+DB.styles.styles.map(s=>'<option value="'+s.id+'"'+(s.id===state.style?' selected':'')+'>'+t('styles.'+s.id+'.name')+'</option>').join('')+'</select></div>'+
  '<div class="cfg-block"><div class="cfg-label">'+t('input.experience')+'</div><div class="seg" id="expSeg">'+['beginner','experienced'].map(e=>'<button data-exp="'+e+'" class="'+(state.experience===e?'on':'')+'">'+enumT('experience',e)+'</button>').join('')+'</div></div>'+
  '<div class="cfg-block">'+[['grow','input.grow_light'],['winter','input.wintering'],['water','input.open_water']].map(x=>'<label class="toggle-row"><span>'+t(x[1])+'</span><span class="sw"><input type="checkbox" data-flag="'+x[0]+'"'+(state.flags[x[0]]?' checked':'')+'><i></i></span></label>').join('')+'</div>'+
  '<div class="cfg-block"><div class="cfg-label">'+t('step.hardscape')+'</div><select class="select" id="stoneSelect"><option value="">'+(lang==='ru'?'Добавить камень…':'Add stone…')+'</option>'+DB.materials.stones.map(s=>'<option value="'+s.id+'">'+nm(s)+'</option>').join('')+'</select><select class="select" id="decorSelect" style="margin-top:8px"><option value="">'+(lang==='ru'?'Добавить декор…':'Add decor…')+'</option>'+DB.materials.decor.map(s=>'<option value="'+s.id+'">'+nm(s)+'</option>').join('')+'</select><div class="ph-chips" style="margin-top:10px">'+state.stones.map(id=>{const s=DB.materials.stones.find(x=>x.id===id);return s?'<button class="ph-chip" data-rm-stone="'+id+'">'+nm(s)+' ×</button>':'';}).join('')+state.decor.map(id=>{const s=DB.materials.decor.find(x=>x.id===id);return s?'<button class="ph-chip" data-rm-decor="'+id+'">'+nm(s)+' ×</button>':'';}).join('')+'</div></div>';
  syncRanges();
}
function syncRanges(){const vr=$('#volRange'),hr=$('#hRange');if(!vr||!D)return;vr.value=Math.min(15,Math.max(1,D.volume));vr.style.setProperty('--p',((vr.value-1)/14*100)+'%');hr.value=state.vessel.height;hr.style.setProperty('--p',((hr.value-8)/37*100)+'%');$('#volVal').textContent=fmt(D.volume)+' '+t('units.l');$('#hVal').textContent=state.vessel.height+' '+t('units.cm');}
function renderCatalog(){
  const f=state.filters;$('#catalogTabs').innerHTML='<button data-tab="plants" class="'+(f.tab==='plants'?'on':'')+'">'+t('step.plants')+'</button><button data-tab="fauna" class="'+(f.tab==='fauna'?'on':'')+'">'+t('step.fauna')+'</button>';
  const list=f.tab==='plants'?DB.plants:DB.fauna,groups=[...new Set(list.map(x=>x.group))];
  $('#groupChips').innerHTML='<button class="chip'+(f.group==='all'?' on':'')+'" data-group="all">'+t('btn.show_all')+'</button>'+groups.map(g=>'<button class="chip'+(f.group===g?' on':'')+'" data-group="'+g+'">'+t('group.'+g)+'</button>').join('');
  $('#sortSelect').innerHTML=[['name',lang==='ru'?'По имени':'Name'],['care',lang==='ru'?'По сложности':'Care'],['size',lang==='ru'?'По размеру':'Size']].map(x=>'<option value="'+x[0]+'"'+(f.sort===x[0]?' selected':'')+'>'+x[1]+'</option>').join('');
  let items=list.filter(o=>{if(f.group!=='all'&&o.group!==f.group)return false;if(f.q&&(`${o.name_ru} ${o.name_en} ${o.name_latin}`.toLowerCase().indexOf(f.q.toLowerCase())<0))return false;if(state.style&&o.styles&&!o.styles.includes(state.style))return false;return true;});
  const co={easy:0,medium:1,expert:2},so={micro:0,mini:1,large:2};items.sort((a,b)=>f.sort==='care'?(co[a.care_level]||0)-(co[b.care_level]||0):f.sort==='size'?(so[a.size]||0)-(so[b.size]||0):nm(a).localeCompare(nm(b)));
  $('#catalogCards').innerHTML=items.map((o,i)=>{const st=itemStatus(o),added=st.level==='added',isP=o.id.indexOf('plant_')===0;const tags=isP?'<span class="tag light">'+enumT('light',o.light_optimum)+'</span><span class="tag care">'+enumT('care_level',o.care_level)+'</span><span class="tag size">'+enumT('size',o.size)+'</span>':'<span class="tag care">'+o.role.map(r=>enumT('fauna_role',r)).join(' · ')+'</span>';return '<article class="card'+(st.level==='block'?' blocked':'')+'" data-open="'+o.id+'" style="animation-delay:'+Math.min(i,8)*30+'ms"><div class="card-photo">'+imgHTML(o)+'<span class="status-dot '+(added?'ok':st.level)+'" title="'+esc(st.reason||'')+'"></span></div><div class="card-body"><div class="card-name">'+nm(o)+'</div><div class="card-latin">'+o.name_latin+'</div><div class="card-tags">'+tags+'</div><button class="card-add'+(added?' added':'')+'" data-add="'+o.id+'"'+(st.level==='block'?' disabled':'')+'>'+(added?t('btn.remove'):st.level==='block'?t('severity.block'):t('btn.add'))+'</button></div></article>';}).join('')||'<div class="empty"><div class="empty-orb"></div><p>'+t('state.no_fit')+'</p></div>';
}
function meter(label,b){const r=b.limit&&isFinite(b.limit)?b.used/b.limit:0,cls=r>1.25?'block':r>1?'warn':'';return '<div class="meter"><div class="meter-top"><span>'+label+'</span><span>'+fmt(b.used)+' / '+fmt(b.limit)+' '+t('units.cm2')+'</span></div><div class="meter-bar"><div class="meter-fill '+cls+'" style="width:'+Math.min(100,r*100)+'%"></div></div></div>';}
function renderJar(hits){
  const bl=hits.filter(h=>h.sev==='block'),wa=hits.filter(h=>h.sev==='warning'),inf=hits.filter(h=>h.sev==='info'),lvl=bl.length?'block':wa.length?'warn':'ok',title=bl.length?t('compat.blocks_title'):wa.length?t('compat.warnings_title'):t('compat.all_good'),sub=subObj();
  $('#jarPanel').innerHTML=
  '<div class="jar-head"><div class="verdict-orb '+lvl+'"></div><div><div class="verdict-title">'+title+'</div><div class="verdict-counts">'+bl.length+' '+t('severity.block').toLowerCase()+' · '+wa.length+' '+t('severity.warning').toLowerCase()+' · '+inf.length+' '+t('severity.info').toLowerCase()+'</div></div></div>'+
  '<div class="jar-section"><h3>'+t('step.review')+'</h3><div class="ph-chips"><span class="ph-chip">'+fmt(D.volume)+' '+t('units.l')+'</span><span class="ph-chip">'+fmt(D.footprint)+' '+t('units.cm2')+'</span><span class="ph-chip">'+fmt(D.freeHeight)+' '+t('units.cm')+'</span></div></div>'+
  '<div class="jar-section"><h3>'+t('step.plants')+' · '+t('step.fauna')+'</h3><div class="sel-list" id="selList">'+(state.items.map((it,idx)=>{const o=obj(it);return o?'<div class="sel-row" draggable="true" data-idx="'+idx+'">'+imgHTML(o,'sel-thumb')+'<div class="sel-info"><div class="sel-name">'+nm(o)+'</div><div class="sel-meta">'+t('group.'+o.group)+'</div></div><button class="sel-remove" data-rm="'+idx+'" aria-label="'+t('btn.remove')+'"><svg viewBox="0 0 24 24" class="ic"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>':'';}).join('')||'<p class="sub">'+t('state.empty_body')+'</p>')+'</div></div>'+
  '<div class="jar-section"><h3>'+t('derived.capacity')+'</h3>'+meter(t('enum.layer_form.bush'),D.buckets.upright_trailing)+meter(t('enum.layer_form.carpet'),D.buckets.groundcover)+'</div>'+
  '<div class="jar-section"><h3>'+t('derived.ph_corridor')+'</h3><div class="ph-chips">'+(D.ph.map(z=>'<span class="ph-chip">'+enumT('ph_zone',z)+'</span>').join('')||'<span class="sub">—</span>')+'</div></div>'+
  (sub?'<div class="jar-section"><h3>'+nm(sub)+'</h3><p class="sub">'+sub.recipe.map(r=>Math.round(r.pct)+'% '+compName(r.component)).join(' · ')+'</p></div>':'')+
  (hits.length?'<div class="jar-section"><h3>'+t('compat.warnings_title')+'</h3>'+hits.map(h=>'<div class="issue '+h.sev+'"><div class="issue-head">'+t('severity.'+(h.sev==='block'?'block':h.sev==='warning'?'warning':'info'))+'</div><div>'+t('rules.'+h.id+'.msg',h.vars)+'</div><div class="issue-remedy">'+t('rules.'+h.id+'.remedy',h.vars)+'</div></div>').join('')+'</div>':'')+
  '<div class="jar-actions"><button class="btn primary" id="careBtn"'+(bl.length?' disabled':'')+'>'+t('btn.finalize')+'</button><button class="btn ghost" id="saveBtn">'+t('btn.save')+'</button><button class="btn ghost" id="shareBtn">'+t('btn.copy_link')+'</button><button class="btn ghost" id="aiBtn">'+t('btn.check_ai')+'</button></div>';
}
function renderMobile(){$('#mobileBar').innerHTML='<button class="btn ghost" data-view="builder">'+t('nav.builder')+'</button><button class="btn ghost" data-view="care">'+t('nav.care')+'</button><button class="btn ghost" data-view="saved">'+t('nav.saved')+'</button><button class="btn primary" id="mobileVerdict">'+t('btn.finalize')+'</button>';}
function matchFilter(o,f){if(f.trim_interval_weeks_not_null)return o.trim_interval_weeks!=null;if(f.feeding)return o.feeding===f.feeding;if(f.starter_count_not_null)return o.starter_count!=null;return true;}
function currentLightKey(){return D.corridors.light[0]||'bright_indirect';}
function careVars(tpl,item){const P=selP(),F=selF(),N=DB.norms,sub=subObj(),names=a=>a.map(nm).join(', '),lk=currentLightKey();const v={stone_names:names(stones()),days:'3–5',components:sub?sub.recipe.map(r=>compName(r.component)).join(', '):'',lead_time_weeks:N.fauna_defaults.cleanup_crew_lead_time_weeks.join('–'),layer_order:DB.materials.meta.layer_order.join(' → '),dose_ml:N.water.closed_calibration_dose_ml_per_3l.join('–'),recheck_hours:N.water.closed_calibration_recheck_hours,placement_label:enumT('placement',state.placement),photoperiod_h:N.light_norms.photoperiod_hours[lk].join('–'),distance_cm:N.light_norms.led_distance_cm.join('–'),boost_h:N.light_norms.winter_boost_hours,interval_weeks:currentSub()==='succulent_mineral'?N.water.open_succulent_interval_weeks.join('–'):N.water.open_tropical_interval_weeks.join('–'),tray_cm:'1–2',normal:t('norms.condensation.normal'),over_sign:t('norms.condensation.over_sign'),over_action:t('norms.condensation.over_action'),under_sign:t('norms.condensation.under_sign'),under_action:t('norms.condensation.under_action'),schedule:state.system==='closed'?t('norms.ventilation.closed_schedule'):t('norms.ventilation.semi_schedule'),months:N.seasonal.wintering_months_default.join(', '),temp_c:'10–15',refresh_weeks:N.maintenance.litter_refresh_interval_weeks.join('–'),drainage_l:fmt(D.footprint*D.drainage/1000),substrate_l:fmt(D.footprint*D.depth/1000),charcoal_ml:Math.round(D.volume*15),substrate_name:sub?nm(sub):'',ppfd_range:N.light_norms.ppfd_umol_m2_s[lk].join('–'),species:names(P)};if(item){v.name=nm(item);v.species=nm(item);v.interval_weeks=item.trim_interval_weeks;v.mechanism=enumT('spread_mechanism',item.spread_mechanism||'none');v.interval_days=item.feeding_plan?item.feeding_plan.interval_days:7;v.items=item.feeding_plan?item.feeding_plan.items.join(', '):'';v.count_min=item.starter_count?item.starter_count.min:'';v.count_recommended=item.starter_count?item.starter_count.recommended:'';}return v;}
function cond(c){if(!c||c.always)return true;const P=selP(),F=selF();return Object.keys(c).every(k=>{const val=c[k];switch(k){case 'system_in':return val.includes(state.system);case 'substrate_in':return val.includes(currentSub());case 'any_plant':return P.some(p=>Object.keys(val).every(f=>p[f]===val[f]));case 'any_plant_flag':return P.some(p=>p[val]);case 'any_plant_habitat':return P.some(p=>p.habitat.includes(val));case 'any_fauna':return F.some(x=>Object.keys(val).every(f=>x[f]===val[f]));case 'any_fauna_role':return F.some(x=>x.role.some(r=>val.includes(r)));case 'no_fauna_role':return !F.some(x=>x.role.some(r=>val.includes(r)));case 'input_flag':return val==='has_grow_light_false'?!state.flags.grow:!!state.flags[{has_open_water:'water',has_wintering:'winter',has_grow_light:'grow'}[val]];case 'input_is':return state[val.field]===val.value;case 'light_corridor_has':return D.corridors.light.includes(val);case 'stone_any':return stones().some(s=>Object.keys(val).every(f=>s[f]===val[f]));case 'stone_prep_has':return stones().some(s=>(s.prep||[]).includes(val));case 'decor_any':return decor().some(d=>Object.keys(val).every(f=>d[f]===val[f]));default:return true;}});}
function renderCare(){const P=selP(),F=selF(),preset=DB.vessels.presets.find(v=>v.id===state.vessel.preset);$('#careSub').textContent=(preset?nm(preset):(lang==='ru'?'Своя ёмкость':'Custom'))+' · '+enumT('system_type',state.system)+' · '+fmt(D.volume)+' '+t('units.l');const blocks=[];DB.care_templates.templates.forEach(tpl=>{if(tpl.foreach){(tpl.foreach==='plants'?P:F).filter(o=>!tpl.filter||matchFilter(o,tpl.filter)).forEach(o=>blocks.push({tpl:tpl,vars:careVars(tpl,o)}));}else if(cond(tpl.when))blocks.push({tpl:tpl,vars:careVars(tpl)});});$('#careContent').innerHTML=DB.care_templates.sections.map(sec=>{const bs=blocks.filter(b=>b.tpl.section===sec.id);return bs.length?'<div class="care-card"><h3>'+t('care.section.'+sec.id)+'</h3>'+bs.map(b=>'<div class="care-item">'+t(b.tpl.text_key,b.vars)+'<span class="why">'+b.tpl.source+'</span></div>').join('')+'</div>':'';}).join('')||'<div class="empty"><div class="empty-orb"></div><p>'+t('state.empty_body')+'</p></div>';}
function renderDiag(){$('#diagSub').textContent=lang==='ru'?'Причины ранжируются под вашу сборку':'Causes ranked for your build';$('#diagContent').innerHTML=DB.diagnostics.symptoms.map(s=>{const causes=s.causes.map(c=>Object.assign({},c,{score:c.base_weight+c.boosts.reduce((a,b)=>a+(cond(b.when)?b.add:0),0)})).sort((a,b)=>b.score-a.score).slice(0,3);return '<div class="diag-item"><button class="diag-q" data-diag="'+s.id+'"><span>'+t('diag.'+s.id+'.name')+'</span></button><div class="diag-a">'+causes.map(c=>'<div class="cause"><div class="cause-title">'+t(c.cause_key)+'</div><div class="cause-fix">'+t(c.fix_key)+'</div><div class="cause-prev">'+t(c.prevention_key)+'</div></div>').join('')+'</div></div>';}).join('');}
function renderSaved(){const a=store.all();$('#savedContent').innerHTML=a.length?a.map(b=>'<div class="saved-card"><h3>'+esc(b.name)+'</h3><div class="saved-meta">'+new Date(b.created).toLocaleDateString(lang==='ru'?'ru-RU':'en-US')+' · '+b.state.items.length+' '+t('units.pcs')+'</div><div class="saved-actions"><button class="btn primary" data-load="'+b.id+'">'+t('btn.load')+'</button><button class="btn ghost" data-del="'+b.id+'">'+t('btn.delete')+'</button></div></div>').join(''):'<div class="empty"><div class="empty-orb"></div><p>'+t('saved.empty')+'</p></div>';}

function openDrawer(o){const im=o.image||{},note=t('notes.'+o.id),kv=(l,v)=>v?'<dt>'+l+'</dt><dd>'+v+'</dd>':'';$('#drawerBody').innerHTML=imgHTML(o,'drawer-photo')+'<h2 id="drawerTitle">'+nm(o)+'</h2><div class="latin">'+o.name_latin+'</div><div class="drawer-tags"><span class="tag care">'+t('group.'+o.group)+'</span>'+(o.size?'<span class="tag size">'+enumT('size',o.size)+'</span>':'')+(o.care_level?'<span class="tag light">'+enumT('care_level',o.care_level)+'</span>':'')+'</div>'+(note!=='notes.'+o.id?'<div class="drawer-note">'+note+'</div>':'')+'<dl class="kv">'+kv(t('input.system'),(o.system_type||[]).map(x=>enumT('system_type',x)).join(', '))+kv(enumT('light','shade')&&t('derived.light_corridor'),(o.light||[]).map(x=>enumT('light',x)).join(', '))+kv(FL.air_humidity[lang],(o.air_humidity||[]).map(x=>enumT('air_humidity',x)).join(', '))+kv(FL.soil_humidity[lang],(o.soil_humidity||[]).map(x=>enumT('soil_humidity',x)).join(', '))+kv(FL.temperature[lang],(o.temperature||[]).map(x=>enumT('temperature',x)).join(', '))+(o.role?kv(t('step.fauna'),o.role.map(x=>enumT('fauna_role',x)).join(', ')):'')+'</dl><div class="drawer-links"><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q='+encodeURIComponent(o.name_latin)+'">'+t('caption.search_google')+'</a><a class="btn ghost" target="_blank" rel="noopener" href="https://yandex.ru/images/search?text='+encodeURIComponent(o.name_latin)+'">'+t('caption.search_yandex')+'</a></div><div class="credit">'+(im.attribution||(im.author?t('caption.credit',{author:im.author,license:im.license})+' · <a href="'+im.source_url+'" target="_blank" rel="noopener">'+t('caption.source')+'</a>':t('caption.illustration')))+'</div><button class="btn primary" style="width:100%;margin-top:18px" data-add="'+o.id+'">'+(state.items.some(i=>i.id===o.id)?t('btn.remove'):t('btn.add'))+'</button>';show('drawer');}
function show(id){$('#'+id).classList.remove('hidden');$('#'+(id==='drawer'?'drawerScrim':id==='saveModal'?'saveScrim':'aiScrim')).classList.remove('hidden');}
function hide(id){$('#'+id).classList.add('hidden');$('#'+(id==='drawer'?'drawerScrim':id==='saveModal'?'saveScrim':'aiScrim')).classList.add('hidden');}
function toast(msg,undo){const el=document.createElement('div');el.className='toast';el.innerHTML='<span>'+esc(msg)+'</span>'+(undo?'<button type="button">'+(lang==='ru'?'Вернуть':'Undo')+'</button>':'');$('#toasts').append(el);if(undo)el.querySelector('button').onclick=()=>{undo();el.remove();};setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(10px)';setTimeout(()=>el.remove(),250);},undo?6000:3000);}
function aiPrompt(){const P=selP(),F=selF(),pl=p=>t('ai.plant_line',{name_ru:p.name_ru,latin:p.name_latin,layer:p.layer_form.map(x=>enumT('layer_form',x)).join('/'),growth:enumT('growth_rate',p.growth_rate),air:p.air_humidity.map(x=>enumT('air_humidity',x)).join('/'),cond:enumT('condensation',p.condensation)}),fa=f=>t('ai.fauna_line',{name_ru:f.name_ru,role:f.role.map(x=>enumT('fauna_role',x)).join('/'),interest:enumT('plant_interest',f.plant_interest)});let s=t('ai.prompt',{volume:fmt(D.volume),system:enumT('system_type',state.system),shape:enumT('vessel_shape',state.vessel.shape),placement:enumT('placement',state.placement),water:enumT('water_type',state.water),substrate:subObj()?nm(subObj()):'—',hardscape:stones().concat(decor()).map(nm).join(', ')||'—',plants:P.map(pl).join('\n')||'—',fauna:F.map(fa).join('\n')||'—'});return s.length>2000?s.slice(0,1997)+'…':s;}
function openAI(){$('#aiPrompt').value=aiPrompt();$('#aiHint').textContent=t('toast.ai_copied');$('#aiTargets').innerHTML='<button class="ai-target" data-ai="google">'+t('ai.target_google')+'</button><button class="ai-target" data-ai="perplexity">'+t('ai.target_perplexity')+'</button>';show('aiModal');}
async function copyText(s){try{await navigator.clipboard.writeText(s);return true;}catch(e){const ta=document.createElement('textarea');ta.value=s;document.body.append(ta);ta.select();try{document.execCommand('copy');}catch(x){}ta.remove();return true;}}

function update(){D=derive();const hits=evaluate();if(state.view==='builder'){renderCatalog();renderJar(hits);syncRanges();}if(state.view==='care')renderCare();if(state.view==='diag')renderDiag();if(state.view==='saved')renderSaved();renderMobile();}
function setView(v){state.view=v;$$('.view').forEach(x=>x.classList.add('hidden'));const el=$('#view-'+v);if(el)el.classList.remove('hidden');$$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===v));update();window.scrollTo({top:0,behavior:'smooth'});}
function addItem(id){const o=DB.plants.concat(DB.fauna).find(x=>x.id===id);if(!o)return;const idx=state.items.findIndex(i=>i.id===id);if(idx>=0){removeItem(idx);return;}state.items.push({kind:o.id.indexOf('plant_')===0?'plant':'fauna',id:id});update();toast(nm(o)+' ✓');}
function removeItem(idx){const it=state.items[idx],o=obj(it);state.items.splice(idx,1);update();toast(nm(o)+' — '+t('btn.remove').toLowerCase(),()=>{state.items.splice(idx,0,it);update();});}

document.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-view],[data-view-link]');if(nav){e.preventDefault();setView(nav.dataset.view||nav.dataset.viewLink);return;}
  const add=e.target.closest('[data-add]');if(add){addItem(add.dataset.add);if(!$('#drawer').classList.contains('hidden'))hide('drawer');return;}
  const open=e.target.closest('[data-open]');if(open&&!e.target.closest('button')){const o=DB.plants.concat(DB.fauna).find(x=>x.id===open.dataset.open);if(o)openDrawer(o);return;}
  const rm=e.target.closest('[data-rm]');if(rm){removeItem(+rm.dataset.rm);return;}
  const tab=e.target.closest('[data-tab]');if(tab){state.filters.tab=tab.dataset.tab;state.filters.group='all';update();return;}
  const gr=e.target.closest('[data-group]');if(gr){state.filters.group=gr.dataset.group;update();return;}
  const sys=e.target.closest('[data-sys]');if(sys){state.system=sys.dataset.sys;renderConfig();update();return;}
  const exp=e.target.closest('[data-exp]');if(exp){state.experience=exp.dataset.exp;renderConfig();update();return;}
  const rs=e.target.closest('[data-rm-stone]');if(rs){state.stones=state.stones.filter(x=>x!==rs.dataset.rmStone);renderConfig();update();return;}
  const rd=e.target.closest('[data-rm-decor]');if(rd){state.decor=state.decor.filter(x=>x!==rd.dataset.rmDecor);renderConfig();update();return;}
  if(e.target.closest('#langBtn')){lang=lang==='ru'?'en':'ru';localStorage.setItem('flor.lang',lang);buildStatic();update();return;}
  if(e.target.closest('#careBtn')||e.target.closest('#mobileVerdict')){setView('care');return;}
  if(e.target.closest('#saveBtn')){$('#saveName').value='';show('saveModal');return;}
  if(e.target.closest('#saveCancel')){hide('saveModal');return;}
  if(e.target.closest('#saveConfirm')){store.save($('#saveName').value.trim()||t('saved.name_placeholder'));hide('saveModal');toast(t('toast.saved'));return;}
  if(e.target.closest('#shareBtn')){const q=encodeState().toString();await copyText(location.origin+location.pathname+'?'+q);history.replaceState(null,'','?'+q);toast(t('toast.link_copied'));return;}
  if(e.target.closest('#aiBtn')){openAI();return;}
  if(e.target.closest('#aiClose')){hide('aiModal');return;}
  if(e.target.closest('#aiCopy')){await copyText($('#aiPrompt').value);toast(t('toast.ai_copied'));return;}
  const at=e.target.closest('[data-ai]');if(at){const s=$('#aiPrompt').value;await copyText(s);window.open(at.dataset.ai==='google'?'https://www.google.com/search?udm=50&q='+encodeURIComponent(s):'https://www.perplexity.ai/?q='+encodeURIComponent(s),'_blank','noopener');toast(t('toast.ai_copied'));return;}
  if(e.target.closest('#drawerClose')||e.target.id==='drawerScrim'){hide('drawer');return;}
  if(e.target.id==='saveScrim'){hide('saveModal');return;}
  if(e.target.id==='aiScrim'){hide('aiModal');return;}
  const dg=e.target.closest('[data-diag]');if(dg){dg.closest('.diag-item').classList.toggle('open');return;}
  const ld=e.target.closest('[data-load]');if(ld){store.load(ld.dataset.load);setView('builder');return;}
  const dl=e.target.closest('[data-del]');if(dl){store.del(dl.dataset.del);renderSaved();toast(t('toast.deleted'));return;}
  if(e.target.closest('#exportBtn')){const blob=new Blob([JSON.stringify(store.all(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='florarium-builds.json';a.click();URL.revokeObjectURL(a.href);return;}
});
document.addEventListener('input',e=>{if(e.target.id==='searchInput'){state.filters.q=e.target.value;renderCatalog();return;}if(e.target.id==='volRange'){const target=+e.target.value;state.vessel.height=Math.max(8,Math.round(state.vessel.height*(target/(D.volume||1))));state.vessel.preset='custom';renderConfig();update();return;}if(e.target.id==='hRange'){state.vessel.height=+e.target.value;state.vessel.preset='custom';syncRanges();update();return;}});
document.addEventListener('change',e=>{const id=e.target.id;if(id==='vesselSelect'){const p=DB.vessels.presets.find(x=>x.id===e.target.value);if(p){Object.assign(state.vessel,{preset:p.id,shape:p.shape,closure:p.closure_default,neck:p.neck_diameter_cm||null,volumeLabel:p.volume_liters_label||null},p.dims_cm);if(!p.systems.includes(state.system))state.system=p.systems[0];}renderConfig();update();return;}if(id==='placeSelect'){state.placement=e.target.value;update();return;}if(id==='waterSelect'){state.water=e.target.value;update();return;}if(id==='styleSelect'){state.style=e.target.value;state.filters.group='all';update();return;}if(id==='sortSelect'){state.filters.sort=e.target.value;renderCatalog();return;}if(id==='stoneSelect'&&e.target.value){if(!state.stones.includes(e.target.value))state.stones.push(e.target.value);renderConfig();update();return;}if(id==='decorSelect'&&e.target.value){if(!state.decor.includes(e.target.value))state.decor.push(e.target.value);renderConfig();update();return;}if(e.target.dataset.flag){state.flags[e.target.dataset.flag]=e.target.checked;update();return;}if(id==='importFile'){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const a=JSON.parse(r.result);if(Array.isArray(a)){localStorage.setItem('florarium.builds.v1',JSON.stringify(a));renderSaved();toast(t('toast.imported'));}}catch(x){toast(t('toast.import_error'));}};r.readAsText(f);return;}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')['drawer','saveModal','aiModal'].forEach(hide);});
document.addEventListener('dragstart',e=>{const r=e.target.closest('.sel-row');if(r){dragIdx=+r.dataset.idx;r.classList.add('dragging');}});
document.addEventListener('dragend',e=>{const r=e.target.closest('.sel-row');if(r)r.classList.remove('dragging');});
document.addEventListener('dragover',e=>{if(e.target.closest('.sel-row'))e.preventDefault();});
document.addEventListener('drop',e=>{const r=e.target.closest('.sel-row');if(r&&dragIdx!=null){const to=+r.dataset.idx,it=state.items.splice(dragIdx,1)[0];state.items.splice(to,0,it);dragIdx=null;update();}});
boot();
