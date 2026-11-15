(function(){
'use strict';
const P=window.StudioPhase0;
if(!P)throw new Error('THE STUDIO Phase 0 kernel is required before the integration engine.');
const CONTRACTS=[
{id:0,key:'kernel',name:'Architecture & stability',requires:['StudioPhase0','StudioPhase0.createCampaignScheduler']},
{id:1,key:'world',name:'World, time & geography',requires:['StudioPhase0.phase1.processWorldDay','StudioPhase0.phase1.processWorldRange']},
{id:2,key:'population',name:'Population & NPC intelligence',requires:['StudioPopulationEngine.processDay','StudioHouseholdEconomics.prepareMonth','StudioHouseholdEconomics.processIndividualMonth','StudioHouseholdEconomics.finalizeMonth','StudioHouseholdEconomics.audit']},
{id:3,key:'founder',name:'Founder & personal life',requires:['Phase3Founder.stepDay']},
{id:4,key:'company',name:'Company management',requires:['Phase4Company.stepDay']},
{id:5,key:'production',name:'Entertainment production',requires:['Phase5Production.audit']},
{id:6,key:'ecosystem',name:'Entertainment ecosystem',requires:['Phase6Ecosystem.stepDay','Phase6Ecosystem.audit','Phase6Audience.addFandom','Phase6Audience.publishReview','Phase6Audience.processDay','Phase6Audience.audit','simulateMediaMonth','renderMedia','awardCatalog','submitForAward','processAwards','renderAwards']},
{id:7,key:'smartphone',name:'Smartphone & media',requires:['Phase7Smartphone.processDay','Phase7Smartphone.audit','Phase7Smartphone.installApp','Phase7Smartphone.publishPost']},
{id:8,key:'financial-empire',name:'Financial empire',requires:['Phase8FinancialEmpire.stepDay','Phase8FinancialEmpire.audit','Phase8FinancialEmpire.createFund','Phase8FinancialEmpire.buyAsset','Phase8FinancialEmpire.sellAsset']},
{id:9,key:'global-economy',name:'Global economy',requires:['Phase9GlobalEconomy.stepDay','Phase9GlobalEconomy.audit','Phase9GlobalEconomy.setPolicy','Phase9GlobalEconomy.createAgreement']},
{id:10,key:'competitors',name:'Autonomous competitors',requires:['Phase10Competitors.stepDay','Phase10Competitors.audit','Phase10Competitors.setStrategy']},
{id:11,key:'technology',name:'Technology & sustainability',requires:['Phase11Technology.stepDay','Phase11Technology.audit','Phase11Technology.startResearch','Phase11Technology.startInitiative','Phase11Technology.licensePatent']},
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
 const ecosystem=active.ecosystem;
 if(!ecosystem||ecosystem.lastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 6 ecosystem did not commit.');
 if(ecosystem.audienceLastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 6 audience model did not commit.');
 const smartphone=active.smartphone;if(!smartphone||smartphone.lastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 7 smartphone processor did not commit.');
 const financial=window.Phase8FinancialEmpire?.ensure?.();if(!financial||financial.lastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 8 financial empire processor did not commit.');
 const globalEconomy=window.Phase9GlobalEconomy?.ensure?.();if(!globalEconomy||globalEconomy.lastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 9 global economy processor did not commit.');
 const competitors=window.Phase10Competitors?.ensure?.();if(!competitors||competitors.lastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 10 autonomous competitor processor did not commit.');
 const technology=window.Phase11Technology?.ensure?.();if(!technology||technology.lastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 11 technology and sustainability processor did not commit.');
 d.steps.push({name:'population-founder-company',at:new Date().toISOString()});
 d.steps.push({name:'phase6-ecosystem',at:new Date().toISOString()});
 d.steps.push({name:'phase6-audience',at:new Date().toISOString()});
 d.steps.push({name:'phase7-smartphone',at:new Date().toISOString()});
 d.steps.push({name:'phase8-financial-empire',at:new Date().toISOString()});
 d.steps.push({name:'phase9-global-economy',at:new Date().toISOString()});
 d.steps.push({name:'phase10-competitors',at:new Date().toISOString()});
 d.steps.push({name:'phase11-technology-sustainability',at:new Date().toISOString()});
 if(active.world?.travel)d.steps.push({name:'global-travel',at:new Date().toISOString()});
 d.status='completed';d.completedAt=new Date().toISOString();s.days[date]=d;
 s.history.unshift({date,status:'completed',phases:['world','population','founder','company','ecosystem','audience','smartphone','financial-empire','global-economy','competitors','technology-sustainability','travel']});s.history=s.history.slice(0,90);
 if(typeof persist==='function'&&!window.__deferDailyPersist)persist();return true;
}
function audit(){
 const s=state(),results=[],add=(name,ok,detail)=>results.push({name,ok:!!ok,detail:String(detail||'')});
 add('Active campaign exists',!!active,'Integration checks require an active campaign.');
 const modules=CONTRACTS.map(c=>{
  const missing=c.requires.filter(r=>!path(r));
  const implemented=c.id<=11&&missing.length===0;
  return {...c,status:c.id<=11?(missing.length?'degraded':'connected'):'not-built',missing};
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
  const required=['world-before-life','population-founder-company','phase6-ecosystem','phase6-audience','phase7-smartphone','phase8-financial-empire','phase9-global-economy','phase10-competitors','phase11-technology-sustainability'];
  const incompletePhase6=dates.filter(d=>d.status==='completed'&&required.some(step=>!d.steps.some(x=>x.name===step)));
  add('All required daily pipeline stages are present',incompletePhase6.length===0,incompletePhase6.length?incompletePhase6.map(d=>d.date).join(', '):dates.length+' tracked days include all required world, company, ecosystem, smartphone, finance, economy and competitor stages.');
  add('Phase 7 is part of every completed daily pipeline',dates.filter(d=>d.status==='completed'&&!d.steps.some(x=>x.name==='phase7-smartphone')).length===0,'Every completed day includes smartphone and digital-media processing.');
  add('Phase 8 is part of every completed daily pipeline',dates.filter(d=>d.status==='completed'&&!d.steps.some(x=>x.name==='phase8-financial-empire')).length===0,'Every completed day includes financial-empire valuation and income processing.');
  const p9Start=active.market?.globalEconomy?.firstIntegratedDate||'9999-12-31';const p9Days=dates.filter(d=>d.status==='completed'&&d.date>=p9Start);
  add('Phase 9 is part of every completed daily pipeline',p9Days.every(d=>d.steps.some(x=>x.name==='phase9-global-economy')),p9Days.length+' Phase 9-enabled daily pipelines include global economy processing.');
  const p9=window.Phase9GlobalEconomy?.audit?.();add('Phase 9 internal integrity audit',!!p9&&p9.failed===0,p9?(p9.passed+' passed / '+p9.failed+' failed'):'Phase 9 audit API unavailable.');
  const p10Start=active.competitors?.firstIntegratedDate||'9999-12-31';const p10Days=dates.filter(d=>d.status==='completed'&&d.date>=p10Start);
  add('Phase 10 is part of every completed daily pipeline',p10Days.every(d=>d.steps.some(x=>x.name==='phase10-competitors')),p10Days.length+' Phase 10-enabled daily pipelines include autonomous competitor processing.');
  const p10=window.Phase10Competitors?.audit?.();add('Phase 10 internal integrity audit',!!p10&&p10.failed===0,p10?(p10.passed+' passed / '+p10.failed+' failed'):'Phase 10 audit API unavailable.');
  add('Phase 10 daily checkpoint synchronized',p10Days.length===0||active.competitors?.lastProcessedDate===active.date,'Competitors '+String(active.competitors?.lastProcessedDate||'not run')+' · campaign '+active.date);
  const p11Start=active.technology?.firstIntegratedDate||'9999-12-31';const p11Days=dates.filter(d=>d.status==='completed'&&d.date>=p11Start);
  add('Phase 11 is part of every completed daily pipeline',p11Days.every(d=>d.steps.some(x=>x.name==='phase11-technology-sustainability')),p11Days.length+' Phase 11-enabled daily pipelines include technology and sustainability processing.');
  const p11=window.Phase11Technology?.audit?.();add('Phase 11 internal integrity audit',!!p11&&p11.failed===0,p11?(p11.passed+' passed / '+p11.failed+' failed'):'Phase 11 audit API unavailable.');
  add('Phase 11 daily checkpoint synchronized',p11Days.length===0||active.technology?.lastProcessedDate===active.date,'Technology '+String(active.technology?.lastProcessedDate||'not run')+' · campaign '+active.date);
  add('Phase 9 daily checkpoint synchronized',p9Days.length===0||active.market?.globalEconomy?.lastProcessedDate===active.date,'Global economy '+String(active.market?.globalEconomy?.lastProcessedDate||'not run')+' · campaign '+active.date);
  add('Global travel is part of every completed daily pipeline',dates.filter(d=>d.status==='completed'&&!d.steps.some(x=>x.name==='global-travel')).length===0,'Every completed day includes global mobility processing.');
  add('Global travel checkpoint is synchronized',dates.length===0||active.world?.travel?.lastProcessedDate===active.date,'Travel '+String(active.world?.travel?.lastProcessedDate||'not yet processed')+' · campaign '+active.date);
  const p7=window.Phase7Smartphone?.audit?.();add('Phase 7 internal integrity audit',!!p7&&p7.failed===0,p7?(p7.passed+' passed / '+p7.failed+' failed'):'Phase 7 audit API unavailable.');
  const media=active.market?.media,awards=active.awardSubmissions;
  add('Media simulation and presentation are available',!!media&&Array.isArray(media.outlets)&&Array.isArray(media.coverage)&&typeof window.simulateMediaMonth==='function'&&typeof window.renderMedia==='function','Media world, outlet and coverage state plus monthly simulation and UI are available.');
  add('Awards and festival processing are available',Array.isArray(awards)&&awards.every(a=>a.id&&a.projectId&&a.event&&['Pending','Won','Nominated','Not selected'].includes(a.status))&&typeof window.processAwards==='function'&&typeof window.submitForAward==='function','Award entries have valid states and deterministic result processing.');
  const p6=window.Phase6Ecosystem?.audit?.();
  add('Phase 6 internal integrity audit',!!p6&&p6.failed===0,p6?(p6.passed+' passed / '+p6.failed+' failed'): 'Phase 6 audit API unavailable.');
  const p6Date=active.ecosystem?.lastProcessedDate,audienceDate=active.ecosystem?.audienceLastProcessedDate;
  add('Phase 6 daily checkpoints synchronized',dates.length===0||(p6Date===active.date&&audienceDate===active.date),'Campaign '+active.date+' · ecosystem '+String(p6Date||'not run')+' · audience '+String(audienceDate||'not run'));
  const ledger=Array.isArray(active.ledger)?active.ledger:[];
  add('Ledger entries have finite amounts',ledger.every(x=>Number.isFinite(Number(x.amount??x.value??0))),'All recorded ledger amounts are finite numbers.');
  const household=window.StudioHouseholdEconomics?.audit?.();add('Household & consumer economics integrity',!!household&&household.failed===0,household?(household.passed+' passed / '+household.failed+' failed'):'Household economics audit API unavailable.');
  const householdDate=active.world?.householdEconomics?.lastProcessedDate;add('Household monthly checkpoint synchronized',active.date.slice(8,10)!=='01'||!active.world?.population?.phase2||active.world.population.phase2.lastProcessedDate!==active.date||householdDate===active.date,'Household month '+String(householdDate||'not yet processed')+' · campaign '+active.date);
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
 const s=state(),report=audit();
 root.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">CONNECTED PHASES</div><div class="statvalue">'+report.modules.filter(m=>m.status==='connected').length+' / 14</div></div><div class="card"><div class="statlabel">AUDIT CHECKS PASSED</div><div class="statvalue">'+report.passed+'</div></div><div class="card"><div class="statlabel">AUDIT FAILURES</div><div class="statvalue">'+report.failed+'</div></div><div class="card"><div class="statlabel">TRACKED SIM DAYS</div><div class="statvalue">'+Object.keys(s.days).length+'</div></div></div><div class="card"><b class="cardtitle">Phase connection register</b>'+report.modules.map(m=>'<div class="rowitem"><span><b>Phase '+m.id+' · '+m.name+'</b><div class="tiny">'+(m.missing.length?'Missing: '+m.missing.join(', '):m.status==='not-built'?'Contract registered · implementation pending':'Runtime contract satisfied')+'</div></span><span class="tag '+(m.status==='connected'?'green':m.status==='degraded'?'red':'')+'">'+m.status.toUpperCase()+'</span></div>').join('')+'</div><div class="card" style="margin-top:14px"><b class="cardtitle">Integration audit</b>'+report.tests.map(t=>'<div class="rowitem"><span>'+t.name+'<div class="tiny">'+t.detail+'</div></span><span class="tag '+(t.ok?'green':'red')+'">'+(t.ok?'PASS':'FAIL')+'</span></div>').join('')+'</div>';
 const button=document.getElementById('run-integration-audit');if(button)button.onclick=()=>{audit();render();toast('Integration audit completed.');};
}
const priorRender=window.render;if(typeof priorRender==='function'&&!priorRender.__integrationWrapped){const wrapped=function(...args){const out=priorRender.apply(this,args);render();return out;};wrapped.__integrationWrapped=true;window.render=wrapped;}
const priorNav=window.nav;if(typeof priorNav==='function'&&!priorNav.__integrationWrapped){const wrapped=function(page,...args){const out=priorNav.call(this,page,...args);if(page==='integrationhealth')render();return out;};wrapped.__integrationWrapped=true;window.nav=wrapped;}
window.StudioPhaseIntegration={version:'1.0.0',contracts:CONTRACTS,beginDay,endDay,audit,render};
try{P.registerModule({id:'cross-phase-integration',name:'Cross-phase integration control plane',deps:['kernel','world','population','founder','company','workforce','production'],owns:['daily orchestration telemetry','cross-phase contract checks','integration audit'],status:'implemented'});}catch(e){}
render();
})();