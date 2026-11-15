'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/phase10-autonomous-competitors-engine.js','utf8');
const active={id:'phase10-qa',date:'2026-01-01',worldSeed:123456,company:{cash:25e6,currency:'USD',reputation:68},employees:[],projects:[],market:{news:[]}};
const nav={appendChild(){},querySelector(){return null}},content={appendChild(){}};
const document={readyState:'complete',querySelector(s){return s==='.nav'?nav:s==='.content'?content:null},getElementById(){return null},addEventListener(){}};
const window={Phase6Ecosystem:{stepDay(date){return{date}}},StudioPhaseIntegration:{audit(){return{tests:[],passed:0,failed:0}}},nav(){},render(){}};
const context={window,document,active,persist(){},toast(){},console,Date,Math,Number,String,Array,Object,JSON,Set,Map};
vm.runInNewContext(src,context,{filename:'phase10-autonomous-competitors-engine.js'});
const api=window.Phase10Competitors;assert(api);const state=api.ensure();assert.equal(state.companies.length,10);assert.equal(new Set(state.companies.map(x=>x.id)).size,10);
assert.equal(api.stepDay('2026-01-01').processed,true);assert.equal(api.stepDay('2026-01-01').idempotent,true);
for(let d=2;d<=365;d++){const date=new Date(Date.UTC(2026,0,d,12)).toISOString().slice(0,10);active.date=date;api.stepDay(date)}
const audit=api.audit();assert.equal(audit.failed,0,JSON.stringify(audit.tests.filter(x=>!x.ok)));assert.equal(state.lastProcessedDate,'2026-12-31');
const snap=JSON.stringify(state);api.ensure();assert.equal(JSON.stringify(state),snap);
api.setStrategy({posture:'Innovation',investmentPct:18,talentRetention:75,marketingIntensity:62});assert.equal(state.playerStrategy.posture,'Innovation');
assert.throws(()=>api.setStrategy({posture:'Invalid',investmentPct:99,talentRetention:75,marketingIntensity:62}));
assert.doesNotThrow(()=>JSON.parse(JSON.stringify(active)));console.log(JSON.stringify({passed:12,failed:0,companies:state.companies.length,processedDays:365,opportunities:state.opportunities.length,events:state.events.length,audit:audit.passed+'/'+(audit.passed+audit.failed)}));