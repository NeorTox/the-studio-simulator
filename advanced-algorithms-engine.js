(function(root){
'use strict';
const VERSION='1.0.0',MAX_ITEMS=250,MAX_BUDGET=100000,EPS=1e-12;
const finite=(v,label)=>{const n=Number(v);if(!Number.isFinite(n))throw Error((label||'value')+' must be finite.');return n};
const idOf=(v,label)=>{const s=String(v??'');if(!s||s.length>120)throw Error((label||'id')+' must be a non-empty string of at most 120 characters.');return s};
const tie=(a,b)=>String(a).localeCompare(String(b));
function rankAlternatives(items,criteria){
 if(!Array.isArray(items)||!items.length||items.length>MAX_ITEMS)throw Error('items must contain 1–250 alternatives.');
 if(!Array.isArray(criteria)||!criteria.length||criteria.length>32)throw Error('criteria must contain 1–32 weighted criteria.');
 const ids=new Set(),weights=criteria.map(c=>{const id=idOf(c.id,'criterion id'),weight=finite(c.weight,'criterion weight');if(weight<0)throw Error('criterion weights cannot be negative.');if(!['max','min'].includes(c.direction||'max'))throw Error('criterion direction must be max or min.');return{id,weight,direction:c.direction||'max'}});
 if(weights.reduce((s,c)=>s+c.weight,0)<=0)throw Error('At least one criterion weight must be positive.');
 const rows=items.map(item=>{const id=idOf(item.id,'alternative id');if(ids.has(id))throw Error('Duplicate alternative id: '+id);ids.add(id);const values={};for(const c of weights)values[c.id]=finite(item.values?.[c.id],'value for '+id+'/'+c.id);return{id,values}});
 const ranges=Object.fromEntries(weights.map(c=>{const vals=rows.map(r=>r.values[c.id]);return[c.id,{min:Math.min(...vals),max:Math.max(...vals)}]}));
 const totalWeight=weights.reduce((s,c)=>s+c.weight,0);
 const ranked=rows.map(row=>{let score=0;const breakdown={};for(const c of weights){const range=ranges[c.id],span=range.max-range.min;let normalized=span<=EPS?.5:(row.values[c.id]-range.min)/span;if(c.direction==='min')normalized=1-normalized;const contribution=normalized*c.weight/totalWeight;score+=contribution;breakdown[c.id]={normalized:Number(normalized.toFixed(12)),contribution:Number(contribution.toFixed(12))}}return{id:row.id,score:Number(score.toFixed(12)),breakdown,values:row.values}});
 ranked.sort((a,b)=>b.score-a.score||tie(a.id,b.id));
 return{version:VERSION,method:'weighted-normalized-sum',ranked:ranked.map((r,i)=>({...r,rank:i+1}))};
}
function optimizeBudget(projects,budget){
 if(!Array.isArray(projects)||projects.length>MAX_ITEMS)throw Error('projects must be an array of at most 250 items.');
 const cap=finite(budget,'budget');if(!Number.isSafeInteger(cap)||cap<0||cap>MAX_BUDGET)throw Error('budget must be a safe integer between 0 and '+MAX_BUDGET+'.');
 const seen=new Set(),list=projects.map(p=>{const id=idOf(p.id,'project id');if(seen.has(id))throw Error('Duplicate project id: '+id);seen.add(id);const cost=finite(p.cost,'project cost'),value=finite(p.value,'project value');if(!Number.isSafeInteger(cost)||cost<0)throw Error('Project cost must be a non-negative safe integer: '+id);if(value<0)throw Error('Project value cannot be negative: '+id);const units=Number.isSafeInteger(p.units??1)?Number(p.units??1):NaN;if(units!==1)throw Error('Each project must be a single indivisible selection: '+id);return{id,cost,value:Math.round(value*1e6),rawValue:value}});
 const dp=Array(cap+1).fill(null);dp[0]={value:0,ids:[]};
 for(const project of list){for(let b=cap;b>=project.cost;b--){const prior=dp[b-project.cost];if(!prior)continue;const candidate={value:prior.value+project.value,ids:[...prior.ids,project.id].sort(tie)};const current=dp[b];if(!current||candidate.value>current.value||(candidate.value===current.value&&tie(candidate.ids.join('|'),current.ids.join('|'))<0))dp[b]=candidate}}
 let best={spent:0,value:0,ids:[]};for(let spent=0;spent<=cap;spent++){const candidate=dp[spent];if(!candidate)continue;if(candidate.value>best.value||(candidate.value===best.value&&(spent<best.spent||(spent===best.spent&&tie(candidate.ids.join('|'),best.ids.join('|'))<0))))best={spent,value:candidate.value,ids:candidate.ids}}
 const selected=best.ids.map(id=>list.find(p=>p.id===id));
 return{version:VERSION,method:'exact-0-1-knapsack',budget:cap,spent:best.spent,remaining:cap-best.spent,totalValue:Number((best.value/1e6).toFixed(6)),selected:selected.map(p=>({id:p.id,cost:p.cost,value:p.rawValue})),rejected:list.filter(p=>!best.ids.includes(p.id)).map(p=>p.id)};
}
function planDependencies(tasks){
 if(!Array.isArray(tasks)||tasks.length>MAX_ITEMS)throw Error('tasks must be an array of at most 250 items.');
 const byId=new Map();for(const t of tasks){const id=idOf(t.id,'task id');if(byId.has(id))throw Error('Duplicate task id: '+id);const duration=finite(t.duration??1,'task duration');if(duration<0)throw Error('Task duration cannot be negative: '+id);byId.set(id,{id,duration,priority:finite(t.priority??100,'task priority'),deps:[...(t.deps||[])].map(x=>idOf(x,'dependency id'))})}
 const indegree=new Map([...byId.keys()].map(id=>[id,0])),next=new Map([...byId.keys()].map(id=>[id,[]]));
 for(const t of byId.values()){for(const dep of t.deps){if(!byId.has(dep))throw Error('Unknown dependency '+dep+' required by '+t.id);indegree.set(t.id,indegree.get(t.id)+1);next.get(dep).push(t.id)}}
 const ready=[...byId.values()].filter(t=>indegree.get(t.id)===0),order=[],starts={},finishes={};let elapsed=0;
 const sortReady=()=>ready.sort((a,b)=>a.priority-b.priority||tie(a.id,b.id));
 while(ready.length){sortReady();const task=ready.shift();const start=task.deps.reduce((m,id)=>Math.max(m,finishes[id]||0),0),finish=start+task.duration;starts[task.id]=Number(start.toFixed(6));finishes[task.id]=Number(finish.toFixed(6));elapsed=Math.max(elapsed,finish);order.push({id:task.id,position:order.length+1,start:starts[task.id],finish:finishes[task.id],duration:task.duration});for(const id of next.get(task.id)){indegree.set(id,indegree.get(id)-1);if(indegree.get(id)===0)ready.push(byId.get(id))}}
 if(order.length!==byId.size){const cycle=[...indegree].filter(([,n])=>n>0).map(([id])=>id).sort(tie);throw Error('Dependency cycle detected: '+cycle.join(', '))}
 return{version:VERSION,method:'deterministic-topological-schedule',order,makespan:Number(elapsed.toFixed(6))};
}
function shortestPath(graph,startId,endId){
 if(!Array.isArray(graph)||graph.length>1000)throw Error('graph must be an array of at most 1000 nodes.');
 const start=idOf(startId,'start id'),end=idOf(endId,'end id'),nodes=new Map();
 for(const node of graph){const id=idOf(node.id,'node id');if(nodes.has(id))throw Error('Duplicate graph node: '+id);nodes.set(id,{id,edges:(node.edges||[]).map(e=>({to:idOf(e.to,'edge destination'),cost:finite(e.cost,'edge cost')}))})}
 if(!nodes.has(start)||!nodes.has(end))throw Error('Start and end nodes must exist in graph.');
 for(const n of nodes.values())for(const e of n.edges){if(!nodes.has(e.to))throw Error('Unknown edge destination '+e.to+' from '+n.id);if(e.cost<0)throw Error('Dijkstra requires non-negative edge costs: '+n.id+' -> '+e.to)}
 const dist=new Map([...nodes.keys()].map(id=>[id,Infinity])),paths=new Map(),visited=new Set();dist.set(start,0);paths.set(start,[start]);
 while(true){let current=null;for(const id of nodes.keys()){if(visited.has(id)||!Number.isFinite(dist.get(id)))continue;if(current===null||dist.get(id)<dist.get(current)-EPS||(Math.abs(dist.get(id)-dist.get(current))<=EPS&&tie(id,current)<0))current=id}
 if(current===null||current===end)break;visited.add(current);
 for(const edge of nodes.get(current).edges){if(visited.has(edge.to))continue;const next=dist.get(current)+edge.cost,candidate=[...paths.get(current),edge.to],old=dist.get(edge.to),oldPath=paths.get(edge.to);if(next<old-EPS||(Math.abs(next-old)<=EPS&&(!oldPath||tie(candidate.join('|'),oldPath.join('|'))<0))){dist.set(edge.to,next);paths.set(edge.to,candidate)}}
 }
 if(!Number.isFinite(dist.get(end)))return{version:VERSION,method:'dijkstra',found:false,path:[],cost:null};
 return{version:VERSION,method:'dijkstra',found:true,path:paths.get(end),cost:Number(dist.get(end).toFixed(9))};
}
const api=Object.freeze({version:VERSION,rankAlternatives,optimizeBudget,planDependencies,shortestPath});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.StudioAlgorithms=api;
})(typeof window!=='undefined'?window:globalThis);
