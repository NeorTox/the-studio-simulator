'use strict';
const assert=require('node:assert/strict');
const A=require('./advanced-algorithms-engine.js');
assert.equal(A.version,'1.0.0');
const ranked=A.rankAlternatives([
 {id:'safe',values:{cost:8,quality:70,risk:2}},
 {id:'premium',values:{cost:10,quality:95,risk:10}},
 {id:'cheap',values:{cost:4,quality:55,risk:3}}
],[{id:'cost',weight:2,direction:'min'},{id:'quality',weight:3,direction:'max'},{id:'risk',weight:4,direction:'min'}]);
assert.equal(ranked.ranked[0].id,'safe');
assert.deepEqual(A.rankAlternatives([{id:'b',values:{x:4}},{id:'a',values:{x:4}}],[{id:'x',weight:1}]).ranked.map(x=>x.id),['a','b']);
assert.equal(A.rankAlternatives([{id:'only',values:{x:4}}],[{id:'x',weight:1}]).ranked[0].score,.5);
const budget=A.optimizeBudget([{id:'research',cost:60,value:100},{id:'solar',cost:40,value:75},{id:'marketing',cost:50,value:90},{id:'training',cost:20,value:30}],100);
assert.deepEqual(budget.selected.map(x=>x.id),['research','solar']);
assert.equal(budget.spent,100);
assert.equal(budget.remaining,0);
assert.equal(A.optimizeBudget([],0).spent,0);
const schedule=A.planDependencies([
 {id:'release',duration:2,deps:['build','review'],priority:1},
 {id:'build',duration:4,priority:5},
 {id:'review',duration:1,deps:['build'],priority:2},
 {id:'research',duration:3,priority:1}
]);
assert.deepEqual(schedule.order.map(x=>x.id),['research','build','review','release']);
assert.equal(schedule.makespan,7);
assert.throws(()=>A.planDependencies([{id:'a',deps:['b']},{id:'b',deps:['a']}]),/cycle/);
assert.throws(()=>A.planDependencies([{id:'a',deps:['missing']}]),/Unknown dependency/);
const graph=[
 {id:'A',edges:[{to:'B',cost:2},{to:'C',cost:1}]},
 {id:'B',edges:[{to:'D',cost:2}]},
 {id:'C',edges:[{to:'B',cost:1},{to:'D',cost:8}]},
 {id:'D',edges:[]},
 {id:'Z',edges:[]}
];
assert.deepEqual(A.shortestPath(graph,'A','D'),{version:'1.0.0',method:'dijkstra',found:true,path:['A','B','D'],cost:4});
assert.equal(A.shortestPath(graph,'A','Z').found,false);
assert.throws(()=>A.shortestPath([{id:'a',edges:[{to:'b',cost:-1}]},{id:'b',edges:[]}],'a','b'),/non-negative/);
assert.throws(()=>A.rankAlternatives([{id:'x',values:{v:1}}],[{id:'v',weight:-1}]),/negative/);
assert.throws(()=>A.optimizeBudget([{id:'x',cost:2,value:1}],100001),/budget/);
assert.throws(()=>A.optimizeBudget([{id:'x',cost:2,value:1},{id:'x',cost:3,value:2}],5),/Duplicate/);
assert.throws(()=>A.rankAlternatives([{id:'x',values:{v:NaN}}],[{id:'v',weight:1}]),/finite/);
console.log('ADVANCED ALGORITHMS QA PASSED: deterministic multi-criteria ranking, exact bounded budget optimization, dependency-aware scheduling, shortest-path routing, stable tie-breaking, edge validation and failure handling.');
