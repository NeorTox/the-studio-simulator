(function(){
'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>active?.date||new Date().toISOString().slice(0,10);
const uid=(p)=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
function ensure(){
 if(!active)return null;
 active.company=active.company||{};
 const c=active.company;
 c.management=Object.assign({version:'4.1.0',approvalThreshold:25000,departments:[],executives:[],branches:[],subsidiaries:[],boardDecisions:[],contracts:[],compliance:[],history:[],lastProcessedDate:null},c.management||{});
 const m=c.management;
 for(const k of ['departments','executives','branches','subsidiaries','boardDecisions','contracts','compliance','history'])if(!Array.isArray(m[k]))m[k]=[];
 if(!m.departments.length){
  ['Executive Office','Finance','Human Resources','Production','Distribution','Marketing','Legal & Compliance','Technology'].forEach((name,i)=>m.departments.push({id:uid('DEP'),name,head:i===0?'Founder / CEO':'Unassigned',budget:0,headcount:0,status:'Active',created:today()}));
 }
 if(!m.compliance.length){
  ['Corporate filings','Tax registrations','Employment standards','Intellectual property','Health & safety','Data protection'].forEach(name=>m.compliance.push({id:uid('CMP'),name,status:'Pending review',owner:'Legal & Compliance',dueDate:'',notes:''}));
 }
 return m;
}
function log(action,detail){const m=ensure();if(!m)return;m.history.unshift({id:uid('LOG'),date:today(),action,detail:String(detail||'')});if(m.history.length>250)m.history.length=250;}
function persistView(message){if(typeof persist==='function')persist();render();if(message&&typeof toast==='function')toast(message);}
function modal(title,html,save){
 if(typeof show!=='function')throw Error('Application dialog service is unavailable.');
 show(title,html);
 const f=$('p4form');if(!f)throw Error('Company form failed to open.');
 f.onsubmit=e=>{e.preventDefault();try{save();}catch(err){if(typeof toast==='function')toast(err.message||'Could not save.');}};
}
function field(label,id,type='text',required=true,extra=''){return '<div class="field"><label>'+label+'</label><input id="'+id+'" type="'+type+'" '+(required?'required':'')+' '+extra+'></div>';}
function addDepartment(){const m=ensure();modal('Create department','<form id="p4form">'+field('Department name','p4name')+field('Department head / manager','p4head')+'<div class="field"><label>Reports to department</label><select id="p4parent"><option value="">Top-level department</option>'+m.departments.filter(x=>x.status!=='Closed').map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></div>'+field('Annual budget','p4budget','number',false,'min="0" step=".01" value="0"')+field('Initial headcount','p4staff','number',false,'min="0" step="1" value="0"')+'<button class="btn primary">Create department</button></form>',()=>{const m=ensure(),name=$('p4name').value.trim();if(m.departments.some(x=>x.name.toLowerCase()===name.toLowerCase()))throw Error('A department with that name already exists.');m.departments.push({id:uid('DEP'),name,head:$('p4head').value.trim()||'Unassigned',parentId:$('p4parent').value||null,budget:Math.max(0,Number($('p4budget').value)||0),headcount:Math.max(0,Math.floor(Number($('p4staff').value)||0)),status:'Active',created:today()});log('Department created',name);close();persistView('Department created.');});}
function spendDepartmentBudget(){
 const m=ensure(),activeDepts=m.departments.filter(d=>d.status==='Active'),approved=m.boardDecisions.filter(x=>x.outcome==='Approved'&&x.amount>0&&!x.posted);
 modal('Authorize departmental expenditure','<form id="p4form"><div class="field"><label>Department</label><select id="p4spenddept">'+activeDepts.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')+'</select></div><div class="field"><label>Board authorization (required at / above '+money(m.approvalThreshold).toFixed(2)+')</label><select id="p4spendboard"><option value="">No board authorization</option>'+approved.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+' · '+money(x.amount).toFixed(2)+'</option>').join('')+'</select></div>'+field('Expense description','p4spenddesc')+'<div class="field"><label>Expense category</label><select id="p4spendcat"><option>Department operating expense</option><option>Payroll & staffing</option><option>Technology & equipment</option><option>Research & development</option><option>Travel & administration</option><option>Professional services</option><option>Marketing & publicity</option><option>Facilities & maintenance</option></select></div>'+field('Amount','p4spendamount','number',true,'min="0.01" step=".01"')+'<p class="p4muted">Approved spending is immediately charged to company cash and the department\'s annual budget. The company must have sufficient cash and the department must have sufficient remaining budget.</p><button class="btn primary">Authorize and pay</button></form>',()=>{
 const dept=m.departments.find(d=>d.id===$('p4spenddept').value),amount=Math.round(Number($('p4spendamount').value)*100)/100,desc=$('p4spenddesc').value.trim(),year=today().slice(0,4);
 if(!dept||dept.status!=='Active')throw Error('Choose an active department.');
 if(!desc||!Number.isFinite(amount)||amount<=0)throw Error('Enter a description and a positive amount.');
 dept.budgetSpent=dept.budgetSpent||{};const used=Number(dept.budgetSpent[year]||0),budget=Math.max(0,Number(dept.budget)||0),remaining=Math.max(0,budget-used);
 if(amount>remaining+0.000001)throw Error('Insufficient department budget. Remaining this year: '+remaining.toFixed(2));
 const threshold=money(m.approvalThreshold??25000),decisionId=$('p4spendboard').value,decision=m.boardDecisions.find(x=>x.id===decisionId);
 if(amount>=threshold&&(!decision||decision.outcome!=='Approved'||decision.posted||money(decision.amount)<amount))throw Error('An unspent approved board resolution covering this amount is required.');
 if(Number(active.company.cash)<amount)throw Error('Insufficient company cash.');
 if(typeof window.post!=='function'||!window.post(desc+' — '+dept.name,'Department operating expense',-amount,today(),'transaction',{phase4:true,departmentId:dept.id,department:dept.name,expenseCategory:$('p4spendcat').value,financialYear:year}))throw Error('The company payment could not be posted.');
 dept.budgetSpent[year]=Math.round((used+amount)*100)/100;if(amount>=threshold&&decision){decision.posted=true;decision.postedDate=today();}
 log('Department expenditure paid',dept.name+' · '+desc+' · '+amount+' · FY '+year);
 close();persistView('Department expenditure authorized and paid.');
 });
}
function addExecutive(){const m=ensure();modal('Appoint executive','<form id="p4form">'+field('Full name','p4name')+'<div class="field"><label>Position</label><select id="p4role"><option>Chief Executive Officer</option><option>Chief Financial Officer</option><option>Chief Operating Officer</option><option>Chief Technology Officer</option><option>Chief Marketing Officer</option><option>Chief Legal Officer</option><option>Chief Human Resources Officer</option><option>Managing Director</option><option>Board Director</option></select></div>'+field('Department','p4dept')+field('Annual compensation','p4pay','number',false,'min="0" step=".01" value="0"')+'<div class="field"><label>Reports to executive</label><select id="p4reports"><option value="">Board / CEO</option>'+m.executives.filter(x=>x.status==='Active').map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' — '+esc(x.role)+'</option>').join('')+'</select></div><button class="btn primary">Appoint executive</button></form>',()=>{const name=$('p4name').value.trim(),role=$('p4role').value;if(m.executives.some(x=>x.name.toLowerCase()===name.toLowerCase()&&x.role===role))throw Error('This executive appointment already exists.');m.executives.push({id:uid('EXE'),name,role,department:$('p4dept').value.trim()||'Executive Office',annualCompensation:Math.max(0,Number($('p4pay').value)||0),reportsTo:$('p4reports').value||null,status:'Active',appointed:today()});log('Executive appointed',name+' — '+role);close();persistView('Executive appointed.');});}
function addBranch(){modal('Open company branch','<form id="p4form">'+field('Branch name','p4name')+field('City / region','p4loc')+field('Country','p4country')+field('Branch manager','p4manager', 'text',false)+field('Annual operating budget','p4budget','number',false,'min="0" step=".01" value="0"')+'<button class="btn primary">Open branch</button></form>',()=>{const m=ensure(),name=$('p4name').value.trim();m.branches.push({id:uid('BR'),name,location:$('p4loc').value.trim(),country:$('p4country').value.trim(),manager:$('p4manager').value.trim()||'Unassigned',budget:Math.max(0,Number($('p4budget').value)||0),status:'Active',opened:today()});log('Branch opened',name);close();persistView('Branch opened.');});}
function addSubsidiary(){modal('Create subsidiary','<form id="p4form">'+field('Legal entity name','p4name')+field('Jurisdiction','p4jurisdiction')+field('Business focus','p4focus')+field('Ownership percentage','p4ownership','number',true,'min="0.01" max="100" step=".01" value="100"')+'<button class="btn primary">Create subsidiary</button></form>',()=>{const m=ensure(),ownership=Number($('p4ownership').value);if(!(ownership>0&&ownership<=100))throw Error('Ownership must be greater than 0 and no more than 100%.');const name=$('p4name').value.trim();m.subsidiaries.push({id:uid('SUB'),name,jurisdiction:$('p4jurisdiction').value.trim(),focus:$('p4focus').value.trim(),ownership,status:'Active',formed:today()});log('Subsidiary formed',name+' ('+ownership+'%)');close();persistView('Subsidiary formed.');});}
function addBoardDecision(){modal('Record board decision','<form id="p4form">'+field('Decision title','p4title')+'<div class="field"><label>Decision category</label><select id="p4category"><option>Strategy</option><option>Capital allocation</option><option>Executive appointment</option><option>Acquisition</option><option>Restructuring</option><option>Risk & compliance</option><option>Expansion</option></select></div><div class="field"><label>Resolution</label><textarea id="p4resolution" required></textarea></div><div class="field"><label>Outcome</label><select id="p4outcome"><option>Approved</option><option>Rejected</option><option>Deferred</option></select></div><button class="btn primary">Record resolution</button></form>',()=>{const m=ensure();m.boardDecisions.unshift({id:uid('BRD'),title:$('p4title').value.trim(),category:$('p4category').value,resolution:$('p4resolution').value.trim(),outcome:$('p4outcome').value,date:today()});log('Board resolution',m.boardDecisions[0].title+' — '+m.boardDecisions[0].outcome);close();persistView('Board resolution recorded.');});}
function addContract(){modal('Register corporate contract','<form id="p4form">'+field('Contract title','p4title')+field('Counterparty','p4party')+'<div class="field"><label>Contract type</label><select id="p4type"><option>Production</option><option>Distribution</option><option>Employment</option><option>Licensing</option><option>Supplier</option><option>Lease</option><option>Partnership</option><option>Other</option></select></div>'+field('Contract value','p4value','number',false,'min="0" step=".01" value="0"')+'<div class="formgrid">'+field('Start date','p4start','date',true)+field('End date','p4end','date',false)+'</div><button class="btn primary">Register contract</button></form>',()=>{const m=ensure(),start=$('p4start').value,end=$('p4end').value;if(end&&end<start)throw Error('Contract end date cannot precede its start date.');m.contracts.push({id:uid('CTR'),title:$('p4title').value.trim(),counterparty:$('p4party').value.trim(),type:$('p4type').value,value:Math.max(0,Number($('p4value').value)||0),startDate:start,endDate:end,status:'Active',created:today()});log('Contract registered',$('p4title').value.trim());close();persistView('Contract registered.');});}

function updateCompliance(id,status){const m=ensure(),x=m.compliance.find(a=>a.id===id);if(!x)return;x.status=status;log('Compliance status updated',x.name+' — '+status);persistView('Compliance register updated.');}
function addCompliance(){modal('Add compliance obligation','<form id="p4form">'+field('Requirement','p4name')+field('Responsible department','p4owner')+field('Due date','p4due','date',false)+field('Late filing penalty','p4penalty','number',false,'min="0" step=".01" value="0"')+'<div class="field"><label>Status</label><select id="p4status"><option>Pending review</option><option>In progress</option><option>Compliant</option><option>At risk</option><option>Non-compliant</option></select></div><div class="field"><label>Notes</label><textarea id="p4notes"></textarea></div><button class="btn primary">Add obligation</button></form>',()=>{const m=ensure();m.compliance.push({id:uid('CMP'),name:$('p4name').value.trim(),owner:$('p4owner').value.trim()||'Legal & Compliance',dueDate:$('p4due').value,penaltyAmount:money($('p4penalty').value),status:$('p4status').value,notes:$('p4notes').value.trim()});log('Compliance obligation added',$('p4name').value.trim());close();persistView('Compliance obligation added.');});}
function restructure(){const m=ensure();modal('Restructure department','<form id="p4form"><div class="field"><label>Department</label><select id="p4dept">'+m.departments.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')+'</select></div><div class="field"><label>Action</label><select id="p4action"><option value="Active">Keep active</option><option value="Restructuring">Mark restructuring</option><option value="Closed">Close department</option></select></div><div class="field"><label>Reason / board reference</label><textarea id="p4reason" required></textarea></div><button class="btn primary">Apply organizational change</button></form>',()=>{const d=m.departments.find(x=>x.id===$('p4dept').value);if(!d)throw Error('Department not found.');const status=$('p4action').value;if(status==='Closed'&&d.name==='Executive Office')throw Error('The Executive Office cannot be closed.');d.status=status;d.lastChange= today();d.changeReason=$('p4reason').value.trim();log('Department '+status.toLowerCase(),d.name+': '+d.changeReason);close();persistView('Organizational change recorded.');});}
function render(){
 const m=ensure();if(!m)return;const page=$('page-company');if(!page)return;
 let root=$('phase4-company');if(!root){root=document.createElement('div');root.id='phase4-company';root.innerHTML='<style>#phase4-company{display:grid;gap:14px;margin-top:18px}#phase4-company .p4grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#phase4-company .p4card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:15px;min-width:0}#phase4-company .p4wide{grid-column:1/-1}#phase4-company .p4row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px}#phase4-company .p4row:last-child{border:0}#phase4-company .p4muted{font-size:10px;color:var(--muted)}#phase4-company .p4actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}#phase4-company .p4actions .btn{font-size:11px;padding:8px 10px}#phase4-company .p4empty{padding:12px 0;color:var(--muted);font-size:12px}@media(max-width:760px){#phase4-company .p4grid{grid-template-columns:1fr}#phase4-company .p4wide{grid-column:auto}}</style><div class="p4grid"><section class="p4card p4wide"><div class="cardhead"><b class="cardtitle">Corporate organization</b><span class="tag gold">PHASE 4 · MANAGEMENT</span></div><div id="p4org"></div><div class="p4actions"><button class="btn primary" id="p4adddept">＋ Department</button><button class="btn" id="p4restructure">Restructure / close</button><button class="btn" id="p4spend">＋ Authorize spending</button><button class="btn" id="p4addexec">＋ Executive</button></div></section><section class="p4card"><div class="cardhead"><b class="cardtitle">Branches & subsidiaries</b></div><div id="p4entities"></div><div class="p4actions"><button class="btn" id="p4branch">＋ Branch</button><button class="btn" id="p4subsidiary">＋ Subsidiary</button></div></section><section class="p4card"><div class="cardhead"><b class="cardtitle">Board & governance</b></div><div id="p4board"></div><div class="p4actions"><button class="btn primary" id="p4decision">＋ Board resolution</button></div></section><section class="p4card"><div class="cardhead"><b class="cardtitle">Contracts register</b></div><div id="p4contracts"></div><div class="p4actions"><button class="btn" id="p4contract">＋ Contract</button></div></section><section class="p4card"><div class="cardhead"><b class="cardtitle">Compliance & legal obligations</b></div><div id="p4compliance"></div><div class="p4actions"><button class="btn" id="p4complianceadd">＋ Obligation</button></div></section><section class="p4card p4wide"><div class="cardhead"><b class="cardtitle">Management integrity audit</b><span class="p4muted">CORPORATE RECORD VALIDATION</span></div><div id="p4audit" class="p4empty">Run the audit to validate the company structure and records.</div><div class="p4actions"><button class="btn primary" id="p4auditrun">Run Phase 4 audit</button></div></section></div>';page.appendChild(root);}
 const bind=(id,fn)=>{const e=$(id);if(e)e.onclick=fn;};
 bind('p4adddept',addDepartment);bind('p4restructure',restructure);bind('p4spend',spendDepartmentBudget);bind('p4addexec',addExecutive);bind('p4branch',addBranch);bind('p4subsidiary',addSubsidiary);bind('p4decision',addBoardDecision);bind('p4contract',addContract);bind('p4complianceadd',addCompliance);bind('p4auditrun',()=>{const a=runAudit();const host=$('p4audit');host.innerHTML='<b>'+a.passed+' passed · '+a.failed+' failed</b>'+a.tests.map(t=>'<div class="p4row"><span>'+esc(t.name)+'</span><b class="tag '+(t.ok?'green':'red')+'">'+(t.ok?'PASS':'FAIL')+'</b></div>').join('');});
 $('p4org').innerHTML='<div class="p4row"><b>Departments</b><b>'+m.departments.length+'</b></div>'+m.departments.map(d=>{d.budgetSpent=d.budgetSpent||{};const year=today().slice(0,4),budget=Math.max(0,Number(d.budget)||0),spent=Number(d.budgetSpent[year]||0),remaining=Math.max(0,budget-spent);return '<div class="p4row"><span><b>'+esc(d.name)+'</b><br><span class="p4muted">'+esc(d.head||'Unassigned')+' · '+esc(d.headcount||0)+' staff · '+esc(d.status)+(d.parentId?' · reports to '+esc(m.departments.find(p=>p.id===d.parentId)?.name||'Unknown'):' · top level')+'<br>FY '+year+' · Spent '+spent.toFixed(2)+' / '+budget.toFixed(2)+' · Remaining '+remaining.toFixed(2)+'</span></span><b>'+remaining.toFixed(2)+'</b></div>';}).join('')+'<div class="p4row"><b>Executives</b><b>'+m.executives.length+'</b></div>'+m.executives.map(e=>'<div class="p4row"><span><b>'+esc(e.name)+'</b><br><span class="p4muted">'+esc(e.role)+' · '+esc(e.department)+(e.reportsTo?' · reports to '+esc(m.executives.find(p=>p.id===e.reportsTo)?.name||'Unknown'):' · board / CEO')+'</span></span><span class="tag">'+esc(e.status)+'</span></div>').join('');
 $('p4entities').innerHTML='<div class="p4row"><span>Branches</span><b>'+m.branches.length+'</b></div>'+m.branches.map(x=>'<div class="p4row"><span><b>'+esc(x.name)+'</b><br><span class="p4muted">'+esc(x.location)+', '+esc(x.country)+' · '+esc(x.manager)+'</span></span><span class="tag">'+esc(x.status)+'</span></div>').join('')+'<div class="p4row"><span>Subsidiaries</span><b>'+m.subsidiaries.length+'</b></div>'+m.subsidiaries.map(x=>'<div class="p4row"><span><b>'+esc(x.name)+'</b><br><span class="p4muted">'+esc(x.jurisdiction)+' · '+esc(x.focus)+'</span></span><b>'+x.ownership+'%</b></div>').join('');
 $('p4board').innerHTML='<div class="p4row"><span>Recorded resolutions</span><b>'+m.boardDecisions.length+'</b></div>'+m.boardDecisions.slice(0,6).map(x=>'<div class="p4row"><span><b>'+esc(x.title)+'</b><br><span class="p4muted">'+esc(x.category)+' · '+esc(x.date)+'</span></span><span class="tag '+(x.outcome==='Approved'?'green':'')+'">'+esc(x.outcome)+'</span></div>').join('')||'<div class="p4empty">No board decisions recorded.</div>';
 $('p4contracts').innerHTML=m.contracts.length?m.contracts.slice(0,7).map(x=>'<div class="p4row"><span><b>'+esc(x.title)+'</b><br><span class="p4muted">'+esc(x.counterparty)+' · '+esc(x.type)+' · '+esc(x.startDate)+' – '+esc(x.endDate||'Open-ended')+'</span></span><span class="tag">'+esc(x.status)+'</span></div>').join(''):'<div class="p4empty">No corporate contracts registered.</div>';
 $('p4compliance').innerHTML=m.compliance.map(x=>'<div class="p4row"><span><b>'+esc(x.name)+'</b><br><span class="p4muted">'+esc(x.owner)+' · '+esc(x.dueDate||'No due date')+'</span></span><select data-compliance="'+esc(x.id)+'" aria-label="Status for '+esc(x.name)+'">'+['Pending review','In progress','Compliant','At risk','Non-compliant'].map(s=>'<option '+(x.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select></div>').join('');
 root.querySelectorAll('[data-compliance]').forEach(e=>e.onchange=()=>updateCompliance(e.dataset.compliance,e.value));

 let finance=$('p4finance');if(!finance){finance=document.createElement('section');finance.id='p4finance';finance.className='p4card p4wide';finance.innerHTML='<div class="cardhead"><b class="cardtitle">Branch finance, contract cash flows & management accounts</b></div><div id="p4report" class="p4muted"></div><div class="p4actions"><button class="btn" id="p4branchfinance">Configure branch economics</button><button class="btn" id="p4subsidiaryfinance">Update subsidiary accounts</button><button class="btn" id="p4contractpayment">Schedule contract payment</button><button class="btn" id="p4boardthreshold">Set board threshold</button><button class="btn" id="p4capitalvote">Record capital vote</button><button class="btn primary" id="p4reportrefresh">Refresh management accounts</button></div>';root.querySelector('.p4grid').appendChild(finance);}
 const report=managementReport();$('p4report').innerHTML='<div class="p4row"><span>Departments · annual authorized budgets</span><b>'+report.departments.length+'</b></div>'+report.departments.map(d=>'<div class="p4row"><span>'+esc(d.name)+' · budget '+d.budget.toFixed(2)+'</span><b>Spent '+d.spent.toFixed(2)+' · left '+d.remaining.toFixed(2)+'</b></div>').join('')+'<div class="p4row"><span>Active subsidiaries in consolidation</span><b>'+report.consolidation.subsidiaryCount+'</b></div><div class="p4row"><span>Subsidiary revenue / net income / parent share</span><b>'+report.consolidation.subsidiaryRevenue.toFixed(2)+' / '+report.consolidation.subsidiaryNetIncome.toFixed(2)+' / '+report.consolidation.parentShareOfSubsidiaryIncome.toFixed(2)+'</b></div><div class="p4row"><span>Compliance overdue / non-compliant</span><b>'+report.compliance.overdue+' / '+report.compliance.nonCompliant+'</b></div>'+report.branches.map(b=>'<div class="p4row"><span>Branch · '+esc(b.name)+'</span><b>'+((b.month&&b.month.operatingProfit!==undefined)?'Operating result '+b.month.operatingProfit.toFixed(2):'Monthly economics not yet posted')+'</b></div>').join('');
 const bindFinance=(id,fn)=>{const e=$(id);if(e)e.onclick=fn;};
 bindFinance('p4branchfinance',()=>{const b=m.branches.find(x=>x.status==='Active');if(!b){toast('Open a branch first.');return;}const rev=prompt('Monthly revenue for '+b.name,b.monthlyRevenue||0);if(rev===null)return;const rent=prompt('Monthly rent',b.monthlyRent||0);if(rent===null)return;const payroll=prompt('Monthly branch payroll',b.monthlyPayroll||0);if(payroll===null)return;const ops=prompt('Monthly operating costs',b.monthlyOperatingCost||0);if(ops===null)return;try{branchEconomics(b.id,{monthlyRevenue:rev,monthlyRent:rent,monthlyPayroll:payroll,monthlyOperatingCost:ops});}catch(e){toast(e.message);}});
 bindFinance('p4subsidiaryfinance',()=>{const sub=m.subsidiaries.find(x=>x.status==='Active');if(!sub){toast('Create a subsidiary first.');return;}const revenue=prompt('Reporting-period revenue for '+sub.name,sub.financials?.revenue||0);if(revenue===null)return;const expenses=prompt('Reporting-period expenses',sub.financials?.expenses||0);if(expenses===null)return;const assets=prompt('Total assets',sub.financials?.assets||0);if(assets===null)return;const liabilities=prompt('Total liabilities',sub.financials?.liabilities||0);if(liabilities===null)return;try{subsidiaryFinancials(sub.id,{revenue,expenses,assets,liabilities,period:today().slice(0,7)});}catch(e){toast(e.message);}});
 bindFinance('p4contractpayment',()=>{const c=m.contracts.find(x=>x.status==='Active');if(!c){toast('Register an active contract first.');return;}const due=prompt('Payment due date (YYYY-MM-DD)',today());if(!due)return;const amount=prompt('Payment amount',0);if(amount===null)return;const direction=prompt('Type "in" for receipt or "out" for payment','out');if(direction===null)return;try{addContractPayment(c.id,{dueDate:due,amount,direction,milestone:'Scheduled milestone'});}catch(e){toast(e.message);}});
 bindFinance('p4boardthreshold',()=>{const n=prompt('Board approval threshold',m.approvalThreshold??25000);if(n!==null)try{setBoardThreshold(n);}catch(e){toast(e.message);}});
 bindFinance('p4capitalvote',()=>{const title=prompt('Capital request title');if(!title)return;const amount=prompt('Capital amount',0);if(amount===null)return;const description=prompt('Purpose / resolution','');if(description===null)return;const yes=Number(prompt('Number of YES votes (board of 3)',0));const no=Number(prompt('Number of NO votes (board of 3)',0));try{approveCapitalRequest({title,amount,description,boardSize:3,votes:[...Array(Math.max(0,Math.min(3,yes))).fill({choice:'yes'}),...Array(Math.max(0,Math.min(3,no))).fill({choice:'no'})]});}catch(e){toast(e.message);}});
 bindFinance('p4reportrefresh',()=>{render();toast('Management accounts refreshed.');});

}

function money(v){return Math.round((Number(v)||0)*100)/100;}
function postCompanyEntry(description,category,amount,date,meta){
 if(!Number.isFinite(Number(amount))||!Number(amount))return false;
 if(Number(amount)<0&&Number(active.company.cash)<Math.abs(Number(amount)))return false;
 return typeof window.post==='function'&&!!window.post(description,category,money(amount),date,'transaction',{phase4:true,...(meta||{})});
}
function branchEconomics(id,values){
 const m=ensure(),b=m.branches.find(x=>x.id===id);if(!b)throw Error('Branch not found.');
 const v=values||{};
 for(const k of ['monthlyRevenue','monthlyRent','monthlyPayroll','monthlyOperatingCost'])if(v[k]!==undefined&&(!Number.isFinite(Number(v[k]))||Number(v[k])<0))throw Error('Branch financial values must be non-negative numbers.');
 Object.assign(b,{monthlyRevenue:money(v.monthlyRevenue??b.monthlyRevenue),monthlyRent:money(v.monthlyRent??b.monthlyRent),monthlyPayroll:money(v.monthlyPayroll??b.monthlyPayroll),monthlyOperatingCost:money(v.monthlyOperatingCost??b.monthlyOperatingCost),economicsUpdated:today()});
 log('Branch economics updated',b.name);persistView('Branch economics updated.');return b;
}
function branchMonthly(date){
 const m=ensure(),month=String(date).slice(0,7);let posted=0,failed=0;
 m.branches.filter(b=>b.status==='Active'&&b.economicsMonth!==month).forEach(b=>{
  const revenue=money(b.monthlyRevenue),cost=money((Number(b.monthlyRent)||0)+(Number(b.monthlyPayroll)||0)+(Number(b.monthlyOperatingCost)||0));
  if(revenue&&b.revenuePostedMonth!==month){if(!postCompanyEntry('Branch revenue — '+b.name,'Branch revenue',revenue,date,{branchId:b.id,financialMonth:month})){failed++;return;}b.revenuePostedMonth=month;}
  if(cost&&b.costPostedMonth!==month){if(!postCompanyEntry('Branch operating costs — '+b.name,'Branch operating expense',-cost,date,{branchId:b.id,financialMonth:month})){failed++;return;}b.costPostedMonth=month;}
  b.economicsMonth=month;b.lastFinancials={month,revenue,cost,operatingProfit:money(revenue-cost)};posted++;
 });
 return {posted,failed};
}
function addContractPayment(id,payment){
 const m=ensure(),c=m.contracts.find(x=>x.id===id);if(!c||c.status!=='Active')throw Error('Choose an active contract.');
 const amount=money(payment.amount);if(!(amount>0)||!/^\d{4}-\d{2}-\d{2}$/.test(payment.dueDate))throw Error('A positive amount and valid due date are required.');
 c.payments=Array.isArray(c.payments)?c.payments:[];c.payments.push({id:uid('PAY'),dueDate:payment.dueDate,amount,direction:payment.direction==='in'?'in':'out',milestone:String(payment.milestone||'Contract payment'),status:'Scheduled'});
 log('Contract payment scheduled',c.title+' · '+payment.dueDate+' · '+amount);persistView('Contract payment scheduled.');return c.payments[c.payments.length-1];
}
function contractFinance(date){
 const m=ensure();let paid=0,failed=0;
 m.contracts.forEach(c=>(c.payments||[]).filter(p=>p.status==='Scheduled'&&p.dueDate<=date).forEach(p=>{
  const sign=p.direction==='in'?1:-1,amount=money(p.amount)*sign;
  if(!postCompanyEntry(p.milestone+' — '+c.title,'Contract settlement',amount,date,{contractId:c.id,paymentId:p.id,direction:p.direction})){failed++;return;}
  p.status='Paid';p.paidDate=date;paid++;
 }));
 return {paid,failed};
}
function setBoardThreshold(amount){const n=money(amount);if(n<0)throw Error('Threshold cannot be negative.');ensure().approvalThreshold=n;log('Board approval threshold changed',n);persistView('Board threshold updated.');return n;}
function approveCapitalRequest(request){
 const m=ensure(),amount=money(request.amount);if(!(amount>0))throw Error('Enter a positive capital request.');
 const votes=Array.isArray(request.votes)?request.votes:[];
 const yes=votes.filter(v=>v.choice==='yes').length,no=votes.filter(v=>v.choice==='no').length;
 const quorum=Math.max(1,Math.ceil((Number(request.boardSize)||3)/2));
 const outcome=yes>=quorum&&yes>no?'Approved':(no>=quorum&&no>=yes?'Rejected':'Deferred');
 const d={id:uid('BRD'),title:String(request.title||'Capital authorization'),category:'Capital allocation',resolution:String(request.description||''),amount,yesVotes:yes,noVotes:no,quorum,outcome,date:today()};
 m.boardDecisions.unshift(d);log('Capital authorization vote',d.title+' — '+outcome);persistView('Board vote recorded: '+outcome+'.');return d;
}
function postApprovedCapital(decisionId,description,departmentId){
 const m=ensure(),d=m.boardDecisions.find(x=>x.id===decisionId);if(!d||d.outcome!=='Approved'||!(d.amount>0))throw Error('An approved capital resolution is required.');
 if(d.posted)throw Error('This authorization has already been spent.');
 const dept=m.departments.find(x=>x.id===departmentId);if(!dept||dept.status!=='Active')throw Error('Choose an active department.');
 const year=today().slice(0,4);dept.budgetSpent=dept.budgetSpent||{};const spent=money(dept.budgetSpent[year]);
 if(money(dept.budget)-spent<d.amount)throw Error('Department budget is insufficient.');
 if(!postCompanyEntry(description||d.title,'Board-authorized capital',-d.amount,today(),{departmentId:dept.id,boardDecisionId:d.id} ))throw Error('Company cash is insufficient or payment failed.');
 dept.budgetSpent[year]=money(spent+d.amount);d.posted=true;d.postedDate=today();log('Board capital released',d.title+' · '+d.amount);persistView('Board-authorized capital expenditure paid.');return d;
}
function compliancePenalty(item,date){
 const amount=money(item.penaltyAmount||0);if(!amount||item.penaltyPosted)return true;
 if(!postCompanyEntry('Regulatory penalty — '+item.name,'Compliance penalty',-amount,date,{complianceId:item.id}))return false;
 item.penaltyPosted=true;item.penaltyDate=date;item.status='Non-compliant';return true;
}

function subsidiaryFinancials(id,values){
 const m=ensure(),x=m.subsidiaries.find(a=>a.id===id);if(!x)throw Error('Subsidiary not found.');
 const v=values||{},book={};
 for(const k of ['revenue','expenses','assets','liabilities']){const n=money(v[k]??x.financials?.[k]??0);if(n<0)throw Error('Subsidiary financial values cannot be negative.');book[k]=n;}
 book.netIncome=money(book.revenue-book.expenses);book.equity=money(book.assets-book.liabilities);book.period=String(v.period||today().slice(0,7));
 x.financials=book;log('Subsidiary accounts updated',x.name+' · '+book.period);persistView('Subsidiary accounts updated.');return book;
}

function managementReport(date){
 const m=ensure(),year=String(date||today()).slice(0,4),month=String(date||today()).slice(0,7);
 const departments=m.departments.map(d=>{const spend=money(d.budgetSpent?.[year]);return {id:d.id,name:d.name,budget:money(d.budget),spent:spend,remaining:money(Math.max(0,Number(d.budget)-spend)),variance:money(Number(d.budget)-spend)};});
 const branches=m.branches.map(b=>({...b,month: b.lastFinancials?.month===month?b.lastFinancials:null}));
 const contracts=m.contracts.map(c=>({id:c.id,title:c.title,value:money(c.value),paid:money((c.payments||[]).filter(p=>p.status==='Paid').reduce((a,p)=>a+(p.direction==='in'?1:-1)*Number(p.amount),0)),outstanding:(c.payments||[]).filter(p=>p.status==='Scheduled').length}));
 const subsidiaryOwnership=m.subsidiaries.reduce((a,s)=>a+money(s.ownership),0),subsidiaryPnl=m.subsidiaries.filter(s=>s.status==='Active').reduce((a,s)=>{const f=s.financials||{};a.revenue+=money(f.revenue);a.expenses+=money(f.expenses);a.netIncome+=money(f.netIncome??(Number(f.revenue||0)-Number(f.expenses||0)));a.ownedNetIncome+=money(f.netIncome??(Number(f.revenue||0)-Number(f.expenses||0)))*money(s.ownership)/100;return a;},{revenue:0,expenses:0,netIncome:0,ownedNetIncome:0});
 return {date:date||today(),year,month,departments,branches,contracts,subsidiaries:m.subsidiaries.map(s=>({name:s.name,ownership:s.ownership,jurisdiction:s.jurisdiction,financials:s.financials||null})),consolidation:{subsidiaryCount:m.subsidiaries.filter(s=>s.status==='Active').length,ownershipWeightedPercent:money(subsidiaryOwnership),subsidiaryRevenue:money(subsidiaryPnl.revenue),subsidiaryExpenses:money(subsidiaryPnl.expenses),subsidiaryNetIncome:money(subsidiaryPnl.netIncome),parentShareOfSubsidiaryIncome:money(subsidiaryPnl.ownedNetIncome)},compliance:{total:m.compliance.length,overdue:m.compliance.filter(x=>x.dueDate&&x.dueDate<=(date||today())&&x.status!=='Compliant').length,nonCompliant:m.compliance.filter(x=>x.status==='Non-compliant').length}};
}

function runAudit(){
 const m=ensure(),tests=[],add=(name,ok)=>tests.push({name,ok:!!ok});
 add('Department identifiers are unique',new Set(m.departments.map(x=>x.id)).size===m.departments.length&&m.departments.every(x=>x.id&&x.name));
 add('Department budgets, spending and headcounts are valid',m.departments.every(x=>Number.isFinite(Number(x.budget))&&Number(x.budget)>=0&&Number.isInteger(Number(x.headcount))&&Number(x.headcount)>=0&&Object.values(x.budgetSpent||{}).every(v=>Number.isFinite(Number(v))&&Number(v)>=0)&&Object.entries(x.budgetSpent||{}).every(([year,v])=>Number(v)<=Number(x.budget)+0.000001)));
 add('Executive appointments and reporting lines are valid',m.executives.every(x=>x.id&&x.name&&x.role&&Number(x.annualCompensation)>=0&&(!x.reportsTo||m.executives.some(p=>p.id===x.reportsTo&&p.id!==x.id))));
 add('Department hierarchy has valid parent links and no cycles',m.departments.every(x=>{const seen=new Set([x.id]);let p=x;while(p.parentId){if(seen.has(p.parentId))return false;seen.add(p.parentId);p=m.departments.find(d=>d.id===p.parentId);if(!p)return false;}return true;}));
 add('Branch and subsidiary records are valid',m.branches.every(x=>x.id&&x.name&&x.location)&&m.subsidiaries.every(x=>x.id&&x.name&&x.jurisdiction&&x.ownership>0&&x.ownership<=100));
 add('Board decisions have outcomes',m.boardDecisions.every(x=>x.id&&x.title&&x.resolution&&['Approved','Rejected','Deferred'].includes(x.outcome)));
 add('Contract dates and values are valid',m.contracts.every(x=>x.id&&x.title&&x.counterparty&&Number(x.value)>=0&&(!x.endDate||x.endDate>=x.startDate)));
 add('Compliance register is valid',m.compliance.every(x=>x.id&&x.name&&x.owner&&['Pending review','In progress','Compliant','At risk','Non-compliant'].includes(x.status)&&Number(x.penaltyAmount||0)>=0));
 add('Branch economics are non-negative and monthly records are valid',m.branches.every(x=>['monthlyRevenue','monthlyRent','monthlyPayroll','monthlyOperatingCost'].every(k=>Number(x[k]||0)>=0)));
 add('Contract payment schedules are valid',m.contracts.every(x=>(x.payments||[]).every(p=>p.id&&p.dueDate&&Number(p.amount)>0&&['in','out'].includes(p.direction)&&['Scheduled','Paid'].includes(p.status))));
 add('Board capital authorizations have valid vote outcomes',m.boardDecisions.every(x=>!x.amount||(Number(x.amount)>0&&['Approved','Rejected','Deferred'].includes(x.outcome))));
 add('Company management save serialization',(()=>{try{JSON.stringify(active);return true}catch(e){return false}})());
 const result={date:today(),passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};m.audit=result;return result;
}

function monthlyPayroll(date){
 const m=ensure();if(!m)return 0;
 const month=String(date).slice(0,7),days=new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7)),0)).getUTCDate();
 return Math.round(m.executives.filter(e=>e.status==='Active'&&e.lastPaidMonth!==month).reduce((sum,e)=>{
  const annual=Math.max(0,Number(e.annualCompensation)||0),appointed=e.appointed||active.startDate||date;
  if(appointed>date)return sum;
  const start=appointed.slice(0,7)===month?Number(appointed.slice(8,10)):1;
  const payable=Math.max(0,days-start+1);
  return sum+annual/12*payable/days;
 },0)*100)/100;
}
function postMonthly(date){
 const m=ensure();if(!m)return {paid:0,failed:0};
 const month=String(date).slice(0,7);let paid=0,failed=0;
 m.executives.filter(e=>e.status==='Active'&&e.lastPaidMonth!==month).forEach(e=>{
  const annual=Math.max(0,Number(e.annualCompensation)||0),appointed=e.appointed||active.startDate||date;
  if(appointed>date)return;
  const days=new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7)),0)).getUTCDate();
  const start=appointed.slice(0,7)===month?Number(appointed.slice(8,10)):1;
  const amount=Math.round(annual/12*Math.max(0,days-start+1)/days*100)/100;
  if(amount<=0){e.lastPaidMonth=month;return;}
  if(typeof window.post!=='function'||!window.post('Executive compensation — '+e.name,'Executive payroll',-amount,date,'payroll',{executiveId:e.id,department:e.department,phase4:true})){failed++;return;}
  e.lastPaidMonth=month;paid+=amount;log('Executive compensation paid',e.name+' · '+amount);
 });
 return {paid:Math.round(paid*100)/100,failed};
}
function stepDay(date){
 const m=ensure();if(!m||m.lastProcessedDate===date)return {skipped:true};
 m.contracts.forEach(c=>{if(c.status==='Active'&&c.endDate&&c.endDate<date){c.status='Expired';log('Contract expired',c.title);}});
 const month=String(date).slice(0,7),monthStart=month+'-01';
 let branchResult={posted:0,failed:0},contractResult={paid:0,failed:0},penalties=0;
 if(date.slice(8,10)==='01'||!m.lastBranchMonth){branchResult=branchMonthly(date);m.lastBranchMonth=month;}
 contractResult=contractFinance(date);
 m.compliance.forEach(x=>{if(x.dueDate&&x.dueDate<date&&x.status!=='Compliant'&&!x.penaltyPosted&&Number(x.penaltyAmount)>0){if(compliancePenalty(x,date))penalties++;}});
 m.lastProcessedDate=date;return {branchResult,contractResult,penalties};
}
function installHooks(){
 const priorRender=window.render;
 if(typeof priorRender==='function'&&!priorRender.__phase4Wrapped){const wrapped=function(...args){const out=priorRender.apply(this,args);if(active){ensure();render();}return out;};wrapped.__phase4Wrapped=true;window.render=wrapped;}
 const priorDay=window.simulateLifeDay;
 if(typeof priorDay==='function'&&!priorDay.__phase4Wrapped){const wrapped=function(...args){const out=priorDay.apply(this,args);stepDay(args[0]||today());return out;};wrapped.__phase4Wrapped=true;window.simulateLifeDay=wrapped;}
}
function init(){installHooks();if(active){ensure();render();}}
window.Phase4Company={version:'4.1.0',ensure,render,runAudit,stepDay,monthlyPayroll,postMonthly,spendDepartmentBudget,addDepartment,addExecutive,addBranch,addSubsidiary,addBoardDecision,addContract,addCompliance,restructure,branchEconomics,branchMonthly,subsidiaryFinancials,addContractPayment,contractFinance,setBoardThreshold,approveCapitalRequest,postApprovedCapital,managementReport};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();