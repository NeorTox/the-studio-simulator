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
    await page.locator('.nav button[data-page="world"]').click();
    assert.equal(await page.locator('#page-world .workspace-tab').count(),2,'World era profile and historical systems are separate workspaces');
    assert.equal(await page.locator('#world-era-profile-workspace').count(),1,'World has a native era profile workspace');
    assert.equal(await page.locator('#world-historical-systems-workspace').count(),1,'World has a historical systems workspace');
    for (const id of ['worldtitle','worlddesc','worldprofile','worldsystems']) assert.equal(await page.locator('#'+id).count(),1,'World renderer target is preserved: '+id);
    await page.locator('.nav button[data-page="digital"]').click();
    assert.equal(await page.locator('#page-digital .workspace-tab').count(),2,'Digital platforms are split between performance and portfolio');
    for (const id of ['digital-performance-workspace','digital-portfolio-workspace','digitalstats','digitallist']) assert.equal(await page.locator('#'+id).count(),1,'Digital renderer target is preserved: '+id);
    assert.equal(await page.locator('#page-digital button#newdigital').count(),1,'Launch-platform action remains mounted');
    await page.locator('.nav button[data-page="sustainability"]').click();
    assert.equal(await page.locator('#page-sustainability .workspace-tab').count(),3,'Sustainability has operating, investment and history workspaces');
    for (const id of ['sustainability-operations-workspace','sustainability-investments-workspace','sustainability-history-workspace','sustainstats','sustaincontrols','greeninvestments','carbonhistory']) assert.equal(await page.locator('#'+id).count(),1,'Sustainability renderer target is preserved: '+id);
    await page.locator('.nav button[data-page="governance"]').click();
    assert.equal(await page.locator('#page-governance .workspace-tab').count(),2,'Governance separates board/ownership and resolutions');
    for (const id of ['governance-board-workspace','governance-resolutions-workspace','governancestats','boardlist','ownershiplist','resolutionlist']) assert.equal(await page.locator('#'+id).count(),1,'Governance renderer target is preserved: '+id);
    assert.equal(await page.locator('#page-governance button#newdirector').count(),1,'Director appointment action remains mounted');
    assert.equal(await page.locator('#page-governance button#newresolution').count(),1,'Board resolution action remains mounted');
    await page.locator('.nav button[data-page="population"]').click();
    assert.equal(await page.locator('#page-population .workspace-tab').count(),2,'Population registry and life events are separate');
    for (const id of ['population-registry-workspace','population-life-workspace','npcstats','npclist','npcevents','population-age-chart-slot']) assert.equal(await page.locator('#'+id).count(),1,'Population renderer target is preserved: '+id);
    assert.equal(await page.locator('#studio-population-age-chart').evaluate(e=>e.parentElement.id),'population-age-chart-slot','Population chart is mounted in its registry workspace');
    await page.locator('.nav button[data-page="algorithms"]').click();
    assert.equal(await page.locator('#page-algorithms .workspace-tab').count(),2,'Algorithm inventory and validation results are separate');
    for (const id of ['algorithms-inventory-workspace','algorithms-audit-workspace','algorithmcatalog','algorithmresults']) assert.equal(await page.locator('#'+id).count(),1,'Algorithm renderer target is preserved: '+id);
    await page.locator('.nav button[data-page="time"]').click();
    assert.equal(await page.locator('#page-time .workspace-tab').count(),2,'World clock status and simulation rules are separate');
    for (const id of ['worldclock-status-workspace','worldclock-rules-workspace','clockcontrols','clockdate','clockprogress']) assert.equal(await page.locator('#'+id).count(),1,'Clock renderer target is preserved: '+id);
    await page.locator('.nav button[data-page="distribution"]').click();
    assert.equal(await page.locator('#page-distribution .workspace-tab').count(),2,'Distribution rights and settlements are separate');
    assert.equal(await page.locator('#distribution-settlement-chart-slot').count(),1,'Distribution has an explicit settlement chart mount');
    assert.equal(await page.locator('#studio-distribution-settlement-chart').evaluate(e=>e.parentElement.id),'distribution-settlement-chart-slot','Settlement chart is mounted inside its own workspace');
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
    assert.equal(await page.locator('#studio-settings-dock [data-page="settings"]').count(),1,'Settings has a dedicated pinned navigation destination');
    assert.equal(await page.locator('.nav button[data-page="settings"]').count(),0,'Settings is not buried among ordinary workspaces');
    assert.equal(await page.locator('#stui-settings-shortcut').count(),1,'Settings is also reachable from the persistent top bar');
    await page.locator('#stui-settings-shortcut').click();
    assert.equal(await page.locator('#page-settings').isVisible(),true,'Player settings workspace opens from the top bar');
    assert.equal(await page.locator('#settings-category-display').count(),0,'Settings category panels are not duplicated');
    assert.equal(await page.locator('[data-settings-category]').count(),3,'Settings exposes distinct display, accessibility and device categories');
    assert.equal(await page.locator('[data-settings-panel="display"]').isVisible(),true,'Display category opens first');
    await page.locator('#setting-density').selectOption('compact');
    assert.equal(await page.locator('html').getAttribute('data-ui-density'),'compact','Compact density applies immediately');
    await page.locator('#setting-font').selectOption('1.1');
    assert.equal(await page.locator('html').evaluate(e=>e.style.fontSize),'17.6px','Text scaling applies immediately');
    await page.locator('[data-settings-category="accessibility"]').click();
    assert.equal(await page.locator('[data-settings-panel="accessibility"]').isVisible(),true,'Accessibility has its own settings screen');
    await page.locator('#setting-contrast').selectOption('high');
    assert.equal(await page.locator('html').getAttribute('data-ui-contrast'),'high','High contrast applies immediately');
    await page.locator('#setting-motion').check();
    assert.equal(await page.locator('html').getAttribute('data-ui-motion'),'reduced','Reduced motion applies immediately');
    await page.locator('#setting-hints').uncheck();
    assert.equal(await page.locator('html').getAttribute('data-ui-hints'),'hidden','Contextual hints can be hidden');
    await page.locator('#settings-search').fill('contrast');
    assert.equal(await page.locator('#setting-contrast').isVisible(),true,'Settings search finds the matching control');
    assert.equal(await page.locator('#setting-motion').isVisible(),false,'Settings search filters unrelated controls');
    await page.locator('#settings-search').fill('');
    await page.locator('[data-settings-category="device"]').click();
    assert.equal(await page.locator('[data-settings-panel="device"]').isVisible(),true,'Device profile is a separate category');
    const savedSettings = await page.evaluate(()=>JSON.parse(localStorage.getItem('the-studio-ui-preferences-v1')));
    assert.deepEqual(savedSettings,{density:'compact',fontScale:1.1,contrast:'high',reduceMotion:true,showHints:false},'Interface preferences persist locally');
    await page.locator('#settings-reset').click();
    assert.equal(await page.locator('html').getAttribute('data-ui-density'),'comfortable','Reset restores comfortable density');
    assert.equal(await page.locator('html').getAttribute('data-ui-motion'),'full','Reset restores motion defaults');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('the-studio-ui-preferences-v1'))),{density:'comfortable',fontScale:1,contrast:'standard',reduceMotion:false,showHints:true},'Reset persists the default interface profile');
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
    assert.equal(await page.locator('#studio-command-launchpad .studio-command-action').count(),6,'Command centre exposes six quick operational actions');
    await page.locator('#studio-command-launchpad [data-command-action="market"]').click();
    assert.equal(await page.locator('#page-market').evaluate(e=>e.classList.contains('active')),true,'Command-centre industry shortcut opens Market');
    await page.locator('.nav button[data-page="finance"]').click();
    assert.equal(await page.locator('#page-finance .workspace-tab').count(),6,'Finance is separated into six operational workspaces');
    for (const id of ['finance-overview-workspace','finance-accounting-workspace','finance-operations-workspace','finance-capital-workspace','finance-investment-workspace','finance-audit-workspace']) {
      assert.equal(await page.locator('#'+id).count(),1,'Finance has a native page structure for '+id);
    }
    assert.equal(await page.locator('#balancesheet').count(),1,'Balance sheet renderer target is preserved');
    assert.equal(await page.locator('#ledger').count(),1,'General ledger renderer target is preserved');
    assert.equal(await page.locator('#trialbalance').count(),1,'Trial balance renderer target is preserved');
    assert.equal(await page.locator('#invoicelist').count(),1,'Invoice register renderer target is preserved');
    assert.equal(await page.locator('#assetlist').count(),1,'Fixed asset renderer target is preserved');
    assert.equal(await page.locator('#loanlist').count(),1,'Debt facility renderer target is preserved');
    assert.equal(await page.locator('#page-finance button[onclick*="transactionForm"]').count(),1,'Finance transaction action remains mounted');
    assert.equal(await page.locator('#studio-finance-category-chart').count(),1,'Finance exposes a real expense-category chart');
    assert.equal(await page.locator('#studio-finance-category-chart').evaluate(e=>e.parentElement.id),'finance-overview-charts','Expense chart is mounted in the Finance overview workspace');
    assert.equal(await page.locator('#studio-finance-portfolio-chart').count(),1,'Finance exposes a real treasury and investment allocation chart');
    assert.equal(await page.locator('#studio-finance-portfolio-chart').evaluate(e=>e.parentElement.id),'finance-overview-charts','Treasury chart is mounted in the Finance overview workspace');
    for (const tab of ['accounting','operations','capital','investments','audit','overview']) {
      await page.locator('#page-finance [data-workspace-tab="'+tab+'"]').click();
      assert.equal(await page.locator('#page-finance [data-workspace-tab="'+tab+'"]').getAttribute('aria-selected'),'true');
    }
    await page.locator('.nav button[data-page="projects"]').click();
    assert.equal(await page.locator('#page-projects .workspace-tab').count(),2,'Production slate and contracts are separate workspaces');
    assert.equal(await page.locator('#production-slate-workspace').count(),1,'Production slate has its own native page structure');
    assert.equal(await page.locator('#production-contract-workspace').count(),1,'Vendor contracts have their own native page structure');
    assert.equal(await page.locator('#projectlist').count(),1,'Project slate renderer target is preserved');
    assert.equal(await page.locator('#productioncontracts').count(),1,'Production payment renderer target is preserved');
    assert.equal(await page.locator('#page-projects [data-production-wizard-trigger="true"]').count(),1,'New-project action opens the guided production workflow');
    assert.equal(await page.locator('#studio-production-pipeline').count(),1,'Production slate includes a project pipeline workspace');
    assert.equal(await page.evaluate(()=>window.StudioProductionWorkflow?.stages?.length),7,'Production pipeline follows all seven live simulation stages');
    assert.equal(await page.locator('#studio-production-readiness-chart').count(),1,'Production exposes a project-readiness chart');
    assert.equal(await page.locator('#studio-production-readiness-chart').evaluate(e=>e.parentElement.id),'production-slate-charts','Production chart is mounted in the slate workspace'); 
    await page.evaluate(()=>newCampaignForm());
    await page.locator('#ndate').fill('2026-11-21');
    await page.locator('#nfounder').fill('QA Founder');
    await page.locator('#ncompany').fill('QA Studio');
    await page.locator('#ncountry').fill('India');
    await page.locator('#ncity').fill('Mumbai');
    await page.locator('#ncapital').fill('20000000');
    await page.locator('#newform button[type="submit"],#newform button').click();
    await page.waitForFunction(()=>active?.founder?.name==='QA Founder');
    await page.evaluate(()=>{
      active.projects=[];
      active.productionContracts=[];
      window.StudioProductionWorkflow.refresh();
    });
    await page.locator('#page-projects [data-production-wizard-trigger="true"]').click();
    assert.equal(await page.locator('#studio-production-wizard').evaluate(e=>e.open),true,'New production opens a native guided setup dialog');
    assert.equal(await page.locator('.production-wizard-steps button').count(),6,'Project creation is split into six understandable steps');
    await page.locator('#studio-production-wizard input[name="title"]').fill('The Meridian Project');
    await page.locator('#studio-production-wizard input[name="genre"]').fill('Science fiction');
    await page.locator('#studio-production-wizard input[name="logline"]').fill('A crew discovers an impossible signal.');
    await page.locator('#studio-production-wizard [data-wizard-next]').click();
    assert.equal(await page.locator('.production-wizard-step-title').textContent(),'Define the creative direction','Wizard advances from concept to creative brief');
    await page.locator('#studio-production-wizard textarea[name="synopsis"]').fill('A deep-space discovery changes the course of an expedition.');
    await page.locator('#studio-production-wizard [data-wizard-next]').click();
    assert.equal(await page.locator('.production-wizard-step-title').textContent(),'Set the initial budget','Creative brief advances to budget approval');
    await page.locator('#studio-production-wizard input[name="budget"]').fill('12500000');
    await page.locator('#studio-production-wizard [data-wizard-next]').click();
    assert.equal(await page.locator('.production-wizard-step-title').textContent(),'Shape the production plan','Budget advances to the production plan');
    await page.locator('#studio-production-wizard [data-wizard-next]').click();
    assert.equal(await page.locator('.production-wizard-step-title').textContent(),'Think about the release','Production plan advances to release planning');
    await page.locator('#studio-production-wizard [data-wizard-next]').click();
    assert.equal(await page.locator('.production-wizard-step-title').textContent(),'Review the project brief','Wizard reaches the final review');
    assert.match(await page.locator('.production-wizard-review').innerText(),/The Meridian Project/,'Final review shows the project name');
    assert.match(await page.locator('.production-wizard-review').innerText(),/12,500,000/,'Final review shows the approved project budget');
    await page.locator('#studio-production-wizard [data-wizard-back]').click();
    assert.equal(await page.locator('.production-wizard-step-title').textContent(),'Think about the release','Player can revisit a prior setup step before submission');
    await page.locator('#studio-production-wizard [data-wizard-close]').click();
    assert.equal(await page.locator('#studio-production-wizard').evaluate(e=>e.open),false,'Wizard can be safely closed before project submission');
    await page.evaluate(()=>{
      active.projects=[{
        id:'PRJ-QA-001',title:'The Meridian Project',format:'Feature film',genre:'Science fiction',
        budget:12500000,spent:0,committed:180000,contractCommitted:'25000',cast:[{actorName:'Ava QA',role:'Lead',fee:125000}],
        crew:[{name:'Niko QA',role:'Director',contractType:'Fixed project engagement',fee:180000}],
        stage:0,stageStarted:active.date,stageHistory:[{stage:'Concept',date:active.date,cost:0}],
        budgetLines:[
          {stageIndex:0,stageName:'Concept',category:'Story & development',budget:'1250000',actual:'0',committed:'0',status:'Planned'},
          {stageIndex:1,stageName:'Development',category:'Creative development',budget:'1875000',actual:'0',committed:'0',status:'Planned'}
        ],
        developmentBrief:{
          logline:'A crew discovers an impossible signal.',synopsis:'A deep-space discovery changes the course of an expedition.',
          creativeTone:'Grounded and suspenseful',intendedAudience:'Teen and young adult',classificationTarget:'Teen audience target',
          financingApproach:'Company-funded',productionBase:'Mumbai, India',productionApproach:'Hybrid',
          plannedStartDate:'2026-12-01',targetCompletionDate:'2027-06-01',
          intendedReleaseRoute:'Streaming license',targetReleaseDate:'2027-08-18',targetTerritories:'Worldwide'
        },
        development:{
          logline:'A crew discovers an impossible signal.',
          synopsis:'A deep-space discovery changes the course of an expedition.',
          scriptDraft:'FADE IN: EXT. DEEP SPACE — A research vessel drifts beyond the mapped frontier. A signal repeats from the dark. The crew prepares to investigate.',
          scriptStatus:'Not started',revisions:[],notes:[],greenlight:null,
          checklist:{director:false,producer:false,budget:false,cast:false,locations:false,schedule:false},
          quality:{script:0,originality:0,feasibility:0}
        }
      }];
      active.productionContracts=[{
        id:'PC-QA-001',projectId:'PRJ-QA-001',projectTitle:'The Meridian Project',vendor:'Northlight Rentals',
        category:'Camera equipment',total:'25000',schedule:[{label:'Deposit',dueDate:'2026-12-10',amount:'25000',status:'Pending'}]
      }];
      window.StudioProductionWorkflow.refresh();
    });
    assert.equal(await page.locator('#studio-production-pipeline [data-pipeline-open="PRJ-QA-001"]').count(),1,'Each pipeline project exposes its own command-centre entry point');
    await page.locator('#studio-production-pipeline [data-pipeline-open="PRJ-QA-001"]').click();
    assert.equal(await page.locator('#studio-project-command-centre').evaluate(e=>e.open),true,'Project command centre opens as a dedicated native workspace');
    assert.equal(await page.locator('#studio-project-command-centre [data-project-tab]').count(),5,'Project command centre separates command, creative, budget, people and release');
    assert.equal(await page.evaluate(()=>typeof window.Phase5Production.openScriptRoom),'function','Project centre can open the authoritative Phase 5 Script room');
    assert.equal(await page.evaluate(()=>typeof window.Phase5Production.openScriptReview),'function','Project centre can open the authoritative Phase 5 script review');
    assert.equal(await page.evaluate(()=>typeof window.Phase5Production.openProjectGreenlight),'function','Project centre can open the authoritative Phase 5 greenlight workflow');
    assert.equal(await page.evaluate(()=>typeof window.Phase5Production.openReadinessChecklist),'function','Project centre can open the authoritative Phase 5 readiness checklist');
    assert.match(await page.locator('[data-project-content]').innerText(),/0 of 14 required days elapsed/,'Project command centre displays the real stage time gate');
    assert.match(await page.locator('[data-project-content]').innerText(),/TIME GATE IN PROGRESS/,'Project command centre does not mark an ineligible stage as ready');
    await page.locator('[data-project-tab="creative"]').click();
    assert.match(await page.locator('[data-project-content]').innerText(),/A deep-space discovery changes the course/,'Creative brief reads the campaign-backed synopsis');
    assert.match(await page.locator('[data-project-content]').innerText(),/Mumbai, India/,'Creative brief shows the recorded production base');
    await page.locator('[data-project-tab="budget"]').click();
    assert.match(await page.locator('[data-project-content]').innerText(),/12,500,000/,'Budget workspace displays the approved project envelope');
    assert.match(await page.locator('[data-project-content]').innerText(),/Story & development/,'Budget workspace displays real itemized budget lines');
    assert.match(await page.locator('[data-project-content]').innerText(),/Vendor contract value/i,'Budget workspace separates vendor commitments');
    await page.locator('[data-project-tab="people"]').click();
    assert.match(await page.locator('[data-project-content]').innerText(),/Ava QA/,'People workspace reads the project cast list');
    assert.match(await page.locator('[data-project-content]').innerText(),/Niko QA/,'People workspace reads the crew register');
    assert.match(await page.locator('[data-project-content]').innerText(),/Northlight Rentals/,'People workspace reads the production contract register');
    await page.locator('[data-project-tab="delivery"]').click();
    assert.match(await page.locator('[data-project-content]').innerText(),/Streaming license/,'Release workspace shows the planned distribution route');
    assert.match(await page.locator('[data-project-content]').innerText(),/2027-08-18/,'Release workspace shows the target release date');
    await page.locator('[data-project-tab="command"]').click();
    await page.evaluate(()=>{
      const project=active.projects.find(p=>p.id==='PRJ-QA-001');
      project.development.scriptDraft='';
      window.StudioProjectCommandCentre.refresh();
    });
    assert.match(await page.locator('[data-project-content]').innerText(),/PHASE 5 DEPENDENCY/,'Command centre surfaces the live Phase 5 development blocker');
    assert.match(await page.locator('[data-project-content]').innerText(),/Script draft/,'Command centre explains the missing script requirement');
    await page.locator('[data-project-action="scriptRoom"]').click();
    assert.equal(await page.locator('#studio-project-command-centre').evaluate(e=>e.open),false,'Opening the Script room exits the project command centre');
    await page.waitForFunction(()=>document.querySelector('#modal').classList.contains('show'));
    assert.equal(await page.locator('#modal').isVisible(),true,'Project command centre opens the existing Phase 5 Script room');
    assert.equal(await page.locator('#p5form').count(),1,'Existing Script room form remains the authoritative development editor');
    await page.locator('#p5logline').fill('A research crew follows a repeating signal beyond mapped space.');
    await page.locator('#p5synopsis').fill('A research vessel receives a repeating transmission from beyond the mapped frontier. The crew investigates its origin while tensions rise over the risks of answering an unknown signal.');
    await page.locator('#p5draft').fill('FADE IN: EXT. DEEP SPACE — A research vessel drifts beyond the mapped frontier. A signal repeats from the dark. The crew prepares to investigate and records the first transmission.');
    await page.locator('#p5form button[type="submit"],#p5form button').click();
    await page.waitForFunction(()=>!document.querySelector('#modal').classList.contains('show')&&active.projects.find(p=>p.id==='PRJ-QA-001')?.development?.scriptDraft?.length>30);
    await page.locator('#studio-production-pipeline [data-pipeline-open="PRJ-QA-001"]').click();
    assert.doesNotMatch(await page.locator('[data-project-content]').innerText(),/PHASE 5 DEPENDENCY/,'Saving the script in the real Script room clears the Concept prerequisite');
    await page.locator('[data-project-action="advance"]').click();
    assert.equal(await page.locator('#studio-project-command-centre').evaluate(e=>e.open),false,'Stage approval action exits the project command centre');
    assert.equal(await page.locator('#modal').isVisible(),true,'Stage review opens the original simulation approval modal');
    assert.equal(await page.locator('#stagego').isDisabled(),true,'Existing stage approval blocks advancement before the minimum time has elapsed');
    assert.match(await page.locator('#mbody').innerText(),/0 \/ 14 days/,'Existing approval dialog retains the simulation engine time check');
    await page.evaluate(()=>close());
    assert.equal(await page.locator('#modal').isVisible(),false,'Existing stage approval modal closes normally');
    await page.locator('#studio-production-pipeline [data-pipeline-open="PRJ-QA-001"]').click();
    await page.setViewportSize({width:390,height:844});
    const projectCentreMobile=await page.locator('#studio-project-command-centre').evaluate(e=>({
      viewport:document.documentElement.clientWidth,
      bounds:e.getBoundingClientRect().width,
      contentWidth:e.querySelector('.project-centre-content').clientWidth,
      contentScrollWidth:e.querySelector('.project-centre-content').scrollWidth
    }));
    assert(projectCentreMobile.bounds<=projectCentreMobile.viewport,'Project command centre fits the mobile viewport');
    assert(projectCentreMobile.contentScrollWidth<=projectCentreMobile.contentWidth+2,'Project command centre content does not force horizontal scrolling on mobile: '+JSON.stringify(projectCentreMobile));
    await page.locator('#studio-project-command-centre [data-project-close]').first().click();
    await page.setViewportSize({width:1440,height:900});
    await page.evaluate(()=>{active=null;window.StudioProductionWorkflow.refresh();});
    await page.locator('#page-projects [data-workspace-tab="contracts"]').click();
    assert.equal(await page.locator('#productioncontracts').isVisible(),true);
    await page.locator('.nav button[data-page="talent"]').click();
    assert.equal(await page.locator('#page-talent .workspace-tab').count(),2,'Talent roster and casting contracts are separated');
    assert.equal(await page.locator('#talent-roster-workspace').count(),1,'Talent has a native roster and audition workspace');
    assert.equal(await page.locator('#talent-contract-workspace').count(),1,'Talent has a native casting-agreements workspace');
    for (const id of ['talentcount','contractcount','talentroster','auditionlist','contractlist']) assert.equal(await page.locator('#'+id).count(),1,'Talent engine target is preserved: '+id);
    assert.equal(await page.locator('#page-talent button[onclick*="startAudition"]').count(),1,'New-audition action remains mounted');
    assert.equal(await page.locator('#studio-talent-roster-chart').count(),1,'Talent exposes a roster capability chart');
    assert.equal(await page.locator('#studio-talent-roster-chart').evaluate(e=>e.parentElement.id),'talent-roster-chart-slot','Talent chart is mounted in the roster workspace');
    await page.locator('.nav button[data-page="market"]').click();
    assert.equal(await page.locator('#page-market .workspace-tab').count(),4,'Market intelligence is grouped by player task');
    for (const id of ['market-industry-workspace','market-markets-workspace','market-competition-workspace','market-labour-workspace']) assert.equal(await page.locator('#'+id).count(),1,'Market has a native workspace: '+id);
    for (const id of ['mgrowth','mfinance','mcompetitors','mdate','genreindex','marketnews','macrodetails','stockmarket','portfoliolist','orderlist','dividendhistory','competitorlist','laborsummary','laborroles','laborhistory','rivaloperations','realentities']) assert.equal(await page.locator('#'+id).count(),1,'Market engine target is preserved: '+id);
    assert.equal(await page.locator('#page-market button[onclick*="acquireCompetitor"]').count(),1,'Competitor acquisition action remains mounted');
    assert.equal(await page.locator('#page-market button[onclick*="marketOrderForm"]').count(),1,'Share-order action remains mounted');
    assert.equal(await page.locator('#studio-market-regional-economy-chart').count(),1,'Market exposes a regional economy comparison chart');
    assert.equal(await page.locator('#studio-market-regional-economy-chart').evaluate(e=>e.parentElement.id),'market-regional-chart-slot','Regional economy chart is mounted in Industry');
    assert.equal(await page.locator('#studio-market-genre-chart').count(),1,'Market exposes the live genre demand index chart');
    assert.equal(await page.locator('#studio-market-genre-chart').evaluate(e=>e.parentElement.id),'market-genre-chart-slot','Genre demand chart is mounted in Industry');
    await page.locator('.nav button[data-page="media"]').click();
    assert.equal(await page.locator('#page-media .workspace-tab').count(),2,'Newsroom and publicity are separate workspaces');
    assert.equal(await page.locator('#media-newsroom-workspace').count(),1,'Media has a native newsroom workspace');
    assert.equal(await page.locator('#media-publicity-workspace').count(),1,'Media has a native publicity workspace');
    for (const id of ['mediaoutlets','mediareach','mediasentiment','mediacoveragecount','mediaadmarket','mediarevenue','mediamargin','mediastress','mediaoutletlist','mediacoveragelist','mediacampaignlist']) assert.equal(await page.locator('#'+id).count(),1,'Media engine target is preserved: '+id);
    assert.equal(await page.locator('#page-media button[onclick*="launchMediaCampaign"]').count(),1,'Publicity campaign action remains mounted');
    assert.equal(await page.locator('#studio-media-coverage-chart').count(),1,'Media exposes a campaign coverage chart');
    assert.equal(await page.locator('#studio-media-coverage-chart').evaluate(e=>e.parentElement.id),'media-coverage-chart-slot','Coverage chart is mounted in the Newsroom workspace');
    await page.locator('.nav button[data-page="people"]').click();
    assert.equal(await page.locator('#page-people .workspace-tab').count(),2,'People register and workforce insights are separate workspaces');
    assert.equal(await page.locator('#people-roster-workspace').count(),1,'People has a native employee-register workspace');
    assert.equal(await page.locator('#people-workforce-workspace').count(),1,'People has a native workforce-intelligence workspace');
    for (const id of ['payrolltotal','peoplelist']) assert.equal(await page.locator('#'+id).count(),1,'People engine target is preserved: '+id);
    assert.equal(await page.locator('#page-people button[onclick*="hire()"]').count(),1,'Hire-employee action remains mounted');
    assert.equal(await page.locator('#studio-people-workforce-chart').count(),1,'People workspace exposes department headcount and payroll chart');
    assert.equal(await page.locator('#studio-people-workforce-chart').evaluate(e=>e.parentElement.id),'people-workforce-chart-slot','Workforce chart is mounted in the workforce workspace');
    await page.locator('.nav button[data-page="campaign"]').click();
    assert.equal(await page.locator('#page-campaign .workspace-tab').count(),2,'Campaign library and backup tools are separate');
    assert.equal(await page.locator('#campaign-library-workspace').count(),1,'Campaign page has a native save-library workspace');
    assert.equal(await page.locator('#campaign-backup-workspace').count(),1,'Campaign page has a native backup workspace');
    for (const id of ['savecount','savelist','importfile']) assert.equal(await page.locator('#'+id).count(),1,'Campaign renderer target is preserved: '+id);
    assert.equal(await page.locator('#page-campaign button[onclick*="newCampaignForm"]').count(),1,'Create-campaign action remains mounted');
    assert.equal(await page.locator('#page-campaign button[onclick*="exportSave"]').count(),1,'Export-save action remains mounted');
    await page.locator('#page-campaign [data-workspace-tab="backup"]').click();
    assert.equal(await page.locator('#page-campaign button[onclick*="exportSave"]').isVisible(),true,'Export-save action is visible in Backup & Restore');
    assert.equal(await page.locator('#page-campaign label[for="importfile"]').isVisible(),true,'Import-save label remains visible');
    assert.equal(await page.locator('#importfile').isVisible(),false,'Import file input remains present but visually hidden behind its label');
    await page.locator('.nav button[data-page="calendar"]').click();
    assert.equal(await page.locator('#page-calendar .workspace-tab').count(),3,'Calendar has separate events, clock and history workspaces');
    for (const id of ['calendar-events-workspace','calendar-clock-workspace','calendar-history-workspace']) assert.equal(await page.locator('#'+id).count(),1,'Calendar has a native workspace: '+id);
    for (const id of ['eventlist','advanceDays','historydate','calendarhistory']) assert.equal(await page.locator('#'+id).count(),1,'Calendar renderer target is preserved: '+id);
    for (const action of ['scheduleEvent','advanceCustom','advance(1)','advance(7)','advance(30)']) assert.equal(await page.locator('#page-calendar button[onclick*="'+action+'"]').count(),1,'Calendar action remains mounted: '+action);
    await page.locator('#page-calendar [data-workspace-tab="clock"]').click();
    assert.equal(await page.locator('#advanceDays').isVisible(),true,'World clock controls remain visible in their workspace');
    await page.locator('#page-calendar [data-workspace-tab="history"]').click();
    assert.equal(await page.locator('#calendarhistory').isVisible(),true,'Simulation history remains visible in its workspace');
    await page.locator('.nav button[data-page="admin"]').click();
    assert.equal(await page.locator('#page-admin .workspace-tab').count(),2,'Sandbox achievements and audit log are separate');
    assert.equal(await page.locator('#sandbox-console-workspace').count(),1,'Sandbox command console stays directly accessible');
    assert.equal(await page.locator('#sandbox-achievements-workspace').count(),1,'Sandbox has a native achievements workspace');
    assert.equal(await page.locator('#sandbox-audit-workspace').count(),1,'Sandbox has a native audit workspace');
    for (const id of ['cheatstatus','cheatcommand','cheatresult','achievementcount','achievementlist','auditcount','cheataudit']) assert.equal(await page.locator('#'+id).count(),1,'Sandbox renderer target is preserved: '+id);
    for (const action of ['runCheat','showCheatHelp']) assert.equal(await page.locator('#page-admin button[onclick*="'+action+'"]').count(),1,'Sandbox action remains mounted: '+action);
    await page.locator('#page-admin [data-workspace-tab="audit"]').click();
    assert.equal(await page.locator('#cheataudit').isVisible(),true,'Permanent cheat audit remains visible in its workspace');
    await page.locator('.nav button[data-page="company"]').click();
    assert.equal(await page.locator('#page-company .workspace-tab').count(),2,'Corporate profile and divisions are separate workspaces');
    assert.equal(await page.locator('#company-profile-workspace').count(),1,'Company has a native corporate-profile workspace');
    assert.equal(await page.locator('#company-structure-workspace').count(),1,'Company has a native operating-structure workspace');
    for (const id of ['legalstatus','companydetails','divisions']) assert.equal(await page.locator('#'+id).count(),1,'Company engine target is preserved: '+id);
    for (const action of ['incorporate','createSubsidiary','addDivision','raiseCapital','initiateIPO']) assert.equal(await page.locator('#page-company button[onclick*="'+action+'"]').count(),1,'Company action remains mounted: '+action);
    await page.locator('#page-company [data-workspace-tab="divisions"]').click();
    assert.equal(await page.locator('#divisions').isVisible(),true,'Company division controls remain mounted in their workspace');
    await page.locator('.nav button[data-page="personal"]').click();
    assert.equal(await page.locator('#page-personal .workspace-tab').count(),2,'Founder assets and relationships have separate workspaces');
    assert.equal(await page.locator('#personal-assets-workspace').count(),1,'Founder has a personal balance-sheet workspace');
    assert.equal(await page.locator('#personal-relationships-workspace').count(),1,'Founder has a relationships workspace');
    for (const id of ['pcash','passets','pnetworth','pstress','personalassets','relationships']) assert.equal(await page.locator('#'+id).count(),1,'Founder personal renderer target is preserved: '+id);
    assert.equal(await page.locator('#page-personal button[onclick*="addPersonalAsset"]').count(),1,'Personal-asset action remains mounted');
    assert.equal(await page.locator('#page-personal button[onclick*="addRelationship"]').count(),1,'Relationship action remains mounted');
    assert.equal(await page.locator('#studio-personal-assets-chart').count(),1,'Founder workspace exposes a personal-only balance chart');
    assert.equal(await page.locator('#studio-personal-assets-chart').evaluate(e=>e.parentElement.id),'personal-assets-chart-slot','Founder balance chart is mounted in personal finances');
    await page.locator('#page-personal [data-workspace-tab="relationships"]').click();
    assert.equal(await page.locator('#relationships').isVisible(),true,'Founder relationship system remains mounted');
    await page.locator('.nav button[data-page="distribution"]').click();
    assert.equal(await page.locator('#page-distribution .workspace-tab').count(),2,'Distribution agreements and settlements are separated');
    assert.equal(await page.locator('#studio-distribution-settlement-chart').count(),1,'Distribution exposes a settlement history chart');
    await page.locator('#page-distribution [data-workspace-tab="settlements"]').click();
    assert.equal(await page.locator('#settlementlist').count(),1,'Distribution settlement renderer target remains mounted');
    assert.equal(await page.locator('#page-distribution-panel-settlements').evaluate(e=>e.hidden),false,'Distribution settlement tab panel is active');
    await page.locator('.nav button[data-page="facilities"]').click();
    assert.equal(await page.locator('#page-facilities .workspace-tab').count(),3,'Facilities separates portfolio, operating commitments and property register');
    for (const id of ['facility-portfolio-workspace','facility-costs-workspace','facility-register-workspace']) assert.equal(await page.locator('#'+id).count(),1,'Facilities workspace is mounted: '+id);
    for (const id of ['facilitycount','facilityassets','facilityrent','facilitymaintenance','facilitylist']) assert.equal(await page.locator('#'+id).count(),1,'Facilities renderer target is preserved: '+id);
    assert.equal(await page.locator('#page-facilities button[onclick*="addFacility"]').count(),1,'Add-facility action remains mounted');
    await page.locator('#page-facilities [data-workspace-tab="costs"]').click();
    assert.equal(await page.locator('#page-facilities-panel-costs').evaluate(e=>e.hidden),false,'Facility operating commitments tab is active');
    await page.locator('#page-facilities [data-workspace-tab="register"]').click();
    assert.equal(await page.locator('#facilitylist').isVisible(),true,'Facility register is visible in its tab');
    await page.locator('.nav button[data-page="ip"]').click();
    assert.equal(await page.locator('#page-ip .workspace-tab').count(),2,'IP catalogue and rights licensing are separate');
    assert.equal(await page.locator('#ip-catalogue-workspace').count(),1,'IP catalogue has a native workspace');
    assert.equal(await page.locator('#ip-licensing-workspace').count(),1,'IP licensing has a native workspace');
    for (const id of ['ipcount','ipvalue','licensecount','licenserevenue','ipregister','licenseregister']) assert.equal(await page.locator('#'+id).count(),1,'IP renderer target is preserved: '+id);
    for (const action of ['createOriginalIP','acquireIP','licenseIP']) assert.equal(await page.locator('#page-ip button[onclick*="'+action+'"]').count(),1,'IP action remains mounted: '+action);
    await page.locator('#page-ip [data-workspace-tab="licensing"]').click();
    assert.equal(await page.locator('#licenseregister').isVisible(),true,'Licensing register remains in its workspace');
    await page.locator('.nav button[data-page="legal"]').click();
    assert.equal(await page.locator('#page-legal .workspace-tab').count(),2,'Legal matters and insurance are separated');
    assert.equal(await page.locator('#legal-matters-workspace').count(),1,'Legal has a native matter workspace');
    assert.equal(await page.locator('#legal-insurance-workspace').count(),1,'Legal has a native insurance workspace');
    for (const id of ['legalcount','legalexposure','insurancecount','insurancepremium','legalregister','insuranceregister']) assert.equal(await page.locator('#'+id).count(),1,'Legal renderer target is preserved: '+id);
    assert.equal(await page.locator('#page-legal button[onclick*="addLegalCase"]').count(),1,'New-legal-matter action remains mounted');
    assert.equal(await page.locator('#page-legal button[onclick*="addInsurance"]').count(),1,'Insurance action remains mounted');
    await page.locator('#page-legal [data-workspace-tab="insurance"]').click();
    assert.equal(await page.locator('#insuranceregister').isVisible(),true,'Insurance register remains in its workspace');
    await page.locator('.nav button[data-page="awards"]').click();
    assert.equal(await page.locator('#page-awards .workspace-tab').count(),2,'Award events and submissions are separated');
    assert.equal(await page.locator('#awards-events-workspace').count(),1,'Awards has a native events workspace');
    assert.equal(await page.locator('#awards-submissions-workspace').count(),1,'Awards has a native submissions workspace');
    for (const id of ['awardcatalog','awardcount','awardsubmissions']) assert.equal(await page.locator('#'+id).count(),1,'Awards renderer target is preserved: '+id);
    assert.equal(await page.locator('#page-awards button[onclick*="submitForAward"]').count(),1,'Award-submission action remains mounted');
    await page.locator('#page-awards [data-workspace-tab="submissions"]').click();
    assert.equal(await page.locator('#awardsubmissions').isVisible(),true,'Award submission register remains in its workspace');
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