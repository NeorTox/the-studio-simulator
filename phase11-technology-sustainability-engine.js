(function(){
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VERSION='11.0.0',clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d,round=v=>Number(Number(v).toFixed(3));
const add=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},month=date=>String(date).slice(0,7),day=date=>Number(String(date).slice(8,10))||1;
const CATALOG=[
{id:'ai-production',name:'AI Production Orchestration',category:'Artificial intelligence',tier:1,cost:6500000,days:150,impact:12,description:'Automated scheduling, script analysis, production forecasting and resource allocation.',requires:[]},
{id:'virtual-production',name:'Virtual Production Volume',category:'Production technology',tier:1,cost:7200000,days:165,impact:14,description:'Real-time LED stages, camera tracking and in-camera environments.',requires:[]},
{id:'cloud-rendering',name:'Distributed Cloud Rendering',category:'Computing',tier:1,cost:5400000,days:135,impact:10,description:'Elastic render farms and lower-cost compute scheduling.',requires:[]},
{id:'secure-distribution',name:'Secure Global Distribution',category:'Distribution',tier:1,cost:4300000,days:120,impact:9,description:'Watermarked delivery, rights enforcement and resilient content distribution.',requires:[]},
{id:'real-time-rendering',name:'Real-time Rendering Pipeline',category:'Computing',tier:2,cost:9800000,days:210,impact:16,description:'Real-time rendering for interactive production and faster previs.',requires:['cloud-rendering']},
{id:'procedural-animation',name:'Procedural Animation Systems',category:'Production technology',tier:2,cost:8500000,days:195,impact:15,description:'Reusable procedural rigs, crowds and environment generation.',requires:['ai-production']},
{id:'digital-twin',name:'Digital Twin Studio Operations',category:'Operations',tier:2,cost:9200000,days:210,impact:17,description:'Live facility twins for maintenance, scheduling and resource optimization.',requires:['ai-production']},
{id:'immersive-audio',name:'Immersive Spatial Audio',category:'Production technology',tier:2,cost:6100000,days:165,impact:11,description:'Spatial sound capture, mixing and interactive audio pipelines.',requires:['secure-distribution']},
{id:'carbon-scheduling',name:'Carbon-aware Production Scheduling',category:'Sustainability',tier:2,cost:6800000,days:180,impact:18,description:'Schedule shoots and compute around grid intensity and resource availability.',requires:['ai-production']},
{id:'renewable-microgrid',name:'Studio Renewable Microgrids',category:'Sustainability',tier:2,cost:11200000,days:225,impact:20,description:'On-site solar, storage and intelligent facility energy management.',requires:['digital-twin']},
{id:'water-reclamation',name:'Closed-loop Water Reclamation',category:'Sustainability',tier:2,cost:5900000,days:165,impact:16,description:'Reuse water from sets, cooling and facility operations.',requires:['digital-twin']},
{id:'circular-materials',name:'Circular Set & Materials System',category:'Sustainability',tier:2,cost:6400000,days:175,impact:17,description:'Reusable sets, material passports and low-waste production.',requires:['virtual-production']}
];
const INITIATIVES=[
{id:'solar-campus',name:'Solar campus and battery storage',category:'Energy',min:4500000,days:120,effect:'renewable',description:'Install solar generation and battery storage across studio facilities.'},
{id:'efficient-facilities',name:'Efficient lighting and HVAC',category:'Efficiency',min:2200000,days:90,effect:'efficiency',description:'Upgrade lighting, cooling and facility controls to reduce demand.'},
{id:'water-reuse',name:'Water recovery infrastructure',category:'Water',min:1800000,days:100,effect:'water',description:'Capture, filter and reuse production and facility water.'},
{id:'circular-sets',name:'Circular set construction',category:'Materials',min:1600000,days:85,effect:'recycling',description:'Reuse set materials, props and construction stock.'},
{id:'fleet-electrification',name:'Electric production fleet',category:'Transport',min:3800000,days:130,effect:'transport',description:'Replace high-emission production vehicles with electric fleet capacity.'}
];
function post(description,category,amount,date,meta={}){
 if(typeof window.post==='function')return !!window.post(description,category,amount,date,'transaction',{phase11:true,...meta});
 if(amount<0&&Number(active.company?.cash||0)<-amount)return false;
 active.company=active.company||{};active.company.cash=round(num(active.company.cash)+amount);active.ledger=active.ledger||[];active.ledger.unshift({id:'P11-'+active.ledger.length,date,description,category,amount,type:'transaction',phase11:true,...meta});return true;
}
function ensure(){
 if(typeof active==='undefined'||!active)return null;
 const s=active.technology||(active.technology={});
 s.version=VERSION;s.lastProcessedDate=s.lastProcessedDate||null;s.lastMonthProcessed=s.lastMonthProcessed||null;s.firstIntegratedDate=s.firstIntegratedDate||null;s.technologyBenefits=Object.assign({productionEfficiencyPct:0,renderCostReductionPct:0,distributionSecurityPct:0,postProductionEfficiencyPct:0},s.technologyBenefits||{});
 s.technologies=Array.isArray(s.technologies)?s.technologies:CATALOG.map(t=>({id:t.id,status:t.requires.length?'Locked':'Available',unlockedDate:null,completedDate:null}));
 s.researchProjects=Array.isArray(s.researchProjects)?s.researchProjects:[];
 s.patents=Array.isArray(s.patents)?s.patents:[];s.licenses=Array.isArray(s.licenses)?s.licenses:[];
 s.events=Array.isArray(s.events)?s.events:[];s.history=Array.isArray(s.history)?s.history:[];
 s.initiatives=Array.isArray(s.initiatives)?s.initiatives:[];
 s.lab=Object.assign({level:1,scientists:12,capacity:1},s.lab||{});
 s.sustainability=Object.assign({renewableSharePct:18,recyclingPct:22,waterEfficiencyPct:12,carbonOffsetPct:0,renewableTargetPct:50,recyclingTargetPct:60,waterEfficiencyTargetPct:45,energyUseMwh:0,emissionsTonnes:0,waterUseM3:0,wasteTonnes:0,totalEmissionsTonnes:0,totalEnergyMwh:0,totalWaterM3:0,esgScore:42,unpaidUtilities:0,energyCost:0},s.sustainability||{});
 s.rivalAdoption=Array.isArray(s.rivalAdoption)?s.rivalAdoption:[];
 s.metrics=Object.assign({technologyIndex:0,patents:0,activeResearch:0,completedResearch:0,activeInitiatives:0,completedInitiatives:0,playerInnovation:0,industryAdoption:0,asOf:null},s.metrics||{});
 return s;
}
function event(s,date,type,text,meta={}){s.events.unshift({id:'TECH-'+date+'-'+s.events.length,type,date,text,...meta});s.events=s.events.slice(0,120)}
function unlock(s,date){s.technologies.forEach(x=>{if(x.status==='Locked'){const t=CATALOG.find(z=>z.id===x.id);if(t&&t.requires.every(id=>s.technologies.some(y=>y.id===id&&y.status==='Researched'))){x.status='Available';x.unlockedDate=date;event(s,date,'technology-unlocked',t.name+' is now available for research.')}}})}
function technology(id){return CATALOG.find(t=>t.id===String(id))}
function startResearch(id,budget){
 const s=ensure(),t=technology(id),state=s.technologies.find(x=>x.id===id);
 if(!t||!state)throw Error('Unknown technology.');
 if(state.status==='Researched'||state.status==='Researching'||s.researchProjects.some(p=>p.technologyId===id&&p.status==='Active'))throw Error('Technology is already researched or in progress.');
 if(state.status==='Locked')throw Error('Research prerequisites are not complete.');
 if(s.researchProjects.filter(p=>p.status==='Active').length>=s.lab.capacity)throw Error('Research lab capacity is full. Upgrade the lab to run more projects.');
 const cost=round(budget===undefined?t.cost:Number(budget));if(!Number.isFinite(cost)||cost<t.cost*.65||cost>t.cost*2.5)throw Error('Research budget must be between 65% and 250% of the baseline estimate.');
 if(!post('R&D programme — '+t.name,'Research and development',-cost,active.date,{technologyId:id,projectType:'research'}))throw Error('Insufficient company cash for this research budget.');
 const p={id:'RND-'+id.toUpperCase()+'-'+s.researchProjects.length,technologyId:id,title:t.name,budget:cost,spent:cost,progress:0,durationDays:Math.max(35,Math.round(t.days*(t.cost/cost))),status:'Active',startDate:active.date,completionDate:null,scientists:s.lab.scientists,points:0};
 s.researchProjects.unshift(p);state.status='Researching';event(s,active.date,'research-started','Research started: '+t.name+'.',{projectId:p.id,budget:cost});persist();render();return p;
}
function upgradeLab(){
 const s=ensure();if(s.lab.level>=5)throw Error('Research campus is already at maximum level.');
 const cost=round(3500000*s.lab.level*s.lab.level);if(!post('Research campus expansion — Level '+(s.lab.level+1),'Research and development',-cost,active.date,{projectType:'lab-upgrade',level:s.lab.level+1}))throw Error('Insufficient company cash for the lab expansion.');
 s.lab.level++;s.lab.scientists+=8;s.lab.capacity=Math.min(4,s.lab.capacity+1);event(s,active.date,'lab-upgrade','Research campus expanded to level '+s.lab.level+'.');persist();render();return s.lab;
}
function hireScientists(count){
 const s=ensure(),n=Math.round(Number(count));if(!Number.isFinite(n)||n<1||n>100)throw Error('Hire between 1 and 100 scientists.');
 const cost=n*85000;if(!post('Research scientist recruitment — '+n,'Research and development',-cost,active.date,{projectType:'scientist-hiring',headcount:n}))throw Error('Insufficient company cash for recruitment.');
 s.lab.scientists+=n;event(s,active.date,'scientists-hired',n+' research scientists joined the studio.');persist();render();return s.lab.scientists;
}
function startInitiative(id,budget){
 const s=ensure(),t=INITIATIVES.find(x=>x.id===id);if(!t)throw Error('Unknown sustainability initiative.');
 if(s.initiatives.some(x=>x.initiativeId===id&&x.status==='Active'))throw Error('This initiative is already active.');
 const cost=round(budget===undefined?t.min:Number(budget));if(!Number.isFinite(cost)||cost<t.min*.75||cost>t.min*3)throw Error('Initiative budget must be between 75% and 300% of the baseline estimate.');
 if(!post('Sustainability programme — '+t.name,'Sustainability investment',-cost,active.date,{initiativeId:id,projectType:'sustainability'}))throw Error('Insufficient company cash for this sustainability programme.');
 const p={id:'GREEN-'+id.toUpperCase()+'-'+s.initiatives.length,initiativeId:id,name:t.name,budget:cost,progress:0,durationDays:Math.max(30,Math.round(t.days*t.min/cost)),status:'Active',startDate:active.date,completionDate:null,effect:t.effect};
 s.initiatives.unshift(p);event(s,active.date,'sustainability-started','Sustainability programme started: '+t.name+'.',{initiativeId:id});persist();render();return p;
}
function setSustainabilityPolicy(v={}){
 const s=ensure(),next={renewableTargetPct:Number(v.renewableTargetPct??s.sustainability.renewableTargetPct),recyclingTargetPct:Number(v.recyclingTargetPct??s.sustainability.recyclingTargetPct),waterEfficiencyTargetPct:Number(v.waterEfficiencyTargetPct??s.sustainability.waterEfficiencyTargetPct),carbonOffsetPct:Number(v.carbonOffsetPct??s.sustainability.carbonOffsetPct)};
 if(!Object.values(next).every(Number.isFinite)||next.renewableTargetPct<0||next.renewableTargetPct>100||next.recyclingTargetPct<0||next.recyclingTargetPct>100||next.waterEfficiencyTargetPct<0||next.waterEfficiencyTargetPct>90||next.carbonOffsetPct<0||next.carbonOffsetPct>80)throw Error('Sustainability targets are outside their permitted ranges.');
 Object.assign(s.sustainability,next);event(s,active.date,'sustainability-policy','Environmental operating targets updated.');persist();render();return next;
}
function licensePatent(technologyId,companyId,royaltyPct=4){
 const s=ensure(),t=technology(technologyId),tech=s.technologies.find(x=>x.id===technologyId),patent=s.patents.find(x=>x.technologyId===technologyId&&x.status==='Active');
 const rival=active.competitors?.companies?.find(x=>x.id===companyId);
 if(!t||!tech||tech.status!=='Researched'||!patent)throw Error('Only patented, completed technologies can be licensed.');
 if(!rival||rival.status!=='Active')throw Error('Choose an active rival studio.');
 const pct=Number(royaltyPct);if(!Number.isFinite(pct)||pct<1||pct>15)throw Error('Royalty rate must be between 1% and 15%.');
 if(s.licenses.some(x=>x.technologyId===technologyId&&x.companyId===companyId&&x.status==='Active'))throw Error('This rival already has an active licence.');
 if(s.licenses.filter(x=>x.technologyId===technologyId&&x.status==='Active').length>=5)throw Error('A patent can have at most five active licences.');
 const fee=Math.max(150000,Math.round(t.cost*.035));if(!post('Technology licence — '+t.name,'Intellectual property licensing',fee,active.date,{technologyId,companyId,licenseFee:true}))throw Error('Unable to post licensing revenue.');
 const adoption=s.rivalAdoption.find(x=>x.companyId===companyId)||{companyId,adoptionIndex:0,technologies:[]};if(!s.rivalAdoption.includes(adoption))s.rivalAdoption.push(adoption);if(!adoption.technologies.includes(technologyId))adoption.technologies.push(technologyId);adoption.adoptionIndex=clamp(adoption.adoptionIndex+12,0,100);
 const l={id:'LIC-'+technologyId+'-'+s.licenses.length,technologyId,companyId,companyName:rival.name,royaltyPct:pct,licenseFee:fee,status:'Active',startDate:active.date,royaltiesPaid:0};s.licenses.unshift(l);patent.licensedCount++;event(s,active.date,'patent-licensed',t.name+' licensed to '+rival.name+'.',{licenseId:l.id});persist();render();return l;
}
function completeResearch(s,p,date){
 const t=technology(p.technologyId),state=s.technologies.find(x=>x.id===p.technologyId);if(!t||!state)return;
 p.status='Completed';p.progress=100;p.completionDate=date;state.status='Researched';state.completedDate=date;
 const patent={id:'PAT-'+t.id.toUpperCase(),technologyId:t.id,name:t.name,filingDate:date,status:'Active',estimatedValue:Math.round(p.budget*.42),licensedCount:0};s.patents.unshift(patent);
 active.company=active.company||{};active.company.technologyScore=round(num(active.company.technologyScore)+t.impact/10);
 const x=s.sustainability,b=s.technologyBenefits;
 if(t.id==='cloud-rendering')x.energyEfficiencyPct=clamp(num(x.energyEfficiencyPct)+4,0,70);
 if(t.id==='digital-twin'){x.energyEfficiencyPct=clamp(num(x.energyEfficiencyPct)+6,0,70);x.waterEfficiencyPct=clamp(x.waterEfficiencyPct+3,0,90)}
 if(t.id==='carbon-scheduling')x.carbonOffsetPct=clamp(x.carbonOffsetPct+5,0,80);
 if(t.id==='renewable-microgrid')x.renewableSharePct=clamp(x.renewableSharePct+12,0,95);
 if(t.id==='water-reclamation')x.waterEfficiencyPct=clamp(x.waterEfficiencyPct+16,0,90);
 if(t.id==='circular-materials')x.recyclingPct=clamp(x.recyclingPct+14,0,95);
 if(t.id==='virtual-production')b.productionEfficiencyPct=clamp(b.productionEfficiencyPct+4,0,50);
 if(t.id==='procedural-animation')b.productionEfficiencyPct=clamp(b.productionEfficiencyPct+5,0,50);
 if(t.id==='real-time-rendering')b.renderCostReductionPct=clamp(b.renderCostReductionPct+8,0,50);
 if(t.id==='secure-distribution')b.distributionSecurityPct=clamp(b.distributionSecurityPct+8,0,50);
 if(t.id==='immersive-audio')b.postProductionEfficiencyPct=clamp(b.postProductionEfficiencyPct+4,0,50);
 event(s,date,'research-completed','Breakthrough achieved: '+t.name+'. Patent filed.',{technologyId:t.id,patentId:patent.id});unlock(s,date);
}
function completeInitiative(s,p,date){
 p.status='Completed';p.progress=100;p.completionDate=date;const x=s.sustainability;
 if(p.effect==='renewable')x.renewableSharePct=clamp(x.renewableSharePct+18,0,95);
 if(p.effect==='efficiency')x.energyEfficiencyPct=clamp(num(x.energyEfficiencyPct,0)+16,0,70);
 if(p.effect==='water')x.waterEfficiencyPct=clamp(x.waterEfficiencyPct+22,0,90);
 if(p.effect==='recycling')x.recyclingPct=clamp(x.recyclingPct+24,0,95);
 if(p.effect==='transport')x.renewableSharePct=clamp(x.renewableSharePct+6,0,95);
 event(s,date,'sustainability-completed',p.name+' completed. Environmental performance improved.',{initiativeId:p.initiativeId});
}
function monthClose(s,date){
 const x=s.sustainability,staff=Math.max(1,num(active.employees?.filter?.(e=>e.status!=='Terminated')?.length,active.company?.headcount||80)),projects=Math.max(0,num(active.projects?.filter?.(p=>!['Released','Cancelled','Archived'].includes(p.status))?.length));
 const energy=Math.max(90,staff*.42+projects*115+210)*(1-num(x.energyEfficiencyPct,0)/100),renewable=clamp(Math.max(x.renewableSharePct,x.renewableTargetPct*.72),0,95);
 const water=Math.max(120,staff*.78+projects*36)*(1-x.waterEfficiencyPct/100),waste=Math.max(8,projects*4.5+staff*.035)*(1-x.recyclingPct/100);
 const emissions=energy*.39*(1-renewable/100)*(1-x.carbonOffsetPct/100),energyCost=Math.round(energy*115),waterCost=Math.round(water*2.4);
 const paid=post('Monthly studio energy and utilities','Utilities and sustainability operations',-(energyCost+waterCost),date,{projectType:'monthly-utilities',month:month(date)});
 if(!paid)x.unpaidUtilities=round(x.unpaidUtilities+energyCost+waterCost);else x.unpaidUtilities=Math.max(0,round(x.unpaidUtilities-energyCost-waterCost));
 x.energyUseMwh=round(energy);x.emissionsTonnes=round(emissions);x.waterUseM3=round(water);x.wasteTonnes=round(waste);x.energyCost=energyCost+waterCost;
 x.totalEmissionsTonnes=round(x.totalEmissionsTonnes+emissions);x.totalEnergyMwh=round(x.totalEnergyMwh+energy);x.totalWaterM3=round(x.totalWaterM3+water);
 x.renewableSharePct=round(renewable);x.esgScore=round(clamp(28+renewable*.24+x.recyclingPct*.2+x.waterEfficiencyPct*.16-x.emissionsTonnes*.012,0,100));
 s.licenses.filter(l=>l.status==='Active').forEach(l=>{const rival=active.competitors?.companies?.find(c=>c.id===l.companyId);if(!rival)return;const royalty=Math.max(1000,Math.round((rival.monthlyRevenue||1000000)*l.royaltyPct/100*.018));if(post('Technology royalty — '+l.companyName,'Intellectual property licensing',royalty,date,{licenseId:l.id,technologyId:l.technologyId})){l.royaltiesPaid+=royalty}});
 const rivals=active.competitors?.companies||[];rivals.forEach(c=>{const a=s.rivalAdoption.find(z=>z.companyId===c.id)||{companyId:c.id,adoptionIndex:0,technologies:[]};if(!s.rivalAdoption.includes(a))s.rivalAdoption.push(a);a.adoptionIndex=round(clamp(a.adoptionIndex+(num(c.innovation,50)-35)*.012+0.15,0,100));CATALOG.filter(t=>t.tier===1||s.technologies.some(z=>z.id===t.id&&z.status==='Researched')).forEach(t=>{if(a.adoptionIndex>t.tier*16&&!a.technologies.includes(t.id))a.technologies.push(t.id)})});
 const adoption=s.rivalAdoption.length?s.rivalAdoption.reduce((n,a)=>n+a.adoptionIndex,0)/s.rivalAdoption.length:0;
 s.metrics={technologyIndex:s.technologies.filter(t=>t.status==='Researched').length*8+num(active.company.technologyScore),patents:s.patents.filter(p=>p.status==='Active').length,activeResearch:s.researchProjects.filter(p=>p.status==='Active').length,completedResearch:s.researchProjects.filter(p=>p.status==='Completed').length,activeInitiatives:s.initiatives.filter(p=>p.status==='Active').length,completedInitiatives:s.initiatives.filter(p=>p.status==='Completed').length,playerInnovation:round(30+s.lab.level*5+s.lab.scientists*.22+s.technologies.filter(t=>t.status==='Researched').length*3),industryAdoption:round(adoption),asOf:date};
 s.history.unshift({date,energyMwh:energy,emissionsTonnes:emissions,renewableSharePct:renewable,esgScore:x.esgScore,technologyIndex:s.metrics.technologyIndex,industryAdoption:adoption});s.history=s.history.slice(0,120);
 if(active.market)active.market.sustainability={date,emissionsTonnes:emissions,renewableSharePct:renewable,esgScore:x.esgScore,technologyIndex:s.metrics.technologyIndex};
}
function processDay(date){
 const s=ensure();if(!s)return{processed:false};
 if(!s.firstIntegratedDate)s.firstIntegratedDate=date;
 if(s.lastProcessedDate===date)return{processed:false,idempotent:true,date};
 if(s.lastProcessedDate&&date<s.lastProcessedDate)return{processed:false,stale:true,date};
 s.researchProjects.filter(p=>p.status==='Active').forEach(p=>{const speed=clamp(.72+s.lab.level*.18+s.lab.scientists/110,0.8,2.4);p.points=round(p.points+speed);p.progress=round(clamp(p.points/p.durationDays*100,0,100));if(p.progress>=100)completeResearch(s,p,date)});
 s.initiatives.filter(p=>p.status==='Active').forEach(p=>{p.progress=round(clamp(p.progress+100/p.durationDays*(.85+s.lab.level*.08),0,100));if(p.progress>=100)completeInitiative(s,p,date)});
 unlock(s,date);
 if(!s.lastMonthProcessed||month(date)!==s.lastMonthProcessed){monthClose(s,date);s.lastMonthProcessed=month(date)}
 s.lastProcessedDate=date;s.metrics.activeResearch=s.researchProjects.filter(p=>p.status==='Active').length;s.metrics.activeInitiatives=s.initiatives.filter(p=>p.status==='Active').length;
 return{processed:true,date,technologyIndex:s.metrics.technologyIndex,esgScore:s.sustainability.esgScore};
}
function audit(){
 const s=ensure();if(!s)return{passed:0,failed:1,tests:[]};const t=[],add=(name,ok,detail)=>t.push({name,ok:!!ok,detail:String(detail||'')});
 add('Versioned technology state',s.version===VERSION,s.version);
 add('Technology catalogue complete',s.technologies.length===CATALOG.length&&new Set(s.technologies.map(x=>x.id)).size===CATALOG.length,s.technologies.length+' technologies');
 add('Research project references',s.researchProjects.every(p=>technology(p.technologyId)&&p.budget>0&&p.progress>=0&&p.progress<=100&&p.spent<=p.budget), 'All research projects map to catalog entries and budget caps.');
 add('Patent references',s.patents.every(p=>s.technologies.some(t=>t.id===p.technologyId&&t.status==='Researched')),'Every patent belongs to completed research.');
 add('Sustainability bounds',Object.entries(s.sustainability).filter(([k])=>k.endsWith('Pct')).every(([,v])=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=100), 'All sustainability percentages remain bounded.');
 add('Facility metrics finite', ['energyUseMwh','emissionsTonnes','waterUseM3','wasteTonnes','totalEmissionsTonnes','totalEnergyMwh','totalWaterM3','esgScore'].every(k=>Number.isFinite(Number(s.sustainability[k]))&&Number(s.sustainability[k])>=0),'Energy, emissions, water, waste and ESG metrics are finite and non-negative.');
 add('Research prerequisites respected',s.technologies.every(x=>{const z=technology(x.id);return x.status!=='Researched'||z.requires.every(id=>s.technologies.some(y=>y.id===id&&y.status==='Researched'))}),'No technology is researched before its prerequisites.');
 add('Active research within lab capacity',s.researchProjects.filter(p=>p.status==='Active').length<=s.lab.capacity,'Active projects '+s.researchProjects.filter(p=>p.status==='Active').length+' / '+s.lab.capacity);
 add('Licence references',s.licenses.every(l=>s.patents.some(p=>p.technologyId===l.technologyId)&&active.competitors?.companies?.some(c=>c.id===l.companyId)),'Licences reference valid patents and rival studios.');
 add('Initiative budgets valid',s.initiatives.every(p=>INITIATIVES.some(x=>x.id===p.initiativeId)&&p.budget>0&&p.progress>=0&&p.progress<=100),'Sustainability projects remain within budget.');
 add('Daily checkpoint synchronized',!s.lastProcessedDate||s.lastProcessedDate===active.date,s.lastProcessedDate+' / '+active.date);
 add('Serializable campaign state',(()=>{try{JSON.parse(JSON.stringify(s));return true}catch(e){return false}})(),'Technology and sustainability state can be saved.');
 const passed=t.filter(x=>x.ok).length;return{date:active.date,passed,failed:t.length-passed,tests:t};
}
function render(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!$('page-technology')){const b=document.createElement('button');b.dataset.page='technology';b.innerHTML='<span>⚗</span>Technology';b.onclick=()=>window.nav('technology');const ref=nav.querySelector('[data-page="competitors"]');if(ref)ref.insertAdjacentElement('afterend',b);else nav.appendChild(b);const p=document.createElement('section');p.className='page';p.id='page-technology';p.innerHTML='<div class="hero"><div><div class="eyebrow">PHASE 11 · INNOVATION & PLANET</div><h1 class="h1">Technology & sustainability</h1><p class="sub">Build research capability, unlock proprietary technology, license patents and reduce the environmental cost of your studio empire.</p></div><span class="tag gold">PHASE 11 · 11.0.0</span></div><div id="technology-content"></div>';content.appendChild(p)}
 if(!$('page-technology')?.classList.contains('active'))return;
 const host=$('technology-content');if(!active){host.innerHTML='<div class="empty">Create a campaign to establish your research campus.</div>';return}
 const s=ensure(),x=s.sustainability,activeResearch=s.researchProjects.filter(p=>p.status==='Active'),available=s.technologies.filter(t=>t.status==='Available'),rivals=active.competitors?.companies||[];
 const money=n=>Math.round(num(n)).toLocaleString(),bar=v=>'<div style="height:7px;background:var(--panel2);border-radius:9px;overflow:hidden"><div style="height:7px;width:'+clamp(v,0,100)+'%;background:var(--green)"></div></div>';
 const rankedResearch=window.StudioAlgorithms&&available.length?window.StudioAlgorithms.rankAlternatives(available.map(t=>({id:t.id,values:{impact:t.impact,cost:t.cost,duration:t.days}})),[{id:'impact',weight:.55,direction:'max'},{id:'cost',weight:.25,direction:'min'},{id:'duration',weight:.20,direction:'min'}]).ranked:[];
 const recommendationMarkup='<div class="card" style="margin-top:14px"><b class="cardtitle">Algorithmic research recommendations</b><p class="hint">Ranked by expected technology impact, baseline cost and research duration. Recommendations are advisory; nothing is funded automatically.</p>'+(rankedResearch.length?rankedResearch.slice(0,3).map(r=>{const t=technology(r.id);return '<div class="rowitem"><span><b>'+esc(t.name)+'</b><div class="tiny">Priority score '+r.score.toFixed(3)+' · Impact '+t.impact+' · '+money(t.cost)+' · '+t.days+' days</div></span><button type="button" class="btn" data-research-select="'+esc(t.id)+'">Select</button></div>'}).join(''):'<div class="empty">No currently available research projects to rank.</div>')+'</div>';
 host.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">TECHNOLOGY INDEX</div><div class="statvalue">'+money(s.metrics.technologyIndex)+'</div></div><div class="card"><div class="statlabel">ACTIVE PATENTS</div><div class="statvalue">'+s.patents.filter(p=>p.status==='Active').length+'</div></div><div class="card"><div class="statlabel">ESG SCORE</div><div class="statvalue">'+x.esgScore.toFixed(0)+'/100</div></div><div class="card"><div class="statlabel">RENEWABLE ENERGY</div><div class="statvalue">'+x.renewableSharePct.toFixed(1)+'%</div></div></div>'+
 '<div class="grid cols"><div class="card"><b class="cardtitle">Research campus</b><div class="rowitem">Campus level <b>'+s.lab.level+'/5</b></div><div class="rowitem">Research scientists <b>'+s.lab.scientists+'</b></div><div class="rowitem">Project capacity <b>'+activeResearch.length+' / '+s.lab.capacity+'</b></div><button class="btn primary" id="tech-upgrade-lab" '+(s.lab.level>=5?'disabled':'')+'>Upgrade campus · '+money(3500000*s.lab.level*s.lab.level)+'</button><form id="tech-hire-form" style="margin-top:12px"><div class="field"><label>Scientists to hire</label><input id="tech-hire-count" type="number" min="1" max="100" value="5"></div><button class="btn">Recruit research scientists</button></form></div><div class="card"><b class="cardtitle">Start a research programme</b><form id="tech-research-form"><div class="field"><label>Available technology</label><select id="tech-research-id">'+available.map(t=>'<option value="'+t.id+'">'+esc(t.name)+' · '+t.category+'</option>').join('')+'</select></div><div class="field"><label>Research budget (USD)</label><input id="tech-research-budget" type="number" min="1" step="100000" value="'+(available.length?technology(available[0].id).cost:0)+'"></div><button class="btn primary" '+(!available.length||activeResearch.length>=s.lab.capacity?'disabled':'')+'>Fund research</button></form><p class="hint">Research budgets are posted to the company ledger when approved. Completed programmes create patents.</p></div></div>'+
 recommendationMarkup+'<div class="card" style="margin-top:14px"><b class="cardtitle">Active research pipeline</b>'+(activeResearch.length?activeResearch.map(p=>'<div class="rowitem"><span><b>'+esc(p.title)+'</b><div class="tiny">'+p.progress.toFixed(1)+'% · '+p.scientists+' scientists · '+money(p.budget)+' budget</div>'+bar(p.progress)+'</span><span class="tag gold">IN PROGRESS</span></div>').join(''):'<div class="empty">No active research. Fund a programme to begin unlocking the technology tree.</div>')+'</div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Technology tree</b><div class="grid cols">'+s.technologies.map(z=>{const t=technology(z.id);return '<div class="card"><div class="tiny">'+esc(t.category)+' · TIER '+t.tier+'</div><b>'+esc(t.name)+'</b><p class="hint">'+esc(t.description)+'</p><div class="rowitem"><span class="tag '+(z.status==='Researched'?'green':z.status==='Available'?'gold':'')+'">'+esc(z.status.toUpperCase())+'</span><span class="tiny">'+money(t.cost)+'</span></div>'+(t.requires.length?'<div class="tiny">Requires: '+t.requires.map(id=>esc(technology(id).name)).join(', ')+'</div>':'')+'</div>'}).join('')+'</div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><b class="cardtitle">Sustainability operations</b><div class="rowitem">Monthly energy <b>'+x.energyUseMwh.toFixed(1)+' MWh</b></div><div class="rowitem">Monthly emissions <b>'+x.emissionsTonnes.toFixed(1)+' tCO₂e</b></div><div class="rowitem">Water consumption <b>'+x.waterUseM3.toFixed(1)+' m³</b></div><div class="rowitem">Waste generated <b>'+x.wasteTonnes.toFixed(1)+' t</b></div><div class="rowitem">Recycling rate <b>'+x.recyclingPct.toFixed(1)+'%</b></div><div class="rowitem">Water efficiency <b>'+x.waterEfficiencyPct.toFixed(1)+'%</b></div><div class="rowitem">Outstanding utility bills <b>'+money(x.unpaidUtilities)+'</b></div></div><div class="card"><b class="cardtitle">Environmental policy</b><form id="tech-policy-form"><div class="field"><label>Renewable energy target (%)</label><input id="tech-renewable" type="number" min="0" max="100" value="'+x.renewableTargetPct+'"></div><div class="field"><label>Recycling target (%)</label><input id="tech-recycling" type="number" min="0" max="100" value="'+x.recyclingTargetPct+'"></div><div class="field"><label>Water efficiency target (%)</label><input id="tech-water" type="number" min="0" max="90" value="'+x.waterEfficiencyTargetPct+'"></div><div class="field"><label>Carbon offset (%)</label><input id="tech-offset" type="number" min="0" max="80" value="'+x.carbonOffsetPct+'"></div><button class="btn primary">Save environmental policy</button></form></div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><b class="cardtitle">Sustainability programmes</b><form id="tech-green-form"><div class="field"><label>Initiative</label><select id="tech-green-id">'+INITIATIVES.map(t=>'<option value="'+t.id+'">'+esc(t.name)+' · '+money(t.min)+'</option>').join('')+'</select></div><button class="btn primary">Fund sustainability programme</button></form>'+s.initiatives.slice(0,8).map(p=>'<div class="rowitem"><span><b>'+esc(p.name)+'</b><div class="tiny">'+p.progress.toFixed(0)+'% · '+esc(p.status)+'</div>'+bar(p.progress)+'</span></div>').join('')+'</div><div class="card"><b class="cardtitle">Patent portfolio & licensing</b>'+s.patents.slice(0,10).map(p=>'<div class="rowitem"><span><b>'+esc(p.name)+'</b><div class="tiny">Filed '+p.filingDate+' · '+p.licensedCount+' licences</div></span><span class="tag green">PATENT</span></div>').join('')+(s.patents.length?'<form id="tech-license-form"><div class="field"><label>Patent</label><select id="tech-license-id">'+s.patents.map(p=>'<option value="'+p.technologyId+'">'+esc(p.name)+'</option>').join('')+'</select></div><div class="field"><label>Rival studio</label><select id="tech-license-company">'+rivals.filter(c=>c.status==='Active').map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('')+'</select></div><div class="field"><label>Royalty (%)</label><input id="tech-license-rate" type="number" min="1" max="15" value="4"></div><button class="btn">License patent</button></form>':'<div class="empty">Complete research to file your first patent.</div>')+'</div></div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Innovation & sustainability newswire</b>'+s.events.slice(0,12).map(e=>'<div class="rowitem"><span>'+esc(e.text)+'</span><span class="tiny">'+esc(e.date)+'</span></div>').join('')+'</div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Integrity audit</b><div class="tiny">'+audit().passed+' passed · '+audit().failed+' failed</div></div>';
 host.querySelectorAll('[data-research-select]').forEach(button=>{button.onclick=()=>{const id=button.getAttribute('data-research-select'),select=$('tech-research-id'),budget=$('tech-research-budget');if(!select||!budget)return;select.value=id;budget.value=technology(id).cost;toast('Recommendation selected. Review the budget before funding.')}});
 const bind=(id,fn)=>{const el=$(id);if(!el)return;const run=e=>{if(e)e.preventDefault();try{fn();toast('Technology and sustainability update saved.')}catch(err){toast(err.message)}};el.onsubmit=run;const button=el.querySelector('button');if(button){button.type='button';button.onclick=run}};
 bind('tech-research-form',()=>startResearch($('tech-research-id').value,$('tech-research-budget').value));
 bind('tech-hire-form',()=>hireScientists($('tech-hire-count').value));
 bind('tech-policy-form',()=>setSustainabilityPolicy({renewableTargetPct:$('tech-renewable').value,recyclingTargetPct:$('tech-recycling').value,waterEfficiencyTargetPct:$('tech-water').value,carbonOffsetPct:$('tech-offset').value}));
 bind('tech-green-form',()=>{const id=$('tech-green-id').value;startInitiative(id)});
 bind('tech-license-form',()=>licensePatent($('tech-license-id').value,$('tech-license-company').value,$('tech-license-rate').value));
 const up=$('tech-upgrade-lab');if(up)up.onclick=()=>{try{upgradeLab();toast('Research campus upgraded.')}catch(e){toast(e.message)}};
}
const api={version:VERSION,ensure,stepDay:processDay,audit,render,startResearch,upgradeLab,hireScientists,startInitiative,setSustainabilityPolicy,licensePatent,technologyCatalog:CATALOG,initiativeCatalog:INITIATIVES,metrics:()=>{const s=ensure();return s?{...s.metrics,...s.sustainability}:null}};
window.Phase11Technology=api;
const prior=window.Phase6Ecosystem?.stepDay;
if(typeof prior==='function'&&!prior.__phase11Wrapped){const wrapped=function(date){const out=prior.call(this,date),result=processDay(date);if(result.processed&&$('page-technology')?.classList.contains('active'))render();return out};wrapped.__phase11Wrapped=true;window.Phase6Ecosystem.stepDay=wrapped}
if(window.StudioPhaseIntegration&&typeof window.StudioPhaseIntegration.audit==='function'){const old=window.StudioPhaseIntegration.audit;if(!old.__phase11Wrapped){const wrapped=function(){const r=old.call(this),a=audit();r.tests.push({name:'Phase 11 technology and sustainability integrity',ok:a.failed===0,detail:a.passed+' passed / '+a.failed+' failed'});r.passed=r.tests.filter(x=>x.ok).length;r.failed=r.tests.length-r.passed;return r};wrapped.__phase11Wrapped=true;window.StudioPhaseIntegration.audit=wrapped}}
if(typeof window.render==='function'&&!window.render.__phase11Wrapped){const old=window.render,wrapped=function(...a){const r=old.apply(this,a);render();return r};wrapped.__phase11Wrapped=true;window.render=wrapped}
if(typeof active!=='undefined'&&active)ensure();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();