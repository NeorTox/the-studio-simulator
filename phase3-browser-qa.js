const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/phase3-browser-harness.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#phase3-personal').count(),1);
  const layout=await page.locator('#phase3-personal .p3grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns);
  if(viewport.width<760)assert(!layout.includes(' '),'mobile layout should be one column');
  else assert(layout.includes(' '),'desktop layout should be multi-column');
  const methods=['openTransaction','openRecurring','openEvent','openRoutine','openWellbeing','openReputation','openSuccession','openAsset','openRelationship','openInvestment'];
  for(const method of methods){
   await page.evaluate(m=>window.Phase3Founder[m](),method);
   assert.equal(await page.locator('#p3form').count(),1,method+' opens form');
   await page.locator('#dialog .btn').last().click();
  }
  await page.evaluate(()=>window.Phase3Founder.openTransaction());
  await page.locator('#p3type').selectOption('Income');await page.locator('#p3amount').fill('250');await page.locator('#p3description').fill('Browser QA income');await page.locator('#p3form button[type=submit],#p3form button').click();
  assert.equal(await page.evaluate(()=>active.founder.personalCash),10250);
  await page.evaluate(()=>window.Phase3Founder.openAsset());
  await page.locator('#p3aname').fill('QA Apartment');await page.locator('#p3acost').fill('1000');await page.locator('#p3avalue').fill('1100');await page.locator('#p3form button').click();
  assert.equal(await page.evaluate(()=>active.founder.personalCash),9250);
  assert.equal(await page.evaluate(()=>active.founder.personalFinance.accounts.find(a=>a.id==='cash').balance),9250);
  await page.evaluate(()=>window.Phase3Founder.openRelationship());
  await page.locator('#p3relname').fill('QA Friend');await page.locator('#p3form button').click();
  assert.equal(await page.evaluate(()=>active.founder.relationships.length),1);
  await page.evaluate(()=>window.Phase3Founder.openInvestment());
  await page.locator('#p3iname').fill('QA Fund');await page.locator('#p3ivalue').fill('500');await page.locator('#p3form button').click();
  assert.equal(await page.evaluate(()=>active.founder.personalFinance.investments.length),1);
  assert.deepEqual(errors,[]);
  console.log('PASS browser UI',viewport.width+'x'+viewport.height,'responsive layout, 10 modal forms, income, asset purchase, relationship, investment');
  await page.close();
 }
 await browser.close();
})();
