(function(){
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VERSION='9.0.0',clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>Number(Number(v).toFixed(6)),num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const REGIONS=[
 ['north-america','North America','USD',.23,2.3,2.6,4.8,101,4.5,96],['united-kingdom','United Kingdom','GBP',.04,1.7,2.8,4.5,99,4.25,98],
 ['continental-europe','Continental Europe','EUR',.17,1.8,2.4,6.5,98,3.5,88],['south-asia','South Asia','INR',.08,5.8,4.2,6.2,105,6.5,72],
 ['east-asia','East Asia','CNY',.22,4.1,1.8,5.2,102,3.2,82],['latin-america','Latin America','BRL',.06,2.4,5.1,7.4,96,8.5,74],
 ['oceania','Oceania','AUD',.03,2.2,3.1,4.2,100,4.1,54],['international','International','XDR',.17,2.6,2.7,5.6,100,4,65]
];
const COMMODITIES=[['Crude oil','Energy',.85,1.15],['Natural gas','Energy',.9,1.1],['Electricity','Utilities',.95,1.05],['Steel','Industrial materials',.9,1.1],['Copper','Industrial materials',.85,1.15],['Lithium','Critical minerals',.8,1.2],['Wheat','Agriculture',.9,1.1],['Corn','Agriculture',.9,1.1],['Timber','Materials',.95,1.05],['Shipping capacity','Logistics',.8,1.2]];
const ROUTES=[['north-america','united-kingdom',.72],['north-america','continental-europe',.82],['north-america','east-asia',1],['north-america','latin-america',.88],['north-america','oceania',.42],['united-kingdom','continental-europe',.94],['continental-europe','south-asia',.65],['continental-europe','east-asia',.9],['south-asia','east-asia',.96],['south-asia','oceania',.55],['east-asia','oceania',.72],['east-asia','latin-america',.48],['latin-america','continental-europe',.5],['international','north-america',.6],['international','east-asia',.6]];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const noise=(seed,salt)=>(hash(seed+'|'+salt)/4294967295)*2-1;
function dateAdd(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function monthEnd(date){return +date.slice(8,10)===new Date(Date.UTC(+date.slice(0,4),+date.slice(5,7),0)).getUTCDate()}
function ensure(){
 if(typeof active==='undefined'||!active)return null;active.market=active.market||{};
 let g=active.market.globalEconomy;
 if(!g||g.version!==VERSION){
  const old=g||{},seed=Number(active.worldSeed||active.market.seed||hash(active.id))>>>0;
  const regions=REGIONS.map(r=>{const p=(old.regions||[]).find(x=>x.id===r[0]);return p?Object.assign({},p):{id:r[0],name:r[1],currency:r[2],weight:r[3],gdpIndex:100,industrialOutputIndex:100,realGDPGrowthPct:r[4],inflationPct:r[5],unemploymentPct:r[6],consumerConfidence:r[7],policyRatePct:r[8],debtToGDPpct:r[9],fiscalBalancePctGDP:-2.5,currencyStrengthIndex:100,fxVsBaseIndex:100,tradeBalanceIndex:0,exportsIndex:100,importsIndex:100,publicSpendingIndex:100,tariffPct:2.5,policy:{policyRateTargetPct:r[8],fiscalImpulsePct:0},lastProcessedDate:null}});
  const commodities=COMMODITIES.map((c,i)=>{const p=(old.commodities||[]).find(x=>x.name===c[0]);return p?Object.assign({},p):{id:'CMD-'+(i+1),name:c[0],sector:c[1],priceIndex:100,supplyIndex:100*c[2],demandIndex:100*c[3],inventoryIndex:100,volatilityPct:3+i%4,lastProcessedDate:null}});
  const tradeRoutes=ROUTES.map((r,i)=>{const p=(old.tradeRoutes||[]).find(x=>x.from===r[0]&&x.to===r[1]);return p?Object.assign({},p):{id:'TRD-'+(i+1),from:r[0],to:r[1],exposure:r[2],tradeFlowIndex:100*r[2],tariffFrictionPct:2.5,lastProcessedDate:null}});
  g={version:VERSION,seed,baseCurrency:active.company?.currency||'USD',regions,commodities,tradeRoutes,agreements:old.agreements||[],events:old.events||[],history:old.history||[],lastProcessedDate:old.lastProcessedDate||null,firstIntegratedDate:old.firstIntegratedDate||dateAdd(active.date,1),monthIndex:old.monthIndex||0,global:{gdpIndex:100,realGDPGrowthPct:2.5,inflationPct:2.8,unemploymentPct:5.4,consumerConfidence:100,tradeIndex:100,commodityIndex:100,riskIndex:25,currencyVolatilityIndex:10}};
  active.market.globalEconomy=g;
 }
 g.regions=g.regions||[];g.commodities=g.commodities||[];g.tradeRoutes=g.tradeRoutes||[];g.agreements=g.agreements||[];g.events=g.events||[];g.history=g.history||[];g.firstIntegratedDate=g.firstIntegratedDate||dateAdd(active.date,1);g.baseCurrency=active.company?.currency||g.baseCurrency||'USD';return g;
}
const findRegion=(g,id)=>g.regions.find(r=>r.id===id);
function event(g,date,type,text,regionId=null,severity='info'){
 g.events.unshift({id:'GE-'+hash(date+'|'+type+'|'+text),date,type,text,regionId,severity});g.events=g.events.slice(0,160);
 if(Array.isArray(active.market.news)){active.market.news.unshift({date,text:'Global economy: '+text,kind:'macro'});active.market.news=active.market.news.slice(0,60)}
}
function aggregate(g,date){
 const weight=g.regions.reduce((s,r)=>s+r.weight,0)||1,avg=k=>g.regions.reduce((s,r)=>s+num(r[k])*r.weight,0)/weight;
 const growth=avg('realGDPGrowthPct'),inflation=avg('inflationPct'),unemployment=avg('unemploymentPct'),confidence=avg('consumerConfidence'),gdp=avg('gdpIndex');
 const gd=g.regions.reduce((s,r)=>s+Math.abs(num(r.realGDPGrowthPct)-growth)*r.weight,0)/weight,id=g.regions.reduce((s,r)=>s+Math.abs(num(r.inflationPct)-inflation)*r.weight,0)/weight;
 const trade=g.tradeRoutes.reduce((s,r)=>s+num(r.tradeFlowIndex),0)/Math.max(1,g.tradeRoutes.length),commodity=g.commodities.reduce((s,c)=>s+num(c.priceIndex),0)/Math.max(1,g.commodities.length);
 const risk=clamp(18+gd*2.4+id*1.8+Math.max(0,unemployment-5)*1.2,0,100);
 g.global={gdpIndex:round(gdp),realGDPGrowthPct:round(growth),inflationPct:round(inflation),unemploymentPct:round(unemployment),consumerConfidence:round(confidence),tradeIndex:round(trade),commodityIndex:round(commodity),riskIndex:round(risk),currencyVolatilityIndex:round(clamp(6+gd*2+id*2,0,100)),asOf:date};
 const e=active.market.economy||(active.market.economy={});
 Object.assign(e,{globalGDPIndex:g.global.gdpIndex.toFixed(6),globalRealGDPGrowthPct:g.global.realGDPGrowthPct.toFixed(6),globalInflationPct:g.global.inflationPct.toFixed(6),globalRiskIndex:g.global.riskIndex.toFixed(6),globalCommodityIndex:g.global.commodityIndex.toFixed(6),globalDemandIndex:round(clamp(100+(confidence-100)*.35+(growth-2.5)*1.4,35,175)).toFixed(6),globalFXVolatilityIndex:g.global.currencyVolatilityIndex.toFixed(6),globalEconomyDate:date});
}
function processDay(date){
 const g=ensure();if(!g)return {processed:false};if(g.lastProcessedDate===date)return {processed:false,idempotent:true,date};
 const seed=g.seed;
 g.regions.forEach(r=>{
  const n=noise(seed,date+'|region|'+r.id),supply=noise(seed,date+'|supply|'+r.id);
  const growth=clamp(num(r.realGDPGrowthPct)+n*.012+(num(g.global.realGDPGrowthPct,2.5)-2.5)*.0008+num(r.policy?.fiscalImpulsePct)*.0008,-12,16);
  const targetInflation=2.4+Math.max(0,100-num(r.consumerConfidence))*.006;
  const inflation=clamp(num(r.inflationPct)+(targetInflation-num(r.inflationPct))*.00016+supply*.0018,-2,30);
  const unemployment=clamp(num(r.unemploymentPct)+(2.6-growth)*.00022+noise(seed,date+'|jobs|'+r.id)*.003,1,35);
  const target=clamp(num(r.policy?.policyRateTargetPct,r.policyRatePct),0,25);
  const policy=clamp(num(r.policyRatePct)+(target-num(r.policyRatePct))*.001+(inflation-2.5)*.00002,0,25);
  const confidence=clamp(num(r.consumerConfidence)+(growth-2.5)*.006+(2.5-inflation)*.004+(5.5-unemployment)*.002+noise(seed,date+'|mood|'+r.id)*.035,35,165);
  Object.assign(r,{realGDPGrowthPct:round(growth),inflationPct:round(inflation),unemploymentPct:round(unemployment),policyRatePct:round(policy),consumerConfidence:round(confidence),industrialOutputIndex:round(clamp(num(r.industrialOutputIndex)*(1+growth/36500+noise(seed,date+'|output|'+r.id)*.00015),35,500)),gdpIndex:round(clamp(num(r.gdpIndex)*(1+growth/36500+noise(seed,date+'|gdp|'+r.id)*.00008),25,1000)),fiscalBalancePctGDP:round(clamp(num(r.fiscalBalancePctGDP)+(num(r.policy?.fiscalImpulsePct)-num(r.fiscalBalancePctGDP)*.04)*.0004,-30,15)),lastProcessedDate:date});
  r.debtToGDPpct=round(clamp(num(r.debtToGDPpct)-num(r.fiscalBalancePctGDP)*.0003,5,250));
  r.currencyStrengthIndex=round(clamp(num(r.currencyStrengthIndex)+(policy-4)*.0007-(inflation-2.5)*.0009+clamp(num(r.tradeBalanceIndex)*.000002,-.0001,.0001)+noise(seed,date+'|fx|'+r.id)*.002,45,180));
  r.publicSpendingIndex=round(clamp(num(r.publicSpendingIndex)*(1+num(r.policy?.fiscalImpulsePct)*.00002),50,200));
  const chance=hash(seed+'|event|'+date+'|'+r.id)/4294967295;
  if(chance<.0035){const types=['announced a targeted infrastructure programme','reported a manufacturing supply disruption','recorded stronger export activity','introduced a household support package','reported a cooling consumer market','expanded a strategic trade partnership'];event(g,date,'regional-event',r.name+' '+types[hash(seed+'|kind|'+date+'|'+r.id)%types.length]+'.',r.id,chance<.0008?'warning':'info')}
 });
 g.tradeRoutes.forEach(t=>{
  const a=findRegion(g,t.from),b=findRegion(g,t.to);if(!a||!b)return;
  const deal=g.agreements.find(x=>x.status==='Active'&&((x.from===t.from&&x.to===t.to)||(x.from===t.to&&x.to===t.from))&&x.endDate>=date);
  const tariff=clamp((num(a.tariffPct,2.5)+num(b.tariffPct,2.5))/2-num(deal?.tariffReductionPct),0,60);
  const demand=clamp((num(a.consumerConfidence)+num(b.consumerConfidence))/200,.45,1.65),output=clamp(Math.sqrt(num(a.gdpIndex)*num(b.gdpIndex))/100,.4,2.5);
  const targetFlow=100*num(t.exposure)*demand*output*clamp(1-tariff/180,.5,1);
  t.tradeFlowIndex=round(clamp(num(t.tradeFlowIndex)*.985+targetFlow*.015,1,1000));t.tariffFrictionPct=round(tariff);t.lastProcessedDate=date;
  a.exportsIndex=round(clamp(num(a.exportsIndex)+t.tradeFlowIndex*.00015,1,1000));a.tradeBalanceIndex=round(clamp(num(a.tradeBalanceIndex)+t.tradeFlowIndex*.00012,-500,500));
  b.importsIndex=round(clamp(num(b.importsIndex)+t.tradeFlowIndex*.00015,1,1000));b.tradeBalanceIndex=round(clamp(num(b.tradeBalanceIndex)-t.tradeFlowIndex*.00012,-500,500));
 });
 g.commodities.forEach(c=>{
  const sn=noise(seed,date+'|supply|'+c.id),dn=noise(seed,date+'|demand|'+c.id);
  c.supplyIndex=round(clamp(num(c.supplyIndex)+sn*.08,45,160));c.demandIndex=round(clamp(num(c.demandIndex)+dn*.07+(num(g.global.consumerConfidence,100)-100)*.0008,45,160));
  const ret=clamp((num(c.demandIndex)-num(c.supplyIndex))/100*.00022+sn*num(c.volatilityPct,3)*.00009,-.004,.004);
  c.priceIndex=round(clamp(num(c.priceIndex)*(1+ret),15,900));c.inventoryIndex=round(clamp(num(c.inventoryIndex)+(num(c.supplyIndex)-num(c.demandIndex))*.0007,10,200));c.lastProcessedDate=date;
 });
 g.agreements.forEach(a=>{if(a.status==='Active'&&a.endDate<date)a.status='Expired'});
 const base=g.regions.find(r=>r.currency===g.baseCurrency),anchor=base?num(base.currencyStrengthIndex,100):100;
 g.regions.forEach(r=>r.fxVsBaseIndex=round(num(r.currencyStrengthIndex,100)/Math.max(1,anchor)*100));
 aggregate(g,date);g.lastProcessedDate=date;
 if(monthEnd(date)){g.monthIndex++;g.history.unshift({date,monthIndex:g.monthIndex,...g.global});g.history=g.history.slice(0,240)}
 // The outer daily simulation pipeline persists once after its complete cross-phase batch.
 return {processed:true,date,regions:g.regions.length,commodities:g.commodities.length,tradeRoutes:g.tradeRoutes.length,global:g.global};
}
function setPolicy(id,v={}){
 const g=ensure(),r=g?.regions.find(x=>x.id===id);if(!r)throw Error('Choose a valid economic region.');
 const rate=Number(v.policyRateTargetPct),fiscal=Number(v.fiscalImpulsePct),tariff=Number(v.tariffPct);
 if(!Number.isFinite(rate)||rate<0||rate>25||!Number.isFinite(fiscal)||fiscal< -5||fiscal>5||!Number.isFinite(tariff)||tariff<0||tariff>60)throw Error('Interest target 0–25%, fiscal impulse −5% to +5%, tariffs 0–60%.');
 r.policy={policyRateTargetPct:round(rate),fiscalImpulsePct:round(fiscal)};r.tariffPct=round(tariff);r.policyUpdatedDate=active.date;
 event(g,active.date,'policy-change',r.name+' changed monetary, fiscal and trade policy.',r.id,'success');persist();render();return r.policy;
}
function createAgreement(v={}){
 const g=ensure(),from=String(v.from||''),to=String(v.to||''),reduction=Number(v.tariffReductionPct),days=Number(v.durationDays);
 if(!findRegion(g,from)||!findRegion(g,to)||from===to||!Number.isFinite(reduction)||reduction<=0||reduction>30||!Number.isInteger(days)||days<30||days>3650)throw Error('Choose two different regions; tariff reduction 0–30 points and duration 30–3,650 days.');
 const a={id:'FTA-'+String(g.agreements.length+1).padStart(5,'0'),from,to,tariffReductionPct:round(reduction),startDate:active.date,endDate:dateAdd(active.date,days),durationDays:days,status:'Active'};
 g.agreements.unshift(a);event(g,active.date,'trade-agreement','Trade agreement established between '+findRegion(g,from).name+' and '+findRegion(g,to).name+'.',null,'success');persist();render();return a;
}
function cancelAgreement(id){const g=ensure(),a=g?.agreements.find(x=>x.id===id&&x.status==='Active');if(!a)throw Error('Active trade agreement not found.');a.status='Cancelled';a.cancelledDate=active.date;event(g,active.date,'trade-agreement','Trade agreement '+a.id+' was cancelled.');persist();render();return a}
function metrics(){const g=ensure();return g?{...g.global,asOf:g.lastProcessedDate,regions:g.regions.length,commodities:g.commodities.length,tradeRoutes:g.tradeRoutes.length,activeAgreements:g.agreements.filter(a=>a.status==='Active').length,baseCurrency:g.baseCurrency}:null}
function audit(){
 const g=ensure();if(!g)return {passed:0,failed:1,tests:[{name:'Active campaign',ok:false}]};
 const tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
 add('Versioned global economy state',g.version===VERSION,g.version);
 add('Eight unique regional economies',g.regions.length===8&&new Set(g.regions.map(r=>r.id)).size===8,g.regions.length+' regions');
 add('Regional macro indicators finite and bounded',g.regions.every(r=>[r.gdpIndex,r.realGDPGrowthPct,r.inflationPct,r.unemploymentPct,r.policyRatePct,r.consumerConfidence,r.debtToGDPpct,r.currencyStrengthIndex].every(Number.isFinite)&&r.gdpIndex>=25&&r.gdpIndex<=1000&&r.realGDPGrowthPct>=-12&&r.realGDPGrowthPct<=16&&r.inflationPct>=-2&&r.inflationPct<=30&&r.unemploymentPct>=1&&r.unemploymentPct<=35&&r.policyRatePct>=0&&r.policyRatePct<=25&&r.consumerConfidence>=35&&r.consumerConfidence<=165&&r.debtToGDPpct>=5&&r.debtToGDPpct<=250),'GDP, inflation, employment, rates, confidence, debt and currency values stay within bounds.');
 add('Commodity market coverage',g.commodities.length===COMMODITIES.length&&g.commodities.every(c=>Number.isFinite(c.priceIndex)&&c.priceIndex>0&&Number.isFinite(c.supplyIndex)&&Number.isFinite(c.demandIndex)),g.commodities.length+' commodity markets');
 add('Trade route integrity',g.tradeRoutes.length===ROUTES.length&&g.tradeRoutes.every(t=>findRegion(g,t.from)&&findRegion(g,t.to)&&t.from!==t.to&&Number.isFinite(t.tradeFlowIndex)&&t.tradeFlowIndex>0),g.tradeRoutes.length+' trade corridors');
 add('Regional currencies and base FX',g.regions.every(r=>r.currency&&Number.isFinite(r.fxVsBaseIndex)&&r.fxVsBaseIndex>0),g.baseCurrency+' base currency');
 add('Trade agreement references',g.agreements.every(a=>findRegion(g,a.from)&&findRegion(g,a.to)&&a.from!==a.to&&Number.isFinite(a.tariffReductionPct)&&a.endDate>=a.startDate),g.agreements.length+' agreements');
 add('Global aggregates finite',Object.values(g.global||{}).filter(v=>typeof v==='number').every(Number.isFinite),JSON.stringify(g.global));
 add('Monthly macro history bounded',g.history.length<=240&&g.history.every(x=>x.date&&Number.isFinite(x.gdpIndex)),g.history.length+' monthly snapshots');
 add('Campaign date synchronization',!g.lastProcessedDate||g.lastProcessedDate===active.date,'Economy '+String(g.lastProcessedDate||'not run')+' · campaign '+active.date);
 add('Serializable economic state',(()=>{try{JSON.stringify(g);return true}catch(e){return false}})(),'Regional, commodity, trade, policy and event state serializes.');
 const passed=tests.filter(x=>x.ok).length;return {date:active.date,passed,failed:tests.length-passed,tests};
}
function render(){
 const host=$('gecontent');if(!host)return;if(!active){host.innerHTML='<div class="empty">Create or load a campaign to initialize the global economy.</div>';return}
 const g=ensure(),m=metrics(),f=(v,s='')=>Number(v||0).toFixed(2)+s;
 host.innerHTML=
 '<div class="grid stats">'+[['WORLD GDP INDEX',f(m.gdpIndex)],['REAL GDP GROWTH',f(m.realGDPGrowthPct,'%')],['GLOBAL INFLATION',f(m.inflationPct,'%')],['GLOBAL RISK INDEX',f(m.riskIndex)+'/100']].map(x=>'<div class="card"><div class="statlabel">'+x[0]+'</div><div class="statvalue">'+x[1]+'</div></div>').join('')+'</div>'+
 '<div class="grid stats"><div class="card"><div class="statlabel">UNEMPLOYMENT</div><div class="statvalue">'+f(m.unemploymentPct,'%')+'</div></div><div class="card"><div class="statlabel">CONSUMER CONFIDENCE</div><div class="statvalue">'+f(m.consumerConfidence)+'</div></div><div class="card"><div class="statlabel">TRADE FLOW INDEX</div><div class="statvalue">'+f(m.tradeIndex)+'</div></div><div class="card"><div class="statlabel">COMMODITY PRICE INDEX</div><div class="statvalue">'+f(m.commodityIndex)+'</div></div></div>'+
 '<div class="card"><div class="cardhead"><b class="cardtitle">Regional economies</b><span class="tiny">'+g.regions.length+' REGIONS · '+esc(g.lastProcessedDate||'AWAITING FIRST TICK')+'</span></div><div class="tablewrap"><table><thead><tr><th>REGION</th><th>GDP</th><th>GROWTH</th><th>INFLATION</th><th>UNEMPLOYMENT</th><th>POLICY</th><th>CONFIDENCE</th><th>DEBT/GDP</th><th>FX INDEX</th></tr></thead><tbody>'+g.regions.map(r=>'<tr><td><b>'+esc(r.name)+'</b><div class="tiny">'+esc(r.currency)+'</div></td><td>'+f(r.gdpIndex)+'</td><td>'+f(r.realGDPGrowthPct,'%')+'</td><td>'+f(r.inflationPct,'%')+'</td><td>'+f(r.unemploymentPct,'%')+'</td><td>'+f(r.policyRatePct,'%')+'</td><td>'+f(r.consumerConfidence)+'</td><td>'+f(r.debtToGDPpct,'%')+'</td><td>'+f(r.fxVsBaseIndex)+'</td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><b class="cardtitle">Central bank & fiscal policy</b><form id="gepolicy" style="margin-top:12px"><div class="field"><label>Region</label><select id="ge-region">'+g.regions.map(r=>'<option value="'+r.id+'">'+esc(r.name)+'</option>').join('')+'</select></div><div class="formgrid" style="margin-top:10px"><div class="field"><label>Interest target (%)</label><input id="ge-rate" type="number" min="0" max="25" step=".05" value="4.5"></div><div class="field"><label>Fiscal impulse (%)</label><input id="ge-fiscal" type="number" min="-5" max="5" step=".1" value="0"></div><div class="field"><label>Import tariff (%)</label><input id="ge-tariff" type="number" min="0" max="60" step=".1" value="2.5"></div></div><button class="btn primary" style="margin-top:12px">Apply policy</button></form><p class="hint">Policy settings influence later output, inflation, confidence, currency strength and trade friction.</p></div>'+
 '<div class="card"><b class="cardtitle">Trade agreements</b><form id="geagreement" style="margin-top:12px"><div class="field"><label>First region</label><select id="ge-from">'+g.regions.map(r=>'<option value="'+r.id+'">'+esc(r.name)+'</option>').join('')+'</select></div><div class="field" style="margin-top:8px"><label>Second region</label><select id="ge-to">'+g.regions.map((r,i)=>'<option value="'+r.id+'" '+(i===1?'selected':'')+'>'+esc(r.name)+'</option>').join('')+'</select></div><div class="formgrid" style="margin-top:8px"><div class="field"><label>Tariff reduction</label><input id="ge-reduction" type="number" min=".1" max="30" step=".1" value="1.5"></div><div class="field"><label>Duration (days)</label><input id="ge-duration" type="number" min="30" max="3650" value="365"></div></div><button class="btn primary" style="margin-top:12px">Establish agreement</button></form><div class="tiny" style="margin-top:10px">'+g.agreements.slice(0,5).map(a=>esc(findRegion(g,a.from)?.name||a.from)+' ↔ '+esc(findRegion(g,a.to)?.name||a.to)+' · '+esc(a.status)+' · '+esc(a.endDate)).join(' · ')+'</div></div></div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Global commodity markets</b><div class="tablewrap"><table><thead><tr><th>COMMODITY</th><th>SECTOR</th><th>PRICE</th><th>SUPPLY</th><th>DEMAND</th><th>INVENTORY</th></tr></thead><tbody>'+g.commodities.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.sector)+'</td><td>'+f(c.priceIndex)+'</td><td>'+f(c.supplyIndex)+'</td><td>'+f(c.demandIndex)+'</td><td>'+f(c.inventoryIndex)+'</td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Regional trade corridors</b><div class="tablewrap"><table><thead><tr><th>EXPORT REGION</th><th>IMPORT REGION</th><th>FLOW INDEX</th><th>TARIFF FRICTION</th><th>UPDATED</th></tr></thead><tbody>'+g.tradeRoutes.map(t=>'<tr><td>'+esc(findRegion(g,t.from)?.name||t.from)+'</td><td>'+esc(findRegion(g,t.to)?.name||t.to)+'</td><td>'+f(t.tradeFlowIndex)+'</td><td>'+f(t.tariffFrictionPct,'%')+'</td><td>'+esc(t.lastProcessedDate||'Pending')+'</td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><b class="cardtitle">Macro event wire</b>'+g.events.slice(0,10).map(e=>'<div class="rowitem"><span>'+esc(e.text)+'<div class="tiny">'+esc(e.type)+'</div></span><span class="tiny">'+esc(e.date)+'</span></div>').join('')+'<p class="hint">Fictional simulation events, not live economic news.</p></div><div class="card"><b class="cardtitle">Economic integrity</b><div class="rowitem"><span>Last update</span><b>'+esc(g.lastProcessedDate||'Not processed')+'</b></div><div class="rowitem"><span>Monthly snapshots</span><b>'+g.history.length+'</b></div><div class="rowitem"><span>Base currency</span><b>'+esc(g.baseCurrency)+'</b></div><div class="rowitem"><span>Active agreements</span><b>'+m.activeAgreements+'</b></div><div id="ge-audit" class="tiny"></div></div></div>';
 $('gepolicy').onsubmit=e=>{e.preventDefault();try{setPolicy($('ge-region').value,{policyRateTargetPct:$('ge-rate').value,fiscalImpulsePct:$('ge-fiscal').value,tariffPct:$('ge-tariff').value});toast('Regional policy applied.')}catch(err){toast(err.message)}};
 $('geagreement').onsubmit=e=>{e.preventDefault();try{createAgreement({from:$('ge-from').value,to:$('ge-to').value,tariffReductionPct:$('ge-reduction').value,durationDays:$('ge-duration').value});toast('Trade agreement established.')}catch(err){toast(err.message)}};
 const a=audit();$('ge-audit').textContent='Audit: '+a.passed+' passed · '+a.failed+' failed';
}
function renderPage(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!$('page-economy')){
  const b=document.createElement('button');b.dataset.page='economy';b.innerHTML='<span>🌐</span>Economy';b.onclick=()=>window.nav('economy');
  const market=nav.querySelector('[data-page="market"]');if(market)market.insertAdjacentElement('afterend',b);else nav.appendChild(b);
  const p=document.createElement('section');p.className='page';p.id='page-economy';p.innerHTML='<div class="hero"><div><div class="eyebrow">PHASE 9 · GLOBAL SIMULATION</div><h1 class="h1">Global economy</h1><p class="sub">Eight regional economies, central banks, trade corridors, currency strength, commodity markets and evolving macroeconomic conditions.</p></div><span class="tag gold">PHASE 9 · 9.0.0</span></div><div id="gecontent"></div>';content.appendChild(p);
 }
}
function renderAfter(){renderPage();if($('page-economy')?.classList.contains('active'))render()}
const api={version:VERSION,ensure,stepDay:processDay,metrics,audit,setPolicy,createAgreement,cancelAgreement,render};window.Phase9GlobalEconomy=api;
const oldStep=window.Phase6Ecosystem?.stepDay;
if(typeof oldStep==='function'&&!oldStep.__phase9Wrapped){const wrapped=function(date){const prior=oldStep.call(this,date),r=processDay(date);if(r.processed&&$('page-economy')?.classList.contains('active'))render();return prior};wrapped.__phase9Wrapped=true;window.Phase6Ecosystem.stepDay=wrapped}
if(window.StudioPhaseIntegration){const oldAudit=window.StudioPhaseIntegration.audit;window.StudioPhaseIntegration.audit=function(){const r=oldAudit.call(this),a=audit();r.tests.push({name:'Phase 9 global economy integrity',ok:a.failed===0,detail:a.passed+' passed / '+a.failed+' failed'});r.passed=r.tests.filter(x=>x.ok).length;r.failed=r.tests.length-r.passed;return r}}
if(typeof window.render==='function'&&!window.render.__phase9Wrapped){const old=window.render,wrapped=function(...a){const r=old.apply(this,a);renderAfter();return r};wrapped.__phase9Wrapped=true;window.render=wrapped}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderPage);else renderPage();if(typeof active!=='undefined'&&active)ensure();
})();