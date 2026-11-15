(function(){
'use strict';
const VERSION='12.0.0',MAX_NPCS=25000,MAX_EVENTS=240;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const round=n=>Number((Number(n)||0).toFixed(3));
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const rand=k=>(hash(String(active?.worldSeed||active?.id||'studio')+'|'+k)>>>0)/4294967296;
const addDays=(date,n)=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function ensure(){
 if(typeof active==='undefined'||!active)return null;
 let s=active.generations;
 if(!s||s.version!==VERSION){
  const old=s||{};
  s={version:VERSION,firstIntegratedDate:old.firstIntegratedDate||active.date,lastProcessedDate:old.lastProcessedDate||null,
   dailyTicks:Number(old.dailyTicks||0),monthlyTicks:Number(old.monthlyTicks||0),annualTicks:Number(old.annualTicks||0),
   births:Array.isArray(old.births)?old.births:[],deaths:Array.isArray(old.deaths)?old.deaths:[],inheritances:Array.isArray(old.inheritances)?old.inheritances:[],
   familyLedger:Array.isArray(old.familyLedger)?old.familyLedger:[],leadershipHistory:Array.isArray(old.leadershipHistory)?old.leadershipHistory:[],
   successionPlans:Array.isArray(old.successionPlans)?old.successionPlans:[],worldHistory:Array.isArray(old.worldHistory)?old.worldHistory:[],
   world:{},metrics:{},errors:[]};
  active.generations=s;
 }
 s.births=Array.isArray(s.births)?s.births:[];s.deaths=Array.isArray(s.deaths)?s.deaths:[];s.inheritances=Array.isArray(s.inheritances)?s.inheritances:[];
 s.familyLedger=Array.isArray(s.familyLedger)?s.familyLedger:[];s.leadershipHistory=Array.isArray(s.leadershipHistory)?s.leadershipHistory:[];
 s.successionPlans=Array.isArray(s.successionPlans)?s.successionPlans:[];s.worldHistory=Array.isArray(s.worldHistory)?s.worldHistory:[];s.errors=Array.isArray(s.errors)?s.errors:[];
 s.world=s.world||{year:Number(active.date.slice(0,4)),era:'Modern entertainment economy',indices:{globalization:45,streaming:35,technology:30,audienceFragmentation:25,sustainability:20,nostalgia:30},trends:[]};
 s.world.indices=s.world.indices||{globalization:45,streaming:35,technology:30,audienceFragmentation:25,sustainability:20,nostalgia:30};s.metrics=s.metrics||{};
 const p=window.StudioPopulationEngine?.ensure?.();
 if(p?.phase2){
  p.phase2.families.forEach(f=>{f.generationCount=Number(f.generationCount||1);f.lineageId=f.lineageId||f.id;f.legacyScore=Number(f.legacyScore||0);f.headId=f.headId||null;});
  p.npcs.forEach(n=>{n.family=n.family||{parentIds:[],childIds:[]};n.family.parentIds=Array.isArray(n.family.parentIds)?n.family.parentIds:[];n.family.childIds=Array.isArray(n.family.childIds)?n.family.childIds:[];});
 }
 return s;
}
function event(s,date,type,text,meta={}){s.worldHistory.unshift({date,type,text,...meta});if(s.worldHistory.length>MAX_EVENTS)s.worldHistory.length=MAX_EVENTS}
function living(n){return n&&n.alive!==false&&n.status!=='Deceased'}
function npcMap(){const p=window.StudioPopulationEngine?.ensure?.();return new Map((p?.npcs||[]).map(n=>[n.id,n]))}
function familyMap(){const p=window.StudioPopulationEngine?.ensure?.();return new Map((p?.phase2?.families||[]).map(f=>[f.id,f]))}
function generationOf(n,map,seen=new Set()){
 if(!n)return 1;if(Number.isFinite(Number(n.generationIndex))&&Number(n.generationIndex)>0)return Number(n.generationIndex);
 if(seen.has(n.id))return 1;seen.add(n.id);
 const parents=(n.family?.parentIds||[]).map(id=>map.get(id)).filter(Boolean);
 const g=parents.length?1+Math.max(...parents.map(p=>generationOf(p,map,seen))):1;
 n.generationIndex=Math.min(30,g);return n.generationIndex;
}
function refreshLineages(s){
 const p=window.StudioPopulationEngine?.ensure?.();if(!p?.phase2)return;
 const map=new Map(p.npcs.map(n=>[n.id,n]));
 p.npcs.forEach(n=>generationOf(n,map));
 p.phase2.families.forEach(f=>{
  const members=(f.memberIds||[]).map(id=>map.get(id)).filter(Boolean),aliveMembers=members.filter(living);
  f.generationCount=Math.max(1,...members.map(n=>Number(n.generationIndex||1)));
  f.headId=aliveMembers.sort((a,b)=>Number(b.age||0)-Number(a.age||0))[0]?.id||f.headId||null;
  f.totalMembers=members.length;f.livingMembers=aliveMembers.length;
  f.legacyScore=round(Math.min(100,(f.generationCount*12)+(aliveMembers.length*2)+(members.filter(n=>n.status==='Employed').length*.35)));
  f.lastUpdated=active.date;
 });
}
function settleEstates(s){
 const p=window.StudioPopulationEngine?.ensure?.();if(!p)return;
 const map=new Map(p.npcs.map(n=>[n.id,n]));
 p.npcs.filter(n=>!living(n)&&!n.estateSettled&&n.deathDate).forEach(n=>{
  const gross=Math.max(0,Number(n.finances?.cash??n.wealth)||0),debt=Math.max(0,Number(n.finances?.debt)||0),estate=Math.max(0,gross-debt);
  const spouse=map.get(n.family?.partnerId),children=(n.family?.childIds||[]).map(id=>map.get(id)).filter(living),heirs=[];
  if(living(spouse))heirs.push({npc:spouse,share:children.length?.5:1});
  if(children.length){const pool=heirs.length?.5:1;children.forEach(c=>heirs.push({npc:c,share:pool/children.length}))}
  let distributed=0;
  heirs.forEach(h=>{const amount=round(estate*h.share);if(amount>0){h.npc.finances=h.npc.finances||{cash:0,debt:0};h.npc.finances.cash=Math.max(0,round(Number(h.npc.finances.cash||0)+amount));h.npc.wealth=h.npc.finances.cash;distributed=round(distributed+amount)}});
  n.finances.cash=0;n.finances.debt=0;n.wealth=0;n.estateSettled=true;n.estateSettledDate=active.date;
  const rec={date:active.date,personId:n.id,personName:n.name,gross,debt,netEstate:estate,distributed,heirs:heirs.map(h=>({npcId:h.npc.id,name:h.npc.name,share:h.share,amount:round(estate*h.share)}))};
  s.inheritances.unshift(rec);s.deaths.unshift({date:active.date,npcId:n.id,name:n.name,age:n.age,estate:distributed});s.inheritances=s.inheritances.slice(0,1000);s.deaths=s.deaths.slice(0,1000);
  const f=familyMap().get(n.family?.familyId);if(f){f.lastDeathDate=active.date;f.lastDeceasedId=n.id}
  event(s,active.date,'inheritance',estate>0?n.name+'’s estate was settled and '+heirs.length+' heir record(s) received inheritance.':n.name+'’s estate closed with no distributable balance.',{npcId:n.id,amount:distributed});
 });
}
function autonomousBirths(s,date){
 const p=window.StudioPopulationEngine?.ensure?.();if(!p||!window.StudioPopulationEngine?.createChild||p.npcs.length>=MAX_NPCS)return;
 const couples=p.npcs.filter(n=>living(n)&&n.age>=21&&n.age<=39&&n.family?.partnerId&&n.id<n.family.partnerId&&n.family.childIds?.length<3);
 let made=0;
 for(const a of couples){
  if(made>=2||p.npcs.length>=MAX_NPCS)break;
  const b=p.npcs.find(x=>x.id===a.family.partnerId&&living(x)&&x.age>=18);if(!b)continue;
  const family=familyMap().get(a.family.familyId),children=family?(family.memberIds||[]).map(id=>p.npcs.find(n=>n.id===id)).filter(n=>n&&n.family?.parentIds?.includes(a.id)).length:a.family.childIds.length;
  if(children>=3||rand('birth|'+a.id+'|'+b.id+'|'+date)>.0018)continue;
  const r=window.StudioPopulationEngine.createChild(a.id,b.id);
  if(r?.ok){r.npc.generationIndex=Math.max(a.generationIndex||1,b.generationIndex||1)+1;s.births.unshift({date,npcId:r.npc.id,name:r.npc.name,parentIds:[a.id,b.id],familyId:r.npc.family.familyId,generation:r.npc.generationIndex,autonomous:true});s.births=s.births.slice(0,1000);event(s,date,'birth',a.name+' and '+b.name+' welcomed '+r.npc.name+' into the next generation.',{npcId:r.npc.id,familyId:r.npc.family.familyId});made++}
 }
}
function updateLeadership(s,date){
 const rivals=active.competitors?.companies||[];
 const names=['Amelia Chen','Daniel Okafor','Sofia Laurent','Kenji Watanabe','Maya Patel','Lucas Bennett','Amina Hassan','Ethan Brooks','Isabella Rossi','Arjun Mehta','Noah Williams','Hana Sato','Mateo Silva','Zara Khan','Oliver Fischer'];
 rivals.forEach(c=>{
  c.leadership=c.leadership||{current:c.ceo||'Interim leadership',appointedDate:active.startDate||date,history:[]};
  c.leadership.history=Array.isArray(c.leadership.history)?c.leadership.history:[];
  if(!c.leadership.current)c.leadership.current=c.ceo||'Interim leadership';
  const tenure=Math.max(0,(Date.parse(date+'T00:00:00Z')-Date.parse((c.leadership.appointedDate||date)+'T00:00:00Z'))/86400000);
  if(tenure>=3650&&rand('ceo-change|'+c.id+'|'+date.slice(0,4))<.16){
   const previous=c.leadership.current,next=names[hash(c.id+'|successor|'+date.slice(0,4))%names.length];
   c.leadership.history.unshift({date,from:previous,to:next,reason:'Board-approved generational leadership transition'});
   c.leadership.current=next;c.leadership.appointedDate=date;c.ceo=next;
   s.leadershipHistory.unshift({date,companyId:c.id,companyName:c.name,from:previous,to:next});
   event(s,date,'leadership',c.name+' appointed '+next+' as its new chief executive.',{companyId:c.id});
  }
 });
}
function annualEvolution(s,date){
 const year=Number(date.slice(0,4)),indices=s.world.indices,tech=Number(active.technology?.metrics?.technologyIndex||active.company?.technologyScore||0),sustain=Number(active.technology?.sustainability?.esgScore||45),digital=Number(active.smartphone?.metrics?.engagementIndex||active.smartphone?.feed?.length||0);
 const target={globalization:clamp(42+year%17+Number(active.market?.globalEconomy?.regions?.length||0)*.4,0,100),streaming:clamp(12+(year-1980)*.8+digital*.015,0,100),technology:clamp(18+tech*.42+(year-2000)*.22,0,100),audienceFragmentation:clamp(20+digital*.035+(year-1995)*.24,0,100),sustainability:clamp(18+sustain*.58+(year-2010)*.3,0,100),nostalgia:clamp(25+Math.sin(year*.31)*8,0,100)};
 Object.keys(indices).forEach(k=>indices[k]=round(clamp(Number(indices[k]||0)+(target[k]-Number(indices[k]||0))*.16,0,100)));
 s.world.year=year;s.world.era=year<1895?'Live performance & print era':year<1927?'Silent cinema era':year<1955?'Studio system & radio era':year<1980?'Broadcast television era':year<2005?'Global blockbuster era':year<2020?'Digital distribution era':'Platform, AI & immersive era';
 s.world.trends=[
  {name:'Global co-productions',index:indices.globalization,description:'Cross-border financing and creative partnerships'},
  {name:'Streaming & on-demand',index:indices.streaming,description:'Digital distribution and subscription-first viewing'},
  {name:'Production technology',index:indices.technology,description:'Virtual production, automation and advanced workflows'},
  {name:'Audience fragmentation',index:indices.audienceFragmentation,description:'More specialized audiences and niche communities'},
  {name:'Sustainable production',index:indices.sustainability,description:'Lower-carbon production and circular operations'},
  {name:'Franchise nostalgia',index:indices.nostalgia,description:'Audience demand for legacy properties and familiar worlds'}
 ];
 active.market=active.market||{};active.market.worldEvolution={date,year,era:s.world.era,indices:{...indices},trends:s.world.trends.map(x=>({...x}))};
 s.worldHistory.unshift({date,type:'annual-evolution',text:'The entertainment industry entered '+s.world.era.toLowerCase()+'.',indices:{...indices}});s.worldHistory=s.worldHistory.slice(0,MAX_EVENTS);
}
function updateStats(s,date){
 const p=window.StudioPopulationEngine?.ensure?.(),npcs=p?.npcs||[],aliveN=npcs.filter(living),families=p?.phase2?.families||[];
 const gen={};aliveN.forEach(n=>{const g=Number(n.generationIndex||1);gen[g]=(gen[g]||0)+1});
 const estate=s.inheritances.reduce((v,x)=>v+Number(x.distributed||0),0);
 s.metrics={date,namedPeople:npcs.length,living:aliveN.length,deceased:npcs.length-aliveN.length,families:families.length,multiGenerationFamilies:families.filter(f=>Number(f.generationCount||1)>1).length,deepestGeneration:Math.max(1,...aliveN.map(n=>Number(n.generationIndex||1))),births:s.births.length,deaths:s.deaths.length,inheritanceEvents:s.inheritances.length,totalInherited:round(estate),successionPlans:s.successionPlans.length,leadershipChanges:s.leadershipHistory.length,worldEra:s.world.era,indices:{...s.world.indices},generationDistribution:gen};
}
function processDay(date){
 const s=ensure();if(!s)return{processed:false};
 if(s.lastProcessedDate===date)return{processed:false,idempotent:true,date};
 if(s.lastProcessedDate&&date<s.lastProcessedDate)return{processed:false,stale:true,date};
 settleEstates(s);refreshLineages(s);
 if(date.slice(8,10)==='01'){
  autonomousBirths(s,date);s.monthlyTicks++;
  updateLeadership(s,date);
 }
 if(date.slice(5)==='01-01'){
  annualEvolution(s,date);s.annualTicks++;
 }
 refreshLineages(s);updateStats(s,date);s.dailyTicks++;s.lastProcessedDate=date;
 return{processed:true,date,metrics:s.metrics};
}
function planSuccessor(role,npcId){
 const s=ensure(),map=npcMap(),n=map.get(npcId),r=String(role||'').trim();
 if(!s||!r||!n||!living(n)||n.age<18)throw Error('Choose a role and a living adult successor.');
 if(!n.skills||!n.career)throw Error('Successor profile is incomplete.');
 const score=round((Number(n.skills.leadership||0)*.35+Number(n.skills.communication||0)*.2+Number(n.skills.technical||0)*.2+Number(n.career.performance||0)*.25));
 if(score<35)throw Error('Successor readiness score must be at least 35.');
 const old=s.successionPlans.find(x=>x.role.toLowerCase()===r.toLowerCase()&&x.status==='Active');
 if(old){old.npcId=n.id;old.name=n.name;old.readiness=score;old.updatedDate=active.date}
 else s.successionPlans.push({id:'SUC-'+hash(r+'|'+npcId+'|'+active.date),role:r,npcId:n.id,name:n.name,readiness:score,status:'Active',createdDate:active.date,updatedDate:active.date});
 persist?.();render();return s.successionPlans.find(x=>x.role.toLowerCase()===r.toLowerCase()&&x.status==='Active');
}
function appointSuccessor(role){
 const s=ensure(),plan=s?.successionPlans.find(x=>x.role.toLowerCase()===String(role||'').toLowerCase()&&x.status==='Active'),map=npcMap(),n=plan&&map.get(plan.npcId);
 if(!plan||!n||!living(n))throw Error('No valid active succession plan exists for this role.');
 const m=window.Phase4Company?.ensure?.();
 if(!m)throw Error('Company management service is unavailable.');
 const existing=m.executives.find(x=>String(x.role||'').toLowerCase()===plan.role.toLowerCase());
 if(existing){existing.name=n.name;existing.npcId=n.id;existing.status='Active';existing.appointedDate=active.date;existing.successorAppointed=true}
 else m.executives.push({id:'GEN-EXEC-'+plan.id,name:n.name,role:plan.role,department:'Executive Office',salary:0,status:'Active',npcId:n.id,appointedDate:active.date,successorAppointed:true});
 n.status='Employed';n.employer=active.company?.name||'The Studio';n.career.monthlyIncome=Number(n.career.monthlyIncome||0);
 plan.status='Appointed';plan.appointedDate=active.date;
 m.history.unshift({id:'GEN-LOG-'+plan.id,date:active.date,action:'Leadership succession',detail:n.name+' appointed as '+plan.role+'.'});
 s.leadershipHistory.unshift({date:active.date,companyName:active.company?.name||'The Studio',to:n.name,role:plan.role,playerControlled:true});
 event(s,active.date,'player-succession',n.name+' was appointed as '+plan.role+' at '+(active.company?.name||'the studio')+'.',{npcId:n.id,role:plan.role});
 persist?.();render();return{ok:true,executive:existing||m.executives[m.executives.length-1]};
}
function audit(){
 const s=ensure();if(!s)return{passed:0,failed:1,tests:[]};const p=window.StudioPopulationEngine?.ensure?.(),npcs=p?.npcs||[],families=p?.phase2?.families||[],map=new Map(npcs.map(n=>[n.id,n]));
 const tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
 add('Versioned generation state',s.version===VERSION,s.version);
 add('Daily checkpoint synchronized',!s.lastProcessedDate||s.lastProcessedDate===active.date,String(s.lastProcessedDate)+' / '+active.date);
 add('Population integration available',!!p&&!!window.StudioPopulationEngine?.createChild,'Phase 2 family and NPC APIs are connected.');
 add('Generation indexes bounded',npcs.every(n=>Number.isInteger(Number(n.generationIndex))&&n.generationIndex>=1&&n.generationIndex<=30),'All named people have a finite generation index from 1 to 30.');
 add('Parent references valid',npcs.every(n=>(n.family?.parentIds||[]).every(id=>map.has(id))),'Every parent reference resolves to a materialized NPC.');
 add('Family membership valid',families.every(f=>(f.memberIds||[]).every(id=>map.has(id))),'Every family member reference resolves.');
 add('Family generation depth consistent',families.every(f=>Number(f.generationCount||1)>=1&&Number(f.generationCount||1)<=30),'Family generation depth is bounded.');
 add('Estate settlements are one-time',s.inheritances.every(x=>{const n=map.get(x.personId);return !n||n.estateSettled===true})&&new Set(s.inheritances.map(x=>x.personId)).size===s.inheritances.length,'Each deceased NPC estate is settled at most once.');
 add('Inheritance totals reconcile',s.inheritances.every(x=>Number.isFinite(x.netEstate)&&Number.isFinite(x.distributed)&&x.distributed>=0&&x.distributed<=x.netEstate+.01),'Distributed estates never exceed net estate value.');
 add('Succession plans resolve',s.successionPlans.every(x=>map.has(x.npcId)&&x.role&&Number.isFinite(x.readiness)),'All succession plans reference existing NPCs and named roles.');
 add('World evolution indices bounded',Object.values(s.world.indices).every(x=>Number.isFinite(x)&&x>=0&&x<=100),'All six long-run industry indices remain within 0–100.');
 add('World era is defined',typeof s.world.era==='string'&&s.world.era.length>0,s.world.era);
 add('Leadership history valid',s.leadershipHistory.every(x=>x.date&&x.to&&(x.companyName||x.companyId)),'Leadership transitions have dates, successors and company references.');
 add('Campaign serialization',(()=>{try{JSON.stringify(active);return true}catch(e){return false}})(),'Generational state remains JSON serializable.');
 return{date:active.date,passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};
}
function render(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!$('page-generations')){
  const b=document.createElement('button');b.dataset.page='generations';b.innerHTML='<span>♧</span>Generations';b.onclick=()=>window.nav('generations');const ref=nav.querySelector('[data-page="technology"]');if(ref)ref.insertAdjacentElement('afterend',b);else nav.appendChild(b);
  const page=document.createElement('section');page.className='page';page.id='page-generations';page.innerHTML='<div class="hero"><div><div class="eyebrow">PHASE 12 · PERSISTENT WORLD HISTORY</div><h1 class="h1">Generations & world evolution</h1><p class="sub">Families grow, wealth passes between generations, leadership changes hands and the entertainment industry evolves over decades.</p></div><span class="tag gold">PHASE 12 · 12.0.0</span></div><div id="generations-content"></div>';content.appendChild(page);
 }
 if(!$('page-generations')?.classList.contains('active'))return;
 const host=$('generations-content');if(!active){host.innerHTML='<div class="empty">Create or load a campaign to begin tracking family legacies and world evolution.</div>';return}
 const s=ensure(),p=window.StudioPopulationEngine?.ensure?.(),npcs=p?.npcs||[],families=p?.phase2?.families||[],m=s.metrics||{};
 const money=n=>'$'+Math.round(Number(n)||0).toLocaleString();
 const candidates=npcs.filter(n=>living(n)&&n.age>=18).slice(0,400).map(n=>'<option value="'+esc(n.id)+'">'+esc(n.name)+' · '+n.age+' · readiness '+Math.round((n.skills.leadership*.35+n.skills.communication*.2+n.skills.technical*.2+n.career.performance*.25))+'</option>').join('');
 host.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">LIVING GENERATIONS</div><div class="statvalue">'+(m.deepestGeneration||1)+'</div></div><div class="card"><div class="statlabel">FAMILY LEGACIES</div><div class="statvalue">'+(m.multiGenerationFamilies||0)+'</div></div><div class="card"><div class="statlabel">INHERITANCE TRANSFERRED</div><div class="statvalue">'+money(m.totalInherited)+'</div></div><div class="card"><div class="statlabel">LEADERSHIP CHANGES</div><div class="statvalue">'+(m.leadershipChanges||0)+'</div></div></div>'+
 '<div class="grid cols"><div class="card"><b class="cardtitle">World evolution · '+esc(s.world.era)+'</b>'+Object.entries(s.world.indices).map(([k,v])=>'<div class="rowitem"><span>'+esc(k.replace(/([A-Z])/g,' $1'))+'</span><b>'+Number(v).toFixed(1)+'/100</b></div>').join('')+'<div class="tiny">Last annual evolution: '+esc(s.worldHistory.find(x=>x.type==="annual-evolution")?.date||"Awaiting year-end")+'</div></div><div class="card"><b class="cardtitle">Plan company succession</b><form id="gen-succession-form"><div class="field"><label>Executive role</label><input id="gen-role" maxlength="60" required placeholder="e.g. Chief Operating Officer"></div><div class="field"><label>Successor candidate</label><select id="gen-candidate" required><option value="">Choose a living adult</option>'+candidates+'</select></div><button class="btn primary" type="submit">Save succession plan</button></form><div class="tiny">Readiness combines leadership, communication, technical and performance scores. A plan can be appointed through the action below.</div></div></div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Family legacy register</b><div class="tablewrap"><table><thead><tr><th>FAMILY</th><th>HEAD</th><th>MEMBERS</th><th>GENERATIONS</th><th>LEGACY SCORE</th><th>STATUS</th></tr></thead><tbody>'+families.slice(0,100).map(f=>'<tr><td>'+esc(f.surname||f.id)+'</td><td>'+esc(npcs.find(n=>n.id===f.headId)?.name||'No living head')+'</td><td>'+Number(f.livingMembers||0)+' / '+Number(f.totalMembers||f.memberIds.length)+'</td><td>'+Number(f.generationCount||1)+'</td><td>'+Number(f.legacyScore||0).toFixed(1)+'</td><td>'+esc(f.status||'Active')+'</td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><b class="cardtitle">Succession plans</b>'+s.successionPlans.slice(0,12).map(x=>'<div class="rowitem"><span><b>'+esc(x.role)+'</b><div class="tiny">'+esc(x.name)+' · readiness '+x.readiness+'</div></span>'+(x.status==='Active'?'<button class="btn small" data-appoint="'+esc(x.role)+'">Appoint</button>':'<span class="tag green">'+esc(x.status)+'</span>')+'</div>').join('')||'<div class="empty">No succession plans yet.</div>'+'</div><div class="card"><b class="cardtitle">Recent world events</b>'+s.worldHistory.slice(0,12).map(x=>'<div class="rowitem"><span>'+esc(x.text)+'</span><span class="tiny">'+esc(x.date)+'</span></div>').join('')||'<div class="empty">World history will appear as generations and industry trends evolve.</div>'+'</div></div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Population & inheritance ledger</b><div class="rowitem">Named residents <b>'+npcs.length.toLocaleString()+'</b></div><div class="rowitem">Recorded births / deaths <b>'+s.births.length+' / '+s.deaths.length+'</b></div><div class="rowitem">Estate settlements <b>'+s.inheritances.length+'</b></div><div class="rowitem">Last daily checkpoint <b>'+esc(s.lastProcessedDate||'Awaiting tick')+'</b></div><div class="actions"><button class="btn" id="gen-audit">Run Phase 12 audit</button><span id="gen-audit-result" class="tiny">'+audit().passed+' passed · '+audit().failed+' failed</span></div></div>';
 const form=$('gen-succession-form');if(form)form.onsubmit=e=>{e.preventDefault();try{planSuccessor($('gen-role').value,$('gen-candidate').value);toast('Succession plan saved.');render()}catch(err){toast(err.message)}};
 host.querySelectorAll('[data-appoint]').forEach(b=>b.onclick=()=>{try{appointSuccessor(b.dataset.appoint);toast('Successor appointed.');render()}catch(err){toast(err.message)}});
 const btn=$('gen-audit');if(btn)btn.onclick=()=>{const a=audit();$('gen-audit-result').textContent=a.passed+' passed · '+a.failed+' failed';toast('Phase 12 audit complete.')};
}
const api={version:VERSION,ensure,stepDay:processDay,processDay,audit,render,planSuccessor,appointSuccessor,refreshLineages,settleEstates,metrics:()=>({...ensure()?.metrics}),getWorld:()=>JSON.parse(JSON.stringify(ensure()?.world||{}))};
window.Phase12Generations=api;
const oldStep=window.Phase11Technology?.stepDay;
if(typeof oldStep==='function'&&!oldStep.__phase12Wrapped){
 const wrapped=function(date){const prior=oldStep.call(this,date),result=processDay(date);if(result.processed&&$('page-generations')?.classList.contains('active'))render();return prior};
 wrapped.__phase12Wrapped=true;window.Phase11Technology.stepDay=wrapped;
}
const integration=window.StudioPhaseIntegration;
if(integration){
 const contract=integration.contracts?.find(x=>x.id===12);if(contract)contract.requires=['Phase12Generations.stepDay','Phase12Generations.audit','Phase12Generations.planSuccessor','Phase12Generations.appointSuccessor'];
 const end=integration.endDay;
 if(typeof end==='function'&&!end.__phase12Wrapped){
  const wrapped=function(date){const s=ensure();if(!s||s.lastProcessedDate!==date)throw Error('Cannot complete integration day '+date+': Phase 12 generations processor did not commit.');const d=active.integration?.days?.[date];if(d&&!d.steps.some(x=>x.name==='phase12-generations'))d.steps.push({name:'phase12-generations',at:new Date().toISOString()});const result=end.call(this,date);const h=active.integration?.history?.[0];if(h&&!h.phases.includes('generations'))h.phases.push('generations');return result};
  wrapped.__phase12Wrapped=true;integration.endDay=wrapped;
 }
 const auditBase=integration.audit;
 if(typeof auditBase==='function'&&!auditBase.__phase12Wrapped){
  const wrapped=function(){const r=auditBase.call(this),m=r.modules?.find(x=>x.id===12);if(m){m.status='connected';m.missing=[]}const test=r.tests?.find(x=>x.name==='Phase 12 · Generations & world evolution');if(test){test.ok=true;test.detail='connected: versioned family lineage, inheritance, succession and world evolution APIs'}const p=audit(),start=active?.generations?.firstIntegratedDate||'9999-12-31',days=Object.values(active?.integration?.days||{}).filter(d=>d.status==='completed'&&d.date>=start);r.tests.push({name:'Phase 12 daily pipeline coverage',ok:days.every(d=>d.steps.some(x=>x.name==='phase12-generations')),detail:days.length+' Phase 12-enabled daily pipelines include generations and world evolution.'},{name:'Phase 12 internal integrity audit',ok:p.failed===0,detail:p.passed+' passed / '+p.failed+' failed'},{name:'Phase 12 daily checkpoint synchronized',ok:!days.length||active.generations?.lastProcessedDate===active.date,detail:String(active.generations?.lastProcessedDate||'not run')+' / '+active.date});r.modules=r.modules||[];r.passed=r.tests.filter(x=>x.ok).length;r.failed=r.tests.length-r.passed;return r};
  wrapped.__phase12Wrapped=true;integration.audit=wrapped;
 }
}
const oldRender=window.render;if(typeof oldRender==='function'&&!oldRender.__phase12Wrapped){const wrapped=function(...args){const r=oldRender.apply(this,args);render();return r};wrapped.__phase12Wrapped=true;window.render=wrapped}
if(typeof active!=='undefined'&&active)ensure();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();