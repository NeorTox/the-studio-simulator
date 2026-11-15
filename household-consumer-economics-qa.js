'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('household-consumer-economics-engine.js','utf8');
function npc(id,age,status,familyId,cash,income,rent,region='south-asia'){
 return {id,age,status,alive:true,region,family:{familyId},home:{housing:'Renter',monthlyRent:rent,householdId:familyId?'HOME-'+familyId:null},career:{monthlyIncome:income,experience:0,tenureDays:0,performance:60,satisfaction:65},finances:{cash,debt:0,monthlyIncome:income,monthlyExpenses:0,creditScore:650},needs:{security:60},reputation:{personal:50}};
}
const people=[npc('A',35,'Employed','F1',2500,3000,900),npc('B',33,'Externally Employed','F1',1800,2000,900),npc('C',10,'Student','F1',0,0,900),npc('D',25,'Independent',null,600,1000,400,'north-america')];
const campaign={id:'household-qa',worldSeed:12345,date:'2026-02-01',company:{currency:'USD'},employees:[{npcId:'A',salary:3000}],world:{population:{npcs:people}},market:{globalEconomy:{regions:[
 {id:'south-asia',name:'South Asia',weight:.5,inflationPct:6,unemploymentPct:6.2,consumerConfidence:105},
 {id:'north-america',name:'North America',weight:.5,inflationPct:2.5,unemploymentPct:4.8,consumerConfidence:101}
]}}};
const registered=[];
const context={active:campaign,window:{StudioPhase0:{registerModule:m=>registered.push(m)}},Math,Date,Number,String,Object,Array,Map,Set,JSON};
vm.createContext(context);vm.runInContext(source,context);
const api=context.window.StudioHouseholdEconomics;assert.ok(api);assert.equal(api.version,'1.0.0');
const prepared=api.prepareMonth(campaign.date);assert.equal(prepared.processed,true);assert.equal(prepared.households,2);
assert.equal(api.prepareMonth(campaign.date).idempotent,true);
for(const n of people)assert.equal(api.processIndividualMonth(n,campaign.date),true);
const family=campaign.world.householdEconomics.households['FAMILY:F1'];
assert.equal(family.memberCount,3);assert.equal(family.adultCount,2);assert.equal(family.childCount,1);
assert.ok(Math.abs(family.allocatedExpenses-family.totalExpenses)<.05);
assert.equal(people[2].finances.monthlyExpenses,0,'dependent children must not be charged household bills');
const before=people[0].finances.cash;api.processIndividualMonth(people[0],campaign.date);assert.equal(people[0].finances.cash,before,'monthly finance processing must be idempotent');
const finalized=api.finalizeMonth(campaign.date);assert.equal(finalized.processed,true);assert.equal(finalized.households,2);
const report=api.audit();assert.equal(report.failed,0,JSON.stringify(report.tests.filter(t=>!t.ok)));
assert.ok(campaign.market.economy.householdDemandIndex>=35&&campaign.market.economy.householdDemandIndex<=160);
assert.equal(registered.length,1);
const roundTrip=JSON.parse(JSON.stringify(campaign));assert.equal(roundTrip.world.householdEconomics.version,'1.0.0');
const largePeople=[];for(let i=0;i<25000;i++)largePeople.push(npc('L'+i,30,'Independent',null,1000,1200,500,i%2?'north-america':'south-asia'));
campaign.world.population.npcs=largePeople;campaign.world.householdEconomics=null;
const large=api.prepareMonth('2026-03-01');assert.equal(large.households,25000);assert.equal(large.namedResidents,25000);
assert.ok(api.metrics().households===25000);assert.equal(api.metrics().storedHouseholdSamples,500,'persisted household detail must be capped');assert.equal(Object.keys(campaign.world.householdEconomics.pendingFinance).length,25000);api.finalizeMonth('2026-03-01');assert.equal(Object.keys(campaign.world.householdEconomics.pendingFinance).length,0,'pending finance records must clear at month close');
console.log('HOUSEHOLD ECONOMICS QA PASSED: shared budgets, dependent protection, deterministic regional demand, monthly idempotency, save serialization, and 25,000-NPC bounded aggregation.');
