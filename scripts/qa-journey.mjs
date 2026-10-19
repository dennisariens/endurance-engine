// Public/private checks against the same compiled Express + real-PG TLS harness.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
export async function verifyJourney(browser,origin){
 const out='artifacts/journey';await mkdir(out,{recursive:true});
 const errors=[],requests=[],arrivals=[],viewportResults=[],motion=[];
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{
  window.__arrivals=[];window.__violations=[];
  document.addEventListener('journey:arrival',e=>window.__arrivals.push({...e.detail,time:performance.now()}));
  document.addEventListener('securitypolicyviolation',e=>window.__violations.push(e.violatedDirective));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>requests.push(new URL(r.url()).pathname));
 await page.goto(origin);await page.locator('.route-stop').first().waitFor();
 assert.equal(await page.locator('.stage').count(),6);assert.equal(await page.locator('dialog').count(),0);
 const policy=(await context.request.get(origin)).headers()['content-security-policy'];assert.ok(policy.includes("connect-src 'none'"));assert.ok(!policy.includes('unsafe-inline'));
 await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to the journey');
 await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'#journey');assert.equal(await page.locator(':focus').getAttribute('id'),'journey');
 async function settled(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
 async function geometry(){return page.evaluate(()=>{const j=document.getElementById('journey').getBoundingClientRect();return [...document.querySelectorAll('.route-stop')].map(n=>({x:parseFloat(n.style.left),y:scrollY+j.top+parseFloat(n.style.top),arc:Number(n.dataset.arc)}))})}
 async function move(y){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await settled()}
 async function sweep(width,height){
  await page.setViewportSize({width,height});await settled();const stops=await geometry();
  await page.evaluate(()=>{window.__arrivals=[];document.documentElement.style.scrollBehavior='auto'});
  await move(stops[0].y-height/2-150);
  for(const [direction,indexes] of [['forward',[0,1,2,3,4,5]],['backward',[5,4,3,2,1,0]]]){
   if(direction==='backward')await move(stops[5].y-height/2+160);
   for(const i of indexes){
    const delta=direction==='forward'?1:-1;
    await move(stops[i].y-height/2-delta*100);await move(stops[i].y-height/2+delta*.5);
    const state=await page.evaluate(i=>{
     const n=document.querySelectorAll('.route-stop')[i],s=document.querySelectorAll('.stage')[i],b=document.getElementById('journey-beacon');
     return {selected:n.getAttribute('aria-current'),focus:Number(s.style.getPropertyValue('--chapter-focus')),x:Number(b.getAttribute('cx')),y:Number(b.getAttribute('cy')),active:[...document.querySelectorAll('.stage')].filter(n=>n.classList.contains('is-active')).length};
    },i);
    assert.equal(state.selected,'step');assert.ok(state.focus>.99);assert.equal(state.active,1);assert.ok(Math.abs(state.x-stops[i].x)<5,JSON.stringify({width,direction,i,state,stop:stops[i]}));
    const pulse=await page.locator('.route-stop').nth(i).evaluate(n=>getComputedStyle(n.querySelector('.route-stop-ring')).animationDuration);assert.equal(pulse,'0.85s');
    await page.waitForTimeout(1100);assert.equal(await page.locator('.is-arriving').count(),0);
    await move(stops[i].y-height/2+delta*140);await move(stops[i].y-height/2+delta*160);
   }
  }
  const actual=await page.evaluate(()=>window.__arrivals);for(const direction of ['forward','backward'])for(let i=0;i<6;i++)assert.equal(actual.filter(x=>x.index===i&&x.direction===direction).length,1,`${width} ${direction} stop ${i+1}`);
  arrivals.push({width,height,events:actual});
 }
 console.log('Journey scroll sweeps');await sweep(1440,1000);await sweep(390,844);
 await page.emulateMedia({reducedMotion:'reduce'});
 // No owner/API traffic during page load or public demo interaction.
 for(const goal of ['run','tri','bike','open']){
  console.log('Journey matrix:',goal);await page.locator(`[data-goal="${goal}"]`).click();
  for(const scenario of ['ready','sleep','time','travel','injury']){
   await page.locator(`[data-scenario="${scenario}"]`).click();
   assert.ok((await page.locator('#scenario-title').textContent()).length>4);
   if(goal==='bike'&&scenario==='ready')assert.match(await page.locator('#scenario-title').textContent(),/ride/i);
   for(let day=0;day<7;day++){
    await page.locator(`[data-day="${day}"]`).click();assert.equal(await page.locator('[data-day][aria-pressed="true"]').count(),1);
    if(goal==='open')assert.doesNotMatch(await page.locator('#week-why').textContent(),/race-relevant/i);
   }
   for(const metric of ['volume','speed','power','recovery']){
    await page.locator(`[data-metric="${metric}"]`).click();assert.match(await page.locator('#progress-window').textContent(),/ILLUSTRATIVE/);
    assert.match(await page.locator('#progress-chart').getAttribute('aria-label'),/Illustrative/);
    assert.match(await page.locator('#progress-comparison').textContent(),/→/);
   }
  }
  if(goal==='open')assert.match(await page.locator('#long-checkpoint').textContent(),/sustainable rhythm/);
 }
 assert.ok(!requests.some(p=>p.startsWith('/api/')));assert.deepEqual(await page.evaluate(()=>window.__violations),[]);
 await page.locator('[data-goal="run"]').click();await page.locator('[data-scenario="ready"]').click();await page.locator('[data-metric="volume"]').click();
 await page.emulateMedia({reducedMotion:'no-preference'});
 console.log('Journey responsive captures');for(const width of [1440,1280,768,390,375]){
  await page.setViewportSize({width,height:width<500?844:1000});await move(0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  if(width<500)assert.ok(await page.locator('[data-goal],[data-day],[data-scenario],[data-metric],.menu-toggle,.route-stop').evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect();return r.width>=44&&r.height>=44})),`touch targets at ${width}`);
  for(const id of ['understand','direction','plan','adapt','progress','philosophy']){
   await page.locator('#'+id).scrollIntoViewIfNeeded();await settled();
   const collisions=await page.evaluate(id=>{
    const stop=document.querySelector(`a[href="#${id}"].route-stop`).getBoundingClientRect();
    return [...document.querySelectorAll(`#${id} h2,#${id} .stage-demo`)].filter(n=>{const r=n.getBoundingClientRect();return r.left<stop.right&&r.right>stop.left&&r.top<stop.bottom&&r.bottom>stop.top}).length;
   },id);assert.equal(collisions,0,`${width} ${id} waypoint collision`);
  }
  if(width===390){await page.getByRole('button',{name:'Open menu',exact:true}).click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.ok(await page.locator('#mobile-menu').evaluate(n=>n.hidden))}
  await move(0);await page.screenshot({path:`${out}/hero-${width}.png`});
  await page.locator('#progress').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/proof-${width}.png`});
  await page.locator('#philosophy').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/long-view-${width}.png`});
  await page.locator('#start').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/closing-${width}.png`});
  viewportResults.push({width,noOverflow:true,noWaypointCollisions:true});
 }
 // 200% browser zoom equivalent: CSS viewport halves on a 1440px desktop.
 await page.setViewportSize({width:720,height:500});await move(0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/zoom-200-equivalent.png`});
 // Reduced motion must keep all six chapters readable and every ring static.
 await page.emulateMedia({reducedMotion:'reduce'});await move(0);await settled();
 assert.equal(await page.locator('.route-stop-ring').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).animationName==='none')),true);
 assert.equal(await page.locator('.stage-demo').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).opacity==='1'&&getComputedStyle(n).transform==='none')),true);
 await page.locator('#adapt').scrollIntoViewIfNeeded();await page.locator('[data-scenario="sleep"]').click();assert.equal(await page.locator('#journey-detour').evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.screenshot({path:`${out}/reduced-motion.png`});await page.emulateMedia({reducedMotion:'no-preference'});
 // Local desktop frame intervals and long tasks during a continuous six-stop scroll.
 await page.setViewportSize({width:1440,height:900});await move(0);
 const perf=await page.evaluate(async()=>{
  const frames=[],longTasks=[];const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));observer.observe({type:'longtask',buffered:false});
  const j=document.getElementById('journey'),start=j.getBoundingClientRect().top+scrollY-200,end=start+j.offsetHeight;let previous=0;
  await new Promise(resolve=>{const began=performance.now();function step(now){if(previous)frames.push(now-previous);previous=now;const p=Math.min(1,(now-began)/6500);scrollTo({top:start+(end-start)*p,behavior:'instant'});if(p<1)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)});
  observer.disconnect();frames.sort((a,b)=>a-b);return {durationMs:6500,frames:frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],max:frames.at(-1),longTasks};
 });motion.push(perf);
 const publicApiRequests=requests.filter(p=>p.startsWith('/api/'));page.removeAllListeners('console');
 // The login link works without JavaScript, including app refresh and deep links.
 const nojs=await browser.newContext({ignoreHTTPSErrors:true,javaScriptEnabled:false});const plain=await nojs.newPage();await plain.goto(origin);await plain.locator('.header-actions [data-login]').click();assert.equal(new URL(plain.url()).pathname,'/app');assert.equal(await plain.locator('#root').count(),1);await nojs.close();
 await page.goto(origin+'/app');await page.getByLabel('Owner password').waitFor();await page.reload();await page.getByLabel('Owner password').waitFor();await page.goto(origin+'/app/goals');await page.getByLabel('Owner password').waitFor();
 await context.close();
 // Short artifact recorded separately so multi-minute QA is not committed as video.
 const videoContext=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1280,height:900},recordVideo:{dir:`${out}/video`,size:{width:1280,height:900}}});
 const videoPage=await videoContext.newPage();await videoPage.goto(origin);await videoPage.locator('.route-stop').first().waitFor();
 await videoPage.evaluate(async()=>{const start=0,end=document.documentElement.scrollHeight-innerHeight;await new Promise(resolve=>{const begin=performance.now();function step(now){const p=Math.min(1,(now-begin)/16000);scrollTo({top:start+(end-start)*p,behavior:'instant'});if(p<1)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)})});
 const video=videoPage.video();await videoContext.close();await video.saveAs(`${out}/journey-scroll.webm`);
 assert.deepEqual(errors,[]);const result={browser:await browser.version(),goalScenarioDayCombinations:140,goalScenarioMetricCombinations:80,viewports:viewportResults,arrivals,motion,errors,publicApiRequests,unverified:['Physical iPhone Safari','VoiceOver on physical device','Physical browser UI 200% zoom (half CSS viewport equivalent tested)','Real-device frame performance','Production hosting']};await writeFile(`${out}/results.json`,JSON.stringify(result,null,2));console.log('JOURNEY PASS',JSON.stringify(result,null,2));
}

export async function profileJourney(browser,origin){
 const c=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:900}}),p=await c.newPage();await p.goto(origin);await p.locator('.route-stop').first().waitFor();
 const results=await p.evaluate(async()=>{
  const results=[];const sheet=document.styleSheets[document.styleSheets.length-1];
  for(const [label,rule] of [['repaired-current',null],['no-svg-filters','.journey-ink,#journey-beacon,.journey-detour{filter:none!important}'],['no-blur','.stage-copy::before{filter:none!important}.site-header{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'],['no-topography','.journey-topography,.journey::before{display:none!important}']]){
   if(rule)sheet.insertRule('@media all{'+rule+'}',sheet.cssRules.length);const j=document.getElementById('journey'),start=j.getBoundingClientRect().top+scrollY-100,end=start+j.offsetHeight;const samples=[];let last=0;
   await new Promise(resolve=>{let begin=performance.now();function step(now){if(last)samples.push(now-last);last=now;const t=Math.min(1,(now-begin)/3500);scrollTo({top:start+(end-start)*t,behavior:'instant'});if(t<1)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)});
   samples.sort((a,b)=>a-b);results.push({label,frames:samples.length,p50:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)]});
  }return results;
 });console.log('PAINT PROFILE',JSON.stringify(results,null,2));await c.close();
}
