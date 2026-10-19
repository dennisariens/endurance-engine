
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const all=(sel)=>[...document.querySelectorAll(sel)];
const menuButton=document.querySelector('.menu-toggle');const menu=$('mobile-menu');
const closeMenu=()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu')};
menuButton.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu')});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus()}});
all('.mobile-menu a').forEach(a=>a.addEventListener('click',closeMenu));
let selectedGoal='run', selectedDay=0, selectedScenario='ready', selectedMetric='volume';
const goals={
run:{overline:'RUNNING / RACE GOAL',title:'Berlin Marathon · sub-3',desc:'Build running durability and arrive at the start line ready for a meaningful effort.',unit:'TARGET TIME',value:'2:59:59',focus:[['Run durability','Building'],['Aerobic efficiency','Progressing'],['Race-specific preparation','Next phase']]},
tri:{overline:'TRIATHLON / QUALIFICATION',title:'World championship qualification',desc:'Balance the swim, bike and run — with recovery and real-life constraints included.',unit:'DIRECTION',value:'Qualify',focus:[['Swim consistency','Developing'],['Bike-to-run resilience','Build phase'],['Race execution','Qualifying focus']]},
bike:{overline:'CYCLING / POWER DEVELOPMENT',title:'Raise your FTP',desc:'Improve sustainable power and the endurance to use it when it matters.',unit:'SAMPLE FTP TARGET',value:'300 W',focus:[['Aerobic base','Building'],['Threshold development','Progressing'],['Power durability','Next focus']]},
open:{overline:'CONTINUOUS / NO-RACE MODE',title:'Train for life',desc:'Stay active, build consistency and improve health and performance without a race deadline.',unit:'YOUR PRIORITY',value:'Feel stronger',focus:[['Training consistency','Weekly rhythm'],['Sleep & recovery','Personal trends'],['Enjoyment and flexibility','Part of the plan']]}
};
function setGoal(key){selectedGoal=key;let data=goals[key];if(!data)return;all('[data-goal]').forEach(b=>{let on=b.dataset.goal===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('goal-overline').textContent=data.overline;$('goal-title').textContent=data.title;$('goal-desc').textContent=data.desc;$('goal-unit').textContent=data.unit;$('goal-value').textContent=data.value;const rows=$('goal-focus-rows');rows.replaceChildren(...data.focus.map(([label,value])=>{let div=document.createElement('div'),span=document.createElement('span'),b=document.createElement('b');span.textContent=label;b.textContent=value;div.append(span,b);return div}));syncGoalDemos()}all('[data-goal]').forEach(b=>b.addEventListener('click',()=>setGoal(b.dataset.goal)));
const week=[['MONDAY / RUNNING','Easy aerobic run','Build frequency while controlling effort.','45 min'],['TUESDAY / CYCLING','Steady endurance ride','Support aerobic fitness without extra impact.','75 min'],['WEDNESDAY / SUPPORT','Core + mobility','Maintain useful movement quality and strength.','25 min'],['THURSDAY / RUNNING','Threshold development','Progress only when recent load and recovery support it.','50 min'],['FRIDAY / RECOVERY','Rest / optional walk','Absorb the training you have completed.','Flexible'],['SATURDAY / RUNNING','Long aerobic run','Build race-relevant durability at sustainable effort.','90 min'],['SUNDAY / CYCLING','Recovery spin','Easy aerobic movement, subject to how the legs feel.','45 min']];
function setDay(index){selectedDay=index;const d=goalWeeks[selectedGoal][index];if(!d)return;all('[data-day]').forEach(b=>{let on=Number(b.dataset.day)===index;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});$('week-label').textContent=d[0];$('week-title').textContent=d[1];$('week-why').textContent=d[2];$('week-duration').textContent=d[3]}all('[data-day]').forEach(b=>b.addEventListener('click',()=>setDay(Number(b.dataset.day))));
const scenarios={
ready:{tone:'ON TRACK',title:'Tempo run',meta:'50 min · Controlled effort',explain:'No new constraints were reported in this example. The session can stay as planned, subject to updated recovery and symptom evidence.',note:'Calendar commitments are not silently changed.'},
sleep:{tone:'LOW RECOVERY',title:'Easy aerobic run',meta:'35 min · Conversational effort',explain:'A short night and HRV below personal baseline would warrant considering reduced intensity. Confirm how you feel before choosing a suitable alternative.',note:'Tomorrow is reassessed with fresh observations, rather than automatically rescheduling intensity.'},
time:{tone:'LIMITED TIME',title:'Short easy run',meta:'30 min · Aerobic',explain:'A compact session preserves useful aerobic work without trying to squeeze the full planned session into half the time.',note:'Uncompleted minutes are not added to tomorrow as training debt.'},
travel:{tone:'TRAVEL DAY',title:'Travel-day recovery',meta:'20 min · Walking / mobility',explain:'A disrupted routine can make a lower-cost recovery option more useful than forcing the original workout.',note:'The week is adjusted around your actual availability.'},
injury:{tone:'SYMPTOM FLAG',title:'Hold impact training',meta:'Rest / symptom-guided recovery',explain:'Pain or recurring injury symptoms take priority over the schedule. Avoid running through symptoms and seek qualified assessment when appropriate.',note:'An easy cycling session does not, by itself, confirm safe return to running.'}
};
function setScenario(key){selectedScenario=key;const s={...scenarios[key]};if(key==='ready'){s.title=goalSessions[selectedGoal].title;s.meta=goalSessions[selectedGoal].meta}if(key==='sleep'||key==='time'){s.title=selectedGoal==='bike'?'Easy endurance ride':selectedGoal==='tri'?'Easy technique swim':selectedGoal==='open'?'Easy walk or ride':s.title}if(!s)return;all('[data-scenario]').forEach(b=>{let on=b.dataset.scenario===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('original-title').textContent=goalSessions[selectedGoal].title;$('original-meta').textContent=goalSessions[selectedGoal].meta;$('scenario-tone').textContent='/ '+s.tone;$('scenario-title').textContent=s.title;$('scenario-meta').textContent=s.meta;$('scenario-explanation').textContent=s.explain;$('scenario-note').textContent=s.note;const detouring=key!=='ready';document.getElementById('journey')?.classList.toggle('is-detouring',detouring);$('reroute-label').textContent=detouring?'Detour suggested · A different way forward':'Original route · No adjustment required';$('reroute-banner').classList.toggle('is-rerouting',detouring)}all('[data-scenario]').forEach(b=>b.addEventListener('click',()=>setScenario(b.dataset.scenario)));

// Every public figure is a sample comparison, never a forecast or owner history.
const goalSessions={run:{title:'Tempo run',meta:'50 min · Controlled effort'},tri:{title:'Steady technique swim',meta:'40 min · Technique focus'},bike:{title:'Steady endurance ride',meta:'60 min · Aerobic effort'},open:{title:'Walk + strength',meta:'35 min · Comfortable effort'}};
const goalWeeks={run:week,tri:week.map((d,i)=>i%2===0?['TRIATHLON / SWIM','Technique swim','Illustrative balance across swim, bike, run and recovery.','40 min']:d),bike:week.map((d,i)=>[d[0].split(' / ')[0]+' / CYCLING',i===4?'Rest / optional walk':'Endurance ride',i===4?'Illustrative recovery day.':'Illustrative aerobic development; no promised FTP outcome.',i===4?'Flexible':i===5?'120 min':'60 min']),open:week.map((d,i)=>[d[0].split(' / ')[0]+' / CONTINUOUS',i===4?'Rest / optional walk':i%2?'Strength + mobility':'Walk or easy ride','Illustrative flexible movement, with no race deadline.',i===4?'Flexible':'30 min'])};
const proof={
 run:{volume:{title:'Weekly running distance',unit:'km / week',values:[25,31,28,37,35,43,45,52],context:'Eight sample weeks · completed running distance'},speed:{title:'Pace at matched heart rate',unit:'min/km',values:[330,324,319,314,311,307,302,298],pace:true,context:'Eight comparable easy runs · sample average HR 145 bpm'},power:{title:'Longest easy run',unit:'min',values:[55,60,65,60,70,75,80,90],context:'Eight sample weeks · longest completed easy run'},recovery:{title:'Sleep consistency',unit:'nights / week',values:[3,4,3,4,5,4,5,6],context:'Eight sample weeks · nights with at least 7 hours'},support:[['Matched-HR pace','5:30 → 4:58 /km'],['Longest easy run','55 → 90 min'],['Run frequency','3 → 4 /week']]},
 tri:{volume:{title:'Weekly triathlon training',unit:'hours / week',values:[6,6.5,7,6.5,8,8.5,8,9],context:'Eight sample weeks · total swim, bike and run time'},speed:{title:'Steady swim pace',unit:'sec / 100m',values:[130,129,127,128,125,123,122,120],lower:true,context:'Eight comparable sample pool sets · same distance'},power:{title:'Bike-to-run sessions',unit:'sessions / 4 weeks',values:[1,1,2,2,2,3,3,4],context:'Eight sample rolling four-week windows'},recovery:{title:'Recovery days respected',unit:'days / 4 weeks',values:[4,5,4,5,6,5,6,6],context:'Eight sample rolling four-week windows'},support:[['Swim pace','130 → 120 s/100m'],['Brick consistency','1 → 4 /4 weeks'],['Qualification','Target, not a result']]},
 bike:{volume:{title:'Weekly cycling time',unit:'hours / week',values:[4,4.5,5,4.5,6,6.5,6,7],context:'Eight sample weeks · completed cycling time'},speed:{title:'Longest endurance ride',unit:'min',values:[75,80,90,85,100,110,105,120],context:'Eight sample weeks · longest completed ride'},power:{title:'Comparable FTP tests',unit:'W',values:[250,252,258,257,265,269,272,278],context:'Eight sample tests · same protocol over 16 weeks'},recovery:{title:'Sleep consistency',unit:'nights / week',values:[3,4,3,4,5,5,4,6],context:'Eight sample weeks · nights with at least 7 hours'},support:[['Comparable FTP tests','250 → 278 W'],['Longest steady ride','75 → 120 min'],['300 W goal','Target, not a forecast']]},
 open:{volume:{title:'Weekly movement time',unit:'min / week',values:[90,105,100,120,125,140,135,150],context:'Eight sample weeks · completed comfortable movement'},speed:{title:'Strength consistency',unit:'sessions / 4 weeks',values:[3,4,4,5,5,6,6,7],context:'Eight sample rolling four-week windows'},power:{title:'Comfortable walk duration',unit:'min',values:[15,18,20,18,22,25,25,30],context:'Eight sample weekly walks · comfortable effort'},recovery:{title:'Sleep consistency',unit:'nights / week',values:[3,4,3,4,5,4,5,6],context:'Eight sample weeks · nights with at least 7 hours'},support:[['Movement rhythm','90 → 150 min/week'],['Strength sessions','3 → 7 /4 weeks'],['Destination','No race required']]}
};
const format=(v,c)=>c.pace?`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`:String(v);
function setMetric(key){
 selectedMetric=key;const c=proof[selectedGoal][key];if(!c)return;
 all('[data-metric]').forEach(b=>{const on=b.dataset.metric===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 $('progress-heading').textContent=c.title;$('progress-window').textContent='ILLUSTRATIVE / '+c.context;
 $('progress-value').replaceChildren(document.createTextNode(format(c.values.at(-1),c)+' '));const unit=document.createElement('small');unit.textContent=c.unit;$('progress-value').append(unit);
 $('progress-sub').textContent='Last sample observation';$('progress-comparison').textContent=`${format(c.values[0],c)} → ${format(c.values.at(-1),c)} ${c.unit}. ${c.context}.`;
 const chart=$('progress-chart');chart.setAttribute('aria-label',`Illustrative ${c.title}: ${c.values.map(v=>format(v,c)).join(', ')} ${c.unit}. ${c.context}.`);
 let lo=Math.min(...c.values),hi=Math.max(...c.values),range=hi-lo||1;lo-=range*.2;hi+=range*.2;
 const coords=c.values.map((v,i)=>[25+i*575/7,210-(v-lo)/(hi-lo)*170]);
 const line=coords.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join(' ');
 $('chart-line').setAttribute('d',line);$('chart-line').setAttribute('stroke','#58c6ff');$('chart-area').setAttribute('d',line+' L600 210 L25 210Z');
 $('chart-dots').replaceChildren(...coords.map(([x,y])=>{const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');for(const [k,v] of Object.entries({cx:x,cy:y,r:4,fill:'#58c6ff'}))dot.setAttribute(k,String(v));return dot}));
 $('chart-scale').textContent=`Range: ${format(Math.min(...c.values),c)}–${format(Math.max(...c.values),c)} ${c.unit}${c.pace||c.lower?' · lower is faster':''}`;
 all('.chart-axis span').forEach((el,i)=>el.textContent=(c.context.includes('tests')?'TEST ':c.context.includes('runs')||c.context.includes('sets')?'SET ':'WK ')+String(i+1).padStart(2,'0'));
 $('proof-support').replaceChildren(...proof[selectedGoal].support.map(([label,value])=>{const div=document.createElement('div'),span=document.createElement('span'),b=document.createElement('b');span.textContent=label;b.textContent=value;div.append(span,b);return div}));
}
function syncGoalDemos(){
 all('[data-day]').forEach((b,i)=>{const row=goalWeeks[selectedGoal][i],icon=b.querySelector('.sport');icon.className='sport '+(row[0].includes('RECOVERY')||row[1].startsWith('Rest')?'off':selectedGoal==='bike'?'bike':selectedGoal==='open'?'mobility':row[0].includes('SWIM')?'swim':row[0].includes('CYCLING')?'bike':row[0].includes('SUPPORT')?'mobility':'run');b.setAttribute('aria-label',`${row[0]}: ${row[1]}, ${row[3]}`)});
 setDay(selectedDay);setScenario(selectedScenario);setMetric(selectedMetric);
 const labels={run:['Prepare for the start line','A marathon is a checkpoint, never a promised sub-3.'],tri:['Prepare for a qualifying attempt','Qualification depends on race conditions and the field.'],bike:['Review a comparable power test','An FTP target guides training; a test supplies evidence.'],open:['Keep a sustainable rhythm','No finish line or race achievement is required.']};
 $('long-checkpoint').textContent=labels[selectedGoal][0];$('long-evidence').textContent=labels[selectedGoal][1];$('long-next').textContent=selectedGoal==='open'?'Keep moving through life':'Choose the next chapter';
 all('[data-metric]').forEach((b,i)=>{b.textContent=selectedGoal==='run'?['Volume','Pace','Long run','Recovery'][i]:selectedGoal==='tri'?['Volume','Swim pace','Brick sessions','Recovery'][i]:selectedGoal==='bike'?['Volume','Long ride','FTP tests','Recovery'][i]:['Movement','Strength','Walk','Recovery'][i]});
}
all('[data-metric]').forEach(b=>b.addEventListener('click',()=>setMetric(b.dataset.metric)));
setGoal('run');

// One controller owns geometry, head, focus and arrivals. Path sampling happens
// ONLY after layout; scroll frames read scrollY and cached arc/Y lookup tables.
const journey=$('journey'),svg=document.querySelector('.journey-svg');
const track=$('journey-track'),ink=$('journey-ink'),beacon=$('journey-beacon');
const detour=$('journey-detour'),sections=all('.stage'),waypointLayer=$('route-waypoints');
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
const stops=[['left','◎','UNDERSTAND'],['right','◇','SET A GOAL'],['center','↗','YOUR PLAN'],['left','↝','DETOUR / ADAPT'],['right','★','PROGRESS'],['center','◉','NEXT CHAPTER']];
const nodes=stops.map(([side,icon,label],i)=>{
 const a=document.createElement('a');a.className='route-stop';a.href='#'+sections[i].id;a.dataset.side=side;
 a.setAttribute('aria-label',`Stop ${i+1} of 6: ${label.toLowerCase()}`);
 for(const extra of ['', ' second']){const ring=document.createElement('span');ring.className='route-stop-ring'+extra;ring.setAttribute('aria-hidden','true');a.append(ring)}
 const symbol=document.createElement('span');symbol.className='route-stop-icon';symbol.textContent=icon;symbol.setAttribute('aria-hidden','true');a.append(symbol);
 const note=document.createElement('span');note.className='route-stop-label';note.textContent=`${String(i+1).padStart(2,'0')} / ${label}`;a.append(note);
 a.addEventListener('click',event=>{if(!anchors[i])return;event.preventDefault();history.replaceState(null,'',a.hash);scrollTo({top:top+anchors[i].y-innerHeight*.5,behavior:reducedQuery.matches?'instant':'smooth'})});waypointLayer.append(a);return a;
});
let frame=0,layoutNeeded=true,total=0,top=0,table=[],anchors=[],previous=null,current=-1;
const armed=nodes.map(()=>true),timers=nodes.map(()=>0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function layout(){
 const root=journey.getBoundingClientRect(),width=root.width,height=journey.offsetHeight;
 top=root.top+scrollY;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const mobile=width<=800,edge=mobile?23:40;
 const bounds=sections.map(s=>s.getBoundingClientRect());
 anchors=bounds.map((b,i)=>({x:stops[i][0]==='left'?edge:stops[i][0]==='right'?width-edge:width*.5,y:b.top-root.top+52,distance:0}));
 let d=`M ${anchors[0].x} ${anchors[0].y-70}`;
 const probe=document.createElementNS('http://www.w3.org/2000/svg','path');
 let prev={x:anchors[0].x,y:anchors[0].y-70};
 function curve(next){const dy=next.y-prev.y;d+=` C ${prev.x} ${prev.y+dy*.45} ${next.x} ${next.y-dy*.45} ${next.x} ${next.y}`;prev=next}
 anchors.forEach((a,i)=>{
  curve(a);probe.setAttribute('d',d);a.distance=probe.getTotalLength();
  // Centre stops peel into the empty top margin, then use the outer gutter.
  const gutter=stops[i][0]==='right'?width-edge:edge;
  if(stops[i][0]==='center')curve({x:gutter,y:a.y+48});
  const bottom=bounds[i].bottom-root.top;
  curve({x:gutter,y:bottom-50});
  // Transition sides only in the reserved gap, above the next chapter's copy.
  if(i<anchors.length-1)curve({x:anchors[i+1].x,y:anchors[i+1].y-26});
 });
 curve({x:width*.5,y:height-20});track.setAttribute('d',d);ink.setAttribute('d',d);
 total=ink.getTotalLength();ink.style.strokeDasharray=`${total} ${total}`;
 table=[...Array.from({length:1025},(_,i)=>{const distance=total*i/1024,p=ink.getPointAtLength(distance);return {distance,x:p.x,y:p.y}}),...anchors.map(a=>({...a}))].sort((a,b)=>a.y-b.y);
 anchors.forEach((a,i)=>{nodes[i].style.left=a.x+'px';nodes[i].style.top=a.y+'px';nodes[i].dataset.arc=String(a.distance)});
 const a=anchors[2],b=anchors[3],gap=b.y-a.y;
 // The alternate route stays beside the plan, outside product controls.
 detour.setAttribute('d',`M ${edge} ${a.y+120} C ${edge+14} ${a.y+gap*.4} ${edge+14} ${b.y-60} ${b.x} ${b.y}`);
 previous=null;
}
function atY(y){
 let lo=0,hi=table.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(table[mid].y<y)lo=mid;else hi=mid}
 const a=table[lo],b=table[hi],t=clamp((y-a.y)/(b.y-a.y||1),0,1);
 return {distance:a.distance+(b.distance-a.distance)*t,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
function arrive(i,direction){
 clearTimeout(timers[i]);nodes[i].classList.remove('is-arriving');
 if(!reducedQuery.matches){nodes[i].classList.add('is-arriving');timers[i]=setTimeout(()=>nodes[i].classList.remove('is-arriving'),1050)}
 journey.dispatchEvent(new CustomEvent('journey:arrival',{bubbles:true,detail:{index:i,direction,arc:anchors[i].distance}}));
}
function update(){
 if(!total)return;const p=atY(scrollY+innerHeight*.5-top),distance=p.distance;
 ink.style.strokeDashoffset=String(reducedQuery.matches?0:total-distance);
 beacon.setAttribute('cx',p.x);beacon.setAttribute('cy',p.y);beacon.style.opacity=reducedQuery.matches?'0':'1';
 let best=0,bestDistance=Infinity;
 anchors.forEach((a,i)=>{const delta=Math.abs(distance-a.distance);if(delta<bestDistance){best=i;bestDistance=delta}});
 // Sixteen arc pixels of hysteresis avoid focus chatter between stops.
 if(current>=0&&Math.abs(distance-anchors[current].distance)<=bestDistance+16)best=current;
 current=best;
 anchors.forEach((a,i)=>{
  const delta=Math.abs(distance-a.distance),span=Math.min(900,innerHeight*.85),focus=clamp(1-delta/span,0,1);
  sections[i].style.setProperty('--chapter-focus',String(focus*focus*(3-2*focus)));
  const active=i===best&&delta<span;nodes[i].classList.toggle('is-active',active);sections[i].classList.toggle('is-active',active);
  if(active)nodes[i].setAttribute('aria-current','step');else nodes[i].removeAttribute('aria-current');
  if(previous!==null){
   const crossed=(previous<a.distance&&distance>=a.distance)||(previous>a.distance&&distance<=a.distance);
   if(crossed&&armed[i]){arrive(i,distance>previous?'forward':'backward');armed[i]=false}
   else if(delta>48)armed[i]=true;
  }
 });
 previous=distance;
}
function request(needsLayout=false){layoutNeeded ||= needsLayout;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(layoutNeeded){layoutNeeded=false;layout()}update()})}
addEventListener('scroll',()=>request(),{passive:true});addEventListener('resize',()=>request(true),{passive:true});
if('ResizeObserver' in window){const observer=new ResizeObserver(()=>request(true));observer.observe(journey)}
reducedQuery.addEventListener('change',()=>{nodes.forEach(n=>n.classList.remove('is-arriving'));request(true)});
document.fonts?.ready.then(()=>request(true));request(true);
})();
