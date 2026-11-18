/* Progressive drawers and an SSH command builder. No shell execution in HTTP. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const drawers=[...document.querySelectorAll('dialog.workspace-drawer')];
const fine=matchMedia('(hover:hover) and (pointer:fine)');
let active=null,origin=null,mode='pinned',openTimer,leaveTimer;
function expanded(){document.querySelectorAll('[data-drawer-open]').forEach(b=>b.setAttribute('aria-expanded',String(active?.id===b.dataset.drawerOpen)));}
function closeDrawer(restore=true){
 clearTimeout(openTimer);clearTimeout(leaveTimer);
 leaveTimer=null;
 if(!active)return;
 const current=active,target=origin;active=null;current.close();expanded();
 if(restore&&target?.getClientRects().length)target.focus({preventScroll:true});
}
function openDrawer(button,preview=false){
 clearTimeout(openTimer);clearTimeout(leaveTimer);
 leaveTimer=null;
 const next=$(button.dataset.drawerOpen);if(!next)return;
 if(active===next){if(!preview)mode='pinned';return;}
 closeDrawer(false);origin=button;mode=preview?'preview':'pinned';active=next;next.showModal();expanded();
}
document.querySelectorAll('[data-drawer-open]').forEach(button=>{
 button.addEventListener('click',()=>openDrawer(button));
 if(!button.classList.contains('workspace-edge'))return;
 button.addEventListener('pointerenter',()=>{if(!fine.matches||active)return;clearTimeout(openTimer);openTimer=setTimeout(()=>openDrawer(button,true),240);});
 button.addEventListener('pointerleave',()=>clearTimeout(openTimer));
});
drawers.forEach(drawer=>{
 drawer.querySelector('[data-drawer-close]').addEventListener('click',()=>closeDrawer());
 drawer.addEventListener('cancel',e=>{e.preventDefault();closeDrawer();});
 drawer.addEventListener('close',()=>{if(active===drawer){active=null;expanded();}});
 drawer.addEventListener('pointerdown',e=>{
  if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){closeDrawer();return;}}
  mode='pinned';
 });
 drawer.addEventListener('keydown',()=>{mode='pinned';});
 drawer.addEventListener('pointermove',e=>{
  if(mode!=='preview')return;
  const r=drawer.getBoundingClientRect();const outside=e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;
  if(outside){if(!leaveTimer)leaveTimer=setTimeout(()=>{leaveTimer=null;if(mode==='preview')closeDrawer(false);},360);}
  else{clearTimeout(leaveTimer);leaveTimer=null;}
 });
 drawer.querySelectorAll('[data-noir-target]').forEach(link=>link.addEventListener('click',()=>{
  const id=link.dataset.noirTarget;closeDrawer(false);
  // The shared navigation handler also returns the monitor from simulations.
  requestAnimationFrame(()=>$(id)?.focus({preventScroll:true}));
 }));
 drawer.querySelectorAll('[data-house-direction]').forEach(button=>button.addEventListener('click',()=>closeDrawer(false),{capture:true}));
});
document.querySelectorAll('[data-workspace-view]').forEach(button=>button.addEventListener('click',()=>{
 closeDrawer(false);window.switchTab(button.dataset.workspaceView);
 document.querySelector('.nav-tabs .nav-link.active')?.focus({preventScroll:true});
 scrollTo({top:0,behavior:'instant'});
}));
// One preference control retains the original state and listeners at all sizes.
$('console-preferences').append($('noir-motion'));
$('controller-refresh').addEventListener('click',async e=>{
 const b=e.currentTarget;b.disabled=true;$('controller-feedback').textContent='운영 데이터를 갱신하고 있습니다…';
 try{const ok=await window.refreshStudio();$('controller-feedback').textContent=ok?'운영 데이터 갱신 완료':'연결 실패 · 마지막 관측 데이터를 유지합니다.';}
 catch{$('controller-feedback').textContent='연결 실패 · 마지막 관측 데이터를 유지합니다.';}
 finally{b.disabled=false;}
});
async function getJSON(url,options={}){
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(8000),...options});
 const data=await response.json();if(!response.ok)throw Error(data.error||'서버 응답을 확인할 수 없습니다.');return data;
}
async function loadRole(){
 try{const data=await getJSON('/api/controller');
  $('controller-role').textContent=data.execution_role==='studio'?'Mac Studio 실행 호스트 · 선언 설정':'현재 로컬 실행 호스트';
  $('controller-access').textContent=`${location.host} / SSH 원격 대상 미설정`;
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
  const days=Math.round((Date.parse((data.arrival_estimate||'2026-11-17')+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);
  const arrival=$('controller-arrival');if(arrival)arrival.textContent=days>0?`Mac Studio 도입 예상 · 11월 17일 전후 (${days}일 후)`:'Mac Studio 도입 예상일 도래 · 실제 수령·이관 확인 필요';
 }catch{$('controller-role').textContent='실행 환경 확인 필요';}
}
loadRole();
$('controller-diagnose').addEventListener('click',async e=>{
 const b=e.currentTarget;b.disabled=true;$('controller-feedback').textContent='워크스페이스 응답을 확인하고 있습니다…';
 const started=performance.now();
 try{const state=await getJSON('/api/metrics');if(!state.data?.channels)throw Error('운영 데이터가 아직 준비되지 않았습니다.');
  const age=state.updated?new Date(state.updated).toLocaleString('ko-KR'):'미확인';
  $('controller-feedback').textContent=`HTTP 정상 · ${Math.round(performance.now()-started)}ms · 마지막 수집 ${age}${state.error?' · 수집 오류: 마지막 관측 유지':''}`;
 }catch(error){$('controller-feedback').textContent=`접속 진단 실패 · ${error.message}`;}
 finally{b.disabled=false;}
});
const form=$('controller-form'),result=$('controller-result'),planFeedback=$('controller-plan-feedback');
let planRevision=0;
form.addEventListener('input',()=>{planRevision++;result.hidden=true;planFeedback.textContent='';});
$('controller-preview-port').addEventListener('click',()=>{$('controller-port').value='8889';form.dispatchEvent(new Event('input'));});
form.addEventListener('submit',async e=>{
 e.preventDefault();const revision=++planRevision;result.hidden=true;
 const submit=form.querySelector('[type=submit]');submit.disabled=true;planFeedback.textContent='접속 구성을 검증하고 있습니다…';
 const fields=Object.fromEntries(new FormData(form));
 try{const plan=await getJSON('/api/controller/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)});
  if(revision!==planRevision)return;
  $('controller-command').value=plan.command;$('controller-target-url').textContent=`연결 후 접속: ${plan.url}`;result.hidden=false;
  planFeedback.textContent='명령 생성 완료 · 실행 전. Studio 원격 로그인과 호스트 키 확인이 선행되어야 합니다.';
 }catch(error){if(revision===planRevision)planFeedback.textContent=error.message;}
 finally{submit.disabled=false;}
});
$('controller-copy').addEventListener('click',async()=>{
 const text=$('controller-command').value;
 try{await navigator.clipboard.writeText(text);planFeedback.textContent='명령을 복사했습니다. MacBook 터미널에서 실행하세요.';}
 catch{$('controller-command').focus();$('controller-command').select();planFeedback.textContent='명령을 선택했습니다. 복사 단축키를 사용하세요.';}
});
$('controller-guide').addEventListener('click',async()=>{
 closeDrawer(false);
 const dialog=$('studio-document');$('studio-document-title').textContent='Mac Studio 원격 접속·이관 절차';
 $('studio-document-body').textContent='문서를 불러오는 중…';dialog.showModal();
 try{const d=await getJSON('/api/studio/document?path='+encodeURIComponent('docs/design/mac-studio-controller.md'));$('studio-document-body').textContent=d.text;}
 catch{$('studio-document-body').textContent='문서를 불러오지 못했습니다. docs/design/mac-studio-controller.md를 확인하세요.';}
 dialog.addEventListener('close',()=>document.querySelector('[data-drawer-open="operations-drawer"]')?.focus({preventScroll:true}),{once:true});
});
// Prefer official operational vocabulary on the secondary navigation as well.
document.querySelectorAll('.noir-nav [data-noir-target]').forEach(a=>{
 const label={'studio-overview':'경영 현황','studio-lines':'사업 포트폴리오','studio-calendar':'발행 일정','studio-runtime':'실행·자원','studio-system':'시스템·문서'}[a.dataset.noirTarget];
 if(label){const count=a.querySelector('span');a.replaceChildren(count,document.createTextNode(label));}
});
})();
