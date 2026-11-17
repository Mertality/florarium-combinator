/*! Florarium · Living Studio — SVG scene engine. Требует window.__fc. */
(function(){
  'use strict';
  if(window.__studioInit)return;window.__studioInit=true;
  const B=()=>window.__fc||null;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const esc=s=>String(s==null?'':s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  const rnd=s=>{let x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const PAL={
    day:{key:'#FFF3D6',fill:'#CFE4FF',amb:'#F3EEE2',sky0:'#EFE9DC',sky1:'#DFD8C7',beam:.30,tint:'#FFF6E4',tintA:.10},
    sunset:{key:'#FFB877',fill:'#FF8FA8',amb:'#F6DFC8',sky0:'#F3DCC6',sky1:'#D9B79E',beam:.42,tint:'#FF9E6B',tintA:.16},
    lamp:{key:'#FF62D8',fill:'#4FA8FF',amb:'#E4D6F2',sky0:'#E7DEF0',sky1:'#C9BED8',beam:.46,tint:'#E85CD0',tintA:.16},
    night:{key:'#9FC4FF',fill:'#6E86C8',amb:'#C9D6EE',sky0:'#1B2233',sky1:'#0E1420',beam:.24,tint:'#5C7CC0',tintA:.20}
  };
  const GREEN={mosses:['#6E9B57','#8CB86B'],ferns:['#4E8A5A','#6FAE68'],foliage:['#7FB86B','#A8D48A'],vines:['#5F9E63','#84BE72'],orchids:['#7E9BB8','#A8C2D8'],bromeliads:['#7FA86B','#A6C77F'],carnivores:['#A8C05A','#C8DC7A'],flowering:['#8FB86B','#B4D48A'],succulents:['#9CB88F','#C0D6AE']};
  const ACC={orchids:'#C86FB0',flowering:'#E08BB0',carnivores:'#C85A4A',bromeliads:'#D96A5A',succulents:'#D9A08B',foliage:'#D98BA8'};
  const sizeCm=s=>s==='micro'?4:s==='large'?18:11;
  const habitOf=p=>{const l=p.layer_form||[];if(l.length===1&&l[0]==='mount')return 'mount';if(l.some(x=>x==='bush'||x==='accent'))return 'upright';if(l.indexOf('vine')>=0)return 'trailing';return 'groundcover';};
  const kindOf=p=>{
    const g=p.group,id=p.id||'';
    if(/drosera|pinguicula/.test(id))return 'sundew';
    if(/dionaea/.test(id))return 'trap';
    if(/nepenthes/.test(id))return 'pitcher';
    if(g==='mosses')return 'moss';
    if(g==='ferns')return 'fern';
    if(g==='succulents')return /rhipsalis|hoya|ceropegia|dischidia/.test(id)?'vine':'succ';
    if(g==='orchids')return /mini_epiphytes/.test(id)?'epi':'jewel';
    if(g==='bromeliads')return /tillandsia/.test(id)?'air':'brom';
    if(g==='vines')return 'vine';
    if(g==='carnivores')return 'sundew';
    if(habitOf(p)==='groundcover')return 'carpet';
    if(g==='flowering')return 'bloom';
    return 'rosette';
  };
  function vesselPath(shape,x,y,w,h){
    const r=Math.min(w,h)*.09;
    switch(shape){
      case 'bowl':{const ry=w*.34;return `M${x},${y} L${x},${y+h-ry} Q${x},${y+h} ${x+w/2},${y+h} Q${x+w},${y+h} ${x+w},${y+h-ry} L${x+w},${y} Z`;}
      case 'sphere':{const cx=x+w/2,cy=y+h/2,r0=Math.min(w,h)/2;return `M${cx-r0},${cy} A${r0},${r0} 0 1,1 ${cx+r0},${cy} A${r0},${r0} 0 1,1 ${cx-r0},${cy} Z`;}
      case 'cube':case 'tank':return `M${x},${y} H${x+w} V${y+h} H${x} Z`;
      case 'bottle':{const nW=w*.38,nX=x+(w-nW)/2,nH=h*.24;return `M${nX},${y} L${nX},${y+nH} Q${x},${y+nH+h*.09} ${x},${y+nH+h*.2} L${x},${y+h-r} Q${x},${y+h} ${x+r},${y+h} L${x+w-r},${y+h} Q${x+w},${y+h} ${x+w},${y+h-r} L${x+w},${y+nH+h*.2} Q${x+w},${y+nH+h*.09} ${nX+nW},${y+nH} L${nX+nW},${y} Z`;}
      case 'geo_house':{const pk=h*.36;return `M${x+w/2},${y} L${x+w},${y+pk} L${x+w},${y+h} L${x},${y+h} L${x},${y+pk} Z`;}
      default:return `M${x+r*.5},${y} H${x+w-r*.5} Q${x+w},${y} ${x+w},${y+r} L${x+w},${y+h-r} Q${x+w},${y+h} ${x+w-r},${y+h} L${x+r},${y+h} Q${x},${y+h} ${x},${y+h-r} L${x},${y+r} Q${x},${y} ${x+r*.5},${y} Z`;
    }
  }
  /* ── plant shapes ── */
  function plantShape(kind,c1,c2,acc,q){
    const L=(d,f,o)=>`<path d="${d}" fill="${f}" opacity="${o==null?1:o}"/>`;
    let s='';
    if(kind==='moss'){
      for(let i=0;i<(q>1?7:4);i++){const x=-9+i*3.1,h=4+rnd(i*3)*3;s+=`<ellipse cx="${x}" cy="${-h*.5}" rx="3.4" ry="${h*.7}" fill="${i%2?c2:c1}"/>`;}
      s+=`<ellipse cx="0" cy="-1" rx="11" ry="3" fill="${c1}" opacity=".85"/>`;
    } else if(kind==='carpet'){
      for(let i=0;i<(q>1?11:6);i++){const x=-13+i*2.6,h=3+rnd(i*7)*3.4;s+=`<path d="M${x},0 Q${x-2},${-h} ${x},${-h-1.6} Q${x+2},${-h} ${x},0" fill="${i%2?c2:c1}"/><circle cx="${x}" cy="${-h-1.9}" r="1.5" fill="${i%3?c2:c1}"/>`;}
    } else if(kind==='fern'){
      for(let i=0;i<(q>1?5:3);i++){const a=-52+i*26,len=20+rnd(i*5)*7,ex=Math.sin(a*Math.PI/180)*len,ey=-Math.cos(a*Math.PI/180)*len;
        s+=`<path d="M0,0 Q${ex*.4},${ey*.6} ${ex},${ey}" stroke="${c1}" stroke-width="1.1" fill="none"/>`;
        for(let k=1;k<=(q>1?6:3);k++){const tt=k/(q>1?7:4),px=ex*tt,py=ey*tt,r=2.6*(1-tt*.5);s+=`<ellipse cx="${px-r*.7}" cy="${py}" rx="${r}" ry="${r*.5}" fill="${c2}" transform="rotate(${a*.5} ${px-r*.7} ${py})"/><ellipse cx="${px+r*.7}" cy="${py}" rx="${r}" ry="${r*.5}" fill="${c1}" transform="rotate(${a*.5} ${px+r*.7} ${py})"/>`;}
      }
    } else if(kind==='rosette'||kind==='bloom'){
      for(let i=0;i<(q>1?7:5);i++){const a=-72+i*24,len=15+rnd(i*11)*6,ex=Math.sin(a*Math.PI/180)*len,ey=-Math.cos(a*Math.PI/180)*len;
        s+=`<path d="M0,0 Q${ex*.5-3},${ey*.55} ${ex},${ey} Q${ex*.5+3},${ey*.55} 0,0" fill="${i%2?c2:c1}"/><path d="M0,0 L${ex*.92},${ey*.92}" stroke="${acc}" stroke-width=".5" opacity=".55"/>`;}
      if(kind==='bloom')for(let i=0;i<3;i++){const a=-30+i*30;s+=`<circle cx="${Math.sin(a*Math.PI/180)*13}" cy="${-20-rnd(i)*4}" r="2.6" fill="${acc}"/><circle cx="${Math.sin(a*Math.PI/180)*13}" cy="${-20-rnd(i)*4}" r="1" fill="#FFF3D6"/>`;}
    } else if(kind==='succ'){
      for(let i=0;i<(q>1?9:6);i++){const a=-90+i*(180/(q>1?8:5)),len=10+rnd(i*13)*4,ex=Math.sin(a*Math.PI/180)*len,ey=-Math.cos(a*Math.PI/180)*len*.7-2;
        s+=`<path d="M0,-1 Q${ex*.6-2.4},${ey*.6} ${ex},${ey} Q${ex*.6+2.4},${ey*.6} 0,-1" fill="${i%2?c2:c1}"/><circle cx="${ex}" cy="${ey}" r=".9" fill="${acc}"/>`;}
    } else if(kind==='vine'||kind==='pitcher'){
      s+=`<path d="M0,0 Q-6,-14 2,-26 Q9,-38 1,-50" stroke="${c1}" stroke-width="1.4" fill="none"/>`;
      for(let i=0;i<(q>1?7:4);i++){const tt=(i+1)/(q>1?8:5),y=-50*tt,x=(i%2?1:-1)*(4+rnd(i*3)*3);
        s+=`<path d="M${x*.3},${y} Q${x-3},${y-4} ${x},${y-6} Q${x+3},${y-3} ${x*.3},${y}" fill="${i%2?c2:c1}"/>`;
        if(kind==='pitcher'&&i%2===0&&i>1)s+=`<path d="M${x},${y-1} q-3,3 -2,7 q1,4 4,4 q3,0 4,-4 q1,-4 -2,-7 z" fill="${acc}" opacity=".9"/><ellipse cx="${x+2}" cy="${y-1.5}" rx="2.6" ry="1" fill="${c2}"/>`;}
    } else if(kind==='sundew'){
      for(let i=0;i<(q>1?8:5);i++){const a=-80+i*20,len=8+rnd(i*17)*3,ex=Math.sin(a*Math.PI/180)*len,ey=-Math.cos(a*Math.PI/180)*len*.55-1;
        s+=`<path d="M0,0 L${ex},${ey}" stroke="${c1}" stroke-width="1"/><circle cx="${ex}" cy="${ey}" r="2.2" fill="${c2}"/>`;
        for(let k=0;k<(q>1?4:2);k++){const aa=k*1.6;s+=`<circle cx="${ex+Math.cos(aa)*2.6}" cy="${ey+Math.sin(aa)*2.6}" r=".65" fill="#DFF3FF" opacity=".95"/>`;}
      }
    } else if(kind==='trap'){
      for(let i=0;i<(q>1?6:4);i++){const a=-70+i*28,len=9+rnd(i*19)*3,ex=Math.sin(a*Math.PI/180)*len,ey=-Math.cos(a*Math.PI/180)*len*.6-1;
        s+=`<path d="M0,0 L${ex},${ey}" stroke="${c1}" stroke-width="1.1"/><ellipse cx="${ex}" cy="${ey}" rx="3" ry="2.2" fill="${c2}"/><ellipse cx="${ex}" cy="${ey}" rx="2" ry="1.3" fill="${acc}"/><path d="M${ex-3},${ey} l-1.4,-1.6 M${ex+3},${ey} l1.4,-1.6 M${ex-3},${ey+.4} l-1.4,1.6 M${ex+3},${ey+.4} l1.4,1.6" stroke="${c1}" stroke-width=".6"/>`;}
    } else if(kind==='jewel'){
      for(let i=0;i<(q>1?6:4);i++){const a=-64+i*32,len=10+rnd(i*23)*3,ex=Math.sin(a*Math.PI/180)*len,ey=-Math.cos(a*Math.PI/180)*len*.6-1;
        s+=`<path d="M0,0 Q${ex*.5-2.6},${ey*.6} ${ex},${ey} Q${ex*.5+2.6},${ey*.6} 0,0" fill="${i%2?c2:c1}"/><path d="M0,0 L${ex*.9},${ey*.9}" stroke="${acc}" stroke-width=".55"/><path d="M${ex*.4},${ey*.4} l2,-1.4 M${ex*.65},${ey*.65} l2,-1.4" stroke="${acc}" stroke-width=".4"/>`;}
      s+=`<path d="M2,-4 L3,-17" stroke="${c2}" stroke-width=".7"/><circle cx="3" cy="-18" r="1.3" fill="#FFF3D6"/>`;
    } else if(kind==='brom'||kind==='air'){
      for(let i=0;i<(q>1?9:6);i++){const a=-86+i*(172/(q>1?8:5)),len=13+rnd(i*29)*5,ex=Math.sin(a*Math.PI/180)*len,ey=-Math.cos(a*Math.PI/180)*len*.8-1;
        s+=`<path d="M0,0 Q${ex*.55-1.8},${ey*.6} ${ex},${ey} Q${ex*.55+1.8},${ey*.6} 0,0" fill="${i%2?c2:c1}"/>`;}
      if(kind==='brom')s+=`<ellipse cx="0" cy="-4" rx="3.4" ry="4.4" fill="${acc}"/><ellipse cx="0" cy="-5" rx="1.8" ry="2.6" fill="#FFF3D6" opacity=".6"/>`;
    } else if(kind==='epi'){
      s+=`<path d="M0,0 Q-5,-9 -2,-16 Q2,-22 -1,-28" stroke="${c1}" stroke-width="1.1" fill="none"/>`;
      for(let i=0;i<(q>1?6:4);i++){const y=-6-i*4.2,x=(i%2?1:-1)*3.6;s+=`<ellipse cx="${x}" cy="${y}" rx="3" ry="1.9" fill="${i%2?c2:c1}" transform="rotate(${i%2?18:-18} ${x} ${y})"/>`;}
      s+=`<circle cx="-1" cy="-29" r="2" fill="${acc}"/>`;
    } else {
      s+=`<ellipse cx="0" cy="-7" rx="7" ry="8" fill="${c1}"/>`;
    }
    return s;
  }
  /* ── scene build ── */
  function build(host,mode){
    const b=B();if(!b||!b.state||!b.D||!b.DB||!b.DB.plants)return null;
    const st=b.state,D=b.D,DB=b.DB,S=st.studio;
    const q=mode==='stage'?(S.detail==='high'?2:S.detail==='med'?1:0):(mode==='hero'?1:0);
    const W=1000,H=mode==='stage'?700:mode==='hero'?460:520;
    const v=st.vessel,hCm=+v.height||20,wide=['cube','tank','geo_house'].includes(v.shape);
    const wCm=wide?(+v.width||20):(+v.diameter||14);
    const pad=mode==='stage'?90:52;
    const sc=Math.min((W-pad*2)/wCm,(H-pad*2)/hCm);
    const vw=wCm*sc,vh=hCm*sc,vx=(W-vw)/2,vy=H-pad-vh,by=vy+vh;
    const drain=(D.drainage||2)*sc,ch=((DB.norms.layers.charcoal&&DB.norms.layers.charcoal.thickness_cm[0])||.5)*sc,sep=.3*sc,sub=(D.depth||5)*sc,top=.4*sc;
    const dY=by-drain,cY=dY-ch,sY=cY-sep,subTop=sY-sub,topY=subTop-top;
    const uid=host.dataset.uid,path=vesselPath(v.shape,vx,vy,vw,vh);
    const P=DB.plants.filter(p=>st.items.some(i=>i.id===p.id)).slice(0,q>1?12:q?9:6);
    const F=DB.fauna.filter(f=>st.items.some(i=>i.id===f.id));
    const pal=PAL[S.palette]||PAL.day;
    const dark=document.documentElement.getAttribute('data-theme')==='dark';
    const sky0=dark?(S.palette==='night'?'#0A0F1A':'#0D1207'):pal.sky0;
    const sky1=dark?(S.palette==='night'?'#05080F':'#161D0F'):pal.sky1;
    let defs=`<linearGradient id="${uid}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky0}"/><stop offset="1" stop-color="${sky1}"/></linearGradient>
      <linearGradient id="${uid}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".26"/><stop offset=".42" stop-color="${pal.fill}" stop-opacity=".10"/><stop offset="1" stop-color="#ffffff" stop-opacity=".16"/></linearGradient>
      <linearGradient id="${uid}beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.key}" stop-opacity=".85"/><stop offset="1" stop-color="${pal.key}" stop-opacity="0"/></linearGradient>
      <linearGradient id="${uid}soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A412C"/><stop offset="1" stop-color="#33241A"/></linearGradient>
      <linearGradient id="${uid}drain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FB0A2"/><stop offset="1" stop-color="#6E7F72"/></linearGradient>
      <linearGradient id="${uid}fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF6EA" stop-opacity="0"/><stop offset="1" stop-color="#EAF6EA" stop-opacity=".72"/></linearGradient>
      <linearGradient id="${uid}water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.fill}" stop-opacity=".75"/><stop offset="1" stop-color="#2E5A72" stop-opacity=".85"/></linearGradient>
      <radialGradient id="${uid}glow"><stop offset="0" stop-color="${pal.key}" stop-opacity=".85"/><stop offset="1" stop-color="${pal.key}" stop-opacity="0"/></radialGradient>
      <clipPath id="${uid}clip"><path d="${path}"/></clipPath>
      <filter id="${uid}soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${q>1?9:5}"/></filter>`;
    let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="scene${S.ghost?' gh':''}" role="img" aria-label="${esc(st.vessel.shape)} ${esc(String(Math.round(D.volume*10)/10))} L">`;
    s+=`<defs>${defs}</defs><style>
      .gh .fillable{fill:none!important;stroke:${dark?'#C2DE9F':'#4C6B44'};stroke-width:.7;opacity:.85}
      .gh .nofill{display:none}
      text{font-family:Manrope,system-ui,sans-serif;font-weight:700}
    </style>`;
    s+=`<rect width="${W}" height="${H}" fill="url(#${uid}sky)" class="nofill"/>`;
    /* backdrop glow */
    s+=`<ellipse class="glowEl nofill" cx="${vx+vw*.5}" cy="${vy+vh*.2}" rx="${vw*.9}" ry="${vh*.7}" fill="url(#${uid}glow)" opacity=".2"/>`;
    /* ground shadow */
    s+=`<ellipse cx="${vx+vw/2}" cy="${by+10}" rx="${vw*.56}" ry="${Math.max(6,vh*.035)}" fill="#000" opacity="${dark?.4:.16}" filter="url(#${uid}soft)" class="nofill"/>`;
    /* rays */
    s+=`<g class="rays nofill" clip-path="url(#${uid}clip)">`;
    for(let i=0;i<(q>1?4:2);i++)s+=`<polygon class="ray" data-i="${i}" points="0,0 0,0 0,0 0,0" fill="url(#${uid}beam)" opacity=".3"/>`;
    s+=`</g>`;
    s+=`<g clip-path="url(#${uid}clip)">`;
    s+=`<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${pal.amb}" opacity="${dark?.10:.22}" class="nofill"/>`;
    /* layers */
    s+=`<rect class="fillable" x="${vx}" y="${dY}" width="${vw}" height="${by-dY}" fill="url(#${uid}drain)"/>`;
    const peb=q>1?26:q?16:9;
    for(let i=0;i<peb;i++){const px=vx+6+rnd(i*3.3)*(vw-12),py=dY+3+rnd(i*7.7)*Math.max(2,(by-dY)-6),r=2.2+rnd(i*11)*3.2;
      s+=`<circle class="fillable" cx="${px}" cy="${py}" r="${r}" fill="${i%3?'#B6C4B4':'#8C9E8E'}" opacity=".9"/>`;}
    s+=`<rect class="fillable" x="${vx}" y="${cY}" width="${vw}" height="${dY-cY}" fill="#2B2B26"/>`;
    for(let i=0;i<(q>1?16:8);i++){const px=vx+rnd(i*5.1)*vw,py=cY+rnd(i*9.3)*Math.max(1,dY-cY);s+=`<path class="fillable" d="M${px},${py} l3,-1.6 l2.4,2 l-2.6,1.8 z" fill="#4A4A42"/>`;}
    s+=`<rect class="fillable" x="${vx}" y="${sY}" width="${vw}" height="${cY-sY}" fill="#D9CDB8"/>`;
    s+=`<path class="fillable" d="M${vx},${sY+1} H${vx+vw}" stroke="#B7A98F" stroke-width=".8" stroke-dasharray="4 3"/>`;
    s+=`<rect class="fillable" x="${vx}" y="${subTop}" width="${vw}" height="${sY-subTop}" fill="url(#${uid}soil)"/>`;
    for(let i=0;i<(q>1?60:q?32:16);i++){const px=vx+rnd(i*13.1)*vw,py=subTop+rnd(i*17.3)*Math.max(2,sY-subTop);s+=`<circle class="fillable" cx="${px}" cy="${py}" r="${.7+rnd(i*3)*1.3}" fill="${i%2?'#6B4E33':'#2A1D14'}" opacity=".8"/>`;}
    s+=`<rect class="fillable" x="${vx}" y="${topY}" width="${vw}" height="${subTop-topY}" fill="#5F8455"/>`;
    /* water zone */
    if(st.flags.water){const wy=by-vh*.26;
      s+=`<rect class="fillable" x="${vx}" y="${wy}" width="${vw*.42}" height="${by-wy}" fill="url(#${uid}water)"/>`;
      for(let i=0;i<3;i++)s+=`<path class="wave nofill" data-i="${i}" d="M${vx},${wy+4+i*6} H${vx+vw*.42}" stroke="#EAF6FF" stroke-width="1" opacity=".4" fill="none"/>`;}
    /* hardscape */
    const stones=st.stones.map(id=>DB.materials.stones.find(x=>x.id===id)).filter(Boolean).slice(0,3);
    stones.forEach((x0,i)=>{const px=vx+vw*(i+1)/(stones.length+1),hh=vh*(.14+rnd(i*31)*.12),ww=vw*.13;
      s+=`<path class="fillable" d="M${px-ww},${subTop} L${px-ww*.55},${subTop-hh} L${px+ww*.2},${subTop-hh*.85} L${px+ww},${subTop} Z" fill="${dark?'#7C8478':'#9AA096'}" stroke="${dark?'#4A5246':'#6E746A'}" stroke-width="1"/>`;
      s+=`<path class="fillable" d="M${px-ww*.5},${subTop-hh*.55} L${px+ww*.1},${subTop-hh*.62}" stroke="${dark?'#5C6458':'#7C8278'}" stroke-width=".8" opacity=".8"/>`;});
    const wood=st.decor.map(id=>DB.materials.decor.find(x=>x.id===id)).filter(d=>d&&d.is_mount)[0];
    const mountY=subTop-vh*.38;
    if(wood)s+=`<path class="fillable" d="M${vx+vw*.12},${mountY+8} Q${vx+vw*.45},${mountY-10} ${vx+vw*.88},${mountY+4}" stroke="#6B4A30" stroke-width="${Math.max(4,vh*.022)}" fill="none" stroke-linecap="round"/>`;
    /* litter */
    if(st.decor.some(id=>{const d=DB.materials.decor.find(x=>x.id===id);return d&&d.is_feeding;}))
      for(let i=0;i<(q>1?9:5);i++){const px=vx+8+rnd(i*23)*(vw-16);s+=`<path class="fillable" d="M${px},${topY-1} q4,-3 8,-.6 q-4,3 -8,.6 z" fill="#8A6A3E" opacity=".9"/>`;}
    /* plants */
    s+=`<g class="plants">`;
    const order=P.slice().sort((a,b)=>{const w=x=>habitOf(x)==='groundcover'?0:habitOf(x)==='mount'?2:1;return w(a)-w(b);});
    const plants=[];
    order.forEach((p,i)=>{
      const hb=habitOf(p),kind=kindOf(p),g=GREEN[p.group]||GREEN.foliage,acc=ACC[p.group]||'#D98BA8';
      const n=order.length;
      let px,py,base;
      if(hb==='mount'){px=vx+vw*(.28+.44*(i/Math.max(1,n-1)));py=wood?mountY+2:subTop-vh*.3;base=sizeCm(p.size)*sc*.055;}
      else if(hb==='trailing'){px=vx+vw*(.14+.72*(i/Math.max(1,n-1)));py=vy+vh*.06;base=sizeCm(p.size)*sc*.05;}
      else{px=vx+vw*(.12+.76*((i+.5)/n));py=hb==='groundcover'?topY+1:subTop+1;base=sizeCm(p.size)*sc*.062;}
      const flip=rnd(i*41)>.5?-1:1;
      s+=`<g class="pl" data-i="${plants.length}" transform="translate(${px} ${py}) scale(${base*flip} ${base})">${plantShape(kind,g[0],g[1],acc,q)}</g>`;
      plants.push({i:plants.length,x:px,y:py,base,flip,hb,rate:p.growth_rate||'medium',hcm:p.height_cm||10,phase:rnd(i*61)*6.28});
    });
    s+=`</g>`;
    /* fauna */
    s+=`<g class="fauna nofill">`;
    const fauna=[];let fi=0;
    F.forEach((f,gi)=>{
      const n=clamp(Math.round((f.starter_count&&f.starter_count.recommended)||4),2,q>1?7:q?4:2);
      for(let k=0;k<n;k++){
        const isIso=(f.adult_size==='large'||f.adult_size==='small'),r=isIso?3.1:1.5;
        const x0=vx+10+rnd(fi*7.7)*(vw-20),y0=topY-2-rnd(fi*3.1)*(hbMax(plants,vy)*.2);
        if(f.id&&f.id.indexOf('snails')>=0)
          s+=`<g class="fn" data-i="${fi}"><circle r="4" fill="#C9B08A"/><path d="M0,0 a3,3 0 1,1 -2,-2.4" stroke="#8A7048" stroke-width=".9" fill="none"/></g>`;
        else if(isIso)
          s+=`<g class="fn" data-i="${fi}"><ellipse rx="${r}" ry="${r*.62}" fill="#4A4640"/><path d="M-${r*.5},-${r*.3} v${r*.6} M0,-${r*.4} v${r*.8} M${r*.5},-${r*.3} v${r*.6}" stroke="#7A746A" stroke-width=".5"/></g>`;
        else s+=`<circle class="fn" data-i="${fi}" r="${r}" fill="#EDE6D6" opacity=".95"/>`;
        fauna.push({i:fi,x0,y0,r,sp:.35+rnd(fi*13)*.9,ph:rnd(fi*19)*6.28,hop:!isIso});
        fi++;
      }
    });
    s+=`</g>`;
    /* fog + drops + tint */
    s+=`<rect class="fog nofill" x="${vx}" y="${vy+vh*.42}" width="${vw}" height="${vh*.58}" fill="url(#${uid}fog)" opacity=".2"/>`;
    s+=`<g class="drops nofill">`;
    const drops=[];
    for(let i=0;i<(q>1?24:q?16:10);i++){
      const dx=vx+6+rnd(i*29)*(vw-12),dy=vy+8+rnd(i*37)*(vh*.7),r=1.4+rnd(i*43)*2.8;
      s+=`<g class="dp" data-i="${i}"><ellipse rx="${r}" ry="${r*1.25}" fill="#F2FBFF" opacity=".55"/><ellipse cx="${-r*.3}" cy="${-r*.4}" rx="${r*.3}" ry="${r*.4}" fill="#fff" opacity=".9"/></g>`;
      drops.push({i,x:dx,y:dy,r,sp:.15+rnd(i*53)*.5,ph:rnd(i*59)*6.28});
    }
    s+=`</g>`;
    s+=`<rect class="tint nofill" x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${pal.tint}" opacity=".1"/>`;
    s+=`<rect class="night nofill" x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#0A1020" opacity="0"/>`;
    s+=`</g>`;
    /* glass */
    s+=`<path class="glass fillable" d="${path}" fill="url(#${uid}glass)" stroke="${dark?'#CFE6C0':'#7F9E6B'}" stroke-width="2.2" stroke-linejoin="round" opacity=".9"/>`;
    s+=`<path class="spec nofill" d="M${vx+vw*.1},${vy+vh*.12} Q${vx+vw*.04},${vy+vh*.5} ${vx+vw*.12},${vy+vh*.82}" stroke="#fff" stroke-width="${Math.max(3,vw*.022)}" opacity=".28" fill="none" stroke-linecap="round"/>`;
    s+=`<path class="spec2 nofill" d="M${vx+vw*.86},${vy+vh*.2} Q${vx+vw*.93},${vy+vh*.5} ${vx+vw*.85},${vy+vh*.74}" stroke="#fff" stroke-width="${Math.max(1.5,vw*.01)}" opacity=".16" fill="none" stroke-linecap="round"/>`;
    if(v.shape==='jar'||v.shape==='bottle'||v.shape==='sphere')s+=`<ellipse class="fillable" cx="${vx+vw/2}" cy="${vy+2}" rx="${vw*(v.shape==='bottle'?.2:.46)}" ry="${Math.max(3,vh*.018)}" fill="none" stroke="${dark?'#CFE6C0':'#7F9E6B'}" stroke-width="2"/>`;
    if(v.shape==='geo_house'){s+=`<path class="fillable" d="M${vx+vw/2},${vy} L${vx+vw/2},${vy+vh*.36} M${vx},${vy+vh*.36} H${vx+vw}" stroke="${dark?'#CFE6C0':'#7F9E6B'}" stroke-width="1.6" opacity=".7" fill="none"/>`;}
    /* lamp */
    if(st.flags.grow)s+=`<g class="lamp nofill"><rect x="${vx+vw*.16}" y="${vy-26}" width="${vw*.68}" height="9" rx="4.5" fill="#2C2C28"/><rect x="${vx+vw*.2}" y="${vy-23}" width="${vw*.6}" height="3" rx="1.5" fill="#FF6FD8"/><ellipse class="lampGlow" cx="${vx+vw/2}" cy="${vy-8}" rx="${vw*.5}" ry="${vh*.16}" fill="url(#${uid}glow)" opacity=".3"/></g>`;
    /* guides */
    s+=`<g class="guides">`;
    const rx=vx-26;
    s+=`<path d="M${rx},${vy} V${by}" stroke="${dark?'#8B9C7D':'#8A9182'}" stroke-width="1"/>`;
    for(let cm=0;cm<=Math.round(hCm);cm+=Math.max(1,Math.round(hCm/8))){const yy=by-cm*sc;s+=`<path d="M${rx-4},${yy} H${rx+4}" stroke="${dark?'#8B9C7D':'#8A9182'}" stroke-width="1"/><text x="${rx-8}" y="${yy+3.5}" font-size="11" text-anchor="end" fill="${dark?'#B4C4A6':'#6E7663'}">${cm}</text>`;}
    const fy=by-(drain+sep+sub+2.5*sc);
    s+=`<path class="freeLine" d="M${vx},${fy} H${vx+vw}" stroke="${dark?'#C2DE9F':'#4C6B44'}" stroke-width="1" stroke-dasharray="5 4" opacity=".75"/>`;
    s+=`<text x="${vx+vw+8}" y="${fy+4}" font-size="11" fill="${dark?'#C2DE9F':'#4C6B44'}">${Math.round(D.freeHeight)} cm</text>`;
    s+=`<text x="${vx+vw+8}" y="${(dY+by)/2+4}" font-size="10" fill="${dark?'#8B9C7D':'#8A9182'}">${esc(tr('bom.drainage','дренаж'))}</text>`;
    s+=`<text x="${vx+vw+8}" y="${(subTop+sY)/2+4}" font-size="10" fill="${dark?'#8B9C7D':'#8A9182'}">${esc(tr('bom.substrate','грунт'))}</text>`;
    s+=`</g>`;
    s+=`</svg>`;
    host.innerHTML=s;
    const svg=host.querySelector('svg');
    return {svg,W,H,vx,vy,vw,vh,by,subTop,topY,uid,mode,q,
      plants:plants.map(p=>Object.assign(p,{el:svg.querySelector('.pl[data-i="'+p.i+'"]')})),
      fauna:fauna.map(f=>Object.assign(f,{el:svg.querySelector('.fn[data-i="'+f.i+'"]')})),
      drops:drops.map(d=>Object.assign(d,{el:svg.querySelector('.dp[data-i="'+d.i+'"]')})),
      rays:[...svg.querySelectorAll('.ray')],waves:[...svg.querySelectorAll('.wave')],
      fog:svg.querySelector('.fog'),tint:svg.querySelector('.tint'),night:svg.querySelector('.night'),
      glass:svg.querySelector('.glass'),guides:svg.querySelector('.guides'),glow:svg.querySelector('.glowEl'),
      lampGlow:svg.querySelector('.lampGlow'),faunaG:svg.querySelector('.fauna'),raysG:svg.querySelector('.rays')};
  }
  function hbMax(plants,vy){return plants.length?Math.max.apply(null,plants.map(p=>p.y-vy)):40;}
  function tr(k,fb){try{const b=B();const v=b&&b.t&&b.t(k);return v&&v!==k?v:fb;}catch(e){return fb;}}
  /* ── live apply ── */
  function live(sc,t){
    const b=B();if(!b)return;const st=b.state,D=b.D,S=st.studio,pal=PAL[S.palette]||PAL.day;
    const z=S.zoom,ww=sc.W/z,hh=sc.H/z;
    const cx=sc.W/2+S.panX,cy=sc.H/2+S.panY;
    sc.svg.setAttribute('viewBox',`${cx-ww/2} ${cy-hh/2} ${ww} ${hh}`);
    const nightAmt=(S.hour<6||S.hour>20)?1:(S.hour<8?(8-S.hour)/2:(S.hour>18?(S.hour-18)/2:0));
    const bright=clamp(S.intensity*(1-nightAmt*.72),0,1.7);
    /* plants: growth + sway */
    sc.plants.forEach(p=>{
      if(!p.el)return;
      const k=(b.GK&&b.GK[p.rate])||.03,g=Math.min(3.2,1+k*S.months);
      const cap=p.hb==='mount'||p.hb==='trailing'?3.2:clamp((D.freeHeight/Math.max(1,p.hcm))*1.12,1,3.2);
      const gg=Math.min(g,cap);
      const sway=Math.sin(t*.0009+p.phase)*(p.hb==='groundcover'?.7:2.1);
      p.el.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${sway}) scale(${p.base*p.flip*gg} ${p.base*gg})`);
      p.el.setAttribute('opacity',p.hb==='groundcover'?.96:1);
    });
    /* light rays */
    const ang=S.angle*Math.PI/180,ox=sc.vx+sc.vw*(.5-Math.sin(ang)*.55),oy=sc.vy-30;
    sc.rays.forEach((r,i)=>{
      const spread=(i-(sc.rays.length-1)/2)*.16,a=ang+spread+Math.sin(t*.00013+i)*.03;
      const len=sc.vh*1.5,w0=sc.vw*.05,w1=sc.vw*.2;
      const dx=Math.sin(a),dy=Math.cos(a);
      const px=-dy,py=dx;
      const x1=ox+px*w0,y1=oy+py*w0,x2=ox-px*w0,y2=oy-py*w0;
      const x3=ox+dx*len-px*w1,y3=oy+dy*len-py*w1,x4=ox+dx*len+px*w1,y4=oy+dy*len+py*w1;
      r.setAttribute('points',`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`);
      r.setAttribute('opacity',S.rays?(pal.beam*bright*(.5+.5*Math.sin(t*.0004+i*1.7))*.6).toFixed(3):0);
    });
    if(sc.raysG)sc.raysG.style.display=S.rays?'':'none';
    /* fog / humidity */
    const hum=clamp(S.humidity*(st.system==='closed'?1.15:st.system==='semi'?.85:.5),0,1.2);
    if(sc.fog)sc.fog.setAttribute('opacity',(hum*.42).toFixed(3));
    sc.drops.forEach(d=>{
      if(!d.el)return;
      const on=d.i/sc.drops.length<hum;
      const slide=(t*.00006*d.sp+d.ph)%1;
      const yy=d.y+(on&&d.i%5===0?slide*sc.vh*.22:0);
      d.el.setAttribute('transform',`translate(${d.x} ${yy})`);
      d.el.setAttribute('opacity',on?(.35+.45*Math.abs(Math.sin(t*.0005+d.ph))).toFixed(3):0);
    });
    /* tint + night */
    if(sc.tint){sc.tint.setAttribute('fill',pal.tint);sc.tint.setAttribute('opacity',(pal.tintA*(.4+bright*.7)).toFixed(3));}
    if(sc.night)sc.night.setAttribute('opacity',(nightAmt*.5).toFixed(3));
    if(sc.glass)sc.glass.setAttribute('opacity',(0.25+S.glass*.75).toFixed(3));
    if(sc.glow)sc.glow.setAttribute('opacity',(S.glow?(.10+bright*.22).toFixed(3):0));
    if(sc.lampGlow)sc.lampGlow.setAttribute('opacity',(S.glow?(.22+.18*Math.sin(t*.0012)).toFixed(3):.1));
    if(sc.guides)sc.guides.style.display=S.guides?'':'none';
    /* fauna */
    if(sc.faunaG)sc.faunaG.style.display=S.life?'':'none';
    if(S.life)sc.fauna.forEach(f=>{
      if(!f.el)return;
      const tt=t*.0004*f.sp+f.ph;
      const x=f.x0+Math.sin(tt)*sc.vw*.09;
      const y=f.y0+(f.hop?-Math.abs(Math.sin(tt*2.4))*5:Math.sin(tt*1.3)*1.6);
      f.el.setAttribute('transform',`translate(${x} ${y})${f.hop?'':' rotate('+(Math.cos(tt)*9).toFixed(1)+')'}`);
    });
    sc.waves.forEach((w,i)=>{w.setAttribute('transform',`translate(0 ${(Math.sin(t*.0011+i)*2).toFixed(2)})`);w.setAttribute('opacity',(.25+.25*Math.abs(Math.sin(t*.0009+i))).toFixed(3));});
  }
  /* ── host management ── */
  const scenes=new Map();let uid=0,raf=0,fails=0,stopped=false,dirty=true;
  function sigOf(mode){
    const b=B();if(!b||!b.state||!b.D)return '';const st=b.state,S=st.studio;
    return JSON.stringify([mode,st.vessel.shape,st.vessel.height,st.vessel.width,st.vessel.diameter,st.vessel.depth,
      st.items.map(x=>x.id),st.stones,st.decor,st.flags.water,st.flags.grow,st.substrate,
      mode==='stage'?S.detail:'c',S.palette,S.ghost,document.documentElement.getAttribute('data-theme'),document.documentElement.lang]);
  }
  function sync(){
    const b=B();if(!b||!b.state||!b.D||!b.DB||!b.DB.plants)return;
    document.querySelectorAll('[data-pv]').forEach(host=>{
      const vis=!!host.offsetParent;
      if(!vis){if(scenes.has(host)){scenes.delete(host);}return;}
      if(!host.dataset.uid)host.dataset.uid='s'+(++uid);
      const mode=host.dataset.pv,sg=sigOf(mode);
      let sc=scenes.get(host);
      if(!sc||sc.sig!==sg||dirty&&!sc){try{sc=build(host,mode);if(sc){sc.sig=sg;scenes.set(host,sc);}}catch(e){console.warn('[studio]',e);}}
      else if(sc.sig!==sg){try{sc=build(host,mode);if(sc){sc.sig=sg;scenes.set(host,sc);}}catch(e){console.warn('[studio]',e);}}
    });
    dirty=false;
  }
  function tick(t){
    if(stopped)return;
    if(document.visibilityState==='visible'){
      try{sync();scenes.forEach(sc=>live(sc,t));fails=0;}catch(e){if(++fails>40){stopped=true;console.warn('[studio] halted',e);return;}}
    }
    raf=requestAnimationFrame(tick);
  }
  const start=()=>{if(!raf&&!stopped)raf=requestAnimationFrame(tick);};
  const stop=()=>{if(raf){cancelAnimationFrame(raf);raf=0;}};
  document.addEventListener('visibilitychange',()=>document.visibilityState==='visible'?start():stop());
  /* ── pan / zoom ── */
  function bindStage(el){
    let drag=null;
    el.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;drag={x:e.clientX,y:e.clientY,px:B().state.studio.panX,py:B().state.studio.panY};el.setPointerCapture(e.pointerId);});
    el.addEventListener('pointermove',e=>{if(!drag)return;const b=B();if(!b)return;const r=el.getBoundingClientRect(),k=(b.state.studio.zoom)*(1000/Math.max(1,r.width));
      b.state.studio.panX=clamp(drag.px-(e.clientX-drag.x)*k,-380,380);b.state.studio.panY=clamp(drag.py-(e.clientY-drag.y)*k,-300,300);});
    const end=e=>{if(drag){drag=null;try{el.releasePointerCapture(e.pointerId);}catch(x){}const b=B();if(b&&b.notify)b.notify();}};
    el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
    el.addEventListener('wheel',e=>{const b=B();if(!b)return;e.preventDefault();const S=b.state.studio;S.zoom=clamp(+(S.zoom*(e.deltaY<0?1.09:.92)).toFixed(2),.6,2.6);if(b.notify)b.notify();},{passive:false});
  }
  /* ── export ── */
  function stageScene(){const h=document.getElementById('stageFrame');return scenes.get(h)||null;}
  function serialize(){
    const sc=stageScene();if(!sc)return null;
    const c=sc.svg.cloneNode(true);
    c.setAttribute('xmlns','http://www.w3.org/2000/svg');
    c.setAttribute('width',sc.W);c.setAttribute('height',sc.H);
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(c);
  }
  function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
  function note(k){const b=B();if(window.__toast&&b)window.__toast(b.t(k));}
  window.__studio={
    invalidate(){dirty=true;scenes.forEach((sc,h)=>{if(!h.offsetParent)scenes.delete(h);});},
    downloadSVG(){const s=serialize();if(!s)return;dl(new Blob([s],{type:'image/svg+xml;charset=utf-8'}),'florarium-'+Date.now()+'.svg');note('toast.svgfile');},
    copySVG(){const s=serialize();if(!s)return;const go=window.__copyText?window.__copyText(s):navigator.clipboard.writeText(s);Promise.resolve(go).then(()=>note('toast.svg'));},
    downloadPNG(){
      const sc=stageScene(),s=serialize();if(!sc||!s)return;
      const img=new Image(),url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
      img.onload=()=>{try{const k=2,cv=document.createElement('canvas');cv.width=sc.W*k;cv.height=sc.H*k;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0,cv.width,cv.height);
        cv.toBlob(bl=>{if(bl){dl(bl,'florarium-'+Date.now()+'.png');note('toast.png');}},'image/png');}catch(e){window.__studio.downloadSVG();}};
      img.onerror=()=>window.__studio.downloadSVG();
      img.src=url;
    }
  };
  const boot=()=>{['stageFrame'].forEach(id=>{const el=document.getElementById(id);if(el)bindStage(el);});const hero=document.querySelector('.hero-stage');if(hero)bindStage(hero);start();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
