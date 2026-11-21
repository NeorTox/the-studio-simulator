/* THE STUDIO — StudioOS phone presentation layer.
 * Presentation only: keeps Phase 7 campaign data, actions and save schema unchanged.
 */
(function () {
  'use strict';

  const core = window.Phase7Smartphone;
  if (!core) {
    console.warn('[StudioOS] Phase 7 smartphone engine was not found.');
    return;
  }

  const $ = (selector, root) => (root || document).querySelector(selector);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
  const APPS = [
    { id: 'weather', label: 'Weather', glyph: '☀', tone: 'weather', detail: 'Regional forecast' },
    { id: 'news', label: 'CineWire', glyph: 'N', tone: 'news', detail: 'Industry headlines' },
    { id: 'social', label: 'StudioSphere', glyph: '◎', tone: 'social', detail: 'Social network', platform: 'studiosphere' },
    { id: 'reels', label: 'ReelLoop', glyph: '▶', tone: 'reels', detail: 'Short video', platform: 'reelloop' },
    { id: 'creator', label: 'CreatorHub', glyph: '✦', tone: 'creator', detail: 'Creator studio', platform: 'creatorhub' },
    { id: 'games', label: 'PlayGrid', glyph: '▣', tone: 'games', detail: 'Mobile games', platform: 'playgrid' },
    { id: 'store', label: 'App Store', glyph: 'A', tone: 'store', detail: 'Install applications' },
    { id: 'device', label: 'Device', glyph: '▤', tone: 'device', detail: 'Battery and data' },
    { id: 'notifications', label: 'Alerts', glyph: '●', tone: 'alerts', detail: 'Notifications' },
    { id: 'settings', label: 'Settings', glyph: '⚙', tone: 'settings', detail: 'StudioOS preferences' },
    { id: 'calendar', label: 'Calendar', glyph: '▦', tone: 'calendar', detail: 'Simulation dates' }
  ];

  let selectedApp = 'home';
  let currentPage = null;

  function campaign() {
    try { return typeof active !== 'undefined' ? active : null; }
    catch (_) { return null; }
  }

  function state() {
    try { return core.ensure(); }
    catch (error) {
      console.error('[StudioOS] Could not read smartphone state:', error);
      return null;
    }
  }

  function campaignDate(s) {
    const c = campaign();
    return (c && c.date) || (s && s.lastProcessedDate) || '';
  }

  function dateAdd(date, amount) {
    const stamp = Date.parse(String(date) + 'T00:00:00Z');
    if (!Number.isFinite(stamp)) return String(date || '');
    return new Date(stamp + amount * 86400000).toISOString().slice(0, 10);
  }

  function dateLabel(date, options) {
    const stamp = Date.parse(String(date) + 'T00:00:00Z');
    if (!Number.isFinite(stamp)) return 'No campaign date';
    return new Intl.DateTimeFormat('en', options || { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(stamp));
  }

  function simulationTime() {
    const c = campaign();
    const clock = c && c.worldClock;
    if (!clock) return '--:--';
    const duration = Math.max(1, Number(clock.dayDurationMs) || 180000);
    const elapsed = Math.max(0, Number(clock.accumulatorMs) || 0);
    const minutes = Math.floor((elapsed / duration) * 1440) % 1440;
    return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  }

  function weatherForecast() {
    const c = campaign();
    const phase = window.StudioPhase0 && window.StudioPhase0.phase1;
    if (!c || !phase || typeof phase.weatherFor !== 'function') return null;
    try {
      const world = typeof phase.ensureWorld === 'function' ? phase.ensureWorld() : null;
      const focus = world && world.geography && world.geography.focusRegion;
      const region = (typeof phase.regionFor === 'function' && phase.regionFor(focus || 'REG-3')) ||
        (phase.regions && phase.regions[0]);
      if (!region) return null;
      const seed = Number(c.worldSeed || (c.market && c.market.seed) || 0);
      const days = [];
      for (let offset = 0; offset < 7; offset++) {
        const date = dateAdd(c.date, offset);
        days.push(phase.weatherFor(date, region.id || region.name, seed));
      }
      return { region: region.name || 'Simulation region', days: days };
    } catch (error) {
      console.warn('[StudioOS] Forecast unavailable:', error);
      return null;
    }
  }

  function unreadCount(s) {
    return (s.notifications || []).filter(item => !item.read).length;
  }

  function installed(s, id) {
    const item = (s.platforms || []).find(platform => platform.id === id);
    return !!(item && item.installed);
  }

  function appById(id) {
    return APPS.find(app => app.id === id) || { id: id, label: id, glyph: '•', tone: 'device', detail: '' };
  }

  function appTile(app, s) {
    const isInstalled = !app.platform || installed(s, app.platform);
    const label = app.platform ? ((s.platforms || []).find(p => p.id === app.platform) || {}).name || app.label : app.label;
    const badge = app.id === 'notifications' && unreadCount(s) ? '<i class="stph-app-badge">' + unreadCount(s) + '</i>' : '';
    return '<button type="button" class="stph-app-tile" data-stph-action="open-app" data-app="' + esc(app.id) + '" aria-label="Open ' + esc(label) + '">' +
      '<span class="stph-app-icon ' + esc(app.tone) + '">' + badge + '<b>' + esc(app.glyph) + '</b></span>' +
      '<span class="stph-app-name">' + esc(label) + '</span>' +
      '<span class="stph-app-state">' + (app.platform && !isInstalled ? 'Not installed' : esc(app.detail)) + '</span>' +
      '</button>';
  }

  function renderHome(s) {
    const forecast = weatherForecast();
    const today = forecast && forecast.days[0];
    const date = campaignDate(s);
    const trends = (s.trends || []).slice(0, 3);
    const headlines = (s.news && s.news.articles ? s.news.articles : []).slice(0, 2);
    const apps = APPS.map(app => appTile(app, s)).join('');
    return '<div class="stph-home">' +
      '<section class="stph-home-feature">' +
        '<div class="stph-greeting"><span class="stph-kicker">STUDIO ONE · STUDIOOS</span><span class="stph-live">● CAMPAIGN LIVE</span></div>' +
        '<div class="stph-clock">' + esc(simulationTime()) + '</div>' +
        '<div class="stph-date">' + esc(dateLabel(date)) + '</div>' +
        '<div class="stph-weather-card">' +
          '<div><span class="stph-mini-label">LOCAL SIMULATION WEATHER</span><strong>' + (today ? esc(today.condition) : 'Forecast unavailable') + '</strong><small>' + (today ? esc(forecast.region) + ' · ' + today.temperatureC.toFixed(1) + '°C' : 'World climate system not ready') + '</small></div>' +
          '<div class="stph-weather-symbol">' + (today ? (today.precipitationProbability > 55 ? '☂' : today.cloudCover > 60 ? '☁' : '☀') : '◌') + '</div>' +
        '</div>' +
        '<div class="stph-home-news">' +
          '<span class="stph-mini-label">YOUR DAILY BRIEFING</span>' +
          (headlines.length ? headlines.map(item => '<div class="stph-briefing-item"><b>' + esc(item.title) + '</b><small>' + esc(item.outletName || 'Studio newswire') + '</small></div>').join('') : '<div class="stph-briefing-empty">New industry stories appear as your campaign progresses.</div>') +
        '</div>' +
        '<div class="stph-home-foot"><span>' + (s.metrics && Number(s.metrics.activeUsers) ? Number(s.metrics.activeUsers).toLocaleString() + ' daily digital users' : 'Your digital world is warming up') + '</span><span>' + unreadCount(s) + ' unread alerts</span></div>' +
      '</section>' +
      '<section class="stph-home-apps"><div class="stph-apps-heading"><b>Applications</b><span>YOUR DEVICE</span></div><div class="stph-app-grid">' + apps + '</div></section>' +
    '</div>';
  }

  function appHeader(id) {
    const app = appById(id);
    return '<div class="stph-app-header"><button type="button" class="stph-back" data-stph-action="home" aria-label="Back to home">‹</button>' +
      '<div><span class="stph-kicker">STUDIOOS APPLICATION</span><h2>' + esc(app.label) + '</h2></div>' +
      '<button type="button" class="stph-home-button" data-stph-action="home">HOME</button></div>';
  }

  function lockedApp(id) {
    const app = appById(id);
    const platform = (state().platforms || []).find(p => p.id === app.platform);
    return '<div class="stph-empty-state"><span class="stph-empty-icon">' + esc(app.glyph) + '</span><h3>' + esc(platform ? platform.name : app.label) + ' is not installed</h3>' +
      '<p>Install this application from the StudioOS App Store to use it on this device.</p>' +
      '<button type="button" class="stph-primary-button" data-stph-action="open-app" data-app="store">Open App Store</button></div>';
  }

  function renderWeather(s) {
    const forecast = weatherForecast();
    if (!forecast) return '<div class="stph-empty-state"><span class="stph-empty-icon">☀</span><h3>Weather system unavailable</h3><p>The campaign climate engine has not initialized yet.</p></div>';
    const today = forecast.days[0];
    return '<div class="stph-weather-summary"><div><span class="stph-mini-label">' + esc(forecast.region) + ' · SIMULATED CLIMATE</span><strong>' + esc(today.condition) + '</strong><span>' + today.temperatureC.toFixed(1) + '°C</span><small>Rain ' + today.precipitationProbability.toFixed(0) + '% · Wind ' + today.windKph.toFixed(0) + ' km/h · Humidity ' + today.humidity.toFixed(0) + '%</small></div><div class="stph-weather-symbol large">' + (today.precipitationProbability > 55 ? '☂' : today.cloudCover > 60 ? '☁' : '☀') + '</div></div>' +
      '<div class="stph-section-heading"><b>7-day forecast</b><span>CAMPAIGN CALENDAR</span></div><div class="stph-forecast-grid">' +
      forecast.days.map((day, index) => '<article class="stph-forecast-day"><span>' + (index === 0 ? 'TODAY' : esc(dateLabel(day.date, { weekday: 'short', timeZone: 'UTC' }).toUpperCase())) + '</span><b>' + (day.precipitationProbability > 55 ? '☂' : day.cloudCover > 60 ? '☁' : '☀') + '</b><strong>' + day.temperatureC.toFixed(0) + '°</strong><small>' + esc(day.condition) + '</small><i>Rain ' + day.precipitationProbability.toFixed(0) + '%</i></article>').join('') +
      '</div><p class="stph-footnote">Weather is generated by the campaign's deterministic climate model. It is not a live real-world forecast.</p>';
  }

  function renderNews(s) {
    const news = s.news || { articles: [], outlets: [] };
    const articles = (news.articles || []).slice(0, 12);
    if (!articles.length) return '<div class="stph-empty-state"><span class="stph-empty-icon">N</span><h3>No headlines yet</h3><p>Industry coverage and studio news appear as the simulated world progresses.</p></div>';
    return '<div class="stph-section-heading"><b>Latest headlines</b><span>' + (news.outlets || []).length + ' NEWSROOMS</span></div><div class="stph-news-list">' +
      articles.map(item => '<article class="stph-news-card ' + (item.read ? 'is-read' : '') + '"><div class="stph-news-meta"><span>' + esc(item.outletName || 'Industry newswire') + '</span><span>' + esc(item.created || '') + '</span></div><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p><div class="stph-news-footer"><span>Credibility ' + esc(item.credibility == null ? '—' : item.credibility + '/100') + '</span>' +
        '<button type="button" class="stph-text-button" data-stph-action="read-news" data-id="' + esc(item.id) + '">' + (item.read ? 'Read' : 'Mark read') + '</button></div></article>').join('') +
      '</div>';
  }

  function renderSocial(s, appId) {
    const platformId = appId === 'reels' ? 'reelloop' : 'studiosphere';
    if (!installed(s, platformId)) return lockedApp(appId);
    const date = campaignDate(s);
    const feed = (s.feed || []).filter(item => item.status !== 'Hidden' && item.status !== 'Removed' && (appId !== 'reels' || item.platformId === 'reelloop'));
    feed.sort((a, b) => {
      const rankA = typeof core.rank === 'function' ? core.rank(a, s.preferences || {}, date) : Number(a.likes || 0);
      const rankB = typeof core.rank === 'function' ? core.rank(b, s.preferences || {}, date) : Number(b.likes || 0);
      return rankB - rankA;
    });
    return '<div class="stph-social-toolbar"><div><span class="stph-kicker">PERSONALIZED FOR YOU</span><h3>' + (appId === 'reels' ? 'Fresh clips and creator posts' : 'Your entertainment community') + '</h3></div><span class="stph-live">● FEED ACTIVE</span></div>' +
      (feed.length ? '<div class="stph-post-list">' + feed.slice(0, 8).map(item => {
        const isFollowing = (s.following || []).includes(item.creatorId);
        return '<article class="stph-post"><div class="stph-post-top"><span class="stph-post-avatar">' + esc(String(item.creatorName || item.source || 'S').slice(0, 1).toUpperCase()) + '</span><div><b>' + esc(item.creatorName || item.source || 'Studio community') + '</b><small>' + esc(item.handle ? '@' + item.handle : item.created || '') + ' · ' + esc(item.category || 'Entertainment') + '</small></div>' +
          (item.creatorId ? '<button type="button" class="stph-text-button" data-stph-action="follow" data-id="' + esc(item.creatorId) + '">' + (isFollowing ? 'Following' : 'Follow') + '</button>' : '') + '</div>' +
          '<p>' + esc(item.text || item.title || '') + '</p><div class="stph-post-stats"><span>♥ ' + Number(item.likes || 0).toLocaleString() + '</span><span>Comments ' + Number(item.comments || 0).toLocaleString() + '</span><span>' + Number(item.impressions || 0).toLocaleString() + ' views</span></div>' +
          '<div class="stph-post-actions"><button type="button" class="stph-text-button" data-stph-action="like" data-id="' + esc(item.id) + '">♡ Like</button><span>SHARE · COMMUNITY</span></div>' +
          '<form class="stph-comment-form" data-stph-comment data-id="' + esc(item.id) + '"><input name="comment" maxlength="300" placeholder="Write a comment…" aria-label="Write a comment"><button type="submit" aria-label="Send comment">↗</button></form></article>';
      }).join('') + '</div>' : '<div class="stph-empty-state compact"><h3>Your feed is quiet</h3><p>Advance the campaign to generate new posts, trends and community activity.</p></div>');
  }

  function renderStore(s) {
    return '<div class="stph-section-heading"><b>StudioOS App Store</b><span>' + (s.platforms || []).length + ' APPLICATIONS</span></div><div class="stph-store-list">' +
      (s.platforms || []).map(item => '<article class="stph-store-item"><span class="stph-store-icon">' + esc(String(item.name || 'A').slice(0, 1)) + '</span><div><b>' + esc(item.name) + '</b><small>' + esc(item.category) + ' · ' + (item.installed ? Number(item.storageMb || 0).toLocaleString() + ' MB' : 'Available to install') + '</small></div>' +
        '<button type="button" class="stph-small-button" data-stph-action="toggle-app" data-id="' + esc(item.id) + '">' + (item.installed ? 'Remove' : 'Install') + '</button></article>').join('') +
      '</div><p class="stph-footnote">App installation changes device storage and is saved with the active campaign.</p>';
  }

  function renderGames(s) {
    const games = s.games || { catalog: [], installed: [], totalPlayMinutes: 0 };
    return '<div class="stph-section-heading"><b>PlayGrid library</b><span>' + (games.installed || []).length + ' INSTALLED</span></div><div class="stph-game-list">' +
      (games.catalog || []).map(game => {
        const hasGame = (games.installed || []).includes(game.id);
        const compatible = Number(s.device.performance || 0) >= Number(game.minPerformance || 0);
        return '<article class="stph-game-item"><div class="stph-game-art">' + esc(String(game.name || 'G').slice(0, 1)) + '</div><div class="stph-game-copy"><b>' + esc(game.name) + '</b><small>' + esc(game.genre) + ' · ' + (Number(game.sizeMb || 0) / 1000).toFixed(1) + ' GB · Performance ' + Number(game.minPerformance || 0) + '+</small><span>' + (compatible ? 'Compatible with this device' : 'Requires a more powerful phone') + '</span></div>' +
          '<button type="button" class="stph-small-button" ' + (!compatible ? 'disabled' : '') + ' data-stph-action="' + (hasGame ? 'play-game' : 'install-game') + '" data-id="' + esc(game.id) + '">' + (hasGame ? 'Play 30m' : (Number(game.price || 0) === 0 ? 'Install free' : 'Buy · ' + Number(game.price).toFixed(2))) + '</button></article>';
      }).join('') + '</div><div class="stph-game-summary">Total playtime <b>' + Math.floor(Number(games.totalPlayMinutes || 0) / 60) + 'h ' + (Number(games.totalPlayMinutes || 0) % 60) + 'm</b></div>';
  }

  function renderCreators(s) {
    const creators = s.creators || [];
    const installedPlatforms = (s.platforms || []).filter(item => item.installed);
    return '<div class="stph-creator-layout"><section class="stph-panel-card"><div class="stph-section-heading"><b>Your creators</b><span>' + creators.length + ' PROFILES</span></div>' +
      (creators.length ? creators.map(c => '<div class="stph-creator-row"><span class="stph-creator-avatar">' + esc(String(c.name || 'C').slice(0, 1).toUpperCase()) + '</span><div><b>' + esc(c.name) + '</b><small>@' + esc(c.handle) + ' · ' + esc(c.category) + '</small></div><strong>' + Number(c.followers || 0).toLocaleString() + '<small>followers</small></strong></div>').join('') : '<p class="stph-muted">Create a creator identity to publish to your installed platforms.</p>') +
      '<form class="stph-form" data-stph-form="create-creator"><b>Create creator profile</b><label>Display name<input name="name" required minlength="2" maxlength="60" placeholder="Creator name"></label><label>Unique handle<input name="handle" required pattern="[A-Za-z0-9_.]{3,24}" placeholder="studio_creator"></label><label>Category<select name="category"><option>Film</option><option>Television</option><option>Animation</option><option>Games</option><option>Music</option><option>Entertainment</option></select></label><button type="submit" class="stph-primary-button">Create profile</button></form></section>' +
      '<section class="stph-panel-card"><div class="stph-section-heading"><b>Publish a post</b><span>CREATOR STUDIO</span></div>' +
      (creators.length && installedPlatforms.length ? '<form class="stph-form" data-stph-form="publish-post"><label>Creator<select name="creatorId">' + creators.map(c => '<option value="' + esc(c.id) + '">' + esc(c.name) + ' · @' + esc(c.handle) + '</option>').join('') + '</select></label><label>Platform<select name="platformId">' + installedPlatforms.map(p => '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>').join('') + '</select></label><label>Post<textarea name="text" required minlength="8" maxlength="1200" placeholder="Share an update with your audience…"></textarea></label><label>Audience<select name="audience"><option>Global general audience</option><option>Genre fans</option><option>Animation fans</option><option>Gamers</option><option>Music listeners</option></select></label><button type="submit" class="stph-primary-button">Publish post</button></form>' : '<p class="stph-muted">Create a creator profile and install at least one social application before publishing.</p>') +
      '</section></div>';
  }

  function renderDevice(s) {
    const device = s.device || {};
    const carriers = (s.telecom && s.telecom.carriers) || [];
    const usageGb = Number(s.telecom && s.telecom.usageMb || 0) / 1024;
    const currentPlan = s.telecom && s.telecom.activePlan;
    const options = carriers.map(carrier => (carrier.plans || []).map(plan =>
      '<option value="' + esc(carrier.id + '|' + plan.id) + '" ' + (currentPlan && currentPlan.planId === plan.id ? 'selected' : '') + '>' +
      esc(carrier.name + ' · ' + plan.name + ' · ' + plan.dataGb + ' GB · ' + Number(plan.monthly).toFixed(2) + '/mo') + '</option>'
    ).join('')).join('');
    const bills = (s.telecom && s.telecom.bills) || [];
    const battery = Math.max(0, Math.min(100, Number(device.batteryPercent || 0)));
    const storage = Number(device.usedMb || 0);
    const capacity = Math.max(1, Number(device.storageMb || 1));
    const model = String(device.model || 'Studio One').replace(/-/g, ' ');
    return '<div class="stph-device-grid"><section class="stph-panel-card"><div class="stph-section-heading"><b>Device health</b><span>' + esc(model.toUpperCase()) + '</span></div>' +
      '<div class="stph-meter-block"><div><span>Battery</span><b>' + battery.toFixed(1) + '%</b></div><div class="stph-meter"><i style="width:' + battery + '%"></i></div></div>' +
      '<div class="stph-meter-block"><div><span>Storage</span><b>' + (storage / 1024).toFixed(1) + ' / ' + (capacity / 1024).toFixed(0) + ' GB</b></div><div class="stph-meter"><i style="width:' + Math.min(100, storage / capacity * 100) + '%"></i></div></div>' +
      '<div class="stph-device-specs"><div><small>PERFORMANCE</small><b>' + Number(device.performance || 0) + '/100</b></div><div><small>BATTERY CAPACITY</small><b>' + Number(device.batteryCapacityMah || 0).toLocaleString() + ' mAh</b></div><div><small>INSTALLED APPS</small><b>' + (s.platforms || []).filter(p => p.installed).length + '</b></div></div>' +
      '<button type="button" class="stph-primary-button" data-stph-action="charge">Charge for 30 minutes</button></section>' +
      '<section class="stph-panel-card"><div class="stph-section-heading"><b>Mobile network</b><span>' + (s.telecom && s.telecom.serviceActive ? 'SERVICE ACTIVE' : 'NO ACTIVE PLAN') + '</span></div>' +
      '<div class="stph-device-specs"><div><small>DATA USED</small><b>' + usageGb.toFixed(2) + ' GB</b></div><div><small>CYCLE START</small><b>' + esc(s.telecom && s.telecom.cycleStart || '—') + '</b></div></div>' +
      '<form class="stph-form" data-stph-form="data-plan"><label>Carrier and data plan<select name="plan" required>' + options + '</select></label><button type="submit" class="stph-primary-button">Activate selected plan</button></form>' +
      '<div class="stph-bill-list"><b>Recent bills</b>' + (bills.length ? bills.slice(0, 4).map(b => '<div class="stph-bill-row"><span>' + esc(b.description || 'Mobile service') + '<small>' + esc(b.dueDate || '') + ' · ' + esc(b.status || '') + '</small></span><b>' + Number(b.amount || 0).toFixed(2) + '</b>' + (b.status === 'Unpaid' ? '<button type="button" data-stph-action="pay-bill" data-id="' + esc(b.id) + '">Pay</button>' : '') + '</div>').join('') : '<p class="stph-muted">No bills have been generated yet.</p>') + '</div></section></div>';
  }

  function renderNotifications(s) {
    const items = (s.notifications || []).slice(0, 18);
    if (!items.length) return '<div class="stph-empty-state"><span class="stph-empty-icon">●</span><h3>You are all caught up</h3><p>New updates from your digital world will appear here.</p></div>';
    return '<div class="stph-section-heading"><b>Notification centre</b><span>' + unreadCount(s) + ' UNREAD</span></div><div class="stph-notice-list">' +
      items.map(item => '<article class="stph-notice ' + (item.read ? 'is-read' : '') + '"><span class="stph-notice-dot"></span><div><b>' + esc(item.title || 'Studio notification') + '</b><p>' + esc(item.body || '') + '</p><small>' + esc(item.date || '') + '</small></div>' +
        (!item.read ? '<button type="button" class="stph-text-button" data-stph-action="read-notice" data-id="' + esc(item.id) + '">Mark read</button>' : '<span class="stph-read-label">READ</span>') + '</article>').join('') + '</div>';
  }

  function renderSettings(s) {
    const prefs = s.preferences || {};
    return '<section class="stph-panel-card stph-settings-panel"><div class="stph-section-heading"><b>Personalization</b><span>YOUR STUDIOOS</span></div>' +
      '<form class="stph-form" data-stph-form="settings"><label>Interests, separated by commas<input name="interests" value="' + esc((prefs.interests || []).join(', ')) + '" placeholder="Film, Animation, Games"></label>' +
      '<label>Region<input name="region" value="' + esc(prefs.region || 'Global') + '" placeholder="Global"></label>' +
      '<label>Language<input name="language" value="' + esc(prefs.language || 'English') + '" placeholder="English"></label>' +
      '<label class="stph-check"><input type="checkbox" name="personalization" ' + (prefs.personalization !== false ? 'checked' : '') + '> Personalized recommendations</label>' +
      '<label class="stph-check"><input type="checkbox" name="safeMode" ' + (prefs.safeMode !== false ? 'checked' : '') + '> Safe content mode</label>' +
      '<button type="submit" class="stph-primary-button">Save preferences</button></form></section>';
  }

  function renderCalendar(s) {
    const date = campaignDate(s);
    return '<div class="stph-section-heading"><b>Campaign calendar</b><span>WORLD SIMULATION</span></div><div class="stph-calendar-grid">' +
      Array.from({ length: 7 }, (_, index) => {
        const day = dateAdd(date, index);
        return '<article><span>' + (index === 0 ? 'TODAY' : esc(dateLabel(day, { weekday: 'short', timeZone: 'UTC' }).toUpperCase())) + '</span><b>' + esc(dateLabel(day, { day: 'numeric', timeZone: 'UTC' })) + '</b><small>' + esc(dateLabel(day, { month: 'short', year: 'numeric', timeZone: 'UTC' })) + '</small></article>';
      }).join('') + '</div><p class="stph-footnote">This is the phone's date strip. Use the main Calendar workspace to manage production schedules and company events.</p>';
  }

  function renderAppBody(s, id) {
    if (id === 'weather') return renderWeather(s);
    if (id === 'news') return renderNews(s);
    if (id === 'social' || id === 'reels') return renderSocial(s, id);
    if (id === 'store') return renderStore(s);
    if (id === 'games') return installed(s, 'playgrid') ? renderGames(s) : lockedApp('games');
    if (id === 'creator') return installed(s, 'creatorhub') ? renderCreators(s) : lockedApp('creator');
    if (id === 'device') return renderDevice(s);
    if (id === 'notifications') return renderNotifications(s);
    if (id === 'settings') return renderSettings(s);
    if (id === 'calendar') return renderCalendar(s);
    return '<div class="stph-empty-state"><h3>Application unavailable</h3><p>This StudioOS application is not part of the current device build.</p></div>';
  }

  function renderConsole(s) {
    const device = s.device || {};
    const battery = Math.max(0, Math.min(100, Number(device.batteryPercent || 0)));
    const capacity = Math.max(1, Number(device.storageMb || 1));
    const storage = Number(device.usedMb || 0);
    const forecast = weatherForecast();
    const headline = s.news && s.news.articles && s.news.articles[0];
    const recent = (s.history || []).slice(0, 3);
    return '<aside class="stph-console">' +
      '<section class="stph-console-card stph-device-overview"><div class="stph-console-heading"><span>DEVICE OVERVIEW</span><b>STUDIO ONE</b></div>' +
        '<div class="stph-console-model">' + esc(String(device.model || 'Studio One').replace(/-/g, ' ')) + '<small>StudioOS 1.0 · ' + Number(device.performance || 0) + ' performance</small></div>' +
        '<div class="stph-meter-block"><div><span>Battery</span><b>' + battery.toFixed(1) + '%</b></div><div class="stph-meter"><i style="width:' + battery + '%"></i></div></div>' +
        '<div class="stph-meter-block"><div><span>Storage</span><b>' + (storage / 1024).toFixed(1) + ' / ' + (capacity / 1024).toFixed(0) + ' GB</b></div><div class="stph-meter"><i style="width:' + Math.min(100, storage / capacity * 100) + '%"></i></div></div>' +
        '<div class="stph-console-stats"><span><b>' + Number(s.metrics && s.metrics.activeUsers || 0).toLocaleString() + '</b>Daily users</span><span><b>' + Number(s.metrics && s.metrics.impressions || 0).toLocaleString() + '</b>Impressions</span></div>' +
      '</section>' +
      '<section class="stph-console-card"><div class="stph-console-heading"><span>QUICK ACCESS</span><b>OPEN AN APP</b></div><div class="stph-quick-grid">' +
        ['weather', 'news', 'social', 'store', 'device', 'notifications'].map(id => '<button type="button" data-stph-action="open-app" data-app="' + id + '">' + esc(appById(id).glyph) + '<span>' + esc(appById(id).label) + '</span></button>').join('') +
      '</div></section>' +
      '<section class="stph-console-card"><div class="stph-console-heading"><span>WORLD PULSE</span><b>' + (forecast ? esc(forecast.region) : 'CAMPAIGN') + '</b></div>' +
        (forecast ? '<div class="stph-pulse-weather"><strong>' + esc(forecast.days[0].condition) + '</strong><b>' + forecast.days[0].temperatureC.toFixed(1) + '°C</b><small>Rain ' + forecast.days[0].precipitationProbability.toFixed(0) + '% · Wind ' + forecast.days[0].windKph.toFixed(0) + ' km/h</small></div>' : '<p class="stph-muted">World climate information will appear here when available.</p>') +
        (headline ? '<div class="stph-console-headline"><small>LATEST STORY</small><b>' + esc(headline.title) + '</b></div>' : '') +
      '</section>' +
      '<section class="stph-console-card"><div class="stph-console-heading"><span>RECENT DEVICE ACTIVITY</span><b>' + recent.length + ' EVENTS</b></div>' +
        (recent.length ? recent.map(item => '<div class="stph-activity-row"><span>' + esc(item.action) + '</span><small>' + esc(item.detail) + '</small></div>').join('') : '<p class="stph-muted">Your device activity will appear here.</p>') +
      '</section>' +
    '</aside>';
  }

  function render() {
    const page = $('#page-phone');
    if (!page || !page.classList.contains('active')) return;
    const s = state();
    if (!s) {
      page.innerHTML = '<div class="empty">Create or load a campaign to initialize StudioOS.</div>';
      return;
    }
    currentPage = page;
    const date = campaignDate(s);
    const isHome = selectedApp === 'home';
    const screen = isHome ? renderHome(s) : appHeader(selectedApp) + '<div class="stph-app-content">' + renderAppBody(s, selectedApp) + '</div>';
    page.innerHTML = '<div class="stph-page-intro"><div><span class="eyebrow">STUDIO ONE · STUDIOOS</span><h1 class="h1">Your phone</h1><p class="sub">A connected device inside your living entertainment world.</p></div><div class="stph-page-meta"><span>' + esc(dateLabel(date)) + '</span><span>' + esc(simulationTime()) + ' SIM TIME</span></div></div>' +
      '<div class="stph-stage" id="studio-phone-shell">' +
        '<section class="stph-device" aria-label="Studio One smartphone"><div class="stph-device-camera"><i></i><b></b></div><div class="stph-screen">' +
          '<div class="stph-statusbar"><span>' + esc(simulationTime()) + ' · ' + esc(dateLabel(date, { day: 'numeric', month: 'short', timeZone: 'UTC' })) + '</span><span class="stph-status-center">STUDIOOS 1.0</span><span><b>5G</b> <span class="stph-signal">▂▅▇</span> <span class="stph-battery-icon"><i style="width:' + Math.round(Number(s.device.batteryPercent || 0)) + '%"></i></span> ' + Number(s.device.batteryPercent || 0).toFixed(0) + '%</span></div>' +
          '<div class="stph-screen-main">' + screen + '</div><div class="stph-gesture"><i></i></div>' +
        '</div></section>' + renderConsole(s) +
      '</div>';
    const root = $('#studio-phone-shell', page);
    if (root) {
      root.addEventListener('click', handleClick);
      root.addEventListener('submit', handleSubmit);
    }
  }

  function persistSafely() {
    try { if (typeof persist === 'function') persist(); }
    catch (error) { console.warn('[StudioOS] Save request failed:', error); }
  }

  function announce(message) {
    const existing = $('.stph-toast');
    if (existing) existing.remove();
    const node = document.createElement('div');
    node.className = 'stph-toast';
    node.textContent = String(message);
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 2400);
  }

  function handleClick(event) {
    const button = event.target.closest('[data-stph-action]');
    if (!button) return;
    const action = button.dataset.stphAction;
    const id = button.dataset.id;
    const s = state();
    try {
      if (action === 'home') selectedApp = 'home';
      else if (action === 'open-app') selectedApp = button.dataset.app || 'home';
      else if (action === 'toggle-app') {
        const item = (s.platforms || []).find(p => p.id === id);
        if (!item) throw new Error('Application not found.');
        const wasInstalled = !!item.installed;
        if (wasInstalled) core.uninstallApp(id);
        else core.installApp(id);
        announce(wasInstalled ? 'Application removed.' : 'Application installed.');
      } else if (action === 'read-news') {
        if (typeof core.markNewsRead === 'function') core.markNewsRead(id);
      } else if (action === 'read-notice') {
        const item = (s.notifications || []).find(n => n.id === id);
        if (item) { item.read = true; persistSafely(); }
      } else if (action === 'like') {
        core.reactToPost(id);
        announce('Reaction updated.');
      } else if (action === 'follow') {
        const following = core.followCreator(id);
        announce(following ? 'Creator followed.' : 'Creator unfollowed.');
      } else if (action === 'charge') {
        const result = core.chargePhone(30);
        announce('Battery charged by ' + result.gained.toFixed(1) + '%.');
        selectedApp = 'device';
      } else if (action === 'install-game') {
        core.installGame(id);
        announce('Game installed.');
      } else if (action === 'play-game') {
        const result = core.playGame(id, 30);
        announce('Played for 30 minutes · battery ' + result.battery.toFixed(1) + '%.');
      } else if (action === 'pay-bill') {
        if (typeof core.payMobileBill !== 'function') throw new Error('Billing is unavailable.');
        core.payMobileBill(id);
        announce('Mobile bill paid.');
      }
    } catch (error) {
      announce(error && error.message ? error.message : 'The action could not be completed.');
    }
    render();
  }

  function handleSubmit(event) {
    const form = event.target.closest('[data-stph-form], [data-stph-comment]');
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const type = form.dataset.stphForm;
    const id = form.dataset.id;
    try {
      if (type === 'create-creator') {
        core.createCreator({ name: data.get('name'), handle: data.get('handle'), category: data.get('category') });
        announce('Creator profile created.');
      } else if (type === 'publish-post') {
        core.publishPost({
          creatorId: data.get('creatorId'),
          platformId: data.get('platformId'),
          text: data.get('text'),
          audience: data.get('audience')
        });
        announce('Post published.');
      } else if (form.hasAttribute('data-stph-comment')) {
        core.commentOnPost(id, data.get('comment'));
        announce('Comment published.');
      } else if (type === 'data-plan') {
        const selected = String(data.get('plan') || '').split('|');
        if (selected.length !== 2) throw new Error('Choose a valid data plan.');
        core.chooseDataPlan(selected[0], selected[1]);
        announce('Mobile plan activated.');
        selectedApp = 'device';
      } else if (type === 'settings') {
        const s = state();
        s.preferences.interests = String(data.get('interests') || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 20);
        s.preferences.region = String(data.get('region') || 'Global').trim() || 'Global';
        s.preferences.language = String(data.get('language') || 'English').trim() || 'English';
        s.preferences.personalization = data.get('personalization') === 'on';
        s.preferences.safeMode = data.get('safeMode') === 'on';
        persistSafely();
        announce('StudioOS preferences saved.');
      }
    } catch (error) {
      announce(error && error.message ? error.message : 'The request could not be completed.');
    }
    render();
  }

  function install() {
    const page = $('#page-phone');
    if (!page) return;
    page.classList.add('stph-phone-page');
    const priorNav = window.nav;
    if (typeof priorNav === 'function' && !priorNav.__studioPhoneWrapped) {
      const wrapped = function (route) {
        const result = priorNav.apply(this, arguments);
        if (route === 'phone') {
          selectedApp = 'home';
          render();
        }
        return result;
      };
      wrapped.__studioPhoneWrapped = true;
      window.nav = wrapped;
    }
    const priorRender = core.render;
    if (typeof priorRender === 'function' && !priorRender.__studioPhoneWrapped) {
      const wrapped = function () {
        const result = priorRender.apply(this, arguments);
        render();
        return result;
      };
      wrapped.__studioPhoneWrapped = true;
      core.render = wrapped;
    }
    if (page.classList.contains('active')) render();
    console.info('[StudioOS] Phone presentation mounted.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();