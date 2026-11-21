(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const groups = [
    {id:'home', title:'Command', routes:['overview','campaign','calendar','situations']},
    {id:'life', title:'Life', routes:['personal','people','population','generations','phone','digital']},
    {id:'world', title:'World & travel', routes:['world','time','geography','globaltravel','worldengine','worldsystems']},
    {id:'studio', title:'Studio', routes:['company','projects','productionops','facilities','people','talent','ip','distribution','media','awards','ecosystem']},
    {id:'empire', title:'Empire', routes:['finance','market','legal','governance','sustainability','competitors','technology']},
    {id:'advanced', title:'Advanced systems', routes:['admin','manual','algorithms','integrity','architecture','peopleintelligence','integrationhealth','releasequality','autonomy']}
  ];
  const routeGroup = new Map();
  groups.forEach(g => g.routes.forEach(r => routeGroup.set(r,g.id)));
  const nav = $('.nav'), shell = $('#app-shell'), side = $('#desktop-sidebar'), sideNavWrap = $('.side-nav-wrap', side);
  if (!nav || !shell || !side) return;
  function mountPinnedSettings() {
    if (!sideNavWrap) return;
    const settingsButtons = Array.from(sideNavWrap.querySelectorAll('button[data-page="settings"]'));
    const button = settingsButtons[0] || null;
    settingsButtons.slice(1).forEach(extra => extra.remove());
    if (!button) return;
    let dock = $('#studio-settings-dock', sideNavWrap);
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'studio-settings-dock';
      dock.className = 'nav-utility';
      dock.setAttribute('aria-label','System settings');
      nav.after(dock);
    }
    button.classList.add('settings-nav-button');
    dock.append(button);
  }
  function groupNavigation() {
    mountPinnedSettings();
    const directButtons = Array.from(nav.querySelectorAll(':scope > button[data-page]'));
    if (!nav.dataset.grouped) {
      nav.replaceChildren();
      groups.forEach(g => {
        const section = document.createElement('section');
        section.className = 'nav-group';
        section.dataset.navGroup = g.id;
        const heading = document.createElement('div');
        heading.className = 'nav-group-heading';
        heading.textContent = g.title;
        section.append(heading);
        nav.append(section);
      });
      nav.dataset.grouped = 'true';
    }
    const buckets = new Map(groups.map(g => [g.id, $('[data-nav-group="' + g.id + '"]', nav)]));
    directButtons.forEach(button => {
      const group = routeGroup.get(button.dataset.page) || 'advanced';
      buckets.get(group).append(button);
    });
    groups.forEach(g => {
      const section = buckets.get(g.id);
      section.hidden = !$$('button[data-page]', section).length;
    });
  }
  groupNavigation();
  const observer = new MutationObserver(() => {
    if ($(':scope > button[data-page]', nav)) groupNavigation();
  });
  observer.observe(nav, {childList:true});
  const search = $('#stui-nav-search');
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    $$('.nav-group', nav).forEach(section => {
      let visible = 0;
      $$('button[data-page]', section).forEach(button => {
        const match = !q || (button.textContent + ' ' + button.dataset.page).toLowerCase().includes(q);
        button.hidden = !match;
        if (match) visible++;
      });
      section.hidden = visible === 0;
    });
  });
  const closeDrawer = () => {
    document.body.classList.remove('nav-open');
    $('#mobile-menu-toggle')?.setAttribute('aria-expanded','false');
    $('#mobile-more')?.setAttribute('aria-expanded','false');
  };
  const openDrawer = () => {
    document.body.classList.add('nav-open');
    $('#mobile-menu-toggle')?.setAttribute('aria-expanded','true');
    $('#mobile-more')?.setAttribute('aria-expanded','true');
  };
  $('#mobile-menu-toggle')?.addEventListener('click', () => document.body.classList.contains('nav-open') ? closeDrawer() : openDrawer());
  $('#mobile-more')?.addEventListener('click', () => document.body.classList.contains('nav-open') ? closeDrawer() : openDrawer());
  $('#nav-backdrop')?.addEventListener('click', closeDrawer);
  nav.addEventListener('click', e => {
    if (e.target.closest('button[data-page]')) closeDrawer();
  });
  const baseNav = typeof window.nav === 'function' ? window.nav.bind(window) : null;
  function activate(route) {
    if (baseNav) baseNav(route);
    else {
      const target = $('#page-' + route);
      if (!target) return false;
      $$('.page').forEach(p => p.classList.toggle('active', p === target));
    }
    const button = $('[data-page="' + route + '"]', nav);
    Array.from(nav.querySelectorAll('.nav button')).forEach(b => b.classList.toggle('active', b === button));
    const settingsActive = route === 'settings';
    $('#studio-settings-dock [data-page="settings"]')?.classList.toggle('active', settingsActive);
    $('#stui-settings-shortcut')?.classList.toggle('active', settingsActive);
    Array.from(document.querySelectorAll('.mobile-nav button[data-mobile-page]')).forEach(b => b.classList.toggle('active', b.dataset.mobilePage === route));
    const crumb = $('#crumb');
    if (crumb) crumb.textContent = button ? button.textContent.trim().replace(/\s+/g,' ').toUpperCase() : (settingsActive ? 'SETTINGS' : route.toUpperCase());
    closeDrawer();
    return true;
  }
  window.nav = activate;
  const topRight = $('.topright');
  if (topRight && !$('#stui-settings-shortcut')) {
    const shortcut = document.createElement('button');
    shortcut.type = 'button';
    shortcut.id = 'stui-settings-shortcut';
    shortcut.className = 'top-settings-button';
    shortcut.setAttribute('aria-label','Open Settings centre');
    shortcut.title = 'Settings centre';
    shortcut.textContent = '⚙ SETTINGS';
    shortcut.addEventListener('click',() => activate('settings'));
    topRight.prepend(shortcut);
  }
  Array.from(document.querySelectorAll('.mobile-nav button[data-mobile-page]')).forEach(button => button.addEventListener('click', () => activate(button.dataset.mobilePage)));
  const saved = (() => {
    try {
      const items = JSON.parse(localStorage.getItem('the-studio-saves-v2') || '[]');
      const activeId = localStorage.getItem('the-studio-active-v2');
      return {items:Array.isArray(items)?items:[],active:(Array.isArray(items)?items:[]).find(x => x && x.id === activeId) || null};
    } catch (_) { return {items:[],active:null}; }
  })();
  const continueButton = $('#start-continue');
  const detail = $('#start-continue-detail');
  if (saved.active) {
    detail.textContent = (saved.active.company?.name || 'Your studio') + ' · ' + (saved.active.date || 'Saved world');
  } else {
    continueButton.querySelector('b').textContent = 'START A NEW WORLD';
    detail.textContent = 'No active campaign is saved on this device';
  }
  const startup = $('#studio-start-screen');
  const boot = $('#studio-boot-screen');
  const enter = () => {
    startup.hidden = true;
    shell.setAttribute('aria-hidden','false');
    document.body.classList.remove('startup-open');
  };
  $('#start-continue')?.addEventListener('click', () => {
    enter();
    if (saved.active) activate('overview');
    else {
      activate('campaign');
      window.newCampaignForm?.();
    }
  });
  $('#start-new')?.addEventListener('click', () => {
    enter();
    activate('campaign');
    window.newCampaignForm?.();
  });
  $('#start-load')?.addEventListener('click', () => { enter(); activate('campaign'); });
  $('#start-advanced')?.addEventListener('click', () => { enter(); activate('algorithms'); });
  function installWorkspaceTabs(pageId, groups, anchorSelector) {
    const page = $('#'+pageId);
    if (!page || page.dataset.workspaceTabs === 'true') return;
    const bar = document.createElement('div');
    bar.className = 'workspace-tabs';
    bar.setAttribute('role','tablist');
    bar.setAttribute('aria-label',page.querySelector('.h1')?.textContent.trim() + ' sections');
    const panels = document.createElement('div');
    panels.className = 'workspace-panels';
    const available = groups.map(group => ({...group,nodes:group.nodes.filter(Boolean)})).filter(group => group.nodes.length || group.keepEmpty);
    if (available.length < 2) return;
    function activateTab(key) {
      available.forEach(group => {
        const active = group.key === key;
        const button = $('[data-workspace-tab="'+group.key+'"]',bar);
        const panel = $('#'+pageId+'-panel-'+group.key);
        if (button) {
          button.classList.toggle('active',active);
          button.setAttribute('aria-selected',String(active));
          button.tabIndex = active ? 0 : -1;
        }
        if (panel) panel.hidden = !active;
      });
      try { sessionStorage.setItem('studio-ui-tab-'+pageId,key); } catch (_) {}
    }
    available.forEach(group => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'workspace-tab';
      button.dataset.workspaceTab = group.key;
      button.setAttribute('role','tab');
      button.setAttribute('aria-controls',pageId+'-panel-'+group.key);
      button.setAttribute('aria-selected','false');
      button.textContent = group.label;
      button.addEventListener('click',() => activateTab(group.key));
      button.addEventListener('keydown',event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const index = available.findIndex(item => item.key === group.key);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? available.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + available.length) % available.length;
        const nextButton = $('[data-workspace-tab="'+available[next].key+'"]',bar);
        nextButton?.focus();
        activateTab(available[next].key);
      });
      bar.append(button);
      const panel = document.createElement('section');
      panel.className = 'workspace-panel';
      panel.id = pageId+'-panel-'+group.key;
      panel.setAttribute('role','tabpanel');
      panel.setAttribute('aria-label',group.label);
      group.nodes.forEach(node => panel.append(node));
      panels.append(panel);
    });
    const anchor = anchorSelector ? $(anchorSelector,page) : page.querySelector('.hero');
    if (anchor) anchor.after(bar);
    else page.prepend(bar);
    bar.after(panels);
    page.dataset.workspaceTabs = 'true';
    let preferred = 'overview';
    try { preferred = sessionStorage.getItem('studio-ui-tab-'+pageId) || preferred; } catch (_) {}
    activateTab(available.some(group => group.key === preferred) ? preferred : available[0].key);
  }
  function makeOperationalWorkspace(config) {
    const section = document.createElement('section');
    section.className = 'studio-operational-workspace';
    section.id = config.id;
    const heading = document.createElement('div');
    heading.className = 'studio-operational-workspace-heading';
    const copy = document.createElement('div');
    const kicker = document.createElement('div');
    kicker.className = 'eyebrow';
    kicker.textContent = config.kicker;
    const title = document.createElement('h2');
    title.textContent = config.title;
    const description = document.createElement('p');
    description.textContent = config.description;
    copy.append(kicker,title,description);
    const tag = document.createElement('span');
    tag.className = 'finance-workspace-tag';
    tag.textContent = config.tag;
    heading.append(copy,tag);
    const body = document.createElement('div');
    body.className = 'studio-operational-workspace-body';
    (config.nodes || []).filter(Boolean).forEach(node => body.append(node));
    section.append(heading,body);
    return section;
  }
  function installOperationalWorkspaces(pageId, configs, anchorSelector) {
    const page = $('#'+pageId);
    if (!page || page.dataset.operationalWorkspaces === 'true') return;
    const groups = configs.map(config => ({...config,node:makeOperationalWorkspace(config)}));
    const anchor = anchorSelector ? page.querySelector(anchorSelector) : page.querySelector(':scope > .hero');
    let previous = anchor;
    groups.forEach(group => {
      if (previous) previous.after(group.node);
      else page.append(group.node);
      previous = group.node;
    });
    installWorkspaceTabs(pageId,groups.map(group => ({
      key:group.key,
      label:group.label,
      nodes:[group.node]
    })),anchorSelector);
    page.dataset.operationalWorkspaces = 'true';
  }
  function installScreenSections() {
    const finance = $('#page-finance');
    if (finance) {
      const workspaces = {
        overview:$('#finance-overview-workspace'),
        accounting:$('#finance-accounting-workspace'),
        operations:$('#finance-operations-workspace'),
        capital:$('#finance-capital-workspace'),
        investments:$('#finance-investment-workspace'),
        audit:$('#finance-audit-workspace')
      };
      installWorkspaceTabs('page-finance',[
        {key:'overview',label:'Overview',nodes:[workspaces.overview]},
        {key:'accounting',label:'Accounting',nodes:[workspaces.accounting]},
        {key:'operations',label:'Operations',nodes:[workspaces.operations]},
        {key:'capital',label:'Debt & Treasury',nodes:[workspaces.capital]},
        {key:'investments',label:'Investments',nodes:[workspaces.investments],keepEmpty:true},
        {key:'audit',label:'Audit',nodes:[workspaces.audit]}
      ],':scope > .grid.stats');
      const investmentHost = $('#finance-investment-host');
      const moveInvestmentWorkspace = () => {
        const investmentCard = $('#phase8-empire')?.closest('.card');
        if (investmentCard && investmentHost && investmentCard.parentElement !== investmentHost) investmentHost.append(investmentCard);
      };
      moveInvestmentWorkspace();
      if (investmentHost) {
        const investmentObserver = new MutationObserver(moveInvestmentWorkspace);
        investmentObserver.observe(finance,{childList:true,subtree:true});
      }
    }
    const projects = $('#page-projects');
    if (projects) {
      const slate = $('#production-slate-workspace');
      const contracts = $('#production-contract-workspace');
      const moveProductionTools = () => {
        const developmentRoom = $('#phase5-development');
        const productionOptimizer = $('#production-portfolio-optimizer');
        const chartSlot = $('#production-slate-charts');
        if (developmentRoom && slate && !slate.contains(developmentRoom)) slate.insertBefore(developmentRoom,chartSlot || null);
        if (productionOptimizer && slate && !slate.contains(productionOptimizer)) slate.insertBefore(productionOptimizer,chartSlot || null);
      };
      moveProductionTools();
      installWorkspaceTabs('page-projects',[
        {key:'slate',label:'Production slate',nodes:[slate]},
        {key:'contracts',label:'Contracts & payments',nodes:[contracts]}
      ],':scope > .hero');
      moveProductionTools();
      if (slate) {
        const productionObserver = new MutationObserver(moveProductionTools);
        productionObserver.observe(projects,{childList:true,subtree:true});
      }
    }
        const people = $('#page-people');
    if (people) {
      const roster = $('#people-roster-workspace');
      const workforce = $('#people-workforce-workspace');
      installWorkspaceTabs('page-people',[
        {key:'roster',label:'Team roster',nodes:[roster]},
        {key:'workforce',label:'Workforce insights',nodes:[workforce]}
      ],':scope > .hero');
    }
    const talent = $('#page-talent');
    if (talent) {
      const roster = $('#talent-roster-workspace');
      const contracts = $('#talent-contract-workspace');
      installWorkspaceTabs('page-talent',[
        {key:'roster',label:'Roster & auditions',nodes:[roster]},
        {key:'contracts',label:'Casting agreements',nodes:[contracts]}
      ],':scope > .talent-metric-rail');
    }
        const facilities = $('#page-facilities');
    if (facilities) {
      installWorkspaceTabs('page-facilities',[
        {key:'portfolio',label:'Estate portfolio',nodes:[$('#facility-portfolio-workspace')]},
        {key:'costs',label:'Operating commitments',nodes:[$('#facility-costs-workspace')]},
        {key:'register',label:'Property register',nodes:[$('#facility-register-workspace')]}
      ],':scope > .hero');
    }
    const campaigns = $('#page-campaign');
    if (campaigns) {
      installWorkspaceTabs('page-campaign',[
        {key:'library',label:'Save library',nodes:[$('#campaign-library-workspace')]},
        {key:'backup',label:'Backup & restore',nodes:[$('#campaign-backup-workspace')]}
      ],':scope > .hero');
    }
    const calendar = $('#page-calendar');
    if (calendar) {
      installWorkspaceTabs('page-calendar',[
        {key:'events',label:'Upcoming events',nodes:[$('#calendar-events-workspace')]},
        {key:'clock',label:'World clock',nodes:[$('#calendar-clock-workspace')]},
        {key:'history',label:'Simulation history',nodes:[$('#calendar-history-workspace')]}
      ],':scope > .hero');
    }
    const admin = $('#page-admin');
    if (admin) {
      installWorkspaceTabs('page-admin',[
        {key:'achievements',label:'Achievements',nodes:[$('#sandbox-achievements-workspace')]},
        {key:'audit',label:'Cheat audit',nodes:[$('#sandbox-audit-workspace')]}
      ],':scope > .sandbox-console');
    }
    const company = $('#page-company');
    if (company) {
      installWorkspaceTabs('page-company',[
        {key:'profile',label:'Corporate profile',nodes:[$('#company-profile-workspace')]},
        {key:'divisions',label:'Divisions & subsidiaries',nodes:[$('#company-structure-workspace')]}
      ],':scope > .hero');
    }
    const personal = $('#page-personal');
    if (personal) {
      installWorkspaceTabs('page-personal',[
        {key:'assets',label:'Assets & finances',nodes:[$('#personal-assets-workspace')]},
        {key:'relationships',label:'Relationships & family',nodes:[$('#personal-relationships-workspace')]}
      ],':scope > .grid.stats');
    }
    const distribution = $('#page-distribution');
    if (distribution) {
      const stats = distribution.querySelector(':scope > .grid.stats');
      const grid = distribution.querySelector(':scope > .grid.cols');
      const agreements = grid?.querySelector(':scope > .card:has(#distributionlist)');
      const settlements = grid?.querySelector(':scope > .card:has(#settlementlist)');
      const chartSlot = document.createElement('div');
      chartSlot.id = 'distribution-settlement-chart-slot';
      chartSlot.className = 'distribution-settlement-chart-slot';
      chartSlot.setAttribute('aria-label','Royalty settlement history');
      installOperationalWorkspaces('page-distribution',[
        {key:'rights',label:'Rights agreements',id:'distribution-rights-workspace',kicker:'01 / RIGHTS PORTFOLIO',title:'Rights agreements',description:'Manage territory-level agreements, partners and the rights currently active across the studio catalogue.',tag:'DISTRIBUTION',nodes:[stats,agreements]},
        {key:'settlements',label:'Royalty settlements',id:'distribution-settlements-workspace',kicker:'02 / CASH RECEIPTS',title:'Royalty settlements',description:'Review partner statements and cash settlements received against active distribution agreements.',tag:'SETTLEMENT HISTORY',nodes:[settlements,chartSlot]}
      ],':scope > .hero');
      if (grid && !grid.children.length) grid.remove();
    }
    const digital = $('#page-digital');
    if (digital) {
      const stats = digital.querySelector(':scope > .grid.stats');
      const portfolio = digital.querySelector(':scope > .card:has(#digitallist)');
      installOperationalWorkspaces('page-digital',[
        {key:'performance',label:'Platform performance',id:'digital-performance-workspace',kicker:'01 / BUSINESS PERFORMANCE',title:'Digital platform performance',description:'Track active services, subscriber scale, recurring revenue and modeled installs.',tag:'LIVE CAMPAIGN DATA',nodes:[stats]},
        {key:'portfolio',label:'Platform portfolio',id:'digital-portfolio-workspace',kicker:'02 / SERVICE PORTFOLIO',title:'Platform portfolio',description:'Review each streaming, mobile and direct-to-consumer service in the studio group.',tag:'PLATFORM REGISTER',nodes:[portfolio]}
      ],':scope > .hero');
    }
    const sustainability = $('#page-sustainability');
    if (sustainability) {
      const stats = sustainability.querySelector(':scope > .grid.stats');
      const grid = sustainability.querySelector(':scope > .grid.cols');
      const operating = grid?.querySelector(':scope > .card:has(#sustaincontrols)');
      const investments = grid?.querySelector(':scope > .card:has(#greeninvestments)');
      const history = sustainability.querySelector(':scope > .card:has(#carbonhistory)');
      installOperationalWorkspaces('page-sustainability',[
        {key:'operations',label:'Environmental profile',id:'sustainability-operations-workspace',kicker:'01 / OPERATING FOOTPRINT',title:'Environmental operating profile',description:'Review energy, emissions, renewable share, water, waste and current environmental obligations.',tag:'MONTHLY MODEL',nodes:[stats,operating]},
        {key:'investments',label:'Green investments',id:'sustainability-investments-workspace',kicker:'02 / CAPITAL ALLOCATION',title:'Green investment portfolio',description:'Inspect approved and completed investments that improve the studio environmental profile.',tag:'INVESTMENT REGISTER',nodes:[investments]},
        {key:'history',label:'Performance history',id:'sustainability-history-workspace',kicker:'03 / LONGITUDINAL RECORD',title:'Environmental performance history',description:'Review the recorded history of emissions, energy and environmental progress.',tag:'HISTORY',nodes:[history]}
      ],':scope > .hero');
      if (grid && !grid.children.length) grid.remove();
    }
    const governance = $('#page-governance');
    if (governance) {
      const stats = governance.querySelector(':scope > .grid.stats');
      const grid = governance.querySelector(':scope > .grid.cols');
      const board = grid;
      const resolutions = governance.querySelector(':scope > .card:has(#resolutionlist)');
      installOperationalWorkspaces('page-governance',[
        {key:'board',label:'Board & ownership',id:'governance-board-workspace',kicker:'01 / OVERSIGHT',title:'Board & ownership',description:'Review the directors, shareholder register and governance indicators shaping corporate oversight.',tag:'CORPORATE GOVERNANCE',nodes:[stats,board]},
        {key:'resolutions',label:'Board resolutions',id:'governance-resolutions-workspace',kicker:'02 / DECISION RECORD',title:'Board resolutions',description:'Inspect recorded proposals, voting outcomes and formal decisions.',tag:'RESOLUTION REGISTER',nodes:[resolutions]}
      ],':scope > .hero');
      if (grid && !grid.children.length) grid.remove();
    }
    const population = $('#page-population');
    if (population) {
      const stats = population.querySelector(':scope > #npcstats');
      const people = population.querySelector(':scope > .card:has(#npclist)');
      const events = population.querySelector(':scope > .card:has(#npcevents)');
      const hint = population.querySelector(':scope > .hint');
      const chartSlot = document.createElement('div');
      chartSlot.id = 'population-age-chart-slot';
      chartSlot.className = 'population-age-chart-slot';
      chartSlot.setAttribute('aria-label','Materialized population age profile');
      installOperationalWorkspaces('page-population',[
        {key:'registry',label:'People registry',id:'population-registry-workspace',kicker:'01 / MATERIALIZED PEOPLE',title:'Generated people',description:'Inspect the named NPC records currently materialized in this campaign and generate additional people when needed.',tag:'NPC REGISTRY',nodes:[stats,people,chartSlot]},
        {key:'life',label:'World life events',id:'population-life-workspace',kicker:'02 / AUTONOMOUS LIFE',title:'World life events',description:'Follow recorded births, careers, relationships and other events in the virtual population.',tag:'LIFE EVENTS',nodes:[events,hint]}
      ],':scope > .hero');
    }
    const algorithms = $('#page-algorithms');
    if (algorithms) {
      const catalog = algorithms.querySelector(':scope > .card:has(#algorithmcatalog)');
      const results = algorithms.querySelector(':scope > .card:has(#algorithmresults)');
      installOperationalWorkspaces('page-algorithms',[
        {key:'inventory',label:'Algorithm inventory',id:'algorithms-inventory-workspace',kicker:'01 / MODEL COVERAGE',title:'Algorithm inventory',description:'Review which simulation models are implemented, partial or still outstanding.',tag:'REQUIREMENTS REGISTER',nodes:[catalog]},
        {key:'audit',label:'Validation results',id:'algorithms-audit-workspace',kicker:'02 / VALIDATION',title:'Algorithm validation',description:'Run checks and inspect the latest recorded validation results for the active campaign.',tag:'AUDIT RESULTS',nodes:[results]}
      ],':scope > .hero');
    }
    const clock = $('#page-time');
    if (clock) {
      const status = clock.querySelector(':scope > .card:has(#clockdate)');
      const rules = clock.querySelector(':scope > .grid.cols');
      installOperationalWorkspaces('page-time',[
        {key:'status',label:'World clock status',id:'worldclock-status-workspace',kicker:'01 / LIVE CLOCK',title:'In-game time',description:'Inspect the current simulated date and progression within the active world day.',tag:'WORLD CLOCK',nodes:[status]},
        {key:'rules',label:'Simulation rules',id:'worldclock-rules-workspace',kicker:'02 / AUTOMATION',title:'What advances automatically',description:'Review the daily systems, recurring obligations and rules that govern automatic time progression.',tag:'CLOCK RULES',nodes:[rules]}
      ],':scope > .hero');
    }
    const world = $('#page-world');
    if (world) {
      const box = world.querySelector(':scope > .worldbox');
      const grid = world.querySelector(':scope > .grid.cols');
      const profile = grid?.querySelector(':scope > .card:has(#worldprofile)');
      const systems = grid?.querySelector(':scope > .card:has(#worldsystems)');
      const hint = world.querySelector(':scope > .hint');
      installOperationalWorkspaces('page-world',[
        {key:'profile',label:'Era profile',id:'world-era-profile-workspace',kicker:'01 / HISTORICAL CONTEXT',title:'Era profile',description:'Review the campaign era, its tools, market conditions and the historical constraints available to the studio.',tag:'WORLD BASELINE',nodes:[profile,box]},
        {key:'systems',label:'Historical systems',id:'world-historical-systems-workspace',kicker:'02 / WORLD RULES',title:'Historical systems',description:'Inspect the era-based systems and the limits of the historical simulation.',tag:'SIMULATION SCOPE',nodes:[systems,hint]}
      ],':scope > .hero');
      if (grid && !grid.children.length) grid.remove();
    }
    const legal = $('#page-legal');
    if (legal) {
      installWorkspaceTabs('page-legal',[
        {key:'matters',label:'Legal matters',nodes:[$('#legal-matters-workspace')]},
        {key:'insurance',label:'Insurance & risk',nodes:[$('#legal-insurance-workspace')]}
      ],':scope > .grid.stats');
    }
    const awards = $('#page-awards');
    if (awards) {
      installWorkspaceTabs('page-awards',[
        {key:'events',label:'Award events',nodes:[$('#awards-events-workspace')]},
        {key:'submissions',label:'Submissions',nodes:[$('#awards-submissions-workspace')]}
      ],':scope > .hero');
    }
    const ip = $('#page-ip');
    if (ip) {
      installWorkspaceTabs('page-ip',[
        {key:'catalogue',label:'IP catalogue',nodes:[$('#ip-catalogue-workspace')]},
        {key:'licensing',label:'Rights & licensing',nodes:[$('#ip-licensing-workspace')]}
      ],':scope > .grid.stats');
    }
        const market = $('#page-market');
    if (market) {
      installWorkspaceTabs('page-market',[
        {key:'industry',label:'Industry & economy',nodes:[$('#market-industry-workspace')]},
        {key:'markets',label:'Equities & treasury',nodes:[$('#market-markets-workspace')]},
        {key:'competition',label:'Competitors',nodes:[$('#market-competition-workspace')]},
        {key:'workforce',label:'Labour market',nodes:[$('#market-labour-workspace')]}
      ],':scope > .grid.stats');
    }
    const media = $('#page-media');
    if (media) {
      installWorkspaceTabs('page-media',[
        {key:'newsroom',label:'Newsroom & coverage',nodes:[$('#media-newsroom-workspace')]},
        {key:'publicity',label:'Publicity campaigns',nodes:[$('#media-publicity-workspace')]}
      ],':scope > .grid.stats');
    }
  }
  function installCommandCentre() {
    const page = $('#page-overview');
    const stats = page?.querySelector(':scope > .grid.stats');
    if (!page || !stats || $('#studio-command-launchpad')) return;
    const card = document.createElement('section');
    card.className = 'card studio-command-launchpad';
    card.id = 'studio-command-launchpad';
    card.innerHTML = '<div class="cardhead"><div><b class="cardtitle">Operations launchpad</b><div class="tiny">YOUR NEXT MOVE · QUICK ACCESS</div></div><span class="tag gold">STUDIO CONTROL</span></div><div class="studio-command-grid"></div>';
    const actions = [
      {id:'production',title:'Develop a production',detail:'Create a film, series or animation project',run:()=>window.createProject?.()},
      {id:'finance',title:'Record a transaction',detail:'Post income or expenses to the ledger',run:()=>window.transactionForm?.()},
      {id:'people',title:'Build your team',detail:'Hire an employee and set monthly payroll',run:()=>window.hire?.()},
      {id:'talent',title:'Manage talent',detail:'Run auditions and negotiate casting',run:()=>window.nav?.('talent')},
      {id:'market',title:'Industry intelligence',detail:'Review competitors and audience demand',run:()=>window.nav?.('market')},
      {id:'travel',title:'Travel & world atlas',detail:'Plan a journey or explore destinations',run:()=>window.nav?.('globaltravel')}
    ];
    const grid = card.querySelector('.studio-command-grid');
    actions.forEach(action=>{
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'studio-command-action';
      button.dataset.commandAction = action.id;
      button.setAttribute('aria-label',action.title+'. '+action.detail);
      const title = document.createElement('b');
      title.textContent = action.title;
      const detail = document.createElement('span');
      detail.textContent = action.detail;
      const arrow = document.createElement('i');
      arrow.setAttribute('aria-hidden','true');
      arrow.textContent = '↗';
      button.append(title,detail,arrow);
      button.addEventListener('click',action.run);
      grid.append(button);
    });
    stats.insertAdjacentElement('afterend',card);
  }
  installScreenSections();
  installCommandCentre();
  const ready = () => {
    document.body.classList.add('startup-open');
    shell.setAttribute('aria-hidden','true');
    if (boot) boot.hidden = true;
    if (startup) startup.hidden = false;
    window.__STUDIO_UI_READY__ = true;
    document.dispatchEvent(new CustomEvent('studio-ui-ready'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
  window.addEventListener('resize', () => { if (window.innerWidth > 820) closeDrawer(); }, {passive:true});
  const updateClockLabel = () => {
    const pill = $('#clockpill');
    const note = $('#side-campaign-note');
    if (pill && saved.active) pill.textContent = saved.active.date || 'WORLD ACTIVE';
    if (note && saved.active) note.innerHTML = 'ACTIVE WORLD · ' + String(saved.active.company?.name || 'YOUR STUDIO').replace(/[<>&"]/g,'') + '<span>Local save · export a backup regularly.</span>';
  };
  updateClockLabel();
})();