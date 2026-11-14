(function(){
'use strict';
const q=id=>document.getElementById(id), clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=v=>typeof fmt==='function'?fmt(Number(v)||0):(Number(v)||0).toLocaleString();
const dateNow=()=>active&&active.date||new Date().toISOString().slice(0,10);
function ensure(){
 if(!active||!active.founder)return null;
 const f=active.founder;
 f.personalAssets=Array.isArray(f.personalAssets)?f.personalAssets:[];
 f.relationships=Array.isArray(f.relationships)?f.relationships:[];
 f.personalDebt=Math.max(0,Number(f.personalDebt)||0);
 f.wellbeing=Object.assign({health:90,sleep:7.5,fitness:50,mental:80,energy:75,lastSimulatedDate:null},f.wellbeing||{});
 f.personalFinance=Object.assign({ledger:[],recurring:[],investments:[],lastMonthlyDate:null,accounts:[{id:'cash',name:'Personal cash',type:'Cash',balance:Number(f.personalCash)||0}]},f.personalFinance||{});
 f.personalFinance.ledger=Array.isArray(f.personalFinance.ledger)?f.personalFinance.ledger:[];
 f.personalFinance.recurring=Array.isArray(f.personalFinance.recurring)?f.personalFinance.recurring:[];
 f.personalFinance.investments=Array.isArray(f.personalFinance.investments)?f.personalFinance.investments:[];
 f.personalFinance.accounts=Array.isArray(f.personalFinance.accounts)?f.personalFinance.accounts:[];
 if(!f.personalFinance.accounts.length)f.personalFinance.accounts.push({id:'cash',name:'Personal cash',type:'Cash',balance:Number(f.personalCash)||0});
 f.dailyRoutine=Object.assign({sleepHours:7.5,workHours:9,exerciseHours:.5,leisureHours:1.5,daysOffPerWeek:1},f.dailyRoutine||{});
 f.personalCalendar=Array.isArray(f.personalCalendar)?f.personalCalendar:[];
 f.reputation=Object.assign({publicRecognition:5,industryReputation:10,privacy:80,mediaAttention:5,controversy:0},f.reputation||{});
 f.succession=Object.assign({retirementAge:65,status:'Active',heirs:[],estateNotes:'',lastReviewed:null},f.succession||{});
 f.lifestyle=Object.assign({homeStatus:'Not specified',securityLevel:'Standard',monthlyLifestyleCost:0},f.lifestyle||{});
 f.phase3=Object.assign({version:'3.0.2',lastDay:null},f.phase3||{});
 f.phase3.version='3.0.2';
 syncCashAccount(f);
 return f;
}
function syncCashAccount(f){
 const accounts=f.personalFinance.accounts;
 let cashAccount=accounts.find(a=>a&&((a.id==='cash')||String(a.type||'').toLowerCase()==='cash'));
 if(!cashAccount){cashAccount={id:'cash',name:'Personal cash',type:'Cash',balance:0};accounts.unshift(cashAccount);}
 cashAccount.balance=Number(f.personalCash)||0;
 return cashAccount;
}
function record(type,amount,category,description,date,source){
 const f=ensure();if(!f)return;
 amount=Math.round((Number(amount)||0)*100)/100;
 if(type==='Debt repayment')amount=Math.min(amount,Number(f.personalDebt||0),Number(f.personalCash||0));
 if(amount<=0)return;
 date=date||dateNow();const id='P3TX-'+date+'-'+(f.personalFinance.ledger.length+1);
 if(f.personalFinance.ledger.some(x=>x.id===id))return;
 f.personalFinance.ledger.unshift({id:id,date:date,type:type,amount:amount,category:category||'Other',description:description||'',source:source||'manual'});
 if(type==='Income')f.personalCash=Number(f.personalCash||0)+amount;
 else if(type==='Expense'){const paid=Math.min(Number(f.personalCash||0),amount);f.personalCash-=paid;f.personalDebt=Number(f.personalDebt||0)+(amount-paid);}
 else if(type==='Debt repayment'){f.personalCash-=amount;f.personalDebt-=amount;}
 syncCashAccount(f);
}
function addUI(){
 const page=q('page-personal');if(!page||q('phase3-personal'))return;
 const root=document.createElement('div');root.id='phase3-personal';
 root.innerHTML='<style>'+
 '#phase3-personal{margin-top:18px;display:grid;gap:14px}#phase3-personal .p3grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'+
 '#phase3-personal .p3card{background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:15px;min-width:0}#phase3-personal .p3wide{grid-column:1/-1}'+
 '#phase3-personal .p3head{display:flex;justify-content:space-between;gap:8px;margin-bottom:12px}#phase3-personal .p3muted{color:var(--muted);font-size:11px}'+
 '#phase3-personal .p3stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#phase3-personal .p3stat{background:var(--panel2);border-radius:9px;padding:10px}'+
 '#phase3-personal .p3stat span{display:block;color:var(--muted);font-size:10px}#phase3-personal .p3stat strong{display:block;font-size:17px;margin-top:4px;overflow-wrap:anywhere}'+
 '#phase3-personal .p3row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px}#phase3-personal .p3row:last-child{border:0}'+
 '#phase3-personal .p3meter{height:7px;background:var(--line);border-radius:9px;overflow:hidden;margin:6px 0 10px}#phase3-personal .p3meter i{display:block;height:100%;background:var(--green)}'+
 '#phase3-personal .p3actions{display:flex;gap:7px;flex-wrap:wrap}#phase3-personal .p3actions .btn{font-size:11px;padding:8px 10px}#phase3-personal .p3empty{color:var(--muted);font-size:12px;padding:12px 0}'+
 '@media(max-width:760px){#phase3-personal .p3grid{grid-template-columns:1fr}#phase3-personal .p3wide{grid-column:auto}#phase3-personal .p3stats{grid-template-columns:repeat(2,minmax(0,1fr))}}'+
 '</style><div class="p3grid">'+
 '<section class="p3card p3wide"><div class="p3head"><b>Founder wellbeing</b><span class="p3muted">DAILY CONDITION</span></div><div id="p3wellbeing"></div><div class="p3actions"><button class="btn" onclick="Phase3Founder.openRoutine()">Set daily routine</button><button class="btn" onclick="Phase3Founder.openWellbeing()">Update wellbeing</button></div></section>'+
 '<section class="p3card"><div class="p3head"><b>Personal finance</b><span class="p3muted">SEPARATE FROM COMPANY</span></div><div id="p3finance"></div><div class="p3actions"><button class="btn primary" onclick="Phase3Founder.openTransaction()">＋ Record transaction</button><button class="btn" onclick="Phase3Founder.openRecurring()">＋ Recurring cash flow</button><button class="btn" onclick="Phase3Founder.openInvestment()">＋ Investment</button></div></section>'+
 '<section class="p3card"><div class="p3head"><b>Personal calendar</b><span class="p3muted">LIFE & COMMITMENTS</span></div><div id="p3calendar"></div><div class="p3actions"><button class="btn" onclick="Phase3Founder.openEvent()">＋ Add event</button></div></section>'+
 '<section class="p3card"><div class="p3head"><b>Properties & vehicles</b><span class="p3muted">FOUNDER-OWNED</span></div><div id="p3assets"></div><div class="p3actions"><button class="btn" onclick="Phase3Founder.openAsset()">＋ Add asset</button></div></section>'+
 '<section class="p3card"><div class="p3head"><b>Public reputation</b><span class="p3muted">PERSONAL PROFILE</span></div><div id="p3reputation"></div><div class="p3actions"><button class="btn" onclick="Phase3Founder.openReputation()">Manage public profile</button></div></section>'+
 '<section class="p3card"><div class="p3head"><b>Family & relationships</b><span class="p3muted">PERSONAL NETWORK</span></div><div id="p3relationships"></div><div class="p3actions"><button class="btn" onclick="Phase3Founder.openRelationship()">＋ Add relationship</button></div></section>'+
 '<section class="p3card p3wide"><div class="p3head"><b>Legacy & succession</b><span class="p3muted">LONG-TERM PLANNING</span></div><div id="p3succession"></div><div class="p3actions"><button class="btn" onclick="Phase3Founder.openSuccession()">Manage succession plan</button></div></section>'+
 '<section class="p3card p3wide"><div class="p3head"><b>Personal transaction history</b><span class="p3muted">AUDITABLE LEDGER</span></div><div id="p3ledger"></div></section></div>';
 page.appendChild(root);
}
function render(){
 const f=ensure();addUI();if(!f)return;
 const w=f.wellbeing,r=f.dailyRoutine,fin=f.personalFinance,rep=f.reputation,suc=f.succession;
 const assets=f.personalAssets,assetValue=assets.reduce((a,x)=>a+Number(x.currentValue||0),0),investmentValue=fin.investments.reduce((a,x)=>a+Number(x.value||0),0),net=Number(f.personalCash||0)+assetValue+investmentValue-Number(f.personalDebt||0);
 if(q('passets'))q('passets').textContent=cash(assetValue+investmentValue);if(q('pnetworth'))q('pnetworth').textContent=cash(net);if(q('pstress'))q('pstress').textContent=Math.round(f.stress)+'/100';
 const month=dateNow().slice(0,7),inflow=fin.ledger.filter(x=>x.date.slice(0,7)===month&&x.type==='Income').reduce((a,x)=>a+x.amount,0),outflow=fin.ledger.filter(x=>x.date.slice(0,7)===month&&x.type==='Expense').reduce((a,x)=>a+x.amount,0);
 const meter=(label,val)=>'<div class="p3row"><span>'+label+'</span><b>'+Math.round(val)+'/100</b></div><div class="p3meter"><i style="width:'+clamp(val)+'%"></i></div>';
 q('p3wellbeing').innerHTML='<div class="p3stats">'+[['HEALTH',w.health],['MENTAL',w.mental],['ENERGY',w.energy],['FITNESS',w.fitness],['SLEEP',Number(r.sleepHours).toFixed(1)+' h'],['STRESS',f.stress]].map(x=>'<div class="p3stat"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join('')+'</div><div class="p3muted" style="margin-top:9px">Routine: '+r.workHours+'h work · '+r.exerciseHours+'h exercise · '+r.leisureHours+'h leisure · '+r.daysOffPerWeek+' day(s) off/week</div>';
 q('p3finance').innerHTML='<div class="p3stats"><div class="p3stat"><span>PERSONAL CASH</span><strong>'+cash(f.personalCash)+'</strong></div><div class="p3stat"><span>PERSONAL DEBT</span><strong>'+cash(f.personalDebt)+'</strong></div><div class="p3stat"><span>NET WORTH</span><strong>'+cash(net)+'</strong></div></div><div class="p3row"><span>This month · income</span><b>'+cash(inflow)+'</b></div><div class="p3row"><span>This month · expenses</span><b>'+cash(outflow)+'</b></div><div class="p3row"><span>Recurring commitments</span><b>'+fin.recurring.filter(x=>x.active!==false).length+'</b></div>';
 const events=f.personalCalendar.filter(x=>x.status!=='Completed').sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,5);
 q('p3calendar').innerHTML=events.length?events.map(e=>'<div class="p3row"><span><b>'+safe(e.title)+'</b><br><span class="p3muted">'+safe(e.type)+' · '+safe(e.date)+'</span></span><span>'+safe(e.priority||'Normal')+'</span></div>').join(''):'<div class="p3empty">No upcoming personal commitments.</div>';
 q('p3assets').innerHTML=(assets.length?assets.slice(0,7).map(a=>'<div class="p3row"><span><b>'+safe(a.name)+'</b><br><span class="p3muted">'+safe(a.type)+(a.location?' · '+safe(a.location):'')+'</span></span><b>'+cash(a.currentValue)+'</b></div>').join(''):'<div class="p3empty">No founder-owned assets recorded.</div>')+(fin.investments.length?fin.investments.map(a=>'<div class="p3row"><span><b>'+safe(a.name)+'</b><br><span class="p3muted">Portfolio · '+safe(a.type)+'</span></span><b>'+cash(a.value)+'</b></div>').join(''):'');
 q('p3reputation').innerHTML=[['Public recognition',rep.publicRecognition],['Industry reputation',rep.industryReputation],['Privacy protection',rep.privacy],['Media attention',rep.mediaAttention],['Controversy exposure',rep.controversy]].map(x=>meter(x[0],x[1])).join('');
 q('p3relationships').innerHTML=f.relationships.length?f.relationships.slice(0,6).map(x=>'<div class="p3row"><span><b>'+safe(x.name)+'</b><br><span class="p3muted">'+safe(x.type)+' · '+safe(x.occupation||'Occupation not specified')+'</span></span><span>'+safe(x.status||'Known')+'</span></div>').join(''):'<div class="p3empty">No relationships recorded.</div>';
 q('p3succession').innerHTML='<div class="p3stats"><div class="p3stat"><span>FOUNDER AGE</span><strong>'+(Number(f.age)||'—')+'</strong></div><div class="p3stat"><span>RETIREMENT AGE</span><strong>'+suc.retirementAge+'</strong></div><div class="p3stat"><span>STATUS</span><strong>'+safe(suc.status)+'</strong></div><div class="p3stat"><span>NAMED HEIRS</span><strong>'+suc.heirs.length+'</strong></div></div><div class="p3row"><span>Estate notes</span><span>'+safe(suc.estateNotes||'Not configured')+'</span></div>';
 const tx=fin.ledger.slice(0,8);q('p3ledger').innerHTML=tx.length?tx.map(x=>'<div class="p3row"><span><b>'+safe(x.description)+'</b><br><span class="p3muted">'+safe(x.date)+' · '+safe(x.category)+' · '+safe(x.source)+'</span></span><b style="color:'+(x.type==='Income'?'var(--green)':x.type==='Transfer'?'var(--blue)':'var(--red)')+'">'+(x.type==='Income'?'+':x.type==='Transfer'?'↔':'−')+cash(x.amount)+'</b></div>').join(''):'<div class="p3empty">No personal transactions recorded yet.</div>';
}
function persistView(message){if(typeof persist==='function')persist();render();if(message&&typeof toast==='function')toast(message);}
function form(title,html,saveFn){
 show(title,html);const el=document.getElementById('p3form');if(!el)throw Error('Form could not be opened.');
 el.onsubmit=function(e){e.preventDefault();try{saveFn();}catch(err){console.error(err);toast(err.message||'Could not save this record.');}};
}
function openTransaction(){
 const cur=active.company.currency||'USD';
 form('Record personal transaction','<form id="p3form"><div class="field"><label>Type</label><select id="p3type"><option>Income</option><option>Expense</option><option>Debt repayment</option></select></div><div class="formgrid"><div class="field"><label>Amount ('+safe(cur)+')</label><input id="p3amount" type="number" min=".01" step=".01" required></div><div class="field"><label>Category</label><select id="p3category"><option>Salary</option><option>Dividend</option><option>Investment</option><option>Housing</option><option>Food</option><option>Transport</option><option>Healthcare</option><option>Education</option><option>Entertainment</option><option>Travel</option><option>Tax</option><option>Insurance</option><option>Other</option></select></div></div><div class="field"><label>Description</label><input id="p3description" required></div><button class="btn primary">Save transaction</button></form>',function(){
 const type=q('p3type').value,amount=Number(q('p3amount').value);if(!(amount>0))throw Error('Enter a positive amount.');
 if(type==='Debt repayment'&&amount>active.founder.personalCash)throw Error('Insufficient personal cash.');\n if(type==='Debt repayment'&&amount>active.founder.personalDebt)throw Error('Repayment cannot exceed outstanding personal debt.');
 record(type,amount,q('p3category').value,q('p3description').value);if(typeof addLog==='function')addLog('Founder recorded personal '+type.toLowerCase()+': '+q('p3description').value+'.');close();persistView('Personal transaction recorded.');
 });
}
function openRecurring(){
 form('Add recurring personal expense','<form id="p3form"><div class="field"><label>Expense name</label><input id="p3rname" required placeholder="Rent, insurance, staff..."></div><div class="formgrid"><div class="field"><label>Amount</label><input id="p3ramount" type="number" min=".01" step=".01" required></div><div class="field"><label>Frequency</label><select id="p3freq"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annually</option></select></div></div><div class="field"><label>Cash flow type</label><select id="p3rtype"><option>Expense</option><option>Income</option></select></div><div class="field"><label>Category</label><input id="p3rcat" value="Lifestyle"></div><button class="btn primary">Add recurring cash flow</button></form>',function(){
 const f=ensure(),amount=Number(q('p3ramount').value);if(!(amount>0))throw Error('Enter a positive amount.');
 f.personalFinance.recurring.push({id:'P3RE-'+(f.personalFinance.recurring.length+1),name:q('p3rname').value,amount:amount,frequency:q('p3freq').value,category:q('p3rcat').value,type:q('p3rtype').value,active:true,created:dateNow(),lastCharged:null});close();persistView('Recurring personal cash flow added.');
 });
}
function openEvent(){
 form('Add personal calendar event','<form id="p3form"><div class="field"><label>Event title</label><input id="p3etitle" required></div><div class="formgrid"><div class="field"><label>Date</label><input id="p3edate" type="date" value="'+dateNow()+'" required></div><div class="field"><label>Event type</label><select id="p3etype"><option>Family</option><option>Personal</option><option>Health</option><option>Travel</option><option>Social</option><option>Company</option><option>Education</option><option>Other</option></select></div></div><div class="formgrid"><div class="field"><label>Duration (hours)</label><input id="p3eduration" type="number" min=".25" max="24" step=".25" value="1"></div><div class="field"><label>Priority</label><select id="p3epriority"><option>Normal</option><option>High</option><option>Critical</option><option>Optional</option></select></div></div><button class="btn primary">Save event</button></form>',function(){
 const f=ensure(),date=q('p3edate').value;if(!date)throw Error('Choose a date.');
 f.personalCalendar.push({id:'P3EV-'+(f.personalCalendar.length+1),title:q('p3etitle').value,date:date,type:q('p3etype').value,duration:Number(q('p3eduration').value),priority:q('p3epriority').value,status:'Scheduled'});close();persistView('Personal event scheduled.');
 });
}
function openRoutine(){
 const r=ensure().dailyRoutine;
 form('Daily routine & work-life balance','<form id="p3form"><div class="formgrid"><div class="field"><label>Sleep hours</label><input id="p3sleep" type="number" min="0" max="14" step=".5" value="'+r.sleepHours+'"></div><div class="field"><label>Work hours</label><input id="p3work" type="number" min="0" max="20" step=".5" value="'+r.workHours+'"></div><div class="field"><label>Exercise hours</label><input id="p3exercise" type="number" min="0" max="8" step=".25" value="'+r.exerciseHours+'"></div><div class="field"><label>Leisure hours</label><input id="p3leisure" type="number" min="0" max="12" step=".25" value="'+r.leisureHours+'"></div><div class="field"><label>Days off per week</label><input id="p3off" type="number" min="0" max="7" step="1" value="'+r.daysOffPerWeek+'"></div></div><p class="hint">Routine affects daily energy and fitness. Phase 2 remains authoritative for stress, health and mental-wellbeing simulation.</p><button class="btn primary">Save routine</button></form>',function(){
 const f=ensure(),r=f.dailyRoutine;r.sleepHours=clamp(q('p3sleep').value,0,14);r.workHours=clamp(q('p3work').value,0,20);r.exerciseHours=clamp(q('p3exercise').value,0,8);r.leisureHours=clamp(q('p3leisure').value,0,12);r.daysOffPerWeek=clamp(q('p3off').value,0,7);close();persistView('Daily routine updated.');
 });
}
function openWellbeing(){
 const w=ensure().wellbeing;
 form('Update founder wellbeing','<form id="p3form"><div class="formgrid"><div class="field"><label>Health (0–100)</label><input id="p3health" type="number" min="0" max="100" value="'+w.health+'"></div><div class="field"><label>Mental wellbeing (0–100)</label><input id="p3mental" type="number" min="0" max="100" value="'+w.mental+'"></div><div class="field"><label>Fitness (0–100)</label><input id="p3fitness" type="number" min="0" max="100" value="'+w.fitness+'"></div><div class="field"><label>Energy (0–100)</label><input id="p3energy" type="number" min="0" max="100" value="'+w.energy+'"></div><div class="field"><label>Stress (0–100)</label><input id="p3stress" type="number" min="0" max="100" value="'+ensure().stress+'"></div></div><button class="btn primary">Update condition</button></form>',function(){
 const f=ensure();f.wellbeing.health=clamp(q('p3health').value);f.wellbeing.mental=clamp(q('p3mental').value);f.wellbeing.fitness=clamp(q('p3fitness').value);f.wellbeing.energy=clamp(q('p3energy').value);f.stress=clamp(q('p3stress').value);close();persistView('Founder wellbeing updated.');
 });
}
function openReputation(){
 const r=ensure().reputation;
 form('Manage personal public profile','<form id="p3form"><div class="formgrid"><div class="field"><label>Public recognition</label><input id="p3recognition" type="number" min="0" max="100" value="'+r.publicRecognition+'"></div><div class="field"><label>Industry reputation</label><input id="p3industry" type="number" min="0" max="100" value="'+r.industryReputation+'"></div><div class="field"><label>Privacy protection</label><input id="p3privacy" type="number" min="0" max="100" value="'+r.privacy+'"></div><div class="field"><label>Media attention</label><input id="p3media" type="number" min="0" max="100" value="'+r.mediaAttention+'"></div></div><p class="hint">Company performance, public appearances and controversies can influence these values over time.</p><button class="btn primary">Save public profile</button></form>',function(){
 const r=ensure().reputation;r.publicRecognition=clamp(q('p3recognition').value);r.industryReputation=clamp(q('p3industry').value);r.privacy=clamp(q('p3privacy').value);r.mediaAttention=clamp(q('p3media').value);close();persistView('Public profile updated.');
 });
}
function openSuccession(){
 const s=ensure().succession;
 form('Legacy & succession planning','<form id="p3form"><div class="formgrid"><div class="field"><label>Target retirement age</label><input id="p3retire" type="number" min="40" max="100" value="'+s.retirementAge+'"></div><div class="field"><label>Founder status</label><select id="p3status"><option>Active</option><option>Planning retirement</option><option>Retired</option></select></div></div><div class="field"><label>Named heirs (comma separated)</label><input id="p3heirs" value="'+safe(s.heirs.join(', '))+'"></div><div class="field"><label>Estate and succession notes</label><textarea id="p3notes" rows="3">'+safe(s.estateNotes)+'</textarea></div><button class="btn primary">Save succession plan</button></form>',function(){
 const s=ensure().succession;s.retirementAge=clamp(q('p3retire').value,40,100);s.status=q('p3status').value;s.heirs=q('p3heirs').value.split(',').map(x=>x.trim()).filter(Boolean);s.estateNotes=q('p3notes').value;s.lastReviewed=dateNow();close();persistView('Succession plan saved.');
 });
}

function openAsset(){
 const f=ensure(),cur=active.company.currency||'USD';
 form('Add founder-owned asset','<form id="p3form"><div class="field"><label>Asset name</label><input id="p3aname" required></div><div class="formgrid"><div class="field"><label>Asset type</label><select id="p3atype"><option>Property</option><option>Vehicle</option><option>Investment</option><option>Art & collectibles</option><option>Aircraft / yacht</option><option>Other</option></select></div><div class="field"><label>Location</label><input id="p3alocation" placeholder="City, country"></div><div class="field"><label>Purchase cost ('+safe(cur)+')</label><input id="p3acost" type="number" min="0" value="0" required></div><div class="field"><label>Current value</label><input id="p3avalue" type="number" min="0" value="0" required></div><div class="field"><label>Monthly maintenance</label><input id="p3amaint" type="number" min="0" value="0"></div></div><p class="hint">Purchase is paid from founder personal cash, never company cash.</p><button class="btn primary">Record asset</button></form>',function(){
 const cost=Number(q('p3acost').value),value=Number(q('p3avalue').value);if(cost<0||value<0||cost>Number(f.personalCash||0))throw Error('Insufficient personal cash or invalid value.');
 f.personalCash-=cost;if(cost>0)record('Transfer',cost,'Asset acquisition','Purchased '+q('p3aname').value,dateNow(),'asset-purchase');f.personalAssets.push({id:'PA3-'+(f.personalAssets.length+1),name:q('p3aname').value,type:q('p3atype').value,location:q('p3alocation').value,purchasePrice:cost,currentValue:value,monthlyMaintenance:Number(q('p3amaint').value)||0,date:dateNow(),status:'Owned'});
 if(typeof addLog==='function')addLog('Founder acquired personal asset: '+q('p3aname').value+'.');close();persistView('Personal asset recorded.');
 });
}
function openRelationship(){
 const f=ensure();
 form('Add family member or relationship','<form id="p3form"><div class="formgrid"><div class="field"><label>Full name</label><input id="p3relname" required></div><div class="field"><label>Relationship</label><select id="p3reltype"><option>Parent</option><option>Sibling</option><option>Child</option><option>Spouse / Partner</option><option>Friend</option><option>Mentor</option><option>Colleague</option><option>Other</option></select></div><div class="field"><label>Date of birth</label><input id="p3reldob" type="date"></div><div class="field"><label>Occupation</label><input id="p3reljob"></div><div class="field"><label>Relationship quality (0–100)</label><input id="p3relquality" type="number" min="0" max="100" value="70"></div><div class="field"><label>Status</label><select id="p3relstatus"><option>Close</option><option>Good</option><option>Complicated</option><option>Distant</option><option>Estranged</option></select></div></div><button class="btn primary">Save relationship</button></form>',function(){
 const dob=q('p3reldob').value,age=dob?Math.max(0,Number(dateNow().slice(0,4))-Number(dob.slice(0,4))):null;
 f.relationships.push({id:'REL3-'+(f.relationships.length+1),name:q('p3relname').value,type:q('p3reltype').value,birthDate:dob||null,age:age,occupation:q('p3reljob').value,quality:clamp(q('p3relquality').value),status:q('p3relstatus').value,created:dateNow()});
 if(typeof addLog==='function')addLog('Founder added a personal relationship: '+q('p3relname').value+'.');close();persistView('Relationship recorded.');
 });
}
function openInvestment(){
 const f=ensure(),cur=active.company.currency||'USD';
 form('Add personal investment','<form id="p3form"><div class="field"><label>Investment name</label><input id="p3iname" required></div><div class="formgrid"><div class="field"><label>Investment type</label><select id="p3itype"><option>Stocks</option><option>Bonds</option><option>Mutual fund</option><option>ETF</option><option>Private equity</option><option>Other</option></select></div><div class="field"><label>Initial value ('+safe(cur)+')</label><input id="p3ivalue" type="number" min=".01" step=".01" required></div><div class="field"><label>Estimated monthly return (%)</label><input id="p3ireturn" type="number" min="-100" max="100" step=".01" value=".4"></div></div><p class="hint">Returns are simulation estimates, not guarantees. Principal is transferred from personal cash into an asset.</p><button class="btn primary">Add investment</button></form>',function(){
 const value=Number(q('p3ivalue').value);if(!(value>0)||value>Number(f.personalCash||0))throw Error('Insufficient personal cash or invalid value.');
 f.personalCash-=value;record('Transfer',value,'Investment purchase','Purchased '+q('p3iname').value,dateNow(),'investment-transfer');f.personalFinance.investments.push({id:'INV3-'+(f.personalFinance.investments.length+1),name:q('p3iname').value,type:q('p3itype').value,principal:value,value:value,monthlyReturn:Number(q('p3ireturn').value)||0,created:dateNow()});
 syncCashAccount(f);close();persistView('Personal investment added.');
 });
}

function stepDay(date){
 const f=ensure();if(!f||f.phase3.lastDay===date)return;
 const w=f.wellbeing,r=f.dailyRoutine,day=new Date(date+'T00:00:00Z').getUTCDay();
 const sleep=Number(r.sleepHours)||0,work=Number(r.workHours)||0,exercise=Number(r.exerciseHours)||0,off=(day===0&&r.daysOffPerWeek>=1)||(day===6&&r.daysOffPerWeek>=2);
 w.energy=clamp(Number(w.energy||75)+(sleep-7.5)*.45-Math.max(0,work-8)*.55+(off?2:0)+Math.min(.25,Number(r.leisureHours||0)*.06));
 w.fitness=clamp(Number(w.fitness||50)+(exercise>.5?.045:exercise>0?.015:-.012));w.sleep=sleep;
 // Phase 2 remains authoritative for stress, health and mental-wellbeing drift; Phase 3 adds routine-driven energy and fitness only.
 const month=date.slice(0,7),dayNum=Number(date.slice(8,10));
 if(dayNum===1&&f.personalFinance.lastMonthlyDate!==month){
  f.personalFinance.lastMonthlyDate=month;
  f.personalFinance.recurring.filter(x=>x.active!==false).forEach(x=>{const m=Number(month.slice(5,7)),freq=x.frequency||'monthly',due=freq==='monthly'||(freq==='quarterly'&&[1,4,7,10].includes(m))||(freq==='annual'&&m===1);if(due){record(x.type==='Income'?'Income':'Expense',x.amount,x.category||'Recurring',x.name,date,'recurring');x.lastCharged=month;}});
  f.personalAssets.forEach(a=>{const v=Number(a.currentValue)||0;if(a.type==='Vehicle')a.currentValue=Math.round(Math.max(0,v*.995)*100)/100;else if(a.type==='Property')a.currentValue=Math.round(Math.max(0,v*1.001)*100)/100;else if(a.type==='Investment')a.currentValue=Math.round(Math.max(0,v*1.003)*100)/100;if(Number(a.monthlyMaintenance)>0)record('Expense',a.monthlyMaintenance,'Maintenance',a.name+' maintenance',date,'asset-maintenance');});
  f.personalFinance.investments.forEach(i=>{i.value=Math.round(Math.max(0,Number(i.value||0)*(1+Number(i.monthlyReturn||0)/100))*100)/100;});
 }
 f.personalCalendar.forEach(e=>{if(e.status==='Scheduled'&&e.date<date)e.status='Missed';});
 f.relationships.forEach(rel=>{if(rel.birthDate&&rel.birthDate.slice(5)===date.slice(5)){const key='birthday-'+rel.id+'-'+date.slice(0,4);if(!f.personalCalendar.some(e=>e.id===key))f.personalCalendar.push({id:key,title:rel.name+' birthday',date:date,type:'Family',duration:2,priority:'High',status:'Scheduled'});}});
 if(Number(f.age||0)>=Number(f.succession.retirementAge||65)&&f.succession.status==='Active')f.succession.retirementEligible=true;
 syncCashAccount(f);f.phase3.lastDay=date;
}
const baseSim=typeof window.simulateLifeDay==='function'?window.simulateLifeDay:null;
if(baseSim)window.simulateLifeDay=function(date){baseSim(date);stepDay(date);};
if(typeof addPersonalAsset==='function')addPersonalAsset=openAsset;if(typeof addRelationship==='function')addRelationship=openRelationship;
const baseRender=typeof renderPersonal==='function'?renderPersonal:null;
if(baseRender)renderPersonal=function(){baseRender();render();};

function runAudit(){
 const f=ensure();if(!f)return {passed:0,failed:1,tests:[{name:'Active founder exists',ok:false,detail:'Create or load a campaign first.'}]};
 const tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail});
 const finite=(v)=>Number.isFinite(Number(v));
 const bounded=(v)=>finite(v)&&Number(v)>=0&&Number(v)<=100;
 const fin=f.personalFinance,ids=new Set(fin.ledger.map(x=>x.id));
 add('Unique personal transaction IDs',ids.size===fin.ledger.length,'Every ledger transaction has a unique ID.');
 add('Ledger record integrity',fin.ledger.every(x=>x&&x.id&&/^\\d{4}-\\d{2}-\\d{2}$/.test(String(x.date))&&finite(x.amount)&&Number(x.amount)>0&&['Income','Expense','Debt repayment','Transfer'].includes(x.type)),'Transactions have dates, positive finite amounts and supported types.');
 add('Personal cash account reconciliation',Math.abs(Number(fin.accounts.find(a=>a.id==='cash'||String(a.type).toLowerCase()==='cash')?.balance||0)-Number(f.personalCash||0))<0.005,'The personal cash account matches founder personal cash.');
 add('Personal debt is finite and non-negative',finite(f.personalDebt)&&Number(f.personalDebt)>=0,'Debt cannot be negative or non-finite.');
 add('Wellbeing metrics are bounded',Object.values(f.wellbeing).filter(v=>typeof v==='number').every(bounded),'Numeric wellbeing values remain within 0–100.');
 add('Routine values are finite and bounded',finite(f.dailyRoutine.sleepHours)&&f.dailyRoutine.sleepHours>=0&&f.dailyRoutine.sleepHours<=14&&finite(f.dailyRoutine.workHours)&&f.dailyRoutine.workHours>=0&&f.dailyRoutine.workHours<=20&&finite(f.dailyRoutine.exerciseHours)&&f.dailyRoutine.exerciseHours>=0&&f.dailyRoutine.exerciseHours<=8&&finite(f.dailyRoutine.leisureHours)&&f.dailyRoutine.leisureHours>=0&&f.dailyRoutine.leisureHours<=12&&finite(f.dailyRoutine.daysOffPerWeek)&&f.dailyRoutine.daysOffPerWeek>=0&&f.dailyRoutine.daysOffPerWeek<=7,'Daily routine inputs stay within their supported ranges.');
 add('Recurring cash flows are valid',fin.recurring.every(x=>x&&x.id&&String(x.name||'').trim()&&finite(x.amount)&&Number(x.amount)>0&&['monthly','quarterly','annual'].includes(x.frequency)&&['Income','Expense'].includes(x.type)),'Every recurring item has a valid name, amount, frequency and cash-flow type.');
 add('Investment portfolio values are valid',fin.investments.every(x=>x&&x.id&&finite(x.principal)&&Number(x.principal)>=0&&finite(x.value)&&Number(x.value)>=0&&finite(x.monthlyReturn)),'Investment principal, valuation and estimated return are finite.');
 add('Personal assets are valid',f.personalAssets.every(x=>x&&x.id&&String(x.name||'').trim()&&finite(x.purchasePrice)&&Number(x.purchasePrice)>=0&&finite(x.currentValue)&&Number(x.currentValue)>=0&&finite(x.monthlyMaintenance)&&Number(x.monthlyMaintenance)>=0),'Founder assets have valid names, values and maintenance costs.');
 add('Relationship records are valid',f.relationships.every(x=>x&&x.id&&String(x.name||'').trim()&&bounded(x.quality)),'Relationships have names and quality scores within 0–100.');
 add('Calendar records are valid',f.personalCalendar.every(x=>x&&x.id&&String(x.title||'').trim()&&/^\\d{4}-\\d{2}-\\d{2}$/.test(String(x.date))),'Personal calendar entries have unique identifiers, titles and ISO dates.');
 add('Succession plan structure',f.succession&&Array.isArray(f.succession.heirs)&&finite(f.succession.retirementAge)&&f.succession.retirementAge>=40&&f.succession.retirementAge<=100,'Succession plan has a valid retirement target and heir list.');
 add('Phase 3 save serialization',(()=>{try{JSON.stringify(active);return true}catch(e){return false}})(),'The active campaign, founder profile and personal records serialize to JSON.');
 f.phase3.audit={date:dateNow(),passed:tests.filter(t=>t.ok).length,failed:tests.filter(t=>!t.ok).length,tests};
 return f.phase3.audit;
}
\nfunction init(){const f=ensure();addUI();if(f){render();if(typeof persist==='function')persist();}}
window.Phase3Founder={version:'3.0.3',ensure:ensure,render:render,stepDay:stepDay,record:record,runAudit:runAudit,openTransaction:openTransaction,openRecurring:openRecurring,openEvent:openEvent,openRoutine:openRoutine,openWellbeing:openWellbeing,openReputation:openReputation,openSuccession:openSuccession,openAsset:openAsset,openRelationship:openRelationship,openInvestment:openInvestment};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
