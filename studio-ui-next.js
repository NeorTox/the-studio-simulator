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
    const createAction = $('#page-campaign .hero .btn.primary');
    if (createAction) createAction.click();
    else if (typeof window.nav === 'function') window.nav('campaign');
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
      if (result) {
        updateActiveRoute(id);
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
    $('.stui-section-nav-item').forEach(item => {
      const active = item.dataset.route === id;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    const crumb = $('#crumb');
    if (crumb) crumb.textContent = label.toUpperCase();
  }

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
  const existingPageCount = $('.page', content).length;
  body.dataset.stuiPageCount = String(existingPageCount);

  // A visible opt-in label makes this preview mode unmistakable.
  const mode = document.createElement('span');
  mode.className = 'stui-preview-mode';
  mode.textContent = 'DESIGN PREVIEW';
  const topRight = $('.topright', header || document);
  if (topRight) topRight.append(mode);

  const refreshPresentation = () => { if (typeof window.render === 'function') window.render(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshPresentation, { once: true });
  else refreshPresentation();

  console.info('[STUDIO_UI_NEXT] Preview shell active. Simulation engines and save data are unchanged.');
})();
