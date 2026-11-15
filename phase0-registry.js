window.StudioExternalFunctionNames=["dec","dstr","dadd","dsub","dmul","ddiv","dclamp","dnum","hashSeed","stableUnit","stableRange","iso","addDays","on","emit","registerModule","validateCampaign","migrateCampaign","stableHash","backupPayload","downloadJSON","checkBackup","saveCollection","sourceInventory","dependencyReport","testSuite","runTests","runStructuralAudit","migrateAll","restoreBackupFile","init","boot","createKernelScheduler"];

(function boot(){
'use strict';
const P=window.StudioPhase0;if(!P){document.addEventListener('DOMContentLoaded',boot,{once:true});return;}
P.domains.forEach(d=>P.registerModule(d));
P.moduleRegistry=P.domains.map(d=>({id:d.id,name:d.name,dependencies:[...d.deps],owns:[...d.owns],status:d.status}));
function createKernelScheduler(state,dispatch){
if(!state||typeof state!=='object')throw Error('Scheduler state must be an object.');
state.version=1;state.sequence=Number(state.sequence||0);state.queue=Array.isArray(state.queue)?state.queue:[];state.history=Array.isArray(state.history)?state.history:[];
return {
schedule(type,dueDate,payload={},source='system'){
if(typeof type!=='string'||!type.trim())throw Error('Event type is required.');
if(!/^\d{4}-\d{2}-\d{2}$/.test(String(dueDate)))throw Error('Event due date must use YYYY-MM-DD.');
const copy=JSON.parse(JSON.stringify(payload));
state.sequence++;const event={id:'KERNEL-EVT-'+String(state.sequence).padStart(9,'0'),type:type.trim(),dueDate,payload:copy,source,sequence:state.sequence,status:'queued'};
state.queue.push(event);state.queue.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.sequence-b.sequence);return event.id;
},
cancel(id){const event=state.queue.find(x=>x.id===id&&x.status==='queued');if(!event)return false;event.status='cancelled';state.history.unshift({...event,completedAt:new Date().toISOString()});return true;},
runDue(date){const due=state.queue.filter(x=>x.status==='queued'&&x.dueDate<=date).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.sequence-b.sequence),out=[];for(const event of due){try{if(typeof dispatch!=='function')throw Error('No event dispatcher is configured.');dispatch(event);event.status='completed';event.completedAt=new Date().toISOString();out.push({id:event.id,status:'completed'});}catch(e){event.status='failed';event.error=String(e&&e.message||e);event.completedAt=new Date().toISOString();out.push({id:event.id,status:'failed',error:event.error});}state.history.unshift({...event});}state.history=state.history.slice(0,500);return out;},
list(){return state.queue.map(x=>({...x}));},
snapshot(){return JSON.parse(JSON.stringify(state));}
};
}
P.createKernelScheduler=createKernelScheduler;
P.createCampaignScheduler=function(){if(typeof active==='undefined'||!active)throw Error('An active campaign is required.');active.simulationKernel=active.simulationKernel||{version:1,sequence:0,queue:[],history:[]};return createKernelScheduler(active.simulationKernel,event=>{const n=P.emit('simulation:'+event.type,event);if(!n)throw Error('No handler registered for '+event.type);});};
P.exportArchitecture=function(){
const report={product:'THE STUDIO',applicationVersion:P.appVersion,registryVersion:P.registryVersion,generatedAt:new Date().toISOString(),schema:P.schema,migrations:P.migrations.map(x=>({from:x.from,to:x.to,id:x.id,description:x.description})),modules:P.moduleRegistry,dependencyReport:P.dependencyReport(),functions:P.sourceInventory(),kernel:{eventBus:'synchronous publish/subscribe',scheduler:'date-keyed serializable queue; drained by the ordered daily world pipeline',deterministicRandom:'seed + stable key',persistence:'campaign save object'},limitations:['Legacy application functions remain in a single HTML bundle.','Domain dependency graph is an architecture contract, not proof of physical source separation.','Scheduler is drained once per simulated date by the ordered daily world pipeline.','No cloud database or server-side background worker is configured.','Browser-side tests require execution in the actual app runtime.']};
const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='THE-STUDIO-ARCHITECTURE-SPEC-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
};
const originalSuite=P.testSuite;
P.testSuite=function(){
const result=originalSuite();
const add=(name,fn)=>{try{result.push({name,pass:true,detail:String(fn()||'Passed')})}catch(e){result.push({name,pass:false,detail:String(e&&e.message||e)})}};
add('All domain modules registered',()=>{if(P.moduleRegistry.length!==P.domains.length)throw Error('Module registry incomplete');return P.moduleRegistry.length+' domain modules registered.'});
add('Kernel scheduler date ordering',()=>{const state={sequence:0,queue:[],history:[]},seen=[],q=createKernelScheduler(state,e=>seen.push(e.type));q.schedule('later','2026-01-03');q.schedule('earlier','2026-01-01');q.runDue('2026-01-01');if(seen.length!==1||seen[0]!=='earlier')throw Error('Due events were not ordered by date');return 'Only due events dispatch, ordered by due date.'});
add('Kernel scheduler deterministic sequence',()=>{const state={sequence:0,queue:[],history:[]},q=createKernelScheduler(state,()=>{}),a=q.schedule('a','2026-01-01'),b=q.schedule('b','2026-01-01');if(a===b||state.sequence!==2)throw Error('Event sequence is not unique');return 'Monotonic event IDs are unique.'});
add('Kernel scheduler cancellation',()=>{const state={sequence:0,queue:[],history:[]},q=createKernelScheduler(state,()=>{}),id=q.schedule('cancel-me','2026-01-01');if(!q.cancel(id)||q.runDue('2026-01-02').length)throw Error('Cancelled event dispatched');return 'Cancelled event is excluded from dispatch.'});
return result;
};
P.runTests=function(){
const results=P.testSuite(),passed=results.filter(x=>x.pass).length,failed=results.length-passed,box=document.getElementById('phase0-test-results');
if(box)box.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">PASSED</div><div class="statvalue" style="color:var(--green)">'+passed+'</div></div><div class="card"><div class="statlabel">FAILED</div><div class="statvalue" style="color:'+(failed?'var(--red)':'var(--green)')+'">'+failed+'</div></div><div class="card"><div class="statlabel">TOTAL TESTS</div><div class="statvalue">'+results.length+'</div></div></div>'+results.map(x=>'<div class="rowitem"><span><b style="color:'+(x.pass?'var(--green)':'var(--red)')+'">'+(x.pass?'PASS':'FAIL')+'</b> · '+x.name+'<div class="tiny">'+x.detail+'</div></span></div>').join('');
const stamp=document.getElementById('phase0-test-stamp');if(stamp)stamp.textContent='Executed '+new Date().toLocaleString();
P.lastTestResults=results;return {passed,failed,total:results.length,results};
};
const testButton=document.getElementById('phase0-run-tests');if(testButton)testButton.onclick=P.runTests;
const actions=document.querySelector('#page-architecture .hero .actions');if(actions&&!document.getElementById('phase0-export-architecture')){const btn=document.createElement('button');btn.id='phase0-export-architecture';btn.className='btn';btn.textContent='Export architecture specification';btn.onclick=P.exportArchitecture;actions.appendChild(btn);}
})();
