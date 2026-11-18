/* RAYV STUDIO 조직도 Map — 한 장으로 회사(사업 원장), 자동화 조직(슈퍼바이저·레인·에이전트), 수익 계획(2027-06 월 1,000만)을
   읽는 간이 대시보드. 데이터는 /api/metrics 한 곳(쓰기 없음): business_lines(+revenue_plan)·channels·schedule·supervisor·agents.
   빛은 모든 간선에서 같은 속도(SPEED px/s)로 중심에서 바깥으로 — 경로 길이를 재서 dur 를 정하는 2패스. 값이 바뀔 때만
   다시 그린다. 노드 클릭 = 상세 패널, 탭 = 해시 라우팅 + 전환 애니메이션. 실현 금액은 원장·운영자 진술만, 목표는 가정으로 표기. */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T={paper:'#ffffff',mist:'#c9c9c4',signal:'#a3a39d',smoke:'#7a7a75',graphite:'#2f2f2d',ink:'#000000'};
const STAGE={operating:['운영 중',.9,T.paper],building:['구축 중',.55,T.mist],paused:['일시 정지',.35,T.smoke],proposed:['검토',.15,T.signal]};
const AUTO={full:'자동화 설계',semi:'부분 자동화',manual:'운영자 수행'};
const LANES=['youtube','issue','mystery','history','tools','growth'];
const AGENTS=[['dev.saeos.harvest','자료 수확','매일 05:10 · MCP 검색 → 큐'],['dev.saeos.trend-watch','피어 추세','매일 04:30 · 상위 채널 신작'],
 ['dev.saeos.pulse','시청 반응','매일 06:40 · 댓글·돌파'],['dev.saeos.youtube-performance','성과 스냅샷','6시간마다 · Data API'],
 ['dev.saeos.ops-daily','운영 점검','매일 04:50 · 용량·백업'],['dev.saeos.failure-report','실패 보고','매일 · 레인별 차단'],
 ['dev.saeos.steward','스튜어드','매일 07:30 · 일일 패스 판정'],['dev.saeos.dailypass','일일 패스','매일 07:00 · 저장소 점검'],['dev.saeos.monitor','대시보드','상시 · 8888']];
const TABS=['map','monitor','manage','plan','venture'];
const SPEED=120;                       // px/s — 모든 빛의 속도
const W=1680,H=1080,CX=580,CY=520,R1=190,R2=372;  // 회사 노드가 왼쪽 영역(0~1160)의 중심에 오도록
const SX=1225,SY=150,LX=1370,LY0=262,LSTEP=74,AX=1225,AY0=748,ASTEP=36;
let lastKey='',selected=null,summary=null;
const polar=(r,a)=>[CX+r*Math.cos(a),CY+r*Math.sin(a)];
const won=n=>n==null?'—':n>=10000?`${Math.round(n/10000).toLocaleString('ko-KR')}만`:`${n.toLocaleString('ko-KR')}원`;
function arc(r,pct){
 if(pct>=.999)return `M0 ${-r}A${r} ${r} 0 1 1 -0.01 ${-r}`;
 const a=-Math.PI/2+2*Math.PI*pct;return `M0 ${-r}A${r} ${r} 0 ${pct>.5?1:0} 1 ${r*Math.cos(a)} ${r*Math.sin(a)}`;
}
const ym=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
function today(){const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function monthsBetween(a,b){const [ay,am]=a.split('-').map(Number),[by,bm]=b.split('-').map(Number);return (by-ay)*12+(bm-am);}
function summarize(m){
 const bl=m.business_lines||{},sch=m.schedule||{},ch=m.channels||{},sup=m.supervisor||{},ag=m.agents||{};
 const date=today(),per=sch.slots_per_day||5;
 const lanes=LANES.map(id=>{const c=ch[id]||{},s=(sch.channels||{})[id]||{};const filled=(s.by_date||{})[date]||0;
  return {id,name:c.channel_name||s.name||id,enabled:typeof c.enabled==='boolean'?c.enabled:null,producing:!!(c.live&&c.live.producing),stage:c.live?c.live.stage:null,
   content:c.live?c.live.content_id:null,filled,per,blockers:((c.pipeline||{}).blockers||[]),deferred:Object.keys(sup.deferred||{}).some(k=>k.startsWith(id+':')),
   last:sup.last_by_channel?sup.last_by_channel[id]:null,lastUpload:c.last_upload||null};});
 const agents=AGENTS.map(([label,name,desc])=>{const row=(ag.rows||[]).find(r=>r.label===label)||{};
  return {label,name,desc,loaded:!!row.loaded,pid:row.pid||null,exit:row.last_exit,failing:!row.pid&&(ag.failing||[]).includes(label)};});
 const supervisor=(ag.rows||[]).find(r=>r.label==='dev.saeos.supervisor')||{};
 const plan=bl.revenue_plan||null;
 return {company:bl.company||'RAYV STUDIO',categories:bl.categories||[],lines:bl.lines||[],counts:bl.counts||{},ledger:bl.ledger||{},plan,
  todayShort:(m.production_today||{}).short??null,lanes,agents,supervisorPid:supervisor.pid||null,supervisorLoaded:!!supervisor.loaded,lastRun:sup.last_run||null,revision:bl.revision||''};
}
function target(id,s){return s.plan&&s.plan.targets_krw?s.plan.targets_krw[id]:null;}
function realized(id,s){const r=s.plan&&s.plan.realized?s.plan.realized[id]:null;return r?{min:r.min_krw,max:r.max_krw,basis:r.basis}:null;}
function realizedText(id,s){const r=realized(id,s);return r?`${won(r.min)}~${won(r.max)}`:'미확인';}
function linePct(l,s){
 if(l.id!=='shorts')return 0;
 const per=s.lanes[0]?.per||5;return Math.max(0,Math.min(1,s.lanes.reduce((n,x)=>n+x.filled,0)/(s.lanes.length*per)));
}
function company(s){const r=s.plan&&s.plan.realized?s.plan.realized.company:null;return r&&r.net_krw!=null?r:null;}
function kpi(s){
 const box=document.getElementById('studio-map-kpi');if(!box)return;
 const p=s.plan,now=ym(new Date()),c=company(s);
 const net=c?c.net_krw:0,pct=p&&c?Math.min(100,Math.round(net/p.target_krw*1000)/10):0;
 const left=p?Math.max(0,monthsBetween(now,p.target_month)):null;
 const slots=s.lanes.reduce((n,l)=>n+l.filled,0),slotsMax=s.lanes.reduce((n,l)=>n+l.per,0);
 const running=s.agents.filter(a=>a.pid).length,scheduled=s.agents.filter(a=>a.loaded&&!a.pid&&!a.failing).length,failing=s.agents.filter(a=>a.failing).length;
 const ladderNow=p?(p.ladder||[]).find(x=>x.month===now):null;
 const tiles=[
  {k:'TARGET · '+(p?esc(p.target_month):'—'),v:p?`월 ${won(p.target_krw)}`:'계획 없음',s:p?`남은 ${left}개월 · 이달 사다리 ${ladderNow?won(ladderNow.krw):'—'}`:'원장에 revenue_plan 없음',cls:'target'},
  {k:'ACTUAL · '+(c?esc(c.as_of):'월'),v:c?`순이익 ${won(c.net_krw)}`:'미확인',s:c?`매출 ${won(c.revenue_krw)} · 운영자 진술 · 원장 cash_event ${s.ledger.cash_events??'미확인'}건`:'실적 기록 없음',cls:'realized'},
  {k:'PROGRESS · 순이익',v:c?`${pct}%`:'미산정',s:c?`<i class="bar"><b style="width:${Math.max(0,pct)}%"></b></i>${won(c.net_krw)} / ${p?won(p.target_krw):'—'}`:'실적 기록 확인 전',cls:'kpi-progress'},
  {k:'오늘 · 비공개 업로드',v:s.todayShort==null?'미확인':`${s.todayShort}편`,s:`예약 ${slots}/${slotsMax} 슬롯 · ${s.supervisorPid?'현재 실행 중':s.supervisorLoaded?'다음 실행 대기':'슈퍼바이저 미등록'}`,cls:''},
  {k:'CHANNELS',v:`${s.lanes.length} / ${p&&p.channels?p.channels.target:10}`,s:'운영 중 / 목표 채널',cls:''},
  {k:'선택 보조 업무',v:`${running+scheduled} / ${s.agents.length}`,s:`실행 ${running} · 예약 ${scheduled}${failing?' · 실패 '+failing:''}`,cls:failing?'warn':''},
 ];
 box.innerHTML=tiles.map(t=>`<article class="${t.cls}"><span>${t.k}</span><b>${t.v}</b><small>${t.s}</small></article>`).join('');
}
function timeline(s){
 const box=document.getElementById('studio-map-timeline');if(!box)return;
 const p=s.plan;if(!p){box.innerHTML='';return;}
 const now=ym(new Date()),ladder=p.ladder||[],max=p.target_krw||1;
 const months=ladder.map(x=>x.month),notes=Object.fromEntries((p.milestones||[]).map(m=>[m.month,m.text])),actual=p.realized_by_month||{};
 const pts=ladder.map((x,i)=>[i/(ladder.length-1)*100,100-x.krw/max*100]);
 const path=pts.map((q,i)=>`${i?'L':'M'}${q[0]} ${q[1]}`).join(' ');
 const area=path+` L100 100 L0 100 Z`;
 const idx=months.indexOf(now);
 const apts=ladder.map((x,i)=>actual[x.month]?[pts[i][0],100-(actual[x.month].net_krw||0)/max*100,actual[x.month]]:null);
 const apath=apts.filter(Boolean).map((q,i)=>`${i?'L':'M'}${q[0]} ${q[1]}`).join(' ');
 box.innerHTML=`<div class="studio-map-tl-head"><div><span class="kicker">REVENUE LADDER · 순이익 · 계획선 vs 실적점</span><h3>${esc(ladder[0]?ladder[0].month:now)} → ${esc(p.target_month)} · 월 ${won(p.target_krw)}</h3><p>${esc(p.basis)}</p></div></div>
 <div class="studio-map-tl-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="area" d="${area}"/><path class="line" d="${path}"/>${apath?`<path class="actual" d="${apath}"/>`:''}${idx>=0?`<line class="now" x1="${pts[idx][0]}" x2="${pts[idx][0]}" y1="0" y2="100"/>`:''}</svg>
  <div class="dots">${ladder.map((x,i)=>`<span style="left:${pts[i][0]}%;top:${pts[i][1]}%" class="${x.month===now?'now':x.month<now?'past':''}"><i></i><b>${won(x.krw)}</b></span>`).join('')}${apts.map(q=>q?`<span style="left:${q[0]}%;top:${q[1]}%" class="actual"><i></i><b>실적 ${won(q[2].net_krw)}</b></span>`:'').join('')}</div></div>
 <ol class="studio-map-tl-months" style="grid-template-columns:repeat(${ladder.length},minmax(0,1fr))">${ladder.map(x=>`<li class="${x.month===now?'now':x.month<now?'past':''}${actual[x.month]?' has-actual':''}"><time>${esc(x.month)}</time>${actual[x.month]?`<em>매출 ${won(actual[x.month].revenue_krw)} · 순이익 ${won(actual[x.month].net_krw)}</em>`:''}<p>${esc(notes[x.month]||'')}</p></li>`).join('')}</ol>`;
}
function live(m){
 const box=document.getElementById('studio-map-live');if(!box)return;
 const p=m.pipeline_live;if(!p||p.error){box.innerHTML=p&&p.error?`<p class="err">진행 현황을 읽지 못했습니다: ${esc(p.error)}</p>`:'';return;}
 const names=Object.fromEntries(LANES.map(id=>[id,((m.channels||{})[id]||{}).channel_name||id]));
 const ST={running:'제작 중',slow:'진행 확인',stalled:'관측 정체',interrupted:'소유자 없음',unknown:'관측 확인',done:'완료',failed:'실패'};
 const lane=(id)=>{const j=p.lanes[id];if(!j)return `<li class="lane idle"><b>${esc(names[id])}</b><span>기록 없음</span></li>`;
  const steps=j.stages.map((s,i)=>`<i class="${i<j.stage_index?'done':i===j.stage_index&&j.state==='running'?'now':''}" title="${esc(s)}"></i>`).join('');
  const meta=j.state==='running'?`${esc(j.stage)} · ${j.elapsed_min}분 경과`:['stalled','slow'].includes(j.state)?`${esc(j.stage)} · 최근 파일·이벤트 ${j.idle_min}분 전${j.owner_active?' · 작업 잠금 유지':''}`:j.state==='interrupted'?'미완성 기록 · 현재 제작 잠금 없음':j.state==='unknown'?'관측 자료 확인 필요':j.state==='failed'?`실패 · ${esc(j.error||'')}`:`완료 · ${j.elapsed_min}분`;
  return `<li class="lane ${j.state}${p.current===id?' current':''}"><b>${esc(names[id])}</b><em>${ST[j.state]}</em><div class="steps">${steps}</div><div class="tm"><span class="t">${esc(j.title||(j.state==='running'?'대본 작성 중':j.content_id))}</span><span class="m">${meta}</span></div></li>`;};
 const r=p.recent,w=p.weekly,fc=p.forecast;
 const sourcesOpen=box.querySelector('.production-sources')?.open || false;
 const ready=w?.observation_available && !(w.errors||[]).length;
 const pct=ready&&w.target?Math.min(100,100*w.confirmed/w.target):0;
 const estimate=ready&&w.target&&w.confirmed>=w.target?'7일 목표 확보':!fc?.available?'6시간 기록·표본 확보 후 보충 전망 표시':fc.net_buffer_per_day<=0?'관측 생산 속도가 일일 발행량 이하 · 현재 재고 순증 없음':`하루 순증 ${fc.net_buffer_per_day}편 가정 · 부족분 보충 약 ${fc.days_to_close_gap}일`;
 const fills=(w?.days||[]).map(d=>`<button class="day" type="button" data-week-date="${esc(d.date)}"><time>${esc(d.date.slice(5))}</time><b>${ready?d.confirmed:'—'}<small>/${d.target}</small></b><i class="bar"><b style="width:${d.target?Math.min(100,100*d.confirmed/d.target):0}%"></b></i><span>슬롯 보기 ↗</span></button>`).join('');
 const frontier=w?.frontier;
 const blocked=(frontier?.channels||[]).filter(x=>(x.blockers||[]).length && !(x.blockers||[]).every(b=>b==='outside_frontier'));
 const blockerName={retry_cooldown:'재시도 대기',source_replenishment:'사용 가능한 소재 수집',producer_busy:'기존 작업 진행',daily_cap_reached:'생산 상한 도달',awaiting_publication:'발행 확인 대기',no_ready_topic:'소재 준비 대기',outside_frontier:'다음 날짜 대기'};
 const inventory=Object.entries(p.source_inventory||{}).map(([key,v])=>`<li><b>${esc(names[key]||key)}</b><span>대기 ${v.raw_pending} · 사용 가능 ${v.effective_pending}${v.reason==='producer_exhausted_same_input'?' · 새 소재 수집 필요':''}</span><small>${esc(new Date(v.observed_at).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit'}))} 관측</small></li>`).join('');
 const runs=r.rows.slice(0,8).map(x=>`<li class="${x.shipped?'ok':'no'}"><time>${esc(new Date(x.at).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}))}</time><b>${esc(names[x.channel]||x.channel)}</b><span>${x.shipped?esc(x.title||'완성 기록'):x.reason?'실패 · '+esc(x.reason):'생산 대기 기록'}</span><em>${Math.round(x.minutes||0)}분</em></li>`).join('');
 box.innerHTML=`<div class="live-head"><span class="kicker">LIVE PIPELINE · 5초 갱신</span><span class="stat">24시간 완성 기록 ${r.shipped} · 실패 ${r.failed}${r.rate!=null?` · 작업 성공률 ${r.rate}%`:''}${r.cycle_median_min?` · 제작 중앙값 ${r.cycle_median_min}분`:''}</span></div>
 <div class="weekly-buffer"><div><span class="kicker">ROLLING 7 DAYS / 공개·원격 예약 관측</span><strong>${ready?w.confirmed:'—'} <small>/ ${w?.target??'—'} 슬롯</small></strong><p>확인 대기 ${w?.pending??'—'} · 미확보 ${ready?w.missing:'—'} · 날짜별 빈 슬롯부터 보충</p></div><div><b>${esc(estimate)}</b><p>${fc?.available?`최근 6시간 완성 ${fc.completed}편 · 하루 ${fc.observed_daily_output}편 환산 · 계획 발행 ${w.daily_release_target}편/일`:'표본 또는 관측 범위가 부족해 완료 시점을 계산하지 않습니다.'}</p><small>생산·발행량 유지 가정의 추정치입니다. 예약 완료 또는 처리량 보장이 아닙니다.</small></div><i class="weekly-progress"><b style="width:${pct}%"></b></i></div>
 <div class="fill week-fill">${fills}</div>
 <p class="production-frontier">최근 배정 기준 ${esc(frontier?.frontier||'관측 대기')} · ${esc(names[frontier?.selected]||frontier?.selected||'대기')}${w&&!w.frontier_fresh?' · 배정 관측 갱신 확인':''}${blocked.length?' · 대기 사유 '+blocked.map(x=>esc(names[x.channel]||x.channel)+': '+(x.blockers||[]).map(b=>esc(blockerName[b]||b)).join(', ')).join(' / '):''}</p>
 <div class="live-grid"><ol class="lanes">${LANES.map(lane).join('')}</ol><div class="side"><details class="production-sources" ${sourcesOpen?'open':''}><summary>사용 가능한 소재 관측</summary><ul>${inventory||'<li>다음 조정기 실행에서 관측합니다.</li>'}</ul></details><ol class="runs">${runs||'<li>최근 24시간 기록 없음</li>'}</ol></div></div>
 ${[...(p.observation_errors||[]),...(w?.errors||[])].length?`<p class="err">일부 관측 확인: ${[...(p.observation_errors||[]),...(w?.errors||[])].map(esc).join(' · ')}</p>`:''}`;
 box.querySelectorAll('[data-week-date]').forEach(button=>button.onclick=()=>{
  window.switchTab?.('monitor');
  const target=[...document.querySelectorAll('[data-studio-date]')].find(x=>x.dataset.studioDate===button.dataset.weekDate);
  target?.click();document.querySelector('.studio-calendar')?.scrollIntoView({behavior:'smooth',block:'start'});
 });
}
function build(s){
 const cats=s.categories.filter(c=>s.lines.some(l=>l.category===c.id)),total=s.lines.length||1;
 const edges=[],nodes=[],labels=[];let a0=-Math.PI/2+0.22;const pos={};
 edges.push(`<g class="studio-map-orbits"><circle cx="${CX}" cy="${CY}" r="${R1}"/><circle cx="${CX}" cy="${CY}" r="${R2}"/><circle class="spin" cx="${CX}" cy="${CY}" r="${R2+34}"/></g>`);
 cats.forEach((cat,ci)=>{
  const rows=s.lines.filter(l=>l.category===cat.id),span=2*Math.PI*rows.length/total,amid=a0+span/2,[hx,hy]=polar(R1,amid);
  const catTarget=rows.reduce((n,l)=>n+(target(l.id,s)||0),0);
  edges.push(`<path id="e-h${ci}" class="studio-map-edge hub" data-from="company" data-to="cat:${esc(cat.id)}" data-flow="1" d="M${CX} ${CY}L${hx} ${hy}"/>`);
  rows.forEach((l,i)=>{
   const a=a0+span*(i+.5)/rows.length,[x,y]=polar(R2,a),st=STAGE[l.stage]||STAGE.proposed,pct=linePct(l,s);pos[l.id]=[x,y];
   const live=l.stage==='operating'||l.stage==='building',tg=target(l.id,s);
   edges.push(`<path id="e-${esc(l.id)}" class="studio-map-edge stage-${esc(l.stage)}" data-from="cat:${esc(cat.id)}" data-to="${esc(l.id)}" ${live?'data-flow="1"':''} d="M${hx} ${hy}L${x} ${y}"/>`);
   const right=Math.cos(a)>=0,lx=x+(right?36:-36);
   nodes.push(`<g class="studio-map-node line stage-${esc(l.stage)}${l.stage==='operating'?' live':''}" data-key="${esc(l.id)}" tabindex="0" role="button" aria-label="${esc(l.name)}" transform="translate(${x} ${y})">
    <circle r="28" class="halo"/><circle r="22" class="body"/><path class="track" d="${arc(27,1)}"/><path class="ring" d="${arc(27,pct)}" style="stroke:${st[2]}"/><text class="pct" dy="4">${l.id==='shorts'?Math.round(pct*100):'·'}</text></g>`);
   labels.push(`<text class="studio-map-label" x="${lx}" y="${y-2}" text-anchor="${right?'start':'end'}">${esc(l.name.length>16?l.name.slice(0,15)+'…':l.name)}<tspan class="sub" x="${lx}" dy="16">${st[0]} · ${AUTO[l.automation]||esc(l.automation||'')}</tspan>${tg?`<tspan class="money" x="${lx}" dy="15">목표 월 ${won(tg)} · 실현 ${realizedText(l.id,s)}</tspan>`:''}</text>`);
  });
  nodes.push(`<g class="studio-map-node hub" data-key="cat:${esc(cat.id)}" tabindex="0" role="button" aria-label="${esc(cat.name)}" transform="translate(${hx} ${hy})"><circle r="36"/><text dy="-5">${esc(cat.name.slice(0,7))}</text><text dy="10" class="sub">${rows.length}개 사업</text>${catTarget?`<text dy="23" class="money">월 ${won(catTarget)}</text>`:''}</g>`);
  a0+=span;
 });
 const [bx,by]=pos.shorts||[CX+R2,CY-120];
 edges.push(`<path id="e-bridge" class="studio-map-edge bridge" data-from="shorts" data-to="supervisor" data-flow="1" d="M${bx} ${by}C${bx+170} ${by-40} ${SX-200} ${SY+40} ${SX-40} ${SY}"/>`);
 s.lanes.forEach((l,i)=>{const y=LY0+i*LSTEP;
  edges.push(`<path id="e-lane-${l.id}" class="studio-map-edge lane${l.enabled?'':' off'}" data-from="supervisor" data-to="lane:${l.id}" ${l.enabled?'data-flow="1"':''} d="M${SX} ${SY+36}C${SX} ${y} ${LX-150} ${y} ${LX-27} ${y}"/>`);
  const pct=Math.min(1,l.filled/l.per),cls=l.producing?'producing':l.deferred?'deferred':l.enabled?'idle':'off';
  nodes.push(`<g class="studio-map-node lane ${cls}" data-key="lane:${l.id}" tabindex="0" role="button" aria-label="${esc(l.name)}" transform="translate(${LX} ${y})"><circle r="26" class="halo"/><circle r="20" class="body"/><path class="track" d="${arc(25,1)}"/><path class="ring" d="${arc(25,pct)}"/><text dy="4" class="pct">${l.filled}/${l.per}</text></g>`);
  labels.push(`<text class="studio-map-label" x="${LX+36}" y="${y+2}">${esc(l.name)}<tspan class="sub" x="${LX+36}" dy="16">${l.producing?'제작 중 · '+esc(l.stage||''):l.deferred?'재시도 대기':l.enabled===null?'관측 미확인':l.enabled?'대기':'비활성'}${l.blockers.length?' · 발행 차단 '+l.blockers.length:''}</tspan></text>`);
 });
 const ayEnd=AY0+(s.agents.length-1)*ASTEP;
 edges.push(`<path id="e-bus" class="studio-map-edge bus" data-from="supervisor" data-to="agents" data-flow="1" d="M${SX} ${SY+36}L${SX} ${AY0-30}L${AX} ${AY0-30}L${AX} ${ayEnd}"/>`);
 s.agents.forEach((a,i)=>{const y=AY0+i*ASTEP,cls=a.pid?'running':a.failing?'failing':a.loaded?'scheduled':'missing';
  nodes.push(`<g class="studio-map-agent ${cls}" data-key="agent:${esc(a.label)}" tabindex="0" role="button" aria-label="${esc(a.name)}" transform="translate(${AX} ${y})"><circle r="7" class="dot"/><text x="18" dy="4">${esc(a.name)}<tspan class="sub"> ${esc(a.desc)}</tspan></text></g>`);
 });
 const chTarget=s.plan&&s.plan.channels?s.plan.channels.target:null;
 nodes.push(`<g class="studio-map-node supervisor${s.supervisorPid?' live':' down'}" data-key="supervisor" tabindex="0" role="button" aria-label="슈퍼바이저" transform="translate(${SX} ${SY})"><circle r="42" class="halo"/><circle r="34" class="body"/><text dy="-4">슈퍼바이저</text><text dy="12" class="sub">${s.supervisorPid?'현재 실행 중':s.supervisorLoaded?'실행 대기':'미등록'}</text></g>`);
 labels.push(`<text class="studio-map-kicker" x="${SX-40}" y="${SY-66}">SHORTS ENGINE · ${s.lanes.length}채널${chTarget?' → '+chTarget+'채널':''}</text><text class="studio-map-kicker" x="${AX-12}" y="${AY0-48}">AGENTS · 수집 · 점검 · 발행</text>`);
 nodes.push(`<g class="studio-map-node company" data-key="company" tabindex="0" role="button" aria-label="${esc(s.company)}" transform="translate(${CX} ${CY})">
   <circle class="wave" r="66"><animate attributeName="r" values="66;130" dur="4.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".45;0" dur="4.2s" repeatCount="indefinite"/></circle>
   <circle class="wave" r="66"><animate attributeName="r" values="66;130" dur="4.2s" begin="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".45;0" dur="4.2s" begin="1.4s" repeatCount="indefinite"/></circle>
   <circle class="wave" r="66"><animate attributeName="r" values="66;130" dur="4.2s" begin="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".45;0" dur="4.2s" begin="2.8s" repeatCount="indefinite"/></circle>
   <circle r="64" class="body"/>
   <g class="mark" transform="translate(-16 -34)"><polygon points="3,8 14,8 32,52"/><polygon points="61,8 50,8 32,52"/><rect x="28" y="48" width="8" height="8"/></g>
   <text dy="40" class="name">${esc(s.company)}</text><text dy="56" class="sub">${company(s)?`순이익 월 ${won(company(s).net_krw)} → ${won(s.plan.target_krw)} · ${esc(s.plan.target_month)}`:s.plan?`${esc(s.plan.target_month)} 월 ${won(s.plan.target_krw)} 목표`:`사업 ${s.lines.length}`}</text></g>`);
 return `<svg viewBox="0 0 ${W} ${H}" class="studio-map-svg" role="group" aria-label="RAYV STUDIO 사업·미디어 상세도, 선택 보조 업무 9개">
  <defs><radialGradient id="map-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${T.paper}" stop-opacity=".07"/><stop offset="1" stop-color="${T.paper}" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${CX}" cy="${CY}" r="${R2+120}" fill="url(#map-glow)"/>
  <g class="edges">${edges.join('')}</g><g class="labels">${labels.join('')}</g><g class="nodes">${nodes.join('')}</g><g class="lights"></g></svg>`;
}
function lights(svg){
 if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){svg.querySelectorAll('animate,animateMotion').forEach(n=>n.remove());return;}
 const layer=svg.querySelector('.lights'),NS='http://www.w3.org/2000/svg';let i=0;
 svg.querySelectorAll('path[data-flow]').forEach(edge=>{
  const len=edge.getTotalLength();if(!len)return;
  const g=document.createElementNS(NS,'g');g.setAttribute('class','studio-map-light');g.dataset.edge=edge.id;
  const trail=document.createElementNS(NS,'line');trail.setAttribute('x1','-14');trail.setAttribute('y1','0');trail.setAttribute('x2','0');trail.setAttribute('y2','0');trail.setAttribute('class','trail');
  const dot=document.createElementNS(NS,'circle');dot.setAttribute('r','2.8');
  const motion=document.createElementNS(NS,'animateMotion');motion.setAttribute('dur',(len/SPEED).toFixed(2)+'s');motion.setAttribute('repeatCount','indefinite');motion.setAttribute('rotate','auto');motion.setAttribute('begin',((i++%6)*0.7).toFixed(1)+'s');
  const mpath=document.createElementNS(NS,'mpath');mpath.setAttribute('href','#'+edge.id);motion.appendChild(mpath);
  g.appendChild(trail);g.appendChild(dot);g.appendChild(motion);layer.appendChild(g);
 });
}
function detail(key,s){
 const p=s.plan;
 if(key==='company'){const c=company(s);return `<span class="kicker">COMPANY</span><h3>${esc(s.company)}</h3><p>사업 ${s.lines.length}개 — 운영 ${s.counts.operating??0} · 구축 ${s.counts.building??0} · 정지 ${s.counts.paused??0} · 검토 ${s.counts.proposed??0}. 오늘 비공개 업로드 ${s.todayShort==null?'미확인':s.todayShort+'편'}.</p>${p?`<div class="money-row"><div><span>목표 · ${esc(p.target_month)}</span><b>월 ${won(p.target_krw)}</b><small>계획</small></div><div><span>실적 · ${c?esc(c.as_of):'—'}</span><b>${c?'순이익 '+won(c.net_krw):'미확인'}</b><small>${c?'매출 '+won(c.revenue_krw)+' · '+esc(c.basis):'기록 없음'}</small></div></div><dl><dt>근거</dt><dd>${esc(p.basis)}</dd></dl>`:''}<p class="meta">venture 원장 cash_event ${s.ledger.cash_events??'미확인'} · order ${s.ledger.orders??'미확인'} · LEDGER ${esc(s.revision)}</p>`;}
 if(key.startsWith('cat:')){const c=s.categories.find(x=>'cat:'+x.id===key);const rows=s.lines.filter(l=>l.category===c.id);const sum=rows.reduce((n,l)=>n+(target(l.id,s)||0),0);
  return `<span class="kicker">${esc(c.kicker)}</span><h3>${esc(c.name)}</h3><p>${esc(c.note)}</p>${sum?`<p class="meta">분류 목표 합계 월 ${won(sum)} (가정)</p>`:''}<ul class="list">${rows.map(l=>`<li><button type="button" data-go="${esc(l.id)}">${esc(l.name)}</button><em>${(STAGE[l.stage]||STAGE.proposed)[0]}${target(l.id,s)?' · '+won(target(l.id,s)):''}</em></li>`).join('')}</ul>`;}
 if(key==='supervisor')return `<span class="kicker">AUTOMATION ORG</span><h3>슈퍼바이저</h3><p>${s.supervisorPid?'현재 실행 중 (pid '+esc(s.supervisorPid)+'). 가까운 미충족 제작 슬롯부터 배차하는 설정입니다. PID 관측은 연속 24시간 가동의 증거가 아닙니다.':s.supervisorLoaded?'launchd 등록됨 · 현재 작업 없음. 다음 실행은 운영 설정과 자원·소재 상태에 따릅니다.':'launchd 등록 상태를 확인해야 합니다.'}</p>${s.lastRun?`<p class="meta">마지막 작업 ${esc(s.lastRun.channel)} · ${esc(String(s.lastRun.outcome||''))} · ${esc(String(s.lastRun.minutes||''))}분${s.lastRun.produced_nothing?' · '+esc(s.lastRun.produced_nothing):''}</p>`:''}`;
 if(key.startsWith('lane:')){const l=s.lanes.find(x=>'lane:'+x.id===key);
  return `<span class="kicker">LANE / ${esc(l.id)}</span><h3>${esc(l.name)}</h3><dl><dt>오늘 예약</dt><dd>${l.filled} / ${l.per} 슬롯</dd><dt>상태</dt><dd>${l.producing?'제작 중 · '+esc(l.stage||''):l.deferred?'실패 뒤 재시도 대기':l.enabled===null?'관측 미확인':l.enabled?'대기':'비활성'}</dd>${l.content?`<dt>현재 작업</dt><dd>${esc(l.content)}</dd>`:''}<dt>마지막 완성</dt><dd>${l.last?esc(l.last.replace('T',' ').slice(0,16))+'Z':'없음'}</dd><dt>마지막 업로드</dt><dd>${l.lastUpload?esc(l.lastUpload.replace('T',' ').slice(0,16))+'Z':'없음'}</dd>${l.blockers.length?`<dt>발행 차단</dt><dd>${l.blockers.map(esc).join(' · ')}</dd>`:''}</dl>`;}
 if(key.startsWith('agent:')){const a=s.agents.find(x=>'agent:'+x.label===key);
  return `<span class="kicker">AGENT</span><h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p><dl><dt>상태</dt><dd>${a.pid?'실행 중 (pid '+esc(a.pid)+')':a.failing?'마지막 실행 실패 (exit '+esc(a.exit)+')':a.loaded?'예약됨':'미등록'}</dd><dt>launchd</dt><dd>${esc(a.label)}</dd><dt>로그</dt><dd>state/portfolio/logs/${esc(a.label.replace('dev.saeos.',''))}.log</dd></dl>`;}
 const l=s.lines.find(x=>x.id===key);if(!l)return '';const st=STAGE[l.stage]||STAGE.proposed,tg=target(l.id,s),r=realized(l.id,s);
 const links=(l.links||[]).map(k=>`<a href="${esc(k.url)}"${k.url.startsWith('#')?'':' target="_blank" rel="noopener"'}>${esc(k.label)} ↗</a>`).join('');
 const offers=l.offers?Object.entries(l.offers).map(([k,n])=>`${esc(k)} ${n}`).join(' · '):'';
 const present=(l.present||[]).map(q=>`${esc(String(q.path).split('/').pop())} ${q.exists?'존재':'미확인'}`).join(' · ');
 return `<span class="kicker">${esc((s.categories.find(c=>c.id===l.category)||{}).kicker||'BUSINESS LINE')}</span><h3>${esc(l.name)}</h3>
  <div class="stage"><i style="background:${st[2]}"></i>${st[0]} · ${l.id==='shorts'?'오늘 예약 '+Math.round(linePct(l,s)*100)+'%':'개발 검증은 제품 작업 공간에서 확인'} · ${AUTO[l.automation]||esc(l.automation||'')}${l.risk?' · 위험 '+esc(l.risk):''}</div>
  ${tg||r?`<div class="money-row"><div><span>목표 · ${p?esc(p.target_month):''}</span><b>월 ${won(tg)}</b><small>계획 가정</small></div><div><span>실현 · 월</span><b>${r?`${won(r.min)}~${won(r.max)}`:'미확인'}</b><small>${r?esc(r.basis):'원장 증빙 없음'}</small></div></div>`:''}
  <p>${esc(l.what||'')}</p><dl><dt>사업 근거</dt><dd>${esc(l.evidence)}</dd><dt>다음 과제</dt><dd>${esc(l.next)}</dd>${offers?`<dt>원장</dt><dd>offer ${offers}</dd>`:''}${l.compute||l.gpu_minutes!=null?`<dt>운영 자원</dt><dd>${l.gpu_minutes!=null?'GPU '+l.gpu_minutes+'분/일 설계 · ':''}${esc(l.compute||'')}</dd>`:''}${present?`<dt>산출물</dt><dd>${present}</dd>`:''}</dl><div class="links">${links}<a href="/portfolio/?business=${encodeURIComponent(l.id)}">제품 빌드·실행·전달 시험 ↗</a></div>`;
}
function select(key){
 const root=document.getElementById('studio-map-root'),panel=document.getElementById('studio-map-detail'),svg=root&&root.querySelector('svg');if(!root||!svg)return;
 selected=key;
 svg.classList.toggle('has-selection',!!key);
 svg.querySelectorAll('[data-key]').forEach(n=>n.classList.toggle('sel',n.dataset.key===key));
 svg.querySelectorAll('.studio-map-edge').forEach(e=>e.classList.toggle('sel',!!key&&(e.dataset.from===key||e.dataset.to===key)));
 svg.querySelectorAll('.studio-map-light').forEach(g=>{const e=svg.getElementById(g.dataset.edge);g.classList.toggle('sel',!!(e&&e.classList.contains('sel')));});
 if(!key){panel.classList.remove('open');panel.innerHTML='';return;}
 panel.innerHTML=`<button type="button" class="close" aria-label="닫기">×</button>${detail(key,summary)}`;
 panel.classList.add('open');
 panel.querySelector('.close').addEventListener('click',()=>select(null));
 panel.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.go)));
}
function render(m){
 const root=document.getElementById('studio-map-root');if(!root)return;
 const s=summarize(m);summary=s;const key=JSON.stringify(s);if(key===lastKey)return;lastKey=key;
 kpi(s);timeline(s);
 const panel=document.getElementById('studio-map-detail');
 root.innerHTML=build(s);
 if(panel)root.appendChild(panel);  // 패널은 지도 위에만 떠야 한다(KPI 타일을 덮지 않도록)
 const svg=root.querySelector('svg');lights(svg);
 svg.querySelectorAll('[data-key]').forEach(n=>{
  const go=()=>select(selected===n.dataset.key?null:n.dataset.key);
  n.addEventListener('click',go);n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
 });
 const legend=document.getElementById('studio-map-legend');
 if(legend)legend.innerHTML=`${Object.values(STAGE).map(v=>`<span><i style="background:${v[2]}"></i>${v[0]}</span>`).join('')}<span><i class="pulse"></i>제작 중</span><span><i class="dash"></i>마지막 실행 실패</span><span>목표 = 계획 가정 · 실현 = 원장·운영자 진술</span><span class="rev">빛 ${SPEED}px/s 균일 · 5초 동기화 · LEDGER ${esc(s.revision)}</span>`;
 if(selected)select(selected);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&selected)select(null);});
const previous=window.renderStudio;
window.renderStudio=(data,state)=>{previous(data,state);try{render(data);}catch(e){console.error('map',e);}try{live(data);}catch(e){console.error('live',e);}};
const prevSwitch=window.switchTab;
window.switchTab=tab=>{
 if(!TABS.includes(tab))return prevSwitch(tab);
 prevSwitch(tab);
 const pane=document.getElementById(tab+'-tab');
 if(pane){pane.classList.remove('studio-tab-in');void pane.offsetWidth;pane.classList.add('studio-tab-in');}
 if(location.hash!=='#'+tab)history.replaceState(null,'','#'+tab);
 if(tab==='map')document.getElementById('map-tab')?.scrollIntoView({behavior:'smooth',block:'start'});
};
window.addEventListener('hashchange',()=>{const t=location.hash.slice(1);if(TABS.includes(t))window.switchTab(t);});
const start=location.hash.slice(1);
window.switchTab(TABS.includes(start)?start:'map');
})();
