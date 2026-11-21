/* THE STUDIO — living-world activity bridge.
 * Presentation adapter only: reads existing campaign event records and never writes simulation state.
 */
(() => {
  'use strict';
  const escapeHTML = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
  const campaign = () => {
    try { return typeof active !== 'undefined' ? active : null; }
    catch (_) { return null; }
  };
  function collect() {
    const c = campaign();
    if (!c) return [];
    const world = c.world || {};
    const population = world.population || {};
    const items = [];
    (Array.isArray(world.events) ? world.events : []).forEach(event => {
      items.push({
        id: event.id || [event.date, event.title, event.region].join('|'),
        date: event.date || c.date,
        title: event.title || 'World event',
        detail: event.detail || '',
        category: event.category || 'World',
        location: event.region || 'Global',
        route: 'world'
      });
    });
    (Array.isArray(population.events) ? population.events : []).forEach(event => {
      items.push({
        id: event.id || [event.date, event.type, event.npcId, event.text].join('|'),
        date: event.date || c.date,
        title: event.text || 'A person made a decision',
        detail: '',
        category: event.type || 'People',
        location: '',
        npcId: event.npcId || null,
        route: 'people'
      });
    });
    (Array.isArray(c.events) ? c.events : []).forEach(event => {
      items.push({
        id: [event.date, event.text].join('|'),
        date: event.date || c.date,
        title: event.text || 'Studio activity',
        detail: '',
        category: 'Studio',
        location: '',
        route: 'studio'
      });
    });
    const seen = new Set();
    return items
      .filter(item => {
        const key = String(item.date) + '|' + String(item.title).trim().toLowerCase();
        if (!item.title || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 8);
  }
  function renderFeed() {
    const root = document.getElementById('activity');
    if (!root) return;
    const c = campaign();
    if (!c) {
      root.className = 'empty';
      root.textContent = 'Create a campaign to begin the simulation.';
      return;
    }
    const items = collect();
    root.className = items.length ? 'stui-world-feed' : 'empty';
    root.innerHTML = items.length ? items.map(item => {
      const action = item.npcId ? 'people' : item.route;
      const label = item.npcId ? 'Open person' : item.route === 'world' ? 'Open world' : item.route === 'studio' ? 'Open studio' : 'Open';
      return '<article class="stui-feed-item">' +
        '<div class="stui-feed-copy"><div class="stui-feed-meta"><span class="stui-feed-category">' + escapeHTML(item.category) + '</span>' +
        '<time>' + escapeHTML(item.date) + '</time></div><strong>' + escapeHTML(item.title) + '</strong>' +
        (item.detail ? '<p>' + escapeHTML(item.detail) + '</p>' : '') +
        (item.location ? '<small>' + escapeHTML(item.location) + '</small>' : '') + '</div>' +
        '<button class="btn stui-feed-open" type="button" data-feed-route="' + action + '"' +
        (item.npcId ? ' data-npc-id="' + escapeHTML(item.npcId) + '"' : '') + ' aria-label="' + label + '">' +
        (item.npcId ? 'Person ↗' : item.route === 'world' ? 'World ↗' : item.route === 'studio' ? 'Studio ↗' : 'Open ↗') +
        '</button></article>';
    }).join('') : 'No recorded activity yet. Advance the simulation to see what is happening.';
  }
  function install() {
    if (window.__studioWorldActivityBridgeInstalled) return;
    window.__studioWorldActivityBridgeInstalled = true;
    const originalRender = window.render;
    if (typeof originalRender === 'function') {
      window.render = function (...args) {
        const result = originalRender.apply(this, args);
        renderFeed();
        return result;
      };
    }
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-feed-route]');
      if (!button) return;
      const npcId = button.dataset.npcId;
      if (npcId && window.StudioPopulationEngine?.inspect) {
        window.StudioPopulationEngine.inspect(npcId);
        if (typeof window.nav === 'function') window.nav('peopleintelligence');
        return;
      }
      const route = button.dataset.feedRoute;
      if (typeof window.nav === 'function') window.nav(route === 'world' ? 'world' : route === 'studio' ? 'projects' : 'overview');
    });
    renderFeed();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
  window.StudioWorldActivity = { collect, render: renderFeed };
})();
