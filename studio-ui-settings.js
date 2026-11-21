(() => {
  'use strict';
  const NAV = '.nav';
  const CONTENT = '.content';
  const STORAGE_KEY = 'the-studio-ui-preferences-v1';
  const defaults = Object.freeze({density:'comfortable',fontScale:1,contrast:'standard',reduceMotion:false,showHints:true});
  const cloneDefaults = () => ({...defaults});
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || typeof value !== 'object') return cloneDefaults();
      return {
        density: value.density === 'compact' ? 'compact' : 'comfortable',
        fontScale: [0.9,1,1.1].includes(Number(value.fontScale)) ? Number(value.fontScale) : 1,
        contrast: value.contrast === 'high' ? 'high' : 'standard',
        reduceMotion: value.reduceMotion === true,
        showHints: value.showHints !== false
      };
    } catch (_) { return cloneDefaults(); }
  };
  let preferences = read();
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
    catch (_) { notify('Could not save interface preferences on this device.'); }
  };
  function notify(message) {
    const toast = document.getElementById('toast');
    if (toast) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
  }
  function apply() {
    const root = document.documentElement;
    root.dataset.uiDensity = preferences.density;
    root.dataset.uiContrast = preferences.contrast;
    root.dataset.uiMotion = preferences.reduceMotion ? 'reduced' : 'full';
    root.style.setProperty('--ui-font-scale', String(preferences.fontScale));
    root.dataset.uiHints = preferences.showHints ? 'visible' : 'hidden';
  }
  function pageMarkup() {
    return `
      <section class="page" id="page-settings">
        <div class="hero studio-workspace-hero settings-hero">
          <div>
            <div class="eyebrow">PLAYER EXPERIENCE / INTERFACE PREFERENCES</div>
            <h1 class="h1">Settings</h1>
            <p class="sub">Shape how THE STUDIO feels to play. These preferences apply to this device and do not alter your campaign, simulation rules or save files.</p>
            <div class="studio-hero-meta"><span>LOCAL INTERFACE PROFILE</span><span>SAFE TO CHANGE AT ANY TIME</span></div>
          </div>
          <div class="actions"><button class="btn" id="settings-reset">Reset preferences</button></div>
        </div>
        <div class="settings-layout">
          <section class="settings-panel" aria-labelledby="settings-display-title">
            <div class="settings-panel-head"><div><div class="eyebrow">01 / PRESENTATION</div><h2 id="settings-display-title">Display & layout</h2><p>Choose how much information fits on screen and how large the interface reads.</p></div><span class="settings-index">01</span></div>
            <div class="settings-control">
              <div><label for="setting-density">Information density</label><p>Compact fits more management data into each view. Comfortable adds breathing room.</p></div>
              <select id="setting-density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select>
            </div>
            <div class="settings-control">
              <div><label for="setting-font">Interface text size</label><p>Adjust the base text scale without changing simulation values.</p></div>
              <select id="setting-font"><option value="0.9">Small</option><option value="1">Standard</option><option value="1.1">Large</option></select>
            </div>
          </section>
          <section class="settings-panel" aria-labelledby="settings-access-title">
            <div class="settings-panel-head"><div><div class="eyebrow">02 / ACCESSIBILITY</div><h2 id="settings-access-title">Comfort & accessibility</h2><p>Make long management sessions easier to read and navigate.</p></div><span class="settings-index">02</span></div>
            <div class="settings-control">
              <div><label for="setting-contrast">Contrast</label><p>Increase separation between text, surfaces and borders.</p></div>
              <select id="setting-contrast"><option value="standard">Standard</option><option value="high">High contrast</option></select>
            </div>
            <label class="settings-toggle" for="setting-motion"><span><b>Reduce motion</b><small>Minimise interface animation and smooth scrolling.</small></span><input type="checkbox" id="setting-motion"></label>
            <label class="settings-toggle" for="setting-hints"><span><b>Contextual hints</b><small>Show explanatory helper text throughout management screens.</small></span><input type="checkbox" id="setting-hints"></label>
          </section>
          <section class="settings-panel settings-profile-panel" aria-labelledby="settings-profile-title">
            <div class="settings-panel-head"><div><div class="eyebrow">03 / DEVICE PROFILE</div><h2 id="settings-profile-title">This device</h2><p>Your interface preferences are stored locally. Campaign data and simulation progression are untouched.</p></div><span class="settings-index">03</span></div>
            <div class="settings-profile-row"><span>Preference storage</span><b>Local device</b></div>
            <div class="settings-profile-row"><span>Campaign compatibility</span><b class="settings-good">No save changes</b></div>
            <div class="settings-profile-row"><span>Current layout</span><b id="settings-profile-summary">Comfortable · Standard</b></div>
          </section>
        </div>
      </section>`;
  }
  function syncControls() {
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = String(value); };
    const check = (id, value) => { const el = document.getElementById(id); if (el) el.checked = !!value; };
    set('setting-density', preferences.density);
    set('setting-font', preferences.fontScale);
    set('setting-contrast', preferences.contrast);
    check('setting-motion', preferences.reduceMotion);
    check('setting-hints', preferences.showHints);
    const summary = document.getElementById('settings-profile-summary');
    if (summary) summary.textContent = (preferences.density === 'compact' ? 'Compact' : 'Comfortable') + ' · ' + (preferences.contrast === 'high' ? 'High contrast' : 'Standard contrast');
  }
  function mount() {
    const nav = document.querySelector(NAV), content = document.querySelector(CONTENT);
    if (!nav || !content) return false;
    if (!nav.querySelector('[data-page="settings"]')) {
      const button = document.createElement('button');
      button.dataset.page = 'settings';
      button.innerHTML = '<span aria-hidden="true">⚙</span>Settings';
      button.addEventListener('click', () => window.nav?.('settings'));
      nav.appendChild(button);
    }
    if (!document.getElementById('page-settings')) content.insertAdjacentHTML('beforeend', pageMarkup());
    const page = document.getElementById('page-settings');
    if (!page.dataset.settingsBound) {
      page.dataset.settingsBound = 'true';
      page.addEventListener('change', event => {
        const target = event.target;
        if (!target || !target.id) return;
        if (target.id === 'setting-density') preferences.density = target.value === 'compact' ? 'compact' : 'comfortable';
        if (target.id === 'setting-font') preferences.fontScale = [0.9,1,1.1].includes(Number(target.value)) ? Number(target.value) : 1;
        if (target.id === 'setting-contrast') preferences.contrast = target.value === 'high' ? 'high' : 'standard';
        if (target.id === 'setting-motion') preferences.reduceMotion = target.checked;
        if (target.id === 'setting-hints') preferences.showHints = target.checked;
        persist(); apply(); syncControls(); notify('Interface preferences saved.');
      });
      document.getElementById('settings-reset')?.addEventListener('click', () => {
        preferences = cloneDefaults(); persist(); apply(); syncControls(); notify('Interface preferences restored.');
      });
    }
    syncControls();
    return true;
  }
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
  const observer = new MutationObserver(() => { if (!document.getElementById('page-settings')) mount(); });
  const content = document.querySelector(CONTENT);
  if (content) observer.observe(content, {childList:true});
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { preferences = read(); apply(); syncControls(); } });
  window.StudioInterfaceSettings = {get:() => ({...preferences}),reset:() => {preferences=cloneDefaults();persist();apply();syncControls();},apply};
})();
