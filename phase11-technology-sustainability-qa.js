'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/phase11-technology-sustainability-engine.js','utf8');
const active={id:'phase11-qa',date:'2026-01-01',startDate:'2026-01-01',worldSeed:99117,company:{cash:100000000,currency:'USD',reputation:70,headcount:180},employees:Array.from({length:180},(_,i)=>({id:'E'+i,status:'Active'})),projects:[],market:{},ledger:[],competitors:{companies:Array.from({length:10},(_,i)=>({id:'R'+i,name:'Rival '+i,status:'Active',innovation:55,monthlyRevenue:3000000}))}};
const nav={appendChild(){},querySelector(){return null}},content={appendChild(){}};
const document={readyState:'complete',querySelector(s){return s==='.nav'?nav:s==='.content'?content:null},getElementById(){return null},createElement(tag){return{tag,dataset:{},classList:{contains(){return false}},appendChild(){},setAttribute(){},insertAdjacentElement(){}}},addEventListener(){}};
const window={post(desc,cat,amount,date,type,meta){if(amount<0&&active.company.cash< -amount)return false;active.company.cash+=amount;active.ledger.unshift({id:'T'+active.ledger.length,desc,cat,amount,date,type,...meta});return true},Phase6Ecosystem:{stepDay(date){return{date}}},Phase10Competitors:{companies:active.competitors.companies},StudioPhaseIntegration:{audit(){return{tests:[],passed:0,failed:0}}},nav(){},render(){}};
const context={window,document,active,persist(){},toast(){},console,Date,Math,Number,String,Array,Object,JSON,Set,Map};
vm.runInNewContext(src,context,{filename:'phase11-technology-sustainability-engine.js'});
const api=window.Phase11Technology;assert(api);const s=api.ensure();
assert.equal(api.version,'11.0.0');assert.equal(s.technologies.length,12);
api.upgradeLab();assert.equal(s.lab.level,2);assert.equal(s.lab.capacity,2);
api.startResearch('ai-production',6500000);api.startResearch('cloud-rendering',5400000);
api.startInitiative('solar-campus',4500000);api.startInitiative('water-reuse',1800000);
api.setSustainabilityPolicy({renewableTargetPct:65,recyclingTargetPct:70,waterEfficiencyTargetPct:55,carbonOffsetPct:15});
assert.throws(()=>api.startResearch('real-time-rendering',9800000),/prerequisites/);
assert.throws(()=>api.setSustainabilityPolicy({renewableTargetPct:120}),/ranges/);
assert.throws(()=>api.startResearch('ai-production',1),/budget/);
assert.equal(api.stepDay('2026-01-01').processed,true);assert.equal(api.stepDay('2026-01-01').idempotent,true);
let tier2Started=false;
for(let d=2;d<=365;d++){
 const date=new Date(Date.UTC(2026,0,d,12)).toISOString().slice(0,10);active.date=date;api.stepDay(date);
 if(d===190){assert(s.technologies.some(x=>x.id==='ai-production'&&x.status==='Researched'));api.startResearch('real-time-rendering',9800000);tier2Started=true;}
}
assert(tier2Started);
assert(s.technologies.some(x=>x.id==='ai-production'&&x.status==='Researched'));
assert(s.technologies.some(x=>x.id==='cloud-rendering'&&x.status==='Researched'));
assert(s.technologies.some(x=>x.id==='real-time-rendering'&&x.status==='Researched'));
assert(s.initiatives.filter(x=>x.status==='Completed').length>=2);
assert(s.patents.length>=3);
const license=api.licensePatent('ai-production','R0',4);assert(license.id);
assert.equal(s.lastProcessedDate,'2026-12-31');
for(let d=366;d<=395;d++){const date=new Date(Date.UTC(2026,0,d,12)).toISOString().slice(0,10);active.date=date;api.stepDay(date)}
assert(s.licenses[0].royaltiesPaid>0);
assert(s.rivalAdoption.length===10);
assert(s.sustainability.totalEmissionsTonnes>0&&s.sustainability.totalEnergyMwh>0);
assert(s.sustainability.esgScore>=0&&s.sustainability.esgScore<=100);
const audit=api.audit();assert.equal(audit.failed,0,JSON.stringify(audit.tests.filter(x=>!x.ok)));
assert(active.company.cash>=0);assert.doesNotThrow(()=>JSON.parse(JSON.stringify(active)));
const snap=JSON.stringify(s);api.ensure();assert.equal(JSON.stringify(s),snap);
console.log(JSON.stringify({passed:audit.passed,failed:audit.failed,technologies:s.technologies.filter(x=>x.status==='Researched').length,patents:s.patents.length,licenses:s.licenses.length,royalties:s.licenses[0].royaltiesPaid,initiatives:s.initiatives.filter(x=>x.status==='Completed').length,esg:s.sustainability.esgScore,processedDays:395,ledger:active.ledger.length}));
