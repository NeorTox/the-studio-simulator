(() => {
  'use strict';
  const STAGES=['Concept','Development','Pre-production','Principal photography','Post-production','Marketing & distribution','Released'];
  const MIN_DAYS=[14,60,30,45,90,30];
  const $=(selector,root=document)=>root.querySelector(selector),$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let dialog=null,step=0,state={};
  const plusDays=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  const campaign=()=>typeof active!=='undefined'?active:null;
  const currency=()=>campaign()?.company?.currency||'USD';
  const year=()=>Number((campaign()?.date||'2026-01-01').slice(0,4));
  const formats=()=>typeof availableFormats==='function'?availableFormats():['Feature film','Television series','Documentary','Animation film'];
  const releaseChannels=()=>typeof distributionChannels==='function'?distributionChannels():['Theatrical exhibition','Streaming licence','Television broadcast licence'];
  function defaultState(){
    const a=campaign(),date=a?.date||'2026-01-01';
    return {title:'',format:formats()[0]||'Feature film',genre:'',logline:'',synopsis:'',tone:'',audience:'Broad audience',rating:'Not yet classified',budget:'4000000',financing:'Company-funded',productionBase:[a?.company?.city,a?.company?.country].filter(Boolean).join(', '),productionApproach:'Hybrid',plannedStart:date,targetCompletion:plusDays(date,180),releaseChannel:releaseChannels()[0]||'Theatrical exhibition',targetRelease:plusDays(date,270),territories:a?.company?.country||'Domestic market'};
  }
  function createDialog(){
    if(dialog)return;
    dialog=document.createElement('dialog');
    dialog.id='studio-production-wizard';
    dialog.className='studio-production-dialog';
    dialog.setAttribute('aria-labelledby','production-wizard-title');
    dialog.innerHTML='<div class="production-wizard-frame"><aside class="production-wizard-rail"><div class="production-wizard-brand"><span class="production-wizard-mark">S</span><span><b>THE STUDIO</b><small>PRODUCTION DEVELOPMENT</small></span></div><div class="production-wizard-rail-title">PROJECT JOURNEY</div><nav class="production-wizard-steps" aria-label="Project setup steps"></nav><div class="production-wizard-rail-note"><b>Guided setup</b><span>Build a production brief one decision at a time. You can go back and revise any completed step before adding it to the slate.</span></div></aside><section class="production-wizard-main"><header class="production-wizard-header"><div><div class="eyebrow">NEW DEVELOPMENT PROJECT</div><h2 id="production-wizard-title">Create a production</h2><p>Set up the project foundation. Production stages, payments and real campaign costs remain controlled by the existing simulation.</p></div><button type="button" class="production-wizard-close" data-wizard-close aria-label="Close project setup">×</button></header><div class="production-wizard-progress"><span></span></div><div class="production-wizard-content"><div class="production-wizard-step-kicker"></div><h3 class="production-wizard-step-title"></h3><p class="production-wizard-step-copy"></p><div class="production-wizard-fields"></div></div><footer class="production-wizard-footer"><button type="button" class="btn" data-wizard-back>Back</button><span class="production-wizard-step-count"></span><button type="button" class="btn primary" data-wizard-next>Continue</button></footer></section></div>';
    document.body.append(dialog);
    dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-wizard-close]'))closeWizard();});
    dialog.addEventListener('cancel',()=>{state={};step=0;});
    dialog.addEventListener('input',captureFields);
    dialog.addEventListener('change',captureFields);
    dialog.addEventListener('click',event=>{
      const stepButton=event.target.closest('[data-wizard-step]');
      if(stepButton&&Number(stepButton.dataset.wizardStep)<step){captureFields();step=Number(stepButton.dataset.wizardStep);renderStep();}
      if(event.target.closest('[data-wizard-back]')){captureFields();step=Math.max(0,step-1);renderStep();}
      if(event.target.closest('[data-wizard-next]'))nextStep();
    });
  }
  function captureFields(event){
    const field=event?.target;
    if(field?.name)state[field.name]=field.value;
  }
  const descriptors=[
    {key:'concept',title:'Start with the idea',copy:'Give the project its identity. You are creating the first record in the studio slate, not committing the company to production yet.'},
    {key:'creative',title:'Define the creative direction',copy:'Describe the story and the people you want it to reach. This brief stays attached to the project for later reference.'},
    {key:'budget',title:'Set the initial budget',copy:'Set the project’s approved development budget. This creates the same budget commitment as the existing slate workflow; cash is spent only as stages advance.'},
    {key:'production',title:'Shape the production plan',copy:'Record a planned base, approach and target dates. These are planning assumptions, not automatic bookings or a scheduled simulation event.'},
    {key:'release',title:'Think about the release',copy:'Choose an intended first route to market and target territories. Formal rights deals and marketing campaigns are managed later in their dedicated workspaces.'},
    {key:'review',title:'Review the project brief',copy:'Check the details before creating the development project. You can still edit the brief by opening the project details in the production workspace.'}
  ];
  function field(label,name,value,type='text',extra=''){
    return '<label class="production-wizard-field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>';
  }
  function selectField(label,name,options,value){
    return '<label class="production-wizard-field"><span>'+label+'</span><select name="'+name+'">'+options.map(option=>'<option value="'+esc(option)+'" '+(option===value?'selected':'')+'>'+esc(option)+'</option>').join('')+'</select></label>';
  }
  function textareaField(label,name,value,placeholder){
    return '<label class="production-wizard-field production-wizard-field-wide"><span>'+label+'</span><textarea name="'+name+'" rows="4" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea></label>';
  }
  function renderFields(){
    const a=campaign(),date=a?.date||'2026-01-01';
    if(step===0)return '<div class="production-wizard-grid">'+field('Project title','title',state.title,'text','required maxlength="90" placeholder="Give this production a name"')+selectField('Format','format',formats(),state.format)+field('Primary genre','genre',state.genre,'text','placeholder="Drama, science fiction, comedy…"')+field('One-line premise','logline',state.logline,'text','maxlength="180" placeholder="What is this story about?"')+'</div>';
    if(step===1)return '<div class="production-wizard-grid">'+selectField('Intended audience','audience',['Broad audience','Family','Children','Teen and young adult','Adult','Niche / specialist audience','Existing fandom / franchise audience'],state.audience)+selectField('Content classification status','rating',['Not yet classified','General audience target','Teen audience target','Mature audience target','Adult audience target'],state.rating)+field('Creative tone','tone',state.tone,'text','placeholder="Grounded, playful, suspenseful, hopeful…"')+textareaField('Story synopsis','synopsis',state.synopsis,'Outline the premise, characters, conflict and creative intent…')+'</div>';
    if(step===2)return '<div class="production-wizard-grid">'+field('Approved project budget ('+esc(currency())+')','budget',state.budget,'number','required min="1" step="1" inputmode="decimal"')+selectField('Intended financing approach','financing',['Company-funded','Private investors','Co-production','Pre-sales and licensing','Mixed financing'],state.financing)+'<div class="production-wizard-note production-wizard-field-wide"><b>Budget handling</b><span>The project will be added with an itemized budget. This choice records the intended financing approach only; it does not raise capital or create investor contracts.</span></div></div>';
    if(step===3)return '<div class="production-wizard-grid">'+field('Planned production base','productionBase',state.productionBase,'text','placeholder="City, region or country"')+selectField('Production approach','productionApproach',['Studio-based','On-location','Hybrid','Animation / digital pipeline','Virtual production'],state.productionApproach)+field('Planned start date','plannedStart',state.plannedStart,'date','required min="'+esc(date)+'"')+field('Target completion date','targetCompletion',state.targetCompletion,'date','required min="'+esc(date)+'"')+'<div class="production-wizard-note production-wizard-field-wide"><b>Planning dates are not bookings</b><span>Actual stage progression still uses the simulation’s minimum time, cash checks and production rules.</span></div></div>';
    if(step===4)return '<div class="production-wizard-grid">'+selectField('Intended first release route','releaseChannel',releaseChannels(),state.releaseChannel)+field('Target release date','targetRelease',state.targetRelease,'date','required min="'+esc(state.plannedStart||date)+'"')+field('Target territories / markets','territories',state.territories,'text','placeholder="Domestic, North America, worldwide…"')+'<div class="production-wizard-note production-wizard-field-wide"><b>Distribution remains a separate decision</b><span>This records the release ambition in the brief. Rights, offers, licensing and royalty settlements are handled by Distribution and Ecosystem systems.</span></div></div>';
    const lines=[
      ['Project',state.title],['Format',state.format],['Genre',state.genre||'Not specified'],['Logline',state.logline||'Not specified'],['Audience',state.audience],['Classification',state.rating],['Creative tone',state.tone||'Not specified'],['Synopsis',state.synopsis||'Not supplied'],['Approved budget',currency()+' '+Number(state.budget||0).toLocaleString()],['Financing approach',state.financing],['Production base',state.productionBase||'Not specified'],['Production approach',state.productionApproach],['Planned production window',(state.plannedStart||'—')+' → '+(state.targetCompletion||'—')],['Release route',state.releaseChannel],['Target release',state.targetRelease||'Not set'],['Target markets',state.territories||'Not specified']
    ];
    return '<div class="production-wizard-review"><div class="production-wizard-review-status"><span>READY TO ADD TO SLATE</span><b>CONCEPT / DEVELOPMENT</b></div><div class="production-wizard-review-grid">'+lines.map(([label,value])=>'<div class="production-wizard-review-item"><small>'+esc(label)+'</small><b>'+esc(value)+'</b></div>').join('')+'</div><div class="production-wizard-note"><b>What happens next?</b><span>The project appears in your Production Slate at Concept stage. Use the existing stage approval workflow to advance it; each transition checks elapsed in-game time, available cash and itemized costs.</span></div></div>';
  }
  function renderStep(){
    if(!dialog)return;
    const descriptor=descriptors[step],rail=$('.production-wizard-steps',dialog);
    rail.innerHTML=descriptors.map((item,index)=>'<button type="button" data-wizard-step="'+index+'" class="'+(index===step?'active':index<step?'complete':'')+'" '+(index>step?'disabled':'')+'><span class="production-wizard-step-number">'+(index<step?'✓':String(index+1).padStart(2,'0'))+'</span><span><b>'+esc(item.title)+'</b><small>'+esc(['Concept','Creative brief','Budget','Production plan','Release plan','Final review'][index])+'</small></span></button>').join('');
    $('.production-wizard-progress span',dialog).style.width=((step+1)/descriptors.length*100)+'%';
    $('.production-wizard-step-kicker',dialog).textContent='STEP '+String(step+1).padStart(2,'0')+' / 0'+descriptors.length;
    $('.production-wizard-step-title',dialog).textContent=descriptor.title;
    $('.production-wizard-step-copy',dialog).textContent=descriptor.copy;
    $('.production-wizard-fields',dialog).innerHTML=renderFields();
    $('[data-wizard-back]',dialog).disabled=step===0;
    $('.production-wizard-step-count',dialog).textContent='STEP '+(step+1)+' OF '+descriptors.length;
    $('[data-wizard-next]',dialog).textContent=step===descriptors.length-1?'Add to production slate':'Continue';
    dialog.scrollTop=0;
  }
  function validateCurrent(){
    const formFields=$$('.production-wizard-fields input[required],.production-wizard-fields select[required],.production-wizard-fields textarea[required]',dialog);
    for(const control of formFields){if(!control.reportValidity())return false;}
    const budget=Number(state.budget);
    if(step===2&&(!Number.isFinite(budget)||budget<=0)){toast('Enter a valid project budget greater than zero.');return false;}
    if(step===3&&state.targetCompletion<state.plannedStart){toast('Target completion must be on or after the planned start date.');return false;}
    if(step===4&&state.targetRelease<state.plannedStart){toast('Target release cannot be before the planned production start.');return false;}
    return true;
  }
  function nextStep(){
    captureFields();
    if(!validateCurrent())return;
    if(step<descriptors.length-1){step++;renderStep();return;}
    addProject();
  }
  function addProject(){
    const a=campaign();
    if(!a){closeWizard();toast('Create or load a campaign before adding a production.');return;}
    if(!Array.isArray(a.projects))a.projects=[];
    const budget=Math.round(Number(state.budget)*100)/100;
    if(!Number.isFinite(budget)||budget<=0){toast('Enter a valid approved project budget.');step=2;renderStep();return;}
    const project={
      id:'PRJ-'+Date.now(),title:state.title.trim(),format:state.format,genre:state.genre.trim(),budget,
      budgetLines:typeof buildProductionBudget==='function'?buildProductionBudget(state.format,budget):[],
      spent:0,committed:0,cast:[],crew:[],marketingPlan:null,stage:0,stageStarted:a.date,
      stageHistory:[{stage:'Concept',date:a.date,cost:0}],
      developmentBrief:{
        version:1,createdDate:a.date,logline:state.logline.trim(),synopsis:state.synopsis.trim(),creativeTone:state.tone.trim(),
        intendedAudience:state.audience,classificationTarget:state.rating,financingApproach:state.financing,
        productionBase:state.productionBase.trim(),productionApproach:state.productionApproach,
        plannedStartDate:state.plannedStart,targetCompletionDate:state.targetCompletion,
        intendedReleaseRoute:state.releaseChannel,targetReleaseDate:state.targetRelease,targetTerritories:state.territories.trim()
      }
    };
    a.projects.push(project);
    if(typeof award==='function')award('first-project','First Project','Created the first project in the production slate.');
    if(typeof addLog==='function')addLog('Added '+project.title+' to the development slate through the guided production workflow.');
    const saved=typeof persist==='function'?persist():false;
    closeWizard();
    if(typeof window.nav==='function')window.nav('projects');
    try{sessionStorage.setItem('studio-ui-tab-page-projects','slate');}catch(_){}
    const slateTab=$('#page-projects [data-workspace-tab="slate"]');slateTab?.click();
    toast(saved?'Project brief added to the production slate.':'Project created in memory, but the campaign save needs attention.');
  }
  function openWizard(){
    if(!campaign()){toast('Create or load a campaign before adding a production.');if(typeof window.nav==='function')window.nav('campaign');return;}
    createDialog();state=defaultState();step=0;renderStep();
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    setTimeout(()=>$('.production-wizard-fields input',dialog)?.focus(),50);
  }
  function closeWizard(){if(!dialog)return;if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');}
  function renderPipeline(){
    const list=$('#projectlist'),anchor=list?.closest('.card'),slate=$('#production-slate-workspace');
    if(!slate||!anchor)return;
    let panel=$('#studio-production-pipeline');
    if(!panel){panel=document.createElement('section');panel.id='studio-production-pipeline';panel.className='studio-production-pipeline';anchor.before(panel);}
    const a=campaign(),projects=Array.isArray(a?.projects)?a.projects:[];
    if(!a){panel.innerHTML='<div class="production-pipeline-heading"><div><div class="eyebrow">PRODUCTION CONTROL</div><h2>Studio pipeline</h2><p>Create a campaign to manage projects from concept to release.</p></div></div>';return;}
    const activeProjects=projects.filter(project=>Number(project.stage||0)<6),released=projects.filter(project=>Number(project.stage||0)>=6);
    panel.innerHTML='<div class="production-pipeline-heading"><div><div class="eyebrow">DEVELOPMENT / PRODUCTION / DELIVERY</div><h2>Studio pipeline</h2><p>Follow each production through its real campaign stages. Stage approvals still run through the simulation’s time, budget and cash checks.</p></div><div class="production-pipeline-counts"><span><b>'+activeProjects.length+'</b><small>IN PROGRESS</small></span><span><b>'+released.length+'</b><small>RELEASED</small></span></div></div>'+
      (projects.length?'<div class="production-pipeline-grid">'+projects.map(project=>{
        const stage=Math.max(0,Math.min(6,Number(project.stage)||0)),progress=Math.round(stage/6*100),next=STAGES[stage+1],brief=project.developmentBrief||{};
        const action=stage<6?'<button type="button" class="btn primary" data-pipeline-advance="'+esc(project.id)+'">Review next stage <span aria-hidden="true">↗</span></button>':'<button type="button" class="btn" data-pipeline-performance="'+esc(project.id)+'">Record release performance</button>';
        return '<article class="production-pipeline-card"><div class="production-pipeline-card-top"><div><small>'+esc(project.format||'Production')+' / '+esc(project.genre||'Genre not set')+'</small><h3>'+esc(project.title)+'</h3></div><span class="production-pipeline-stage">'+esc(STAGES[stage])+'</span></div><div class="production-pipeline-track" role="img" aria-label="'+progress+' percent stage progress"><span style="width:'+progress+'%"></span></div><div class="production-pipeline-steps">'+STAGES.map((name,index)=>'<span class="'+(index<stage?'complete':index===stage?'current':'')+'" title="'+esc(name)+'"><i>'+(index<stage?'✓':index+1)+'</i><small>'+esc(name)+'</small></span>').join('')+'</div><div class="production-pipeline-meta"><span>Budget <b>'+esc(currency())+' '+Number(project.budget||0).toLocaleString()+'</b></span><span>Spent <b>'+esc(currency())+' '+Number(project.spent||0).toLocaleString()+'</b></span></div>'+(brief.logline?'<p class="production-pipeline-logline">'+esc(brief.logline)+'</p>':'')+(next?'<div class="production-pipeline-next"><span>NEXT MILESTONE</span><b>'+esc(next)+'</b></div>':'<div class="production-pipeline-next released"><span>DELIVERY</span><b>Project released</b></div>')+'<div class="production-pipeline-actions">'+action+'</div></article>';
      }).join('')+'</div>':'<div class="production-pipeline-empty"><div class="production-pipeline-empty-mark">▣</div><div><b>Your production slate is waiting for its first project.</b><p>Start with an idea, build the brief, set a budget and plan the route to release.</p></div><button type="button" class="btn primary" data-open-production-wizard>＋ Create your first production</button></div>');
  }
  function bindPipeline(){
    const panel=$('#studio-production-pipeline');if(!panel||panel.dataset.bound)return;panel.dataset.bound='true';
    panel.addEventListener('click',event=>{
      if(event.target.closest('[data-open-production-wizard]'))openWizard();
      const advance=event.target.closest('[data-pipeline-advance]');
      if(advance&&typeof advanceProject==='function')advanceProject(advance.dataset.pipelineAdvance);
      const performance=event.target.closest('[data-pipeline-performance]');
      if(performance&&typeof recordReleasePerformance==='function')recordReleasePerformance(performance.dataset.pipelinePerformance);
    });
  }
  function install(){
    const page=$('#page-projects');if(!page)return;
    const createButtons=page.querySelectorAll('button[onclick*="createProject"]');
    createButtons.forEach(button=>{button.removeAttribute('onclick');button.addEventListener('click',openWizard);});
    window.createProject=openWizard;
    renderPipeline();bindPipeline();
    const list=$('#projectlist');
    if(list){const observer=new MutationObserver(()=>renderPipeline());observer.observe(list,{childList:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.StudioProductionWorkflow={open:openWizard,refresh:renderPipeline,stages:STAGES.slice()};
})();