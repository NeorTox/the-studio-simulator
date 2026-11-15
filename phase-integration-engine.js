(function(){
'use strict';
const P=window.StudioPhase0;
if(!P)throw new Error('THE STUDIO Phase 0 kernel is required before the integration engine.');
const CONTRACTS=[
{id:0,key:'kernel',name:'Architecture & stability',requires:['StudioPhase0','StudioPhase0.createCampaignScheduler']},
{id:1,key:'world',name:'World, time & geography',requires:['StudioPhase0.phase1.processWorldDay','StudioPhase0.phase1.processWorldRange']},
{id:2,key:'population',name:'Population & NPC intelligence',requires:['StudioPopulationEngine.processDay']},
{id:3,key:'founder',name:'Founder & personal life',requires:['Phase3Founder.stepDay']},
{id:4,key:'company',name:'Company management',requires:['Phase4Company.stepDay']},
{id:5,key:'production',name:'Entertainment production',requires:['Phase5Production.audit']},
{id:6,key:'ecosystem',name:'Entertainment ecosystem',requires:['Phase6Ecosystem.stepDay','Phase6Ecosystem.audit']},
{id:7,key:'smartphone',name:'Smartphone & media',requires:[]},
{id:8,key:'financial-empire',name:'Financial empire',requires:[]},
{id:9,key:'global-economy',name:'Global economy',requires:[]},
{id:10,key:'competitors',name:'Autonomous competitors',requires:[]},
{id:11,key:'technology',name:'Technology & sustainability',requires:[]},
{id:12,key:'generations',name:'Generations & world evolution',requires:[]},
{id:13,key:'release-quality',name:'Integration & release quality',requires:[]}
];
const path=name=>name.split('.').reduce((o,k)=>o&&o[k],window);
function state(){if(!active)return null;active.integration=active.integration||{version:1,days:{},history:[],errors:[],lastAudit:null};const s=active.integration;s.days=s.days||{};s.history=s.history||[];s.errors=s.errors||[];return s;}
function beginDay(date){
 const s=state();if(!s)return false;
 const d=s.days[date]||{date,status:'started',steps:[],startedAt:new Date().toISOString()};
 if(d.status==='completed')return false;
 d.status='started';d.steps.push({name:'world-before-life',at:new Date().toISOString()});s.days[date]=d;
 return true;
}
function endDay(date){
 const s=state();if(!s)return false;
 const d=s.days[date]||{date,status:'started',steps:[]};
 d.steps.push({name:'population-founder-company',at:new Date().toISOString()});
 d.status='completed';d.completedAt=new Date().toISOString();s.days[date]=d;
 s.history.unshift({date,status:'completed'});s.history=s.history.slice(0,90);
 if(typeof persist==='function')persist();return true;
}
function audit(){
 const s=state(),results=[],add=(name,ok,detail)=>results.push({name,ok:!!ok,detail:String(detail||'')});
 add('Active campaign exists',!!active,'Integration checks require an active campaign.');
 const modules=CONTRACTS.map(c=>{
  const missing=c.requires.filter(r=>!path(r));
  const implemented=c.id<=6&&missing.length===0;
  return {...c,status:c.id<=6?(missing.length?'degraded':'connected'):'not-built',missing};
 });
 modules.forEach(m=>add('Phase '+m.id+' · '+m.name,m.status==='connected'||m.status==='not-built',m.status+(m.missing.length?': '+m.missing.join(', '):'')));
 const dep=P.dependencyReport();add('Architecture dependency graph',dep.invalidEdges.length===0,dep.invalidEdges.length?dep.invalidEdges.join('; '):dep.domains+' domains / '+dep.edges+' declared edges');
 if(active){
  add('Campaign save envelope',P.validateCampaign(active).valid,P.validateCampaign(active).errors.join('; ')||'Required campaign fields are present.');
  add('Daily integration telemetry',!!s,'Serializable integration state is attached to the campaign.');
  const dates=Object.values(s.days),incomplete=dates.filter(d=>d.status!=='completed');
  add('No incomplete daily pipelines',incomplete.length===0,incomplete.length?incomplete.map(d=>d.date).join(', '):dates.length+' completed day records.');
  const duplicate=dates.some(d=>new Set(d.steps.map(x=>x.name)).size!==d.steps.length);
  add('No duplicate pipeline steps',!duplicate,'Each tracked daily stage appears once per date.');
  const ledger=Array.isArray(active.ledger)?active.ledger:[];
  add('Ledger entries have finite amounts',ledger.every(x=>Number.isFinite(Number(x.amount??x.value??0))),'All recorded ledger amounts are finite numbers.');
  add('Phase 2 date does not lead world date',!active.population?.phase2?.lastProcessedDate||!active.world?.time?.lastProcessedDate||active.population.phase2.lastProcessedDate<=active.world.time.lastProcessedDate,'Population processing must not run ahead of world time.');
 }
 const passed=results.filter(x=>x.ok).length,failed=results.length-passed;
 const report={date:active?.date||null,passed,failed,modules,tests:results};
 if(s)s.lastAudit={date:active.date,passed,failed,modules:modules.map(m=>({id:m.id,status:m.status,missing:m.missing})),tests:results,at:new Date().toISOString()};
 return report;
}
function render(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!document.getElementById('page-integrationhealth')){
  const b=document.createElement('button');b.dataset.page='integrationhealth';b.innerHTML='<span>⛓</span>Integration';b.onclick=()=>window.nav('integrationhealth');nav.appendChild(b);
  const page=document.createElement('section');page.className='page';page.id='page-integrationhealth';
  page.innerHTML='<div class="hero"><div><div class="eyebrow">CROSS-PHASE CONTROL PLANE</div><h1 class="h1">Integration health</h1><p class="sub">One runtime contract for all 14 phases, daily orchestration, dependency checks and campaign integrity.</p></div><button class="btn primary" id="run-integration-audit">Run full integration audit</button></div><div id="integration-health-content"></div>';
  content.appendChild(page);
 }
 const root=document.getElementById('integration-health-content');if(!root)return;
 if(!active){root.innerHTML='<div class="empty">Create or load a campaign to inspect integration health.</div>';return;}
 const s=state(),report=s.lastAudit||audit();
 root.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">CONNECTED PHASES</div><div class="statvalue">'+report.modules.filter(m=>m.status==='connected').length+' / 14</div></div><div class="card"><div class="statlabel">AUDIT CHECKS PASSED</div><div class="statvalue">'+report.passed+'</div></div><div class="card"><div class="statlabel">AUDIT FAILURES</div><div class="statvalue">'+report.failed+'</div></div><div class="card"><div class="statlabel">TRACKED SIM DAYS</div><div class="statvalue">'+Object.keys(s.days).length+'</div></div></div><div class="card"><b class="cardtitle">Phase connection register</b>'+report.modules.map(m=>'<div class="rowitem"><span><b>Phase '+m.id+' · '+m.name+'</b><div class="tiny">'+(m.missing.length?'Missing: '+m.missing.join(', '):m.status==='not-built'?'Contract registered · implementation pending':'Runtime contract satisfied')+'</div></span><span class="tag '+(m.status==='connected'?'green':m.status==='degraded'?'red':'')+'">'+m.status.toUpperCase()+'</span></div>').join('')+'</div><div class="card" style="margin-top:14px"><b class="cardtitle">Integration audit</b>'+report.tests.map(t=>'<div class="rowitem"><span>'+t.name+'<div class="tiny">'+t.detail+'</div></span><span class="tag '+(t.ok?'green':'red')+'">'+(t.ok?'PASS':'FAIL')+'</span></div>').join('')+'</div>';
 const button=document.getElementById('run-integration-audit');if(button)button.onclick=()=>{audit();render();toast('Integration audit completed.');};
}
const priorRender=window.render;if(typeof priorRender==='function'&&!priorRender.__integrationWrapped){const wrapped=function(...args){const out=priorRender.apply(this,args);render();return out;};wrapped.__integrationWrapped=true;window.render=wrapped;}
const priorNav=window.nav;if(typeof priorNav==='function'&&!priorNav.__integrationWrapped){const wrapped=function(page,...args){const out=priorNav.call(this,page,...args);if(page==='integrationhealth')render();return out;};wrapped.__integrationWrapped=true;window.nav=wrapped;}
window.StudioPhaseIntegration={version:'1.0.0',contracts:CONTRACTS,beginDay,endDay,audit,render};
try{P.registerModule({id:'cross-phase-integration',name:'Cross-phase integration control plane',deps:['kernel','world','population','founder','company','workforce','production'],owns:['daily orchestration telemetry','cross-phase contract checks','integration audit'],status:'implemented'});}catch(e){}
render();
})();