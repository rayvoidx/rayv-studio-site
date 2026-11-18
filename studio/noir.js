/* Read-only interface enhancement. Motion never represents invented production activity. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=document.documentElement;
const media=matchMedia('(prefers-reduced-motion: reduce)');
let choice=sessionStorage.getItem('rayv-motion');
const reduced=()=>media.matches||choice==='reduced';
function applyMotion(){
 root.dataset.motion=reduced()?'reduced':'full';
 const b=$('noir-motion');if(!b)return;
 b.textContent=reduced()?'MOTION OFF':'MOTION ON';
 b.setAttribute('aria-pressed',String(!reduced()));
 b.disabled=media.matches;
 b.setAttribute('aria-label',media.matches?'시스템 설정에 따라 모션 줄임':'화면 모션 '+(reduced()?'켜기':'줄이기'));
}
applyMotion();media.addEventListener('change',applyMotion);
$('noir-motion')?.addEventListener('click',()=>{
 choice=reduced()?'full':'reduced';sessionStorage.setItem('rayv-motion',choice);applyMotion();
});
const main=document.querySelector('.page-body>.container-xl');
main.id='studio-main';main.tabIndex=-1;main.setAttribute('role','main');
const stats=main.querySelector('.kpi-section');stats.id='studio-overview';
const quick=main.querySelector('.quick-grid');
const tabs=main.querySelector('.nav-tabs');
const monitor=$('monitor-tab');
const switchTab=window.switchTab;
window.switchTab=tab=>{switchTab(tab);stats.classList.toggle('hidden',tab!=='monitor');quick.classList.toggle('hidden',tab!=='monitor');};
if(tabs&&stats&&quick){tabs.after(stats,quick);}
document.querySelector('.studio-calendar').id='studio-calendar';
document.querySelector('.studio-architecture').id='studio-system';
$('studio-fresh').setAttribute('role','status');
$('studio-fresh').setAttribute('aria-live','off');
$('studio-document').setAttribute('aria-labelledby','studio-document-title');
let documentOrigin;
const dateStrip=$('studio-dates');
dateStrip.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey)return;
 const buttons=[...dateStrip.querySelectorAll('button')];
 const index=buttons.indexOf(document.activeElement);if(index<0)return;
 const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+(e.key==='ArrowRight'?1:-1)));
 e.preventDefault();buttons[next].click();buttons[next].focus({preventScroll:true});
 buttons[next].scrollIntoView({block:'nearest',inline:'center',behavior:reduced()?'instant':'smooth'});
});
const dateControls=document.createElement('div');dateControls.className='noir-date-controls';
dateControls.innerHTML='<span>SCROLL THROUGH RELEASES</span><button type="button" aria-label="이전 날짜 목록">←</button><button type="button" aria-label="다음 날짜 목록">→</button>';
dateStrip.before(dateControls);
dateControls.querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>dateStrip.scrollBy({left:(i?1:-1)*Math.max(250,dateStrip.clientWidth*.7),behavior:reduced()?'instant':'smooth'})));
addEventListener('studio-observation-error',()=>{
 document.querySelector('.status-text').textContent='LAST OBSERVATION';
 document.querySelector('.navbar-status').dataset.error='true';
});
document.addEventListener('click',e=>{
 const doc=e.target.closest('[data-document]');if(doc)documentOrigin=doc.dataset.document;
 const jump=e.target.closest('[data-noir-target]');if(!jump)return;
 const target=$(jump.dataset.noirTarget);if(!target)return;
 e.preventDefault();
 if(monitor.classList.contains('hidden'))window.switchTab('monitor');
 target.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
 target.tabIndex=-1;target.focus({preventScroll:true});
});
$('studio-document').addEventListener('close',()=>{
 const trigger=[...document.querySelectorAll('[data-document]')].find(b=>b.dataset.document===documentOrigin);
 trigger?.focus({preventScroll:true});
});
$('studio-document').addEventListener('click',e=>{
 if(e.target!==e.currentTarget)return;
 const r=e.currentTarget.getBoundingClientRect();
 if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();
});
const progress=$('noir-progress');const top=$('noir-top');
let scrollQueued=false;
function scrollState(){
 scrollQueued=false;
 const max=root.scrollHeight-innerHeight;
 progress.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;
 top.dataset.visible=String(scrollY>650);
 const links=[...document.querySelectorAll('[data-noir-target]')];
 const sections=[...new Set(links.map(a=>$(a.dataset.noirTarget)))].filter(node=>node&&node.getClientRects().length)
   .map(node=>({node,top:node.getBoundingClientRect().top})).sort((a,b)=>a.top-b.top);
 let active=sections[0];
 sections.forEach(x=>{if(x.top<innerHeight*.4)active=x});
 links.forEach(a=>a.setAttribute('aria-current',String(a.dataset.noirTarget===active?.node.id)));
}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(scrollState)}},{passive:true});
addEventListener('resize',()=>{
 scrollState();
 const active=dateStrip.querySelector('[aria-pressed=true]');
 if(active){const a=active.getBoundingClientRect(),r=dateStrip.getBoundingClientRect();dateStrip.scrollLeft+=a.left-r.left-(dateStrip.clientWidth-a.width)/2;}
});
top.addEventListener('click',()=>{scrollTo({top:0,behavior:reduced()?'instant':'smooth'});document.querySelector('.navbar-brand').focus({preventScroll:true})});
const reveal=new IntersectionObserver(entries=>{
 for(const entry of entries){if(entry.isIntersecting){
   if(!reduced())entry.target.classList.add('noir-reveal');reveal.unobserve(entry.target);
 }}
},{threshold:.05});
const observed=new WeakSet();
function enhance(){
 document.querySelectorAll('.card,.kpi-section,.quick-grid').forEach(node=>{
   if(!observed.has(node)){observed.add(node);node.classList.add('noir-section');reveal.observe(node)}
 });
 scrollState();
}
let enhanceQueued=false;
new MutationObserver(records=>{
 const addedSection=records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&
   (node.matches('.card,.kpi-section,.quick-grid')||node.querySelector('.card,.kpi-section,.quick-grid'))));
 if(addedSection&&!enhanceQueued){enhanceQueued=true;requestAnimationFrame(()=>{enhanceQueued=false;enhance()});}
}).observe(main,{childList:true,subtree:true});
enhance();
const snapshots=new WeakMap();let flashTimer;
function flashMetrics(){
 document.querySelectorAll('.kpi-value,.stat-card>.value').forEach(node=>{
   const current=node.textContent;const previous=snapshots.get(node);snapshots.set(node,current);
   if(previous!==undefined&&previous!==current&&!reduced()){
     node.animate([{opacity:.45,transform:'translateY(3px)'},{opacity:1,transform:'none'}],
       {duration:400,easing:'ease-out'});
   }
 });
}
flashMetrics();
new MutationObserver(()=>{clearTimeout(flashTimer);flashTimer=setTimeout(flashMetrics,380)})
 .observe(main,{childList:true,characterData:true,subtree:true});
const render=window.renderStudio;
window.renderStudio=(data,state)=>{
 const focusedDate=document.activeElement?.closest('[data-studio-date]');
 const date=focusedDate?.dataset.studioDate;
 const focused=document.activeElement?.closest('#studio-slots a');
 const href=focused?.getAttribute('href');
 render(data,state);
 if(focusedDate&&!focusedDate.isConnected&&date){[...document.querySelectorAll('[data-studio-date]')].find(b=>b.dataset.studioDate===date)?.focus({preventScroll:true});}
 if(focused&&!focused.isConnected&&href){
   [...document.querySelectorAll('#studio-slots a')].find(a=>a.getAttribute('href')===href)?.focus({preventScroll:true});
 }
 const status=document.querySelector('.status-text');
 status.textContent=state.error?'LAST OBSERVATION':'OBSERVATION LIVE';
 document.querySelector('.navbar-status').dataset.error=String(Boolean(state.error));
};
let refreshReset;
$('noir-refresh')?.addEventListener('click',async e=>{
 clearTimeout(refreshReset);
 const button=e.currentTarget;button.disabled=true;button.textContent='갱신 중…';
 try{const ok=await window.refreshStudio();button.textContent=ok?'갱신 완료 ✓':'연결 확인 필요';}
 catch{button.textContent='연결 확인 필요';}
 finally{button.disabled=false;refreshReset=setTimeout(()=>{button.textContent='새로고침 ↻'},1800)}
});
})();
