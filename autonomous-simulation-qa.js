'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('autonomous-simulation-engine.js','utf8');
let persisted=0,handled=0;
const persist=()=>{persisted++};
const campaign={id:'AUTONOMY-QA',date:'2026-01-01',worldSeed:741852,company:{cash:1000},ledger:[],events:[]};
const integration={
 endDay(date){campaign.pipelineValidated=date;persist();return true;},
 audit(){return {passed:1,failed:0,tests:[]};}
};
const context={
 active:campaign,
 persist,
 render(){},
 toast(){},
 window:{StudioPhase0:{},StudioPhaseIntegration:integration},
 document:{readyState:'complete',querySelector(){return null},getElementById(){return null},createElement(){return {dataset:{},classList:{},setAttribute(){}}},addEventListener(){}}
};
vm.createContext(context);
vm.runInContext(source,context,{filename:'autonomous-simulation-engine.js'});
const api=context.window.StudioAutonomy;
assert.ok(api,'Autonomy API is exposed');
assert.equal(api.version,'1.0.0');
api.registerTask({id:'qa.alpha',name:'QA prerequisite',cadenceDays:1,priority:10,run(ctx){assert.equal(ctx.campaign.pipelineValidated,ctx.date);ctx.state.count=(ctx.state.count||0)+1;return {count:ctx.state.count}}});
api.registerTask({id:'qa.beta',name:'QA dependent',cadenceDays:1,priority:20,deps:['qa.alpha'],run(ctx){const prior=ctx.getTaskState('qa.alpha');assert.equal(prior.count,ctx.date==='2026-01-01'?1:ctx.date==='2026-01-02'?2:3);ctx.state.runs=(ctx.state.runs||0)+1;return true}});
api.on('qa.ping',event=>{handled+=event.payload.value});
api.emit('qa.unhandled',{value:1},{id:'unhandled-first',date:'2026-01-01'});
const queued=api.emit('qa.ping',{value:3},{id:'stable-ping',date:'2026-01-01'});
assert.equal(queued.queued,true);
assert.equal(api.emit('qa.ping',{value:3},{id:'stable-ping',date:'2026-01-01'}).duplicate,true);
const first=integration.endDay('2026-01-01');
assert.equal(first.autonomy.processed,true);
assert.equal(first.autonomy.tasksRun,2);
assert.equal(first.autonomy.eventsHandled,1);
assert.equal(handled,3);
assert.equal(api.metrics().queuedEvents,1,'unhandled event must not block later handled events');
assert.equal(api.emit('qa.ping',{value:3},{id:'stable-ping',date:'2026-01-01'}).duplicate,true,'processed event IDs remain deduplicated');
assert.equal(campaign.autonomy.taskStates['qa.alpha'].count,1);
assert.equal(campaign.autonomy.taskStates['qa.beta'].runs,1);
assert.equal(api.runTick('2026-01-01').idempotent,true);
assert.equal(campaign.autonomy.taskStates['qa.alpha'].count,1);
assert.equal(api.audit().failed,0);
assert.ok(persisted>=1);
api.registerTask({id:'qa.failure',name:'QA isolated failure',cadenceDays:1,priority:90,run(){throw new Error('expected QA failure')}});
const second=integration.endDay('2026-01-02').autonomy;
assert.equal(second.failed.length,1);
assert.equal(campaign.autonomy.deadLetters.length,1);
assert.equal(second.tasksRun,2);
for(let i=0;i<1005;i++)api.emit('qa.unhandled',{n:i},{id:'overflow-'+i,date:'2026-01-03'});
assert.equal(api.metrics().queuedEvents,1000);
assert.equal(integration.endDay('2026-01-03').autonomy.processed,true);
assert.equal(api.metrics().queuedEvents,1000);
assert.equal(api.metrics().deadLetters,2);
assert.equal(api.random(123,'same'),api.random(123,'same'));
assert.notEqual(api.random(123,'same'),api.random(123,'different'));
assert.throws(()=>api.runTick('2025-12-31'),/cannot move backwards/);
console.log('AUTONOMY QA PASSED: deterministic streams, task ordering, dependency gating, event deduplication, event dispatch, tick idempotency, bounded queues, failure isolation, dead-letter capture and integration completion ordering.');
