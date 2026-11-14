const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:4173/phase3-browser-harness.html',{waitUntil:'networkidle'});
 await page.evaluate(()=>window.Phase3Founder.openRelationship());
 await page.locator('#p3relname').fill('Persisted Friend');
 await page.locator('#p3form button').click();
 await page.evaluate(()=>window.Phase3Founder.openEvent());
 await page.locator('#p3etitle').fill('Premiere Night');
 await page.locator('#p3form button').click();
 const before=await page.evaluate(()=>({cash:active.founder.personalCash,relationships:active.founder.relationships.length,events:active.founder.personalCalendar.length}));
 await page.reload({waitUntil:'networkidle'});
 const after=await page.evaluate(()=>({cash:active.founder.personalCash,relationships:active.founder.relationships.length,events:active.founder.personalCalendar.length,phase3:active.founder.phase3.version}));
 assert.deepEqual(after,{...before,phase3:'3.0.2'});
 console.log('PASS browser save/reload round trip',JSON.stringify(after));
 await browser.close();
})();
