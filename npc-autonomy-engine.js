(function(){
'use strict';
const VERSION='1.0.0',TASK='npc.personal-agency',MAX_DAILY=1200,MAX_EVENTS=300;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
const addDays=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const alive=n=>n&&n.alive!==false&&n.status!=='Deceased';
const population=()=>{if(!active)return null;active.world=active.world||{};return active.world.population||null};
const sample=(ctx,key)=>ctx.random(key);
function decide(n,ctx){
 const needs=n.needs||{},career=n.career||{},fin=n.finances||{},skills=n.skills||{};
 const wellbeing=['health','energy','social','security','purpose'].reduce((a,k)=>a+clamp(needs[k]??60,0,100),0)/5;
 const pressure={
  rest:Math.max(0,42-clamp(needs.energy??60,0,100))*1.65+Math.max(0,35-clamp(needs.health??70,0,100))*.7,
  socialize:Math.max(0,48-clamp(needs.social??55,0,100))*1.35,
  career:Math.max(0,55-clamp(career.satisfaction??65,0,100))*.8+Math.max(0,50-clamp(career.performance??60,0,100))*.25,
  learning:Math.max(0,65-clamp(needs.purpose??60,0,100))*.75+(n.age>=16?clamp(skills.technical??40,0,100)*.06:0),
  financial:Math.max(0,48-clamp(needs.security??60,0,100))*1.1+Math.max(0,(fin.monthlyExpenses||0)-(fin.monthlyIncome||0))*.002
 };
 const entries=Object.entries(pressure).map(([action,score])=>({action,score:score+sample(ctx,n.id+'|'+action)*5})).sort((a,b)=>b.score-a.score);
 const action=entries[0].action;
 const state=n.autonomy||(n.autonomy={version:VERSION,decisions:0,actionCounts:{},lastAction:null,lastDecisionDate:null,goal:null});
 state.decisions=(state.decisions||0)+1;state.actionCounts=state.actionCounts||{};
 state.actionCounts[action]=(state.actionCounts[action]||0)+1;state.lastAction=action;state.lastDecisionDate=ctx.date;state.wellbeing=Number(wellbeing.toFixed(2));
 if(!state.goal||state.goal.expires<ctx.date||state.goal.action!==action)state.goal={action,created:ctx.date,expires:addDays(ctx.date,7),priority:Number(entries[0].score.toFixed(2))};
 n.schedule=n.schedule||{routine:'Balanced',workHours:8,leisureHours:3};
 switch(action){
  case'rest':
   n.schedule.routine='Recovery';n.schedule.leisureHours=clamp((n.schedule.leisureHours||3)+.15,1,8);
   needs.energy=clamp((needs.energy??60)+.12,0,100);n.stress=clamp((n.stress??30)-.08,0,100);break;
  case'socialize':
   n.schedule.routine='Social';needs.social=clamp((needs.social??55)+.1,0,100);n.mood=clamp((n.mood??50)+.04,0,100);break;
  case'career':
   n.schedule.routine='Career focused';if(n.status==='Employed'||n.status==='Externally Employed')career.satisfaction=clamp((career.satisfaction??60)+.025,0,100);else if(n.age>=18&&n.age<66)state.careerIntent='Seeking opportunities';break;
  case'learning':{
   n.schedule.routine='Learning';const skill=Object.keys(skills).sort((a,b)=>Number(skills[a])-Number(skills[b]))[0];
   if(skill){skills[skill]=clamp(Number(skills[skill])+.012,0,100);state.lastSkill=skill}
   needs.purpose=clamp((needs.purpose??60)+.06,0,100);break;
  }
  case'financial':
   n.schedule.routine='Budget conscious';if((fin.monthlyIncome||0)>0)fin.savingsRate=clamp((fin.savingsRate||0)+.02,-100,100);break;
 }
 n.lastAutonomousAction=action;
 return action;
}
function register(){
 const engine=window.StudioAutonomy,people=window.StudioPopulationEngine;
 if(!engine||!people||register.done)return false;
 engine.registerTask({id:TASK,name:'NPC personal agency and daily decisions',cadenceDays:1,priority:35,run(ctx){
  const p=population();if(!p||!Array.isArray(p.npcs))return{processed:0,reason:'population-not-initialized'};
  const list=p.npcs,total=list.length;if(!total)return{processed:0,reason:'empty-population'};
  const state=ctx.state;const cursor=((Number(state.cursor)||0)%total+total)%total;
  const count=Math.min(MAX_DAILY,total-cursor),selected=[];
  for(let i=0;i<count;i++){const n=list[(cursor+i)%total];if(alive(n))selected.push(n)}
  let acted=0;const counts={};
  for(const n of selected){const action=decide(n,ctx);counts[action]=(counts[action]||0)+1;acted++}
  state.cursor=(cursor+count)%total;state.totalDecisions=(state.totalDecisions||0)+acted;state.lastDate=ctx.date;state.lastPopulation=total;state.lastBatch=acted;state.lastActionCounts=counts;
  return{processed:acted,totalPopulation:total,nextCursor:state.cursor,actionCounts:counts};
 }});
 register.done=true;return true;
}
function metrics(){const e=window.StudioAutonomy?.ensure?.(),s=e?.taskStates?.[TASK]||{};return{version:VERSION,registered:!!register.done,totalDecisions:s.totalDecisions||0,lastDate:s.lastDate||null,lastBatch:s.lastBatch||0,lastPopulation:s.lastPopulation||0,nextCursor:s.cursor||0,lastActionCounts:s.lastActionCounts||{}}}
function audit(){
 const p=population(),tests=[];const add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail});
 add('Population engine available',!!window.StudioPopulationEngine,'Phase 2 population API is loaded.');
 add('Autonomy controller available',!!window.StudioAutonomy,'Shared deterministic controller is loaded.');
 add('Daily NPC task registered',!!register.done,'Personal agency task is registered exactly once.');
 const s=metrics();add('Decision batch bounded',s.lastBatch<=MAX_DAILY,s.lastBatch+' decisions in latest batch; limit '+MAX_DAILY+'.');
 add('Decision cursor valid',!p||!p.npcs.length||s.nextCursor<p.npcs.length,'Cursor remains within materialized population.');
 add('NPC action state bounded',!p||p.npcs.every(n=>!n.autonomy||(n.autonomy.decisions>=0&&Object.values(n.autonomy.actionCounts||{}).every(v=>Number.isFinite(v)&&v>=0))),'Decision counts and action tallies are valid.');
 add('NPC needs remain bounded',!p||p.npcs.every(n=>!n.needs||Object.values(n.needs).every(v=>Number.isFinite(v)&&v>=0&&v<=100)),'All existing need values remain in [0,100].');
 add('NPC skill values remain bounded',!p||p.npcs.every(n=>!n.skills||Object.values(n.skills).every(v=>Number.isFinite(v)&&v>=0&&v<=100)),'All existing skill values remain in [0,100].');
 add('Campaign save serializable',!p||(()=>{try{JSON.stringify(p);return true}catch(e){return false}})(),'NPC decision state can be included in campaign saves.');
 return{passed:tests.filter(t=>t.ok).length,failed:tests.filter(t=>!t.ok).length,tests};
}
function attach(){register();if(!register.done)document.addEventListener('DOMContentLoaded',register);if(window.StudioPhase0?.registerModule){try{window.StudioPhase0.registerModule({id:'npc-personal-agency',name:'NPC personal agency',deps:['kernel','population-intelligence','autonomous-simulation'],owns:['need-driven daily decisions','personal goals','career intent','routine adaptation','bounded population scheduling'],status:'implemented'})}catch(e){}}}
window.StudioNPCAutonomy={version:VERSION,register,audit,metrics,decide};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();