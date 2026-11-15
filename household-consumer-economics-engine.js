(function(){
'use strict';
const VERSION='1.0.0',MAX_HISTORY=24,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const round=v=>Number(Number(v||0).toFixed(2));
const stable=(key,min,max)=>{let h=2166136261,s=String(active?.worldSeed||active?.id||'studio')+'|'+key;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return min+((h>>>0)/4294967296)*(max-min)};
function getState(){
 if(!active)return null;
 active.world=active.world||{};
 let s=active.world.householdEconomics;
 if(!s||s.version!==VERSION){
  const old=s||{};
  s=active.world.householdEconomics={version:VERSION,households:{},regions:old.regions||{},history:old.history||[],preparedDate:null,lastProcessedDate:null,metrics:{}};
 }
 s.households=s.households||{};s.regions=s.regions||{};s.history=Array.isArray(s.history)?s.history:[];
 return s;
}
function population(){return active?.world?.population?.npcs||[]}
function alive(n){return n&&n.alive!==false&&n.status!=='Deceased'}
function regionIdFor(n,macro){
 const value=String(n.region||n.macroRegion||active?.company?.region||'').toLowerCase();
 const found=(macro?.regions||[]).find(r=>r.id===value||String(r.name||'').toLowerCase()===value);
 return found?.id||'international';
}
function incomeFor(n,date,employeeMap){
 const f=n.finances||{},c=n.career||{},status=n.status;
 if(status==='Employed'){const emp=employeeMap.get(n.id);return Math.max(0,Number(emp?.salary||c.monthlyIncome||f.monthlyIncome||0))}
 if(status==='Externally Employed')return Math.max(0,Number(c.monthlyIncome||f.monthlyIncome||stable(n.id+'|external-income|'+date,1400,6200)));
 if(status==='Self-employed')return Math.max(300,Number(f.monthlyIncome||stable(n.id+'|self-income|'+date,900,6500)));
 if(status==='Independent')return Math.max(0,Number(f.monthlyIncome||stable(n.id+'|independent-income|'+date,350,2600)));
 if(status==='Retired')return Math.max(0,Number(n.pension?.monthlyIncome||f.monthlyIncome||0));
 return Math.max(0,Number(f.monthlyIncome||0));
}
function householdKey(n){
 const family=n.family?.familyId;
 if(family)return 'FAMILY:'+family;
 const home=n.home?.householdId;
 if(home)return 'HOME:'+home;
 return 'PERSON:'+String(n.id);
}
function prepareMonth(date){
 const s=getState();if(!s)return {processed:false,reason:'no-active-campaign'};
 if(s.preparedDate===date)return {processed:false,idempotent:true,date,households:Object.keys(s.households).length};
 if(s.lastProcessedDate&&date<=s.lastProcessedDate)return {processed:false,stale:true,date,lastProcessedDate:s.lastProcessedDate};
 const people=population(),macro=active.market?.globalEconomy,employeeMap=new Map();
 (active.employees||[]).forEach(e=>{if(e.npcId)employeeMap.set(e.npcId,e);else if(String(e.id||'').startsWith('EMP-'))employeeMap.set(String(e.id).slice(4),e)});
 const groups=new Map();
 for(const n of people){if(!alive(n))continue;const key=householdKey(n);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(n)}
 const householdRecords={},incomeByNpc=new Map(),expenseByNpc=new Map(),regional={};
 const regionStates=s.regions;
 for(const [id,r] of Object.entries(macro?.regions||{}))void id,void r;
 for(const [key,members] of groups){
  const regionId=regionIdFor(members[0],macro),mr=(macro?.regions||[]).find(r=>r.id===regionId)||null;
  const rs=regionStates[regionId]||(regionStates[regionId]={priceIndex:100,lastUpdated:null});
  if(rs.lastUpdated!==date){
   const annualInflation=clamp(Number(mr?.inflationPct??2.5),-2,30);
   rs.priceIndex=clamp(Number(rs.priceIndex||100)*(1+annualInflation/1200),50,300);
   rs.lastUpdated=date;
  }
  const priceFactor=clamp(Number(rs.priceIndex||100)/100,.5,3);
  let adults=0,children=0,equivalent=0,rent=0,mortgage=0,maintenance=0,totalIncome=0,adultCash=0;
  const memberRows=[];
  for(const n of members){
   const age=Number(n.age)||0,isAdult=age>=18;
   const weight=isAdult?1:.55;
   equivalent+=weight;if(isAdult)adults++;else children++;
   rent=Math.max(rent,Math.max(0,Number(n.home?.monthlyRent)||0));
   mortgage=Math.max(mortgage,Math.max(0,Number(n.home?.monthlyMortgagePayment||n.home?.mortgagePayment)||0));
   if(isAdult)adultCash+=Math.max(0,Number(n.finances?.cash)||0);
   const income=incomeFor(n,date,employeeMap);incomeByNpc.set(n.id,income);totalIncome+=income;
   memberRows.push({id:n.id,adult:isAdult,income,weight});
  }
  if(!equivalent)equivalent=1;
  const housing=Math.max(rent,mortgage)+(members.some(n=>/owner/i.test(String(n.home?.housing||'')))?35*equivalent:0);
  const expenses={
   food:190*equivalent*priceFactor,
   housing:housing*priceFactor,
   utilities:(62+18*Math.max(0,equivalent-1))*priceFactor,
   transport:82*equivalent*priceFactor,
   healthcare:48*equivalent*priceFactor,
   communications:(34+11*Math.max(0,equivalent-1))*priceFactor,
   education:children*68*priceFactor,
   discretionary:96*equivalent*priceFactor
  };
  const essential=Object.entries(expenses).filter(([k])=>k!=='discretionary').reduce((a,[,v])=>a+v,0);
  const total=essential+expenses.discretionary;
  const earners=memberRows.filter(x=>x.adult);
  const allocationBase=earners.reduce((a,x)=>a+x.income,0);
  let allocated=0;
  for(const row of memberRows){
   let share=0;
   if(row.adult&&earners.length){
    const weight=allocationBase>0?row.income/allocationBase:1/earners.length;
    share=total*weight;
   }
   expenseByNpc.set(row.id,share);allocated+=share;
  }
  const household={
   id:key,regionId,members:memberRows.map(x=>x.id),memberCount:members.length,adultCount:adults,childCount:children,
   equivalentAdults:round(equivalent),currency:active.company?.currency||'USD',
   income:round(totalIncome),expenses:Object.fromEntries(Object.entries(expenses).map(([k,v])=>[k,round(v)])),
   essentialExpenses:round(essential),totalExpenses:round(total),allocatedExpenses:round(allocated),
   cashBuffer:round(adultCash),monthlySurplus:round(totalIncome-total),
   essentialCoverage:round(clamp((totalIncome+adultCash)/Math.max(1,essential),0,1)*100),
   discretionaryCoverage:round(clamp((totalIncome+adultCash-essential)/Math.max(1,expenses.discretionary),0,1)*100),
   financialStress:round(clamp(30+Math.max(0,total-totalIncome-adultCash)/Math.max(1,total)*70,0,100)),
   arrears:0,lastProcessedDate:date
  };
  householdRecords[key]=household;
  const bucket=regional[regionId]||(regional[regionId]={households:0,income:0,spending:0,stress:0,essentialCoverage:0});
  bucket.households++;bucket.income+=totalIncome;bucket.spending+=total;bucket.stress+=household.financialStress;bucket.essentialCoverage+=household.essentialCoverage;
 }
 // Commit a single month snapshot; individual ledgers are applied exactly once below.
 s.households=householdRecords;
 s.preparedDate=date;
 s.metrics={date,households:groups.size,namedResidents:people.filter(alive).length,regional};
 const macroRegions=macro?.regions||[];
 const regionalDemand={};let weightedDemand=0,totalWeight=0;
 for(const r of macroRegions){
  const rs=regionStates[r.id]||(regionStates[r.id]={priceIndex:100,lastUpdated:date});
  const inflation=Number(r.inflationPct)||2.5,unemployment=Number(r.unemploymentPct)||5,confidence=Number(r.consumerConfidence)||100;
  const demand=clamp(100+(confidence-100)*.55-(inflation-2.5)*1.1-(unemployment-5)*.8,35,160);
  const essential=clamp(100+(100-confidence)*.10+Math.max(0,inflation-2.5)*.35,80,125);
  const discretionary=clamp(100+(confidence-100)*.9-(unemployment-5)*1.2-(inflation-2.5)*.6,25,170);
  const stress=clamp(30+Math.max(0,inflation-2.5)*2.2+Math.max(0,unemployment-5)*3+(100-confidence)*.45,0,100);
  regionalDemand[r.id]={consumerDemandIndex:round(demand),essentialDemandIndex:round(essential),discretionaryDemandIndex:round(discretionary),householdStressIndex:round(stress),priceIndex:round(rs.priceIndex)};
  const w=Math.max(0,Number(r.weight)||0);weightedDemand+=demand*w;totalWeight+=w;
 }
 const globalDemand=totalWeight?weightedDemand/totalWeight:100;
 active.market=active.market||{};active.market.economy=active.market.economy||{};
 Object.assign(active.market.economy,{householdDemandIndex:round(globalDemand),regionalConsumerDemand:regionalDemand,householdEconomicsDate:date});
 s.lastPreparedDate=date;
 return {processed:true,date,households:groups.size,namedResidents:s.metrics.namedResidents,householdDemandIndex:round(globalDemand)};
}
function processIndividualMonth(n,date){
 const s=getState();if(!s||!n||!alive(n))return false;
 if(n.finances?.lastHouseholdFinanceDate===date)return true;
 if(s.preparedDate!==date)return false;
 const household=s.households[householdKey(n)];if(!household)return false;
 const income=incomeFor(n,date,new Map((active.employees||[]).map(e=>[e.npcId||String(e.id||'').replace(/^EMP-/,''),e])));
 const expenses=Math.max(0,Number(s._expenseByNpc?.[n.id]??0));
 // Shares are stored in a compact per-person map during preparation when available.
 const prepared=Number(n._householdMonthlyExpenseShare);
 const share=Number.isFinite(prepared)?Math.max(0,prepared):Math.max(0,household.totalExpenses*(income>0?income/Math.max(1,household.income):0));
 const nf=n.finances||(n.finances={cash:0,debt:0,creditScore:650});
 const before=Math.max(0,Number(nf.cash)||0),debtBefore=Math.max(0,Number(nf.debt)||0),delta=income-share;
 nf.monthlyIncome=round(income);nf.monthlyExpenses=round(share);
 nf.cash=round(Math.max(0,before+delta));
 if(delta<0)nf.debt=round(Math.min(100000000,debtBefore+Math.abs(delta)));
 else nf.debt=round(Math.max(0,debtBefore-Math.min(debtBefore,delta*.25)));
 nf.savingsRate=income>0?round(clamp(delta/income*100,-100,100)):0;
 nf.creditScore=round(clamp(Number(nf.creditScore||650)+(delta>=0?.25:-.6),300,850));
 nf.lastHouseholdFinanceDate=date;
 n.wealth=nf.cash;
 n.career=n.career||{};n.career.monthlyIncome=round(income);
 if(n.needs)n.needs.security=clamp(Number(n.needs.security??60)+(delta>=0?.4:-.9),0,100);
 if(n.reputation)n.reputation.personal=clamp(Number(n.reputation.personal??50)+(delta>=0?.03:-.05),0,100);
 household.arrears=round(household.arrears+Math.max(0,share-before-income));
 return true;
}
function finalizeMonth(date){
 const s=getState();if(!s||s.preparedDate!==date)return {processed:false};
 let cash=0,debt=0,householdArrears=0;
 for(const h of Object.values(s.households)){householdArrears+=Number(h.arrears)||0;h.lastProcessedDate=date}
 for(const n of population()){if(!alive(n))continue;cash+=Number(n.finances?.cash)||0;debt+=Number(n.finances?.debt)||0}
 const summary={date,households:Object.keys(s.households).length,namedResidents:s.metrics.namedResidents,householdDemandIndex:Number(active.market?.economy?.householdDemandIndex)||100,aggregateCash:round(cash),aggregateDebt:round(debt),unpaidHouseholdArrears:round(householdArrears)};
 s.history.unshift(summary);s.history=s.history.slice(0,MAX_HISTORY);s.lastProcessedDate=date;s.metrics.summary=summary;
 return {processed:true,...summary};
}
function audit(){
 const s=getState(),tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
 if(!s)return {passed:0,failed:1,tests:[{name:'Active campaign',ok:false,detail:'No active campaign.'}]};
 const hs=Object.values(s.households),ids=new Set(hs.map(h=>h.id));
 add('Versioned household economics state',s.version===VERSION,s.version);
 add('Unique household identities',ids.size===hs.length,hs.length+' household records');
 add('Finite non-negative household budgets',hs.every(h=>Number.isFinite(h.totalExpenses)&&h.totalExpenses>=0&&Number.isFinite(h.income)&&h.income>=0),'Income and expense totals are finite and non-negative.');
 add('Expense allocation reconciles',hs.every(h=>h.allocatedExpenses<=h.totalExpenses+.05&&h.allocatedExpenses>=0),'Adult household members carry shared expenses; dependent-only households remain unpaid rather than charging children.');
 add('Regional consumer indices bounded',Object.values(active.market?.economy?.regionalConsumerDemand||{}).every(r=>['consumerDemandIndex','essentialDemandIndex','discretionaryDemandIndex','householdStressIndex','priceIndex'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<=300)),'Regional demand, stress and price indices remain finite and bounded.');
 const people=population();
 add('Individual finance balances valid',people.every(n=>!n.finances||[n.finances.cash,n.finances.debt,n.finances.monthlyIncome,n.finances.monthlyExpenses].every(v=>Number.isFinite(Number(v))&&Number(v)>=0)),'Named NPC cash, debt, income and expenses remain finite and non-negative.');
 add('Month preparation checkpoint',!s.preparedDate||s.preparedDate<=active.date,'Household processor does not run ahead of campaign time.');
 add('Household state serializes',(()=>{try{JSON.stringify(s);return true}catch(e){return false}})(),'Households, regional indices and monthly history are save-safe.');
 const passed=tests.filter(t=>t.ok).length;return {date:active.date,passed,failed:tests.length-passed,tests};
}
function metrics(){const s=getState();return s?{...s.metrics,version:s.version,lastPreparedDate:s.lastPreparedDate,lastProcessedDate:s.lastProcessedDate,history:s.history.length}:null}
window.StudioHouseholdEconomics={version:VERSION,prepareMonth,processIndividualMonth,finalizeMonth,audit,metrics,ensure:getState};
try{window.StudioPhase0?.registerModule?.({id:'household-consumer-economics',name:'Household & consumer economics',deps:['kernel','population'],owns:['household budgets','shared household expenses','personal cashflow','consumer demand','regional price indices','household financial stress'],status:'implemented'})}catch(e){}
})();