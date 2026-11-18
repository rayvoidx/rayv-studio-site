/* Deterministic advisory scenarios and an original, conceptual SVG storyboard. */
(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('quality-data').textContent);
  const contract=JSON.parse(document.getElementById('quality-contract').textContent);
  const policy=data.policy;
  const $=id=>document.getElementById(id);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(value,positive=false)=>{
    if(typeof value!=='number'||!Number.isFinite(value)||value<0||(positive&&value===0))throw new Error('유한한 0 이상의 숫자를 입력하세요.');
    return value;
  };
  const fmt=value=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2}).format(value);
  const duration=value=>{const rounded=Math.round(value);return `${Math.floor(rounded/60)}시간 ${rounded%60}분`;};

  function calculateScenario(options={}){
    if(policy.schema!=='quality-first-channel-v1'||policy.execution_authorized!==false||policy.production_changes_authorized!==false||policy.publishing_enabled!==false||policy.target.long_form!==false||policy.channels.length!==10)throw new Error('검토용 설계 계약을 확인하세요.');
    const gpuMultiplier=num(options.gpu_multiplier??1,true);
    const outputMultiplier=num(options.output_multiplier??1);
    const reviewer=options.review_hours_week===undefined?null:options.review_hours_week;
    if(reviewer!==null)num(reviewer);
    const tiers=Object.fromEntries(policy.tiers.map(t=>[t.id,t]));
    const reserve=1+num(policy.retry_reserve_percent)/100;
    const rows=policy.channels.map(channel=>{
      const tier=tiers[channel.tier];
      if(!tier)throw new Error('알 수 없는 제작 등급입니다.');
      const count=Math.ceil(num(tier.weekly_per_channel)*outputMultiplier);
      const base=count*num(tier.gpu_minutes_each,true)*gpuMultiplier;
      return {id:channel.id,name:channel.name,tier:channel.tier,weekly_outputs:count,base_gpu_minutes_week:base,gpu_minutes_week:base*reserve,review_minutes_week:count*num(tier.review_minutes_each,true)};
    });
    const sum=key=>rows.reduce((total,row)=>total+row[key],0);
    const gpu=sum('gpu_minutes_week'),base=sum('base_gpu_minutes_week'),review=sum('review_minutes_week');
    const budget=num(policy.source.gpu_minutes_day)*num(policy.days_per_week);
    const reviewAvailable=reviewer===null?null:reviewer*60;
    const gpuFits=gpu<=budget;
    const reviewFits=reviewAvailable===null?null:review<=reviewAvailable;
    return {execution_authorized:false,publishing_enabled:false,production_changes_authorized:false,measured_on_target:false,ready_to_execute:false,readiness:gpuFits&&reviewFits!==false?'unknown':'hold',weekly_outputs:sum('weekly_outputs'),base_gpu_minutes_week:base,retry_gpu_minutes_week:gpu-base,gpu_minutes_week:gpu,gpu_minutes_week_budget:budget,gpu_deficit_minutes_week:Math.max(0,gpu-budget),gpu_headroom_minutes_week:Math.max(0,budget-gpu),gpu_fits_assumptions:gpuFits,review_minutes_week:review,review_hours_week:review/60,review_available_hours_week:reviewer,review_deficit_minutes_week:reviewAvailable===null?null:Math.max(0,review-reviewAvailable),review_fits_assumptions:reviewFits,scenario:{gpu_multiplier:gpuMultiplier,output_multiplier:outputMultiplier,output_rounding:'ceil_per_channel',review_hours_week:reviewer},rows};
  }
  // Read-only pure calculation exposed for local parity verification, not execution.
  window.calculateScenario=calculateScenario;

  function renderChannels(){
    const labels={flagship:['대표 포맷 · 2개','제작 시간 집중 · 각 주 3편 상한 가정'],support:['기존 채널 개선 · 5개','기존 고유 약속 유지 · 각 주 2편 상한 가정'],pilot:['제한된 파일럿 · 3개','한 포맷씩 검증 · 각 주 1편 상한 가정']};
    $('channel-groups').innerHTML=policy.tiers.map(tier=>`<div class="group"><div class="group-heading"><span class="tier-tag ${escape(tier.id)}">${escape(tier.id.toUpperCase())}</span><h3>${labels[tier.id][0]}</h3><p>${labels[tier.id][1]}</p></div><div class="channel-grid ${escape(tier.id)}">${policy.channels.filter(c=>c.tier===tier.id).map(channel=>`<article class="channel"><header><span>${String(channel.slot).padStart(2,'0')} / ${escape(channel.tier.toUpperCase())}</span><span>${channel.status==='existing_configuration'?'기존 운영 설정':'신규 가설 · 미개설/미인증'}</span></header><h4>${escape(channel.name)}</h4><p class="contract">${escape(channel.audience_contract)}</p><dl><dt>대표 화면</dt><dd>${escape(channel.signature_visual)}</dd><dt>제작 가정</dt><dd>편당 GPU ${fmt(tier.gpu_minutes_each)}분 · 검수 ${fmt(tier.review_minutes_each)}분</dd></dl><details><summary>첫 세 질문과 제작 조건</summary><ul>${channel.initial_questions.map(q=>`<li>${escape(q)}</li>`).join('')}</ul><p>${escape(channel.production_dependency)}</p><p class="blocker">미확인: ${channel.blockers.map(escape).join(' · ')}</p></details></article>`).join('')}</div></div>`).join('');
  }

  const shots=[
    {phase:'QUESTION / 00–03초',title:'집 안쪽까지, 빛은 어떻게 들어올까?',description:'완성된 건물을 먼저 보여 주고, 이번 편에서 확인할 질문을 한 문장으로 고정합니다.',job:'시청자가 무엇을 보게 될지 첫 화면에서 알 수 있게 하기.',condition:'실제 건물 대신 자체 개념도를 사용합니다. 촬영·일조 측정으로 표시하지 않습니다.',subtitle:'창밖에서 보던 집을, 옆으로 열어 보겠습니다.',mode:'exterior'},
    {phase:'REVEAL / 03–12초',title:'벽을 열면 공간의 관계가 보입니다.',description:'앞벽을 걷어 내고 창·실내·바닥을 같은 시점으로 연결합니다. 장식용 배경 교체 대신 정보를 추가합니다.',job:'외관에서는 보이지 않던 내부 공간과 창의 위치 드러내기.',condition:'형태·축척은 설명을 위한 단순화입니다. 특정 건축물 복원으로 쓰지 않습니다.',subtitle:'같은 집, 같은 시점. 이번에는 내부를 봅니다.',mode:'cutaway'},
    {phase:'MECHANISM / 12–25초',title:'한 줄의 경로를 따라갑니다.',description:'창에서 실내로 이어지는 빛의 예시 경로를 겹칩니다. 실제 밝기를 계산하기 전에 무엇을 비교할지 명확히 합니다.',job:'설명 중인 대상과 화면 속 움직임이 일치하게 하기.',condition:'예시 선은 실제 태양 방향·유리 특성·반사를 계산한 결과가 아닙니다.',subtitle:'빛의 방향을 선으로 표시하면, 질문이 구체화됩니다.',mode:'rays'},
    {phase:'COMPARISON / 25–40초',title:'조건을 바꾸되, 기준은 유지합니다.',description:'두 조건을 나란히 놓고 창과 차양의 차이를 표시합니다. 카메라나 방 크기를 바꿔 효과를 과장하지 않습니다.',job:'전후 차이가 무엇 때문인지 시청자가 비교할 수 있게 하기.',condition:'개념 비교입니다. 실제 효율·쾌적성·절감률을 수치로 만들지 않습니다.',subtitle:'같은 공간에서, 비교할 조건 하나를 바꿉니다.',mode:'compare'},
    {phase:'EVIDENCE / 40–52초',title:'그림 다음에는 검증할 조건이 남습니다.',description:'그럴듯한 단면도로 사실 검증을 대신하지 않습니다. 원문·방향·시간·주변 환경이 필요한 지점을 짚습니다.',job:'개념도와 실측·문헌 근거의 경계를 화면에서도 분명히 하기.',condition:'이 시연에는 원문 검증·일조 계산·실제 최종 음성 검수가 없습니다.',subtitle:'보기 좋은 설명과 검증된 설명을 함께 만들어야 합니다.',mode:'evidence'},
    {phase:'PAYOFF / 52–60초',title:'처음의 질문으로 돌아옵니다.',description:'외관과 단면을 다시 붙여 무엇을 새롭게 볼 수 있게 됐는지 회수합니다. 다음 영상으로 넘기기 전에 이번 편의 답을 정리합니다.',job:'단순한 이미지 모음이 아닌 질문→구조→비교→회수가 되는지 확인하기.',condition:'완성 영상에서는 원문·모델 조건과 실제 검수를 연결한 뒤에만 최종 설명을 확정합니다.',subtitle:'집의 겉모습에서, 빛이 지나가는 공간으로.',mode:'payoff'}
  ];
  const line='#e8e8e2',gray='#8e8e89';
  const svgText=(x,y,text,size=14,fill=gray)=>`<text x="${x}" y="${y}" fill="${fill}" font-family="system-ui,sans-serif" font-size="${size}">${escape(text)}</text>`;
  const house=(cut,rays=false,awning=false)=>`<g stroke="${line}" stroke-width="1.6" fill="none"><path d="M90 161L320 68l230 93-230 61z" fill="#333"/><path d="M90 161v157l230 50 230-94V161"/><path d="M320 222v146" stroke="#73736e" stroke-dasharray="5 5"/>${cut?'<path d="M90 318l230 50 230-94-230-51z" fill="#282828"/><path d="M320 222L90 161v157" stroke-dasharray="5 5" stroke="#72726e"/><path d="M105 208v67l42 9v-66z" fill="#aaa"/><path d="M365 217v84l53-22v-84z"/><path d="M451 181v85l53-23v-85z"/>':'<path d="M90 161v157l230 50V222z" fill="#272727"/><path d="M134 202v64l51 11v-64z" fill="#777"/><path d="M230 248v100l45 10V258z" fill="#373737"/><path d="M365 217v84l53-22v-84z"/><path d="M451 181v85l53-23v-85z"/>'}${rays?'<path d="M147 237l276 91M147 258l207 96" stroke="#e4e4d5" stroke-width="2"/><path d="M147 237l276 91-69 26-207-96z" fill="#e4e4d5" fill-opacity=".16" stroke="none"/>':''}${awning?'<path d="M107 194l55 12-7 7-54-12z" fill="#eeeeea"/>':''}<path d="M52 332l271 61 270-113" stroke="#666"/></g>`;
  function sceneSVG(shot,index){
    let content='';
    if(shot.mode==='compare'){
      content=`<g transform="translate(3,65) scale(.53)">${house(true,true,false)}</g><g transform="translate(310,65) scale(.53)">${house(true,false,true)}<path d="M147 237l80 90M147 258l31 73" stroke="${line}" stroke-width="2"/></g><path d="M320 87v249" stroke="#555" stroke-dasharray="3 5"/>${svgText(55,61,'A / 차양 없는 예시',13)}${svgText(361,61,'B / 차양 있는 예시',13)}${svgText(145,370,'비교 조건 외에는 같은 형태 · 개념도',13)}`;
    }else if(shot.mode==='evidence'){
      content=`<g transform="translate(35,55)"><path d="M0 0h220l45 45v245H0z" fill="#262626" stroke="${line}"/><path d="M220 0v45h45M27 78h170M27 103h196M27 128h142M27 178h190M27 203h172M27 228h127" stroke="#777"/>${svgText(27,47,'근거와 조건',19,line)}</g>${svgText(354,104,'출처 원문과 해당 문장',15,line)}${svgText(354,157,'방향 · 시간 · 주변 환경',15,line)}${svgText(354,210,'개념도 / 실측 구분',15,line)}${svgText(354,263,'모바일 화면 · 최종 음성',15,line)}${svgText(355,326,'현재 시연: 검증 전',12)}`;
    }else if(shot.mode==='payoff'){
      content=`<defs><clipPath id="exterior-half"><rect width="320" height="420"/></clipPath><clipPath id="cutaway-half"><rect x="320" width="320" height="420"/></clipPath></defs><g clip-path="url(#exterior-half)">${house(false)}</g><g clip-path="url(#cutaway-half)">${house(true,true)}</g><path d="M320 60v321" stroke="#eee" stroke-dasharray="4 6"/>${svgText(90,35,'겉모습',13)}${svgText(430,35,'공간과 경로',13)}`;
    }else{
      content=house(shot.mode!=='exterior',shot.mode==='rays');
      if(shot.mode==='rays')content+=`${svgText(45,108,'예시 경로',13)}<path d="M88 117l24 77" stroke="#aaa"/>${svgText(343,395,'실제 일조 계산 아님',11)}`;
      if(shot.mode==='cutaway')content+=`${svgText(65,85,'앞벽을 걷어 낸 개념 단면',13)}<path d="M124 95l-13 47" stroke="#aaa"/>`;
    }
    return `<title id="shot-svg-title">${escape(shot.title)}</title><desc id="shot-svg-desc">${escape(shot.description)} 설명용 자체 개념도이며 실제 건물의 계산이나 복원 결과가 아닙니다.</desc>${content}${svgText(18,411,`CONCEPT ${String(index+1).padStart(2,'0')} / NOT A MEASUREMENT`,8,'#777')}`;
  }
  let shotIndex=0;
  function renderShot(index){
    shotIndex=(index+shots.length)%shots.length;
    const shot=shots[shotIndex];
    $('shot-svg').innerHTML=sceneSVG(shot,shotIndex);
    $('shot-number').textContent=`SHOT ${String(shotIndex+1).padStart(2,'0')} / 06`;
    $('shot-position').textContent=`${shotIndex+1} / 6`;
    for(const [id,key]of [['shot-phase','phase'],['shot-title','title'],['shot-description','description'],['shot-job','job'],['shot-condition','condition'],['shot-subtitle','subtitle']])$(id).textContent=shot[key];
    document.querySelectorAll('[data-shot]').forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.shot)===shotIndex?'true':'false'));
  }
  $('shot-tabs').innerHTML=shots.map((shot,i)=>`<button type="button" data-shot="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')} / ${['질문','단면','경로','비교','근거','회수'][i]}</span>${['질문을 던지기','내부를 열기','원리를 겹치기','차이를 보여주기','조건을 확인하기','답을 회수하기'][i]}</button>`).join('');
  $('shot-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-shot]');if(button)renderShot(Number(button.dataset.shot));});
  $('shot-prev').addEventListener('click',()=>renderShot(shotIndex-1));
  $('shot-next').addEventListener('click',()=>renderShot(shotIndex+1));
  $('shot-tabs').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const focused=Number(event.target.closest('[data-shot]')?.dataset.shot??shotIndex);
    const next=event.key==='Home'?0:event.key==='End'?5:focused+(event.key==='ArrowRight'?1:-1);
    renderShot(next);
    document.querySelector(`[data-shot="${shotIndex}"]`).focus();
  });

  let current;
  function update(){
    try{
      const reviewRaw=$('review-hours').value;
      const options={gpu_multiplier:Number($('gpu-cost').value),output_multiplier:Number($('output-scale').value),review_hours_week:reviewRaw===''?null:Number(reviewRaw)};
      current=calculateScenario(options);
      $('scenario-error').hidden=true;
      $('gpu-cost-value').value=options.gpu_multiplier.toFixed(2)+'×';
      $('output-scale-value').value=options.output_multiplier.toFixed(2)+'×';
      $('weekly-outputs').textContent=fmt(current.weekly_outputs);
      $('gpu-demand').textContent=`${fmt(current.gpu_minutes_week)} / ${fmt(current.gpu_minutes_week_budget)}분`;
      $('gpu-track').style.width=Math.min(100,current.gpu_minutes_week/current.gpu_minutes_week_budget*100)+'%';
      $('gpu-track').parentElement.setAttribute('aria-label',`주간 GPU 예산 ${fmt(current.gpu_minutes_week_budget)}분, 가정 수요 ${fmt(current.gpu_minutes_week)}분`);
      $('gpu-status').textContent=current.gpu_fits_assumptions?`가정상 잔여 ${fmt(current.gpu_headroom_minutes_week)}분. 실제 제작 여력은 측정 전입니다.`:`가정상 ${fmt(current.gpu_deficit_minutes_week)}분 부족. 편수나 비용 가정을 조정해야 합니다.`;
      $('review-demand').textContent=`${duration(current.review_minutes_week)} / ${options.review_hours_week===null?'가용 미확인':duration(options.review_hours_week*60)}`;
      $('review-status').textContent=current.review_fits_assumptions===null?'검수 가용 시간을 확인하기 전에는 충족 여부를 판단하지 않습니다.':current.review_fits_assumptions?'입력한 검수 시간 안의 가정입니다. 실제 검수 완료를 뜻하지 않습니다.':`검수 시간이 ${duration(current.review_deficit_minutes_week)} 부족합니다. 검수 없이 합격 처리하지 않습니다.`;
      $('readiness').textContent=current.readiness==='hold'?'계획 보류 조건: 자원 가정이 예산을 넘습니다. Studio 실측·품질·설계 승인도 확인 전입니다.':'준비 상태 미확인: Studio 실측·후보 품질·운영 적용 승인 전입니다.';
    }catch(error){current=null;$('scenario-error').textContent='시나리오 확인 필요: '+error.message;$('scenario-error').hidden=false;$('readiness').textContent='계산 보류 · 실행 승인 없음';}
  }
  $('scenario-form').addEventListener('input',update);
  $('scenario-form').addEventListener('submit',event=>event.preventDefault());
  $('reset').addEventListener('click',()=>{HTMLFormElement.prototype.reset.call($('scenario-form'));update();});
  $('export').addEventListener('click',()=>{
    if(!current)return;
    const packet={schema:'quality-first-review-scenario-v1',execution_authorized:false,source_contract:contract,projection:current};
    const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='rayv-quality-first-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('source-contract').textContent=JSON.stringify({...contract,freshness:'빌드 시점의 정본 해시입니다. 이 정적 문서는 이후 원장 변경을 자동 감지하지 않습니다. 원장이 바뀌면 빌드를 다시 실행하고 검증해야 합니다.'},null,2);
  if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed');
  renderChannels();renderShot(0);update();
})();
