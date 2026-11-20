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