/* Pure advisory arithmetic; mirrored in rayv_studio_economics.py. */
(function (root) {
  'use strict';
  function number(v, lo=0, hi=1e12) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) throw Error('계획값 범위를 확인하세요.');
    return v;
  }
  const sum = a => a.reduce((s,v)=>s+v,0);
  function validate(p) {
    if (p.schema!=='studio-economics-v1' || p.mode!=='advisory' || p.execution_authorized!==false) throw Error('지원하지 않는 계획 계약');
    const walk=v=>{if(typeof v==='number')number(v);else if(v && typeof v==='object')Object.values(v).forEach(walk);};walk(p);
    if(p.hardware.gpu_owner_limit!==1 || p.hardware.extra_inference_fallback!==false)throw Error('로컬 GPU 소유권 계약 오류');
    ['macbook','studio'].forEach(k=>{const d=p.hardware[k];number(d.cpu_cores,1,1024);number(d.memory_gib,1,4096);if(d.gpu_cores!==null)number(d.gpu_cores,1,4096);});
    if(p.phases.length!==3 || [...new Set(p.phases.map(x=>x.id))].sort().join()!=='before,calibrate,steady')throw Error('단계 오류');
    p.phases.forEach(x=>{if(sum(Object.values(x.gpu_minutes))!==1440||sum(Object.values(x.cpu_shares))!==100)throw Error('자원 합계 오류');['cpu_worker_limit','encode_concurrency','encode_threads'].forEach(k=>number(x[k],1,128));});
    const f=p.finance,a=p.acquisition;
    ['fee_percent','refund_reserve_percent','churn_stress_percent'].forEach(k=>number(f[k],0,100));
    if(f.fee_percent+f.refund_reserve_percent>100)throw Error('수수료·환불 합계는 100% 이하여야 합니다.');
    ['paid_conversion_percent','monthly_customer_churn_percent'].forEach(k=>number(a[k],0,100));
    number(a.horizon_months,1,36);number(a.qualified_visits_month,0,1e7);
    if(!p.offers.length || new Set(p.offers.map(x=>x.id)).size!==p.offers.length)throw Error('상품 오류');
    p.offers.forEach(o=>{['price_krw','target_customers','direct_cost_per_customer_krw','base_owner_hours','support_hours_per_customer'].forEach(k=>number(o[k]));if(!Number.isInteger(o.target_customers))throw Error('고객 수는 정수');});
    number(p.throughput.minutes_per_short_assumption,.1,1440);number(p.throughput.retry_reserve_percent,0,500);
    ['live_channels','next_channels','design_ceiling','slots_per_channel'].forEach(k=>number(p.throughput[k],1,200));
    number(p.hardware.memory_peak_multiplier,1,3);
    if(p.upside.some(o=>o.base_floor_krw!==0))throw Error('미확정 성장 수익은 반복 수익에서 제외');
    return p;
  }
  function recurring(p,counts=p.offers.map(o=>o.target_customers)) {
    validate(p);if(counts.length!==p.offers.length||counts.some(n=>!Number.isInteger(n)||n<0))throw Error('고객 수 오류');
    const f=p.finance;let hours=f.base_commercial_owner_hours;
    const rows=p.offers.map((o,i)=>{const n=counts[i],gross=o.price_krw*n,fees=Math.ceil(gross*f.fee_percent/100)+n*f.fixed_fee_krw,refunds=Math.ceil(gross*f.refund_reserve_percent/100),direct=n*o.direct_cost_per_customer_krw;
      hours+=o.base_owner_hours+n*o.support_hours_per_customer;
      return {id:o.id,customers:n,gross,fees,refunds,direct,contribution:gross-fees-refunds-direct,unit_contribution:+(o.price_krw*(1-(f.fee_percent+f.refund_reserve_percent)/100)-f.fixed_fee_krw-o.direct_cost_per_customer_krw).toFixed(2)};});
    const fixed=sum(Object.values(f.fixed_costs_krw)),cash=sum(rows.map(o=>o.contribution))-fixed;
    return {rows,customers:sum(counts),gross:sum(rows.map(o=>o.gross)),fees:sum(rows.map(o=>o.fees)),refunds:sum(rows.map(o=>o.refunds)),direct:sum(rows.map(o=>o.direct)),fixed,operating_cash:cash,owner_hours:+hours.toFixed(2),owner_hours_fit:hours<=f.owner_hours_available,after_owner_labour:cash-Math.ceil(+hours.toFixed(2)*f.owner_hour_value_krw),goal_gap:Math.max(0,p.goal.monthly_operating_cash_krw-cash),actual_nonacademy:null,execution_authorized:false};
  }
  function acquisition(p) {
    validate(p);const a=p.acquisition,weights=p.offers.map(o=>o.target_customers),total=sum(weights),fresh=Math.floor(a.qualified_visits_month*a.paid_conversion_percent/100),portions=weights.map(w=>total?fresh*w/total:0),allocated=portions.map(Math.floor);
    if(total){const order=portions.map((v,i)=>({i,remainder:v-allocated[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);order.slice(0,fresh-sum(allocated)).forEach(x=>allocated[x.i]++);}
    let counts=weights.map(()=>0),first=null;const months=[];
    for(let month=1;month<=Math.floor(a.horizon_months);month++){counts=counts.map((n,i)=>Math.floor(n*(1-a.monthly_customer_churn_percent/100))+allocated[i]);const cash=recurring(p,counts);months.push({month,customers:sum(counts),operating_cash:cash.operating_cash,owner_hours:cash.owner_hours,owner_hours_fit:cash.owner_hours_fit});if(first===null&&cash.operating_cash>=p.goal.monthly_operating_cash_krw&&cash.owner_hours_fit)first=month;}
    return {new_accounts:total?fresh:0,allocated,months,first_goal_month:first,basis:'scenario_not_observed'};
  }
  function resources(p,id='steady') {
    validate(p);const ph=p.phases.find(x=>x.id===id);if(!ph)throw Error('단계 오류');const d=p.hardware[ph.device],h=p.hardware,t=p.throughput,budget=ph.gpu_minutes.shorts||0,cost=t.minutes_per_short_assumption*(1+t.retry_reserve_percent/100);
    const throughput=[...new Set([t.live_channels,t.next_channels,t.design_ceiling])].map(n=>{const demand=n*t.slots_per_channel;return {channels:n,shorts:demand,gpu_minutes:+(demand*cost).toFixed(2),deficit_minutes:+Math.max(0,demand*cost-budget).toFixed(2),fits:demand*cost<=budget,required_base_minutes:+(budget/demand/(1+t.retry_reserve_percent/100)).toFixed(2)};});
    const stages=p.stages.map(s=>{const writer=s.writer_resident?ph.writer_gib:0,kv=s.id==='writer'?(ph.writer_kv_gib||0):0,background=ph.background_gib||0,total=ph.os_gib+ph.headroom_gib+background+writer+(s.peak_gib+kv)*h.memory_peak_multiplier;return {id:s.id,required_gib:+total.toFixed(2),writer_gib:writer,kv_gib:kv,background_gib:background,fits:total<=d.memory_gib,measured:false};});
    const pw=p.power,electricity=Math.ceil(pw.average_watts*pw.hours_per_day*pw.days*pw.unit_krw_per_kwh_assumption/1000);
    return {phase:id,cpu:Object.entries(ph.cpu_shares).map(([id,share])=>({id,share,core_equivalents:+(d.cpu_cores*share/100).toFixed(2)})),stages,throughput,shorts_budget:budget,max_shorts:Math.floor(budget/cost),electricity_estimate:electricity,electricity_budget:p.finance.fixed_costs_krw['전기 예산'],electricity_within_budget:electricity<=p.finance.fixed_costs_krw['전기 예산'],encode_threads:ph.encode_threads*ph.encode_concurrency,measured_on_target:false,execution_authorized:false};
  }
  function project(p) {validate(p);const base=recurring(p),c=p.operations.owner_capacity,music=p.operations.music_owner_hours_week*c.music_weeks_per_month,review=c.media_review_outputs_day*c.media_review_minutes_each*c.media_review_days_month/60,total=base.owner_hours+music+review+c.other_hours_month;return {base,stress:recurring(p,p.offers.map(o=>Math.floor(o.target_customers*(1-p.finance.churn_stress_percent/100)))),acquisition:acquisition(p),resources:Object.fromEntries(p.phases.map(ph=>[ph.id,resources(p,ph.id)])),owner_capacity:{music_hours:+music.toFixed(2),review_hours:+review.toFixed(2),total_hours:+total.toFixed(2),available_hours:c.total_available_hours_month,fits:total<=c.total_available_hours_month,academy_hours:null,measured:false},execution_authorized:false};}
  function storage(p,total,free,shorts=30,payload=0){[total,free,shorts,payload].forEach(v=>number(v));if(total<=0||free>total)throw Error('SSD 가용량은 전체 용량 이하여야 합니다.');const s=p.storage,future=shorts*s.retention_days*s.artifact_mib_per_accepted_short/1024,reserve=Math.max(s.min_free_floor_gib,total*s.min_free_fraction),required=s.core_model_download_allowance_gib+s.scratch_gib+future+reserve+payload;return {future_buffer_gib:+future.toFixed(2),protected_free_gib:+reserve.toFixed(2),required_free_gib:+required.toFixed(2),observed_free_gib:+free.toFixed(2),deficit_gib:+Math.max(0,required-free).toFixed(2),fits:free>=required,optional_models_extra_gib:s.optional_models_extra_gib,measured_buffer_size:false};}
  const api={validate,recurring,acquisition,resources,project,storage};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioEconomics=api;
})(typeof window!=='undefined'?window:globalThis);
