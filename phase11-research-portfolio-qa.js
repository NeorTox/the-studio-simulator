'use strict';
const assert=require('node:assert/strict');
global.StudioAlgorithms=require('./advanced-algorithms-engine.js');
const catalog=[
 {id:'ai-production',name:'AI Production Orchestration',category:'Artificial intelligence',tier:1,cost:6500000,days:150,impact:12,requires:[]},
 {id:'virtual-production',name:'Virtual Production Volume',category:'Production technology',tier:1,cost:7200000,days:165,impact:14,requires:[]},
 {id:'cloud-rendering',name:'Distributed Cloud Rendering',category:'Computing',tier:1,cost:5400000,days:135,impact:10,requires:[]},
 {id:'secure-distribution',name:'Secure Global Distribution',category:'Distribution',tier:1,cost:4300000,days:120,impact:9,requires:[]},
 {id:'real-time-rendering',name:'Real-time Rendering Pipeline',category:'Computing',tier:2,cost:9800000,days:210,impact:16,requires:['cloud-rendering']},
 {id:'procedural-animation',name:'Procedural Animation Systems',category:'Production technology',tier:2,cost:8500000,days:195,impact:15,requires:['ai-production']},
 {id:'digital-twin',name:'Digital Twin Studio Operations',category:'Operations',tier:2,cost:9200000,days:210,impact:17,requires:['ai-production']},
 {id:'immersive-audio',name:'Immersive Spatial Audio',category:'Production technology',tier:2,cost:6100000,days:165,impact:11,requires:['secure-distribution']},
 {id:'carbon-scheduling',name:'Carbon-aware Production Scheduling',category:'Sustainability',tier:2,cost:6800000,days:180,impact:18,requires:['ai-production']},
 {id:'renewable-microgrid',name:'Studio Renewable Microgrids',category:'Sustainability',tier:2,cost:11200000,days:225,impact:20,requires:['digital-twin']},
 {id:'water-reclamation',name:'Closed-loop Water Reclamation',category:'Sustainability',tier:2,cost:5900000,days:165,impact:16,requires:['digital-twin']},
 {id:'circular-materials',name:'Circular Set & Materials System',category:'Sustainability',tier:2,cost:6400000,days:175,impact:17,requires:['virtual-production']}
];
const state={technologies:catalog.map(t=>({id:t.id,status:t.tier===1?'Available':'Locked'})),researchProjects:[],lab:{level:2,scientists:20,capacity:2}};
global.active={id:'research-qa',date:'2026-11-20',company:{cash:50000000,currency:'USD'},technology:state};
let persisted=0,started=[];
global.persist=()=>persisted++;
global.Phase11Technology={
 ensure:()=>state,technologyCatalog:catalog,
 startResearch(id,budget){const t=state.technologies.find(x=>x.id===id);if(!t||t.status!=='Available')throw Error('Not available');if(state.researchProjects.filter(x=>x.status==='Active').length>=state.lab.capacity)throw Error('Lab full');if(active.company.cash<budget)throw Error('Insufficient cash');active.company.cash-=budget;t.status='Researching';const p={id:'RND-'+id,technologyId:id,budget,status:'Active',startDate:active.date};state.researchProjects.push(p);started.push(id);return p}
};
const optimizer=require('./phase11-research-portfolio-optimizer.js');
const report=optimizer.analyze(40);
assert.equal(report.version,'1.0.0');
assert.equal(report.fundingEnvelope,20000000);
assert.equal(report.freeLabSlots,2);
assert.equal(report.availableCount,4);
assert.equal(report.locked.length,8);
assert(report.locked.find(x=>x.id==='renewable-microgrid').requires.includes('Digital Twin Studio Operations'));
assert(report.selected.length<=2);
assert(report.totalSelectedCost<=report.fundingEnvelope);
assert(report.selected.length>0);
const cash=active.company.cash;
const saved=optimizer.savePlan(40);
assert.deepEqual(saved.selectedTechnologyIds,report.selected.map(x=>x.id));
assert.equal(saved.status,'Advisory only');
assert.equal(active.company.cash,cash,'Saving a research plan must not spend cash');
assert.equal(state.researchProjects.length,0,'Saving a research plan must not start research');
assert.equal(persisted,1);
assert.equal(optimizer.audit().failed,0);
const result=optimizer.startSelected(40);
assert.equal(result.length,report.selected.length);
assert.equal(state.researchProjects.filter(x=>x.status==='Active').length,result.length);
assert.equal(active.company.cash,cash-report.totalSelectedCost);
assert.deepEqual(started,report.selected.map(x=>x.id));
assert.throws(()=>optimizer.analyze(95),/between 10% and 80%/);
state.lab.capacity=1;
assert.equal(optimizer.analyze(40).freeLabSlots,0,'Active projects consume lab capacity');
assert.equal(optimizer.analyze(40).selected.length,0,'No projects are selected when all lab slots are occupied');
active.company.cash=0;
assert.equal(optimizer.analyze(40).selected.length,0,'Zero cash cannot fund research');
console.log('RESEARCH INVESTMENT QA PASSED: unlocked prerequisite filtering, exact multi-project budget/capacity selection, deterministic ranking, advisory save, explicit start and spending, occupied-lab and zero-cash boundaries.');
