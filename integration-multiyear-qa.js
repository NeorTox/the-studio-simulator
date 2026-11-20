const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
 await page.locator('#start-new').click();
 for(const [id,value] of [['nfounder','Integration Stress Founder'],['ncompany','Integration Stress Studios'],['ncountry','India'],['ncity','Mumbai']])await page.locator('#'+id).fill(value);
 await page.getByRole('button',{name:/Create and save campaign/}).click();
 const start=await page.evaluate(()=>active.date);
 const setup=await page.evaluate(()=>{
  const p=window.StudioPhase0;
  active.worldClock=active.worldClock||{};active.worldClock.running=false;active.worldClock.liveTick=false;active.worldClock.accumulatorMs=0;active.worldClock.lastWallMs=Date.now();
  if(!p?.phase1?.processWorldDay||!window.StudioPopulationEngine?.processDay||!window.Phase3Founder?.stepDay||!window.Phase4Company?.stepDay||!window.Phase5Production?.audit||!window.Phase6Ecosystem?.stepDay||!window.Phase6Ecosystem?.audit||!window.Phase7Smartphone?.stepDay&&!window.Phase7Smartphone?.processDay||!window.Phase9GlobalEconomy?.stepDay||!window.Phase10Competitors?.stepDay||!window.Phase11Technology?.stepDay||!window.Phase12Generations?.stepDay||!window.StudioSimulationDepth?.processDay||!window.StudioPublicSafety?.audit||!window.StudioCyberSecurity?.audit||!window.StudioRelationshipDynamics?.audit||!window.StudioSupplyChain?.audit)throw Error('Required Phase 0–13 and simulation-depth APIs are missing');
  const scheduler=p.createCampaignScheduler();
  scheduler.schedule('world:story',addDays(active.date,45),{title:'Integration stress scheduled event'});
  return {date:active.date,npcs:active.npcs?.length||0,clockRunning:active.worldClock?.running};
 });
 // 1,095 simulated days, advanced in 30-day chunks to exercise the real public advance path.
 for(let i=0;i<37;i++)await page.evaluate(days=>window.advance(Math.min(days,1095-(window.__stressDays||0))),30).then(()=>page.evaluate(()=>{window.__stressDays=(window.__stressDays||0)+30;})).catch(e=>{throw e;});
 const result=await page.evaluate(()=>{
  const w=active.world?.time,pop=active.world?.population?.phase2,founder=active.founder?.phase3,company=window.Phase4Company.ensure(),ecosystem=active.ecosystem,telemetry=active.integration;
  const worldDate=w?.lastProcessedDate,popDate=pop?.lastProcessedDate,founderDate=founder?.lastDay,companyDate=company?.lastProcessedDate,ecosystemDate=ecosystem?.lastProcessedDate;
  const autonomy=window.StudioAutonomy.metrics(),autonomyTick=active.autonomy?.history?.[0]||null;
  const autonomyAudits={
   personalAgency:window.StudioNPCAutonomy.audit(),
   decisions:window.StudioNPCDecisionConsequences.audit(),
   social:window.StudioSocialNetwork.audit(),
   memory:window.StudioNPCMemory.audit(),
   digitalSociety:window.StudioDigitalSociety.audit(),
   media:window.StudioMediaEcosystem.audit(),
   worldRisk:window.StudioWorldRisk.audit()
  };
  const report=window.StudioPhaseIntegration.audit();
  return {date:active.date,start:active.startDate,worldDate,worldDays:w?.processedDays,popDate,popDays:pop?.dailyTicks,founderDate,companyDate,companyDays:company?.processedDays,ecosystemDate,audienceDate:ecosystem?.audienceLastProcessedDate,audienceSegments:ecosystem?.audienceSegments?.length,ecosystemVersion:ecosystem?.version,trackedDays:Object.keys(telemetry?.days||{}).length,completedDays:Object.values(telemetry?.days||{}).filter(x=>x.status==='completed').length,schedulerHistory:active.simulationKernel?.history?.length,schedulerQueue:active.simulationKernel?.queue?.length,phase6Status:report.modules.find(m=>m.id===6)?.status,connectedPhases:report.modules.filter(m=>m.status==='connected').length,phase6PipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase6-ecosystem')&&d.steps.some(x=>x.name==='phase6-audience')).length,phase7PipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase7-smartphone')).length,phoneDate:active.smartphone?.lastProcessedDate,phoneFeed:active.smartphone?.feed?.length,digitalNewsDate:active.smartphone?.news?.lastDate,digitalArticles:active.smartphone?.news?.articles?.length,digitalOutlets:active.smartphone?.news?.outlets?.length,digitalRegions:active.smartphone?.regionalDigital?.regions?.length,regionalNPCFloor:(active.smartphone?.regionalDigital?.regions||[]).every(r=>r.npcCount>=25000&&r.virtualNPCs>=0),digitalAudit:window.Phase7Smartphone.lifeExpansionAudit(),financialDate:active.financialEmpire?.lastProcessedDate,travelDate:active.world?.travel?.lastProcessedDate,travelAudit:window.StudioGlobalTravel.audit(),financialFunds:active.financialEmpire?.funds?.length,financialHoldings:active.financialEmpire?.holdings?.length,financialAudit:window.Phase8FinancialEmpire.audit(),technologyDate:active.technology?.lastProcessedDate,technologyTechnologies:active.technology?.technologies?.length,technologyAudit:window.Phase11Technology.audit(),generationDate:active.generations?.lastProcessedDate,generationMetrics:active.generations?.metrics,generationAudit:window.Phase12Generations.audit(),generationPipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase12-generations')).length,generationAnnualTicks:active.generations?.annualTicks,worldEvolution:active.market?.worldEvolution,publicSafetyDate:active.world?.publicSafety?.lastProcessedDate,cybersecurityDate:active.world?.cybersecurity?.lastProcessedDate,relationshipDate:active.world?.relationshipDynamics?.lastProcessedDate,macroDepthDate:active.market?.globalEconomy?.deepMacro?.lastProcessedDate,supplyChainDate:active.market?.globalEconomy?.supplyChains?.lastProcessedDate,hourlyWeatherRegions:Object.keys(active.world?.environment?.currentHourlyByRegion||{}).length,hourlyWeatherTicks:w?.hourlyTicks,hourlyWeatherDates:[...new Set(Object.values(active.world?.environment?.currentHourlyByRegion||{}).map(x=>x.date))],depthAudit:window.StudioSimulationDepth.overallAudit(),equityLiquidityDate:active.market?.equityLiquidity?.lastProcessedDate,equityLiquidityAudit:window.StudioMarketLiquidity.audit(),technologyPipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase11-technology-sustainability')).length,competitorDate:active.competitors?.lastProcessedDate,competitorCompanies:active.competitors?.companies?.length,competitorAudit:window.Phase10Competitors.audit(),competitorPipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase10-competitors')).length,phase9Date:active.market?.globalEconomy?.lastProcessedDate,globalEconomyRegions:active.market?.globalEconomy?.regions?.length,globalEconomyAudit:window.Phase9GlobalEconomy.audit(),phase9PipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase9-global-economy')).length,phase8PipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase8-financial-empire')).length,travelPipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='global-travel')).length,audit:{passed:report.passed,failed:report.failed,tests:report.tests},phase5:window.Phase5Production.audit(),autonomy,autonomyTick,autonomyAudits};
 });
 console.log('MULTIYEAR CROSS-PHASE STRESS',JSON.stringify({setup,result,errors}));
 const expectedDate=new Date(start+'T00:00:00Z');expectedDate.setUTCDate(expectedDate.getUTCDate()+1095);assert.equal(result.date,expectedDate.toISOString().slice(0,10)); // exactly 1,095 simulated days
 assert.equal(result.worldDate,result.date);
 assert.equal(result.popDate,result.date);
 assert.equal(result.founderDate,result.date);
 assert.equal(result.companyDate,result.date);
 assert.equal(result.ecosystemDate,result.date);
 assert.equal(result.audienceDate,result.date);
 assert.equal(result.audienceSegments,10);
 assert.equal(result.ecosystemVersion,'6.1.0');
 assert(result.worldDays>=1095);
 assert(result.popDays>=1095);
 assert.equal(result.trackedDays,result.completedDays);
 assert.equal(result.autonomy.registeredTasks,7,'All seven autonomous world tasks, including regional hazards, must be registered.');
 assert.equal(result.autonomy.lastTickDate,result.date,'Autonomous scheduler date must remain synchronized with world time.');
 assert.equal(result.autonomyTick?.date,result.date,'Latest autonomous tick must match the campaign date.');
 assert.equal(result.autonomyTick?.tasksRun,7,'All seven autonomous tasks must execute on every simulated day.');
 assert.equal(result.autonomyTick?.failed,0,'No autonomous task may fail on the latest simulated day.');
 for(const [name,audit] of Object.entries(result.autonomyAudits))assert.equal(audit.failed,0,'Autonomous subsystem '+name+' must pass: '+JSON.stringify(audit.tests.filter(x=>!x.ok)));
 assert.equal(result.phase6Status,'connected','Phase 6 must satisfy the integration contract.');
 assert.equal(result.connectedPhases,14,'All fourteen phases, 0–13, must be connected.');
 assert.equal(result.phase6PipelineDays,1095,'Every completed integration day must include Phase 6 ecosystem and audience processing.');
 assert.equal(result.phase7PipelineDays,1095,'Every completed integration day must include Phase 7 smartphone processing.');
 assert.equal(result.phoneDate,result.date,'Phase 7 smartphone date must remain synchronized with world time.');assert.equal(result.financialDate,result.date,'Phase 8 financial empire date must remain synchronized with world time.');assert.equal(result.travelDate,result.date,'Global travel date must remain synchronized with world time.');assert.equal(result.travelPipelineDays,1095,'Every completed daily pipeline must include global travel.');assert.equal(result.travelAudit.failed,0,JSON.stringify(result.travelAudit.tests.filter(x=>!x.ok)));assert.equal(result.phase8PipelineDays,1095,'Every completed integration day must include Phase 8 financial empire processing.');assert.equal(result.phase9Date,result.date,'Phase 9 global economy date must remain synchronized with world time.');assert.equal(result.technologyDate,result.date,'Phase 11 technology date must remain synchronized with world time.');assert.equal(result.technologyTechnologies,12,'Phase 11 must maintain the 12-technology tree.');assert.equal(result.technologyPipelineDays,1095,'Every completed daily pipeline must include Phase 11 technology and sustainability processing.');assert.equal(result.technologyAudit.failed,0,JSON.stringify(result.technologyAudit.tests.filter(x=>!x.ok)));assert.equal(result.generationDate,result.date,'Phase 12 generations date must remain synchronized with world time.');assert.equal(result.generationPipelineDays,1095,'Every completed daily pipeline must include Phase 12 generations.');assert(result.generationAnnualTicks>=2,'Phase 12 must process multiple annual world-evolution cycles.');assert(result.worldEvolution&&result.worldEvolution.date<=result.date,'Phase 12 must publish persistent world-evolution trends.');assert.equal(result.generationAudit.failed,0,JSON.stringify(result.generationAudit.tests.filter(x=>!x.ok)));assert.equal(result.competitorDate,result.date,'Phase 10 competitor date must remain synchronized with world time.');assert.equal(result.competitorCompanies,10,'Phase 10 must maintain ten autonomous competitors.');assert.equal(result.competitorPipelineDays,1095,'Every completed daily pipeline must include Phase 10 competitor processing.');assert.equal(result.competitorAudit.failed,0,JSON.stringify(result.competitorAudit.tests.filter(x=>!x.ok)));assert.equal(result.globalEconomyRegions,8,'Phase 9 must maintain eight regional economies.');assert.equal(result.phase9PipelineDays,1095,'Every completed integration day must include Phase 9 global economy processing.');assert.equal(result.globalEconomyAudit.failed,0,JSON.stringify(result.globalEconomyAudit.tests.filter(x=>!x.ok)));assert.equal(result.financialAudit.failed,0,JSON.stringify(result.financialAudit.tests.filter(x=>!x.ok)));assert.equal(result.digitalNewsDate,result.date,'Phase 7 newsroom date must remain synchronized with world time.');assert(result.digitalOutlets>=8,'All seeded news outlets must remain registered.');assert(result.digitalArticles>=8,'The newsroom must continue publishing throughout the three-year simulation.');assert(result.digitalRegions>=1,'The regional digital population model must remain initialized.');assert(result.regionalNPCFloor,'Every digital region must retain at least 25,000 represented NPCs.');assert.equal(result.digitalAudit.failed,0,JSON.stringify(result.digitalAudit.tests.filter(x=>!x.ok)));
 assert(result.phoneFeed>=100,'Phase 7 should generate and retain a multi-year digital feed.');
 const phoneAudit=await page.evaluate(()=>window.Phase7Smartphone.audit());assert.equal(phoneAudit.failed,0,JSON.stringify(phoneAudit.tests.filter(x=>!x.ok)));
 assert(result.trackedDays>=1095);
 assert.equal(result.audit.failed,0,JSON.stringify(result.audit.tests.filter(x=>!x.ok)));
 assert.equal(result.phase5.failed,0);
 assert.equal(result.publicSafetyDate,result.date,'Public safety date must remain synchronized with the campaign.');
 assert.equal(result.cybersecurityDate,result.date,'Cybersecurity date must remain synchronized with the campaign.');
 assert.equal(result.relationshipDate,result.date,'NPC relationship date must remain synchronized with the campaign.');
 assert.equal(result.macroDepthDate,result.date,'Deep macro indicators must remain synchronized with the campaign.');
 assert.equal(result.supplyChainDate,result.date,'Supply chains must remain synchronized with the campaign.');
 assert.equal(result.hourlyWeatherRegions,8,'Hourly weather must be retained for all eight world regions.');
 assert.equal(result.hourlyWeatherTicks,1095*24,'The 24-hour weather model must execute for every day of the three-year campaign.');
 assert.deepEqual(result.hourlyWeatherDates,[result.date],'All eight regional hourly weather snapshots must match the final campaign date.');
 assert.equal(result.depthAudit.failed,0,JSON.stringify(result.depthAudit.tests.filter(x=>!x.ok)));
 assert.equal(result.equityLiquidityDate,result.date,'Equity liquidity checkpoint must remain synchronized with the market day.');
 assert.equal(result.equityLiquidityAudit.failed,0,JSON.stringify(result.equityLiquidityAudit.tests.filter(x=>!x.ok)));
 const phase6=await page.evaluate(()=>window.Phase6Ecosystem.audit());
 assert.equal(phase6.failed,0,JSON.stringify(phase6.tests.filter(x=>!x.ok)));
 const beforeRestore=await page.evaluate(()=>{
  const c=active,w=c.world||{},time=w.time||{},env=w.environment||{},supply=c.market?.globalEconomy?.supplyChains||{},latest=c.autonomy?.history?.[0]||{};
  return {
   id:c.id,date:c.date,
   worldTime:{lastProcessedDate:time.lastProcessedDate,processedDays:time.processedDays,hourlyTicks:time.hourlyTicks},
   weather:Object.keys(env.currentByRegion||{}).sort().map(id=>{const x=env.currentByRegion[id];return[id,x.date,x.temperatureC,x.precipitationProbability,x.windKph]}),
   hourlyWeather:Object.keys(env.currentHourlyByRegion||{}).sort().map(id=>{const x=env.currentHourlyByRegion[id];return[id,x.date,x.hour,x.temperatureC,x.precipitationProbability]}),
   hazards:(env.hazards||[]).map(h=>[h.id,h.status,h.severity,h.endsOn,h.impactUpdatedDate]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),
   autonomy:{lastTickDate:c.autonomy?.lastTickDate,ticks:c.autonomy?.ticks,latest:{date:latest.date,tasksRun:latest.tasksRun,failed:latest.failed}},
   supply:{lastProcessedDate:supply.lastProcessedDate,routeCount:supply.routes?.length||0,inventoryCount:supply.inventory?.length||0,gridCount:supply.energyGrid?.length||0,metrics:supply.metrics},
   population:{lastProcessedDate:w.population?.phase2?.lastProcessedDate,dailyTicks:w.population?.phase2?.dailyTicks,npcCount:w.population?.npcs?.length||0},
   generations:{lastProcessedDate:c.generations?.lastProcessedDate,annualTicks:c.generations?.annualTicks}
  };
 });
 await page.reload({waitUntil:'networkidle'});
 const afterRestore=await page.evaluate(()=>{
  const c=active,w=c?.world||{},time=w.time||{},env=w.environment||{},supply=c.market?.globalEconomy?.supplyChains||{},latest=c.autonomy?.history?.[0]||{};
  return {
   id:c?.id,date:c?.date,
   worldTime:{lastProcessedDate:time.lastProcessedDate,processedDays:time.processedDays,hourlyTicks:time.hourlyTicks},
   weather:Object.keys(env.currentByRegion||{}).sort().map(id=>{const x=env.currentByRegion[id];return[id,x.date,x.temperatureC,x.precipitationProbability,x.windKph]}),
   hourlyWeather:Object.keys(env.currentHourlyByRegion||{}).sort().map(id=>{const x=env.currentHourlyByRegion[id];return[id,x.date,x.hour,x.temperatureC,x.precipitationProbability]}),
   hazards:(env.hazards||[]).map(h=>[h.id,h.status,h.severity,h.endsOn,h.impactUpdatedDate]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),
   autonomy:{lastTickDate:c?.autonomy?.lastTickDate,ticks:c?.autonomy?.ticks,latest:{date:latest.date,tasksRun:latest.tasksRun,failed:latest.failed}},
   supply:{lastProcessedDate:supply.lastProcessedDate,routeCount:supply.routes?.length||0,inventoryCount:supply.inventory?.length||0,gridCount:supply.energyGrid?.length||0,metrics:supply.metrics},
   population:{lastProcessedDate:w.population?.phase2?.lastProcessedDate,dailyTicks:w.population?.phase2?.dailyTicks,npcCount:w.population?.npcs?.length||0},
   generations:{lastProcessedDate:c?.generations?.lastProcessedDate,annualTicks:c?.generations?.annualTicks}
  };
 });
 assert.deepEqual(afterRestore,beforeRestore,'The complete three-year campaign must preserve world time, weather, hazards, autonomy, supply chains, population and generations after browser reload.');
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS 3-year daily cross-phase stress run, scheduler, integration audit and Phase 5 audit');
})();
