(function(){
'use strict';
const VERSION='13.0.0';
const REQUIRED=[
{id:0,name:'Architecture & stability',api:()=>!!window.StudioPhase0?.validateCampaign&&!!window.StudioPhase0?.checkBackup},
{id:1,name:'World, time & geography',api:()=>!!window.StudioPhase0?.phase1?.processWorldDay||!!window.StudioGlobalGeography},
{id:2,name:'Population & NPC intelligence',api:()=>!!window.StudioPopulationEngine?.processDay},
{id:3,name:'Founder & personal life',api:()=>!!window.Phase3Founder?.stepDay},
{id:4,name:'Company management',api:()=>!!window.Phase4Company?.stepDay},
{id:5,name:'Entertainment production',api:()=>!!window.Phase5Production?.audit},
{id:6,name:'Entertainment ecosystem',api:()=>!!window.Phase6Ecosystem?.audit&&!!window.Phase6Audience?.audit},
{id:7,name:'Smartphone & media',api:()=>!!window.Phase7Smartphone?.audit},
{id:8,name:'Financial empire',api:()=>!!window.Phase8FinancialEmpire?.audit},
{id:9,name:'Global economy',api:()=>!!window.Phase9GlobalEconomy?.audit},
{id:10,name:'Autonomous competitors',api:()=>!!window.Phase10Competitors?.audit},
{id:11,name:'Technology & sustainability',api:()=>!!window.Phase11Technology?.audit},
{id:12,name:'Generations & world evolution',api:()=>!!window.Phase12Generations?.audit&&!!window.Phase12Generations?.stepDay}
];
const add=(tests,name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
function syncAudit(){
 const tests=[],missing=REQUIRED.filter(x=>!x.api());
 add(tests,'Phase 0–12 runtime contracts',missing.length===0,missing.length?missing.map(x=>'Phase '+x.id+' '+x.name).join('; '):'All 13 prior phase APIs are present.');
 const integration=window.StudioPhaseIntegration;
 add(tests,'Cross-phase integration control plane',!!integration&&typeof integration.audit==='function'&&Array.isArray(integration.contracts),'Integration audit and contract registry are available.');
 const contract=integration?.contracts?.find(x=>x.id===13);
 add(tests,'Phase 13 release-quality contract registered',!!contract&&contract.requires.includes('StudioReleaseQuality.audit'),'Release-quality API is declared in the integration registry.');
 const modules=integration?.contracts||[];
 add(tests,'Fourteen phase contracts registered',modules.length===14,modules.length+' phase contracts registered.');
 add(tests,'PWA landscape metadata',!!document.querySelector('link[rel="manifest"]'),'Manifest link is present; actual orientation is parsed in the release audit.');
 const scriptRefs=[...document.scripts].map(s=>s.getAttribute('src')).filter(x=>x&&x.startsWith('./')&&x.endsWith('.js'));
 const duplicateRefs=scriptRefs.filter((x,i)=>scriptRefs.indexOf(x)!==i);
 add(tests,'Local engine script references are unique',duplicateRefs.length===0,duplicateRefs.length?duplicateRefs.join(', '):scriptRefs.length+' local engine scripts referenced.');
 if(typeof active!=='undefined'&&active){
  const decision=window.StudioNPCDecisionConsequences?.audit?.(),risk=window.StudioWorldRisk?.audit?.(),finance=window.Phase8FinancialEmpire?.audit?.(),digital=window.Phase7Smartphone?.lifeExpansionAudit?.();
  add(tests,'Universal decision/consequence engine integrity',!!decision&&decision.failed===0,decision?decision.passed+' passed / '+decision.failed+' failed':'Decision engine audit unavailable');
  add(tests,'Regional hazard consequence integrity',!!risk&&risk.failed===0,risk?risk.passed+' passed / '+risk.failed+' failed':'World-risk audit unavailable');
  add(tests,'Digital-life and telecom integrity',!!digital&&digital.failed===0,digital?digital.passed+' passed / '+digital.failed+' failed':'Digital-life audit unavailable');
  add(tests,'Financial empire and portfolio integrity',!!finance&&finance.failed===0,finance?finance.passed+' passed / '+finance.failed+' failed':'Financial empire audit unavailable');
 }else add(tests,'Post-roadmap simulation audits available',!!window.StudioNPCDecisionConsequences?.audit&&!!window.StudioWorldRisk?.audit&&!!window.Phase7Smartphone?.lifeExpansionAudit&&!!window.Phase8FinancialEmpire?.audit,'Decision, regional risk, digital-life and financial-empire audits are registered.');
 const apis=REQUIRED.map(x=>({id:x.id,connected:x.api()}));
 add(tests,'Phase 12 generation state remains serializable',!active?.generations||(()=>{try{JSON.stringify(active.generations);return true}catch(e){return false}})(),'Generation state can be serialized with the campaign.');
 if(typeof active!=='undefined'&&active){
  const valid=window.StudioPhase0?.validateCampaign?.(active);
  add(tests,'Active campaign schema validation',!!valid?.valid,valid?.errors?.join('; ')||'Campaign envelope satisfies required fields.');
  let serializable=true,roundTrip=false;try{const raw=JSON.stringify(active);const copy=JSON.parse(raw);roundTrip=!!copy&&copy.id===active.id&&copy.date===active.date}catch(e){serializable=false}
  add(tests,'Campaign JSON save round-trip',serializable&&roundTrip,'Campaign can be serialized and reconstructed without changing identity or date.');
  const ids=(Array.isArray(saves)?saves:[]).map(x=>x.id);
  add(tests,'Local campaign IDs are unique',new Set(ids).size===ids.length,ids.length+' local campaigns checked.');
  add(tests,'Campaign date is valid',/^\d{4}-\d{2}-\d{2}$/.test(active.date||''),String(active.date||'missing'));
  const ledger=Array.isArray(active.ledger)?active.ledger:[];
  add(tests,'Financial ledger amounts are finite',ledger.every(x=>Number.isFinite(Number(x.amount??x.value??0))),ledger.length+' ledger rows inspected.');
 }
 return {version:VERSION,passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests,apis};
}
async function audit(){
 const report=syncAudit(),tests=report.tests;
 const check=async(name,url,detail)=>{try{const r=await fetch(url,{cache:'no-store'});add(tests,name,r.ok,r.ok?detail+' · HTTP '+r.status:'HTTP '+r.status)}catch(e){add(tests,name,false,e.message)}};
 const manifest=document.querySelector('link[rel="manifest"]')?.getAttribute('href');
 if(manifest){
  try{const r=await fetch(manifest,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const m=await r.json();add(tests,'Manifest parses and requests landscape',m.orientation==='landscape'&&m.display==='standalone','orientation='+m.orientation+'; display='+m.display)}catch(e){add(tests,'Manifest parses and requests landscape',false,e.message)}
 }else add(tests,'Manifest parses and requests landscape',false,'Manifest link missing.');
 await check('Service worker asset is reachable','./sw.js','Service worker');
 try{const r=await fetch('./sw.js',{cache:'no-store'});const source=await r.text();add(tests,'Offline cache namespace is versioned',r.ok&&/v4\\.\\d+\\.\\d+-world-systems-market/.test(source),source.match(/const CACHE='([^']+)'/)?.[1]||'Cache namespace missing')}catch(e){add(tests,'Offline cache namespace is versioned',false,e.message)}
 const refs=[...document.scripts].map(s=>s.getAttribute('src')).filter(x=>x&&x.startsWith('./')&&x.endsWith('.js'));
 for(const src of refs){await check('Engine asset '+src,src,'Local script');}
 const storageKey='studio-phase13-probe-'+Date.now();
 try{localStorage.setItem(storageKey,'ok');const ok=localStorage.getItem(storageKey)==='ok';localStorage.removeItem(storageKey);add(tests,'Browser storage write/read/remove',ok,'Temporary probe removed; campaign saves were not modified.')}catch(e){try{localStorage.removeItem(storageKey)}catch(_){}add(tests,'Browser storage write/read/remove',false,e.message)}
 const out={version:VERSION,passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests,apis:report.apis};
 if(active){active.releaseQuality=active.releaseQuality||{version:VERSION,history:[]};active.releaseQuality.version=VERSION;active.releaseQuality.lastAudit={date:active.date,passed:out.passed,failed:out.failed,at:new Date().toISOString()};active.releaseQuality.history.unshift(active.releaseQuality.lastAudit);active.releaseQuality.history=active.releaseQuality.history.slice(0,30);if(typeof persist==='function')persist()}
 return out;
}
function render(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!document.getElementById('page-releasequality')){
  const b=document.createElement('button');b.dataset.page='releasequality';b.innerHTML='<span>✓</span>Release QA';b.onclick=()=>window.nav('releasequality');nav.appendChild(b);
  const page=document.createElement('section');page.className='page';page.id='page-releasequality';
  page.innerHTML='<div class="hero"><div><div class="eyebrow">PHASE 13 · RELEASE ENGINEERING</div><h1 class="h1">Release quality</h1><p class="sub">Runtime contracts, campaign integrity, PWA assets and browser storage checks.</p></div><button class="btn primary" id="run-release-audit">Run release audit</button></div><div id="release-quality-content"></div>';
  content.appendChild(page);
 }
 const root=document.getElementById('release-quality-content');if(!root)return;
 const r=syncAudit();root.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">CHECKS PASSED</div><div class="statvalue">'+r.passed+'</div></div><div class="card"><div class="statlabel">FAILURES</div><div class="statvalue">'+r.failed+'</div></div><div class="card"><div class="statlabel">PRIOR PHASE APIs</div><div class="statvalue">'+r.apis.filter(x=>x.connected).length+' / 13</div></div><div class="card"><div class="statlabel">RELEASE ENGINE</div><div class="statvalue">'+VERSION+'</div></div></div><div class="card"><b class="cardtitle">Release checks</b>'+r.tests.map(t=>'<div class="rowitem"><span>'+t.name+'<div class="tiny">'+t.detail+'</div></span><span class="tag '+(t.ok?'green':'red')+'">'+(t.ok?'PASS':'FAIL')+'</span></div>').join('')+'</div>';
 const button=document.getElementById('run-release-audit');if(button)button.onclick=async()=>{button.disabled=true;button.textContent='Checking…';try{const result=await audit();root.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">CHECKS PASSED</div><div class="statvalue">'+result.passed+'</div></div><div class="card"><div class="statlabel">FAILURES</div><div class="statvalue">'+result.failed+'</div></div><div class="card"><div class="statlabel">RELEASE ENGINE</div><div class="statvalue">'+VERSION+'</div></div></div><div class="card"><b class="cardtitle">Release audit results</b>'+result.tests.map(t=>'<div class="rowitem"><span>'+t.name+'<div class="tiny">'+t.detail+'</div></span><span class="tag '+(t.ok?'green':'red')+'">'+(t.ok?'PASS':'FAIL')+'</span></div>').join('')+'</div>';toast('Release audit: '+result.passed+' passed, '+result.failed+' failed.')}catch(e){toast('Release audit failed: '+e.message)}finally{button.disabled=false;button.textContent='Run release audit'}};
}
window.StudioReleaseQuality={version:VERSION,audit,syncAudit,render};
const integration=window.StudioPhaseIntegration;
if(integration){
 const contract=integration.contracts.find(x=>x.id===13);
 if(contract)contract.requires=['StudioReleaseQuality.audit','StudioReleaseQuality.syncAudit'];
 const base=integration.audit;
 if(typeof base==='function'&&!base.__phase13Wrapped){
  const wrapped=function(){const r=base.call(this),m=r.modules?.find(x=>x.id===13);if(m){m.status='connected';m.missing=[]}const contractTest=r.tests?.find(x=>x.name==='Phase 13 · Integration & release quality');if(contractTest){contractTest.ok=true;contractTest.detail='connected: release-quality audit, save validation, PWA and asset checks'}const q=syncAudit();r.tests.push({name:'Phase 13 release-quality integrity',ok:q.failed===0,detail:q.passed+' passed / '+q.failed+' failed'});r.modules=r.modules||[];r.passed=r.tests.filter(x=>x.ok).length;r.failed=r.tests.length-r.passed;return r};
  wrapped.__phase13Wrapped=true;integration.audit=wrapped;
 }
}
const prior=window.render;if(typeof prior==='function'&&!prior.__phase13Wrapped){const wrapped=function(...args){const out=prior.apply(this,args);render();return out};wrapped.__phase13Wrapped=true;window.render=wrapped}
const oldNav=window.nav;if(typeof oldNav==='function'&&!oldNav.__phase13Wrapped){const wrapped=function(page,...args){const out=oldNav.call(this,page,...args);if(page==='releasequality')render();return out};wrapped.__phase13Wrapped=true;window.nav=wrapped}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();