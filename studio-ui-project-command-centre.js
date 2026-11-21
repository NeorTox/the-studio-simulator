(() => {
  'use strict';

  const STAGES = ['Concept','Development','Pre-production','Principal photography','Post-production','Marketing & distribution','Released'];
  const MIN_STAGE_DAYS = [14,60,30,45,90,30];
  const $ = (selector, root=document) => root.querySelector(selector);
  const all = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const campaign = () => typeof active !== 'undefined' ? active : null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const money = value => typeof fmt === 'function' ? fmt(numeric(value)) : ((campaign()?.company?.currency || 'USD') + ' ' + numeric(value).toLocaleString());
  const dateDiff = (from, to) => {
    const start = Date.parse(String(from || '') + 'T00:00:00Z');
    const end = Date.parse(String(to || '') + 'T00:00:00Z');
    return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.floor((end - start) / 86400000)) : 0;
  };
  const dateText = value => value ? esc(value) : 'Not scheduled';
  let dialog = null;
  let projectId = null;
  let activeTab = 'command';

  function projectById(id) {
    const a = campaign();
    return Array.isArray(a?.projects) ? a.projects.find(project => String(project.id) === String(id)) : null;
  }

  function button(label, action, primary) {
    return '<button type="button" class="btn' + (primary ? ' primary' : '') + '" data-project-action="' + esc(action) + '">' + label + '</button>';
  }

  function metric(label, value, note) {
    return '<article class="project-centre-metric"><small>' + esc(label) + '</small><b>' + value + '</b>' + (note ? '<span>' + note + '</span>' : '') + '</article>';
  }

  function createDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'studio-project-command-centre';
    dialog.className = 'studio-project-centre-dialog';
    dialog.setAttribute('aria-labelledby', 'studio-project-centre-title');
    dialog.innerHTML =
      '<div class="project-centre-frame">' +
        '<header class="project-centre-header">' +
          '<div class="project-centre-brand"><span class="project-centre-mark">S</span><div><div class="eyebrow">THE STUDIO / PRODUCTION CONTROL</div><h2 id="studio-project-centre-title">Project command centre</h2><p data-project-subtitle></p></div></div>' +
          '<button type="button" class="project-centre-close" data-project-close aria-label="Close project workspace">×</button>' +
        '</header>' +
        '<nav class="project-centre-tabs" aria-label="Project workspaces">' +
          '<button type="button" data-project-tab="command" aria-selected="true">Command</button>' +
          '<button type="button" data-project-tab="creative" aria-selected="false">Creative brief</button>' +
          '<button type="button" data-project-tab="budget" aria-selected="false">Budget</button>' +
          '<button type="button" data-project-tab="people" aria-selected="false">People & contracts</button>' +
          '<button type="button" data-project-tab="delivery" aria-selected="false">Release</button>' +
        '</nav>' +
        '<main class="project-centre-content" data-project-content></main>' +
        '<footer class="project-centre-footer"><span>CAMPAIGN DATA · LIVE PROJECT RECORD</span><button type="button" class="btn" data-project-close>Close workspace</button></footer>' +
      '</div>';
    document.body.append(dialog);
    dialog.addEventListener('click', event => {
      if (event.target === dialog || event.target.closest('[data-project-close]')) {
        closeDialog();
        return;
      }
      const tab = event.target.closest('[data-project-tab]');
      if (tab) {
        activeTab = tab.dataset.projectTab;
        render();
        return;
      }
      const action = event.target.closest('[data-project-action]');
      if (action) runAction(action.dataset.projectAction);
    });
    dialog.addEventListener('cancel', () => { projectId = null; });
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    projectId = null;
  }

  function openProject(id) {
    const project = projectById(id);
    if (!project) {
      if (typeof toast === 'function') toast('That production is no longer in the active campaign.');
      return;
    }
    createDialog();
    projectId = project.id;
    activeTab = 'command';
    render();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function openPhase5Action(id, action) {
    if (typeof window.nav === 'function') window.nav('projects');
    const phase5 = window.Phase5Production;
    if (action === 'scriptRoom' && typeof phase5?.openScriptRoom === 'function') {
      phase5.openScriptRoom(id);
      return;
    }
    if (action === 'readiness' && typeof phase5?.openReadinessChecklist === 'function') {
      phase5.openReadinessChecklist(id);
      return;
    }
    if (typeof toast === 'function') toast('The Phase 5 development workspace is not available right now.');
  }

  function runAction(action) {
    const id = projectId;
    const project = projectById(id);
    if (!project) return;
    const actions = {
      advance: () => typeof advanceProject === 'function' && advanceProject(id),
      scriptRoom: () => openPhase5Action(id, 'scriptRoom'),
      reviewScript: () => openPhase5Action(id, 'data-p5-review', 'p5Review'),
      greenlight: () => openPhase5Action(id, 'data-p5-green', 'p5Green'),
      readiness: () => openPhase5Action(id, 'readiness'),
      crew: () => typeof hireCrew === 'function' && hireCrew(id),
      budget: () => typeof showProjectBudget === 'function' && showProjectBudget(id),
      marketing: () => typeof planMarketing === 'function' && planMarketing(id),
      launchMarketing: () => typeof launchMarketing === 'function' && launchMarketing(id),
      performance: () => typeof recordReleasePerformance === 'function' && recordReleasePerformance(id),
      contracts: () => {
        if (typeof window.nav === 'function') window.nav('projects');
        $('#page-projects [data-workspace-tab="contracts"]')?.click();
      },
      talent: () => {
        if (typeof window.nav === 'function') window.nav('talent');
      }
    };
    closeDialog();
    if (actions[action]) actions[action]();
  }

  function render() {
    const a = campaign();
    const project = projectById(projectId);
    if (!dialog || !project || !a) {
      closeDialog();
      return;
    }
    const stage = Math.max(0, Math.min(6, Math.floor(numeric(project.stage))));
    const brief = project.developmentBrief || {};
    $('[data-project-subtitle]', dialog).textContent = project.title + '  /  ' + STAGES[stage];
    all('[data-project-tab]', dialog).forEach(tab => {
      const selected = tab.dataset.projectTab === activeTab;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    const content = $('[data-project-content]', dialog);
    if (activeTab === 'creative') content.innerHTML = renderCreative(project, brief);
    else if (activeTab === 'budget') content.innerHTML = renderBudget(project);
    else if (activeTab === 'people') content.innerHTML = renderPeople(project);
    else if (activeTab === 'delivery') content.innerHTML = renderDelivery(project, brief);
    else content.innerHTML = renderCommand(project, brief, stage, a);
  }

  function renderCommand(project, brief, stage, a) {
    const elapsed = dateDiff(project.stageStarted || a.date, a.date);
    const required = MIN_STAGE_DAYS[stage] || 0;
    const remaining = numeric(project.budget) - numeric(project.spent) - numeric(project.committed) - numeric(project.contractCommitted);
    const labour = a.market && a.market.labor;
    const labourBlocked = stage === 3 && labour && labour.disruptionUntil && a.date <= labour.disruptionUntil;
    const timeReady = stage >= 6 || elapsed >= required;
    const development = project.development || {};
    const phase5 = window.Phase5Production;
    const developmentBlockers = [];
    let developmentGateLabel = '';
    if (stage === 0) {
      developmentGateLabel = 'Creative development package';
      if (String(development.logline || '').trim().length < 10) developmentBlockers.push('Logline (at least 10 characters)');
      if (String(development.synopsis || '').trim().length < 30) developmentBlockers.push('Synopsis / treatment (at least 30 characters)');
      if (String(development.scriptDraft || '').trim().length < 30) developmentBlockers.push('Script draft (at least 30 characters)');
    } else if (stage === 1) {
      developmentGateLabel = 'Script approval & studio greenlight';
      if (development.scriptStatus !== 'Approved') developmentBlockers.push('Script review approval');
      if (!development.greenlight) developmentBlockers.push('Studio greenlight');
    } else if (stage === 2 && phase5 && typeof phase5.readiness === 'function') {
      developmentGateLabel = 'Pre-production readiness';
      const readiness = phase5.readiness(project.id);
      if (!readiness.ready) developmentBlockers.push(...readiness.missing);
    }
    const developmentBlocked = developmentBlockers.length > 0;
    const status = stage >= 6 ? 'RELEASED' : labourBlocked ? 'LABOUR DISRUPTION' : developmentBlocked ? 'PHASE 5 DEPENDENCY' : timeReady ? 'READY FOR STAGE REVIEW' : 'TIME GATE IN PROGRESS';
    const stages = STAGES.map((name, index) => {
      const state = index < stage ? 'complete' : index === stage ? 'current' : 'upcoming';
      const history = (project.stageHistory || []).find(entry => entry.stage === name);
      return '<div class="project-centre-stage ' + state + '"><span>' + (index < stage ? '✓' : String(index + 1)) + '</span><div><b>' + esc(name) + '</b><small>' + (history ? 'Entered ' + esc(history.date || 'date unknown') : index === stage ? 'Current stage' : 'Awaiting approval') + '</small></div></div>';
    }).join('');
    const gates = [
      '<div class="project-centre-gate ' + (timeReady ? 'passed' : 'pending') + '"><span class="project-centre-gate-icon">' + (timeReady ? '✓' : '◷') + '</span><div><b>Minimum stage duration</b><small>' + elapsed + ' of ' + required + ' required days elapsed</small></div><strong>' + (timeReady ? 'MET' : 'WAITING') + '</strong></div>',
      '<div class="project-centre-gate ' + (labourBlocked ? 'blocked' : 'passed') + '"><span class="project-centre-gate-icon">' + (labourBlocked ? '!' : '✓') + '</span><div><b>Industry labour status</b><small>' + (labourBlocked ? 'Production disruption through ' + esc(labour.disruptionUntil) : stage === 3 ? 'No active photography disruption reported' : 'No photography-specific hold applies at this stage') + '</small></div><strong>' + (labourBlocked ? 'BLOCKED' : 'CLEAR') + '</strong></div>',
      ...(developmentGateLabel ? ['<div class="project-centre-gate ' + (developmentBlocked ? 'blocked' : 'passed') + '"><span class="project-centre-gate-icon">' + (developmentBlocked ? '!' : '✓') + '</span><div><b>' + esc(developmentGateLabel) + '</b><small>' + esc(developmentBlocked ? developmentBlockers.join(' · ') : 'Phase 5 requirements recorded') + '</small></div><strong>' + (developmentBlocked ? 'ACTION REQUIRED' : 'CLEAR') + '</strong></div>'] : [])
    ].join('');
    let actions = '';
    if (stage < 6) {
      actions += button('Review next-stage approval <span aria-hidden="true">↗</span>', 'advance', true);
      if (stage === 0 && developmentBlocked) actions += button('Open Script room', 'scriptRoom', false);
      if (stage === 1 && development.scriptStatus !== 'Approved') actions += button('Review script', 'reviewScript', false);
      else if (stage === 1 && !development.greenlight) actions += button('Greenlight project', 'greenlight', false);
      if (stage === 2 && developmentBlocked) actions += button('Open readiness checklist', 'readiness', false);
      actions += button('Hire production crew', 'crew', false);
      if (stage >= 4) actions += button(project.marketingPlan ? 'Edit marketing plan' : 'Plan marketing campaign', 'marketing', false);
      if (stage >= 5 && project.marketingPlan && project.marketingPlan.status !== 'Active') actions += button('Launch marketing', 'launchMarketing', false);
    } else if (!project.performance) {
      actions += button('Record release performance', 'performance', true);
    }
    actions += button('Open production contracts', 'contracts', false);
    actions += button('Open talent management', 'talent', false);
    actions += button('Inspect itemized budget', 'budget', false);
    return '<section class="project-centre-command">' +
      '<div class="project-centre-command-hero"><div><div class="eyebrow">PROJECT ' + esc(project.id) + '</div><h3>' + esc(project.title) + '</h3><p>' + esc(brief.logline || project.genre || 'No project premise has been recorded yet.') + '</p></div><span class="project-centre-stage-pill">' + esc(STAGES[stage]) + '</span></div>' +
      '<div class="project-centre-metrics">' +
        metric('Project stage', String(stage + 1) + ' / 7', 'Live stage in the production engine') +
        metric('Approved budget', money(project.greenlightBudget || project.budget), 'Current approved project envelope') +
        metric('Spent to date', money(project.spent), 'Posted production expenditure') +
        metric('Uncommitted envelope', money(remaining), 'After recorded project and vendor commitments') +
      '</div>' +
      '<div class="project-centre-command-grid"><section class="project-centre-panel"><div class="project-centre-panel-heading"><div><div class="eyebrow">CURRENT STAGE / NEXT GATE</div><h4>' + (stage < 6 ? 'Stage approval readiness' : 'Release completed') + '</h4></div><span class="project-centre-status ' + (labourBlocked ? 'blocked' : timeReady ? 'ready' : 'pending') + '">' + status + '</span></div>' +
        (stage < 6 ? '<div class="project-centre-gates">' + gates + '</div><div class="project-centre-next-stage"><small>NEXT STAGE</small><b>' + esc(STAGES[stage + 1]) + '</b><span>Stage costs, cash and itemized allocations are confirmed in the simulation approval review.</span></div>' : '<p class="project-centre-release-note">The production has completed all seven campaign stages. Record actual distribution results when the release is ready to report.</p>') +
        '<div class="project-centre-action-row">' + actions + '</div>' +
      '</section><section class="project-centre-panel"><div class="project-centre-panel-heading"><div><div class="eyebrow">PRODUCTION HISTORY</div><h4>Stage progression</h4></div><span class="project-centre-count">' + (project.stageHistory || []).length + ' records</span></div><div class="project-centre-timeline">' + stages + '</div></section></div>' +
      '<div class="project-centre-footnote">Stage progression is governed by the live simulation and Phase 5 development gates: script material, script approval, greenlight, pre-production readiness, elapsed time, cash, itemized costs and labour disruptions.</div>' +
    '</section>';
  }

  function renderCreative(project, brief) {
    const fields = [
      ['Format', project.format], ['Genre', project.genre], ['Logline', brief.logline], ['Synopsis', brief.synopsis],
      ['Creative tone', brief.creativeTone], ['Intended audience', brief.intendedAudience], ['Classification target', brief.classificationTarget],
      ['Financing approach', brief.financingApproach], ['Production base', brief.productionBase], ['Production approach', brief.productionApproach],
      ['Planned start', brief.plannedStartDate], ['Target completion', brief.targetCompletionDate]
    ];
    return '<section class="project-centre-section"><div class="project-centre-section-heading"><div><div class="eyebrow">DEVELOPMENT RECORD</div><h3>Creative brief & production intent</h3><p>The approved project brief is stored on the campaign. These fields are reference information; changes to budgets, contracts and bookings are handled in their own systems.</p></div></div><div class="project-centre-brief-grid">' +
      fields.map(([label, value]) => '<article><small>' + esc(label) + '</small><b>' + (value ? esc(value) : '<span class="project-centre-muted">Not supplied</span>') + '</b></article>').join('') +
      '</div><div class="project-centre-section-actions">' + button('Inspect itemized budget', 'budget', false) + button('Open talent management', 'talent', false) + '</div></section>';
  }

  function renderBudget(project) {
    const budget = numeric(project.greenlightBudget || project.budget);
    const spent = numeric(project.spent);
    const castCrewCommitted = numeric(project.committed);
    const vendorCommitted = numeric(project.contractCommitted);
    const remaining = budget - spent - castCrewCommitted - vendorCommitted;
    const usedPct = budget > 0 ? Math.max(0, Math.min(100, spent / budget * 100)) : 0;
    const lines = Array.isArray(project.budgetLines) ? project.budgetLines : [];
    const stages = [];
    lines.forEach(line => {
      const name = line.stageName || STAGES[numeric(line.stageIndex)] || 'Other';
      let group = stages.find(item => item.name === name);
      if (!group) { group = {name:name, lines:[]}; stages.push(group); }
      group.lines.push(line);
    });
    const lineHtml = stages.length ? stages.map(group => {
      const rows = group.lines.map(line => {
        const lineBudget = numeric(line.budget);
        const actual = numeric(line.actual);
        const committed = numeric(line.committed);
        const pct = lineBudget > 0 ? Math.max(0, Math.min(100, actual / lineBudget * 100)) : 0;
        return '<div class="project-centre-budget-line"><div><b>' + esc(line.category) + '</b><span>' + esc(line.status || 'Planned') + '</span></div><strong>' + money(lineBudget) + '</strong><div class="project-centre-budget-line-track"><i style="width:' + pct.toFixed(2) + '%"></i></div><small>Actual ' + money(actual) + ' · Line commitment ' + money(committed) + '</small></div>';
      }).join('');
      return '<section class="project-centre-budget-group"><h4>' + esc(group.name) + '</h4>' + rows + '</section>';
    }).join('') : '<div class="project-centre-empty">No itemized budget lines were stored for this project. Use the legacy budget detail to inspect its available budget record.</div>';
    const contracts = (campaign()?.productionContracts || []).filter(contract => String(contract.projectId) === String(project.id));
    const contractTotal = contracts.reduce((sum, contract) => sum + numeric(contract.total), 0);
    return '<section class="project-centre-section"><div class="project-centre-section-heading"><div><div class="eyebrow">PROJECT ECONOMICS</div><h3>Budget & commitments</h3><p>Posted costs, talent and crew commitments, and vendor agreements remain separate records.</p></div><div class="project-centre-section-actions">' + button('Open full budget ledger', 'budget', true) + '</div></div>' +
      '<div class="project-centre-metrics project-centre-metrics-compact">' +
        metric('Approved envelope', money(budget), '') + metric('Actual spend', money(spent), '') +
        metric('Cast & crew commitments', money(castCrewCommitted), '') + metric('Vendor contract value', money(contractTotal), '') +
        metric('Remaining after known commitments', money(remaining), '') +
      '</div><div class="project-centre-spend-summary"><div><span>Budget spent</span><b>' + usedPct.toFixed(1) + '%</b></div><div class="project-centre-spend-track"><i style="width:' + usedPct.toFixed(2) + '%"></i></div></div>' +
      '<div class="project-centre-budget-groups">' + lineHtml + '</div></section>';
  }

  function renderPeople(project) {
    const cast = Array.isArray(project.cast) ? project.cast : [];
    const crew = Array.isArray(project.crew) ? project.crew : [];
    const contracts = (campaign()?.productionContracts || []).filter(contract => String(contract.projectId) === String(project.id));
    const castRows = cast.length ? cast.map(person => '<div class="project-centre-person"><div><b>' + esc(person.actorName || person.name || 'Unnamed performer') + '</b><small>' + esc(person.role || 'Cast member') + '</small></div><strong>' + money(person.fee) + '</strong></div>').join('') : '<div class="project-centre-empty">No cast agreements are attached to this project yet. Talent and casting tools remain available in the Talent workspace.</div>';
    const crewRows = crew.length ? crew.map(person => '<div class="project-centre-person"><div><b>' + esc(person.name || 'Unnamed crew member') + '</b><small>' + esc(person.role || 'Crew') + ' · ' + esc(person.contractType || 'Project engagement') + '</small></div><strong>' + money(person.fee) + '</strong></div>').join('') : '<div class="project-centre-empty">No crew contracts have been signed for this production.</div>';
    const contractRows = contracts.length ? contracts.map(contract => {
      const schedule = contract.schedule || [];
      const paid = schedule.filter(item => item.status === 'Paid').reduce((sum, item) => sum + numeric(item.amount), 0);
      return '<div class="project-centre-person"><div><b>' + esc(contract.vendor) + '</b><small>' + esc(contract.category || 'Vendor contract') + ' · ' + paid.toLocaleString() + ' paid / ' + schedule.length + ' scheduled payments</small></div><strong>' + money(contract.total) + '</strong></div>';
    }).join('') : '<div class="project-centre-empty">No vendor payment schedules are attached to this project.</div>';
    return '<section class="project-centre-section"><div class="project-centre-section-heading"><div><div class="eyebrow">PEOPLE / PROCUREMENT</div><h3>Production team & agreements</h3><p>Inspect the people and vendor records linked to this project. New agreements use the existing Talent, Production and Finance workflows.</p></div></div>' +
      '<div class="project-centre-people-grid"><section><div class="project-centre-subheading"><h4>Cast</h4><span>' + cast.length + ' records</span></div>' + castRows + '</section>' +
      '<section><div class="project-centre-subheading"><h4>Crew</h4><span>' + crew.length + ' records</span></div>' + crewRows + '<div class="project-centre-section-actions">' + button('Hire production crew', 'crew', true) + '</div></section>' +
      '<section class="project-centre-contract-section"><div class="project-centre-subheading"><h4>Vendor agreements</h4><span>' + contracts.length + ' contracts</span></div>' + contractRows + '<div class="project-centre-section-actions">' + button('Manage production contracts', 'contracts', false) + '</div></section></div></section>';
  }

  function renderDelivery(project, brief) {
    const plan = project.marketingPlan;
    const performance = project.performance;
    const channels = plan && Array.isArray(plan.channels) ? plan.channels.join(', ') : '';
    let planHtml = plan ?
      '<div class="project-centre-delivery-card"><small>MARKETING CAMPAIGN</small><b>' + money(plan.budget) + '</b><span>' + esc(plan.status || 'Planned') + ' · ' + esc(channels || 'No channels recorded') + '</span><span>Start date: ' + dateText(plan.startDate) + ' · Region: ' + esc(plan.region || 'Not specified') + '</span></div>' :
      '<div class="project-centre-empty">No marketing plan has been recorded. The existing marketing planner opens during Post-production.</div>';
    const performanceHtml = performance ?
      '<div class="project-centre-delivery-card"><small>RECORDED RELEASE PERFORMANCE</small><b>' + money(performance.studioRevenue) + ' studio revenue</b><span>Gross receipts: ' + money(performance.gross) + ' · Net result: ' + money(performance.profit) + '</span><span>Critics ' + esc(performance.criticsScore) + ' / 100 · Audience ' + esc(performance.audienceScore) + ' / 100</span></div>' :
      '<div class="project-centre-empty">Release performance has not been posted. The reporting action becomes available after the project reaches Released.</div>';
    let actions = '';
    if (numeric(project.stage) >= 4 && numeric(project.stage) < 6 && !performance) actions += button(plan ? 'Edit marketing plan' : 'Plan marketing campaign', 'marketing', true);
    if (numeric(project.stage) >= 5 && plan && plan.status !== 'Active' && !performance) actions += button('Launch marketing', 'launchMarketing', false);
    if (numeric(project.stage) >= 6 && !performance) actions += button('Record release performance', 'performance', true);
    return '<section class="project-centre-section"><div class="project-centre-section-heading"><div><div class="eyebrow">DISTRIBUTION / MARKET DELIVERY</div><h3>Release intent & actual results</h3><p>Planned route and territories come from the development brief. Marketing, licensing and release performance use the live distribution systems.</p></div></div>' +
      '<div class="project-centre-release-grid"><article><small>INTENDED RELEASE ROUTE</small><b>' + esc(brief.intendedReleaseRoute || 'Not specified') + '</b></article><article><small>TARGET RELEASE DATE</small><b>' + dateText(brief.targetReleaseDate) + '</b></article><article><small>TARGET TERRITORIES</small><b>' + esc(brief.targetTerritories || 'Not specified') + '</b></article></div>' +
      '<div class="project-centre-delivery-grid"><section><h4>Marketing</h4>' + planHtml + '</section><section><h4>Release performance</h4>' + performanceHtml + '</section></div>' +
      '<div class="project-centre-section-actions">' + actions + '</div></section>';
  }

  function bindPipeline() {
    const panel = $('#studio-production-pipeline');
    if (!panel || panel.dataset.projectCentreBound) return;
    panel.dataset.projectCentreBound = 'true';
    panel.addEventListener('click', event => {
      const trigger = event.target.closest('[data-pipeline-open]');
      if (trigger) openProject(trigger.dataset.pipelineOpen);
    });
  }

  function install() {
    bindPipeline();
    if (!$('#studio-production-pipeline')) {
      const observer = new MutationObserver(() => {
        if ($('#studio-production-pipeline')) {
          bindPipeline();
          observer.disconnect();
        }
      });
      observer.observe(document.body, {childList:true,subtree:true});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();

  window.StudioProjectCommandCentre = {open:openProject, close:closeDialog, refresh:render};
})();