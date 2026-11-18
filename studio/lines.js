/* RAYV STUDIO business lines. Read-only view of docs/design/rayv-business-lines.json via /api/metrics. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STAGE={operating:'운영 중',building:'구축 중',paused:'일시 정지',proposed:'검토 단계'};
const AUTO={full:'자동화 운영',semi:'부분 자동화',manual:'운영자 수행'};
const RISK={low:'위험 낮음',mid:'위험 중간',high:'위험 높음'};
let last='';
const categoryOpen=new Map();
function mount(){
 let box=$('studio-lines');if(box)return box;
 box=document.createElement('section');box.id='studio-lines';box.className='card studio-portfolio studio-lines';
 document.querySelector('.studio-calendar').before(box);
 const nav=document.querySelector('.noir-nav');const first=nav?.querySelector('a[data-noir-target]');
 if(first&&!nav.querySelector('[data-noir-target="studio-lines"]')){
  const a=document.createElement('a');a.href='#studio-lines';a.dataset.noirTarget='studio-lines';a.innerHTML='<span></span>사업 포트폴리오';first.after(a);
  nav.querySelectorAll('a[data-noir-target] span').forEach((s,i)=>s.textContent=String(i+1).padStart(2,'0'));
 }
 return box;
}
function card(l){
 const tags=[`<span class="studio-tag${l.stage==='operating'?' fill':''}">${STAGE[l.stage]||escape(l.stage)}</span>`,
  `<span class="studio-tag">${AUTO[l.automation]||escape(l.automation)}</span>`,
  `<span class="studio-tag">${RISK[l.risk]||escape(l.risk)}</span>`].join('');
 const resource=[l.gpu_minutes!=null?`GPU ${l.gpu_minutes}분/일 설계`:'',escape(l.compute||'')].filter(Boolean).join(' · ');
 const offers=l.offers?Object.entries(l.offers).map(([s,n])=>`${escape(s)} ${n}`).join(' · '):'';
 const live=l.live?`${l.live.channels}채널 · ${l.live.slots}슬롯/일 · 슈퍼바이저 ${l.live.supervisor===true?'활성':l.live.supervisor===false?'중지':'미확인'}`:'';
 const present=(l.present||[]).map(p=>`${escape(p.path.split('/').pop())} ${p.exists?'존재':'미확인'}`).join(' · ');
 const links=(l.links||[]).map(k=>`<a href="${escape(k.url)}"${k.url.startsWith('#')?'':' target="_blank" rel="noopener"'}>${escape(k.label)} ↗</a>`).join('');
 const sources=(l.sources||[]).length?`<details><summary>외부 참고 ${l.sources.length} · 미검증</summary>${l.sources.map(s=>`<a href="${escape(s)}" target="_blank" rel="noopener">${escape(s.replace(/^https?:\/\//,'').slice(0,56))}</a>`).join('')}</details>`:'';
 return `<article class="studio-line stage-${escape(l.stage)}"><header>${tags}</header><h3>${escape(l.name)}</h3><p>${escape(l.what)}</p><dl>${live?`<dt>운영 현황</dt><dd>${live}</dd>`:''}<dt>사업 근거</dt><dd>${escape(l.evidence)}</dd>${offers?`<dt>원장</dt><dd>offer ${offers}</dd>`:''}${resource?`<dt>운영 자원</dt><dd>${resource}</dd>`:''}<dt>추진 과제</dt><dd>${escape(l.next)}</dd></dl><footer>${links}${sources}${present?`<small>${present} · 파일 존재는 실행 상태가 아님</small>`:''}</footer></article>`;
}
function render(data){
 const d=data.business_lines;if(!d)return;
 const key=JSON.stringify(d);if(key===last)return;last=key;
 const box=mount();
 if(d.error){box.innerHTML=`<div class="studio-section-head"><div><span class="studio-kicker">COMPANY / BUSINESS LINES</span><h2>사업 포트폴리오</h2></div></div><p class="studio-capacity-warning">사업 원장을 읽지 못했습니다: ${escape(d.error)}</p>`;return;}
 const c=d.counts;
 box.querySelectorAll('details.studio-lines-cat').forEach(node=>categoryOpen.set(node.id,node.open));
 box.innerHTML=`<div class="studio-section-head"><div><span class="studio-kicker">COMPANY / BUSINESS LINES</span><h2>${escape(d.company)} 사업 포트폴리오</h2><p>${d.principles.map(escape).join(' · ')}</p></div><span class="studio-sync">원장 자동 동기화 · 5초</span></div>
<div class="studio-portfolio-grid"><article><span>운영 중</span><b>${c.operating}</b><p>서비스·콘텐츠 운영이 확인된 사업</p></article><article><span>구축 · 일시 정지</span><b>${c.building+c.paused}</b><p>산출물 확보 · 수익화 체계 구축 중</p></article><article><span>사업 검토</span><b>${c.proposed}</b><p>시장·수요 검증 전 · 외부 자료 별도 확인</p></article></div>
${d.categories.map(cat=>{const rows=d.lines.filter(l=>l.category===cat.id);return `<details class="studio-lines-cat" id="studio-lines-${escape(cat.id)}" ${(categoryOpen.get('studio-lines-'+cat.id)??cat.id!=='candidate')?'open':''}><summary><div class="studio-lines-head"><span class="studio-kicker">${escape(cat.kicker)}</span><h3>${escape(cat.name)} <small>${rows.length}</small></h3><p>${escape(cat.note)}</p></div></summary><div class="studio-lines-grid">${rows.map(card).join('')||'<p class="studio-empty">등록된 사업이 없습니다.</p>'}</div></details>`;}).join('')}
<div class="studio-portfolio-footer"><p>${escape(d.basis)} venture 원장 cash_event ${d.ledger.cash_events??'미확인'}건 · order ${d.ledger.orders??'미확인'}건.</p><span>LEDGER ${escape(d.revision)}<br>docs/design/rayv-business-lines.json · 읽기 전용</span></div>`;
}
const previous=window.renderStudio;
window.renderStudio=(data,state)=>{previous(data,state);render(data);};
})();
