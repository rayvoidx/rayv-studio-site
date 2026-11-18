/* Quality-first direction with the prior twenty-channel option inventory retained. */
(()=>{
'use strict';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let revision;const opened=new Map();
const previous=window.renderStudio;
window.renderStudio=(data,state)=>{
 previous(data,state);const d=data.channel_roster;if(!d)return;
 let box=document.getElementById('studio-channel-roster');
 if(!box){box=document.createElement('section');box.id='studio-channel-roster';box.className='card studio-portfolio';document.querySelector('.studio-calendar').before(box);}
 const key=JSON.stringify(d);if(key===revision)return;revision=key;
 if(d.error){box.textContent='채널 확장 설계 확인 필요: '+d.error;return;}
 box.querySelectorAll('details[data-roster-group]').forEach(e=>opened.set(e.dataset.rosterGroup,e.open));
 const groups=[['existing','기존 콘텐츠 사업','CURRENT CONFIGURATION'],['persona','AI 인물 브랜드 · 여성 3 / 남성 2','CROSS-PLATFORM PERSONAS'],['new_theme','신규 콘텐츠 포맷 9개','NEW FORMAT DEVELOPMENT']];
 box.innerHTML=`<div class="studio-section-head"><div><span class="studio-kicker">CHANNEL PORTFOLIO / QUALITY FIRST</span><h2>최대 10개 후보 · 대표 2개 집중</h2><p>현재 설정 ${d.configured_current}개 · 기존 6개와 신규 4개 후보를 검토 · 완성도와 검수 시간에 따라 편수 조정</p><p><a class="studio-button" href="/docs/operating-plan/quality-first/index.html">영상화 콘티·10개 구성·자원 계산 ↗</a></p></div></div><div class="studio-portfolio-grid"><article><span>대표 포맷 후보</span><b>2</b><p>역사의구조 · 공간의이유</p></article><article><span>기존 유지 후보</span><b>5</b><p>고유 시청 이유와 검수 유지</p></article><article><span>신규 시험 후보</span><b>3</b><p>과학 · 지리 · 영어 게임</p></article></div><p>2026-11-05 검토용 설계 · 10개는 상한이며 활성화 의무가 아닙니다. 기존 6개 운영 설정을 유지합니다. 19편/주 예시는 실측 전 가정이며 자동 발행 목표가 아닙니다.</p><details class="studio-lines-cat" data-roster-group="archive" ${opened.get('archive')?'open':''}><summary><div class="studio-lines-head"><span class="studio-kicker">PREVIOUS OPTIONS / 2026-11-01</span><h3>이전 20개 채널 후보군</h3></div></summary><p>이전 신규 기획 ${d.new_briefs}개를 보관합니다. 20×5=100편/일은 최신 실행 목표가 아닙니다. AI 인물 YouTube 확대는 후순위이며 별도 Instagram 계획과 음악 사업을 취소하지 않습니다.</p>${groups.map(([id,title,kicker])=>`<details class="studio-lines-cat" data-roster-group="${id}" ${opened.get(id)?'open':''}><summary><div class="studio-lines-head"><span class="studio-kicker">${kicker}</span><h3>${title}</h3></div></summary><div class="studio-lines-grid">${d.channels.filter(c=>c.group===id).map(c=>`<article class="studio-line"><header><span class="studio-tag">${String(c.slot).padStart(2,'0')}</span><span class="studio-tag">${id==='existing'?'현재 설정':'이전 준비 · 미개설/미인증'}</span></header><h3>${escape(c.name)}</h3><p>${escape(c.theme)}</p><dl><dt>운영 방향</dt><dd>${escape(c.positioning)}</dd><dt>수익 구조</dt><dd>${escape(c.business_role)}</dd>${c.persona?`<dt>브랜드 연계</dt><dd>성인 가상 인물 · ${c.persona.gender==='female'?'여성':'남성'} · ${escape(c.persona.adult_age)} · IG / YouTube 동일 정체성</dd>`:''}${c.seed_topics.length?`<dt>초기 기획</dt><dd>${c.seed_topics.map(escape).join(' / ')}</dd>`:''}</dl></article>`).join('')}</div></details>`).join('')}<div class="studio-portfolio-footer"><p>이전 신규 14개 채널별 비활성 준비 번들 · 주제별 근거와 권리, 계정·OAuth, 포맷별 렌더러, 비공개 업로드 검증 전</p><span>ARCHIVE ${escape(d.revision)}<br>이전 기획 원장</span></div></details>`;
};
})();
