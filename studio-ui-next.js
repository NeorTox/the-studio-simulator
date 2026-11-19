/* THE STUDIO — next-generation presentation shell.
 * Opt-in preview only: append ?ui=next. Does not mutate campaign/simulation state.
 * Existing route IDs, renderers, actions, save model and engine script order are preserved.
 */
(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  if (params.get('ui') !== 'next') return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './studio-ui-next.css';
  document.head.append(stylesheet);


  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const body = document.body;
  const nav = $('.nav');
  const side = $('.side');
  const main = $('.main');
  const content = $('.content');
  if (!nav || !side || !main || !content) return;

  body.classList.add('stui-next');
  const groups = [
    { key: 'home', title: 'Command', routes: ['overview', 'campaign', 'calendar', 'situations'] },
    { key: 'life', title: 'Life', routes: ['personal', 'population', 'phone', 'digital', 'generations'] },
    { key: 'world', title: 'World & travel', routes: ['world', 'time', 'geography', 'globaltravel', 'worldengine', 'worldsystems'] },
    { key: 'studio', title: 'Studio', routes: ['company', 'facilities', 'people', 'talent', 'projects', 'productionops', 'ip', 'distribution', 'media', 'awards', 'ecosystem'] },
    { key: 'empire', title: 'Empire', routes: ['finance', 'market', 'legal', 'sustainability', 'governance', 'competitors', 'technology'] },
    { key: 'advanced', title: 'Advanced systems', routes: ['admin', 'manual', 'algorithms', 'integrity', 'architecture', 'peopleintelligence', 'integrationhealth', 'releasequality', 'autonomy'] }
  ];
  const groupFor = new Map();
  groups.forEach(group => group.routes.forEach(route => groupFor.set(route, group.key)));
  const existingButtons = $$('.nav button', nav);
  const buttons = new Map(existingButtons.map(button => [button.dataset.page, button]));
  const grouped = new Map(groups.map(group => [group.key, []]));
  existingButtons.forEach(button => {
    const route = button.dataset.page;
    const key = groupFor.get(route) || 'advanced';
    grouped.get(key).push(button);
  });

  nav.replaceChildren();
  nav.classList.add('stui-navigation');
  nav.parentElement?.classList.add('stui-nav-container');
  groups.forEach(group => {
    const items = grouped.get(group.key);
    if (!items.length) return;
    const section = document.createElement('section');
    section.className = 'stui-nav-group';
    section.dataset.navGroup = group.key;
    const heading = document.createElement('div');
    heading.className = 'stui-nav-heading';
    heading.textContent = group.title;
    section.append(heading);
    items.forEach(button => {
      button.classList.add('stui-nav-item');
      button.setAttribute('aria-label', button.textContent.trim().replace(/\s+/g, ' '));
      button.querySelector('span')?.setAttribute('aria-hidden', 'true');
      section.append(button);
    });
    nav.append(section);
  });

  const brand = $('.brand', side);
  if (brand) {
    const descriptor = document.createElement('div');
    descriptor.className = 'stui-brand-descriptor';
    descriptor.textContent = 'A LIVING WORLD SIMULATION';
    brand.append(descriptor);
  }
  const oldFoot = $('.sidefoot', side);
  if (oldFoot) {
    oldFoot.classList.add('stui-side-note');
    oldFoot.innerHTML = '<span class="stui-live-dot"></span><span>One persistent world<br>Life · Travel · Enterprise</span>';
  }

  const searchWrap = document.createElement('label');
  searchWrap.className = 'stui-nav-search';
  searchWrap.innerHTML = '<span aria-hidden="true">⌕</span><input type="search" id="stui-nav-search" placeholder="Find a workspace" autocomplete="off" aria-label="Find a workspace">';
  nav.parentElement.insertBefore(searchWrap, nav);

  const search = $('#stui-nav-search');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    $$('.stui-nav-group', nav).forEach(section => {
      let visible = 0;
      $$('.stui-nav-item', section).forEach(button => {
        const match = !query || button.textContent.toLowerCase().includes(query) || button.dataset.page.includes(query);
        button.hidden = !match;
        if (match) visible++;
      });
      section.hidden = visible === 0;
    });
  });

  const newCampaign = document.createElement('button');
  newCampaign.type = 'button';
  newCampaign.className = 'stui-create-campaign';
  newCampaign.innerHTML = '<span aria-hidden="true">＋</span><span>New campaign</span>';
  newCampaign.addEventListener('click', () => {
    if (typeof window.nav === 'function') window.nav('campaign');
  });
  side.insertBefore(newCampaign, oldFoot || null);

  const header = $('.top', main);
  if (header) {
    header.classList.add('stui-topbar');
    const crumb = $('#crumb', header);
    if (crumb) crumb.setAttribute('aria-live', 'polite');
    const status = document.createElement('div');
    status.className = 'stui-world-label';
    status.innerHTML = '<span class="stui-live-dot"></span><span>CAMPAIGN WORLD</span>';
    const right = $('.topright', header);
    if (right) right.insertBefore(status, right.firstChild);
  }

  const pageNames = new Map();
  buttons.forEach((button, id) => { const copy = button.cloneNode(true); copy.querySelector('span')?.remove(); pageNames.set(id, copy.textContent.trim().replace(/\s+/g, ' ')); });

  const groupTitles = new Map(groups.map(group => [group.key, group.title]));
  $$('.page', content).forEach(page => {
    const id = page.id.replace(/^page-/, '');
    const groupKey = groupFor.get(id) || 'advanced';
    const routes = (groups.find(group => group.key === groupKey)?.routes || [])
      .filter(route => buttons.has(route) && $('#page-' + route));
    if (id === 'overview' || routes.length < 2 || $('.stui-section-nav', page)) return;
    const hero = $('.hero', page);
    if (!hero) return;
    const sectionNav = document.createElement('nav');
    sectionNav.className = 'stui-section-nav';
    sectionNav.setAttribute('aria-label', (groupTitles.get(groupKey) || 'Workspace') + ' workspaces');
    const label = document.createElement('span');
    label.className = 'stui-section-nav-label';
    label.textContent = groupTitles.get(groupKey) || 'Workspace';
    sectionNav.append(label);
    routes.forEach(route => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'stui-section-nav-item';
      item.dataset.route = route;
      item.textContent = pageNames.get(route) || route;
      item.addEventListener('click', () => window.nav(route));
      sectionNav.append(item);
    });
    hero.insertAdjacentElement('afterend', sectionNav);
  });
  const originalNav = window.nav;
  if (typeof originalNav === 'function') {
    window.nav = function (id) {
      const result = originalNav.apply(this, arguments);
      // The legacy navigator updates the DOM but does not return a success value.
      // Derive the selected route from the resulting active page instead of
      // treating a falsy return as a failed navigation.
      const activePage = $('.page.active');
      const activeId = activePage?.id?.replace(/^page-/, '') || id;
      if (activeId) {
        updateActiveRoute(activeId);
        if (window.matchMedia('(max-width: 900px)').matches) {
          $('.content')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      }
      return result;
    };
  }

  function updateActiveRoute(id) {
    $$('.stui-nav-item', nav).forEach(button => {
      const active = button.dataset.page === id;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const label = pageNames.get(id) || id;
    $$('.stui-section-nav-item').forEach(item => {
      const active = item.dataset.route === id;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    const crumb = $('#crumb');
    if (crumb) crumb.textContent = label.toUpperCase();
  }

  // Keep accessibility state correct even when later engine scripts wrap or
  // replace the legacy global navigator. The nav's bubble phase runs after
  // the clicked button's existing inline/engine handlers have activated a page.
  nav.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('.stui-nav-item[data-page]');
    if (!button) return;
    const activePage = $('.page.active');
    const activeId = activePage?.id?.replace(/^page-/, '') || button.dataset.page;
    updateActiveRoute(activeId);
  });

  // Engine extensions may register additional destinations after DOMContentLoaded.
  // Keep those late-created routes inside the same navigation and active-state model.
  const dynamicNavObserver = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (!(node instanceof Element)) return;
      const candidates = node.matches('button[data-page]')
        ? [node]
        : Array.from(node.querySelectorAll('button[data-page]'));
      candidates.forEach(button => {
        if (!nav.contains(button) || button.classList.contains('stui-nav-item')) return;
        const route = button.dataset.page;
        const key = groupFor.get(route) || 'advanced';
        let section = nav.querySelector('[data-nav-group="' + key + '"]');
        if (!section) {
          section = document.createElement('section');
          section.className = 'stui-nav-group';
          section.dataset.navGroup = key;
          const heading = document.createElement('div');
          heading.className = 'stui-nav-heading';
          heading.textContent = groupTitles.get(key) || 'Advanced systems';
          section.append(heading);
          nav.append(section);
        }
        button.classList.add('stui-nav-item');
        button.setAttribute('aria-label', button.textContent.trim().replace(/\s+/g, ' '));
        button.querySelector('span')?.setAttribute('aria-hidden', 'true');
        buttons.set(route, button);
        const copy = button.cloneNode(true);
        copy.querySelector('span')?.remove();
        pageNames.set(route, copy.textContent.trim().replace(/\s+/g, ' '));
        button.addEventListener('click', () => updateActiveRoute(route));
        section.append(button);
      });
    }));
  });
  dynamicNavObserver.observe(nav, { childList: true, subtree: true });

  // Recompose the existing overview without changing the direct-child
  // contract used by the World Pulse renderer (it inserts before .grid.stats).
  // Existing metric/activity nodes and their IDs remain in place.
  const overview = $('#page-overview');
  if (overview && !$('.stui-overview-intro', overview)) {
    const hero = $('.hero', overview);
    const stats = $('.grid.stats', overview);
    const columns = $('.grid.cols', overview);
    if (hero && stats && columns) {
      hero.classList.add('stui-overview-intro');
      const heroCopy = hero.firstElementChild;
      const context = document.createElement('div');
      context.className = 'stui-intro-context';
      context.innerHTML = '<span class="stui-kicker">YOUR WORLD</span><span class="stui-context-line">One life. One evolving world. An empire of your making.</span>';
      if (heroCopy) heroCopy.append(context);

      const workspaceLinks = document.createElement('div');
      workspaceLinks.className = 'stui-workspace-links';
      [
        ['personal', 'Life', 'Your founder and personal world'],
        ['world', 'World', 'Places, people and global events'],
        ['company', 'Studio', 'Build and operate your company'],
        ['finance', 'Empire', 'Capital, markets and ownership']
      ].forEach(([route, title, description]) => {
        if (!$('#page-' + route)) return;
        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'stui-workspace-link';
        link.innerHTML = '<span class="stui-workspace-title"></span><span class="stui-workspace-description"></span><span class="stui-workspace-arrow" aria-hidden="true">↗</span>';
        $('.stui-workspace-title', link).textContent = title;
        $('.stui-workspace-description', link).textContent = description;
        link.addEventListener('click', () => window.nav(route));
        workspaceLinks.append(link);
      });
      hero.insertAdjacentElement('afterend', workspaceLinks);

      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'stui-section-label';
      sectionLabel.textContent = 'Company pulse';
      const pulse = $('#studio-command-pulse', overview);
      (pulse || stats).insertAdjacentElement('beforebegin', sectionLabel);
      stats.classList.add('stui-kpis');

      const lowerLabel = document.createElement('div');
      lowerLabel.className = 'stui-section-label stui-lower-label';
      lowerLabel.textContent = 'Live operations';
      columns.classList.add('stui-overview-columns');
      columns.insertAdjacentElement('beforebegin', lowerLabel);
    }
  }

  // Preserve the currently selected page and ensure every dynamically-created
  // engine route remains reachable in the Advanced group.
  const activePage = $('.page.active');
  const activeId = activePage?.id?.replace(/^page-/, '') || 'overview';
  updateActiveRoute(activeId);
  const pageTreatments = { personal: 'stui-life-page', population: 'stui-population-page', phone: 'stui-life-page', digital: 'stui-life-page', generations: 'stui-life-page', world: 'stui-world-page', worldengine: 'stui-world-page', worldsystems: 'stui-world-page', globaltravel: 'stui-travel-page', geography: 'stui-geography-page', company: 'stui-company-page', finance: 'stui-finance-page', projects: 'stui-production-page' };
  Object.entries(pageTreatments).forEach(([id, className]) => $('#page-' + id)?.classList.add(className));
  const existingPageCount = $$('.page', content).length;
  body.dataset.stuiPageCount = String(existingPageCount);

  // A visible opt-in label makes this preview mode unmistakable.
  const mode = document.createElement('span');
  mode.className = 'stui-preview-mode';
  mode.textContent = 'DESIGN PREVIEW';
  const topRight = $('.topright', header || document);
  if (topRight) topRight.append(mode);


  // Campaign workspace: present the existing local-save renderer as a usable
  // library without changing save objects, storage keys or legacy actions.
  const campaignPage = $('#page-campaign');
  if (campaignPage) {
    campaignPage.classList.add('stui-campaign-page');
    const campaignHero = $('.hero', campaignPage);
    if (campaignHero && !$('.stui-campaign-overview', campaignPage)) {
      const overviewPanel = document.createElement('section');
      overviewPanel.className = 'stui-campaign-overview';
      overviewPanel.setAttribute('aria-label', 'Campaign library overview');
      overviewPanel.innerHTML = `
        <div class="stui-campaign-overview-head">
          <div><span class="stui-campaign-kicker">LOCAL ARCHIVE</span><h2>Campaign library</h2><p>Each history is its own studio, founder and evolving world. Manage the saves stored in this browser.</p></div>
          <span class="stui-campaign-device"><span class="stui-live-dot"></span> THIS DEVICE</span>
        </div>
        <div class="stui-campaign-metrics">
          <div class="stui-campaign-metric"><span>SAVED HISTORIES</span><strong id="stui-campaign-count">0</strong><small>Local campaign saves</small></div>
          <div class="stui-campaign-metric"><span>ACTIVE HISTORY</span><strong id="stui-campaign-active">No campaign loaded</strong><small id="stui-campaign-active-detail">Create or load a history to begin</small></div>
          <div class="stui-campaign-metric"><span>BACKUP LOCATION</span><strong>Browser storage</strong><small>Export JSON to keep an independent backup</small></div>
        </div>`;
      campaignHero.insertAdjacentElement('afterend', overviewPanel);
    }

    const libraryCard = $('.card', campaignPage);
    if (libraryCard) {
      libraryCard.classList.add('stui-campaign-library-card');
      const cardHead = $('.cardhead', libraryCard);
      if (cardHead && !$('.stui-campaign-search', libraryCard)) {
        const searchWrap = document.createElement('label');
        searchWrap.className = 'stui-campaign-search';
        searchWrap.innerHTML = '<span aria-hidden="true">⌕</span><input type="search" id="stui-campaign-search" placeholder="Search studio, founder, date or save ID" autocomplete="off" aria-label="Search saved campaigns">';
        cardHead.insertAdjacentElement('afterend', searchWrap);
      }
      const actions = $('.actions', libraryCard);
      if (actions) actions.classList.add('stui-campaign-backup-actions');
      const hint = $('.hint', libraryCard);
      if (hint) hint.classList.add('stui-campaign-backup-note');
    }

    const saveList = $('#savelist', campaignPage);
    const refreshCampaignLibrary = () => {
      const rows = $$('.saveitem', saveList || document);
      const count = $('#savecount', campaignPage)?.textContent || (rows.length + ' saves');
      const countNode = $('#stui-campaign-count', campaignPage);
      if (countNode) countNode.textContent = count.replace(/\\s+saves?$/i, '') || '0';
      let activeRow = null;
      rows.forEach(row => {
        row.classList.add('stui-campaign-entry');
        const title = $('b', row);
        const detail = $('.tiny', row);
        const buttons = $$('button', row);
        const isActive = buttons.some(button => button.textContent.trim().toLowerCase() === 'active');
        row.classList.toggle('is-active', isActive);
        row.dataset.search = row.textContent.toLowerCase();
        if (isActive) activeRow = row;
        const info = row.firstElementChild;
        if (info) info.classList.add('stui-campaign-entry-info');
        const actionGroup = $('.actions', row);
        if (actionGroup) actionGroup.classList.add('stui-campaign-entry-actions');
        if (title && !$('.stui-campaign-state', row)) {
          const state = document.createElement('span');
          state.className = 'stui-campaign-state';
          const nextState = isActive ? 'ACTIVE SESSION' : 'SAVED HISTORY';
          if (state.textContent !== nextState) state.textContent = nextState;
          title.insertAdjacentElement('afterend', state);
        } else if (title) {
          const state = $('.stui-campaign-state', row);
          const nextState = isActive ? 'ACTIVE SESSION' : 'SAVED HISTORY';
          if (state.textContent !== nextState) state.textContent = nextState;
        }
        if (detail) detail.classList.add('stui-campaign-entry-detail');
      });
      const activeName = activeRow ? $('b', activeRow)?.textContent.trim() : 'No campaign loaded';
      const activeDetail = activeRow ? $('.tiny', activeRow)?.textContent.trim() : 'Create or load a history to begin';
      const activeNode = $('#stui-campaign-active', campaignPage);
      const detailNode = $('#stui-campaign-active-detail', campaignPage);
      if (activeNode) activeNode.textContent = activeName || 'Untitled Studio';
      if (detailNode) detailNode.textContent = activeDetail || 'Current local save';
      if (saveList) {
        const query = ($('#stui-campaign-search', campaignPage)?.value || '').trim().toLowerCase();
        let visible = 0;
        rows.forEach(row => {
          const match = !query || (row.dataset.search || '').includes(query);
          row.hidden = !match;
          if (match) visible++;
        });
        let noMatch = $('.stui-campaign-no-match', saveList);
        if (query && rows.length && visible === 0) {
          if (!noMatch) {
            noMatch = document.createElement('div');
            noMatch.className = 'stui-campaign-no-match';
            noMatch.textContent = 'No saved campaigns match that search.';
            saveList.append(noMatch);
          }
        } else if (noMatch) noMatch.remove();
        const empty = rows.length === 0;
        saveList.classList.toggle('stui-campaign-empty', empty);
        if (empty && !$('.stui-campaign-empty-action', saveList)) {
          const create = document.createElement('button');
          create.type = 'button';
          create.className = 'btn primary stui-campaign-empty-action';
          create.textContent = '＋ Create your first campaign';
          create.addEventListener('click', () => $('.hero .btn.primary', campaignPage)?.click());
          saveList.append(create);
        }
      }
    };

    const campaignSearch = $('#stui-campaign-search', campaignPage);
    campaignSearch?.addEventListener('input', refreshCampaignLibrary);
    if (saveList) {
      new MutationObserver(refreshCampaignLibrary).observe(saveList, { childList: true, subtree: true });
    }
    refreshCampaignLibrary();
  }


  // Give the existing full campaign-creation form a clear, structured setup
  // treatment while leaving its fields, validation and submit path untouched.
  const campaignModal = $('#modal');
  const campaignModalBody = $('#mbody');
  const enhanceCampaignSetup = () => {
    const form = $('#newform', campaignModalBody || document);
    if (!form) {
      campaignModal?.classList.remove('stui-campaign-setup-modal');
      return;
    }
    campaignModal?.classList.add('stui-campaign-setup-modal');
    form.classList.add('stui-campaign-setup');
    if (!$('.stui-campaign-setup-note', form)) {
      const note = document.createElement('p');
      note.className = 'stui-campaign-setup-note';
      note.textContent = 'A campaign defines its own historical starting point, founder, company and simulation rules. You can change how the world develops through play.';
      form.insertBefore(note, form.firstElementChild);
    }
    $$('.eyebrow', form).forEach((heading, index) => {
      heading.classList.add('stui-setup-section-label');
      heading.dataset.section = String(index + 1).padStart(2, '0');
      if (heading.nextElementSibling?.classList.contains('formgrid')) {
        heading.nextElementSibling.classList.add('stui-setup-field-grid');
      }
    });
    $('button[type="submit"]', form)?.classList.add('stui-setup-submit');
  };
  if (campaignModalBody) {
    new MutationObserver(enhanceCampaignSetup).observe(campaignModalBody, { childList: true, subtree: true });
    enhanceCampaignSetup();
  }

  // Company workspace: elevate the existing corporate record without creating
  // parallel company state or replacing any legacy action/renderer.
  const companyPage = $('#page-company');
  if (companyPage) {
    companyPage.classList.add('stui-company-page');
    const companyHero = $('.hero', companyPage);
    const companyGrid = $('.grid.cols', companyPage);
    if (companyHero && !$('.stui-company-dossier-overview', companyPage)) {
      const overview = document.createElement('section');
      overview.className = 'stui-company-dossier-overview';
      overview.setAttribute('aria-label', 'Company at a glance');
      overview.innerHTML = `
        <div class="stui-company-identity">
          <span class="stui-company-kicker">CORPORATE DOSSIER</span>
          <h2 id="stui-company-name">No campaign loaded</h2>
          <p id="stui-company-headquarters">Create a campaign to establish a corporate headquarters.</p>
          <div class="stui-company-identity-meta">
            <span id="stui-company-status" class="stui-company-status">NO CAMPAIGN</span>
            <span id="stui-company-ownership">Ownership not available</span>
          </div>
        </div>
        <div class="stui-company-facts" aria-label="Company operating facts">
          <div><span>Company cash</span><strong id="stui-company-cash">—</strong></div>
          <div><span>Opening capital</span><strong id="stui-company-capital">—</strong></div>
          <div><span>Operating divisions</span><strong id="stui-company-divisions">—</strong></div>
          <div><span>Subsidiaries</span><strong id="stui-company-subsidiaries">—</strong></div>
        </div>`;
      companyHero.insertAdjacentElement('afterend', overview);

      const links = document.createElement('nav');
      links.className = 'stui-company-links';
      links.setAttribute('aria-label', 'Related company workspaces');
      [
        ['finance', 'Finance & capital'],
        ['people', 'People'],
        ['facilities', 'Facilities'],
        ['governance', 'Governance'],
        ['legal', 'Legal']
      ].forEach(([route, label]) => {
        if (!$('#page-' + route)) return;
        const link = document.createElement('button');
        link.type = 'button';
        link.className = 'stui-company-link';
        link.dataset.route = route;
        link.textContent = label;
        link.addEventListener('click', () => window.nav(route));
        links.append(link);
      });
      overview.insertAdjacentElement('afterend', links);
    }

    if (companyGrid) companyGrid.classList.add('stui-company-dossier-grid');
    const companyDetails = $('#companydetails', companyPage);
    const divisionsHost = $('#divisions', companyPage);
    const legalStatus = $('#legalstatus', companyPage);
    const setText = (id, value) => {
      const node = $('#' + id, companyPage);
      if (node && node.textContent !== value) node.textContent = value;
    };
    const rowValue = label => {
      const rows = $$('.rowitem', companyDetails || document);
      const row = rows.find(item => (item.firstElementChild?.textContent || '').trim().toLowerCase() === label.toLowerCase());
      return row?.lastElementChild?.textContent.trim() || '';
    };
    const refreshCompanyDossier = () => {
      if (!companyDetails) return;
      const hasCampaign = $$('.rowitem', companyDetails).length > 0;
      const status = legalStatus?.textContent.trim() || 'Not available';
      if (!hasCampaign) {
        setText('stui-company-name', 'No campaign loaded');
        setText('stui-company-headquarters', 'Create a campaign to establish a corporate headquarters.');
        setText('stui-company-status', 'NO CAMPAIGN');
        setText('stui-company-ownership', 'Ownership not available');
        ['cash', 'capital', 'divisions', 'subsidiaries'].forEach(key => setText('stui-company-' + key, '—'));
        return;
      }
      const name = rowValue('Legal name') || 'Untitled company';
      const city = rowValue('Headquarters');
      const currency = rowValue('Reporting currency');
      const ownership = rowValue('Ownership');
      const divisionCount = $$('.rowitem', divisionsHost || document).length;
      const subsidiaryCount = rowValue('Subsidiaries') || '0';
      setText('stui-company-name', name);
      setText('stui-company-headquarters', city ? city + (currency ? ' · Reporting in ' + currency : '') : 'Headquarters not specified');
      setText('stui-company-status', status.toUpperCase());
      $('#stui-company-status', companyPage)?.classList.toggle('is-incorporated', status.toLowerCase() === 'incorporated');
      setText('stui-company-ownership', ownership ? 'Ownership · ' + ownership : 'Ownership not specified');
      setText('stui-company-cash', rowValue('Cash balance') || 'Not available');
      setText('stui-company-capital', rowValue('Opening capital') || 'Not available');
      setText('stui-company-divisions', String(divisionCount));
      setText('stui-company-subsidiaries', subsidiaryCount);
    };
    [companyDetails, divisionsHost, legalStatus].filter(Boolean).forEach(node => {
      new MutationObserver(refreshCompanyDossier).observe(node, { childList: true, subtree: true, characterData: true });
    });
    refreshCompanyDossier();
  }

  // Finance workspace: add a non-destructive section navigator to the
  // existing ledger, journal, invoice, asset, debt, tax and treasury panels.
  const financePage = $('#page-finance');
  if (financePage) {
    financePage.classList.add('stui-finance-page');
    const financeHero = $('.hero', financePage);
    const summaryGrid = $('.grid.stats', financePage);
    const financeSections = [
      { title: 'Balance sheet snapshot', id: 'stui-finance-balance-sheet', label: 'Balance sheet' },
      { title: 'General ledger', id: 'stui-finance-ledger', label: 'Ledger' },
      { title: 'Double-entry accounting', id: 'stui-finance-accounting', label: 'Accounting' },
      { title: 'Receivables & payables', id: 'stui-finance-receivables', label: 'Receivables' },
      { title: 'Fixed asset register', id: 'stui-finance-assets', label: 'Assets' },
      { title: 'Debt facilities', id: 'stui-finance-debt', label: 'Debt' },
      { title: 'Corporate tax estimation', id: 'stui-finance-tax', label: 'Tax' },
      { title: 'Foreign exchange & treasury wallets', id: 'stui-finance-treasury', label: 'FX & treasury' },
      { title: 'Financial integrity', id: 'stui-finance-integrity', label: 'Audit' }
    ];
    if (financeHero && summaryGrid && !$('.stui-finance-section-nav', financePage)) {
      summaryGrid.id = summaryGrid.id || 'stui-finance-summary';
      const nav = document.createElement('nav');
      nav.className = 'stui-finance-section-nav';
      nav.setAttribute('aria-label', 'Finance sections');
      const items = [{ id: summaryGrid.id, label: 'Summary' }];
      financeSections.forEach(section => {
        const panel = Array.from(financePage.children).find(child =>
          child.classList?.contains('card') &&
          $('.cardtitle', child)?.textContent.trim() === section.title
        );
        if (!panel) return;
        if (!panel.id) panel.id = section.id;
        panel.classList.add('stui-finance-panel');
        items.push({ id: panel.id, label: section.label });
      });
      items.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'stui-finance-section-link';
        button.textContent = item.label;
        button.dataset.target = item.id;
        if (index === 0) button.setAttribute('aria-current', 'location');
        button.addEventListener('click', () => {
          const target = document.getElementById(button.dataset.target);
          if (!target) return;
          target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
          });
          $$('.stui-finance-section-link', nav).forEach(link => {
            if (link === button) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        });
        nav.append(button);
      });
      financeHero.insertAdjacentElement('afterend', nav);
      financePage.dataset.stuiFinanceSections = String(items.length);
    }
  }

  // Productions workspace: add live slate counts and search/stage filters
  // around the legacy project renderer. Project records and actions stay owned
  // by the existing production engine.
  const productionPage = $('#page-projects');
  if (productionPage) {
    productionPage.classList.add('stui-production-page');
    const productionHero = $('.hero', productionPage);
    const projectList = $('#projectlist', productionPage);
    if (productionHero && projectList && !$('.stui-production-overview', productionPage)) {
      const overview = document.createElement('section');
      overview.className = 'stui-production-overview';
      overview.setAttribute('aria-label', 'Production slate overview');
      overview.innerHTML = `
        <div class="stui-production-overview-head">
          <div><span class="stui-production-kicker">DEVELOPMENT & PRODUCTION</span><h2>Production slate</h2><p>Track projects through their existing development and release stages.</p></div>
          <span id="stui-production-count-label" class="stui-production-count-label">No campaign loaded</span>
        </div>
        <div class="stui-production-metrics">
          <div><span>Projects</span><strong id="stui-production-total">—</strong></div>
          <div><span>Concept & development</span><strong id="stui-production-development">—</strong></div>
          <div><span>Principal photography</span><strong id="stui-production-shooting">—</strong></div>
          <div><span>Released</span><strong id="stui-production-released">—</strong></div>
        </div>`;
      productionHero.insertAdjacentElement('afterend', overview);

      const toolbar = document.createElement('div');
      toolbar.className = 'stui-production-toolbar';
      toolbar.innerHTML = `
        <label class="stui-production-search"><span aria-hidden="true">⌕</span><input id="stui-production-search" type="search" placeholder="Search project, format or genre" aria-label="Search production slate"></label>
        <label class="stui-production-filter"><span>STAGE</span><select id="stui-production-stage" aria-label="Filter production slate by stage">
          <option value="">All stages</option>
          <option value="development">Concept & development</option>
          <option value="preproduction">Pre-production</option>
          <option value="production">Principal photography</option>
          <option value="postproduction">Post-production</option>
          <option value="marketing">Marketing & distribution</option>
          <option value="released">Released</option>
        </select></label>
        <span id="stui-production-result-count" class="stui-production-result-count">0 projects</span>`;
      overview.insertAdjacentElement('afterend', toolbar);

      const filterMessage = document.createElement('p');
      filterMessage.className = 'stui-production-no-match';
      filterMessage.textContent = 'No projects match the current search and stage filter.';
      filterMessage.hidden = true;
      toolbar.insertAdjacentElement('afterend', filterMessage);

      const searchInput = $('#stui-production-search', toolbar);
      const stageSelect = $('#stui-production-stage', toolbar);
      const refreshProductionSlate = () => {
        const entries = Array.from(projectList.children).filter(row =>
          row instanceof Element && !!row.querySelector('.progress') &&
          !!row.querySelector('.rowitem .tag.gold')
        );
        const noCampaign = projectList.textContent.includes('Create a campaign first.');
        const groups = { development: 0, preproduction: 0, production: 0, postproduction: 0, marketing: 0, released: 0 };
        entries.forEach(row => {
          const stage = row.querySelector('.rowitem .tag.gold')?.textContent.trim() || '';
          const group = ({
            'Concept': 'development',
            'Development': 'development',
            'Pre-production': 'preproduction',
            'Principal photography': 'production',
            'Post-production': 'postproduction',
            'Marketing & distribution': 'marketing',
            'Released': 'released'
          })[stage] || 'other';
          row.classList.add('stui-production-entry');
          row.dataset.stuiStage = group;
          row.dataset.stuiSearch = row.textContent.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(groups, group)) groups[group]++;
        });
        const query = (searchInput?.value || '').trim().toLowerCase();
        const selectedStage = stageSelect?.value || '';
        let visible = 0;
        entries.forEach(row => {
          const searchMatch = !query || (row.dataset.stuiSearch || '').includes(query);
          const stageMatch = !selectedStage || row.dataset.stuiStage === selectedStage;
          row.hidden = !(searchMatch && stageMatch);
          if (!row.hidden) visible++;
        });
        const setMetric = (id, value) => {
          const node = $('#' + id, productionPage);
          const next = noCampaign ? '—' : String(value);
          if (node && node.textContent !== next) node.textContent = next;
        };
        setMetric('stui-production-total', entries.length);
        setMetric('stui-production-development', groups.development);
        setMetric('stui-production-shooting', groups.production);
        setMetric('stui-production-released', groups.released);
        const projectWord = entries.length === 1 ? 'project' : 'projects';
        const label = noCampaign
          ? 'No campaign loaded'
          : visible === entries.length ? entries.length + ' ' + projectWord + ' in slate' : visible + ' of ' + entries.length + ' projects shown';
        const labelNode = $('#stui-production-count-label', productionPage);
        const countNode = $('#stui-production-result-count', productionPage);
        if (labelNode && labelNode.textContent !== label) labelNode.textContent = label;
        if (countNode) countNode.textContent = noCampaign ? 'No campaign' : visible + ' / ' + entries.length + ' projects';
        filterMessage.hidden = !query && !selectedStage || visible > 0 || entries.length === 0;
      };
      searchInput.addEventListener('input', refreshProductionSlate);
      stageSelect.addEventListener('change', refreshProductionSlate);
      new MutationObserver(refreshProductionSlate).observe(projectList, { childList: true, subtree: true });
      refreshProductionSlate();
    }
  }

  const refreshPresentation = () => { if (typeof window.render === 'function') window.render(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshPresentation, { once: true });
  else refreshPresentation();
  window.addEventListener('load', refreshPresentation, { once: true });

  console.info('[STUDIO_UI_NEXT] Preview shell active. Simulation engines and save data are unchanged.');
})();


/* GAME DECK LAYER — live campaign HUD and command presentation.
   This layer changes presentation only; every value is mirrored from existing
   simulation DOM nodes and every action remains owned by the original engine. */
(() => {
  'use strict';
  if (new URLSearchParams(window.location.search).get('ui') !== 'next') return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const main = $('.main');
  const top = $('.top');
  const content = $('.content');
  if (!main || !top || !content || $('.stui-game-ribbon')) return;

  const ribbon = document.createElement('section');
  ribbon.className = 'stui-game-ribbon';
  ribbon.setAttribute('aria-label', 'Live campaign status');
  ribbon.innerHTML = '<div class="stui-game-identity"><span class="stui-game-overline">LIVE WORLD</span><strong id="stui-hud-company">NO CAMPAIGN LOADED</strong><small id="stui-hud-location">Create a campaign to establish your studio</small></div><div class="stui-game-resources"><div class="stui-hud-stat"><span>TREASURY</span><strong id="stui-hud-cash">—</strong></div><div class="stui-hud-stat"><span>PRODUCTIONS</span><strong id="stui-hud-projects">—</strong></div><div class="stui-hud-stat"><span>WORKFORCE</span><strong id="stui-hud-staff">—</strong></div><div class="stui-hud-stat"><span>WORLD DATE</span><strong id="stui-hud-date">—</strong></div></div><div class="stui-game-clock"><span class="stui-live-dot"></span><span id="stui-hud-clock">WORLD PAUSED</span></div>';
  top.insertAdjacentElement('afterend', ribbon);

  const read = id => document.getElementById(id)?.textContent?.trim() || '—';
  const write = (id, value) => {
    const node = document.getElementById(id);
    if (node && node.textContent !== value) node.textContent = value;
  };
  const updateHud = () => {
    const company = read('companyname');
    const noCampaign = !company || company === '—';
    write('stui-hud-company', noCampaign ? 'NO CAMPAIGN LOADED' : company.toUpperCase());
    const headquarters = read('hq');
    const era = read('erastat');
    write('stui-hud-location', noCampaign
      ? 'Create a campaign to establish your studio'
      : [headquarters !== '—' ? headquarters : '', era !== '—' ? era : ''].filter(Boolean).join('  /  ') || 'Studio headquarters not yet established');
    write('stui-hud-cash', read('cashstat'));
    write('stui-hud-projects', read('projectstat'));
    write('stui-hud-staff', read('staffstat'));
    const date = read('datestat');
    write('stui-hud-date', date === '—' ? '—' : date);
    const clock = read('clockstatus');
    write('stui-hud-clock', clock === '—' ? 'WORLD PAUSED' : clock.toUpperCase());
    const clockNode = $('#stui-hud-clock');
    if (clockNode) clockNode.parentElement?.classList.toggle('is-running', /running|playing|advancing/i.test(clock));
  };
  const watched = ['companyname','hq','erastat','cashstat','projectstat','staffstat','datestat','daystat','clockstatus'];
  watched.map(id => document.getElementById(id)).filter(Boolean).forEach(node => {
    new MutationObserver(updateHud).observe(node, {childList:true,subtree:true,characterData:true});
  });
  updateHud();

  const overview = $('#page-overview');
  if (overview) {
    overview.classList.add('stui-command-deck');
    const hero = $('.hero', overview);
    const actions = $('.hero .actions', overview);
    if (hero) {
      hero.classList.add('stui-command-hero');
      const eyebrow = $('.eyebrow', hero);
      const heading = $('.h1', hero);
      const subtitle = $('.sub', hero);
      if (eyebrow) eyebrow.textContent = 'THE GLOBAL ENTERTAINMENT SIMULATION';
      if (heading) heading.textContent = 'Command your studio. Shape an industry.';
      if (subtitle) subtitle.textContent = 'Build a company, develop stories, manage talent and compete for influence in a living entertainment world.';
    }
    if (actions && !$('.stui-time-control-label', actions)) {
      const label = document.createElement('span');
      label.className = 'stui-time-control-label';
      label.textContent = 'SIMULATION CONTROLS';
      actions.insertBefore(label, actions.firstChild);
      const replacements = ['DAY +1','WEEK +1','MONTH +1','YEAR +1','EXPORT SAVE'];
      Array.from(actions.querySelectorAll('button')).forEach((button, index) => {
        if (replacements[index]) button.textContent = replacements[index];
        button.classList.add('stui-sim-button');
      });
    }
    const brief = document.createElement('div');
    brief.className = 'stui-command-brief';
    brief.innerHTML = '<span class="stui-command-brief-mark">◈</span><div><b>THE STUDIO COMMAND DECK</b><p id="stui-command-brief-copy">Your decisions shape productions, careers, markets and the wider world.</p></div><span class="stui-command-brief-tag">PERSISTENT WORLD</span>';
    const stats = $('.grid.stats', overview);
    if (stats && !$('.stui-command-brief', overview)) stats.insertAdjacentElement('beforebegin', brief);
    const updateBrief = () => {
      const name = read('companyname');
      const copy = $('#stui-command-brief-copy');
      if (copy) copy.textContent = name && name !== '—'
        ? name + ' is your foothold in a living entertainment industry. Every day advances the world around it.'
        : 'Create a campaign to establish your founder, choose a starting era and build your entertainment company.';
    };
    ['companyname','datestat'].map(id => document.getElementById(id)).filter(Boolean).forEach(node => {
      new MutationObserver(updateBrief).observe(node,{childList:true,subtree:true,characterData:true});
    });
    updateBrief();
  }

  // Give every workspace a game-like chapter marker while preserving its
  // existing title, buttons, route IDs and engine-specific form structure.
  document.querySelectorAll('.page').forEach((page, index) => {
    page.classList.add('stui-game-workspace');
    const hero = $('.hero', page);
    if (hero && !$('.stui-workspace-index', hero)) {
      const marker = document.createElement('span');
      marker.className = 'stui-workspace-index';
      marker.textContent = 'WORKSPACE  /  ' + String(index + 1).padStart(2,'0');
      hero.insertBefore(marker, hero.firstChild);
    }
  });
  console.info('[STUDIO_GAME_UI] Game command deck active. Simulation logic is unchanged.');
})();
