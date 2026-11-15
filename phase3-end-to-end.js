const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1440,height:900},acceptDownloads:true});const errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
 await p.getByRole('button',{name:/New campaign/}).click();await p.getByRole('button',{name:/Create campaign/}).click();
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
 await p.getByRole('button',{name:/\+1 year/}).click();
 await p.waitForTimeout(500);
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
 const legacyPath=path.join(os.tmpdir(),'legacy-phase3-qa.json');fs.writeFileSync(legacyPath,JSON.stringify(legacy));
 await p.locator('#importfile').setInputFiles(legacyPath);await p.waitForTimeout(150);
 const migrated=await p.evaluate(()=>({id:active.id,cash:active.founder.personalCash,version:active.founder.phase3?.version,cashAccount:active.founder.personalFinance.accounts.find(x=>x.id==='cash')?.balance}));
 console.log('LEGACY MIGRATION',JSON.stringify(migrated));
 assert.equal(migrated.id,'LEGACY-PHASE3-QA');assert.equal(migrated.cash,5000);assert.equal(migrated.version,'3.0.3');assert.equal(migrated.cashAccount,5000);
 assert.deepEqual(errors,[]);
 console.log('PASS full Phase 3 actual campaign long-horizon + export/import + legacy migration');
 await b.close();
})();
