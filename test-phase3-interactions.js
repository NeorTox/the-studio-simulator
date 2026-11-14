const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes={};
function node(id){return nodes[id]||(nodes[id]={id,value:'',innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){}},appendChild(){},setAttribute(){}})}
const document={readyState:'complete',getElementById:node,createElement:()=>({id:'',innerHTML:'',appendChild(){}}),addEventListener(){}};
const active={date:'2026-11-14',founder:{name:'Founder',age:35,personalCash:10000,personalAssets:[],relationships:[],personalDebt:0,stress:20,skills:{stressManagement:50}},company:{currency:'INR'},projects:[],employees:[],worldSeed:'seed'};
function show(title,html){for(const m of html.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){const el=node(m[1]);const v=m[0].match(/value="([^"]*)"/);if(v)el.value=v[1];}}
const ctx={document,window:{},active,persist(){},toast(){},show,close(){},fmt:v=>'₹'+v,addLog(){},console,Date,Math};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('phase3-founder-engine.js','utf8'),ctx);
const api=ctx.window.Phase3Founder;
api.openInvestment();nodes.p3iname.value='Index Fund';nodes.p3itype.value='ETF';nodes.p3ivalue.value='2500';nodes.p3ireturn.value='.5';nodes.p3form.onsubmit({preventDefault(){}});
assert.equal(active.founder.personalCash,7500,'investment moves cash into investment');
assert.equal(active.founder.personalFinance.investments.length,1,'investment recorded');
assert.equal(active.founder.personalFinance.ledger[0].type,'Transfer','investment transfer is auditable');
api.openRelationship();nodes.p3relname.value='Avery';nodes.p3reltype.value='Friend';nodes.p3reljob.value='Artist';nodes.p3relquality.value='88';nodes.p3relstatus.value='Close';nodes.p3reldob.value='1998-02-01';nodes.p3form.onsubmit({preventDefault(){}});
assert.equal(active.founder.relationships.length,1,'relationship recorded');
assert.equal(active.founder.relationships[0].quality,88,'relationship quality stored');
console.log('PASS: investment purchase, personal cash transfer, audit trail, relationship creation');
