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
  const nav = $('.nav'), shell = $('#app-shell'), side = $('#desktop-sidebar');
  if (!nav || !shell || !side) return;
  function groupNavigation() {
    const directButtons = $$(':scope > button[data-page]', nav);
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
    $$('.nav button', nav).forEach(b => b.classList.toggle('active', b === button));
    $$('.mobile-nav button[data-mobile-page]').forEach(b => b.classList.toggle('active', b.dataset.mobilePage === route));
    const crumb = $('#crumb');
    if (crumb && button) crumb.textContent = button.textContent.trim().replace(/\s+/g,' ').toUpperCase();
    closeDrawer();
    return true;
  }
  window.nav = activate;
  $$('.mobile-nav button[data-mobile-page]').forEach(button => button.addEventListener('click', () => activate(button.dataset.mobilePage)));
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
    const available = groups.map(group => ({...group,nodes:group.nodes.filter(Boolean)})).filter(group => group.nodes.length);
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
  function installScreenSections() {
    const finance = $('#page-finance');
    if (finance) {
      const cards = Array.from(finance.children).filter(node => node.classList.contains('card'));
      const byTitle = title => cards.find(node => node.querySelector('.cardtitle')?.textContent.trim() === title);
      const investments = finance.querySelector(':scope > .card:has(#phase8-empire)');
      installWorkspaceTabs('page-finance',[
        {key:'overview',label:'Overview',nodes:[byTitle('Balance sheet snapshot')]},
        {key:'accounting',label:'Accounting',nodes:[byTitle('General ledger'),byTitle('Double-entry accounting'),byTitle('Journal register')]},
        {key:'operations',label:'Operations',nodes:[byTitle('Receivables & payables'),byTitle('Fixed asset register')]},
        {key:'capital',label:'Debt & Treasury',nodes:[byTitle('Debt facilities'),byTitle('Corporate tax estimation'),byTitle('Foreign exchange & treasury wallets')]},
        {key:'investments',label:'Investments',nodes:[investments]},
        {key:'audit',label:'Audit',nodes:[byTitle('Financial integrity')]}
      ],':scope > .grid.stats');
    }
    const projects = $('#page-projects');
    if (projects) {
      const slate = projects.querySelector(':scope > .card:has(#projectlist)');
      const contracts = projects.querySelector(':scope > .card:has(#productioncontracts)');
      if (slate) {
        const developmentRoom = $('#phase5-development');
        const productionOptimizer = $('#production-portfolio-optimizer');
        if (developmentRoom) slate.append(developmentRoom);
        if (productionOptimizer) slate.append(productionOptimizer);
      }
      installWorkspaceTabs('page-projects',[
        {key:'slate',label:'Production slate',nodes:[slate]},
        {key:'contracts',label:'Contracts & payments',nodes:[contracts]}
      ],':scope > .hero');
    }
    const talent = $('#page-talent');
    if (talent) {
      const register = talent.querySelector(':scope > .grid.cols');
      const contracts = talent.querySelector(':scope > .card:has(#contractlist)');
      installWorkspaceTabs('page-talent',[
        {key:'roster',label:'Roster & auditions',nodes:[register]},
        {key:'contracts',label:'Casting contracts',nodes:[contracts]}
      ],':scope > .hero');
    }
    const market = $('#page-market');
    if (market) {
      const stats = market.querySelector(':scope > .grid.stats');
      const grid = market.querySelector(':scope > .grid.cols');
      const cards = Array.from(market.children).filter(node => node.classList.contains('card'));
      const byTitle = title => cards.find(node => node.querySelector('.cardtitle')?.textContent.trim() === title);
      installWorkspaceTabs('page-market',[
        {key:'industry',label:'Industry',nodes:[grid,byTitle('Macroeconomic dashboard'),byTitle('Selected real-world industry entities')]},
        {key:'markets',label:'Markets & investment',nodes:[byTitle('Equity market'),byTitle('Treasury portfolio & trading')]},
        {key:'competition',label:'Competitors',nodes:[byTitle('Competitor register'),byTitle('Autonomous competitor operations')]},
        {key:'workforce',label:'Labour market',nodes:[byTitle('Entertainment labour market')]}
      ],':scope > .grid.stats');
    }
    const media = $('#page-media');
    if (media) {
      const stats = media.querySelector(':scope > .grid.stats');
      const newsroom = media.querySelector(':scope > .grid.cols');
      const publicity = media.querySelector(':scope > .card:has(#mediacampaignlist)');
      installWorkspaceTabs('page-media',[
        {key:'newsroom',label:'Newsroom & coverage',nodes:[newsroom]},
        {key:'publicity',label:'Publicity campaigns',nodes:[publicity]}
      ],':scope > .grid.stats');
    }
  }
  installScreenSections();
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