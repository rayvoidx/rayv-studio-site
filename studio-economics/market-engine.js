/* Offline regional economics, matching rayv_market_plan.project; never execution authority. */
(function(root){
 'use strict';
 const n=(v,lo=0,hi=1e9,int=false)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi||(int&&!Number.isInteger(v)))throw Error('지역별 계획 입력 범위를 확인하세요.');return v;};
 function project(p,c,kr=0,global=0,route='global_direct',scope='full',available=c.available_hours,fx=p.finance.fx_usd_krw_assumption){
  if(p.schema!=='rayv-market-plan-v1'||p.mode!=='advisory'||p.execution_authorized!==false||p.actual_mrr!==null||p.actual_nonacademy_cash!==null||p.commercial_wip!==1||p.discovery_wip!==1||p.outbound_enabled!==false||p.new_gpu_jobs!==false)throw Error('지역별 계획 계약 오류');
  n(kr,0,10000,true);n(global,0,10000,true);n(available,0,744);n(fx,1,10000);
  if(!['global_direct','global_tpt'].includes(route)||!['full','bounded'].includes(scope))throw Error('지원하지 않는 판매 경로');
  const f=p.finance,rows=[['kr',kr],[route,global]].map(([id,count])=>{const r=f.routes[id],rate=r.currency==='USD'?fx:1,price=Math.floor(r.price*rate+.5),fee=Math.ceil(price*r.fee_percent_budget/100)+Math.ceil(r.fixed_fee*rate),refund=Math.ceil(price*f.refund_percent/100),unit=price-fee-refund-r.direct_krw,stress=Math.floor(count*(1-f.stress_drop_percent/100));return {route:id,orders:count,gross:price*count,unit_contribution:unit,contribution:unit*count,stress_orders:stress,stress_contribution:unit*stress};});
  const sum=k=>rows.reduce((s,r)=>s+r[k],0),cash=sum('contribution')-f.fixed_cost_month_krw,stress=sum('stress_contribution')-f.fixed_cost_month_krw,commercial=f.commercial_base_hours_month+(kr+global)*f.support_minutes_order/60,full=c.full_review_minutes_week*52/12/60,review=c[scope+'_review_minutes_week']*52/12/60,total=commercial+review+c.music_hours+c.other_hours,setup=Math.ceil((f.routes[route].setup_usd||0)*fx);
  return {rows,monthly_cash:cash,stress_cash:stress,goal_gap:Math.max(0,p.goal_krw-cash),gross:sum('gross'),one_time_setup:setup,first_month_after_setup:cash-setup,launch_mrr:0,actual_cash:null,owner:{commercial_hours:+commercial.toFixed(2),commercial_ceiling_hours:p.capacity.commercial_hours_ceiling_month,commercial_fits:commercial<=p.capacity.commercial_hours_ceiling_month,media_review_hours:+review.toFixed(2),total_hours:+total.toFixed(2),available_hours:available,fits:total<=available,deficit_hours:+Math.max(0,total-available).toFixed(2),legacy_reconciled_total:+(c.legacy_total_hours-c.legacy_review_hours+full).toFixed(2),academy_hours:null,observed_capacity:null},scope,fx_assumption:fx,execution_authorized:false};
 }
 const api={project};if(typeof module==='object'&&module.exports)module.exports=api;else root.MarketPlan=api;
})(typeof window!=='undefined'?window:globalThis);
