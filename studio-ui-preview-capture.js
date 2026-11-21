'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const OUT = path.join(process.cwd(), 'artifacts', 'ui-preview');
const BASE = 'http://127.0.0.1:4173/index.html';

async function prepareCampaign(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__STUDIO_UI_READY__ === true);
  await page.locator('#start-load').click();
  await page.evaluate(() => newCampaignForm());
  await page.locator('#ndate').fill('2026-11-21');
  await page.locator('#nfounder').fill('Preview Founder');
  await page.locator('#ncompany').fill('Meridian Pictures');
  await page.locator('#ncountry').fill('India');
  await page.locator('#ncity').fill('Mumbai');
  await page.locator('#ncapital').fill('20000000');
  await page.locator('#newform button[type="submit"],#newform button').click();
  await page.waitForFunction(() => active?.founder?.name === 'Preview Founder');
  await page.evaluate(() => {
    active.projects = [{
      id: 'PRJ-PREVIEW-001',
      title: 'The Meridian Project',
      format: 'Feature film',
      genre: 'Science fiction',
      budget: 12500000,
      spent: 425000,
      committed: 180000,
      cast: [{ actorName: 'Ava Rao', role: 'Lead', fee: 125000 }],
      crew: [{ name: 'Niko Shah', role: 'Director', contractType: 'Fixed project engagement', fee: 180000 }],
      stage: 0,
      stageStarted: active.date,
      stageHistory: [{ stage: 'Concept', date: active.date, cost: 425000 }],
      budgetLines: [
        { stageIndex: 0, stageName: 'Concept', category: 'Story & development', budget: '1250000', actual: '425000', committed: '25000', status: 'In progress' },
        { stageIndex: 1, stageName: 'Development', category: 'Creative development', budget: '1875000', actual: '0', committed: '0', status: 'Planned' }
      ],
      developmentBrief: {
        logline: 'A crew discovers an impossible signal.',
        synopsis: 'A deep-space discovery changes the course of an expedition.',
        creativeTone: 'Grounded and suspenseful',
        intendedAudience: 'Teen and young adult',
        classificationTarget: 'Teen audience target',
        financingApproach: 'Company-funded',
        productionBase: 'Mumbai, India',
        productionApproach: 'Hybrid',
        plannedStartDate: '2026-12-01',
        targetCompletionDate: '2027-06-01',
        intendedReleaseRoute: 'Streaming license',
        targetReleaseDate: '2027-08-18',
        targetTerritories: 'Worldwide'
      },
      development: {
        logline: 'A crew discovers an impossible signal.',
        synopsis: 'A deep-space discovery changes the course of an expedition.',
        scriptDraft: 'FADE IN: EXT. DEEP SPACE — A research vessel drifts beyond the mapped frontier. A signal repeats from the dark. The crew prepares to investigate.',
        scriptStatus: 'Not started',
        revisions: [],
        notes: [],
        greenlight: null,
        checklist: { director: false, producer: false, budget: false, cast: false, locations: false, schedule: false },
        quality: { script: 0, originality: 0, feasibility: 0 }
      }
    }];
    active.productionContracts = [{
      id: 'PC-PREVIEW-001',
      projectId: 'PRJ-PREVIEW-001',
      projectTitle: 'The Meridian Project',
      vendor: 'Northlight Rentals',
      category: 'Camera equipment',
      total: '25000',
      schedule: [{ label: 'Deposit', dueDate: '2026-12-10', amount: '25000', status: 'Pending' }]
    }];
    if (typeof window.StudioProductionWorkflow?.refresh === 'function') {
      window.StudioProductionWorkflow.refresh();
    }
    if (typeof window.Phase7Smartphone?.processDay === 'function') {
      window.Phase7Smartphone.processDay(active.date);
    }
    if (typeof persist === 'function') persist();
  });
  await page.waitForTimeout(700);
}

async function screenshot(page, filename, fullPage = true) {
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(OUT, filename),
    fullPage,
    animations: 'disabled'
  });
  console.log('Captured ' + filename);
}

(async () => {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    // Desktop: capture the actual startup, command-centre, and production screens.
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await desktop.goto(BASE, { waitUntil: 'domcontentloaded' });
    await desktop.waitForFunction(() => window.__STUDIO_UI_READY__ === true);
    await screenshot(desktop, 'desktop-startup.png', false);
    await prepareCampaign(desktop);
    await desktop.evaluate(() => window.nav('overview'));
    await screenshot(desktop, 'desktop-overview.png');
    await desktop.locator('.nav button[data-page="projects"]').click();
    await screenshot(desktop, 'desktop-productions.png');
    const openProject = desktop.locator('#studio-production-pipeline [data-pipeline-open="PRJ-PREVIEW-001"]');
    if (await openProject.count()) {
      await openProject.click();
      await desktop.locator('#studio-project-command-centre').waitFor({ state: 'visible' });
      await screenshot(desktop, 'desktop-project-command-centre.png', false);
      await desktop.locator('#studio-project-command-centre [data-project-close]').first().click();
      await desktop.locator('#studio-project-command-centre').waitFor({ state: 'hidden' });
    }
    await desktop.locator('.nav button[data-page="finance"]').click();
    await screenshot(desktop, 'desktop-finance.png');
    await desktop.evaluate(() => window.nav('phone'));
    await screenshot(desktop, 'desktop-smartphone-home.png', false);
    await desktop.locator('#page-phone [data-open-app="studiosphere"]').click();
    await screenshot(desktop, 'desktop-smartphone-app.png', false);

    // Mobile: use the actual touch-sized layout and bottom navigation.
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    });
    await prepareCampaign(mobile);
    await mobile.evaluate(() => window.nav('overview'));
    await screenshot(mobile, 'mobile-overview.png');
    await mobile.locator('#mobile-nav [data-mobile-page="projects"]').click();
    await screenshot(mobile, 'mobile-productions.png');
    await mobile.locator('#mobile-nav [data-mobile-page="personal"]').click();
    await screenshot(mobile, 'mobile-life.png');
    await mobile.evaluate(() => window.nav('phone'));
    await screenshot(mobile, 'mobile-smartphone-home.png', false);
    await mobile.locator('#page-phone [data-open-app="studiosphere"]').click();
    await screenshot(mobile, 'mobile-smartphone-app.png', false);
    await mobile.close();
    await desktop.close();
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
