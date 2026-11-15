(function(){
'use strict';
const VERSION='1.1.0',MAX_HISTORY=36,MAX_NPCS=25000,MAX_HOUSEHOLD_SAMPLES=500;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const round=v=>Number(Number(v||0).toFixed(2));
const stable=(key,min,max)=>{let h=2166136261,s=String(active?.worldSeed||active?.id||'studio')+'|'+key;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return min+((h>>>0)/4294967296)*(max-min)};
function getState(){
 if(!active)return null;
 active.world=active.world||{};
 let s=active.world.householdEconomics;
 if(!s||s.version!==VERSION){
  const old=s||{};
  s=active.world.householdEconomics={version:VERSION,households:{},pendingFinance:{},regions:old.regions||{},history:old.history||[],bankruptcyEvents:old.bankruptcyEvents||[],preparedDate:null,lastProcessedDate:old.lastProcessedDate||null,metrics:{}};
 }
 s.households=s.households||{};s.pendingFinance=s.pendingFinance||{};s.regions=s.regions||{};s.history=Array.isArray(s.history)?s.history:[];s.bankruptcyEvents=Array.isArray(s.bankruptcyEvents)?s.bankruptcyEvents:[];
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
 const family=n.family?.familyId;if(family)return 'FAMILY:'+family;
 const home=n.home?.householdId;if(home)return 'HOME:'+home;
 return 'PERSON:'+String(n.id);
}
function prepareMonth(date){
 const s=getState();if(!s)return {processed:false,reason:'no-active-campaign'};
 if(s.preparedDate===date)return {processed:false,idempotent:true,date,households:Number(s.metrics?.households)||Object.keys(s.households).length};
 if(s.lastProcessedDate&&date<=s.lastProcessedDate)return {processed:false,stale:true,date,lastProcessedDate:s.lastProcessedDate};
 const people=population().slice(0,MAX_NPCS),macro=active.market?.globalEconomy,employeeMap=new Map();
 (active.employees||[]).forEach(e=>{if(e.npcId)employeeMap.set(e.npcId,e);else if(String(e.id||'').startsWith('EMP-'))employeeMap.set(String(e.id).slice(4),e)});
 const groups=new Map();
 for(const n of people){if(!alive(n))continue;const key=householdKey(n);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(n)}
 const householdRecords={},pendingFinance={},regional={},regionStates=s.regions;let storedHouseholdCount=0;
 for(const mr of macro?.regions||[]){
  const rs=regionStates[mr.id]||(regionStates[mr.id]={priceIndex:100,lastUpdated:null});
  if(rs.lastUpdated!==date){const annualInflation=clamp(Number(mr.inflationPct??2.5),-2,30);rs.priceIndex=clamp(Number(rs.priceIndex||100)*(1+annualInflation/1200),50,300);rs.monthlyHousingGrowth=clamp(1+annualInflation/1200+.0002,.999,1.004);rs.housingPriceIndex=clamp(Number(rs.housingPriceIndex||100)*rs.monthlyHousingGrowth,50,400);rs.lastUpdated=date}
 }
 for(const [key,members] of groups){
  const regionId=regionIdFor(members[0],macro),mr=(macro?.regions||[]).find(r=>r.id===regionId)||null;
  const rs=regionStates[regionId]||(regionStates[regionId]={priceIndex:100,lastUpdated:date});
  const priceFactor=clamp(Number(rs.priceIndex||100)/100,.5,3),housingGrowth=clamp(Number(rs.monthlyHousingGrowth)||1,.999,1.004);
  for(const n of members){const home=n.home;if(home&&Number(home.propertyValue)>0&&home.housingLastUpdated!==date){home.propertyValue=round(Number(home.propertyValue)*housingGrowth);home.housingLastUpdated=date}}
  let adults=0,children=0,equivalent=0,rent=0,mortgage=0,propertyValue=0,mortgageBalance=0,mortgageRatePct=0,adultCash=0,totalIncome=0,creditCapacity=0;
  const memberRows=[];
  for(const n of members){
   const age=Number(n.age)||0,isAdult=age>=18,weight=isAdult?1:.55;
   equivalent+=weight;if(isAdult)adults++;else children++;
   rent=Math.max(rent,Math.max(0,Number(n.home?.monthlyRent)||0));
   mortgage=Math.max(mortgage,Math.max(0,Number(n.home?.monthlyMortgagePayment||n.home?.mortgagePayment)||0));
   propertyValue=Math.max(propertyValue,Math.max(0,Number(n.home?.propertyValue)||0));mortgageBalance=Math.max(mortgageBalance,Math.max(0,Number(n.home?.mortgageBalance)||0));mortgageRatePct=Math.max(mortgageRatePct,Math.max(0,Number(n.home?.mortgageRatePct)||0));
   if(isAdult){
    adultCash+=Math.max(0,Number(n.finances?.cash)||0);
    const score=clamp(Number(n.finances?.creditScore||650),300,850),factor=clamp((score-500)/350,0,1);
    creditCapacity+=Math.max(0,Number(n.finances?.monthlyIncome||n.career?.monthlyIncome||0))*4*factor;
   }
   const income=incomeFor(n,date,employeeMap);totalIncome+=income;
   memberRows.push({id:n.id,adult:isAdult,income,weight});
  }
  if(!equivalent)equivalent=1;
  const tenure=String(members.find(n=>n.home?.housing||n.home?.tenure)?.home?.housing||members.find(n=>n.home?.tenure)?.home?.tenure||'unknown').toLowerCase();
  const owner=members.some(n=>n.home?.owner===true||/owner|owned|mortgage/.test(String(n.home?.housing||n.home?.tenure||'').toLowerCase()));
  const housing=Math.max(rent,mortgage)+(owner?35*equivalent:0);
  const confidence=clamp(Number(mr?.consumerConfidence??100),40,160),inflation=clamp(Number(mr?.inflationPct??2.5),-2,30);
  const expenses={
   food:190*equivalent*priceFactor,
   housing:housing*priceFactor,
   utilities:(62+18*Math.max(0,equivalent-1))*priceFactor,
   transport:82*equivalent*priceFactor,
   healthcare:48*equivalent*priceFactor,
   communications:(34+11*Math.max(0,equivalent-1))*priceFactor,
   education:children*68*priceFactor,
   discretionary:0
  };
  const essential=Object.entries(expenses).filter(([k])=>k!=='discretionary').reduce((a,[,v])=>a+v,0);
  const plannedDiscretionary=96*equivalent*priceFactor;
  const spendingPropensity=clamp(.62+(confidence-100)*.006-Math.max(0,inflation-2.5)*.018,.2,.95);
  const disposable=Math.max(0,totalIncome-essential);
  expenses.discretionary=Math.min(plannedDiscretionary,disposable*spendingPropensity);
  const discretionary=expenses.discretionary,total=essential+discretionary;
  const purchases={
   food:expenses.food,housing:expenses.housing,utilities:expenses.utilities,transport:expenses.transport,
   healthcare:expenses.healthcare,communications:expenses.communications,education:expenses.education,
   entertainment:discretionary*.22,clothing:discretionary*.16,dining:discretionary*.2,
   durableGoods:discretionary*.16,subscriptions:discretionary*.1,personalServices:discretionary*.16
  };
  const earners=memberRows.filter(x=>x.adult),allocationBase=earners.reduce((a,x)=>a+x.income,0);
  let allocated=0;
  for(const row of memberRows){
   let weight=0;if(row.adult&&earners.length)weight=allocationBase>0?row.income/allocationBase:1/earners.length;
   row.essentialShare=round(essential*weight);row.discretionaryShare=round(discretionary*weight);
   row.expenseShare=round(row.essentialShare+row.discretionaryShare);allocated+=row.expenseShare;
  }
  const household={
   id:key,regionId,members:memberRows.map(x=>x.id),memberCount:members.length,adultCount:adults,childCount:children,
   equivalentAdults:round(equivalent),currency:mr?.currency||active.company?.currency||'USD',housingTenure:tenure,propertyValue:round(propertyValue),mortgageBalance:round(mortgageBalance),homeEquity:round(Math.max(0,propertyValue-mortgageBalance)),mortgagePayment:round(mortgage),
   income:round(totalIncome),expenses:Object.fromEntries(Object.entries(expenses).map(([k,v])=>[k,round(v)])),
   purchases:Object.fromEntries(Object.entries(purchases).map(([k,v])=>[k,round(v)])),
   plannedDiscretionary:round(plannedDiscretionary),spendingPropensity:round(spendingPropensity),
   essentialExpenses:round(essential),totalExpenses:round(total),allocatedExpenses:round(allocated),
   cashBuffer:round(adultCash),availableCredit:round(creditCapacity),
   monthlySurplus:round(totalIncome-total),
   essentialCoverage:round(clamp((totalIncome+adultCash+creditCapacity)/Math.max(1,essential),0,1)*100),
   discretionaryCoverage:round(clamp(discretionary/Math.max(1,plannedDiscretionary),0,1)*100),
   financialStress:round(clamp(30+Math.max(0,essential-totalIncome-adultCash-creditCapacity)/Math.max(1,essential)*70,0,100)),
   arrears:0,lastProcessedDate:date
  };
  if(storedHouseholdCount<MAX_HOUSEHOLD_SAMPLES){householdRecords[key]=household;storedHouseholdCount++;}
  for(const row of memberRows)pendingFinance[row.id]={householdId:key,income:round(row.income),expenseShare:round(row.expenseShare||0),essentialExpenseShare:round(row.essentialShare||0),arrears:0,borrowed:0,interest:0};
  pendingFinance['$HOUSEHOLD$:'+key]={kind:'housing',householdId:key,members:memberRows.map(x=>x.id),propertyValue:round(propertyValue),mortgageBalance:round(mortgageBalance),mortgagePayment:round(mortgage),mortgageRatePct:round(mortgageRatePct||Number(mr?.policyRatePct)||4)};
  const bucket=regional[regionId]||(regional[regionId]={households:0,income:0,spending:0,stress:0,essentialCoverage:0,categoryActual:{},categoryPlan:{}});
  bucket.households++;bucket.income+=totalIncome;bucket.spending+=total;bucket.stress+=household.financialStress;bucket.essentialCoverage+=household.essentialCoverage;
  for(const [category,value] of Object.entries(purchases))bucket.categoryActual[category]=(bucket.categoryActual[category]||0)+value;
  for(const [category,value] of Object.entries(purchases))bucket.categoryPlan[category]=(bucket.categoryPlan[category]||0)+value;
  bucket.categoryPlan.discretionary=(bucket.categoryPlan.discretionary||0)+plannedDiscretionary;
 }
 s.households=householdRecords;s.pendingFinance=pendingFinance;s.preparedDate=date;
 const virtualResidents=Math.max(0,Number(active.world?.population?.virtualResidents)||0),virtualHouseholds=virtualResidents/2.4;
 s.metrics={date,households:groups.size,namedResidents:people.filter(alive).length,virtualResidents,virtualHouseholds,modeledHouseholds:groups.size+virtualHouseholds,regional};
 const macroRegions=macro?.regions||[],regionalDemand={};let weightedDemand=0,totalWeight=0;
 const categoryTotals={food:0,energy:0,utilities:0,transport:0,housing:0,discretionary:0};
 const ratio=(actual,plan)=>plan>0?clamp(actual/plan*100,20,160):100;
 for(const r of macroRegions){
  const rs=regionStates[r.id]||(regionStates[r.id]={priceIndex:100,lastUpdated:date});
  const inflation=Number(r.inflationPct)||2.5,unemployment=Number(r.unemploymentPct)||5,confidence=Number(r.consumerConfidence)||100;
  const baseDemand=clamp(100+(confidence-100)*.55-(inflation-2.5)*1.1-(unemployment-5)*.8,35,160);
  const bucket=regional[r.id]||{households:0,income:0,spending:0,stress:0,essentialCoverage:0,categoryActual:{},categoryPlan:{}};
  bucket.virtualHouseholds=virtualHouseholds*Math.max(0,Number(r.weight)||0);bucket.modeledHouseholds=bucket.households+bucket.virtualHouseholds;
  const food=ratio(bucket.categoryActual.food||0,bucket.categoryPlan.food||0);
  const energy=ratio((bucket.categoryActual.utilities||0)+(bucket.categoryActual.transport||0),(bucket.categoryPlan.utilities||0)+(bucket.categoryPlan.transport||0));
  const utilities=ratio(bucket.categoryActual.utilities||0,bucket.categoryPlan.utilities||0);
  const transport=ratio(bucket.categoryActual.transport||0,bucket.categoryPlan.transport||0);
  const housingDemand=ratio(bucket.categoryActual.housing||0,bucket.categoryPlan.housing||0);
  const discretionary=ratio((bucket.categoryActual.entertainment||0)+(bucket.categoryActual.clothing||0)+(bucket.categoryActual.dining||0)+(bucket.categoryActual.durableGoods||0)+(bucket.categoryActual.subscriptions||0)+(bucket.categoryActual.personalServices||0),bucket.categoryPlan.discretionary||0);
  const actualRatio=bucket.spending>0?clamp(bucket.spending/Math.max(1,bucket.income),0,1.5):.75;
  const sampleCoverage=clamp(bucket.households/Math.max(1,bucket.modeledHouseholds),0,1);
  const demand=clamp(baseDemand*(1+(actualRatio-.75)*.05*sampleCoverage),25,170);
  const essential=clamp(100+(100-confidence)*.10+Math.max(0,inflation-2.5)*.35,80,125);
  const stress=clamp(30+Math.max(0,inflation-2.5)*2.2+Math.max(0,unemployment-5)*3+(100-confidence)*.45+(100-(bucket.households?bucket.essentialCoverage/bucket.households:100))*.12,0,100);
  regionalDemand[r.id]={consumerDemandIndex:round(demand),essentialDemandIndex:round(essential),discretionaryDemandIndex:round(discretionary),householdStressIndex:round(stress),priceIndex:round(rs.priceIndex),foodDemandIndex:round(food),energyDemandIndex:round(energy),utilitiesDemandIndex:round(utilities),transportDemandIndex:round(transport),housingDemandIndex:round(housingDemand),housingPriceIndex:round(rs.housingPriceIndex||100),households:bucket.households,virtualHouseholds:round(bucket.virtualHouseholds||0),modeledHouseholds:round(bucket.modeledHouseholds||bucket.households)};
  const w=Math.max(0,Number(r.weight)||0);weightedDemand+=demand*w;totalWeight+=w;
  categoryTotals.food+=food*w;categoryTotals.energy+=energy*w;categoryTotals.utilities+=utilities*w;categoryTotals.transport+=transport*w;categoryTotals.housing+=housingDemand*w;categoryTotals.discretionary+=discretionary*w;
 }
 const globalDemand=totalWeight?weightedDemand/totalWeight:100,globalCategories={};
 for(const [k,v] of Object.entries(categoryTotals))globalCategories[k]=round(totalWeight?v/totalWeight:100);
 active.market=active.market||{};active.market.economy=active.market.economy||{};
 Object.assign(active.market.economy,{householdDemandIndex:round(globalDemand),consumerCategoryDemand:globalCategories,regionalConsumerDemand:regionalDemand,householdEconomicsDate:date});
 s.lastPreparedDate=date;
 return {processed:true,date,households:groups.size,namedResidents:s.metrics.namedResidents,virtualResidents,modeledHouseholds:s.metrics.modeledHouseholds,householdDemandIndex:round(globalDemand),consumerCategoryDemand:globalCategories};
}
function processIndividualMonth(n,date){
 const s=getState();if(!s||!n||!alive(n))return false;
 if(n.finances?.lastHouseholdFinanceDate===date)return true;
 if(s.preparedDate!==date)return false;
 const entry=s.pendingFinance?.[n.id];if(!entry)return false;
 const income=Math.max(0,Number(entry.income)||0),share=Math.max(0,Number(entry.expenseShare)||0),essentialShare=Math.max(0,Number(entry.essentialExpenseShare)||0);
 const nf=n.finances||(n.finances={cash:0,debt:0,creditScore:650});
 const before=Math.max(0,Number(nf.cash)||0),debtBefore=Math.max(0,Number(nf.debt)||0),score=clamp(Number(nf.creditScore||650),300,850);
 const mr=(active.market?.globalEconomy?.regions||[]).find(r=>r.id===regionIdFor(n,active.market?.globalEconomy));
 const apr=clamp(Number(mr?.policyRatePct||4)+3+(850-score)*.08,4,36);
 const interest=round(debtBefore*apr/1200),debtAfterInterest=debtBefore+interest,savingsApr=clamp(Number(mr?.policyRatePct||3)-1.5,0,10),savingsInterest=round(before*savingsApr/1200);
 const creditFactor=clamp((score-500)/350,0,1),creditLimit=round(Math.max(0,income*4*creditFactor));
 const available=before+income+savingsInterest,essentialShortfall=Math.max(0,essentialShare-available);
 const creditDraw=round(Math.min(essentialShortfall,Math.max(0,creditLimit-debtAfterInterest)));
 const shortfall=Math.max(0,share-available-creditDraw),surplus=Math.max(0,available+creditDraw-share);
 const repayment=round(Math.min(debtAfterInterest+creditDraw,surplus*.35));
 nf.cash=round(Math.max(0,surplus-repayment));
 nf.debt=round(Math.max(0,debtAfterInterest+creditDraw-repayment));
 nf.creditLimit=creditLimit;nf.monthlyDebtInterest=interest;nf.monthlyDebtRepayment=repayment;nf.monthlyCreditDraw=creditDraw;nf.monthlySavingsInterest=savingsInterest;
 nf.monthlyIncome=round(income);nf.monthlyExpenses=round(share);nf.monthlyArrears=round(shortfall);
 nf.savingsRate=income>0?round(clamp((income-share)/income*100,-100,100)):0;
 nf.creditScore=round(clamp(score+(shortfall>0?-2.5:creditDraw>0?-.2:.35),300,850));
 nf.insolvencyMonths=shortfall>0?Math.min(120,Number(nf.insolvencyMonths||0)+1):Math.max(0,Number(nf.insolvencyMonths||0)-1);
 nf.insolvencyStatus=nf.insolvencyMonths>=6&&nf.debt>Math.max(1,income*12)?'insolvent':nf.insolvencyMonths>=3?'severe-stress':shortfall>0?'financial-stress':'current';
 if(nf.insolvencyMonths>=12&&nf.debt>Math.max(2000,income*12)&&nf.bankruptcyStatus!=='filed'){nf.bankruptcyStatus='filed';nf.bankruptcyFiledDate=date;s.bankruptcyEvents.unshift({date,npcId:n.id,debt:round(nf.debt),monthsInArrears:nf.insolvencyMonths});s.bankruptcyEvents=s.bankruptcyEvents.slice(0,200)}else if(!nf.bankruptcyStatus)nf.bankruptcyStatus='none';
 nf.lastHouseholdFinanceDate=date;
 n.wealth=nf.cash;
 n.career=n.career||{};n.career.monthlyIncome=round(income);
 if(n.needs)n.needs.security=clamp(Number(n.needs.security??60)+(shortfall>0?-.9:creditDraw>0?-.15:.4),0,100);
 if(n.reputation)n.reputation.personal=clamp(Number(n.reputation.personal??50)+(shortfall>0?-.05:.03),0,100);
 entry.arrears=round(shortfall);entry.borrowed=creditDraw;entry.interest=interest;
 return true;
}
function finalizeMonth(date){
 const s=getState();if(!s||s.preparedDate!==date)return {processed:false};
 if(s.lastProcessedDate===date)return {processed:false,idempotent:true,date};
 const people=population().slice(0,MAX_NPCS),byId=new Map(people.map(n=>[n.id,n]));
 let cash=0,debt=0,householdArrears=0,borrowed=0,interest=0,mortgageInterest=0,mortgagePrincipal=0;
 const arrearsByHousehold={};
 for(const entry of Object.values(s.pendingFinance||{})){
  if(entry.kind==='housing')continue;
  householdArrears+=Number(entry.arrears)||0;borrowed+=Number(entry.borrowed)||0;interest+=Number(entry.interest)||0;
  arrearsByHousehold[entry.householdId]=(arrearsByHousehold[entry.householdId]||0)+(Number(entry.arrears)||0);
 }
 for(const entry of Object.values(s.pendingFinance||{})){
  if(entry.kind!=='housing'||!(Number(entry.mortgageBalance)>0))continue;
  const rate=clamp(Number(entry.mortgageRatePct)||4,0,36);
  const mi=round(Number(entry.mortgageBalance)*rate/1200);
  const principal=round(Math.min(Number(entry.mortgageBalance),Math.max(0,Number(entry.mortgagePayment)-mi)));
  const newBalance=round(Math.max(0,Number(entry.mortgageBalance)+mi-Number(entry.mortgagePayment)));
  mortgageInterest+=mi;mortgagePrincipal+=principal;
  for(const id of entry.members||[]){
   const n=byId.get(id);
   if(n?.home&&Number(n.home.mortgageBalance)>0){
    n.home.mortgageBalance=newBalance;
    n.home.mortgageInterestRatePct=rate;
    n.home.equity=round(Math.max(0,Number(n.home.propertyValue||entry.propertyValue)-newBalance));
    n.home.lastMortgagePaymentDate=date;
   }
  }
 }
 for(const [id,h] of Object.entries(s.households)){h.lastProcessedDate=date;h.arrears=round(arrearsByHousehold[id]||0)}
 for(const n of people){if(!alive(n))continue;cash+=Number(n.finances?.cash)||0;debt+=Number(n.finances?.debt)||0}
 const wealthGroups=new Map();
 for(const n of people){if(!alive(n))continue;const key=householdKey(n);if(!wealthGroups.has(key))wealthGroups.set(key,[]);wealthGroups.get(key).push(n)}
 const wealthValues=[];
 for(const members of wealthGroups.values()){
  const adults=members.filter(n=>(Number(n.age)||0)>=18),count=Math.max(1,adults.length);
  const property=Math.max(0,...members.map(n=>Number(n.home?.propertyValue)||0));
  const mortgageBal=Math.max(0,...members.map(n=>Number(n.home?.mortgageBalance)||0));
  const equity=Math.max(0,property-mortgageBal)/count;
  for(const n of adults)wealthValues.push(Math.max(0,(Number(n.finances?.cash)||0)+equity-(Number(n.finances?.debt)||0)));
 }
 wealthValues.sort((a,b)=>a-b);
 const wealthTotal=wealthValues.reduce((a,b)=>a+b,0),nWealth=wealthValues.length;
 let giniNumerator=0;
 for(let i=0;i<nWealth;i++)giniNumerator+=(2*(i+1)-nWealth-1)*wealthValues[i];
 const wealthGini=wealthTotal>0&&nWealth?clamp(giniNumerator/(nWealth*wealthTotal),0,1):0;
 const percentile=p=>nWealth?round(wealthValues[Math.min(nWealth-1,Math.floor((nWealth-1)*p))]):0;
 const summary={
  date,households:Number(s.metrics?.households)||Object.keys(s.households).length,namedResidents:s.metrics.namedResidents,
  householdDemandIndex:Number(active.market?.economy?.householdDemandIndex)||100,
  aggregateCash:round(cash),aggregateDebt:round(debt),unpaidHouseholdArrears:round(householdArrears),
  newConsumerCredit:round(borrowed),debtInterestAccrued:round(interest),
  mortgageInterestAccrued:round(mortgageInterest),mortgagePrincipalPaid:round(mortgagePrincipal),
  bankruptciesFiled:s.bankruptcyEvents.filter(e=>e.date===date).length,
  wealthGini:round(wealthGini),wealthP10:percentile(.1),wealthMedian:percentile(.5),wealthP90:percentile(.9)
 };
 s.history.unshift(summary);s.history=s.history.slice(0,MAX_HISTORY);
 s.lastProcessedDate=date;s.metrics.summary=summary;
 s.metrics.wealth={gini:summary.wealthGini,p10:summary.wealthP10,median:summary.wealthMedian,p90:summary.wealthP90};
 s.pendingFinance={};
 return {processed:true,...summary};
}
function audit(){
 const s=getState(),tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
 if(!s)return {passed:0,failed:1,tests:[{name:'Active campaign',ok:false,detail:'No active campaign.'}]};
 const hs=Object.values(s.households),ids=new Set(hs.map(h=>h.id));
 add('Versioned household economics state',s.version===VERSION,s.version);
 add('Unique household identities',ids.size===hs.length,hs.length+' detailed household samples');
 add('Finite non-negative household budgets',hs.every(h=>Number.isFinite(h.totalExpenses)&&h.totalExpenses>=0&&Number.isFinite(h.income)&&h.income>=0),'Income and expense totals are finite and non-negative.');
 add('Expense allocation reconciles',hs.every(h=>h.allocatedExpenses<=h.totalExpenses+.1&&h.allocatedExpenses>=0),'Shared household costs are allocated to adult earners only.');
 add('Autonomous purchase budgets reconcile',hs.every(h=>Object.values(h.purchases||{}).every(v=>Number.isFinite(v)&&v>=0)&&Math.abs(Object.values(h.purchases||{}).reduce((a,b)=>a+b,0)-h.totalExpenses)<.15),'Purchase categories reconcile to household expenses.');
 add('Regional consumer indices bounded',Object.values(active.market?.economy?.regionalConsumerDemand||{}).every(r=>['consumerDemandIndex','essentialDemandIndex','discretionaryDemandIndex','householdStressIndex','priceIndex','foodDemandIndex','energyDemandIndex','utilitiesDemandIndex','transportDemandIndex','housingDemandIndex','housingPriceIndex'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<=300)),'Regional demand, stress and price indices remain finite and bounded.');
 add('Global category demand bounded',Object.values(active.market?.economy?.consumerCategoryDemand||{}).every(v=>Number.isFinite(v)&&v>=0&&v<=300),'Consumer category demand indices remain finite and bounded.');
 const people=population().slice(0,MAX_NPCS);
 add('Individual finance balances valid',people.every(n=>!n.finances||[n.finances.cash,n.finances.debt,n.finances.monthlyIncome,n.finances.monthlyExpenses,n.finances.creditScore].every(v=>Number.isFinite(Number(v))&&Number(v)>=0)),'NPC cash, debt, income, expenses and credit scores remain finite and non-negative.');
 add('Credit and insolvency states bounded',people.every(n=>!n.finances||Number(n.finances.creditScore||650)>=300&&Number(n.finances.creditScore||650)<=850&&Number(n.finances.insolvencyMonths||0)>=0&&Number(n.finances.insolvencyMonths||0)<=120),'Credit scores and insolvency counters remain within defined bounds.');
 add('Property and mortgage balances valid',people.every(n=>!n.home||[n.home.propertyValue,n.home.mortgageBalance,n.home.equity].every(v=>v===undefined||Number.isFinite(Number(v))&&Number(v)>=0)),'Property values, mortgage balances and equity remain finite and non-negative.');
 add('Bankruptcy event ledger bounded',Array.isArray(s.bankruptcyEvents)&&s.bankruptcyEvents.length<=200,'Bankruptcy filings are retained in a bounded, serializable ledger.');
 add('Wealth inequality metrics valid',!s.metrics?.summary||Number.isFinite(s.metrics.summary.wealthGini)&&s.metrics.summary.wealthGini>=0&&s.metrics.summary.wealthGini<=1,'Gini coefficient stays within [0, 1].');
 add('Month preparation checkpoint',!s.preparedDate||s.preparedDate<=active.date,'Household processor does not run ahead of campaign time.');
 add('Closed month has no pending finance transactions',s.lastProcessedDate!==s.preparedDate||Object.keys(s.pendingFinance||{}).length===0,'Per-person transactions clear after monthly settlement.');
 add('Household persistence remains bounded',Object.keys(s.households).length<=MAX_HOUSEHOLD_SAMPLES,'Detailed records are capped at '+MAX_HOUSEHOLD_SAMPLES+' while aggregate processing covers '+MAX_NPCS+' named NPCs.');
 add('Household state serializes',(()=>{try{JSON.stringify(s);return true}catch(e){return false}})(),'Household summaries, pending finance and regional indices are save-safe.');
 const passed=tests.filter(t=>t.ok).length;return {date:active.date,passed,failed:tests.length-passed,tests};
}
function metrics(){const s=getState();return s?{...s.metrics,households:Number(s.metrics?.households)||Object.keys(s.households).length,storedHouseholdSamples:Object.keys(s.households).length,version:s.version,lastPreparedDate:s.lastPreparedDate,lastProcessedDate:s.lastProcessedDate,history:s.history.length,bankruptcyEvents:s.bankruptcyEvents.length}:null}
window.StudioHouseholdEconomics={version:VERSION,prepareMonth,processIndividualMonth,finalizeMonth,audit,metrics,ensure:getState};
try{window.StudioPhase0?.registerModule?.({id:'household-consumer-economics',name:'Household & consumer economics',deps:['kernel','population','economy'],owns:['household budgets','shared household expenses','autonomous consumer purchases','personal cashflow','savings','consumer credit','debt','arrears','regional consumer demand','household financial stress'],status:'implemented'})}catch(e){}
})();