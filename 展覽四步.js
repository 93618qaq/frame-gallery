/* awwwards-motion §1: k=300, damping=26, mass=1.
 * Shared image continuity, spring entrances, local photo selection, stable compare size.
 * No new library, no continuous ambient RAF, no modification of the 3D viewer. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let photoOrigin=null, flights=new Set(), animations=new Set(), size=440, shotVersion=0;
 const frameIds=new Set();
 function spring(update,done){
  if(reduced.matches){update(1);done?.();return}
  let x=0,v=0,last=0,start=0,id;
  const cancel=()=>{cancelAnimationFrame(id);frameIds.delete(cancel);done?.()};
  const step=now=>{if(!start)start=now;const dt=Math.min(.024,(now-(last||now-16))/1000);last=now;v+=(300*(1-x)-26*v)*dt;x+=v*dt;update(x);
   if((Math.abs(1-x)+Math.abs(v)<.008)||now-start>1100){update(1);frameIds.delete(cancel);done?.()}else id=requestAnimationFrame(step)};
  frameIds.add(cancel);id=requestAnimationFrame(step);return cancel;
 }
 function springFrames(distance=24){let x=0,v=0;const frames=[];for(let i=0;i<=60;i++){v+=(300*(1-x)-26*v)/60;x+=v/60;frames.push({opacity:Math.min(1,x),transform:'translateY('+((1-x)*distance).toFixed(3)+'px)'});}frames.push({opacity:1,transform:'translateY(0)'});return frames}
 function reveal(el,i=0){if(!el||reduced.matches)return;const a=el.animate(springFrames(),{duration:700,delay:Math.min(i,5)*55,fill:'backwards'});animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a))}
 function cleanup(){for(const c of [...frameIds])c();for(const a of animations)a.cancel();animations.clear();for(const el of flights)el.remove();flights.clear()}
 function movePhoto(){
  const origin=photoOrigin;photoOrigin=null;const target=document.querySelector('.ex-continuity');
  if(!origin||!target||reduced.matches||performance.now()-origin.time>1800)return;
  requestAnimationFrame(()=>{
   if(!target.isConnected)return;
   const to=target.getBoundingClientRect(),from=origin.rect;if(!to.width||to.top>innerHeight||from.top>innerHeight)return;
   const el=document.createElement('img');el.src=origin.src;el.alt='';el.setAttribute('aria-hidden','true');el.className='ex-photo-flight';document.body.append(el);flights.add(el);
   spring(t=>{el.style.left=(from.left+(to.left-from.left)*t)+'px';el.style.top=(from.top+(to.top-from.top)*t)+'px';el.style.width=(from.width+(to.width-from.width)*t)+'px';el.style.height=(from.height+(to.height-from.height)*t)+'px';el.style.opacity=String(1-Math.max(0,(t-.8)*5))},()=>{el.remove();flights.delete(el)});
  });
 }
 window.exhibitionRender=quiet=>{
  cleanup();shotVersion++;
  const current=document.body.dataset.exhibit;
  const slider=document.getElementById('ex-compare-size');if(slider){slider.value=String(size);document.querySelector('.cmp')?.style.setProperty('--compare-size',size+'px')}
  if(current==='home'){photoOrigin=null;return}
  const active=document.querySelector('.ex-filter .pill.on'),rail=active?.parentElement;
  if(active&&rail&&rail.scrollWidth>rail.clientWidth)rail.scrollLeft=active.offsetLeft-rail.offsetLeft-(rail.clientWidth-active.offsetWidth)/2;
  if(!quiet){reveal(document.querySelector('.ex-heading'));document.querySelectorAll('.ex-selection .wcard,.ex-selected,.method-card,.ex-salon,.ex-no-photo,.cmp .col').forEach((el,i)=>reveal(el,i+1));movePhoto()}
  else if(current==='4'){document.querySelectorAll('.cmp .col').forEach((el,i)=>reveal(el,i))}

 };
 document.addEventListener('click',e=>{
  const route=e.target.closest('.wcard,.method-card');
  if(route&&document.body.dataset.exhibit!=='home'&&!reduced.matches){const img=route.querySelector('img');if(img)photoOrigin={rect:img.getBoundingClientRect(),src:img.currentSrc,time:performance.now()}}
  const shot=e.target.closest('[data-shot]');if(!shot)return;
  const p=window.DATA.photos.find(p=>p.id===+shot.dataset.shot),hero=document.querySelector('.ex-hero-photo');if(!p||!hero)return;
  const img=hero.querySelector('img'),version=++shotVersion;
  // Update committed state immediately; the animation begins after the actual image decodes.
  hero.dataset.id=p.id;img.src='images/b'+p.id+'.jpg';img.alt=p.t;
  document.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-pressed',String(b===shot)));
  const total=document.querySelectorAll('[data-shot]').length;
  document.getElementById('ex-shot-count').textContent=String(+shot.dataset.shotIndex+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
  document.getElementById('ex-shot-caption').textContent=p.t;
  img.getAnimations().forEach(a=>a.cancel());
  img.decode().then(()=>{if(version===shotVersion&&img.isConnected)reveal(img)}).catch(()=>{});
 });
 document.addEventListener('input',e=>{if(e.target.id!=='ex-compare-size')return;size=+e.target.value;document.querySelector('.cmp')?.style.setProperty('--compare-size',size+'px')});
 document.addEventListener('toggle',e=>{if(e.target.matches?.('.ex-layer-details')&&e.target.open)reveal(e.target.querySelector('.mpanel'))},true);
 reduced.addEventListener('change',()=>{if(reduced.matches){cleanup();photoOrigin=null}});
 let wall=null,px=0,py=0,lightFrame=0;
 document.addEventListener('pointermove',e=>{
  if(reduced.matches||e.pointerType==='touch')return;
  wall=e.target.closest('.ex-salon,.ex-selected-image,.ex-compare-wall');px=e.clientX;py=e.clientY;
  if(!wall||lightFrame)return;
  lightFrame=requestAnimationFrame(()=>{lightFrame=0;if(!wall?.isConnected)return;const r=wall.getBoundingClientRect();wall.style.setProperty('--light-x',Math.max(15,Math.min(85,(px-r.left)/r.width*100))+'%');wall.style.setProperty('--light-y',Math.max(0,Math.min(80,(py-r.top)/r.height*100))+'%')});
 },{passive:true});
 window.exhibitionRender(false);
})();
