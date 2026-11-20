(function(root){
'use strict';
const VERSION='1.0.0',MAX_CANDIDATES=20;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const money=v=>Math.max(0,num(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,c)=>new Intl.NumberFormat(undefined,{maximumFractionDigits:0}).format(num(v))+' '+c;
function context(){
 if(!root.Phase11Technology)throw Error('Phase 11 technology engine is not loaded.');
 const s=root.Phase11Technology.ensure();
 if(!s||typeof active==='undefined'||!active)throw Error('Create or load a campaign before planning research investment.');
 if(!active.company)throw Error('Company financial state is unavailable.');
 const catalog=root.Phase11Technology.technologyCatalog||[];
 return{state:s,catalog,byId:new Map(catalog.map(t=>[t.id,t]))};
}
function analyze(fundingPct=40){
 const {state,catalog,byId}=context(),pct=num(fundingPct,NaN);
 if(!Number.isFinite(pct)||pct<10||pct>80)throw Error('Research allocation must be between 10% and 80% of company cash.');
 const cash=money(active.company.cash),envelope=Math.floor(cash*pct/100),currency=String(active.company.currency||'USD');
 const running=state.researchProjects.filter(p=>p.status==='Active'),slots=Math.max(0,Math.floor(num(state.lab.capacity,1))-running.length);
 const available=state.technologies.filter(x=>x.status==='Available').map(x=>byId.get(x.id)).filter(Boolean);
 const locked=state.technologies.filter(x=>x.status==='Locked').map(x=>{const t=byId.get(x.id);return t?{id:t.id,name:t.name,requires:t.requires.map(id=>byId.get(id)?.name||id)}:null}).filter(Boolean);
 if(available.length>MAX_CANDIDATES)throw Error('Research catalog exceeds the exact optimizer limit of '+MAX_CANDIDATES+' available technologies.');
 const activeCategories=new Set(running.map(p=>byId.get(p.technologyId)?.category).filter(Boolean));
 const rows=available.map(t=>{
  const risk=clamp((t.tier===1?.08:.18)+(cash>0&&t.cost/cash>.25?.12:cash>0&&t.cost/cash>.15?.06:0),.05,.65);
  const confidence=1-risk,efficiency=t.impact/Math.max(1,t.cost)*1000000;
  const strategicScore=activeCategories.has(t.category)?42:86;
  return{id:t.id,name:t.name,category:t.category,tier:t.tier,cost:t.cost,days:t.days,impact:t.impact,requires:[...(t.requires||[])],risk,confidence,efficiency,strategicScore};
 });
 const ranked=rows.length?root.StudioAlgorithms.rankAlternatives(rows.map(t=>({id:t.id,values:{impact:t.impact,efficiency:t.efficiency,duration:t.days,confidence:t.confidence*100,strategy:t.strategicScore}})),[
  {id:'impact',weight:.35,direction:'max'},
  {id:'efficiency',weight:.25,direction:'max'},
  {id:'duration',weight:.15,direction:'min'},
  {id:'confidence',weight:.15,direction:'max'},
  {id:'strategy',weight:.10,direction:'max'}
 ]).ranked:[];
 const rankById=new Map(ranked.map(r=>[r.id,r]));
 const options=rows.map(t=>({...t,rank:rankById.get(t.id)?.rank||null,score:rankById.get(t.id)?.score||0,breakdown:rankById.get(t.id)?.breakdown||{}}));
 let best={value:0,spent:0,ids:[],count:0};
 const n=options.length,limit=1<<n;
 for(let mask=1;mask<limit;mask++){
  let count=0,spent=0,value=0,ids=[],categories=new Set();
  for(let i=0;i<n;i++)if(mask&(1<<i)){
   const t=options[i];count++;spent+=t.cost;value+=Math.round(t.score*1000000);ids.push(t.id);categories.add(t.category);
  }
  if(count>slots||spent>envelope)continue;
  value+=Math.max(0,categories.size-1)*80000;
  ids.sort();
  const tie=ids.join('|'),bestTie=best.ids.join('|');
  if(value>best.value||(value===best.value&&(spent<best.spent||(spent===best.spent&&tie<bestTie))))best={value,spent,ids,count};
 }
 const byIdRow=new Map(options.map(t=>[t.id,t]));
 const selected=best.ids.map(id=>byIdRow.get(id)).filter(Boolean);
 return{
  version:VERSION,algorithmVersion:root.StudioAlgorithms?.version||null,date:active.date,currency,companyCash:cash,
  fundingPct:pct,fundingEnvelope:envelope,labLevel:num(state.lab.level,1),labCapacity:num(state.lab.capacity,1),
  activeResearch:running.length,freeLabSlots:slots,availableCount:available.length,ranked:options.map(t=>({...t,rank:rankById.get(t.id)?.rank||null,score:rankById.get(t.id)?.score||0})).sort((a,b)=>a.rank-b.rank),
  locked,selected,totalSelectedCost:best.spent,unusedBudget:Math.max(0,envelope-best.spent),
  objectiveValue:best.value,method:'exact-capacity-and-budget-subset-search',
  assumptions:{onlyCurrentlyAvailable:'Locked technologies are not funded until every prerequisite is researched.',capacity:'The plan cannot exceed unoccupied laboratory slots; active research already consumes capacity.',budget:'Baseline catalog budgets are charged at project start. The selected total cannot exceed the funding envelope.',advisoryOnly:true}
 };
}
function savePlan(fundingPct=40){
 const r=analyze(fundingPct),s=context().state;
 s.researchPortfolio={version:VERSION,algorithmVersion:r.algorithmVersion,created:active.date,status:'Advisory only',fundingPct:r.fundingPct,companyCashAtSave:r.companyCash,fundingEnvelope:r.fundingEnvelope,currency:r.currency,labCapacity:r.labCapacity,activeResearch:r.activeResearch,selectedTechnologyIds:r.selected.map(t=>t.id),selectedTechnologies:r.selected.map(t=>({id:t.id,name:t.name,cost:t.cost,days:t.days,impact:t.impact})),totalSelectedCost:r.totalSelectedCost,lockedCount:r.locked.length,startedAtSave:false};
 if(typeof persist==='function')persist();
 return s.researchPortfolio;
}
function startSelected(fundingPct=40){
 const r=analyze(fundingPct),{state,byId}=context();
 if(!r.selected.length)throw Error('No research portfolio fits the available cash and laboratory capacity.');
 const total=r.selected.reduce((sum,t)=>sum+t.cost,0);
 if(money(active.company.cash)<total)throw Error('Company cash changed; the selected research portfolio is no longer affordable.');
 if(r.selected.length>r.freeLabSlots)throw Error('Laboratory capacity changed; the selected portfolio no longer fits.');
 for(const t of r.selected){
  const current=state.technologies.find(x=>x.id===t.id);
  if(!current||current.status!=='Available')throw Error(t.name+' is no longer available; recalculate the portfolio.');
  if(!t.requires.every(id=>state.technologies.some(x=>x.id===id&&x.status==='Researched')))throw Error(t.name+' has unmet research prerequisites.');
  if(!byId.has(t.id))throw Error('Technology catalog changed; recalculate the portfolio.');
 }
 const started=[];
 for(const t of r.selected)started.push(root.Phase11Technology.startResearch(t.id,t.cost));
 return started;
}
function audit(){
 const {state}=context(),p=state.researchPortfolio,tests=[];
 const add=(name,ok)=>tests.push({name,ok:!!ok});
 add('Research optimizer has the required algorithm engine',!!root.StudioAlgorithms&&typeof root.StudioAlgorithms.rankAlternatives==='function');
 add('Research state exposes a valid laboratory capacity',Number.isFinite(num(state.lab.capacity,NaN))&&num(state.lab.capacity)>=1);
 add('Saved advisory portfolio has valid structure',!p||(p.status==='Advisory only'&&Array.isArray(p.selectedTechnologyIds)&&Array.isArray(p.selectedTechnologies)));
 add('Saved portfolio references catalog technologies',!p||p.selectedTechnologyIds.every(id=>state.technologies.some(x=>x.id===id)));
 add('Saved portfolio fits its original lab capacity',!p||p.selectedTechnologyIds.length<=Math.max(0,p.labCapacity-p.activeResearch));
 add('Saved portfolio fits its original cash envelope',!p||p.totalSelectedCost<=p.fundingEnvelope);
 add('Saving an advisory plan does not start research',!p||p.selectedTechnologyIds.every(id=>!state.researchProjects.some(x=>x.technologyId===id&&x.startDate===p.created)));
 return{passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};
}
function render(fundingPct=40){
 if(typeof document==='undefined')return;
 const page=document.getElementById('page-technology'),content=document.getElementById('technology-content');
 if(!page||!content||!page.classList.contains('active'))return;
 let host=document.getElementById('research-portfolio-optimizer');
 if(!host){host=document.createElement('section');host.id='research-portfolio-optimizer';host.className='card';host.style.marginTop='14px';content.appendChild(host);}
 if(typeof active==='undefined'||!active){host.innerHTML='<div class="empty">Create a campaign to plan research investment.</div>';return}
 let report,error='';try{report=analyze(fundingPct)}catch(e){error=e.message}
 const currency=esc(report?.currency||active.company?.currency||'USD');
 const ranking=report?.ranked?.length?report.ranked.slice(0,5).map(t=>'<div class="rowitem"><span style="min-width:0"><b>'+esc(t.name)+'</b><div class="tiny">'+esc(t.category)+' · Impact '+t.impact+' · '+t.days+' days · '+fmt(t.cost,currency)+'</div></span><span class="tag">#'+t.rank+' · '+t.score.toFixed(3)+'</span></div>').join(''):'<div class="empty">No currently available technologies to rank.</div>';
 const selected=report?.selected?.length?report.selected.map(t=>'<div class="rowitem"><span><b>'+esc(t.name)+'</b><div class="tiny">'+fmt(t.cost,currency)+' · '+t.days+' research days · '+t.impact+' impact</div></span><span class="tag green">Selected</span></div>').join(''):'<div class="empty">No portfolio fits the current cash envelope and free laboratory slots.</div>';
 const locked=report?.locked?.length?report.locked.map(t=>'<div class="tiny" style="padding:5px 0"><b>'+esc(t.name)+'</b> — requires '+esc(t.requires.join(', ')||'no prerequisites')+'</div>').join(''):'<div class="tiny">No locked technologies.</div>';
 const plan=active.technology?.researchPortfolio;
 host.innerHTML='<div class="cardhead"><b class="cardtitle">Research investment optimizer</b><span class="tag gold">ADVISORY</span></div>'+
 '<p class="hint">Selects a research batch using expected impact, cost efficiency, duration and category coverage, while respecting available lab slots and prerequisite gates. It does not start research until you approve it.</p>'+
 '<div class="formgrid"><div class="field"><label>Company cash</label><b>'+fmt(report?.companyCash||0,currency)+'</b></div><div class="field"><label>Research budget envelope</label><b>'+fmt(report?.fundingEnvelope||0,currency)+'</b></div><div class="field"><label>Free lab slots</label><b>'+(report?.freeLabSlots||0)+' / '+(report?.labCapacity||0)+'</b></div></div>'+
 '<div class="field" style="margin-top:10px"><label>Allocate company cash to research</label><div class="rowitem"><input id="rp-funding" type="range" min="10" max="80" step="5" value="'+fundingPct+'" style="flex:1"><b id="rp-funding-label">'+fundingPct+'%</b></div></div>'+
 (error?'<div class="empty">'+esc(error)+'</div>':'')+
 '<h4 style="margin:14px 0 6px">Ranked available technologies</h4>'+ranking+
 '<h4 style="margin:14px 0 6px">Optimized research batch</h4>'+selected+
 '<div class="rowitem" style="margin-top:10px"><span class="tiny">Selected '+fmt(report?.totalSelectedCost||0,currency)+' · unused envelope '+fmt(report?.unusedBudget||0,currency)+'</span><span><button class="btn" id="rp-save" '+(!report?.selected?.length?'disabled':'')+'>Save advisory plan</button> <button class="btn primary" id="rp-start" '+(!report?.selected?.length?'disabled':'')+'>Start selected research</button></span></div>'+
 '<details style="margin-top:10px"><summary class="tiny">Locked technologies and prerequisites</summary>'+locked+'</details>'+
 (plan?'<div class="tiny" style="margin-top:8px">Last advisory plan: '+esc(plan.created)+' · '+plan.selectedTechnologyIds.length+' selected · '+esc(plan.status)+'</div>':'')+
 '<p class="tiny" style="margin-top:8px">The optimizer plans only technologies already unlocked by completed prerequisites. Running projects consume lab capacity. Starting a batch charges its baseline R&D budgets immediately.</p>';
 const slider=host.querySelector('#rp-funding');if(slider)slider.oninput=()=>render(Number(slider.value));
 const save=host.querySelector('#rp-save');if(save)save.onclick=()=>{try{savePlan(Number(slider?.value||fundingPct));render(Number(slider?.value||fundingPct));if(typeof toast==='function')toast('Research advisory plan saved. No research was started.')}catch(e){if(typeof toast==='function')toast(e.message)}};
 const start=host.querySelector('#rp-start');if(start)start.onclick=()=>{try{const pct=Number(slider?.value||fundingPct),preview=analyze(pct),total=preview.totalSelectedCost,names=preview.selected.map(t=>t.name).join(', ');if(typeof confirm==='function'&&!confirm('Start '+preview.selected.length+' research project(s): '+names+'?\\nTotal R&D charge: '+fmt(total,currency)+'. This will spend company cash and occupy laboratory capacity.'))return;const started=startSelected(pct);if(typeof toast==='function')toast('Started '+started.length+' research project(s). R&D spending posted.');render(pct)}catch(e){if(typeof toast==='function')toast(e.message)}};
}
function install(){
 const api=root.Phase11Technology;if(!api)return;
 if(typeof api.render==='function'&&!api.render.__researchPortfolioWrapped){const oldApiRender=api.render;const wrappedApi=function(...args){const result=oldApiRender.apply(this,args);render();return result};wrappedApi.__researchPortfolioWrapped=true;api.render=wrappedApi;}
 if(typeof root.render==='function'&&!root.render.__researchPortfolioRenderWrapped){const oldPageRender=root.render;const wrappedPage=function(...args){const result=oldPageRender.apply(this,args);render();return result};wrappedPage.__researchPortfolioRenderWrapped=true;root.render=wrappedPage;}
 if(typeof root.nav==='function'&&!root.nav.__researchPortfolioNavWrapped){const oldNav=root.nav;const wrappedNav=function(...args){const result=oldNav.apply(this,args);render();return result};wrappedNav.__researchPortfolioNavWrapped=true;root.nav=wrappedNav;}
 if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();}
}
const api=Object.freeze({version:VERSION,analyze,savePlan,startSelected,audit,render});
root.Phase11ResearchPortfolio=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();}
})(typeof window!=='undefined'?window:globalThis);
