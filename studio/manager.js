/* Read-only management layer. Coordination and effects remain in the existing runtime. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names = {academy:'영어회화 관리',saeos:'SAE OS · 미디어',kernel:'공개 연구 커널',jnj:'J&J 웹·회화 게임',isitai:'isitai 웹·앱',toolhub:'Toolhub',th01:'Seller Close Kit',social:'소셜 트렌드 서비스',th02:'Creator Business Kit'};
  const modes = {operator_decision:'판단 필요',working_record:'수리 진행 기록',quota_wait:'구독 한도 대기',budget_wait:'시도 상한 도달',resource_wait:'자원 여유 대기',verification_wait:'검증·머지 대기',repair_needed:'조정기 수리 대상',observation_stale:'관측 갱신 확인',observation_error:'관측 확인 필요',queued:'순서 대기'};
  const failures = {subscription_quota:'구독 한도 거절',verification_timeout:'검사 시간 초과',regression_missing:'회귀검사 누락',test_edit_guard:'기존 검사 수정 제한',memory_wait:'메모리 여유 부족',scope_guard:'허용 수정 범위',github_check:'GitHub 검사 실패'};
  const count = value => Number(value) || 0;
  const opened = new Set();
  let latest, disconnected=false;
  try {
    for(const id of JSON.parse(sessionStorage.getItem('saeos-manager-open') || '[]')) opened.add(id);
    const cached=JSON.parse(sessionStorage.getItem('saeos-manager-observation') || 'null');
    const age=cached ? Date.now()-new Date(cached.observed_at).valueOf() : Infinity;
    if(cached?.schema === 'saeos-manager-v1' && age>=-5000 && age<=300000){latest=cached;disconnected=true;}
  } catch { /* An absent/invalid cache is an observation gap. */ }
  function time(value) {
    if (!value || Number.isNaN(new Date(value).valueOf())) return '';
    return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value))+' KST';
  }
  document.addEventListener('toggle', event => {
    if (!event.target.id?.startsWith('manager-fold-')) return;
    if (event.target.open) opened.add(event.target.id);else opened.delete(event.target.id);
    try {sessionStorage.setItem('saeos-manager-open',JSON.stringify([...opened]));} catch {}
  },true);
  function render() {
    const parent = document.getElementById('studio-maintenance');
    const repos = parent?.querySelector('.improve-repos');
    if (!latest || !repos) return;
    let panel = document.getElementById('studio-manager-panel');
    if (!panel) {panel=document.createElement('div');panel.id='studio-manager-panel';repos.before(panel);}
    const stats=latest.counts || {}, manual=latest.manual;
    const decisions=(latest.cards || []).filter(card => card.requires_human);
    const backlog=latest.regression_backlog || [];
    panel.innerHTML=`<p id="manager-observation-status" class="manager-observation">${disconnected ? '관측 연결 확인 필요 · 마지막 확인 ' : '최근 관측 '}${escape(time(latest.observed_at))} · 기록 기준</p><div class="manager-layer-map" aria-label="업무 책임의 세 단계">
      <div><small>01 / MANAGER</small><b>매니저</b><span>전체 현황 · 판단 분류</span></div>
      <div><small>02 / COORDINATOR</small><b>코디네이터</b><span>업무 배정 · 검사 · 머지</span></div>
      <div><small>03 / WORKER</small><b>실행 워커</b><span>격리된 코드 수정 · 회귀검사</span></div></div>
      <div class="manager-counters" aria-label="기록에서 집계한 작업 상태"><span><b>${count(stats.operator_decisions)}</b> 판단 필요</span><span><b>${count(stats.working_records)}</b> 수리 진행 기록</span><span><b>${count(stats.quota_wait)}</b> 구독 한도 대기</span><span><b>${count(stats.completed)}</b> 완료·수정 불필요</span></div>
      ${manual ? `<div class="manager-wait"><b>추가 수리 ${manual.repositories.length}개 저장소</b><span>${manual.observer_fresh && !disconnected ? (manual.status === 'waiting_for_subscription_reset' ? '구독 한도 초기화 대기' : '추가 작업 기록 관측 중') : '관측 갱신 확인 필요'}${manual.not_before ? ' · '+escape(time(manual.not_before))+'부터 재개 예정' : ''}</span></div>` : ''}
      <div class="manager-decisions"><strong>판단 카드 · ${decisions.length}</strong>${decisions.length ? decisions.map(card => `<p>${escape(names[card.repository] || card.repository)} · 기존 허용 범위 또는 저장소 보호 규칙 확인</p>`).join('') : '<p>현재 별도 판단이 필요한 항목이 없습니다. 통상 수정·검사·머지는 기존 승인 범위에서 처리합니다.</p>'}</div>
      ${backlog.length ? `<details id="manager-fold-regressions" class="manager-regressions"><summary>반복 실패 → 회귀검사 · ${backlog.length}개 유형</summary><div>${backlog.map(group => `<article><b>${escape(failures[group.failure_class] || group.failure_class)}</b><span>보관된 관측 ${count(group.observed_cases)}건 · ${group.status === 'enforced' ? '실행 전 검사에 연결' : '재현·검사 추가 후보'}</span></article>`).join('')}</div><p>보관된 기록의 최소 집계입니다. 검사 후보는 구현·통과한 검사와 구분합니다.</p></details>` : ''}
      ${(latest.observation_errors || []).length ? `<details id="manager-fold-observations" class="manager-regressions"><summary>관측 확인 ${latest.observation_errors.length}건</summary><p>${latest.observation_errors.map(escape).join('<br>')}</p></details>` : ''}`;
    for (const id of opened) {const detail=document.getElementById(id);if(detail) detail.open=true;}
    [...repos.children].forEach((node,index) => {
      const card=latest.cards[index];if(!card) return;
      if(card.mode !== 'completed') node.querySelector('small').textContent=modes[card.mode] || '대기';
      node.dataset.state=card.mode;
      node.querySelector('.manager-provenance')?.remove();
      if(card.source?.startsWith('manual:')) {
        const hint=document.createElement('p');hint.className='manager-provenance';
        hint.textContent='운영자 요청 추가 수리'+(card.not_before ? ' · '+time(card.not_before)+' 이후' : '');
        node.append(hint);
        const summary=node.querySelector('details summary');if(summary) summary.textContent='이전 실행 기록';
      }
    });
  }
  new MutationObserver(() => {
    if (latest && document.querySelector('#studio-maintenance .improve-repos') && !document.getElementById('studio-manager-panel')) render();
  }).observe(document.body,{childList:true,subtree:true});
  async function poll() {
    try {
      const response=await fetch('/api/studio/manager',{cache:'no-store'});
      if(!response.ok) throw Error('observation unavailable');
      const data=await response.json();if(data.schema !== 'saeos-manager-v1') throw Error('observation schema');
      disconnected=false;latest=data;
      try {sessionStorage.setItem('saeos-manager-observation',JSON.stringify(data));} catch {}
      render();
    } catch {disconnected=true;if(latest) render();}
  }
  poll();setInterval(poll,30000);
})();
