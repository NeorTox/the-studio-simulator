'use strict';
const assert=require('node:assert/strict');
global.StudioAlgorithms=require('./advanced-algorithms-engine.js');
global.active={
 id:'portfolio-qa',date:'2026-11-20',company:{cash:20000000,currency:'USD'},
 projects:[
  {id:'film-a',title:'Orbitfall',format:'Feature film',genre:'Science fiction',budget:4000000,spent:0,committed:0,stage:0},
  {id:'film-b',title:'Small Town Mystery',format:'Feature film',genre:'Mystery',budget:6000000,spent:0,committed:0,stage:0},
  {id:'film-c',title:'Overbudget Epic',format:'Feature film',genre:'Fantasy',budget:18000000,spent:0,committed:0,stage:1},
  {id:'released-comp',title:'Previous Sci-Fi',format:'Feature film',genre:'Science fiction',budget:3000000,stage:6,performance:{gross:15000000,studioRevenue:6375000,profit:2100000}},
  {id:'in-production',title:'Already Greenlit',format:'Feature film',genre:'Drama',budget:5000000,stage:2,greenlit:true}
 ]
};
let persisted=0;global.persist=()=>persisted++;
const optimizer=require('./production-portfolio-optimizer.js');
const report=optimizer.analyze(65);
assert.equal(report.version,'1.0.0');
assert.equal(report.currency,'USD');
assert.equal(report.fundingEnvelope,13000000);
assert.equal(report.ranked.length,3,'Only ungreenlit Concept and Development projects are ranked');
assert.equal(report.ranked.find(x=>x.id==='film-a').comparableCount,1,'Exact format and genre comparable is used');
assert.equal(report.ranked.find(x=>x.id==='film-a').comparableBasis,'format-and-genre');
assert(report.optimization.spent<=report.budgetUnits,'Optimized slate must stay inside funding units');
assert(!report.selected.some(x=>x.id==='film-c'),'A project larger than the available envelope cannot be selected');
assert(!report.selected.some(x=>x.id==='in-production'),'Already greenlit production is not re-budgeted');
const beforeCash=global.active.company.cash;
const beforeGreenlights=global.active.projects.map(p=>!!p.greenlit);
const saved=optimizer.savePlan(65);
assert.deepEqual(saved.selectedProjectIds,report.selected.map(x=>x.id));
assert.equal(saved.status,'Advisory only');
assert.equal(global.active.company.cash,beforeCash,'Saving recommendations must not spend company cash');
assert.deepEqual(global.active.projects.map(p=>!!p.greenlit),beforeGreenlights,'Saving recommendations must not greenlight projects');
assert.equal(persisted,1);
assert.equal(optimizer.audit().failed,0);
assert.throws(()=>optimizer.analyze(95),/between 10% and 90%/);
global.active.company.cash=0;
const noCash=optimizer.analyze(65);
assert.equal(noCash.fundingEnvelope,0);
assert.equal(noCash.optimization.spent,0);
global.active.projects=global.active.projects.filter(p=>p.stage>1);
const noCandidates=optimizer.analyze(65);
assert.equal(noCandidates.ranked.length,0);
assert.equal(noCandidates.selected.length,0);
console.log('PRODUCTION PORTFOLIO QA PASSED: comparable-based project estimates, risk-adjusted multi-criteria ranking, exact slate budget selection, eligibility gates, cash/greenlight safety, advisory save, audit and empty-slate boundaries.');
