/* Brand direction and workspace refinement; no audio engine or device authority. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const refresh=$('noir-refresh');
if(refresh){
 const status=document.querySelector('.navbar-status');
 status.insertBefore(refresh,$('noir-motion'));
 refresh.setAttribute('aria-label','관측 새로고침');
 refresh.title='관측 데이터 새로고침';
 new MutationObserver(()=>refresh.setAttribute('aria-busy',String(refresh.disabled)))
  .observe(refresh,{attributes:true,attributeFilter:['disabled']});
}
const dialog=$('house-direction-dialog');let opener;
document.querySelectorAll('[data-house-direction]').forEach(button=>button.addEventListener('click',()=>{
 opener=button;if(!dialog.open)dialog.showModal();
}));
$('house-direction-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{
 const target=opener?.getClientRects().length?opener:[...document.querySelectorAll('[data-house-direction]')].find(b=>b.getClientRects().length);
 target?.focus({preventScroll:true});
});
dialog.addEventListener('click',e=>{
 if(e.target!==dialog)return;
 const r=dialog.getBoundingClientRect();
 if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
});
const context=document.querySelector('.noir-header-note b');
const labels={'studio-overview':'BUSINESS OVERVIEW','studio-lines':'BUSINESS PORTFOLIO',
 'studio-calendar':'RELEASE MANAGEMENT','studio-runtime':'OPERATIONS & CAPACITY','studio-system':'ARCHITECTURE & GOVERNANCE'};
function contextLabel(){
 if(!$('manage-tab').classList.contains('hidden')){if(context)context.textContent='FINANCIAL SCENARIOS / ASSUMPTIONS';return;}
 const current=document.querySelector('[data-noir-target][aria-current=true]');
 if(context&&current)context.textContent=labels[current.dataset.noirTarget]||'STUDIO OVERVIEW';
}
let queued=false;
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;contextLabel()})}},{passive:true});
document.querySelectorAll('.nav-tabs .nav-link').forEach(link=>link.addEventListener('click',()=>requestAnimationFrame(contextLabel)));
contextLabel();
})();
