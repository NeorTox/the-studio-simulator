'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1365,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});await page.evaluate(()=>window.StudioTutorial?.close?.());
 await page.locator('#start-load').click();
 await page.locator('[data-page="overview"]').click();
 await page.locator('#page-overview .hero .actions button').first().click();
 await page.getByRole('button',{name:/Create campaign/}).click();
 for(const [id,value] of [['nfounder','Daily Systems QA'],['ncompany','Daily Systems QA Studios'],['ncountry','India'],['ncity','Mumbai']])await page.locator('#'+id).fill(value);
 await page.getByRole('button',{name:/Create and save campaign/}).click();
 const result=await page.evaluate(()=>{
  active.worldClock=active.worldClock||{};active.worldClock.running=false;active.worldClock.liveTick=false;
  const start=active.date,day=new Date(start+'T12:00:00Z').getUTCDay(),days=day===5?3:day===6?2:day===0?1:1;
  const target=new Date(Date.parse(start+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
  window.advance(days);
  const world=active.world||{},region=window.StudioPhase0.phase1.regions[0];world.environment=world.environment||{};world.environment.hazards=[{id:'QA-REGIONAL-HAZARD',kind:'Severe storm',regionId:region.id,region:region.name,date:target,severity:90,endsOn:new Date(Date.parse(target+'T12:00:00Z')+5*86400000).toISOString().slice(0,10),status:'active'}];world.population=world.population||{};world.population.npcs=world.population.npcs||[];const exposedNpc={id:'QA-HAZARD-NPC',alive:true,status:'Independent',region:region.name,needs:{health:80,energy:80,security:80}};world.population.npcs.push(exposedNpc);const hazardTick=window.StudioWorldRisk.tick({date:target}),hazardImpact=window.StudioWorldRisk.getRegionalImpact(region.id);if(!hazardImpact||!exposedNpc.worldExposure?.regionalHazard)throw Error('Regional hazard failed to propagate to a mapped NPC and regional impact snapshot');const economy=window.Phase9GlobalEconomy.ensure(),depth=window.StudioSimulationDepth.overallAudit();
  return {start,target,actual:active.date,days,weatherDate:world.time?.lastProcessedDate,weatherRegions:Object.values(world.environment?.currentByRegion||{}).filter(x=>x.date===target).length,
   macroDate:economy?.deepMacro?.lastProcessedDate,phase9Date:economy?.lastProcessedDate,
   safetyDate:world.publicSafety?.lastProcessedDate,cyberDate:world.cybersecurity?.lastProcessedDate,
   relationshipsDate:world.relationshipDynamics?.lastProcessedDate,supplyDate:economy?.supplyChains?.lastProcessedDate,
   liquidityDate:active.market?.equityLiquidity?.lastProcessedDate,relationshipCohortCursor:world.relationshipDynamics?.cohortCursor??0,relationshipProcessedNpcs:(world.population?.npcs||[]).filter(n=>n.relationshipDynamics?.lastEvaluatedDate===target).length,depthAudit:{passed:depth.passed,failed:depth.failed,failedTests:depth.tests.filter(x=>!x.ok)},hazard:{processed:hazardTick.processed,regionId:region.id,impact:hazardImpact,npcExposure:exposedNpc.worldExposure.regionalHazard}};
 });
 assert.equal(result.actual,result.target,'The real daily advance path must commit every requested day');
 assert(result.hazard.processed>=1&&result.hazard.impact.transportReliabilityPct<100,'Regional hazard must produce bounded regional impact metrics');
 assert.equal(result.hazard.npcExposure.id,'QA-REGIONAL-HAZARD','Hazard exposure must be recorded on an NPC in the affected region');
 assert.equal(result.weatherDate,result.target,'World and climate processing must run');
 assert(result.weatherRegions>=8,'Regional weather must update across the map');
 for(const key of ['macroDate','phase9Date','safetyDate','cyberDate','relationshipsDate','supplyDate','liquidityDate'])assert.equal(result[key],result.target,key+' must execute through the real daily pipeline');
 assert(result.relationshipProcessedNpcs<=25000,'Relationship processing must be bounded to a 25,000-NPC daily cohort');
 assert.equal(result.depthAudit.failed,0,JSON.stringify(result.depthAudit.failedTests));
 assert.deepEqual(errors,[]);
 console.log('SIMULATION DEPTH RUNTIME QA PASSED',JSON.stringify(result));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
