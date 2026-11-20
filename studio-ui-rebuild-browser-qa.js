'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__STUDIO_UI_READY__===true);
    assert.equal(await page.locator('#studio-start-screen').isVisible(),true,'Startup menu appears after loading');
    assert.equal(await page.locator('#app-shell').getAttribute('aria-hidden'),'true','Gameplay remains behind the startup menu');
    assert.equal(await page.locator('#studio-boot-screen').isVisible(),false,'Boot screen hands off to startup menu');
    assert.equal(await page.locator('.start-action').count(),4,'Startup menu exposes only implemented destinations');
    await page.locator('#start-load').click();
    assert.equal(await page.locator('#studio-start-screen').isVisible(),false);
    assert.equal(await page.locator('#page-campaign').evaluate(e=>e.classList.contains('active')),true,'Load campaign opens the campaign library');
    await page.locator('.nav button[data-page="overview"]').click();
    assert.equal(await page.locator('#app-shell').getAttribute('aria-hidden'),'false');
    assert.equal(await page.locator('.side').count(),1);
    assert.equal(await page.locator('.nav-group').count(),6);
    assert.equal(await page.locator('#page-overview').evaluate(e=>e.classList.contains('active')),true);
    const routes = await page.locator('.nav button[data-page]').evaluateAll(nodes=>nodes.map(n=>n.dataset.page));
    assert(routes.includes('overview')&&routes.includes('finance')&&routes.includes('projects')&&routes.includes('globaltravel'));
    assert.equal(new Set(routes).size,routes.length,'Every workspace appears exactly once');
    for (const route of routes) {
      await page.locator('.nav button[data-page="'+route+'"]').click();
      assert.equal(await page.locator('#page-'+route).evaluate(e=>e.classList.contains('active')),true,'Route renders: '+route);
    }
    await page.locator('.nav button[data-page="geography"]').click();
    await page.locator('#studio-world-atlas').waitFor({state:'attached'});
    assert.equal(await page.locator('#studio-atlas-search').count(),1,'World atlas provides city search');
    assert.equal(await page.locator('#studio-world-map').count(),1,'World atlas provides an interactive map mount');
    assert.equal(await page.locator('#atlas-toggle-globe').count(),1,'World atlas provides globe / flat-map projection control');
    assert.equal(await page.locator('#atlas-toggle-globe').textContent(),'VIEW FLAT MAP','World atlas opens in globe mode');
    await page.locator('#atlas-toggle-globe').click();
    assert.equal(await page.locator('#atlas-toggle-globe').textContent(),'VIEW 3D GLOBE','Globe control switches projection mode');
    await page.locator('#atlas-toggle-globe').click();
    const atlas = await page.evaluate(()=>({version:window.StudioWorldAtlas?.version,gateways:window.StudioGeography?.cities?.filter(c=>c.airport&&Number.isFinite(c.latitude)).length||0}));
    assert.equal(atlas.version,'1.0.0','World atlas runtime is connected');
    assert(atlas.gateways>=90,'World atlas exposes mapped airport gateways: '+atlas.gateways);
    await page.evaluate(()=>window.StudioWorldAtlas.selectCountry('IN'));
    assert.match(await page.locator('#studio-atlas-detail').innerText(),/India/,'Country polygon selection opens a country dossier');
    const indiaCity = await page.locator('#atlas-country-city option').nth(1).getAttribute('value');
    assert(indiaCity,'Country dossier offers mapped airport cities');
    await page.locator('#atlas-country-city').selectOption(indiaCity);
    assert.equal(await page.locator('#atlas-set-destination').count(),1,'Selecting a country city opens the destination action');
    await page.locator('.nav button[data-page="overview"]').click();
    assert.equal(await page.locator('#studio-overview-cash-chart').count(),1,'Command centre exposes a ledger-backed cash chart');
    await page.locator('.nav button[data-page="finance"]').click();
    assert.equal(await page.locator('#page-finance .workspace-tab').count(),6,'Finance is separated into six operational workspaces');
    assert.equal(await page.locator('#studio-finance-category-chart').count(),1,'Finance exposes a real expense-category chart');
    assert.equal(await page.locator('#studio-finance-portfolio-chart').count(),1,'Finance exposes a real treasury and investment allocation chart');
    for (const tab of ['accounting','operations','capital','investments','audit','overview']) {
      await page.locator('#page-finance [data-workspace-tab="'+tab+'"]').click();
      assert.equal(await page.locator('#page-finance [data-workspace-tab="'+tab+'"]').getAttribute('aria-selected'),'true');
    }
    await page.locator('.nav button[data-page="projects"]').click();
    assert.equal(await page.locator('#page-projects .workspace-tab').count(),2,'Production slate and contracts are separate workspaces');
    assert.equal(await page.locator('#studio-production-readiness-chart').count(),1,'Production exposes a project-readiness chart');
    await page.locator('#page-projects [data-workspace-tab="contracts"]').click();
    assert.equal(await page.locator('#productioncontracts').isVisible(),true);
    await page.locator('.nav button[data-page="talent"]').click();
    assert.equal(await page.locator('#page-talent .workspace-tab').count(),2,'Talent roster and casting contracts are separated');
    await page.locator('.nav button[data-page="market"]').click();
    assert.equal(await page.locator('#page-market .workspace-tab').count(),4,'Market intelligence is grouped by player task');
    assert.equal(await page.locator('#studio-market-regional-economy-chart').count(),1,'Market exposes a regional economy comparison chart');
    await page.locator('.nav button[data-page="media"]').click();
    assert.equal(await page.locator('#page-media .workspace-tab').count(),2,'Newsroom and publicity are separate workspaces');
    await page.locator('.nav button[data-page="overview"]').click();
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#mobile-nav').isVisible(),true,'Mobile has a dedicated bottom navigation bar');
    assert.equal(await page.locator('#mobile-menu-toggle').isVisible(),true,'Mobile has an accessible workspace drawer control');
    const mobile = await page.evaluate(()=>({
      bodyWidth:document.body.scrollWidth,
      overflowElements:Array.from(document.querySelectorAll('body *')).map(e=>({tag:e.tagName,id:e.id,cls:String(e.className||'').slice(0,80),left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)})).filter(e=>e.right>document.documentElement.clientWidth+1&&e.width>0).slice(0,12),
      viewportWidth:document.documentElement.clientWidth,
      bottomNavHeight:Math.round(document.querySelector('#mobile-nav').getBoundingClientRect().height),
      contentWidth:Math.round(document.querySelector('#game-content').getBoundingClientRect().width),
      portraitWarning:getComputedStyle(document.body,'::before').content
    }));
    assert(mobile.bodyWidth<=mobile.viewportWidth+1,'No horizontal page overflow on mobile: '+JSON.stringify(mobile));
    assert(mobile.bottomNavHeight>=60,'Mobile touch navigation has adequate height');
    assert.notEqual(mobile.portraitWarning,'"THE STUDIO is designed for landscape. Rotate your device to continue."','Portrait mode is supported');
    await page.locator('#mobile-menu-toggle').click();
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('nav-open')),true);
    await page.locator('.nav button[data-page="finance"]').click();
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('nav-open')),false);
    assert.equal(await page.locator('#page-finance').evaluate(e=>e.classList.contains('active')),true);
    await page.setViewportSize({width:844,height:390});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#mobile-nav').isVisible(),true,'Landscape mobile remains supported');
    assert.equal(await page.locator('#page-finance').count(),1,'Legacy finance renderer anchor survives');
    assert.equal(await page.locator('#page-projects').count(),1,'Legacy production renderer anchor survives');
    assert.equal(await page.locator('#page-personal').count(),1,'Legacy life renderer anchor survives');
    assert.equal(await page.locator('#modal').count(),1,'Legacy modal/action host survives');
    assert.equal(await page.locator('#toast').count(),1,'Legacy notification host survives');
    assert.deepEqual(errors,[],'No browser errors during shell and route checks');
    console.log('STUDIO_UI_REBUILD_QA: PASS');
    console.log('Routes checked: '+routes.length+' | Mobile: portrait + landscape | Startup: pass | Browser errors: 0');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});