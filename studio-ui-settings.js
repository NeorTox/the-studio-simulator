(() => {
  'use strict';
  const NAV = '.nav', CONTENT = '.content', STORAGE_KEY = 'the-studio-ui-preferences-v1';
  const defaults = Object.freeze({density:'comfortable',fontScale:1,contrast:'standard',reduceMotion:false,showHints:true});
  const cloneDefaults = () => ({...defaults});
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || typeof value !== 'object') return cloneDefaults();
      return {density:value.density==='compact'?'compact':'comfortable',fontScale:[0.9,1,1.1].includes(Number(value.fontScale))?Number(value.fontScale):1,contrast:value.contrast==='high'?'high':'standard',reduceMotion:value.reduceMotion===true,showHints:value.showHints!==false};
    } catch (_) { return cloneDefaults(); }
  };
  let preferences=read(), activeCategory='display';
  const persist=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(preferences));}catch(_){notify('Could not save interface preferences on this device.');}};
  function notify(message){const toast=document.getElementById('toast');if(toast){toast.textContent=message;toast.style.display='block';setTimeout(()=>{toast.style.display='none';},2200);}}
  function apply(){
    const root=document.documentElement;
    root.dataset.uiDensity=preferences.density;root.dataset.uiContrast=preferences.contrast;root.dataset.uiMotion=preferences.reduceMotion?'reduced':'full';
    root.style.fontSize=(16*preferences.fontScale)+'px';if(document.body)document.body.style.fontSize=(14*preferences.fontScale)+'px';
    root.dataset.uiHints=preferences.showHints?'visible':'hidden';
  }
  function pageMarkup(){return `
    <section class="page" id="page-settings">
      <div class="hero studio-workspace-hero settings-hero">
        <div><div class="eyebrow">SYSTEM / PLAYER EXPERIENCE</div><h1 class="h1">Settings centre</h1><p class="sub">A dedicated home for the way THE STUDIO looks, feels and behaves on this device.</p><div class="studio-hero-meta"><span>DEVICE PROFILE</span><span>CAMPAIGN-SAFE PREFERENCES</span></div></div>
        <div class="actions"><button class="btn" id="settings-reset">Reset preferences</button></div>
      </div>
      <div class="settings-centre">
        <aside class="settings-rail" aria-label="Settings navigation">
          <div class="settings-rail-title">SETTINGS INDEX</div>
          <label class="settings-search-wrap"><span aria-hidden="true">⌕</span><input id="settings-search" type="search" placeholder="Search settings…" autocomplete="off" aria-label="Search settings"></label>
          <div class="settings-category-nav" role="tablist" aria-label="Settings categories">
            <button type="button" class="active" data-settings-category="display" role="tab" aria-selected="true"><span>▣</span><span><b>Display & layout</b><small>Density and text size</small></span></button>
            <button type="button" data-settings-category="accessibility" role="tab" aria-selected="false"><span>◉</span><span><b>Accessibility</b><small>Contrast, motion and hints</small></span></button>
            <button type="button" data-settings-category="device" role="tab" aria-selected="false"><span>▤</span><span><b>Device profile</b><small>Storage and compatibility</small></span></button>
          </div>
          <div class="settings-rail-note"><b>Important</b><span>These settings change the interface only. They do not change world rules, finances or campaign saves.</span></div>
        </aside>
        <div class="settings-content">
          <div class="settings-results" id="settings-search-results" role="status" aria-live="polite">Choose a category or search for a setting.</div>
          <section class="settings-panel" data-settings-panel="display" aria-labelledby="settings-display-title">
            <div class="settings-panel-head"><div><div class="eyebrow">01 / PRESENTATION</div><h2 id="settings-display-title">Display & layout</h2><p>Control how much information fits on screen and how large the interface reads.</p></div><span class="settings-index">01</span></div>
            <div class="settings-control settings-item" data-settings-search-item="information density compact comfortable screen spacing layout interface more less data"><div><label for="setting-density">Information density</label><p>Compact fits more management data into each view. Comfortable adds breathing room.</p></div><select id="setting-density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></div>
            <div class="settings-control settings-item" data-settings-search-item="interface text size font scaling small standard large readability"><div><label for="setting-font">Interface text size</label><p>Adjust the base text scale without changing simulation values.</p></div><select id="setting-font"><option value="0.9">Small</option><option value="1">Standard</option><option value="1.1">Large</option></select></div>
          </section>
          <section class="settings-panel" data-settings-panel="accessibility" aria-labelledby="settings-access-title" hidden>
            <div class="settings-panel-head"><div><div class="eyebrow">02 / ACCESSIBILITY</div><h2 id="settings-access-title">Comfort & accessibility</h2><p>Make long management sessions easier to read and navigate.</p></div><span class="settings-index">02</span></div>
            <div class="settings-control settings-item" data-settings-search-item="contrast high standard colour text borders visibility"><div><label for="setting-contrast">Contrast</label><p>Increase separation between text, surfaces and borders throughout the interface.</p></div><select id="setting-contrast"><option value="standard">Standard</option><option value="high">High contrast</option></select></div>
            <label class="settings-toggle settings-item" data-settings-search-item="reduce motion animation transition movement accessibility" for="setting-motion"><span><b>Reduce motion</b><small>Minimise interface animation and smooth scrolling.</small></span><input type="checkbox" id="setting-motion"></label>
            <label class="settings-toggle settings-item" data-settings-search-item="contextual hints help explanations guidance" for="setting-hints"><span><b>Contextual hints</b><small>Show explanatory helper text throughout management screens.</small></span><input type="checkbox" id="setting-hints"></label>
          </section>
          <section class="settings-panel" data-settings-panel="device" aria-labelledby="settings-profile-title" hidden>
            <div class="settings-panel-head"><div><div class="eyebrow">03 / DEVICE PROFILE</div><h2 id="settings-profile-title">This device</h2><p>Your interface preferences are stored locally. Campaign data and simulation progression are untouched.</p></div><span class="settings-index">03</span></div>
            <div class="settings-profile-row settings-item" data-settings-search-item="preference storage local device"><span>Preference storage</span><b>Local device</b></div>
            <div class="settings-profile-row settings-item" data-settings-search-item="campaign compatibility save data simulation state"><span>Campaign compatibility</span><b class="settings-good">No save changes</b></div>
            <div class="settings-profile-row settings-item" data-settings-search-item="current layout display density contrast"><span>Current layout</span><b id="settings-profile-summary">Comfortable · Standard</b></div>
            <div class="settings-device-note"><span class="settings-device-icon">✓</span><div><b>Campaign data is protected</b><p>Changing or resetting these preferences does not edit the active world's save file.</p></div></div>
          </section>
          <div class="settings-no-results" id="settings-no-results" hidden>No matching settings. Try a different search term.</div>
        </div>
      </div>
    </section>`;}
  function syncControls(){
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=String(value);},check=(id,value)=>{const el=document.getElementById(id);if(el)el.checked=!!value;};
    set('setting-density',preferences.density);set('setting-font',preferences.fontScale);set('setting-contrast',preferences.contrast);check('setting-motion',preferences.reduceMotion);check('setting-hints',preferences.showHints);
    const summary=document.getElementById('settings-profile-summary');if(summary)summary.textContent=(preferences.density==='compact'?'Compact':'Comfortable')+' · '+(preferences.contrast==='high'?'High contrast':'Standard contrast');
  }
  function filterSettings(){
    const query=(document.getElementById('settings-search')?.value||'').trim().toLowerCase(),panels=Array.from(document.querySelectorAll('[data-settings-panel]'));let matches=0;
    panels.forEach(panel=>{
      const items=Array.from(panel.querySelectorAll('[data-settings-search-item]'));let visibleItems=0;
      items.forEach(item=>{const text=(item.textContent+' '+(item.dataset.settingsSearchItem||'')).toLowerCase(),show=!query||text.includes(query);item.hidden=!show;if(show)visibleItems++;});
      const heading=(panel.querySelector('.settings-panel-head')?.textContent||'').toLowerCase(),panelMatches=!query||visibleItems>0||heading.includes(query);
      panel.hidden=query?!panelMatches:panel.dataset.settingsPanel!==activeCategory;if(query&&panelMatches)matches+=visibleItems||1;
    });
    document.querySelectorAll('[data-settings-category]').forEach(button=>{const selected=!query&&button.dataset.settingsCategory===activeCategory;button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected));});
    const status=document.getElementById('settings-search-results'),empty=document.getElementById('settings-no-results');
    if(status)status.textContent=query?(matches?matches+' matching setting'+(matches===1?'':'s'):'No matching settings'):'Choose a category or search across every setting.';
    if(empty)empty.hidden=!query||matches>0;
  }
  function mount(){
    const nav=document.querySelector(NAV),content=document.querySelector(CONTENT);if(!nav||!content)return false;
    if(!nav.querySelector('[data-page="settings"]')){
      const button=document.createElement('button');button.dataset.page='settings';button.innerHTML='<span aria-hidden="true">⚙</span>Settings';button.setAttribute('aria-label','Open the Settings centre');button.addEventListener('click',()=>window.nav?.('settings'));nav.appendChild(button);
    }
    if(!document.getElementById('page-settings'))content.insertAdjacentHTML('beforeend',pageMarkup());
    const page=document.getElementById('page-settings');
    if(!page.dataset.settingsBound){
      page.dataset.settingsBound='true';
      page.addEventListener('change',event=>{
        const target=event.target;if(!target?.id)return;
        if(target.id==='setting-density')preferences.density=target.value==='compact'?'compact':'comfortable';
        if(target.id==='setting-font')preferences.fontScale=[0.9,1,1.1].includes(Number(target.value))?Number(target.value):1;
        if(target.id==='setting-contrast')preferences.contrast=target.value==='high'?'high':'standard';
        if(target.id==='setting-motion')preferences.reduceMotion=target.checked;
        if(target.id==='setting-hints')preferences.showHints=target.checked;
        persist();apply();syncControls();notify('Interface preferences saved.');
      });
      page.querySelector('#settings-reset')?.addEventListener('click',()=>{preferences=cloneDefaults();persist();apply();syncControls();notify('Interface preferences restored.');});
      page.querySelector('#settings-search')?.addEventListener('input',filterSettings);
      page.querySelectorAll('[data-settings-category]').forEach(button=>button.addEventListener('click',()=>{activeCategory=button.dataset.settingsCategory;const search=page.querySelector('#settings-search');if(search)search.value='';filterSettings();}));
    }
    syncControls();filterSettings();return true;
  }
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  const observer=new MutationObserver(()=>{if(!document.getElementById('page-settings'))mount();}),content=document.querySelector(CONTENT);if(content)observer.observe(content,{childList:true});
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){preferences=read();apply();syncControls();}});
  window.StudioInterfaceSettings={get:()=>({...preferences}),reset:()=>{preferences=cloneDefaults();persist();apply();syncControls();},apply};
})();