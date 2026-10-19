
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const all=(sel)=>[...document.querySelectorAll(sel)];
const menuButton=document.querySelector('.menu-toggle');const menu=$('mobile-menu');
const closeMenu=()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu')};
menuButton.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu')});
all('.mobile-menu a').forEach(a=>a.addEventListener('click',closeMenu));
const dialog=$('login-dialog');let lastTrigger=null;
all('[data-login]').forEach(b=>b.addEventListener('click',()=>{lastTrigger=b;closeMenu();dialog.showModal()}));
$('dialog-close').addEventListener('click',()=>dialog.close());$('login-return').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{if(lastTrigger?.isConnected)lastTrigger.focus()});

const goals={
run:{overline:'RUNNING / RACE GOAL',title:'Berlin Marathon · sub-3',desc:'Build running durability and arrive at the start line ready for a meaningful effort.',unit:'TARGET TIME',value:'2:59:59',focus:[['Run durability','Building'],['Aerobic efficiency','Progressing'],['Race-specific preparation','Next phase']]},
tri:{overline:'TRIATHLON / QUALIFICATION',title:'World championship qualification',desc:'Balance the swim, bike and run — with recovery and real-life constraints included.',unit:'DIRECTION',value:'Qualify',focus:[['Swim consistency','Developing'],['Bike-to-run resilience','Build phase'],['Race execution','Qualifying focus']]},
bike:{overline:'CYCLING / POWER DEVELOPMENT',title:'Raise your FTP',desc:'Improve sustainable power and the endurance to use it when it matters.',unit:'SAMPLE FTP TARGET',value:'300 W',focus:[['Aerobic base','Building'],['Threshold development','Progressing'],['Power durability','Next focus']]},
open:{overline:'CONTINUOUS / NO-RACE MODE',title:'Train for life',desc:'Stay active, build consistency and improve health and performance without a race deadline.',unit:'YOUR PRIORITY',value:'Feel stronger',focus:[['Training consistency','Weekly rhythm'],['Sleep & recovery','Personal trends'],['Enjoyment and flexibility','Part of the plan']]}
};
function setGoal(key){let data=goals[key];if(!data)return;all('[data-goal]').forEach(b=>{let on=b.dataset.goal===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('goal-overline').textContent=data.overline;$('goal-title').textContent=data.title;$('goal-desc').textContent=data.desc;$('goal-unit').textContent=data.unit;$('goal-value').textContent=data.value;const rows=$('goal-focus-rows');rows.replaceChildren(...data.focus.map(([label,value])=>{let div=document.createElement('div'),span=document.createElement('span'),b=document.createElement('b');span.textContent=label;b.textContent=value;div.append(span,b);return div}))}all('[data-goal]').forEach(b=>b.addEventListener('click',()=>setGoal(b.dataset.goal)));
const week=[['MONDAY / RUNNING','Easy aerobic run','Build frequency while controlling effort.','45 min'],['TUESDAY / CYCLING','Steady endurance ride','Support aerobic fitness without extra impact.','75 min'],['WEDNESDAY / SUPPORT','Core + mobility','Maintain useful movement quality and strength.','25 min'],['THURSDAY / RUNNING','Threshold development','Progress only when recent load and recovery support it.','50 min'],['FRIDAY / RECOVERY','Rest / optional walk','Absorb the training you have completed.','Flexible'],['SATURDAY / RUNNING','Long aerobic run','Build race-relevant durability at sustainable effort.','90 min'],['SUNDAY / CYCLING','Recovery spin','Easy aerobic movement, subject to how the legs feel.','45 min']];
function setDay(index){const d=week[index];if(!d)return;all('[data-day]').forEach(b=>{let on=Number(b.dataset.day)===index;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});$('week-label').textContent=d[0];$('week-title').textContent=d[1];$('week-why').textContent=d[2];$('week-duration').textContent=d[3]}all('[data-day]').forEach(b=>b.addEventListener('click',()=>setDay(Number(b.dataset.day))));
const scenarios={
ready:{tone:'ON TRACK',title:'Tempo run',meta:'50 min · Controlled effort',explain:'No new constraints were reported in this example. The session can stay as planned, subject to updated recovery and symptom evidence.',note:'Calendar commitments are not silently changed.'},
sleep:{tone:'LOW RECOVERY',title:'Easy aerobic run',meta:'35 min · Conversational effort',explain:'A short night and HRV below personal baseline would warrant considering reduced intensity. Confirm how you feel before choosing a suitable alternative.',note:'Tomorrow is reassessed with fresh observations, rather than automatically rescheduling intensity.'},
time:{tone:'LIMITED TIME',title:'Short easy run',meta:'30 min · Aerobic',explain:'A compact session preserves useful aerobic work without trying to squeeze the full planned session into half the time.',note:'Uncompleted minutes are not added to tomorrow as training debt.'},
travel:{tone:'TRAVEL DAY',title:'Travel-day recovery',meta:'20 min · Walking / mobility',explain:'A disrupted routine can make a lower-cost recovery option more useful than forcing the original workout.',note:'The week is adjusted around your actual availability.'},
injury:{tone:'SYMPTOM FLAG',title:'Hold impact training',meta:'Rest / symptom-guided recovery',explain:'Pain or recurring injury symptoms take priority over the schedule. Avoid running through symptoms and seek qualified assessment when appropriate.',note:'An easy cycling session does not, by itself, confirm safe return to running.'}
};
function setScenario(key){const s=scenarios[key];if(!s)return;all('[data-scenario]').forEach(b=>{let on=b.dataset.scenario===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('scenario-tone').textContent='/ '+s.tone;$('scenario-title').textContent=s.title;$('scenario-meta').textContent=s.meta;$('scenario-explanation').textContent=s.explain;$('scenario-note').textContent=s.note;const detouring=key!=='ready';document.getElementById('journey')?.classList.toggle('is-detouring',detouring);$('reroute-label').textContent=detouring?'Detour suggested · A different way forward':'Original route · No adjustment required';$('reroute-banner').classList.toggle('is-rerouting',detouring)}all('[data-scenario]').forEach(b=>b.addEventListener('click',()=>setScenario(b.dataset.scenario)));

const chartData={volume:{title:'Weekly running distance',value:'52',unit:'km',sub:'Latest sample week',values:[25,31,28,37,35,43,45,52],color:'#58c6ff',aria:'Illustrative eight-week running distance in kilometers'},speed:{title:'Steady-run pace',value:'4:58',unit:'/km',sub:'Illustrative latest pace',values:[330,324,319,314,311,307,302,298],color:'#f0ff6b',aria:'Illustrative pace improvement from slower to faster minutes per kilometer'},power:{title:'Sustained cycling power',value:'282',unit:'W',sub:'Illustrative 20-minute average',values:[259,262,267,264,275,274,277,282],color:'#ff8fba',aria:'Illustrative eight-week twenty-minute cycling power in watts'},recovery:{title:'HRV / trend context',value:'52',unit:'ms',sub:'Illustrative seven-day avg',values:[48,49,46,50,49,51,50,52],color:'#9ccfff',aria:'Illustrative eight-week HRV trend in milliseconds'}};
function setMetric(key){const c=chartData[key];if(!c)return;all('[data-metric]').forEach(b=>{let on=b.dataset.metric===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('progress-heading').textContent=c.title;$('progress-value').replaceChildren(document.createTextNode(c.value+' '));let small=document.createElement('small');small.textContent=c.unit;$('progress-value').append(small);$('progress-sub').textContent=c.sub;const svg=$('progress-chart');svg.setAttribute('aria-label',c.aria);const vals=c.values;let lo=Math.min(...vals),hi=Math.max(...vals);let min=lo-(hi-lo)*.3,max=hi+(hi-lo)*.25;const px=i=>25+i*(575/7),py=v=>210-(v-min)/(max-min)*170;const coords=vals.map((v,i)=>[px(i),py(v)]);const line=coords.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join(' ');$('chart-line').setAttribute('d',line);$('chart-line').setAttribute('stroke',c.color);$('chart-area').setAttribute('d',line+' L600 210 L25 210Z');let dots=$('chart-dots');dots.replaceChildren(...coords.map(([x,y])=>{const el=document.createElementNS('http://www.w3.org/2000/svg','circle');el.setAttribute('cx',x);el.setAttribute('cy',y);el.setAttribute('r',3.5);el.setAttribute('fill',c.color);el.setAttribute('stroke','#112034');el.setAttribute('stroke-width','2');return el}))}all('[data-metric]').forEach(b=>b.addEventListener('click',()=>setMetric(b.dataset.metric)));setMetric('volume');

// A route generated from real section positions (not a decorative fixed image).
// Refined waypoint order: LEFT → RIGHT → CENTRE → LEFT → RIGHT → CENTRE.
// The fourth stop includes a detour; the fifth records a milestone, the sixth the summit.
const journey=$('journey');
const svg=document.querySelector('.journey-svg');
const track=$('journey-track'),ink=$('journey-ink'),beacon=$('journey-beacon');
const detour=$('journey-detour'), waypointLayer=$('route-waypoints');
const sections=all('.stage');
const reducedQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
let length=0,raf=0,activeIndex=-1;
let anchors=[];
const stops=[
  {side:'left',icon:'◎',label:'UNDERSTAND',kind:'athlete'},
  {side:'right',icon:'◇',label:'SET A GOAL',kind:'goal'},
  {side:'center',icon:'↗',label:'YOUR PLAN',kind:'plan'},
  {side:'left',icon:'↝',label:'DETOUR / ADAPT',kind:'detour'},
  {side:'right',icon:'★',label:'PROGRESS / PR',kind:'pr'},
  {side:'center',icon:'◉',label:'GOAL / NEXT CHAPTER',kind:'finish'}
];
const stopNodes=stops.map((stop,i)=>{
 const a=document.createElement('a');a.className='route-stop';a.href='#'+sections[i].id;
 a.dataset.side=stop.side;a.dataset.kind=stop.kind;
 a.setAttribute('aria-label',`Stop ${i+1} of 6: ${stop.label.toLowerCase()}`);
 const ring=document.createElement('span');ring.className='route-stop-ring';ring.setAttribute('aria-hidden','true');
 const ring2=document.createElement('span');ring2.className='route-stop-ring second';ring2.setAttribute('aria-hidden','true');
 const sym=document.createElement('span');sym.className='route-stop-icon';sym.textContent=stop.icon;sym.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.className='route-stop-label';
 label.innerHTML=`<em>${String(i+1).padStart(2,'0')} / CHECKPOINT</em><strong>${stop.label}</strong>`;
 a.append(ring,ring2,sym,label);waypointLayer.append(a);return a;
});
// Interpolate a smooth path, including a purposeful left-side switchback between
// the training-plan stop and the coaching-adaptation stop.
function routeLayout(){
 const root=journey.getBoundingClientRect(), width=root.width,height=journey.offsetHeight;
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const mobile=width<800;
 const edge=mobile?Math.max(21,Math.min(26,width*.063)):Math.max(76,Math.min(128,width*.094));
 anchors=sections.map((el,i)=>{
  const r=el.getBoundingClientRect();
  const y=r.top-root.top + (stops[i].side==='center' ? (mobile?50:82) : mobile ? r.height*.36 : Math.min(120,r.height*.15));
  // On small screens, stay in the gutters, never behind active text or controls.
  const x=stops[i].side==='left'?edge:stops[i].side==='right'?width-edge:width*.5;
  stopNodes[i].style.left=x+'px';stopNodes[i].style.top=y+'px';
  return {x,y};
 });
 const firstY=anchors[0].y-340;
 const lastY=Math.min(height-60,anchors[anchors.length-1].y+330);
 const positions=[{x:width*.49,y:Math.max(40,firstY)},...anchors,{x:width*.5,y:lastY}];
 let d=`M ${positions[0].x.toFixed(1)} ${positions[0].y.toFixed(1)}`;
 for(let i=1;i<positions.length;i++){
  const prev=positions[i-1],next=positions[i];
  const dy=next.y-prev.y;
  if(i===4 && dy>260){ // deliberate switchback from a central plan to the left-side roadblock
   const midX=width*(mobile?.76:.82),midY=prev.y+dy*.5;
   d+=` C ${prev.x} ${prev.y+dy*.24} ${midX} ${midY-dy*.36} ${midX} ${midY}`;
   d+=` C ${midX} ${midY+dy*.36} ${next.x} ${next.y-dy*.24} ${next.x} ${next.y}`;
  }else{
   d+=` C ${prev.x} ${prev.y+dy*.52} ${next.x} ${next.y-dy*.52} ${next.x} ${next.y}`;
  }
 }
 track.setAttribute('d',d);ink.setAttribute('d',d);
 length=ink.getTotalLength();ink.style.strokeDasharray=`${length} ${length}`;
 // A ghosted alternative route branching near the adaptation challenge.
 const a=anchors[2], b=anchors[3],gap=b.y-a.y;
 const bx=mobile?width*.11:width*.13;
 detour.setAttribute('d',`M ${a.x} ${a.y} C ${a.x-width*.14} ${a.y+gap*.25} ${bx} ${a.y+gap*.4} ${bx} ${a.y+gap*.51} S ${b.x+width*.16} ${b.y-gap*.25} ${b.x} ${b.y}`);
 updateOnScroll();
}
function updateOnScroll(){
 if(!length||!anchors.length)return;
 const root=journey.getBoundingClientRect();
 const progressY=Math.max(0,Math.min(journey.offsetHeight,innerHeight*.50-root.top));
 // All Bezier control points have increasing Y, allowing a stable binary search.
 let lo=0,hi=length;
 for(let i=0;i<23;i++){
  const mid=(lo+hi)/2;
  if(ink.getPointAtLength(mid).y<progressY)lo=mid;else hi=mid;
 }
 const progressed=(lo+hi)/2,p=ink.getPointAtLength(progressed);
 ink.style.strokeDashoffset=String(reducedQuery.matches?0:length-progressed);
 beacon.setAttribute('cx',p.x);beacon.setAttribute('cy',p.y);
 beacon.style.opacity=(reducedQuery.matches||progressY<1||progressY>journey.offsetHeight-10)?'0':'1';
 let best=-1,bestDist=Infinity;
 const focal=innerHeight*.5;
 for(let i=0;i<sections.length;i++){
  const bounds=sections[i].getBoundingClientRect();
  const centre=bounds.top+bounds.height*.46;
  const distance=Math.abs(centre-focal);
  const threshold=Math.min(1200,innerHeight*.99);
  const t=Math.max(0,Math.min(1,1-distance/threshold));
  // A neutral fade until entering the chapter; current stop becomes the clear focus.
  const eased=t*t*(3-2*t);
  sections[i].style.setProperty('--chapter-focus',eased.toFixed(3));
  if(distance<bestDist){best=i;bestDist=distance}
 }
 if(root.bottom<0||root.top>innerHeight)best=-1; if(best!==activeIndex){activeIndex=best;stopNodes.forEach((node,i)=>{
  const on=i===best;
  node.classList.toggle('is-active',on);
  if(on)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
 });}
 sections.forEach((s,i)=>s.classList.toggle('is-active',i===best&&bestDist<innerHeight*.85));
}
function requestRouteUpdate(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;updateOnScroll()});}
addEventListener('scroll',requestRouteUpdate,{passive:true});
addEventListener('resize',()=>requestAnimationFrame(routeLayout),{passive:true});
if('ResizeObserver' in window)new ResizeObserver(()=>requestAnimationFrame(routeLayout)).observe(journey);
reducedQuery.addEventListener?.('change',()=>{requestAnimationFrame(routeLayout)});
requestAnimationFrame(routeLayout);
})();

