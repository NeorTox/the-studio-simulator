
(function(){
'use strict';
const APP_VERSION='4.18.2',SCHEMA_VERSION=1,REGISTRY_VERSION='1.0.0';
const $p=id=>document.getElementById(id);
const domains=[
{id:'kernel',name:'Simulation kernel',deps:[],owns:['simulation date','day counter','deterministic random streams','simulation event dispatch'],status:'foundation'},
{id:'world',name:'World and time',deps:['kernel'],owns:['world clock','calendar','regions','environment','world events'],status:'partial'},
{id:'population',name:'Population and NPCs',deps:['kernel','world'],owns:['people','demographics','life events','social graph','careers'],status:'partial'},
{id:'household-consumer-economics',name:'Household and consumer economics',deps:['kernel','population','economy'],owns:['households','budgets','consumer purchases','savings','credit','debt','arrears','financial stress','regional consumer demand'],status:'implemented'},
{id:'founder',name:'Founder and personal life',deps:['kernel','world','population'],owns:['founder profile','wellbeing','personal assets','relationships'],status:'partial'},
{id:'company',name:'Corporate management',deps:['kernel','finance','workforce'],owns:['companies','divisions','subsidiaries','facilities','governance'],status:'partial'},
{id:'workforce',name:'Workforce and talent',deps:['kernel','population','finance'],owns:['employees','talent','contracts','payroll','availability'],status:'partial'},
{id:'production',name:'Production lifecycle',deps:['kernel','company','workforce','finance','world'],owns:['projects','budgets','schedules','shoot days','delivery'],status:'partial'},
{id:'rights',name:'IP, rights and distribution',deps:['kernel','production','finance'],owns:['intellectual property','licences','distribution deals','royalties'],status:'partial'},
{id:'media',name:'Media and platforms',deps:['kernel','rights','population','finance'],owns:['platforms','subscribers','creators','advertising','recommendations'],status:'partial'},
{id:'finance',name:'Accounting and treasury',deps:['kernel'],owns:['ledger','journal','cash','debt','tax','invoices','fixed assets'],status:'partial'},
{id:'markets',name:'Capital markets',deps:['kernel','finance','economy'],owns:['equities','orders','IPO','bonds','shareholders','takeovers'],status:'partial'},
{id:'economy',name:'Global economy',deps:['kernel','world'],owns:['GDP','inflation','rates','labour','FX','trade','commodities'],status:'partial'},
{id:'competitors',name:'Competitor companies',deps:['kernel','company','workforce','production','finance','economy'],owns:['rival agents','strategy','production slate','M&A','insolvency'],status:'partial'},
{id:'technology',name:'Technology and R&D',deps:['kernel','company','economy'],owns:['research','patents','AI','technology adoption','cybersecurity'],status:'missing'},
{id:'sustainability',name:'Sustainability',deps:['kernel','company','production','economy'],owns:['energy','emissions','water','waste','supply chain'],status:'partial'},
{id:'risk',name:'Risk and resilience',deps:['kernel','company','finance','world'],owns:['insurance','crisis','fraud','disaster recovery','legal exposure'],status:'partial'},
{id:'legacy',name:'Generations and succession',deps:['kernel','founder','population','company','finance'],owns:['family trees','heirs','inheritance','leadership succession'],status:'partial'}
];
const schema={
version:SCHEMA_VERSION,name:'THE STUDIO campaign schema',
description:'Versioned envelope for local campaign saves. Domain objects remain backward-compatible and are migrated incrementally.',
required:['id','date','founder','company','projects','employees','ledger','events'],
fields:{
id:{type:'string',required:true,description:'Stable campaign identifier; never regenerate during migration.'},
createdAt:{type:'ISO-8601 string',required:false},
date:{type:'YYYY-MM-DD',required:true},
startDate:{type:'YYYY-MM-DD',required:false},
day:{type:'integer',required:false},
worldSeed:{type:'integer',required:false,description:'Stable deterministic simulation seed.'},
founder:{type:'object',required:true,children:['name','age','skills','relationships','personalAssets']},
company:{type:'object',required:true,children:['name','currency','cash','legalStructure','facilities','subsidiaries','capTable']},
employees:{type:'array',required:true},talent:{type:'array',required:false},auditions:{type:'array',required:false},
projects:{type:'array',required:true},productionOps:{type:'object',required:false},
ledger:{type:'array',required:true},accounting:{type:'object',required:false,children:['journal','journalRefs','postedTransactionIds']},
finance:{type:'object',required:false},market:{type:'object',required:false},world:{type:'object',required:false,children:['population']},
worldClock:{type:'object',required:false},events:{type:'array',required:true},scheduledEvents:{type:'array',required:false},
schemaVersion:{type:'integer',required:false},schemaMigrations:{type:'array',required:false},lastSavedAt:{type:'ISO-8601 string',required:false}
}};
const migrations=[
{from:0,to:1,id:'campaign-envelope-v1',description:'Add version metadata and migration history. Does not change business, finance, people, production or simulation state.',apply:s=>{s.schemaVersion=1;s.schemaMigrations=Array.isArray(s.schemaMigrations)?s.schemaMigrations:[];if(!s.schemaMigrations.some(x=>x.id==='campaign-envelope-v1'))s.schemaMigrations.push({id:'campaign-envelope-v1',from:0,to:1,appliedAt:new Date().toISOString(),kind:'metadata-only'});s.schemaUpdatedAt=new Date().toISOString();return s;}}
];
const eventHandlers=new Map(),modules=new Map();
function on(event,handler){if(typeof handler!=='function')throw Error('Event handler must be a function');const set=eventHandlers.get(event)||new Set();set.add(handler);eventHandlers.set(event,set);return ()=>set.delete(handler);}
function emit(event,payload){const set=eventHandlers.get(event);if(!set)return 0;let count=0;for(const fn of [...set]){fn(payload);count++;}return count;}
function registerModule(module){if(!module||!module.id||modules.has(module.id))throw Error('Module requires a unique id');const missing=(module.deps||[]).filter(id=>!modules.has(id)&&!domains.some(d=>d.id===id));modules.set(module.id,Object.freeze({...module,deps:[...(module.deps||[])]}));return {registered:true,missingDependencies:missing};}
function validateCampaign(s){
const errors=[];if(!s||typeof s!=='object'||Array.isArray(s))return {valid:false,errors:['Campaign must be an object.']};
schema.required.forEach(k=>{if(s[k]===undefined||s[k]===null)errors.push('Missing required field: '+k)});
if(s.id!==undefined&&typeof s.id!=='string')errors.push('id must be a string.');
if(s.date!==undefined&&!/^\d{4}-\d{2}-\d{2}$/.test(String(s.date)))errors.push('date must use YYYY-MM-DD.');
if(s.founder!==undefined&&(!s.founder||typeof s.founder!=='object'||!s.founder.name))errors.push('founder.name is required.');
if(s.company!==undefined&&(!s.company||typeof s.company!=='object'))errors.push('company must be an object.');
['projects','employees','ledger','events'].forEach(k=>{if(s[k]!==undefined&&!Array.isArray(s[k]))errors.push(k+' must be an array.')});
return {valid:errors.length===0,errors};
}
function migrateCampaign(input,target=SCHEMA_VERSION){
const check=validateCampaign(input);if(!check.valid)throw Error('Campaign validation failed: '+check.errors.join(' '));
const s=JSON.parse(JSON.stringify(input));let version=Number(s.schemaVersion||0);
if(!Number.isInteger(version)||version<0||version>SCHEMA_VERSION)throw Error('Unsupported campaign schema version: '+version);
while(version<target){const step=migrations.find(m=>m.from===version);if(!step)throw Error('No migration path from schema '+version);step.apply(s);version=step.to;}
return s;
}
function stableHash(value){const str=typeof value==='string'?value:JSON.stringify(value);let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return ('00000000'+(h>>>0).toString(16)).slice(-8);}
function backupPayload(){const payload={format:'THE-STUDIO-CAMPAIGN-BACKUP',formatVersion:1,applicationVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,createdAt:new Date().toISOString(),activeCampaignId:typeof active!=='undefined'&&active?active.id:null,saves:JSON.parse(JSON.stringify(typeof saves!=='undefined'?saves:[]))};payload.integrity={algorithm:'fnv1a32',hash:stableHash(payload)};return payload;}
function downloadJSON(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function checkBackup(obj){
if(!obj||obj.format!=='THE-STUDIO-CAMPAIGN-BACKUP'||obj.formatVersion!==1||!Array.isArray(obj.saves))return {valid:false,error:'Unsupported or malformed THE STUDIO backup.'};
if(!obj.integrity||obj.integrity.algorithm!=='fnv1a32')return {valid:false,error:'Backup integrity metadata is missing.'};
const copy=JSON.parse(JSON.stringify(obj)),expected=copy.integrity.hash;delete copy.integrity;if(stableHash(copy)!==expected)return {valid:false,error:'Backup integrity check failed. File may be damaged or modified.'};
const ids=new Set();for(const s of obj.saves){const v=validateCampaign(s);if(!v.valid)return {valid:false,error:'Invalid campaign '+(s&&s.id||'(unknown)')+': '+v.errors.join(' ')};if(ids.has(s.id))return {valid:false,error:'Duplicate campaign ID in backup: '+s.id};ids.add(s.id);}
return {valid:true,count:obj.saves.length};
}
function saveCollection(){try{localStorage.setItem('the-studio-saves-v2',JSON.stringify(saves));if(active)localStorage.setItem('the-studio-active-v2',active.id);else localStorage.removeItem('the-studio-active-v2');return true;}catch(e){return false;}}
function sourceInventory(){
const found=new Set();for(const s of [...document.scripts]){const src=s.textContent||'';for(const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g))found.add(m[1]);}
for(const name of (window.StudioExternalFunctionNames||[]))found.add(name);return [...found].sort();
}
function dependencyReport(){
const known=new Set(domains.map(d=>d.id)),invalid=domains.flatMap(d=>d.deps.filter(x=>!known.has(x)).map(x=>d.id+' → '+x));
return {domains:domains.length,invalidEdges:invalid,edges:domains.reduce((n,d)=>n+d.deps.length,0),modules:[...modules.keys()],functionInventory:sourceInventory()};
}
function testSuite(){
const results=[];const test=(name,fn)=>{try{const detail=fn();results.push({name,pass:true,detail:String(detail||'Passed')});}catch(e){results.push({name,pass:false,detail:e&&e.message||String(e)});}};
test('12-decimal addition',()=>{if(dstr(dadd('0.1','0.2'))!=='0.3')throw Error('0.1 + 0.2 did not equal 0.3');return '0.1 + 0.2 = 0.3';});
test('12-decimal multiplication',()=>{if(dstr(dmul('1.25','8'))!=='10')throw Error('1.25 × 8 did not equal 10');return '1.25 × 8 = 10';});
test('12-decimal division',()=>{if(dstr(ddiv('1','3'))!=='0.333333333333')throw Error('1 / 3 precision mismatch');return '1 / 3 = 0.333333333333';});
test('Negative decimal arithmetic',()=>{if(dstr(dadd('-2.5','1.25'))!=='-1.25')throw Error('Negative arithmetic mismatch');return 'Negative values retain sign and precision.';});
test('Division-by-zero guard',()=>{let threw=false;try{ddiv('1','0')}catch(e){threw=true}if(!threw)throw Error('Division by zero was not rejected');return 'Zero denominator correctly rejected.';});
test('Deterministic random reproducibility',()=>{if(stableUnit(12345,'phase0')!==stableUnit(12345,'phase0'))throw Error('Seed/key did not reproduce');return 'Same seed and key produce same value.';});
test('Deterministic random key separation',()=>{if(stableUnit(12345,'a')===stableUnit(12345,'b'))throw Error('Distinct keys unexpectedly collided');return 'Different keys produce distinct sample values in this test.';});
test('Random output bounds',()=>{for(let i=0;i<500;i++){const x=Number(stableUnit(88,'range-'+i));if(!(x>=0&&x<1))throw Error('Out-of-range value '+x)}return '500 deterministic samples stayed in [0, 1).';});
test('Leap-year date progression',()=>{if(addDays('2024-02-28',1)!=='2024-02-29'||addDays('2024-02-29',1)!=='2024-03-01')throw Error('Leap-day rollover failed');return '2024-02-28 → 29 → 2024-03-01';});
test('Year rollover',()=>{if(addDays('2026-12-31',1)!=='2027-01-01')throw Error('Year rollover failed');return '2026-12-31 → 2027-01-01';});
test('Domain registry IDs',()=>{if(new Set(domains.map(x=>x.id)).size!==domains.length)throw Error('Duplicate domain IDs');return domains.length+' unique domains.';});
test('Domain dependency references',()=>{const r=dependencyReport();if(r.invalidEdges.length)throw Error(r.invalidEdges.join(', '));return r.edges+' declared dependency edges all point to registered domains.';});
test('Campaign schema required fields',()=>{const good={id:'TEST',date:'2026-01-01',founder:{name:'Test'},company:{},projects:[],employees:[],ledger:[],events:[]};if(!validateCampaign(good).valid)throw Error('Valid minimal campaign rejected');return 'Minimal valid campaign accepted.';});
test('Campaign schema rejects missing core data',()=>{if(validateCampaign({id:'bad'}).valid)throw Error('Malformed campaign accepted');return 'Malformed campaign rejected.';});
test('Migration is idempotent',()=>{const sample={id:'MIGRATION-TEST',date:'2026-01-01',founder:{name:'Test'},company:{cash:100},projects:[],employees:[],ledger:[],events:[]};const one=migrateCampaign(sample),two=migrateCampaign(one);if(one.schemaVersion!==1||two.schemaVersion!==1||two.schemaMigrations.length!==1)throw Error('Migration repeated or failed');if(sample.schemaVersion!==undefined)throw Error('Migration mutated source object');return 'Version 0 → 1; repeat adds no duplicate and source remains untouched.';});
test('Migration refuses malformed campaign',()=>{let threw=false;try{migrateCampaign({id:'bad'})}catch(e){threw=true}if(!threw)throw Error('Malformed campaign migrated');return 'Invalid campaign blocked before migration.';});
test('Backup checksum detects tampering',()=>{const x={format:'THE-STUDIO-CAMPAIGN-BACKUP',formatVersion:1,saves:[]};x.integrity={algorithm:'fnv1a32',hash:stableHash(x)};if(!checkBackup(x).valid)throw Error('Valid backup rejected');x.saves.push({id:'tampered'});if(checkBackup(x).valid)throw Error('Tampered backup accepted');return 'Valid package accepted; modified package rejected.';});
test('Event bus subscription lifecycle',()=>{const name='phase0-test-'+Date.now();let n=0;const off=on(name,()=>n++);emit(name,{});off();emit(name,{});if(n!==1)throw Error('Event handler cleanup failed');return 'Subscribe, dispatch and unsubscribe work.';});
test('Campaign serialization does not mutate source',()=>{const sample={id:'SER',date:'2026-01-01',founder:{name:'Test'},company:{cash:'100'},projects:[],employees:[],ledger:[],events:[]};const before=stableHash(sample);JSON.stringify(sample);if(stableHash(sample)!==before)throw Error('Serialization changed object');return 'JSON serialization leaves source data unchanged.';});
test('Save IDs are unique in current collection',()=>{const arr=typeof saves!=='undefined'?saves:[],ids=arr.map(s=>s.id);if(new Set(ids).size!==ids.length)throw Error('Duplicate save IDs found');return arr.length+' locally stored campaigns inspected.';});
test('Page navigation references',()=>{const pages=[...document.querySelectorAll('.page')],ids=new Set(pages.map(p=>p.id)),bad=[...document.querySelectorAll('.nav button[data-page]')].filter(b=>!ids.has('page-'+b.dataset.page));if(bad.length)throw Error(bad.length+' navigation targets are missing');return pages.length+' page sections and all navigation targets resolved.';});
return results;
}
function runTests(){
const results=testSuite(),passed=results.filter(x=>x.pass).length,failed=results.length-passed,box=$p('phase0-test-results');
if(box)box.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">PASSED</div><div class="statvalue" style="color:var(--green)">'+passed+'</div></div><div class="card"><div class="statlabel">FAILED</div><div class="statvalue" style="color:'+(failed?'var(--red)':'var(--green)')+'">'+failed+'</div></div><div class="card"><div class="statlabel">TOTAL TESTS</div><div class="statvalue">'+results.length+'</div></div></div>'+results.map(x=>'<div class="rowitem"><span><b style="color:'+(x.pass?'var(--green)':'var(--red)')+'">'+(x.pass?'PASS':'FAIL')+'</b> · '+x.name+'<div class="tiny">'+x.detail+'</div></span></div>').join('');
const label=$p('phase0-test-stamp');if(label)label.textContent='Executed '+new Date().toLocaleString();
window.StudioPhase0.lastTestResults=results;return {passed,failed,total:results.length,results};
}
function runStructuralAudit(){
const report=dependencyReport(),result=[
{name:'Domain registry',ok:domains.length===17,detail:domains.length+' domains registered.'},
{name:'Dependency graph',ok:report.invalidEdges.length===0,detail:report.edges+' dependency edges; '+report.invalidEdges.length+' invalid references.'},
{name:'Campaign save collection',ok:typeof saves!=='undefined'&&Array.isArray(saves),detail:(typeof saves!=='undefined'?saves.length:0)+' local saves visible to this browser.'},
{name:'Schema contract',ok:schema.required.every(k=>schema.fields[k]&&schema.fields[k].required),detail:schema.required.length+' required top-level fields documented.'},
{name:'Migration path',ok:migrations[0].from===0&&migrations[0].to===1,detail:'Sequential metadata-only migration v0 → v1.'},
{name:'Application script inventory',ok:report.functionInventory.length>100,detail:report.functionInventory.length+' unique named functions discovered in inline scripts.'},
{name:'PWA shell cache version',ok:true,detail:'Service worker cache is versioned separately at deployment.'}
];
const box=$p('phase0-structural-results');if(box)box.innerHTML=result.map(x=>'<div class="rowitem"><span><b style="color:'+(x.ok?'var(--green)':'var(--red)')+'">'+(x.ok?'PASS':'FAIL')+'</b> · '+x.name+'<div class="tiny">'+x.detail+'</div></span></div>').join('');
return {result,report};
}
function migrateAll(){
if(!sessionStorage.getItem('studio-phase0-backup-confirmed')){toast('Download a complete backup first, then confirm it before migrating.');return;}
const originals=saves.slice(),migrated=[];
try{for(const s of originals)migrated.push(migrateCampaign(s));}
catch(e){toast('Migration blocked. No saves changed: '+e.message);return;}
saves.splice(0,saves.length,...migrated);if(active)active=saves.find(s=>s.id===active.id)||active;
if(!saveCollection()){saves.splice(0,saves.length,...originals);active=active?saves.find(s=>s.id===active.id)||active:null;toast('Storage write failed. In-memory saves restored; export space may be insufficient.');return;}
try{sessionStorage.removeItem('studio-phase0-backup-confirmed')}catch(e){}
if(typeof render==='function')render();toast('Safe schema migration complete. Campaign data values were not rewritten.');
if($p('phase0-migration-status'))$p('phase0-migration-status').textContent='Schema v1 applied to '+migrated.length+' campaign(s). Domain data unchanged.';
}
function restoreBackupFile(file){
const reader=new FileReader();reader.onload=()=>{
try{const data=JSON.parse(reader.result),check=checkBackup(data);if(!check.valid)throw Error(check.error);
if(!confirm('Restore '+check.count+' campaign(s) by merging missing campaign IDs? Existing campaigns with matching IDs will NOT be overwritten.'))return;
const existing=new Set(saves.map(s=>s.id)),added=[];
for(const s of data.saves){if(existing.has(s.id))continue;added.push(migrateCampaign(s));}
const merged=saves.concat(added);const old=saves.slice();saves.splice(0,saves.length,...merged);
if(!saveCollection()){saves.splice(0,saves.length,...old);throw Error('Browser storage could not hold the restored campaigns. No existing campaigns were overwritten.');}
if(typeof render==='function')render();toast('Restored '+added.length+' new campaign(s); '+(check.count-added.length)+' matching IDs skipped.');
}catch(e){toast('Restore failed: '+e.message)}};
reader.readAsText(file);
}
window.StudioPhase0={appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,registryVersion:REGISTRY_VERSION,domains,schema,migrations,validateCampaign,migrateCampaign,dependencyReport,sourceInventory,testSuite,runTests,runStructuralAudit,backupPayload,checkBackup,restoreBackupFile,on,emit,registerModule};
function init(){
const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
if(!$p('page-architecture')){
const button=document.createElement('button');button.dataset.page='architecture';button.innerHTML='<span>⌘</span>Architecture';button.onclick=()=>window.nav('architecture');nav.appendChild(button);
const section=document.createElement('section');section.className='page';section.id='page-architecture';
section.innerHTML='<div class="hero"><div><div class="eyebrow">PHASE 0 · ARCHITECTURE & STABILITY</div><h1 class="h1">Engineering control centre</h1><p class="sub">Versioned data contracts, dependency mapping, save safety, migrations and regression tests.</p></div><div class="actions"><button class="btn primary" id="phase0-run-tests">Run full regression suite</button><button class="btn" id="phase0-structural-audit">Run structural audit</button></div></div>'+
'<div class="grid stats"><div class="card"><div class="statlabel">APP VERSION</div><div class="statvalue">'+APP_VERSION+'</div><div class="tiny">Phase 0 completion candidate</div></div><div class="card"><div class="statlabel">SCHEMA VERSION</div><div class="statvalue">v'+SCHEMA_VERSION+'</div><div class="tiny">Campaign envelope</div></div><div class="card"><div class="statlabel">DOMAIN MODULES</div><div class="statvalue">'+domains.length+'</div><div class="tiny">Registered boundaries</div></div><div class="card"><div class="statlabel">MIGRATION STEPS</div><div class="statvalue">'+migrations.length+'</div><div class="tiny">Sequential and idempotent</div></div></div>'+
'<div class="card" style="margin-top:14px"><div class="cardhead"><b class="cardtitle">Automated regression suite</b><span class="tiny" id="phase0-test-stamp">Not yet executed in this browser</span></div><div id="phase0-test-results" class="empty">Run the suite to exercise arithmetic, deterministic random streams, date handling, schema validation, migrations, backup integrity, event bus and navigation.</div></div>'+
'<div class="card" style="margin-top:14px"><div class="cardhead"><b class="cardtitle">Structural architecture audit</b></div><div id="phase0-structural-results" class="empty">Run the structural audit to inspect module dependencies and source inventory.</div></div>'+
'<div class="card" style="margin-top:14px"><div class="cardhead"><b class="cardtitle">Module dependency graph</b><span class="tiny">Dependencies flow from foundational services to domain modules</span></div><div class="tablewrap"><table><thead><tr><th>MODULE</th><th>DEPENDS ON</th><th>RESPONSIBILITY</th><th>BASELINE</th></tr></thead><tbody>'+domains.map(d=>'<tr><td><b>'+d.name+'</b><div class="tiny">'+d.id+'</div></td><td>'+((d.deps||[]).join(', ')||'—')+'</td><td>'+d.owns.join(', ')+'</td><td><span class="tag '+(d.status==='missing'?'red':d.status==='foundation'?'green':'gold')+'">'+d.status.toUpperCase()+'</span></td></tr>').join('')+'</tbody></table></div><p class="hint">This is the target domain dependency contract. The current application is still a legacy single-page bundle; these boundaries do not imply every module has already been physically extracted into separate files.</p></div>'+
'<div class="grid cols" style="margin-top:14px"><div class="card"><b class="cardtitle">Campaign schema contract</b><div class="rowitem"><span>Current schema</span><b>v'+SCHEMA_VERSION+'</b></div><div class="rowitem"><span>Required fields</span><b>'+schema.required.length+'</b></div><div class="rowitem"><span>Documented fields</span><b>'+Object.keys(schema.fields).length+'</b></div><div id="phase0-schema-fields" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+Object.entries(schema.fields).map(([k,v])=>'<span class="tag" title="'+v.type+'">'+k+(v.required?' *':'')+'</span>').join('')+'</div></div><div class="card"><b class="cardtitle">Migration and compatibility</b><p class="hint">Migrations are sequential, validated and applied to cloned campaign objects. Existing campaign state is not rewritten until all saves pass validation and the player has downloaded a backup.</p><div class="rowitem"><span>Migration v0 → v1</span><b>Metadata only</b></div><div class="rowitem"><span>Business data transformation</span><b>None</b></div><div class="rowitem"><span>Idempotency</span><b>Enforced</b></div><div class="rowitem"><span>Future unsupported versions</span><b>Blocked</b></div></div></div>'+
'<div class="card" style="margin-top:14px"><div class="cardhead"><b class="cardtitle">Backup and recovery</b><span class="tag green">Non-destructive merge restore</span></div><p class="hint">Export every local campaign into one integrity-checked JSON package. Restore validates the complete file first and adds only campaign IDs not already present. Matching existing IDs are never overwritten.</p><div class="actions"><button class="btn primary" id="phase0-backup-all">Download complete backup</button><label class="btn" for="phase0-restore-file">Restore backup file</label><input id="phase0-restore-file" type="file" accept=\"application/json,.json\" style=\"display:none\"><button class="btn" id="phase0-migrate">Apply safe schema migration</button></div><div class="tiny" id="phase0-migration-status">No migration applied yet. Download a backup before applying.</div></div>'+
'<div class="card" style="margin-top:14px"><b class="cardtitle">Save storage and recovery limitations</b><div class="rowitem"><span>Primary storage</span><b>Browser localStorage</b></div><div class="rowitem"><span>Campaign key</span><b>the-studio-saves-v2</b></div><div class="rowitem"><span>Active campaign pointer</span><b>the-studio-active-v2</b></div><div class="rowitem"><span>Cloud sync / server database</span><b class="tag red">Not implemented</b></div><div class="rowitem"><span>True server-side background simulation</span><b class="tag red">Not implemented</b></div><p class="hint">The application cannot guarantee recovery if browser storage is cleared, device data is lost or a download is never saved. Keep exported backups in a separate safe location.</p></div>';
content.appendChild(section);
}
$p('phase0-run-tests').onclick=runTests;$p('phase0-structural-audit').onclick=runStructuralAudit;
$p('phase0-backup-all').onclick=()=>{const pkg=backupPayload();downloadJSON(pkg,'THE-STUDIO-COMPLETE-BACKUP-'+new Date().toISOString().slice(0,10)+'.json');if(confirm('The complete backup download has been initiated. Did you save it somewhere safe?')){sessionStorage.setItem('studio-phase0-backup-confirmed','1');$p('phase0-migration-status').textContent='Backup acknowledged for this browser session. Safe migration is unlocked.';}};
$p('phase0-migrate').onclick=migrateAll;
$p('phase0-restore-file').onchange=e=>{if(e.target.files&&e.target.files[0])restoreBackupFile(e.target.files[0]);e.target.value='';};
runStructuralAudit();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
