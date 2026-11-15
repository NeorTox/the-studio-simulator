const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/New campaign/}).click();
 await page.getByRole('button',{name:/Create campaign/}).click();
 for(const [id,value] of [['nfounder','Integration Stress Founder'],['ncompany','Integration Stress Studios'],['ncountry','India'],['ncity','Mumbai']])await page.locator('#'+id).fill(value);
 await page.getByRole('button',{name:/Create and save campaign/}).click();
 const start=await page.evaluate(()=>active.date);
 const setup=await page.evaluate(()=>{
  const p=window.StudioPhase0;
  if(!p?.phase1?.processWorldDay||!window.StudioPopulationEngine?.processDay||!window.Phase3Founder?.stepDay||!window.Phase4Company?.stepDay||!window.Phase5Production?.audit||!window.Phase6Ecosystem?.stepDay||!window.Phase6Ecosystem?.audit)throw Error('Required Phase 0–6 API is missing');
  const scheduler=p.createCampaignScheduler();
  scheduler.schedule('world:story',addDays(active.date,45),{title:'Integration stress scheduled event'});
  return {date:active.date,npcs:active.npcs?.length||0};
 });
 // 1,095 simulated days, advanced in 30-day chunks to exercise the real public advance path.
 for(let i=0;i<37;i++)await page.evaluate(days=>window.advance(Math.min(days,1095-(window.__stressDays||0))),30).then(()=>page.evaluate(()=>{window.__stressDays=(window.__stressDays||0)+30;})).catch(e=>{throw e;});
 const result=await page.evaluate(()=>{
  const w=active.world?.time,pop=active.world?.population?.phase2,founder=active.founder?.phase3,company=window.Phase4Company.ensure(),ecosystem=active.ecosystem,telemetry=active.integration;
  const worldDate=w?.lastProcessedDate,popDate=pop?.lastProcessedDate,founderDate=founder?.lastDay,companyDate=company?.lastProcessedDate,ecosystemDate=ecosystem?.lastProcessedDate;
  const report=window.StudioPhaseIntegration.audit();
  return {date:active.date,start:active.startDate,worldDate,worldDays:w?.processedDays,popDate,popDays:pop?.dailyTicks,founderDate,companyDate,companyDays:company?.processedDays,ecosystemDate,audienceDate:ecosystem?.audienceLastProcessedDate,audienceSegments:ecosystem?.audienceSegments?.length,ecosystemVersion:ecosystem?.version,trackedDays:Object.keys(telemetry?.days||{}).length,completedDays:Object.values(telemetry?.days||{}).filter(x=>x.status==='completed').length,schedulerHistory:active.simulationKernel?.history?.length,schedulerQueue:active.simulationKernel?.queue?.length,phase6PipelineDays:Object.values(telemetry?.days||{}).filter(d=>d.status==='completed'&&d.steps.some(x=>x.name==='phase6-ecosystem')&&d.steps.some(x=>x.name==='phase6-audience')).length,audit:{passed:report.passed,failed:report.failed,tests:report.tests},phase5:window.Phase5Production.audit()};
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
 assert.equal(result.phase6PipelineDays,1095,'Every completed integration day must include Phase 6 ecosystem and audience processing.');
 assert(result.trackedDays>=1095);
 assert.equal(result.audit.failed,0,JSON.stringify(result.audit.tests.filter(x=>!x.ok)));
 assert.equal(result.phase5.failed,0);
 const phase6=await page.evaluate(()=>window.Phase6Ecosystem.audit());
 assert.equal(phase6.failed,0,JSON.stringify(phase6.tests.filter(x=>!x.ok)));
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS 3-year daily cross-phase stress run, scheduler, integration audit and Phase 5 audit');
})();
