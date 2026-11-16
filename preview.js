/*! Florarium — SVG preview. Рисует во все [data-pv] хосты. Требует window.__fc. */
(function(){
  'use strict';
  if(window.__fcPreviewInit)return;window.__fcPreviewInit=true;
  const B=()=>window.__fc||null;
  const esc=s=>String(s==null?'':s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  const tr=(k,fb)=>{try{const b=B();return (b&&b.t&&b.t(k))||fb;}catch(e){return fb;}};
  const sizePx=s=>s==='micro'?8:s==='large'?32:20;
  const habitOf=p=>{const l=p.layer_form||[];if(l.length===1&&l[0]==='mount')return 'mount';if(l.some(x=>x==='bush'||x==='accent'))return 'upright';if(l.indexOf('vine')>=0)return 'trailing';return 'groundcover';};
  function vesselPath(shape,x,y,w,h){
    const r=Math.min(w,h)*.08;
    switch(shape){
      case 'bowl':{const ry=w*.35;return `M${x},${y} L${x},${y+h-ry} Q${x},${y+h} ${x+w/2},${y+h} Q${x+w},${y+h} ${x+w},${y+h-ry} L${x+w},${y}`;}
      case 'sphere':{const cx=x+w/2,cy=y+h/2,r0=Math.min(w,h)/2;return `M${cx-r0},${cy} A${r0},${r0} 0 1,1 ${cx+r0},${cy} A${r0},${r0} 0 1,1 ${cx-r0},${cy}`;}
      case 'cube':{const s=Math.min(w,h),cx=x+w/2,cy=y+h/2;return `M${cx-s/2},${cy-s/2} L${cx+s/2},${cy-s/2} L${cx+s/2},${cy+s/2} L${cx-s/2},${cy+s/2} Z`;}
      case 'bottle':{const nW=w*.4,nX=x+(w-nW)/2,nH=h*.25;return `M${nX},${y} L${nX},${y+nH} L${x},${y+nH+h*.1} L${x},${y+h} L${x+w},${y+h} L${x+w},${y+nH+h*.1} L${nX+nW},${y+nH} L${nX+nW},${y}`;}
      case 'geo_house':{const peak=h*.4;return `M${x+w/2},${y} L${x+w},${y+peak} L${x+w},${y+h} L${x},${y+h} L${x},${y+peak} Z`;}
      case 'tank':return `M${x},${y} L${x+w},${y} L${x+w},${y+h} L${x},${y+h} Z`;
      default:return `M${x+r},${y} L${x+w-r},${y} Q${x+w},${y} ${x+w},${y+r} L${x+w},${y+h-r} Q${x+w},${y+h} ${x+w-r},${y+h} L${x+r},${y+h} Q${x},${y+h} ${x},${y+h-r} L${x},${y+r} Q${x},${y} ${x+r},${y} Z`;
    }
  }
  function findItem(DB,id){
    if(!DB||!id)return null;
    if(Array.isArray(DB.plants)){const h=DB.plants.find(o=>o&&o.id===id);if(h)return h;}
    if(Array.isArray(DB.fauna)){const h=DB.fauna.find(o=>o&&o.id===id);if(h)return h;}
    return null;
  }
  function render(st,D,DB,small){
    const W=240,H=small?200:320,M=small?12:20;
    const v=st.vessel||{},shape=v.shape||'jar',hCm=+v.height||20;
    const wide=['cube','tank','geo_house'].includes(shape);
    const wCm=wide?(+v.width||20):(+v.diameter||+v.width||14);
    const plants=(st.items||[]).filter(i=>i.kind==='plant').map(i=>findItem(DB,i.id)).filter(Boolean);
    const fauna=(st.items||[]).filter(i=>i.kind==='fauna').map(i=>findItem(DB,i.id)).filter(Boolean);
    const stoneList=(st.stones||[]).map(id=>(DB.materials&&DB.materials.stones||[]).find(s=>s.id===id)).filter(Boolean).slice(0,3);
    const scale=Math.min((W-M*2)/wCm,(H-M*2)/hCm),vW=wCm*scale,vH=hCm*scale;
    const vX=(W-vW)/2,vY=H-M-vH,bottomY=vY+vH;
    const drain=(D&&D.drainage)||1;
    const ch=DB.norms&&DB.norms.layers&&DB.norms.layers.charcoal;
    const char=(ch&&Array.isArray(ch.thickness_cm)?ch.thickness_cm[0]:.5);
    const sep=.3,sub=Math.max(.5,(D&&D.depth)||3),top=.3;
    const drainY=bottomY-drain*scale,charY=drainY-char*scale,sepY=charY-sep*scale,subTop=sepY-sub*scale,topY=subTop-top*scale;
    const path=vesselPath(shape,vX,vY,vW,vH),cid='pvc'+(small?'s':'l');
    let s=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(tr('preview.aria','Схема террариума'))}">`;
    s+=`<defs><clipPath id="${cid}"><path d="${path}"/></clipPath><linearGradient id="${cid}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0c4" stop-opacity=".35"/><stop offset="1" stop-color="#a8c09a" stop-opacity=".12"/></linearGradient></defs>`;
    s+=`<path d="${path}" fill="url(#${cid}g)"/><g clip-path="url(#${cid})">`;
    s+=`<rect x="${vX}" y="${drainY}" width="${vW}" height="${bottomY-drainY}" fill="#8fae94" opacity=".6"/>`;
    s+=`<rect x="${vX}" y="${charY}" width="${vW}" height="${drainY-charY}" fill="#33352f" opacity=".85"/>`;
    s+=`<rect x="${vX}" y="${sepY}" width="${vW}" height="${charY-sepY}" fill="#d8cdba" opacity=".9"/>`;
    s+=`<rect x="${vX}" y="${subTop}" width="${vW}" height="${sepY-subTop}" fill="#4a3628" opacity=".9"/>`;
    s+=`<rect x="${vX}" y="${topY}" width="${vW}" height="${subTop-topY}" fill="#6b8f66" opacity=".75"/>`;
    stoneList.forEach((x0,i)=>{const x=vX+vW*(i+1)/(stoneList.length+1);s+=`<polygon points="${x-6},${subTop} ${x-3},${subTop-7} ${x+2},${subTop-7} ${x+6},${subTop}" fill="#9a9a94" stroke="#6a6a64" stroke-width=".5"/>`;});
    const byH=h=>plants.filter(p=>habitOf(p)===h);
    const gc=byH('groundcover').slice(0,8),up=byH('upright').slice(0,6),tl=byH('trailing').slice(0,6),mt=byH('mount').slice(0,4);
    if(mt.length){const bY=subTop-vH*.35;s+=`<line x1="${vX+vW*.15}" y1="${bY}" x2="${vX+vW*.85}" y2="${bY-4}" stroke="#6b4a30" stroke-width="1.8"/>`;mt.forEach((p,i)=>{const x=vX+vW*(.25+.5*i/Math.max(1,mt.length-1)),h=sizePx(p.size);s+=`<ellipse cx="${x}" cy="${bY-h/2}" rx="${h*.5}" ry="${h/2}" fill="#7fa86b" opacity=".92"/>`;});}
    gc.forEach((p,i)=>{const x=vX+vW*(i+1)/(gc.length+1),h=sizePx(p.size);s+=`<ellipse cx="${x}" cy="${subTop-h/2}" rx="${h*.4}" ry="${h/2}" fill="#7fa86b" opacity=".92"/>`;});
    up.forEach((p,i)=>{const x=vX+vW*(i+1)/(up.length+1),h=sizePx(p.size)*1.5,w=h*.3;s+=`<path d="M${x},${subTop} Q${x-w},${subTop-h*.5} ${x},${subTop-h} Q${x+w},${subTop-h*.5} ${x},${subTop}" fill="#6f9c5c" opacity=".92"/>`;});
    tl.forEach((p,i)=>{const x=vX+12+(vW-24)*(i/Math.max(1,tl.length));s+=`<path d="M${x},${vY+4} Q${x-4},${vY+20} ${x-2},${vY+35} Q${x+2},${vY+45} ${x},${vY+55}" stroke="#7fa86b" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>`;});
    fauna.forEach((f,i)=>{const n=Math.min(6,(f.starter_count&&f.starter_count.recommended)||1);for(let k=0;k<n;k++){const x=vX+8+(vW-16)*(i*6+k)/Math.max(1,fauna.length*6);s+=`<circle cx="${x}" cy="${subTop-3}" r="1.3" fill="#2a2a24" opacity=".85"/>`;}});
    s+=`</g><path d="${path}" fill="none" stroke="#7fa86b" stroke-width="1.6" stroke-linejoin="round"/>`;
    const fh=D&&D.freeHeight;
    if(!small&&fh&&fh>.5){s+=`<line x1="${vX+4}" y1="${vY+4}" x2="${vX+4}" y2="${topY-2}" stroke="#9aa192" stroke-width=".5" stroke-dasharray="2,2" opacity=".6"/><text x="${vX+8}" y="${(vY+topY)/2}" font-size="7.5" fill="#727A69">${esc(tr('preview.free','свободно'))} ${Math.round(fh)} см</text>`;}
    return s+'</svg>';
  }
  const sig=(st,D,small)=>{try{return JSON.stringify([st.vessel.shape,st.vessel.height,st.vessel.width,st.vessel.diameter,st.vessel.depth,(st.items||[]).map(x=>x.kind+':'+x.id),st.stones,D&&D.freeHeight,D&&D.depth,small,document.documentElement.lang]);}catch(e){return '';}};
  function sync(){
    const b=B();if(!b||!b.state||!b.D||!b.DB||!b.DB.plants)return;
    document.querySelectorAll('[data-pv]').forEach(host=>{
      if(!host.offsetParent)return;
      const small=host.dataset.pv==='sm',s=sig(b.state,b.D,small);
      if(host.dataset.sig===s)return;
      host.dataset.sig=s;
      try{host.innerHTML=render(b.state,b.D,b.DB,small);}catch(e){console.warn('[preview]',e);}
    });
  }
  let raf=0,fails=0,stopped=false;
  const tick=()=>{if(stopped)return;if(document.visibilityState==='visible'){try{sync();fails=0;}catch(e){if(++fails>30){stopped=true;return;}}}raf=requestAnimationFrame(tick);};
  const start=()=>{if(!raf&&!stopped)raf=requestAnimationFrame(tick);};
  const stop=()=>{if(raf){cancelAnimationFrame(raf);raf=0;}};
  document.addEventListener('visibilitychange',()=>document.visibilityState==='visible'?start():stop());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
