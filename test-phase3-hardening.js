const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes={};
function node(id){return nodes[id]||(nodes[id]={id,value:'',innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){}},appendChild(){},setAttribute(){}})}
const document={readyState:'complete',getElementById:node,createElement:()=>({id:'',innerHTML:'',appendChild(){}}),addEventListener(){}};
let saved=0, modal='';
function show(title,html){modal=title;for(const m of html.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){const el=node(m[1]);const v=m[0].match(/value="([^"]*)"/);if(v)el.value=v[1];}}
const active={date:'2026-11-14',founder:{name:'Founder',age:70,personalCash:10000,personalAssets:[],relationships:[],personalDebt:500,stress:10,skills:{stressManagement:50},personalFinance:{accounts:[{id:'brokerage',type:'Investment',balance:900},{id:'cash',type:'Cash',balance:0}],ledger:[],recurring:[],investments:[]}},company:{currency:'INR'},projects:[],employees:[],worldSeed:'seed'};
const ctx={document,window:{},active,persist(){saved++},toast(){},show,close(){},fmt:v=>'₹'+v,addLog(){},console,Date,Math};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('phase3-founder-engine.js','utf8'),ctx);
const api=ctx.window.Phase3Founder;
assert.equal(api.version,'3.0.3');
api.ensure();
assert.equal(active.founder.personalFinance.accounts[0].id,'brokerage','non-cash account order preserved');
assert.equal(active.founder.personalFinance.accounts[1].balance,10000,'cash account reconciled on migration');
api.record('Debt repayment',900,'Debt','Repayment');
assert.equal(active.founder.personalCash,9500,'repayment limited by debt');
assert.equal(active.founder.personalDebt,0,'debt cannot go below zero');
api.openAsset();
nodes.p3aname.value='Apartment';nodes.p3atype.value='Property';nodes.p3alocation.value='Kochi';nodes.p3acost.value='1200';nodes.p3avalue.value='1500';nodes.p3amaint.value='10';
nodes.p3form.onsubmit({preventDefault(){}});
assert.equal(active.founder.personalCash,8300,'asset acquisition debits personal cash');
assert.equal(active.founder.personalFinance.accounts[1].balance,8300,'asset acquisition keeps cash account in sync');
assert.equal(active.founder.personalAssets.length,1,'asset registered');
const f=active.founder;
f.personalFinance.recurring=[
{id:'m',name:'Monthly',amount:100,type:'Expense',frequency:'monthly',category:'Home'},
{id:'q',name:'Quarterly',amount:300,type:'Expense',frequency:'quarterly',category:'Tax'},
{id:'a',name:'Annual',amount:1200,type:'Expense',frequency:'annual',category:'Insurance'}
];
api.stepDay('2027-01-01');
assert.equal(f.personalFinance.ledger.filter(x=>x.source==='recurring').length,3,'monthly, quarterly and annual flows run on January boundary');
const after=f.personalCash;
api.stepDay('2027-01-01');
assert.equal(f.personalCash,after,'same date is idempotent');
assert.equal(f.personalFinance.accounts[1].balance,f.personalCash,'cash account synced after recurring charges');
const serialized=JSON.stringify(active);
const restored=JSON.parse(serialized);
assert.equal(restored.founder.personalAssets[0].name,'Apartment','save serialization retains Phase 3 assets');
assert.equal(restored.founder.personalFinance.recurring.length,3,'save serialization retains recurring cash flows');
assert.equal(restored.founder.phase3.lastDay,'2027-01-01','save serialization retains simulation checkpoint');
console.log('PASS: cash-account reconciliation, debt cap, asset/cash sync, monthly/quarterly/annual boundary, day idempotency, save serialization');
