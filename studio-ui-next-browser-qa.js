'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(15000);
  console.log('UI_QA_STAGE: browser launched');
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => { window.__STUDIO_DISABLE_AUTO_TUTORIAL = true; });
  try {
    console.log('UI_QA_STAGE: opening preview');
    await page.goto('http://127.0.0.1:4173/index.html?ui=next', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('UI_QA_STAGE: preview document loaded');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('stui-next')), true, 'Preview flag activates the redesigned shell');
    assert.equal(await page.locator('.stui-preview-mode').innerText(), 'DESIGN PREVIEW');
    assert.equal(await page.locator('.stui-nav-group').count() >= 5, true, 'Primary navigation is grouped by player intent');
    for (const group of ['home', 'life', 'world', 'studio', 'empire', 'advanced']) {
      assert.equal(await page.locator('[data-nav-group="' + group + '"]').count(), 1, 'Navigation group exists: ' + group);
    }

    const routeIds = await page.locator('.nav button[data-page]').evaluateAll(nodes => nodes.map(node => node.dataset.page));
    assert(routeIds.includes('overview') && routeIds.includes('personal') && routeIds.includes('globaltravel') && routeIds.includes('company') && routeIds.includes('finance'));
    assert.equal(new Set(routeIds).size, routeIds.length, 'Every route appears exactly once in navigation');

    console.log('UI_QA_STAGE: shell and navigation assertions passed');

    // The redesigned Overview must preserve the live World Pulse renderer's
    // direct-child insertion contract and all legacy metric element IDs.
    const overviewContract = await page.evaluate(() => {
      const page = document.querySelector('#page-overview');
      const stats = page.querySelector('.grid.stats');
      const pulse = page.querySelector('#studio-command-pulse');
      return {
        pulseExists: !!pulse,
        pulseDirectChild: !!pulse && pulse.parentElement === page,
        statsDirectChild: !!stats && stats.parentElement === page,
        metricIds: ['cashstat', 'projectstat', 'staffstat', 'datestat'].every(id => !!document.getElementById(id)),
        workspaceLinks: page.querySelectorAll('.stui-workspace-link').length
      };
    });
    assert.equal(overviewContract.pulseExists, true, 'Existing World Pulse remains mounted');
    assert.equal(overviewContract.pulseDirectChild, true, 'World Pulse remains a direct Overview child');
    assert.equal(overviewContract.statsDirectChild, true, 'Overview metrics remain direct children for pulse insertion');
    assert.equal(overviewContract.metricIds, true, 'Legacy renderer metric IDs are preserved');
    assert.equal(overviewContract.workspaceLinks, 4, 'Life, World, Studio and Empire shortcuts are present');

    console.log('UI_QA_STAGE: overview contract passed');

    // Search must filter navigation without deleting routes or changing the active page.
    await page.locator('#stui-nav-search').fill('travel');
    assert.equal(await page.locator('[data-page="globaltravel"]').isVisible(), true);
    assert.equal(await page.locator('[data-page="overview"]').isVisible(), false);
    await page.locator('#stui-nav-search').fill('');
    assert.equal(await page.locator('[data-page="overview"]').isVisible(), true);

    console.log('UI_QA_STAGE: navigation search passed');

    // The Company workspace must not invent corporate data before a campaign exists.
    await page.locator('[data-page="company"]').click();
    assert.equal(await page.locator('#stui-company-name').innerText(), 'No campaign loaded');
    assert.equal(await page.locator('#stui-company-cash').innerText(), '—');
    assert.equal(await page.locator('#stui-company-capital').innerText(), '—');
    await page.locator('[data-page="overview"]').click();
    console.log('UI_QA_STAGE: empty Company state passed');

    // Create a real campaign using the existing campaign form and save path.
    await page.locator('.stui-create-campaign').click();
    await page.locator('#page-campaign .hero .btn.primary').click();

    assert.equal(await page.locator('#modal.stui-campaign-setup-modal').count(), 1, 'Campaign creation receives the redesigned setup treatment');
    assert.equal(await page.locator('#newform.stui-campaign-setup .stui-setup-section-label').count(), 4, 'World, founder, attributes and company sections are preserved');
    assert.equal(await page.locator('#newform .field').count() >= 25, true, 'Full founder and company setup remains available');
    for (const [id, value] of [
      ['nfounder', 'UI Preview QA Founder'],
      ['ncompany', 'UI Preview QA Studios'],
      ['ncountry', 'India'],
      ['ncity', 'Mumbai']
    ]) await page.locator('#' + id).fill(value);
    console.log('UI_QA_STAGE: campaign form opened and populated');
    const submitCampaign = page.getByRole('button', { name: /Create and save campaign/ });
    await submitCampaign.scrollIntoViewIfNeeded();
    try {
      await submitCampaign.click({ timeout: 7000 });
    } catch (error) {
      const diagnostic = await page.evaluate(() => {
        const button = document.querySelector('#newform button[type="submit"]');
        const modal = document.querySelector('#modal .modal');
        if (!button) return { button: false };
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
        const target = document.elementFromPoint(x, y);
        return {
          button: true, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          target: target?.outerHTML?.slice(0, 500) || null,
          targetIsButton: target === button || button.contains(target),
          modal: modal ? { scrollTop: modal.scrollTop, scrollHeight: modal.scrollHeight, clientHeight: modal.clientHeight } : null,
          modalVisible: document.querySelector('#modal')?.classList.contains('show'),
          activeCampaign: !!window.active,
          errors: window.__studioUiQaErrors || []
        };
      });
      console.error('[CAMPAIGN_SUBMIT_CLICK_DIAGNOSTIC]', JSON.stringify(diagnostic));
      throw error;
    }
    console.log('UI_QA_STAGE: campaign submit click returned');
    await page.locator('#studio-command-pulse').waitFor({ timeout: 10000 });
    const savedCampaign = await page.evaluate(() => ({
      active: !!active,
      founder: active?.founder?.name,
      company: active?.company?.name,
      day: active?.day,
      date: active?.date,
      pulse: document.querySelector('#studio-command-pulse')?.innerText || ''
    }));
    assert.equal(savedCampaign.active, true);
    assert.equal(savedCampaign.founder, 'UI Preview QA Founder');
    assert.equal(savedCampaign.company, 'UI Preview QA Studios');
    assert.match(savedCampaign.pulse, /World pulse/i);


    console.log('UI_QA_STAGE: campaign created and World Pulse verified');

    // Campaign library must reflect the actual local save register and retain
    // its original load/export/delete actions.
    await page.locator('[data-page="campaign"]').click();
    assert.equal(await page.locator('.stui-campaign-overview').count(), 1, 'Campaign library overview is composed');
    assert.equal(await page.locator('.stui-campaign-entry').count(), 1, 'New campaign appears in the saved library');
    assert.equal(await page.locator('.stui-campaign-entry.is-active').count(), 1, 'Current campaign is clearly identified');
    assert.equal(await page.locator('#stui-campaign-active').innerText(), 'UI Preview QA Studios');
    assert.match(await page.locator('#stui-campaign-count').innerText(), /1/);
    assert.equal(await page.locator('.stui-campaign-entry-actions button').count(), 3, 'Load, export and delete actions remain available');
    await page.locator('#stui-campaign-search').fill('no such studio');
    assert.equal(await page.locator('.stui-campaign-entry').isVisible(), false, 'Campaign search filters the library');
    assert.match(await page.locator('.stui-campaign-no-match').innerText(), /No saved campaigns match/);
    await page.locator('#stui-campaign-search').fill('');
    assert.equal(await page.locator('.stui-campaign-entry').isVisible(), true, 'Clearing search restores saved campaigns');

    console.log('UI_QA_STAGE: campaign library and search passed');

    // Company summary is derived from the existing renderer output, and its
    // contextual links must navigate to the real legacy workspaces.
    await page.locator('[data-page="company"]').click();
    const companyDossier = await page.evaluate(() => {
      const details = document.querySelector('#companydetails');
      const value = label => {
        const row = [...(details?.querySelectorAll('.rowitem') || [])]
          .find(item => (item.firstElementChild?.textContent || '').trim() === label);
        return row?.lastElementChild?.textContent.trim() || '';
      };
      return {
        name: document.querySelector('#stui-company-name')?.textContent.trim(),
        sourceName: value('Legal name'),
        headquarters: document.querySelector('#stui-company-headquarters')?.textContent.trim(),
        sourceCash: value('Cash balance'),
        summaryCash: document.querySelector('#stui-company-cash')?.textContent.trim(),
        sourceCapital: value('Opening capital'),
        summaryCapital: document.querySelector('#stui-company-capital')?.textContent.trim(),
        status: document.querySelector('#stui-company-status')?.textContent.trim(),
        sourceStatus: document.querySelector('#legalstatus')?.textContent.trim().toUpperCase(),
        linkCount: document.querySelectorAll('.stui-company-link').length
      };
    });
    assert.equal(companyDossier.name, 'UI Preview QA Studios');
    assert.equal(companyDossier.name, companyDossier.sourceName, 'Company identity matches the existing company renderer');
    assert.match(companyDossier.headquarters, /^Mumbai, India/);
    assert.equal(companyDossier.summaryCash, companyDossier.sourceCash, 'Company cash is not duplicated from a separate data source');
    assert.equal(companyDossier.summaryCapital, companyDossier.sourceCapital, 'Opening capital matches the corporate record');
    assert.equal(companyDossier.status, companyDossier.sourceStatus, 'Incorporation status matches the existing legal-status field');
    assert.equal(companyDossier.linkCount, 5, 'Company cross-workspace links are present');
    await page.locator('.stui-company-link[data-route="finance"]').click();
    assert.equal(await page.locator('#page-finance').evaluate(el => el.classList.contains('active')), true);
    await page.locator('[data-page="company"]').click();
    assert.equal(await page.locator('#page-company').evaluate(el => el.classList.contains('active')), true);
    console.log('UI_QA_STAGE: Company dossier and contextual links passed');

    // Existing Life and Travel screens must still render their actual engine data.
    await page.locator('[data-page="personal"]').click();
    assert.equal(await page.locator('#page-personal').evaluate(el => el.classList.contains('active')), true);
    assert.equal(await page.locator('#lifedashboard').count(), 1);
    assert.equal(await page.locator('#lifemetrics').count(), 1);

    await page.locator('[data-page="globaltravel"]').click();
    assert.equal(await page.locator('#page-globaltravel').evaluate(el => el.classList.contains('active')), true);
    assert.equal(await page.locator('#globaltravel-content').getByText(/CURRENT LOCATION/).count(), 1);
    assert.equal(await page.locator('#globaltravel-content').getByText(/PASSPORT NATIONALITY/).count(), 1);
    assert.equal(await page.evaluate(() => !!window.StudioGlobalTravel && !!window.StudioGeography), true);

    await page.locator('[data-page="geography"]').click();
    assert.equal(await page.locator('#page-geography').evaluate(el => el.classList.contains('active')), true);
    assert.equal(await page.locator('#geography-content').count(), 1);

    console.log('UI_QA_STAGE: Life, Travel and Geography checks passed');

    // Every dynamically composed route must remain navigable and active.
    for (const id of routeIds) {
      await page.locator('.nav button[data-page="' + id + '"]').click();
      assert.equal(await page.locator('#page-' + id).evaluate(el => el.classList.contains('active')), true, 'Route activates: ' + id);
      assert.equal(
        await page.locator('.nav button[data-page="' + id + '"]').getAttribute('aria-current'),
        'page',
        'Active navigation accessibility state for route "' + id + '" (active page: ' +
          await page.locator('.page.active').getAttribute('id') + ')'
      );
    }
    console.log('UI_QA_STAGE: all ' + routeIds.length + ' navigation routes passed');
    assert.deepEqual(errors, [], 'No browser errors in preview: ' + errors.join('; '));

    // Landscape handheld layout: top navigation remains available and content fits.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator('[data-page="overview"]').click();
    const handheld = await page.evaluate(() => {
      const side = document.querySelector('.side').getBoundingClientRect();
      const content = document.querySelector('.content').getBoundingClientRect();
      return {
        width: innerWidth,
        sideHeight: side.height,
        contentWidth: content.width,
        bodyWidth: document.body.scrollWidth,
        navScrollable: document.querySelector('.nav').scrollWidth >= document.querySelector('.nav').clientWidth
      };
    });
    assert(handheld.sideHeight < 390, 'Landscape navigation does not consume the whole viewport');
    assert(handheld.contentWidth > 0);
    assert(handheld.bodyWidth <= handheld.width + 2, 'No horizontal page overflow on landscape handheld');
    assert.equal(handheld.navScrollable, true, 'Grouped navigation can scroll horizontally on handheld');

    console.log('UI_QA_STAGE: landscape layout passed');

    // The default production presentation is unchanged without the opt-in flag.
    const standard = await browser.newPage({ viewport: { width: 1365, height: 850 } });
    await standard.addInitScript(() => { window.__STUDIO_DISABLE_AUTO_TUTORIAL = true; });
    await standard.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
    assert.equal(await standard.locator('body').evaluate(el => el.classList.contains('stui-next')), false);
    assert.equal(await standard.locator('.stui-preview-mode').count(), 0);
    console.log('UI_QA_STAGE: default-mode isolation passed');
    console.log('PASS redesigned shell, overview contract, live campaign, life, travel, geography, all routes, landscape layout and default-mode isolation');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
