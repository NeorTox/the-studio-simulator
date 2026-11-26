(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const campaign = () => typeof active !== 'undefined' && active && typeof active === 'object' ? active : null;
  const money = value => typeof fmt === 'function' ? fmt(n(value)) : n(value).toLocaleString();
  const list = value => Array.isArray(value) ? value : [];
  function go(route) { if (typeof window.nav === 'function') window.nav(route); }
  function render() {
    const page = $('#page-overview');
    if (!page) return;
    let root = $('#studio-today-command-centre');
    if (!root) {
      root = document.createElement('section');
      root.id = 'studio-today-command-centre';
      root.className = 'today-command-centre';
      const hero = page.querySelector(':scope > .hero');
      if (hero) hero.after(root); else page.prepend(root);
    }
    const a = campaign();
    if (!a) {
      root.innerHTML = '<div class="today-welcome"><div><div class="eyebrow">YOUR NEXT CHAPTER</div><h2>A world is waiting.</h2><p>Create a campaign to begin a life, build a studio and shape the entertainment industry.</p></div><button class="btn primary" type="button" data-today-go="campaign">Create your world ↗</button></div>';
      return;
    }
    const company = a.company || {};
    const projects = list(a.projects);
    const employees = list(a.employees).filter(person => !person.status || !/terminated|inactive|ended/i.test(String(person.status)));
    const events = list(a.events).slice().reverse().slice(0,5);
    const day = a.day ?? a.world?.day ?? '—';
    const date = a.date || a.world?.date || 'Date unavailable';
    const location = a.founder?.location?.city || a.world?.currentLocation?.city || a.personal?.location?.city || 'Location not recorded';
    const hq = company.headquarters || company.hq || 'Headquarters not recorded';
    const projectRows = projects.slice(0,4).map(project => {
      const stage = ['Concept','Development','Pre-production','Principal photography','Post-production','Marketing & distribution','Released'][Math.max(0,Math.min(6,Math.floor(n(project.stage))))] || 'In progress';
      return '<button type="button" class="today-project-row" data-today-go="projects"><span><b>'+esc(project.title || project.name || 'Untitled production')+'</b><small>'+esc(project.genre || project.format || 'Production')+'</small></span><em>'+esc(stage)+'</em></button>';
    }).join('');
    const eventRows = events.map(event => {
      const label = typeof event === 'string' ? event : (event.description || event.title || event.message || event.type || 'Recorded campaign event');
      const eventDate = typeof event === 'object' ? (event.date || '') : '';
      return '<li><span class="today-event-dot"></span><span><b>'+esc(label)+'</b>'+(eventDate?'<small>'+esc(eventDate)+'</small>':'')+'</span></li>';
    }).join('');
    const clock = a.clock || a.worldClock || {};
    const clockState = clock.frozen ? 'FROZEN' : clock.running === true ? 'RUNNING' : 'PAUSED';
    root.innerHTML =
      '<div class="today-heading"><div><div class="eyebrow">COMMAND / DAILY BRIEFING</div><h2>'+esc(company.name || 'Your studio')+'</h2><p>'+esc(date)+' · Simulation day '+esc(day)+'</p></div><span class="today-live-state '+clockState.toLowerCase()+'">'+clockState+'</span></div>'+
      '<div class="today-context"><div><small>YOUR LOCATION</small><b>'+esc(location)+'</b></div><div><small>HEADQUARTERS</small><b>'+esc(hq)+'</b></div><div><small>CAMPAIGN</small><b>'+esc(a.name || company.name || 'Active world')+'</b></div></div>'+
      '<div class="today-columns"><section class="today-panel today-focus"><div class="today-panel-head"><div><div class="eyebrow">THE OPERATING PICTURE</div><h3>At a glance</h3></div><span>LIVE CAMPAIGN RECORDS</span></div><div class="today-metrics">'+
      '<button type="button" data-today-go="finance"><small>Company cash</small><b>'+money(company.cash)+'</b><em>Open finance ↗</em></button>'+
      '<button type="button" data-today-go="projects"><small>Productions</small><b>'+projects.length+'</b><em>View slate ↗</em></button>'+
      '<button type="button" data-today-go="people"><small>Active employees</small><b>'+employees.length+'</b><em>View workforce ↗</em></button>'+
      '</div><div class="today-panel-head today-subhead"><div><div class="eyebrow">CURRENT PORTFOLIO</div><h3>Production slate</h3></div><button type="button" class="today-text-action" data-today-go="projects">Open productions ↗</button></div>'+
      (projectRows || '<p class="today-empty">No productions have been created in this campaign yet.</p>')+
      '</section><aside class="today-side"><section class="today-panel"><div class="today-panel-head"><div><div class="eyebrow">CAMPAIGN CHRONICLE</div><h3>Recent activity</h3></div><button type="button" class="today-text-action" data-today-go="calendar">Full history ↗</button></div>'+
      (eventRows ? '<ul class="today-event-list">'+eventRows+'</ul>' : '<p class="today-empty">Campaign events will appear here as your world develops.</p>')+
      '</section><section class="today-panel today-actions"><div class="eyebrow">QUICK ACCESS</div><h3>Where to next?</h3><div class="today-action-grid"><button data-today-go="personal">♡ <span>Personal life</span></button><button data-today-go="geography">◎ <span>Explore world</span></button><button data-today-go="interactions">◌ <span>Conversations</span></button><button data-today-go="market">⌁ <span>Industry</span></button></div></section></aside></div>';
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-today-go]');
    if (button) go(button.dataset.todayGo);
  });
  const originalRender = window.render;\n  if (typeof originalRender === 'function' && !originalRender.__todayRefresh) {\n    const wrappedRender = function() { const result = originalRender.apply(this, arguments); render(); return result; };\n    wrappedRender.__todayRefresh = true;\n    window.render = wrappedRender;\n  }\n  const originalNav = window.nav;
  if (typeof originalNav === 'function' && !originalNav.__todayRefresh) {
    const wrapped = function(route) { const result = originalNav.apply(this, arguments); if (route === 'overview') render(); return result; };
    wrapped.__todayRefresh = true;
    window.nav = wrapped;
  }
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
  window.StudioToday = {render};
  const observer = new MutationObserver(() => { if ($('#page-overview')?.classList.contains('active')) render(); });
  const overview = $('#page-overview');
  if (overview) observer.observe(overview,{childList:true,subtree:true});
})();