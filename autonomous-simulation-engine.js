(function(){
'use strict';
const VERSION='1.0.0',STATE_VERSION=1,MAX_EVENTS=1000,MAX_HISTORY=120,MAX_TASKS_PER_TICK=40,MAX_EVENTS_PER_TICK=120;
const P=window.StudioPhase0;
if(!P)throw new Error('Autonomous Simulation Engine requires the Phase 0 kernel.');
const tasks=new Map(),handlers=new Map();
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')};
const validDate=s=>{const v=String(s);if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v};
const ordinal=s=>Math.floor(Date.parse(s+'T00:00:00Z')/86400000);
function campaign(){return typeof active!=='undefined'&&active?active:null}
function ensure(){
 const c=campaign();if(!c)return null;
 let s=c.autonomy;
 if(!s||typeof s!=='object'||Array.isArray(s))s=c.autonomy={version:STATE_VERSION,seed:Number(c.worldSeed)||parseInt(hash(c.id||'studio'),16),lastTickDate:null,ticks:0,taskStates:{},events:[],deadLetters:[],history:[],metrics:{tasksRun:0,eventsHandled:0,failures:0,lastDurationMs:0}};
 if(s.version!==STATE_VERSION)throw new Error('Unsupported autonomous simulation state version: '+s.version);
 s.taskStates=s.taskStates||{};s.events=Array.isArray(s.events)?s.events:[];s.deadLetters=Array.isArray(s.deadLetters)?s.deadLetters:[];s.processedEventIds=Array.isArray(s.processedEventIds)?s.processedEventIds:[];s.history=Array.isArray(s.history)?s.history:[];s.metrics=s.metrics||{tasksRun:0,eventsHandled:0,failures:0,lastDurationMs:0};
 return s;
}
function random(seed,key){let x=(Number(seed)^parseInt(hash(key),16))>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}
function registerTask(spec){
 if(!spec||typeof spec.id!=='string'||!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(spec.id)||typeof spec.run!=='function')throw Error('Task requires a valid id and run function.');
 if(tasks.has(spec.id))throw Error('Autonomous task already registered: '+spec.id);
 const cadence=Number(spec.cadenceDays??1),offset=Number(spec.offsetDays??0),priority=Number(spec.priority??100);
 if(!Number.isInteger(cadence)||cadence<1||cadence>3650||!Number.isInteger(offset)||offset<0||!Number.isFinite(priority))throw Error('Invalid task cadence, offset or priority: '+spec.id);
 const task=Object.freeze({id:spec.id,name:String(spec.name||spec.id),cadenceDays:cadence,offsetDays:offset,priority,deps:[...(spec.deps||[])],enabled:spec.enabled!==false,run:spec.run});
 tasks.set(task.id,task);
 return {registered:true,id:task.id};
}
function on(type,fn){
 if(typeof type!=='string'||!type||typeof fn!=='function')throw Error('Event handler requires a type and function.');
 const set=handlers.get(type)||new Set();set.add(fn);handlers.set(type,set);
 return ()=>{set.delete(fn);if(!set.size)handlers.delete(type)};
}
function emit(type,payload={},options={}){
 const s=ensure();if(!s)throw Error('No active campaign.');
 if(typeof type!=='string'||!type||type.length>80)throw Error('Invalid autonomous event type.');
 const date=String(options.date||campaign().date);
 if(!validDate(date))throw Error('Autonomous event requires a valid campaign date.');
 const identity=String(options.id||hash(date+'|'+type+'|'+JSON.stringify(payload)));
 const id='AUT-'+hash(type+'|'+identity);
 if(s.events.some(e=>e.id===id)||s.deadLetters.some(e=>e.id===id)||s.processedEventIds.includes(id))return {queued:false,duplicate:true,id};
 if(s.events.length>=MAX_EVENTS)throw Error('Autonomous event queue is full; existing events were preserved.');
 s.events.push({id,type,date,payload:clone(payload),createdAt:date,attempts:0});
 return {queued:true,id};
}
function due(task,date,seed){
 const n=ordinal(date),base=ordinal('2000-01-01');
 return ((n-base-task.offsetDays)%task.cadenceDays+task.cadenceDays)%task.cadenceDays===0;
}
function orderedTasks(){
 const selected=[...tasks.values()].filter(t=>t.enabled).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
 const ids=new Set(selected.map(t=>t.id)),out=[],visiting=new Set(),visited=new Set();
 function visit(t){
  if(visited.has(t.id))return;
  if(visiting.has(t.id))throw Error('Autonomous task dependency cycle at '+t.id);
  visiting.add(t.id);
  for(const id of t.deps){if(!tasks.has(id))throw Error('Unknown dependency '+id+' required by '+t.id);if(ids.has(id))visit(tasks.get(id));}
  visiting.delete(t.id);visited.add(t.id);out.push(t);
 }
 selected.forEach(visit);return out;
}
function runTick(date,options={}){
 const c=campaign(),s=ensure();if(!c||!s)return {processed:false,reason:'no-campaign'};
 if(!validDate(date))throw Error('Autonomous tick requires YYYY-MM-DD.');
 if(s.lastTickDate===date)return {processed:false,idempotent:true,date};
 if(s.lastTickDate&&date<s.lastTickDate)throw Error('Autonomous tick cannot move backwards from '+s.lastTickDate+' to '+date+'.');
 const started=Date.now(),ran=[],failed=[],skipped=[],completed=new Set(),dueList=orderedTasks().filter(t=>due(t,date,s.seed));
 if(dueList.length>MAX_TASKS_PER_TICK)throw Error('Autonomous task budget exceeded: '+dueList.length+' > '+MAX_TASKS_PER_TICK);
 for(const t of dueList){
  const blocked=t.deps.find(id=>!completed.has(id)&&due(tasks.get(id),date,s.seed));
  if(blocked){skipped.push({id:t.id,reason:'dependency-failed:'+blocked});continue;}
  const taskState=clone(s.taskStates[t.id]||{});
  const ctx={date,seed:s.seed,taskId:t.id,state:taskState,campaign:c,random:key=>random(s.seed,date+'|'+t.id+'|'+key),emit:(type,payload,opts)=>emit(type,payload,{...(opts||{}),date}),getTaskState:id=>clone(s.taskStates[id]||{}),setTaskState:(id,value)=>{if(!tasks.has(id))throw Error('Cannot write unregistered task state: '+id);s.taskStates[id]=clone(value)}};
  try{const result=t.run(ctx);if(result&&typeof result.then==='function')throw Error('Autonomous tasks must be synchronous and deterministic.');s.taskStates[t.id]=taskState;completed.add(t.id);ran.push({id:t.id,result:result===undefined?null:clone(result)});s.metrics.tasksRun++;}
  catch(e){failed.push({id:t.id,error:String(e&&e.message||e)});s.metrics.failures++;s.deadLetters.push({id:'DLQ-'+hash(date+'|'+t.id),taskId:t.id,date,error:String(e&&e.message||e)});}
 }
 let handled=0,processed=0;
 const dueEvents=s.events.filter(event=>validDate(event.date)&&event.date<=date).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const batch=dueEvents.slice(0,MAX_EVENTS_PER_TICK),batchIds=new Set(batch.map(event=>event.id));
 s.events=s.events.filter(event=>!batchIds.has(event.id));
 for(const event of batch){
  processed++;
  const listeners=[...(handlers.get(event.type)||[])];
  let ok=listeners.length>0;
  if(!listeners.length)event.lastError='No handler registered for event type '+event.type;
  for(const fn of listeners){try{const result=fn(clone(event),{date,seed:s.seed,random:key=>random(s.seed,date+'|event|'+event.id+'|'+key),campaign:c,emit});if(result&&typeof result.then==='function')throw Error('Event handlers must be synchronous.');}catch(e){ok=false;event.lastError=String(e&&e.message||e);break;}}
  if(ok){handled++;s.metrics.eventsHandled++;s.processedEventIds.push(event.id);if(s.processedEventIds.length>2000)s.processedEventIds.splice(0,s.processedEventIds.length-2000);}
  else {event.attempts=(event.attempts||0)+1;if(event.attempts>=3)s.deadLetters.push(event);else s.events.push(event);}
 }
 s.deadLetters=s.deadLetters.slice(-MAX_EVENTS);s.lastTickDate=date;s.ticks++;s.metrics.lastDurationMs=Math.max(0,Date.now()-started);
 const record={date,tasksDue:dueList.length,tasksRun:ran.length,failed:failed.length,skipped:skipped.length,eventsHandled:handled,eventsPending:s.events.length,durationMs:s.metrics.lastDurationMs};
 s.history.unshift(record);s.history=s.history.slice(0,MAX_HISTORY);
 if(options.persist!==false&&typeof persist==='function')persist();
 return {processed:true,...record,ran,failed,skipped};
}
function metrics(){const s=ensure();return s?{version:VERSION,stateVersion:s.version,lastTickDate:s.lastTickDate,ticks:s.ticks,registeredTasks:tasks.size,queuedEvents:s.events.length,deadLetters:s.deadLetters.length,...s.metrics}:null}
function audit(){
 const s=ensure(),tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
 add('Active campaign autonomy state',!!s,'Versioned state is attached to the active campaign.');
 if(s){
  add('Autonomy state version',s.version===STATE_VERSION,'Expected schema '+STATE_VERSION+', found '+s.version+'.');
  add('Task identifiers unique',new Set(tasks.keys()).size===tasks.size,tasks.size+' registered task definitions.');
  let dependencyError='';try{orderedTasks()}catch(e){dependencyError=e.message}
  add('Task dependency graph acyclic and complete',!dependencyError,dependencyError||'All task dependencies resolve without cycles.');
  add('Tick date valid',!s.lastTickDate||validDate(s.lastTickDate),String(s.lastTickDate||'No tick yet'));
  add('Event queue bounded',s.events.length<=MAX_EVENTS,s.events.length+' queued events.');
  add('Dead-letter queue bounded',s.deadLetters.length<=MAX_EVENTS,s.deadLetters.length+' retained failed events/tasks.');
  add('Task state serializable',(()=>{try{JSON.stringify(s.taskStates);return true}catch(e){return false}})(),'Task state can be saved as JSON.');
  add('No duplicate queued event IDs',new Set(s.events.map(e=>e.id)).size===s.events.length,'Queued event IDs are unique.');
  add('Processed event deduplication history',new Set(s.processedEventIds).size===s.processedEventIds.length&&s.processedEventIds.length<=2000,s.processedEventIds.length+' bounded processed event IDs.');
  add('Deterministic random stream',random(s.seed,'audit')===random(s.seed,'audit'),'Identical campaign seed and key reproduce the same sample.');
  add('Daily tick history bounded',s.history.length<=MAX_HISTORY,s.history.length+' retained tick records.');
  add('No task failures on latest tick',!s.history[0]||s.history[0].failed===0,s.history[0]?s.history[0].failed+' failed task(s) on '+s.history[0].date:'No autonomous tick has run.');
 }
 const passed=tests.filter(x=>x.ok).length;return {passed,failed:tests.length-passed,tests};
}
function render(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!document.getElementById('page-autonomy')){
  const b=document.createElement('button');b.dataset.page='autonomy';b.innerHTML='<span>🧠</span>Autonomy';b.onclick=()=>window.nav('autonomy');nav.appendChild(b);
  const p=document.createElement('section');p.className='page';p.id='page-autonomy';
  p.innerHTML='<div class="hero"><div><div class="eyebrow">POST-ROADMAP · ALGORITHMS PROGRAMME</div><h1 class="h1">Autonomous simulation</h1><p class="sub">Deterministic task scheduling, event processing, dependency control and bounded failure recovery.</p></div><button class="btn primary" id="autonomy-audit">Run autonomy audit</button></div><div id="autonomy-content"></div>';content.appendChild(p);
 }
 const root=document.getElementById('autonomy-content');if(!root)return;
 if(!campaign()){root.innerHTML='<div class="empty">Create or load a campaign to initialize autonomous simulation.</div>';return;}
 const m=metrics(),a=audit(),s=ensure();
 root.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">AUTONOMOUS TICKS</div><div class="statvalue">'+m.ticks+'</div></div><div class="card"><div class="statlabel">REGISTERED TASKS</div><div class="statvalue">'+m.registeredTasks+'</div></div><div class="card"><div class="statlabel">QUEUED EVENTS</div><div class="statvalue">'+m.queuedEvents+'</div></div><div class="card"><div class="statlabel">DEAD LETTERS</div><div class="statvalue">'+m.deadLetters+'</div></div></div><div class="card"><b class="cardtitle">Controller status</b><div class="rowitem"><span>Last processed date</span><b>'+esc(s.lastTickDate||'Awaiting first tick')+'</b></div><div class="rowitem"><span>Last tick duration</span><b>'+m.lastDurationMs+' ms</b></div><div class="rowitem"><span>Task executions</span><b>'+m.tasksRun+'</b></div><div class="rowitem"><span>Event handlers completed</span><b>'+m.eventsHandled+'</b></div><div class="rowitem"><span>Recorded failures</span><b>'+m.failures+'</b></div></div><div class="card" style="margin-top:14px"><b class="cardtitle">Registered autonomous tasks</b>'+(tasks.size?[...tasks.values()].sort((x,y)=>x.priority-y.priority).map(t=>'<div class="rowitem"><span><b>'+esc(t.name)+'</b><div class="tiny">'+esc(t.id)+' · every '+t.cadenceDays+' day(s) · priority '+t.priority+' · dependencies '+esc(t.deps.join(', ')||'none')+'</div></span><span class="tag green">REGISTERED</span></div>').join(''):'<div class="empty">No domain tasks registered yet. The controller is ready for the NPC, economy, corporate and media algorithms.</div>')+'</div><div class="card" style="margin-top:14px"><b class="cardtitle">Recent simulation ticks</b>'+(s.history.length?s.history.slice(0,20).map(x=>'<div class="rowitem"><span>'+esc(x.date)+'<div class="tiny">'+x.tasksRun+'/'+x.tasksDue+' tasks · '+x.eventsHandled+' events · '+x.failed+' failures</div></span><span class="tiny">'+x.durationMs+' ms</span></div>').join(''):'<div class="empty">No autonomous ticks have run yet.</div>')+'</div><div class="card" style="margin-top:14px"><b class="cardtitle">Integrity audit · '+a.passed+'/'+(a.passed+a.failed)+'</b>'+a.tests.map(x=>'<div class="rowitem"><span>'+esc(x.name)+'<div class="tiny">'+esc(x.detail)+'</div></span><span class="tag '+(x.ok?'green':'red')+'">'+(x.ok?'PASS':'FAIL')+'</span></div>').join('')+'</div>';
 const button=document.getElementById('autonomy-audit');if(button)button.onclick=()=>{audit();render();toast('Autonomous simulation audit completed.');};
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function attach(){
 const integration=window.StudioPhaseIntegration;
 if(integration&&!integration.__autonomyWrapped){
  const oldEnd=integration.endDay;
  integration.endDay=function(date){const out=oldEnd.call(this,date);const result=runTick(date,{persist:false});return {autonomy:result,integration:out};};
  const oldAudit=integration.audit;
  integration.audit=function(){const report=oldAudit.call(this),a=audit();report.tests.push({name:'Autonomous simulation controller',ok:a.failed===0,detail:a.passed+'/'+(a.passed+a.failed)+' checks passed'});report.passed=report.tests.filter(x=>x.ok).length;report.failed=report.tests.length-report.passed;return report;};
  integration.__autonomyWrapped=true;
 }
 const oldRender=window.render;
 if(typeof oldRender==='function'&&!oldRender.__autonomyWrapped){const wrapped=function(...args){const out=oldRender.apply(this,args);render();return out};wrapped.__autonomyWrapped=true;window.render=wrapped;}
 const oldNav=window.nav;
 if(typeof oldNav==='function'&&!oldNav.__autonomyWrapped){const wrapped=function(page,...args){const out=oldNav.call(this,page,...args);if(page==='autonomy')render();return out};wrapped.__autonomyWrapped=true;window.nav=wrapped;}
 render();
}
window.StudioAutonomy={version:VERSION,registerTask,on,emit,runTick,metrics,audit,render,random,ensure};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();