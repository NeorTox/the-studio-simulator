const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1440,height:900},acceptDownloads:true});await p.addInitScript(()=>{window.__STUDIO_DISABLE_AUTO_TUTORIAL=true;window.__STUDIO_TEST_ACCELERATION=true;localStorage.setItem('the-studio-onboarding-v1','skipped')});const errors=[];
 const batchProgress=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{const message=m.text();if(m.type()==='error')errors.push(message);if(message.includes('[STUDIO_BATCH_PROGRESS]')){const match=message.match(/\[STUDIO_BATCH_PROGRESS\]\s+(\{.*\})/);if(match){try{batchProgress.push(JSON.parse(match[1]))}catch(e){errors.push('Invalid batch progress telemetry: '+e.message)}}}if(message.includes('[STUDIO_BATCH_')||message.includes('[STUDIO_CLOCK_')||message.includes('[STUDIO_CORE_STAGE]')||message.includes('[STUDIO_WORLD_STAGE]')||message.includes('[STUDIO_ADVANCE_TRACE]')||message.includes('[STUDIO_ADVANCE_STEP]'))console.log(message)});
 await p.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
 await p.locator('#page-overview .hero .actions button').first().click();await p.getByRole('button',{name:/Create campaign/}).click();
 for(const [id,v] of [['nfounder','End-to-End Founder'],['ncompany','E2E Pictures'],['ncountry','India'],['ncity','Kochi']])await p.locator('#'+id).fill(v);
 await p.getByRole('button',{name:/Create and save campaign/}).click();
 const initial=await p.evaluate(()=>({date:active.date,cash:Number(active.founder.personalCash),id:active.id}));
 await p.getByRole('button',{name:/Personal/}).click();
 const recurring=[
  {name:'Monthly rent',amount:'100',freq:'monthly'},
  {name:'Quarterly tax',amount:'300',freq:'quarterly'},
  {name:'Annual insurance',amount:'1200',freq:'annual'}
 ];
 for(const item of recurring){
  await p.evaluate(()=>Phase3Founder.openRecurring());
  await p.locator('#p3rname').fill(item.name);await p.locator('#p3ramount').fill(item.amount);await p.locator('#p3freq').selectOption(item.freq);await p.locator('#p3rtype').selectOption('Expense');
  await p.locator('#p3form button[type=submit],#p3form button').click();
 }
 await p.evaluate(()=>Phase3Founder.openAsset());
 await p.locator('#p3aname').fill('Founder Home');await p.locator('#p3atype').selectOption('Property');await p.locator('#p3alocation').fill('Kochi');await p.locator('#p3acost').fill('10000');await p.locator('#p3avalue').fill('12000');await p.locator('#p3amaint').fill('50');await p.locator('#p3form button').click();
 await p.evaluate(()=>Phase3Founder.openAsset());
 await p.locator('#p3aname').fill('Founder Car');await p.locator('#p3atype').selectOption('Vehicle');await p.locator('#p3alocation').fill('Kochi');await p.locator('#p3acost').fill('5000');await p.locator('#p3avalue').fill('5000');await p.locator('#p3amaint').fill('25');await p.locator('#p3form button').click();
 await p.evaluate(()=>Phase3Founder.openInvestment());
 await p.locator('#p3iname').fill('Index Portfolio');await p.locator('#p3ivalue').fill('1000');await p.locator('#p3ireturn').fill('1');await p.locator('#p3form button').click();
 const before=await p.evaluate(()=>({date:active.date,cash:Number(active.founder.personalCash),recurring:active.founder.personalFinance.recurring.length}));
 await p.getByRole('button',{name:/Overview/}).click();
 await p.evaluate(()=>{window.__studioBatchDebug=true;window.__studioBatchDebugUntilDay=active.day+5;console.info('[STUDIO_BATCH_PROFILE]',JSON.stringify({date:active.date,day:active.day,npcs:active.world?.population?.npcs?.length||0,virtualResidents:active.world?.population?.virtualResidents||0,projects:active.projects?.length||0,employees:active.employees?.length||0,equities:active.market?.equities?.length||0,events:active.world?.events?.length||0,ledger:active.ledger?.length||0,phase2Last:active.world?.population?.phase2?.lastProcessedDate||null}))});
 await p.getByRole('button',{name:/(?:\+1 year|YEAR \+1)/i}).click({timeout:120000});
 await p.waitForFunction(()=>!window.__advanceBatchActive,null,{timeout:900000});
 const simulated=await p.evaluate(()=>({date:active.date,clockFrozen:active.clockFrozen,batchActive:!!window.__advanceBatchActive,toast:document.querySelector('#toast')?.textContent||''}));
 console.log('YEAR ADVANCE COMPLETION',JSON.stringify(simulated));
 assert.equal(simulated.date,'2027-11-14','Year advance stopped early; inspect clock, cash and toast diagnostics');
 const dailyAudit=await p.evaluate(startDate=>{
  const add=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
  const expected=Array.from({length:365},(_,i)=>add(startDate,i+1)),days=active.integration?.days||{};
  const required=['world-before-life','population-founder-company','phase6-ecosystem','phase6-audience','phase7-smartphone','phase8-financial-empire','phase9-global-economy','phase10-competitors','phase11-technology-sustainability'];
  const missing=expected.filter(date=>{const d=days[date];return !d||d.status!=='completed'||required.some(step=>!d.steps?.some(x=>x.name===step))});
  const modules={
   world:active.world?.time?.lastProcessedDate,
   phase6:active.ecosystem?.lastProcessedDate,
   audience:active.ecosystem?.audienceLastProcessedDate,
   phase7:active.smartphone?.lastProcessedDate,
   phase8:active.financialEmpire?.lastProcessedDate||active.financial?.lastProcessedDate||window.Phase8FinancialEmpire?.ensure?.()?.lastProcessedDate,
   phase9:window.Phase9GlobalEconomy?.ensure?.()?.lastProcessedDate,
   phase10:window.Phase10Competitors?.ensure?.()?.lastProcessedDate,
   phase11:active.technology?.lastProcessedDate
  };
  return {expectedDays:expected.length,recordedDays:expected.filter(date=>days[date]?.status==='completed').length,missing:missing.slice(0,12),first:expected[0],last:expected.at(-1),modules};
 },initial.date);
 console.log('ONE-YEAR DAILY PIPELINE AUDIT',JSON.stringify(dailyAudit));
 assert.equal(dailyAudit.expectedDays,365);
 assert.equal(dailyAudit.recordedDays,365,'Every calendar day must complete the integration pipeline');
 assert.deepEqual(dailyAudit.missing,[],'Every simulated day must include all required phase checkpoints');
 for(const [module,date] of Object.entries(dailyAudit.modules))assert.equal(date,simulated.date,module+' did not commit the final simulated date');
 assert.equal(batchProgress.length,13,'365 days at 30 days per chunk must execute 13 batches');
 assert.equal(batchProgress.reduce((sum,x)=>sum+x.chunkDays,0),365,'Batch telemetry must account for every simulated day');
 assert(batchProgress.every(x=>x.chunkDays>=1&&x.chunkDays<=30),'No batch may exceed 30 days or report zero progress');
 const after=await p.evaluate(()=>({date:active.date,cash:Number(active.founder.personalCash),entries:active.founder.personalFinance.ledger.filter(x=>x.source==='recurring').map(x=>({description:x.description,amount:x.amount,date:x.date})),lastDay:active.founder.phase3.lastDay}));
 console.log('LONG SIM',JSON.stringify({initial,before,after}));
 assert.equal(after.date,'2027-11-14');assert.equal(after.entries.filter(x=>x.description==='Monthly rent').length,12);assert.equal(after.entries.filter(x=>x.description==='Quarterly tax').length,4);assert.equal(after.entries.filter(x=>x.description==='Annual insurance').length,1);
 assert.equal(after.lastDay,after.date);
 const assetDrift=await p.evaluate(()=>({property:active.founder.personalAssets.find(x=>x.name==='Founder Home').currentValue,vehicle:active.founder.personalAssets.find(x=>x.name==='Founder Car').currentValue,investment:active.founder.personalFinance.investments.find(x=>x.name==='Index Portfolio').value,maintenance:active.founder.personalFinance.ledger.filter(x=>x.source==='asset-maintenance').length}));
 console.log('ASSET / INVESTMENT DRIFT',JSON.stringify(assetDrift));
 assert(assetDrift.property>12000);assert(assetDrift.vehicle<5000);assert(assetDrift.investment>1000);assert.equal(assetDrift.maintenance,24);
 await p.getByRole('button',{name:/Campaigns/}).click();
 const dlPromise=p.waitForEvent('download');
 await p.getByRole('button',{name:/Export active save/}).click();
 const dl=await dlPromise;
 const file=await dl.path();const exported=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(exported.founder.personalFinance.recurring.length,3);
 assert.equal(exported.founder.phase3.version,'3.0.3');
 console.log('EXPORT PASS',dl.suggestedFilename(),fs.statSync(file).size,'bytes');
 // Re-import the actual exported campaign through the application's file input.
 await p.locator('#importfile').setInputFiles(file);await p.waitForTimeout(150);
 assert.equal(await p.evaluate(()=>active.founder.personalFinance.ledger.filter(x=>x.source==='recurring').length),17);
 await p.reload({waitUntil:'networkidle'});
 const reloaded=await p.evaluate(()=>({date:active.date,version:active.founder.phase3.version,recurring:active.founder.personalFinance.recurring.length,ledger:active.founder.personalFinance.ledger.filter(x=>x.source==='recurring').length}));
 console.log('IMPORT/RELOAD PASS',JSON.stringify(reloaded));
 assert.deepEqual(reloaded,{date:'2027-11-14',version:'3.0.3',recurring:3,ledger:17});
 // Legacy migration: remove Phase 3 additions and import a valid old-format campaign.
 const legacy=JSON.parse(JSON.stringify(exported));legacy.id='LEGACY-PHASE3-QA';legacy.founder.personalCash=5000;delete legacy.founder.phase3;delete legacy.founder.personalFinance;delete legacy.founder.dailyRoutine;delete legacy.founder.personalCalendar;delete legacy.founder.reputation;delete legacy.founder.succession;delete legacy.founder.wellbeing;
 console.log('LEGACY INPUT SHAPE',JSON.stringify({id:legacy.id,date:legacy.date,founder:{name:legacy.founder?.name,personalCash:legacy.founder?.personalCash,keys:Object.keys(legacy.founder||{})},company:{name:legacy.company?.name,cash:legacy.company?.cash,currency:legacy.company?.currency},validDate:typeof legacy.date==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(legacy.date)&&!Number.isNaN(Date.parse(legacy.date+'T00:00:00Z'))&&new Date(legacy.date+'T00:00:00Z').toISOString().slice(0,10)===legacy.date}));const legacyPath=path.join(os.tmpdir(),'legacy-phase3-qa.json');fs.writeFileSync(legacyPath,JSON.stringify(legacy));
 await p.locator('#importfile').setInputFiles(legacyPath);await p.waitForFunction(()=>active?.id==='LEGACY-PHASE3-QA'||document.querySelector('#toast')?.textContent.startsWith('Import failed:'),null,{timeout:10000});
 const migrated=await p.evaluate(()=>({id:active.id,cash:active.founder.personalCash,version:active.founder.phase3?.version,cashAccount:active.founder.personalFinance.accounts.find(x=>x.id==='cash')?.balance,toast:document.querySelector('#toast')?.textContent,errors:window.__legacyImportErrors||[]}));
 console.log('LEGACY MIGRATION',JSON.stringify(migrated));
 assert.equal(migrated.id,'LEGACY-PHASE3-QA');assert.equal(migrated.cash,5000);assert.equal(migrated.version,'3.0.3');assert.equal(migrated.cashAccount,5000);
 assert.deepEqual(errors,[]);
 console.log('PASS full Phase 3 actual campaign long-horizon + export/import + legacy migration');
 await b.close();
})();
