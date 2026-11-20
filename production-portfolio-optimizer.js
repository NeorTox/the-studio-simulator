(function(root){
'use strict';
const VERSION='1.0.0',MAX_BUDGET_UNITS=100000;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const num=(v,fallback=0)=>{const n=Number(v);return Number.isFinite(n)?n:fallback};
const money=(v)=>Math.max(0,num(v));
const median=(values)=>{const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
const safeId=(v)=>String(v??'').trim();
function ensureActive(){if(typeof active==='undefined'||!active)throw Error('Create or load a campaign before optimizing the production slate.');if(!active.company)throw Error('The campaign company record is missing.');active.projects=Array.isArray(active.projects)?active.projects:[];return active}
function historicalComparables(project){
 const all=active.projects.filter(p=>p&&p.id!==project.id&&p.performance&&money(p.budget)>0&&Number.isFinite(num(p.performance.gross,NaN))&&Number.isFinite(num(p.performance.studioRevenue,NaN))&&Number.isFinite(num(p.performance.profit,NaN)));
 const format=String(project.format||'').toLowerCase(),genre=String(project.genre||'').trim().toLowerCase();
 const exact=all.filter(p=>String(p.format||'').toLowerCase()===format&&genre&&String(p.genre||'').trim().toLowerCase()===genre);
 if(exact.length)return{projects:exact,match:'format-and-genre'};
 const sameFormat=all.filter(p=>String(p.format||'').toLowerCase()===format);
 if(sameFormat.length)return{projects:sameFormat,match:'format'};
 const sameGenre=all.filter(p=>genre&&String(p.genre||'').trim().toLowerCase()===genre);
 return{projects:sameGenre,match:sameGenre.length?'genre':'none'};
}
function baseGrossMultiple(format){
 const f=String(format||'').toLowerCase();
 if(f.includes('animation'))return 3.25;
 if(f.includes('documentary'))return 1.9;
 if(f.includes('game')||f.includes('interactive'))return 2.7;
 if(f.includes('streaming'))return 2.35;
 if(f.includes('television')||f.includes('series')||f.includes('radio'))return 2.45;
 if(f.includes('feature film')||f.includes('film'))return 3.0;
 return 2.3;
}
function estimate(project,portfolioGenres,cash,marketPressure){
 const budget=money(project.budget),spent=money(project.spent),committed=money(project.committed);
 const comp=historicalComparables(project),comps=comp.projects;
 let grossMultiple,studioRevenueRatio,profitRatio,confidence;
 if(comps.length){
  grossMultiple=median(comps.map(p=>money(p.performance.gross)/money(p.budget)));
  studioRevenueRatio=median(comps.map(p=>money(p.performance.studioRevenue)/money(p.budget)));
  profitRatio=median(comps.map(p=>num(p.performance.profit)/money(p.budget)));
  confidence=clamp(.58+Math.min(comps.length,5)*.065+(comp.match==='format-and-genre'?.12:comp.match==='format'?.06:0),.58,.94);
 }else{
  grossMultiple=baseGrossMultiple(project.format);
  studioRevenueRatio=grossMultiple*.425;
  profitRatio=studioRevenueRatio-1-.15-.03;
  confidence=.38;
 }
 const estimatedGross=budget*grossMultiple;
 const estimatedStudioRevenue=budget*studioRevenueRatio;
 const expectedProfit=budget*profitRatio;
 const existingGenre=portfolioGenres.has(String(project.genre||'').trim().toLowerCase());
 const strategicScore=String(project.genre||'').trim()? (existingGenre?48:88):50;
 const cashRatio=cash>0?budget/cash:1;
 const stage=num(project.stage);
 const risk=clamp(.17+(comps.length?0:.18)+(stage===0?.11:.05)+(cashRatio>.35?.14:cashRatio>.2?.07:0)+marketPressure*.12,.08,.78);
 const riskAdjustedProfit=expectedProfit*(1-risk);
 const roiPct=budget>0?expectedProfit/budget*100:0;
 const remainingBudget=Math.max(0,budget-spent-committed);
 return{
  id:safeId(project.id),title:String(project.title||'Untitled project'),format:String(project.format||'Unspecified'),genre:String(project.genre||'Unspecified'),
  stage,stageName:stage===0?'Concept':'Development',budget,spent,committed,remainingBudget,
  comparableCount:comps.length,comparableBasis:comp.match,confidence,grossMultiple,
  estimatedGross,estimatedStudioRevenue,expectedProfit,roiPct,risk,riskAdjustedProfit,
  strategicScore,estimatedAt:active.date
 };
}
function analyze(fundingPct=65){
 ensureActive();
 const pct=num(fundingPct,NaN);if(!Number.isFinite(pct)||pct<10||pct>90)throw Error('Funding allocation must be between 10% and 90% of company cash.');
 const cash=money(active.company.cash),envelope=Math.floor(cash*pct/100);
 const unit=Math.max(1,Math.ceil(envelope/MAX_BUDGET_UNITS));
 const budgetUnits=Math.min(MAX_BUDGET_UNITS,Math.floor(envelope/unit));
 const marketPressure=clamp(num(active.competitors?.market?.competitionIndex,0)/100,0,1);
 const eligible=active.projects.filter(p=>p&&safeId(p.id)&&num(p.stage)<=1&&!p.greenlit&&!['Released','Cancelled','Archived'].includes(p.status)&&money(p.budget)>0);
 const genreCounts=new Map();eligible.forEach(p=>{const g=String(p.genre||'').trim().toLowerCase();if(g)genreCounts.set(g,(genreCounts.get(g)||0)+1)});
 const rows=eligible.map(p=>estimate(p,new Set([...genreCounts.keys()].filter(g=>genreCounts.get(g)>1)),cash,marketPressure));
 const algorithm=root.StudioAlgorithms;
 if(!algorithm||typeof algorithm.rankAlternatives!=='function'||typeof algorithm.optimizeBudget!=='function')throw Error('The advanced algorithms engine is not loaded.');
 const ranked=rows.length?algorithm.rankAlternatives(rows.map(r=>({id:r.id,values:{riskAdjustedProfit:r.riskAdjustedProfit,expectedRoi:r.roiPct,confidence:r.confidence*100,strategy:r.strategicScore}})),[
  {id:'riskAdjustedProfit',weight:.45,direction:'max'},
  {id:'expectedRoi',weight:.25,direction:'max'},
  {id:'confidence',weight:.15,direction:'max'},
  {id:'strategy',weight:.15,direction:'max'}
 ]).ranked:[];
 const unitProjects=rows.map(r=>({id:r.id,cost:Math.max(1,Math.ceil(r.budget/unit)),value:Math.max(0,Math.round((r.riskAdjustedProfit+Math.max(0,r.budget*(r.strategicScore===88?.015:0)))/unit))}));
 const optimized=algorithm.optimizeBudget(unitProjects,budgetUnits);
 const byId=new Map(rows.map(r=>[r.id,r]));
 const selected=optimized.selected.map(x=>byId.get(x.id)).filter(Boolean);
 const rankedRows=ranked.map(r=>({...byId.get(r.id),rank:r.rank,score:r.score,scoreBreakdown:r.breakdown}));
 return{
  version:VERSION,algorithmVersion:algorithm.version,date:active.date,currency:String(active.company.currency||'USD'),
  companyCash:cash,fundingPct:pct,fundingEnvelope:envelope,unit,unitLabel:unit.toLocaleString()+' '+String(active.company.currency||'USD'),
  budgetUnits,ranked:rankedRows,selected,
  optimization:{method:optimized.method,budget:optimized.budget,spent:optimized.spent,remaining:optimized.remaining,totalValue:optimized.totalValue,selectedIds:selected.map(x=>x.id),rejected:optimized.rejected},
  assumptions:{historicalComparables:'Median realized project performance, matched by format and genre where available; otherwise by format, then genre.',noComparable:'Format-based baseline gross multiple with 42.5% net studio receipts, 15% marketing allowance and 3% delivery allowance.',risk:'Transparent planning haircut for missing comparables, early development stage, budget concentration and market competition.',budgetUnit:'Costs are rounded up to the displayed currency unit so the selected slate never exceeds the funding envelope.',advisoryOnly:true}
 };
}
function savePlan(fundingPct=65){
 const report=analyze(fundingPct),ids=report.selected.map(p=>p.id);
 active.productionPortfolio={
  version:VERSION,algorithmVersion:report.algorithmVersion,created:active.date,status:'Advisory only',
  fundingPct:report.fundingPct,companyCashAtSave:report.companyCash,fundingEnvelope:report.fundingEnvelope,
  currency:report.currency,selectedProjectIds:ids,
  selectedProjects:report.selected.map(p=>({id:p.id,title:p.title,budget:p.budget,riskAdjustedProfit:p.riskAdjustedProfit,roiPct:p.roiPct,confidence:p.confidence,greenlitAtSave:!!active.projects.find(x=>x.id===p.id)?.greenlit})),
  optimization:report.optimization,assumptions:report.assumptions
 };
 if(typeof persist==='function')persist();
 return active.productionPortfolio;
}
function audit(){
 const a=ensureActive(),p=a.productionPortfolio,tests=[];
 const add=(name,ok)=>tests.push({name,ok:!!ok});
 add('Optimizer uses the current algorithm API',!!root.StudioAlgorithms&&root.StudioAlgorithms.version=== '1.0.0');
 add('Portfolio advisory record is structurally valid',!p||(p.status==='Advisory only'&&Array.isArray(p.selectedProjectIds)&&Array.isArray(p.selectedProjects)));
 add('Saved portfolio references existing projects',!p||p.selectedProjectIds.every(id=>a.projects.some(x=>x.id===id)));
 add('Saved portfolio does not greenlight projects automatically',!p||p.selectedProjects.every(x=>x.greenlitAtSave===false));
 add('Saved portfolio envelope is within saved company cash',!p||p.fundingEnvelope<=p.companyCashAtSave);
 return{passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(n,currency){return new Intl.NumberFormat(undefined,{maximumFractionDigits:0}).format(num(n))+' '+currency}
function render(fundingPct=65){
 if(typeof document==='undefined')return;
 const page=document.getElementById('page-projects');if(!page)return;
 let host=document.getElementById('production-portfolio-optimizer');
 if(!host){host=document.createElement('section');host.id='production-portfolio-optimizer';host.className='card';host.style.marginTop='14px';const anchor=document.getElementById('phase5-development')||document.getElementById('projectlist');(anchor?.parentElement||page).appendChild(host);}
 if(typeof active==='undefined'||!active){host.innerHTML='<div class="empty">Create a campaign to optimize its production slate.</div>';return}
 const cash=money(active.company?.cash),currency=esc(active.company?.currency||'USD'),plan=active.productionPortfolio;
 let report=null,error='';
 try{report=analyze(fundingPct)}catch(e){error=e.message}
 const ranked=report?.ranked||[],selected=report?.selected||[];
 const rankingHtml=ranked.length?ranked.slice(0,5).map(r=>'<div class="rowitem" style="gap:12px"><span style="min-width:0"><b>'+esc(r.title)+'</b><div class="tiny">'+esc(r.format)+' · '+esc(r.genre)+' · '+esc(r.stageName)+' · Rank #'+r.rank+'</div><div class="tiny">Risk-adjusted scenario '+fmt(r.riskAdjustedProfit,currency)+' · ROI '+r.roiPct.toFixed(1)+'% · Confidence '+Math.round(r.confidence*100)+'%</div></span><span class="tag">'+r.score.toFixed(3)+'</span></div>').join(''):'<div class="empty">No eligible projects awaiting greenlight. Create a project or move an existing project into Development.</div>';
 const slateHtml=selected.length?selected.map(p=>'<div class="rowitem"><span><b>'+esc(p.title)+'</b><div class="tiny">'+fmt(p.budget,currency)+' · '+p.roiPct.toFixed(1)+'% scenario ROI</div></span><span class="tag green">Selected</span></div>').join(''):'<div class="empty">No positive-value project combination fits the current funding envelope.</div>';
 host.innerHTML='<div class="cardhead"><b class="cardtitle">Production portfolio optimizer</b><span class="tag gold">ADVISORY</span></div>'+
 '<p class="hint">Ranks ungreenlit Concept and Development projects, then selects the strongest risk-adjusted slate that fits the funding envelope. It never approves a project or spends cash.</p>'+
 '<div class="formgrid"><div class="field"><label>Company cash</label><b>'+fmt(cash,currency)+'</b></div><div class="field"><label>Funding envelope</label><b>'+fmt(report?.fundingEnvelope||0,currency)+'</b></div><div class="field"><label>Allocation of cash</label><div class="rowitem"><input id="pp-funding" type="range" min="10" max="90" step="5" value="'+fundingPct+'" style="flex:1"><b id="pp-funding-label">'+fundingPct+'%</b></div></div></div>'+
 (error?'<div class="empty">'+esc(error)+'</div>':'')+
 '<h4 style="margin:14px 0 6px">Project ranking</h4>'+rankingHtml+
 '<h4 style="margin:14px 0 6px">Optimized slate</h4>'+slateHtml+
 '<div class="rowitem" style="margin-top:10px"><span class="tiny">Selected budget '+fmt(report?.optimization.spent*(report?.unit||1)||0,currency)+' of '+fmt(report?.fundingEnvelope||0,currency)+'</span><button class="btn primary" id="pp-save" '+(!selected.length?'disabled':'')+'>Save advisory slate</button></div>'+
 (plan?'<div class="tiny" style="margin-top:8px">Last saved: '+esc(plan.created)+' · '+plan.selectedProjectIds.length+' projects · '+esc(plan.status)+'</div>':'')+
 '<details style="margin-top:10px"><summary class="tiny">Model assumptions and limitations</summary><p class="tiny">Historical comparables use realized studio receipts and profit. Projects without comparable releases use format baselines. Risk-adjusted values are scenario estimates, not guaranteed forecasts. Currency costs are rounded up for budget selection.</p></details>';
 const slider=host.querySelector('#pp-funding'),label=host.querySelector('#pp-funding-label');
 if(slider&&label){slider.oninput=()=>render(Number(slider.value));}
 const save=host.querySelector('#pp-save');if(save)save.onclick=()=>{try{const pct=Number(host.querySelector('#pp-funding')?.value||fundingPct),saved=savePlan(pct);render(pct);if(typeof toast==='function')toast('Advisory slate saved. No projects were funded or greenlit.');}catch(e){if(typeof toast==='function')toast(e.message);}};
}
function install(){
 if(typeof document==='undefined')return;
 const old=root.renderProjects;
 if(typeof old==='function'&&!old.__portfolioOptimizerWrapped){const wrapped=function(){old.apply(this,arguments);render()};wrapped.__portfolioOptimizerWrapped=true;root.renderProjects=wrapped;}
 render();
}
const api=Object.freeze({version:VERSION,analyze,savePlan,audit,render});
root.ProductionPortfolioOptimizer=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();}
})(typeof window!=='undefined'?window:globalThis);
