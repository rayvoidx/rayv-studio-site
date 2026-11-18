/* Live read-only studio UI. No production controls or external dependencies. */
(()=>{
const $=id=>document.getElementById(id);
const main=document.querySelector('.page-body > .container-xl');
if(main){const hero=document.querySelector('.studio-hero');const architecture=document.querySelector('.studio-architecture');const kpi=main.querySelector(':scope > .kpi-section');const quick=main.querySelector(':scope > .quick-grid');if(hero)main.prepend(hero);const noirNav=document.querySelector('.noir-nav');if(hero&&noirNav)hero.after(noirNav);}

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=sessionStorage.getItem('studio-date'), calendar, lastCalendar='',lastDocs='',revision;
const labels={public:'공개 관측',reserved:'원격 예약',queue:'로컬 예정',empty:'미확보',elapsed:'시각 경과'};
function drawDay(){
 if(!calendar)return;
 const day=calendar.days.find(d=>d.date===selected)||calendar.days.find(d=>d.date===calendar.today);
 if(!day)return;selected=day.date;sessionStorage.setItem('studio-date',selected);
 $('studio-selected').textContent=`${selected} · ${selected<calendar.today?'기록된 발행 관측':'채널별 슬롯'}`;
 document.querySelectorAll('[data-studio-date]').forEach(b=>{const active=b.dataset.studioDate===selected;b.setAttribute('aria-pressed',String(active));b.tabIndex=active?0:-1;});
 $('studio-slots').innerHTML=day.lanes.map(lane=>`<article class="studio-lane"><header><h4>${escape(lane.name)}</h4><span>${selected>=calendar.today?`하루 ${lane.cap}회 · ${lane.times.length}슬롯`:'당시 관측 기록'}</span></header><div class="studio-lane-progress" aria-label="공개·원격 예약으로 확보한 슬롯 비율"><i style="width:${lane.slots.length?100*lane.slots.filter(r=>['public','reserved'].includes(r.state)).length/lane.slots.length:0}%"></i></div><div class="studio-slot-grid">${lane.slots.map(row=>{
  const obs=row.observations||[];const primary=obs.find(v=>v.state===row.state)||{};
  const title=primary.title||(row.state==='empty'?'다음 콘텐츠를 기다리는 슬롯':row.state==='elapsed'?'예약 관측 없음 · 시각 경과':'제목 미확인');
  const video=primary.video_id;
  return `<div class="studio-slot ${escape(row.state)}"><div><time>${escape(row.time)}</time><span class="studio-chip">${labels[row.state]}</span></div><p>${escape(title)}</p>${row.collision?'<strong class="studio-collision">중복 예약 관측 · 확인 필요</strong>':''}${/^[\w-]{11}$/.test(video||'')?`<a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(video)}">YouTube에서 확인 ↗</a>`:''}<small>${row.configured?'현재 설정 슬롯':'설정 외 관측 시각'}${obs.some(v=>v.state==='queue')&&row.state!=='queue'?' · 로컬 기록 병합':''}</small></div>`;
 }).join('')||'<p class="studio-empty">이 날짜의 발행 관측 기록이 없습니다.</p>'}</div>${lane.uploads?.length?`<details class="studio-upload-note"><summary>비공개 업로드 기록 ${lane.uploads.length}건 · 공개 발행과 별도</summary>${lane.uploads.map(u=>`<p>${escape(u.content_id)} · ${escape(u.uploaded_at)}</p>`).join('')}</details>`:''}</article>`).join('');
}
function renderCalendar(data,state){
 calendar=data.calendar;if(!calendar)return;
 const key=JSON.stringify(calendar);
 if(!selected)selected=calendar.today;
 if(key!==lastCalendar){
  const first=!lastCalendar;lastCalendar=key;
  $('studio-dates').innerHTML=calendar.days.map(d=>{
   const counts=d.counts;const filled=counts.public+counts.reserved;
   return `<button type="button" class="studio-date" data-studio-date="${d.date}" aria-pressed="${selected===d.date}"><span>${d.date.slice(0,4)} · ${d.date===calendar.today?'TODAY':new Date(d.date+'T12:00:00+09:00').toLocaleDateString('ko-KR',{weekday:'short'})}</span><b>${d.date.slice(5).replace('-',' / ')}</b><small>공개·예약 ${filled}${d.expected?` / ${d.expected}`:''}</small>${counts.empty?`<em>미확보 ${counts.empty}</em>`:counts.elapsed?`<em>경과 ${counts.elapsed}</em>`:'<em class="quiet">관측 기록</em>'}</button>`;
  }).join('');
  $('studio-dates').querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.studioDate;drawDay()});
  drawDay();
  if(first){const strip=$('studio-dates');const active=strip.querySelector('[aria-pressed="true"]');if(active)strip.scrollLeft=active.offsetLeft-strip.offsetLeft-30;}
 }
 const channels=Object.values(data.channels||{});
 const volume=channels.reduce((n,c)=>n+(c.slots?.short?.length||0),0);
 $('studio-volume').textContent=String(volume);
 $('studio-calendar-meta').textContent=`${channels.length}개 채널 · 기록 전체 ${calendar.days.length}일 · 앞으로 ${calendar.planning_days}일 슬롯 · KST`;
 const observed=state.live_stats?.at;
 $('studio-source-age').textContent=`로컬 설정·큐: ${new Date(state.updated).toLocaleTimeString('ko-KR')} 갱신 · YouTube 관측: ${observed?new Date(observed).toLocaleString('ko-KR'):'수집 대기'}. 미확보/경과는 관측 부재이며 발행 실패 확정이 아닙니다. ${calendar.warnings.join(' · ')}`;
}
async function showDocument(path){
 const dialog=$('studio-document');$('studio-document-title').textContent=path;$('studio-document-body').textContent='불러오는 중…';if(!dialog.open)dialog.showModal();
 try{const response=await fetch('/api/studio/document?path='+encodeURIComponent(path));if(!response.ok)throw Error('문서를 불러오지 못했습니다.');const d=await response.json();$('studio-document-body').textContent=d.text;}catch(e){$('studio-document-body').textContent=e.message;}
}
function renderArchitecture(data){
 const a=data.architecture;if(!a)return;
 const sup=a.supervisor||{};
 $('studio-os-state').textContent=`제작 슈퍼바이저 ${sup.enabled===true?'활성':sup.enabled===false?'중지':'미확인'}${sup.stop_at?' · 종료 설정 '+new Date(sup.stop_at).toLocaleString('ko-KR'):''} · 설계 문서와 파일 존재를 별도로 표시합니다.`;
 if(lastDocs===a.revision)return;lastDocs=a.revision;
 $('studio-components').innerHTML=a.components.map((c,i)=>`<article><span>0${i+1}</span><h3>${escape(c.name)}</h3><p>${escape(c.role)}</p><small>${c.present===true?'관련 파일 존재':c.present===false?'연결 파일 미확인':'설계 경계'} · 실행 검증 별도</small></article>`).join('');
 function docCards(docs){return docs.map(d=>`<button class="studio-doc" type="button" data-document="${escape(d.path)}"><span>${d.path.startsWith('kernel/')?'PUBLIC KERNEL':'PRIVATE OS'} · ${new Date(d.updated).toLocaleDateString('ko-KR')}</span><strong>${escape(d.title)}</strong><small>${escape(d.headings.slice(0,3).join(' / '))}</small><em>${escape(d.path)} ↗</em></button>`).join('')}
 let outline=$('studio-outline');if(!outline){outline=document.createElement('div');outline.id='studio-outline';outline.className='studio-outline';$('studio-components').after(outline);}
 const designs=a.documents.filter(d=>/design\/|architecture|implementation_plan/i.test(d.path)).slice(0,3);
 outline.innerHTML='<h3>최신 설계의 구성</h3>'+designs.map(d=>`<article><strong>${escape(d.title)}</strong><div>${d.headings.map(h=>`<span>${escape(h)}</span>`).join('')}</div><small>${escape(d.path)} · 문서 기준 구성</small></article>`).join('');
 $('studio-documents').innerHTML=docCards(a.documents.slice(0,6));
 $('studio-all-documents').innerHTML=docCards(a.documents.slice(6));
 document.querySelectorAll('[data-document]').forEach(b=>b.onclick=()=>showDocument(b.dataset.document));
 $('studio-doc-meta').textContent=`${a.documents.length}개 문서 · ${a.revision.slice(0,8)}`;
 $('studio-sync').textContent='문서 자동 동기화 · 5초';
}
let lastForecast='';
function renderForecast(data){
 const f=data.runtime_forecast;if(!f||JSON.stringify(f)===lastForecast)return;lastForecast=JSON.stringify(f);
 let box=$('studio-runtime');if(!box){box=document.createElement('section');box.id='studio-runtime';box.className='card studio-runtime';document.querySelector('.studio-calendar').after(box);}
 if(f.error){box.textContent='실행시간 관측 자료를 읽지 못했습니다: '+f.error;return;}
 let mini=$('studio-runtime-mini');if(!mini){mini=document.createElement('small');mini.id='studio-runtime-mini';document.querySelector('.studio-live').append(mini);}mini.textContent=f.estimate?`제작 예상 ${f.estimate.daily_hours}h/일 · 실패 비용 포함`:'제작시간 실측 대기';
 const names={seven_day:'보존된 최근 기록',last_24h:'최근 24시간',post_recovery:'복구 후 운영 · 표본 주의'};
 const stages={script_ready:'조사·대본',narration_ready:'장면·음성',illustrations_ready:'이미지 생성',picture_fix_ready:'이미지 검수·수정',short_rendered:'자막·인코딩'};
 box.innerHTML=`<div class="studio-section-head"><div><span class="studio-kicker">CAPACITY / MEASURED EXECUTION</span><h2>하루 제작에 필요한 시간</h2><p>${f.demand}편/일 설정 · 실패·재시도 시간 포함 · 실제 고유 완성 영상 기준</p></div><span class="studio-sync">실측 갱신 · 1분</span></div><div class="studio-capacity-grid">${Object.entries(f.cohorts).map(([k,c])=>`<article class="${k===f.selected_cohort?'selected':''}"><span>${names[k]}</span><b>${c.daily_hours===null?'미확인':c.daily_hours+'시간'}</b><p>일일 ${f.demand}편 환산 · ${c.minutes_per_completed??'—'}분/편</p><small>${c.attempts}회 실행 / 연결된 완성 ${c.completed}편${c.unmatched_completed?' · 수동/미연결 '+c.unmatched_completed+'편 제외':''}${c.coverage_limited?' · 기록 기간 일부':''}</small></article>`).join('')}</div><p class="studio-capacity-warning">현재 제작 버전의 실측 완성 ${f.current_version_completed_samples}편. 새 버전의 시간은 운영 후 보정됩니다. 하루 ${f.planning_budget_hours}시간은 24시간에서 예비시간 15%를 뺀 계획 가정입니다. ${f.estimate?.daily_hours>f.planning_budget_hours?'최근 비용으로는 예비시간을 포함한 하루 예산을 초과합니다.':''}</p><div class="studio-capacity-detail"><div><h3>단계별 시간 · 완성된 작업의 중앙값</h3>${Object.entries(f.stages).sort((a,b)=>b[1].p50-a[1].p50).map(([k,v])=>`<div class="studio-stage"><span>${stages[k]||k}</span><div><i style="width:${Math.min(100,v.p50/Math.max(1,...Object.values(f.stages).map(s=>s.p50))*100)}%"></i></div><b>${v.p50}분</b><small>P90 ${v.p90}분 · ${v.n}건</small></div>`).join('')}<p class="studio-footnote">감독기 실행 경과시간을 사용하며 직접 측정한 GPU 사용시간은 아닙니다. 단계별 수치는 완성 작업 기준이고, 실패 비용은 위 일일 환산에 포함됩니다.</p></div><div><h3>일자별 기록된 실행시간 · KST</h3><table><thead><tr><th>일자</th><th>실행</th><th>연결 완성 / 관측 완성</th></tr></thead><tbody>${f.daily.map(d=>`<tr><td>${d.date.slice(5)}</td><td>${d.coverage_limited&&!d.attempts?'미확인':d.execution_hours+'h'}${d.coverage_limited?' *':''}</td><td>${d.completed} / ${d.observed_completed}</td></tr>`).join('')}</tbody></table><p class="studio-footnote">* 보존 기록 일부. 수동·미연결 작업의 시간은 포함되지 않으므로 실제 전체 실행시간을 보장하지 않습니다.</p></div></div><details class="studio-all-docs"><summary>변동이 큰 경우의 계획 시나리오와 한계</summary><p class="studio-footnote">최근 24시간의 실행 P90과 시도/완성 비율을 적용한 고비용 시나리오는 ${f.cohorts.last_24h.high_cost_daily_hours??'미확인'}시간/일입니다. 이는 신뢰구간이나 확정 예측이 아닙니다. 복구 후에는 아직 ${f.cohorts.post_recovery.completed}편만 관측됐으며, 새 버전과 Mac Studio·SSH의 속도 향상은 가정하지 않았습니다.</p></details>`;
}
let lastPortfolio='';
function renderPortfolio(data){
 const d=data.portfolio_resource_plan;if(!d)return;
 const key=JSON.stringify(d);if(key===lastPortfolio)return;lastPortfolio=key;
 let box=$('studio-portfolio');if(!box){box=document.createElement('section');box.id='studio-portfolio';box.className='card studio-portfolio';($('studio-runtime')||document.querySelector('.studio-calendar')).after(box);}
 if(d.error){box.textContent='자원 설계를 읽지 못했습니다: '+d.error;return;}
 const p=d.policy,f=d.projection,s=d.stress_projection;
 const names={youtube:'YouTube',academy:'영어회화',web_apps:'웹·앱',digital_books:'전자책·상품',instagram:'Instagram',ops_research:'운영·연구',contingency:'장애 예비'};
 const channels=Object.values(data.channels||{}),slots=channels.reduce((n,c)=>n+(c.slots?.short?.length||0),0);
 box.innerHTML=`<div class="studio-section-head"><div><span class="studio-kicker">LOCAL PORTFOLIO / ADVISORY DESIGN</span><h2>100 Shorts와 다른 사업의 자원 배분</h2><p>목표 ${p.target.channels}채널 × ${p.target.shorts_per_channel}편 · 현재 ${channels.length}채널 / ${slots}슬롯 · 롱폼 제외 · 150–179초 쇼츠 포함</p></div><a class="studio-button" href="/studio-plan/" target="_blank" rel="noopener">설계·처리량 계산기 ↗</a></div><div class="studio-portfolio-grid"><article><span>유튜브 GPU 기본 예산</span><b>${p.gpu.budgets.youtube/60}h <small>/ 일</small></b><p>65 / 25 / 10편 기본 조합<br>가정상 ${(f.required_gpu_minutes/60).toFixed(1)}h 필요</p></article><article><span>다른 사업 / 보호된 예비</span><b>5h <small>+ 3h</small></b><p>영어회화·웹·앱·전자책·인스타그램<br>고객 약속과 예비 예산 우선</p></article><article><span>M5 Ultra 96GB 목표 설계</span><b>${f.count} <small>Shorts / 일</small></b><p>외부 생성형 추론 없음<br>Apache-2.0 / MIT 모델 후보</p></article></div><div class="studio-portfolio-budgets">${Object.entries(p.gpu.budgets).map(([k,v])=>`<span>${names[k]} <b>${v}분</b></span>`).join('')}</div><p class="studio-capacity-warning">위 시간은 미측정 가정입니다. 클립당 4분이면 ${f.required_gpu_minutes} GPU분, 8분이면 ${s.required_gpu_minutes}분으로 기본 예산 ${s.deficit_gpu_minutes}분 초과. 전체 생성 영상은 모든 클립 비용을 추가합니다. 현재 24GB 장비의 실측과 구분합니다.</p><div class="studio-portfolio-footer"><p>외부 모델을 사용하는 활성 Hermes 크론 ${d.remote_cron_routes.length}개는 로컬 전환 대기. 영상 백엔드·고객 마감 피드·단계별 GPU 원장은 후속 구현입니다. 이 설계는 실행 권한을 부여하지 않으며 현재 생산 종료 설정을 유지합니다.</p><span>POLICY ${escape(d.revision.slice(0,12))}<br>읽기 전용 · 정책 자동 동기화</span></div>`;
}
let lastPrework='';
function renderPrework(data){
 const p=data.prestudio_work;if(!p)return;const key=JSON.stringify(p);if(key===lastPrework)return;lastPrework=key;
 let box=$('studio-prework');if(!box){box=document.createElement('section');box.id='studio-prework';box.className='card studio-portfolio studio-prework';($('studio-portfolio')||document.querySelector('.studio-calendar')).after(box);}
 if(p.error){box.textContent='선작업 기록을 읽지 못했습니다: '+p.error;return;}
 const labels={draft_ready:'검토용 초안 준비',verified_synthetic:'합성 검증 완료',prepared:'이전 점검 준비'};
 box.innerHTML=`<div class="studio-section-head"><div><span class="studio-kicker">BEFORE STUDIO / CPU PREPARATION</span><h2>Mac Studio 이관 준비 현황</h2><p>6채널 × 하루 5편 제작과 병행 · 추가 GPU·외부 AI 호출 0 · 실제 고객 원장과 분리</p></div><a class="studio-button" href="/prestudio/" target="_blank" rel="noopener">산출물 열기 ↗</a></div><div class="studio-portfolio-grid">${p.tasks.map(t=>`<article><span>${labels[t.status]}</span><h3>${escape(t.title)}</h3><p>${escape(t.detail)}</p></article>`).join('')}</div><div class="studio-portfolio-footer"><p>전자책은 교사·학습자 검토 전 초안이며 오디오는 대본만 준비했습니다. 관리 시스템 검증은 합성 데이터만 사용했습니다. Studio 이전·새 영상 모델 활성화는 별도 단계입니다.</p><span>${new Date(p.at).toLocaleString('ko-KR')}<br>준비 작업 완료 기록 · 실행 상태 별도 확인</span></div>`;
}
window.renderStudio=(data,state)=>{
 if(revision&&data.studio_revision&&revision!==data.studio_revision){location.reload();return;}
 revision=data.studio_revision;
 $('studio-fresh').textContent=state.error?'수집 오류 · 마지막 관측 표시':'LIVE · '+new Date(state.updated).toLocaleTimeString('ko-KR');
 renderCalendar(data,state);renderForecast(data);renderPortfolio(data);renderPrework(data);renderArchitecture(data);
};
$('studio-today').onclick=()=>{if(calendar){selected=calendar.today;drawDay();document.querySelector(`[data-studio-date="${selected}"]`)?.scrollIntoView({block:'nearest',inline:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}};
$('studio-document-close').onclick=()=>$('studio-document').close();
// Independent poll keeps the studio working even if an older chart/CDN fails.
let polling=null;
function poll(){
 if(polling)return polling;
 polling=(async()=>{
  try{const r=await fetch('/api/metrics',{cache:'no-store'});if(!r.ok)throw Error('metrics_unavailable');const s=await r.json();if(!s.data?.channels)throw Error('metrics_pending');window.renderStudio(s.data,s);return !s.error}
  catch(e){$('studio-fresh').textContent='연결 재시도 중 · 마지막 관측 표시';dispatchEvent(new CustomEvent('studio-observation-error'));return false}
 })().finally(()=>{polling=null});
 return polling;
}
window.refreshStudio=poll;
poll();setInterval(poll,5000);
})();
