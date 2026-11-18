/* HTML is observed as data. No imported script, policy or operator record executes. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const full = document.getElementById('html-os-root');
  let latest, connected=false;
  const state={search:'',repo:'',issues:false};
  const when = value => value ? new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' KST' : '확인 필요';
  function card() {
    const host=document.getElementById('studio-maintenance');
    if (!host) return;
    let el=document.getElementById('html-os-summary');
    if (!el) {el=document.createElement('aside');el.id='html-os-summary';el.className='html-os-card';host.after(el);}
    el.innerHTML=`<div><strong><span class="html-os-dot" aria-hidden="true"></span>설계와 실행 근거</strong><p>${latest ? `${Number(latest.coverage.sources).toLocaleString()}개 HTML · 계약 문서 ${latest.coverage.contract_sources}개 · 확인 항목 ${latest.coverage.with_findings}개 문서` : '로컬 HTML 관측을 확인하고 있습니다.'}</p><p>${connected ? '설계 변경·별칭·구현 근거를 60초 간격으로 확인' : '관측 연결 확인 필요'}</p></div><a href="/docs/operating-plan/os-evidence/index.html" target="_blank" rel="noopener">전체 근거 보기 ↗</a>`;
  }
  function rows() {
    if (!full || !latest) return;
    const query=state.search.toLowerCase();
    const selected=latest.documents.filter(d => (!state.repo || d.repository===state.repo) && (!state.issues || d.findings.length) && `${d.repository} ${d.path} ${d.title}`.toLowerCase().includes(query));
    document.getElementById('html-os-matches').textContent=`${selected.length.toLocaleString()}개 일치 · 처음 ${Math.min(80,selected.length)}개 표시 · 검색으로 모든 문서를 조회할 수 있습니다.`;
    document.getElementById('html-os-rows').innerHTML=selected.slice(0,80).map(d=>{
      const title=esc(d.title || d.path);
      const href=d.repository==='saeos' && d.path.startsWith('docs/') && !d.path.includes('..') ? '/'+d.path.split('/').map(encodeURIComponent).join('/') : null;
      return `<tr><td>${href ? `<a class="html-os-link" href="${esc(href)}" target="_blank" rel="noopener">${title}</a>` : title}<small>${esc(d.repository)} · ${esc(d.source_kind)}</small><code>${esc(d.path)}</code></td><td>${(d.contracts||[]).map(c=>`<b>${esc(c.kind)} ${esc(c.revision)}</b><small>해시 검증 · 설계 근거로 수입${c.sidecar_matches===true?' · JSON 정본 일치':''}</small>`).join('') || '구조 검사'}<small>SHA ${esc(d.sha256?.slice(0,12) || '미확인')}</small></td><td>${d.findings.length ? `<details><summary>확인 항목 ${d.findings.length}개</summary><ul>${d.findings.map(f=>`<li>${esc(f)}</li>`).join('')}</ul></details>` : '검사 항목 통과'}</td></tr>`;
    }).join('');
  }
  function render() {
    if (!full) {card();return;}
    if (!latest) {full.innerHTML='<h1>설계 관측 확인 필요</h1><p role="status">로컬 API의 관측을 읽을 수 없습니다. 다음 갱신에 다시 확인합니다.</p>';return;}
    if (full.dataset.revision===latest.revision) {
      document.getElementById('html-os-status').textContent=`${connected?'최근 확인':'관측 연결 확인 필요 · 마지막 확인'} ${when(latest.observed_at)}`;return;
    }
    full.dataset.revision=latest.revision;
    const c=latest.coverage, contracts=latest.documents.filter(d=>(d.contracts||[]).length);
    full.innerHTML=`<header class="html-os-top"><div><span class="html-os-kicker">SAE OS / DESIGN → EVIDENCE → RUNTIME</span><h1>설계와 실행을 연결합니다.</h1><p id="html-os-status" class="html-os-status" role="status">최근 확인 ${esc(when(latest.observed_at))}</p></div><a href="/">RAYV STUDIO ↗</a></header>
      <div class="html-os-stats"><article><b>${c.sources.toLocaleString()}</b><span>검사한 HTML · 템플릿·사본 포함</span></article><article><b>${c.unique_contents.toLocaleString()}</b><span>내용 해시로 구분한 문서</span></article><article><b>${c.contract_sources}</b><span>검증된 계약이 있는 문서</span></article><article><b>${c.with_findings}</b><span>구조·참조 확인 항목이 있는 문서</span></article></div>
      <p class="html-os-note">HTML은 설계 근거로 가져옵니다. 과거 문서의 채널 수·발행량·권한이 현재 운영 설정을 덮어쓰지 않습니다. 자원 부족으로 미뤄진 코드 검증은 저장된 후보에서 재개하며 새 코딩 호출을 쓰지 않습니다.</p>
      <section class="html-os-section"><h2>8개 OS 책임 · 실제 소스 대조</h2><p>심볼과 소스 해시를 확인했습니다. 가동 상태·모델 성능·처리량은 별도의 실행 관측이 필요합니다.</p><div class="html-os-components">${latest.components.map(x=>`<article class="html-os-component"><strong>${esc(x.name)}</strong><small>${x.status==='source_verified'?'소스 심볼 확인':'구현 확인 필요'}</small><code>${esc(x.repository)}/${esc(x.path)}<br>${esc(x.symbol)}</code></article>`).join('')}</div></section>
      <section class="html-os-section"><h2>설계 계약과 버전</h2><p>${contracts.map(d=>`${esc(d.repository)}/${esc(d.path)}`).join('<br>')}</p><p>고유 계약 ${c.unique_contracts}개 · ${esc(latest.policy_conflicts?.[0]?.detail || '')}</p><p>현재 설정 관측: ${latest.active_release?.channels?.filter(c=>c.enabled).length || 0}개 활성 채널 · 일일 상한 합계 ${Number(latest.active_release?.configured_daily_cap || 0)}편. 실제 발행량은 발행 캘린더에서 확인합니다.</p><details><summary>같은 내용의 사본 · ${latest.aliases.length}개 묶음</summary>${latest.aliases.map(a=>`<p>${a.map(esc).join('<br>')}</p>`).join('')}</details></section>
      <section class="html-os-section"><h2>남아 있는 구현·실측 과제</h2><div class="html-os-gaps">${latest.design_gaps.map(g=>`<article class="html-os-gap"><b>${esc(g.status)}</b><p>${esc(g.detail)}</p></article>`).join('')}</div></section>
      <section class="html-os-section"><h2>전체 HTML 인벤토리</h2><div class="html-os-controls"><input id="html-os-search" type="search" aria-label="문서 제목 또는 경로 검색" placeholder="제목·경로·저장소 검색"><select id="html-os-repo" aria-label="저장소 선택"><option value="">모든 저장소</option>${Object.keys(c.by_repository).map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select><label><input type="checkbox" id="html-os-issues"> 확인 항목만</label></div><p id="html-os-matches"></p><div class="html-os-table-wrap"><table class="html-os-table"><thead><tr><th>문서</th><th>검사 근거</th><th>구조·정적 참조</th></tr></thead><tbody id="html-os-rows"></tbody></table></div></section>
      <footer class="html-os-foot">${(latest.errors||[]).length ? '<p role="alert">일부 관측 확인 필요: '+latest.errors.map(esc).join(' · ')+'</p>' : ''}${latest.limitations.map(esc).join('<br>')}<br>배포 스냅샷 일부 포함 · 외부 링크·동적 앱 경로·의존성·중간 빌드·고객 실행 산출물은 제외합니다.<br>최근 변경 +${latest.delta.added} / 수정 ${latest.delta.changed} / 제거 ${latest.delta.removed}<br>REV ${esc(latest.revision)} · <a href="/api/studio/html-design">원본 JSON 근거</a></footer>`;
    const input=document.getElementById('html-os-search'), select=document.getElementById('html-os-repo'), check=document.getElementById('html-os-issues');
    input.value=state.search;select.value=state.repo;check.checked=state.issues;
    input.addEventListener('input',()=>{state.search=input.value;rows();});
    select.addEventListener('change',()=>{state.repo=select.value;rows();});
    check.addEventListener('change',()=>{state.issues=check.checked;rows();});
    rows();
  }
  async function poll() {
    try {
      const response=await fetch('/api/studio/html-design',{cache:'no-store'});
      if(!response.ok) throw Error('observation unavailable');
      const data=await response.json();if(data.schema!=='saeos-html-os-v1' || !data.coverage) throw Error('schema');
      latest=data;connected=true;
    } catch {connected=false;}
    render();
  }
  if (!full) new MutationObserver(()=>{if(!document.getElementById('html-os-summary'))card();}).observe(document.body,{subtree:true,childList:true});
  poll();setInterval(poll,60000);
})();
