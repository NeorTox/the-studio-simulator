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
      const rows = $('.saveitem', saveList || document);
      const count = $('#savecount', campaignPage)?.textContent || (rows.length + ' saves');
      const countNode = $('#stui-campaign-count', campaignPage);
      if (countNode) countNode.textContent = count.replace(/\\s+saves?$/i, '') || '0';
      let activeRow = null;
      rows.forEach(row => {
        row.classList.add('stui-campaign-entry');
        const title = $('b', row);
        const detail = $('.tiny', row);
        const buttons = $('button', row);
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
          state.textContent = isActive ? 'ACTIVE SESSION' : 'SAVED HISTORY';
          title.insertAdjacentElement('afterend', state);
        } else if (title) {
          const state = $('.stui-campaign-state', row);
          state.textContent = isActive ? 'ACTIVE SESSION' : 'SAVED HISTORY';
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

  const refreshPresentation = () => { if (typeof window.render === 'function') window.render(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshPresentation, { once: true });
  else refreshPresentation();
  window.addEventListener('load', refreshPresentation, { once: true });

  console.info('[STUDIO_UI_NEXT] Preview shell active. Simulation engines and save data are unchanged.');
})();
