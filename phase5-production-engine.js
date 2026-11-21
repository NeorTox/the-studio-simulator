(function(){
'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=> 'DEV-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
function ensure(){if(!active)return null;active.productionDevelopment=active.productionDevelopment||{version:'5.0.0',history:[]};active.productionDevelopment.history=active.productionDevelopment.history||[];active.projects=active.projects||[];active.projects.forEach(p=>{p.development=p.development||{logline:'',synopsis:'',scriptDraft:'',scriptStatus:'Not started',revisions:[],notes:[],greenlight:null,checklist:{director:false,producer:false,budget:false,cast:false,locations:false,schedule:false},quality:{script:0,originality:0,feasibility:0}}});return active.productionDevelopment;}
function log(p,action,detail){const d=ensure();d.history.unshift({id:uid(),date:active.date,projectId:p.id,projectTitle:p.title,action,detail:String(detail||'')});d.history=d.history.slice(0,500);if(typeof addLog==='function')addLog(p.title+' — '+action+': '+detail);if(typeof persist==='function')persist();}
function project(id){ensure();return active.projects.find(p=>p.id===id);}
function saveDevelopment(id,data){const p=project(id);if(!p)throw Error('Project not found.');const d=p.development;const logline=String(data.logline??d.logline).trim(),synopsis=String(data.synopsis??d.synopsis).trim(),draft=String(data.scriptDraft??d.scriptDraft).trim();if(logline.length>500||synopsis.length>12000||draft.length>250000)throw Error('Development material exceeds the supported length.');d.logline=logline;d.synopsis=synopsis;d.scriptDraft=draft;d.wordCount=draft?draft.split(/\s+/).length:0;d.updated=active.date;log(p,'Development materials saved','Logline, synopsis and script draft updated');return d;}
function reviseScript(id,notes){const p=project(id);if(!p)throw Error('Project not found.');const d=p.development;if(!d.scriptDraft.trim())throw Error('Write a script draft before creating a revision.');d.revisions.push({id:uid(),date:active.date,wordCount:d.wordCount||0,script:d.scriptDraft,notes:String(notes||'Revision saved')});d.scriptStatus='In revision';log(p,'Script revision saved',notes||'Revision saved');return d.revisions.length;}
function reviewScript(id,decision,score,notes){const p=project(id);if(!p)throw Error('Project not found.');const d=p.development;if(!d.scriptDraft.trim()||!d.logline||!d.synopsis)throw Error('A logline, synopsis and script draft are required for review.');const n=Number(score);if(!Number.isFinite(n)||n<0||n>100)throw Error('Script score must be between 0 and 100.');d.scriptStatus=decision==='approve'?'Approved':'Needs revision';d.quality.script=n;d.review={date:active.date,decision:d.scriptStatus,score:n,notes:String(notes||'')};log(p,'Script review completed',d.scriptStatus+' · score '+n);return d.review;}
function greenlight(id,data){const p=project(id);if(!p)throw Error('Project not found.');if(p.stage<1)throw Error('Move the project into Development before greenlight.');const d=p.development;if(d.scriptStatus!=='Approved')throw Error('An approved script is required.');const amount=Number(data.budget??p.budget);if(!Number.isFinite(amount)||amount<=0||amount>Number(p.budget))throw Error('Greenlight budget must be positive and cannot exceed the approved project budget.');const quality={originality:Number(data.originality??50),feasibility:Number(data.feasibility??50)};if(Object.values(quality).some(v=>!Number.isFinite(v)||v<0||v>100))throw Error('Quality scores must be between 0 and 100.');d.quality.originality=quality.originality;d.quality.feasibility=quality.feasibility;d.greenlight={approved:true,date:active.date,budget:amount,decision:String(data.decision||'Approved by studio'),notes:String(data.notes||'')};p.greenlit=true;p.greenlightBudget=amount;log(p,'Project greenlit','Approved production budget '+amount);return d.greenlight;}
function setChecklist(id,key,value){const p=project(id);if(!p)throw Error('Project not found.');if(!['director','producer','budget','cast','locations','schedule'].includes(key))throw Error('Unknown readiness item.');p.development.checklist[key]=!!value;log(p,'Pre-production readiness updated',key+' = '+!!value);return p.development.checklist;}
function readiness(id){const p=project(id);if(!p)return {ready:false,missing:['Project missing']};const d=p.development,c=d.checklist,missing=[];if(!p.greenlit)missing.push('Studio greenlight');if(!c.director)missing.push('Director attached');if(!c.producer)missing.push('Producer attached');if(!c.budget)missing.push('Final production budget');if(!c.cast||(p.cast||[]).length===0)missing.push('Cast attached');if(!c.locations)missing.push('Locations confirmed');if(!c.schedule||!((active.productionOps?.callSheets||[]).some(x=>x.projectId===p.id&&['Scheduled','Completed'].includes(x.status))))missing.push('Production schedule / call sheet');return {ready:missing.length===0,missing};}
function audit(){ensure();const tests=[];const add=(name,ok)=>tests.push({name,ok:!!ok});add('Project development records exist',active.projects.every(p=>p.development&&Array.isArray(p.development.revisions)));add('Script review status is valid',active.projects.every(p=>['Not started','In revision','Approved','Needs revision'].includes(p.development.scriptStatus)));add('Development text is bounded',active.projects.every(p=>String(p.development.scriptDraft||'').length<=250000&&String(p.development.synopsis||'').length<=12000));add('Greenlight budgets fit approved project budgets',active.projects.every(p=>!p.greenlightBudget||p.greenlightBudget<=p.budget));add('Pre-production readiness checklist is valid',active.projects.every(p=>Object.keys(p.development.checklist).every(k=>typeof p.development.checklist[k]==='boolean')));return {passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};}
function render(){const page=$('page-projects');if(!page)return;let host=$('phase5-development');if(!host){host=document.createElement('section');host.id='phase5-development';host.className='card';host.style.marginTop='14px';const target=$('productioncontracts')||$('projectlist');(target?.parentElement||page).appendChild(host);}if(!active){host.innerHTML='<div class="empty">Create a campaign to open the development room.</div>';return;}ensure();host.innerHTML='<div class="cardhead"><b class="cardtitle">Creative development & greenlight</b><span class="tag gold">PHASE 5</span></div>'+active.projects.map(p=>{const d=p.development,r=readiness(p.id);return '<article style="padding:13px 0;border-bottom:1px solid var(--line)"><div class="rowitem"><div><b>'+esc(p.title)+'</b><div class="tiny">'+esc(d.scriptStatus)+' · '+(d.wordCount||0)+' script words · '+d.revisions.length+' revisions</div></div><span class="tag '+(d.greenlight?'green':'gold')+'">'+(d.greenlight?'GREENLIT':'DEVELOPMENT')+'</span></div><div class="tiny" style="margin:7px 0">Logline: '+esc(d.logline||'Not written')+'</div><div class="tiny">Pre-production: '+(r.ready?'Ready':r.missing.join(' · '))+'</div><div class="actions" style="margin-top:9px"><button class="btn" data-p5-edit="'+esc(p.id)+'">Script room</button><button class="btn" data-p5-revise="'+esc(p.id)+'">Save revision</button><button class="btn" data-p5-review="'+esc(p.id)+'">Review script</button><button class="btn" data-p5-green="'+esc(p.id)+'">Greenlight</button><button class="btn" data-p5-check="'+esc(p.id)+'">Readiness checklist</button></div></article>';}).join('')+'<div class="tiny" style="margin-top:10px">Greenlight and readiness are required gates before a project can enter pre-production and principal photography.</div>';host.querySelectorAll('[data-p5-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.p5Edit));host.querySelectorAll('[data-p5-revise]').forEach(b=>b.onclick=()=>{const p=project(b.dataset.p5Revise),n=prompt('Revision notes');if(n===null)return;try{reviseScript(p.id,n);render();}catch(e){toast(e.message);}});host.querySelectorAll('[data-p5-review]').forEach(b=>b.onclick=()=>{const p=project(b.dataset.p5Review),score=prompt('Script quality score (0–100)',70);if(score===null)return;const decision=confirm('Approve this script? Choose Cancel to request revisions.')?'approve':'revise';try{reviewScript(p.id,decision,score,prompt('Review notes','')||'');render();}catch(e){toast(e.message);}});host.querySelectorAll('[data-p5-green]').forEach(b=>b.onclick=()=>{const p=project(b.dataset.p5Green);if(p.stage<1){toast('Advance to Development first.');return;}const budget=prompt('Approved production budget',p.budget);if(budget===null)return;try{greenlight(p.id,{budget,originality:prompt('Originality score (0–100)','70'),feasibility:prompt('Feasibility score (0–100)','70'),notes:prompt('Board / studio notes','')||''});render();}catch(e){toast(e.message);}});host.querySelectorAll('[data-p5-check]').forEach(b=>b.onclick=()=>checklist(b.dataset.p5Check));}
function edit(id){const p=project(id),d=p.development;show('Script room — '+p.title,'<form id="p5form"><div class="field"><label>Logline</label><textarea id="p5logline" required>'+esc(d.logline)+'</textarea></div><div class="field"><label>Synopsis / treatment</label><textarea id="p5synopsis" required style="min-height:120px">'+esc(d.synopsis)+'</textarea></div><div class="field"><label>Screenplay / script draft</label><textarea id="p5draft" required style="min-height:260px">'+esc(d.scriptDraft)+'</textarea></div><p class="hint">Script drafts are stored in the campaign save. Revisions preserve a snapshot of the previous draft.</p><button class="btn primary">Save development materials</button></form>');$('p5form').onsubmit=e=>{e.preventDefault();try{saveDevelopment(id,{logline:$('p5logline').value,synopsis:$('p5synopsis').value,scriptDraft:$('p5draft').value});close();render();toast('Development materials saved.');}catch(err){toast(err.message);}};}
function checklist(id){const p=project(id),c=p.development.checklist,keys=[['director','Director attached'],['producer','Producer attached'],['budget','Final production budget'],['cast','Cast attached'],['locations','Locations confirmed'],['schedule','Production schedule / call sheet']];show('Pre-production readiness — '+p.title,'<form id="p5check">'+keys.map(([k,l])=>'<label style="display:flex;gap:10px;padding:10px 0"><input type="checkbox" id="p5_'+k+'" '+(c[k]?'checked':'')+'>'+l+'</label>').join('')+'<button class="btn primary">Save checklist</button></form>');$('p5check').onsubmit=e=>{e.preventDefault();keys.forEach(([k])=>setChecklist(id,k,$('p5_'+k).checked));close();render();toast('Readiness checklist saved.');};}
function install(){const page=$('page-projects');if(!page)return;if(active)ensure();let host=$('phase5-development');if(!host){host=document.createElement('section');host.id='phase5-development';host.className='card';host.style.marginTop='14px';const target=$('productioncontracts')||$('projectlist');(target?.parentElement||page).appendChild(host);}const old=window.renderProjects;if(typeof old==='function'&&!old.__phase5Wrapped){const wrapped=function(){old();render();};wrapped.__phase5Wrapped=true;window.renderProjects=wrapped;}render();}
const oldAdvance=window.advanceProject;if(typeof oldAdvance==='function'&&!oldAdvance.__phase5Wrapped){const wrapped=function(id){const p=project(id);if(p){if(p.stage===0){const d=p.development;if(d.logline.trim().length<10||d.synopsis.trim().length<30||d.scriptDraft.trim().length<30){toast('Phase 5 gate: add a logline, synopsis and script draft in the Script room.');return;}}if(p.stage===1&&!p.development.greenlight){toast('Phase 5 gate: approve the script and greenlight the project before pre-production.');return;}if(p.stage===2){const r=readiness(id);if(!r.ready){toast('Pre-production is not ready: '+r.missing.join(', '));return;}}}return oldAdvance(id);};wrapped.__phase5Wrapped=true;window.advanceProject=wrapped;}
function openScriptReview(id){const p=project(id),score=prompt('Script quality score (0–100)',70);if(score===null)return;const decision=confirm('Approve this script? Choose Cancel to request revisions.')?'approve':'revise';try{reviewScript(p.id,decision,score,prompt('Review notes','')||'');render();}catch(e){toast(e.message);}}
function openProjectGreenlight(id){const p=project(id);if(p.stage<1){toast('Advance to Development first.');return;}const budget=prompt('Approved production budget',p.budget);if(budget===null)return;try{greenlight(p.id,{budget,originality:prompt('Originality score (0–100)','70'),feasibility:prompt('Feasibility score (0–100)','70'),notes:prompt('Board / studio notes','')||''});render();}catch(e){toast(e.message);}}
window.Phase5Production={version:'5.0.0',ensure,saveDevelopment,reviseScript,reviewScript,greenlight,setChecklist,readiness,audit,render,openScriptRoom:edit,openReadinessChecklist:checklist,openScriptReview,openProjectGreenlight};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();


/* Phase 5 production completion systems: continuity, safety, insurance,
   post-production deliverables, final delivery and budget controls. */
(function(){
'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=(p)=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const get=id=>window.Phase5Production;
function ensure(p){
 if(!active)return null;
 active.productionOps=active.productionOps||{callSheets:[],history:[]};
 active.productionOps.callSheets=active.productionOps.callSheets||[];
 active.productionOps.history=active.productionOps.history||[];
 active.productionSafety=active.productionSafety||{incidents:[],policies:[],history:[]};
 for(const k of ['incidents','policies','history'])active.productionSafety[k]=Array.isArray(active.productionSafety[k])?active.productionSafety[k]:[];
 active.projects=active.projects||[];
 active.projects.forEach(x=>{
  x.productionQA=x.productionQA||{continuity:{scriptSupervisor:false,footageBackup:false,dailyReports:false},postProduction:{edit:false,sound:false,vfx:false,colour:false,mix:false,master:false},delivery:null,variance:{alerts:[],cap:10}};
  const q=x.productionQA;
  q.continuity=Object.assign({scriptSupervisor:false,footageBackup:false,dailyReports:false},q.continuity||{});
  q.postProduction=Object.assign({edit:false,sound:false,vfx:false,colour:false,mix:false,master:false},q.postProduction||{});
  q.variance=Object.assign({alerts:[],cap:10},q.variance||{});
 });
 return p?active.projects.find(x=>x.id===p):active.productionSafety;
}
function record(p,action,detail){const s=ensure();s.history.unshift({id:uid('P5LOG'),date:active.date,projectId:p?.id||null,action,detail:String(detail||'')});s.history=s.history.slice(0,500);if(typeof addLog==='function')addLog((p?p.title+' — ':'')+action+': '+detail);if(typeof persist==='function')persist();}
function addPolicy(data){
 ensure();const premium=Number(data.premium),limit=Number(data.coverageLimit),start=String(data.startDate||active.date),end=String(data.endDate||'');
 if(!String(data.provider||'').trim()||!Number.isFinite(premium)||premium<0||!Number.isFinite(limit)||limit<=0||!end||end<start)throw Error('Enter a provider, valid premium, positive coverage limit and valid coverage dates.');
 const policy={id:uid('INS'),provider:String(data.provider).trim(),type:String(data.type||'Production package'),premium,coverageLimit:limit,startDate:start,endDate:end,status:'Active',notes:String(data.notes||'')};
 active.productionSafety.policies.push(policy);record(null,'Production insurance policy added',policy.provider+' · '+policy.type);return policy;
}
function activePolicy(date=active.date){ensure();return active.productionSafety.policies.find(x=>x.status==='Active'&&x.startDate<=date&&x.endDate>=date)||null;}
function reportIncident(projectId,data){
 const p=ensure(projectId);if(!p)throw Error('Project not found.');
 const severity=String(data.severity||'Low');if(!['Low','Moderate','High','Critical'].includes(severity))throw Error('Invalid incident severity.');
 const item={id:uid('INC'),projectId:p.id,projectTitle:p.title,date:active.date,type:String(data.type||'General safety'),severity,description:String(data.description||'').trim(),status:'Open',resolution:'',resolvedDate:null,claimStatus:'Not filed'};
 if(!item.description)throw Error('Incident description is required.');
 active.productionSafety.incidents.unshift(item);record(p,'Safety incident reported',severity+' · '+item.type);
 return item;
}
function resolveIncident(id,resolution){
 ensure();const i=active.productionSafety.incidents.find(x=>x.id===id);if(!i)throw Error('Incident not found.');
 if(!String(resolution||'').trim())throw Error('Resolution notes are required.');
 i.status='Resolved';i.resolution=String(resolution).trim();i.resolvedDate=active.date;record(null,'Safety incident resolved',i.id+' · '+i.resolution);return i;
}
function fileClaim(id,amount,notes){
 ensure();const i=active.productionSafety.incidents.find(x=>x.id===id);if(!i)throw Error('Incident not found.');
 const n=Number(amount);if(!Number.isFinite(n)||n<0)throw Error('Claim amount must be zero or greater.');
 const policy=active.productionSafety.policies.find(x=>x.status==='Active'&&x.startDate<=i.date&&x.endDate>=i.date);
 if(!policy)throw Error('No active insurance policy covered the incident date.');
 if(n>policy.coverageLimit)throw Error('Claim exceeds the policy coverage limit.');
 i.claimStatus='Filed';i.claim={policyId:policy.id,amount:n,notes:String(notes||''),filedDate:active.date,status:'Pending'};
 record(null,'Insurance claim filed',i.id+' · '+n);return i.claim;
}
function setContinuity(id,key,value){
 const p=ensure(id);if(!p)throw Error('Project not found.');
 if(!['scriptSupervisor','footageBackup','dailyReports'].includes(key))throw Error('Unknown continuity control.');
 p.productionQA.continuity[key]=!!value;record(p,'Continuity control updated',key+' = '+!!value);return p.productionQA.continuity;
}
function continuity(id){
 const p=ensure(id);if(!p)return {ready:false,missing:['Project missing']};
 const c=p.productionQA.continuity,missing=[];
 for(const [k,l] of [['scriptSupervisor','Script supervisor / continuity logs'],['footageBackup','Footage backup verified'],['dailyReports','Daily production reports complete']])if(!c[k])missing.push(l);
 return {ready:missing.length===0,missing};
}
function setDeliverable(id,key,value){
 const p=ensure(id);if(!p)throw Error('Project not found.');
 if(!['edit','sound','vfx','colour','mix','master'].includes(key))throw Error('Unknown post-production deliverable.');
 p.productionQA.postProduction[key]=!!value;record(p,'Post-production deliverable updated',key+' = '+!!value);return p.productionQA.postProduction;
}
function postProduction(id){
 const p=ensure(id);if(!p)return {ready:false,missing:['Project missing']};
 const c=p.productionQA.postProduction,missing=[];
 for(const [k,l] of [['edit','Picture edit locked'],['sound','Sound design complete'],['vfx','Visual effects approved'],['colour','Colour grade approved'],['mix','Final audio mix approved'],['master','Master file and QC passed']])if(!c[k])missing.push(l);
 return {ready:missing.length===0,missing};
}
function budgetStatus(id){
 const p=ensure(id);if(!p)return {valid:false};
 const budget=Number(p.greenlightBudget||p.budget)||0,spent=Number(p.spent)||0,committed=Number(p.committed)||0;
 const projected=spent+committed,variance=budget>0?(projected-budget)/budget*100:0;
 const alerts=p.productionQA.variance.alerts;
 if(variance>Number(p.productionQA.variance.cap||10)&&!alerts.some(x=>x.projected===projected&&x.date===active.date)){
  alerts.push({date:active.date,projected,budget,variance});alerts.splice(0,100);
 }
 return {valid:budget>0&&projected<=budget, budget,spent,committed,projected,remaining:budget-projected,variance,overrun:projected>budget,warning:variance>0&&variance<=Number(p.productionQA.variance.cap||10),alerts};
}
function approveDelivery(id,data){
 const p=ensure(id);if(!p)throw Error('Project not found.');
 if(p.stage<4)throw Error('Project must reach Post-production before delivery approval.');
 const q=postProduction(id);if(!q.ready)throw Error('Delivery blocked: '+q.missing.join(', '));
 const b=budgetStatus(id);if(b.overrun)throw Error('Delivery blocked: project is over its approved budget.');
 const open=active.productionSafety.incidents.filter(x=>x.projectId===id&&['High','Critical'].includes(x.severity)&&x.status!=='Resolved');
 if(open.length)throw Error('Delivery blocked by unresolved high/critical safety incidents.');
 const score=Number(data.qualityScore);if(!Number.isFinite(score)||score<0||score>100)throw Error('Delivery quality score must be 0–100.');
 p.productionQA.delivery={date:active.date,qualityScore:score,approvedBy:String(data.approvedBy||'Studio quality control'),notes:String(data.notes||''),status:'Approved'};
 record(p,'Final delivery approved','Quality score '+score+'/100');return p.productionQA.delivery;
}
function audit(){
 ensure();const tests=[];
 const add=(name,ok)=>tests.push({name,ok:!!ok});
 add('Safety records are arrays',Array.isArray(active.productionSafety.incidents)&&Array.isArray(active.productionSafety.policies));
 add('Safety incident states are valid',active.productionSafety.incidents.every(x=>['Open','Resolved'].includes(x.status)&&['Low','Moderate','High','Critical'].includes(x.severity)));
 add('Insurance coverage dates are valid',active.productionSafety.policies.every(x=>x.endDate>=x.startDate&&x.coverageLimit>0));
 add('Continuity controls are boolean',active.projects.every(p=>Object.values(p.productionQA.continuity).every(v=>typeof v==='boolean')));
 add('Post-production controls are boolean',active.projects.every(p=>Object.values(p.productionQA.postProduction).every(v=>typeof v==='boolean')));
 add('Delivery approvals have valid scores',active.projects.every(p=>!p.productionQA.delivery||(p.productionQA.delivery.qualityScore>=0&&p.productionQA.delivery.qualityScore<=100)));
 add('Project budget variance is finite',active.projects.every(p=>Number.isFinite(budgetStatus(p.id).variance)));
 return {passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};
}
function renderExtended(){
 const host=$('phase5-completion');if(!host)return;
 if(!active){host.innerHTML='<div class="empty">Create a campaign to manage production assurance and delivery.</div>';return;}
 ensure();
 host.innerHTML='<div class="cardhead"><b class="cardtitle">Production assurance & final delivery</b><span class="tag gold">PHASE 5 COMPLETION</span></div>'+
 active.projects.map(p=>{
  const c=continuity(p.id),q=postProduction(p.id),b=budgetStatus(p.id),open=active.productionSafety.incidents.filter(x=>x.projectId===p.id&&x.status==='Open').length;
  const checks=(o)=>o.ready?'<span class="tag green">READY</span>':'<span class="tag gold">'+o.missing.length+' outstanding</span>';
  return '<article style="padding:13px 0;border-bottom:1px solid var(--line)"><div class="rowitem"><b>'+esc(p.title)+'</b><span class="tag '+(p.productionQA.delivery?'green':'gold')+'">'+(p.productionQA.delivery?'DELIVERY APPROVED':'IN PROGRESS')+'</span></div>'+
  '<div class="rowitem"><span>Continuity & footage assurance</span>'+checks(c)+'</div><div class="rowitem"><span>Post-production deliverables</span>'+checks(q)+'</div>'+
  '<div class="rowitem"><span>Budget forecast</span><b class="'+(b.overrun?'danger':'')+'">'+esc((b.variance||0).toFixed(2))+'% variance · '+esc(String(b.remaining))+' remaining</b></div>'+
  '<div class="rowitem"><span>Open safety incidents</span><b>'+open+'</b></div><div class="actions" style="margin-top:9px">'+
  '<button class="btn" data-p5-cont="'+esc(p.id)+'">Continuity</button><button class="btn" data-p5-post="'+esc(p.id)+'">Post-production</button><button class="btn" data-p5-incident="'+esc(p.id)+'">Report incident</button><button class="btn" data-p5-delivery="'+esc(p.id)+'">Approve delivery</button></div>'+
  (p.productionQA.delivery?'<div class="tiny">Approved '+esc(p.productionQA.delivery.date)+' · Quality '+p.productionQA.delivery.qualityScore+'/100</div>':'')+'</article>';
 }).join('')+
 '<div class="card" style="margin-top:12px"><div class="cardhead"><b class="cardtitle">Production insurance & incidents</b><span class="tiny">'+active.productionSafety.policies.length+' policies · '+active.productionSafety.incidents.length+' incidents</span></div>'+
 '<div class="actions"><button class="btn" id="p5-policy">＋ Add insurance policy</button></div>'+
 active.productionSafety.policies.map(x=>'<div class="rowitem"><span>'+esc(x.provider)+' · '+esc(x.type)+' · '+esc(x.startDate)+' to '+esc(x.endDate)+'</span><b>'+esc(String(x.coverageLimit))+' cover</b></div>').join('')+
 active.productionSafety.incidents.slice(0,20).map(x=>'<div class="rowitem"><span>'+esc(x.projectTitle)+' · '+esc(x.type)+' · '+esc(x.severity)+' · '+esc(x.status)+'</span><span class="tiny">'+esc(x.date)+'</span>'+(x.status==='Open'?'<button class="btn small" data-p5-resolve="'+esc(x.id)+'">Resolve</button>':'')+(x.claimStatus==='Not filed'?'<button class="btn small" data-p5-claim="'+esc(x.id)+'">File claim</button>':'')+'</div>').join('')+'</div>';
 host.querySelectorAll('[data-p5-cont]').forEach(b=>b.onclick=()=>formContinuity(b.dataset.p5Cont));
 host.querySelectorAll('[data-p5-post]').forEach(b=>b.onclick=()=>formPost(b.dataset.p5Post));
 host.querySelectorAll('[data-p5-incident]').forEach(b=>b.onclick=()=>{const p=ensure(b.dataset.p5Incident),type=prompt('Incident type','Set safety'),severity=prompt('Severity: Low, Moderate, High or Critical','Low');if(type===null||severity===null)return;const description=prompt('Describe the incident');if(description===null)return;try{reportIncident(p.id,{type,severity,description});renderExtended();}catch(e){toast(e.message);}});
 host.querySelectorAll('[data-p5-resolve]').forEach(b=>b.onclick=()=>{const note=prompt('Resolution / corrective action');if(note===null)return;try{resolveIncident(b.dataset.p5Resolve,note);renderExtended();}catch(e){toast(e.message);}});
 host.querySelectorAll('[data-p5-claim]').forEach(b=>b.onclick=()=>{const amount=prompt('Claim amount');if(amount===null)return;try{fileClaim(b.dataset.p5Claim,amount,prompt('Claim notes','')||'');renderExtended();}catch(e){toast(e.message);}});
 $('p5-policy').onclick=()=>{const provider=prompt('Insurer / provider');if(provider===null)return;const premium=prompt('Premium amount','0'),coverageLimit=prompt('Coverage limit','1000000'),endDate=prompt('Coverage end date (YYYY-MM-DD)',active.date.slice(0,4)+'-12-31');try{addPolicy({provider,premium,coverageLimit,endDate,startDate:active.date});renderExtended();}catch(e){toast(e.message);}};
}
function formContinuity(id){
 const p=ensure(id),keys=[['scriptSupervisor','Script supervisor / continuity logs'],['footageBackup','Footage backup verified'],['dailyReports','Daily production reports complete']];
 show('Production continuity — '+p.title,'<form id="p5continuity">'+keys.map(([k,l])=>'<label style="display:flex;gap:10px;padding:10px 0"><input type="checkbox" id="p5c_'+k+'" '+(p.productionQA.continuity[k]?'checked':'')+'>'+l+'</label>').join('')+'<button class="btn primary">Save continuity controls</button></form>');
 $('p5continuity').onsubmit=e=>{e.preventDefault();keys.forEach(([k])=>setContinuity(id,k,$('p5c_'+k).checked));close();renderExtended();};
}
function formPost(id){
 const p=ensure(id),keys=[['edit','Picture edit locked'],['sound','Sound design complete'],['vfx','Visual effects approved'],['colour','Colour grade approved'],['mix','Final audio mix approved'],['master','Master file and QC passed']];
 show('Post-production — '+p.title,'<form id="p5post">'+keys.map(([k,l])=>'<label style="display:flex;gap:10px;padding:10px 0"><input type="checkbox" id="p5p_'+k+'" '+(p.productionQA.postProduction[k]?'checked':'')+'>'+l+'</label>').join('')+'<button class="btn primary">Save post-production status</button></form>');
 $('p5post').onsubmit=e=>{e.preventDefault();keys.forEach(([k])=>setDeliverable(id,k,$('p5p_'+k).checked));close();renderExtended();};
}
function deliveryForm(id){
 const p=ensure(id);if(p.stage<4){toast('Advance to Post-production before final delivery.');return;}
 const score=prompt('Final delivery quality score (0–100)','85');if(score===null)return;
 try{approveDelivery(id,{qualityScore:score,approvedBy:prompt('Approved by','Studio quality control')||'Studio quality control',notes:prompt('Delivery notes','')||''});renderExtended();toast('Final delivery approved.');}catch(e){toast(e.message);}
}
function install(){
 const page=$('page-projects');if(!page)return;
 let host=$('phase5-completion');if(!host){host=document.createElement('section');host.id='phase5-completion';host.className='card';host.style.marginTop='14px';($('productioncontracts')?.parentElement||$('projectlist')?.parentElement||page).after(host);}
 const prev=window.Phase5Production.render;
 if(typeof prev==='function'&&!prev.__completionWrapped){const wrapped=function(){prev();renderExtended();};wrapped.__completionWrapped=true;window.Phase5Production.render=wrapped;}
 renderExtended();
}
const base=window.Phase5Production;
Object.assign(base,{addPolicy,activePolicy,reportIncident,resolveIncident,fileClaim,setContinuity,continuity,setDeliverable,postProduction,budgetStatus,approveDelivery,auditExtended:audit,renderExtended});
const previousAdvance=window.advanceProject;
if(typeof previousAdvance==='function'&&!previousAdvance.__completionWrapped){
 const wrapped=function(id){
  const p=ensure(id);
  if(p){
   if(p.stage===3){
    const calls=active.productionOps.callSheets.filter(x=>x.projectId===id);
    if(!calls.length||calls.some(x=>x.status!=='Completed')){toast('Production wrap blocked: all scheduled shoot days must be completed or cancelled.');return;}
    const c=continuity(id);if(!c.ready){toast('Production continuity incomplete: '+c.missing.join(', '));return;}
    const serious=active.productionSafety.incidents.filter(x=>x.projectId===id&&['High','Critical'].includes(x.severity)&&x.status!=='Resolved');
    if(serious.length){toast('Production wrap blocked by unresolved high/critical safety incidents.');return;}
   }
   if(p.stage===4){
    const q=postProduction(id);if(!q.ready){toast('Post-production incomplete: '+q.missing.join(', '));return;}
    const b=budgetStatus(id);if(b.overrun){toast('Post-production wrap blocked: approved budget exceeded.');return;}
   }
   if(p.stage===5&&!p.productionQA.delivery){toast('Distribution gate: final delivery approval is required before marketing and distribution.');return;}
  }
  return previousAdvance(id);
 };
 wrapped.__completionWrapped=true;window.advanceProject=wrapped;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();