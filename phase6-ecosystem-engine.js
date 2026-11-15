(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0);
const isoDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d));
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const CHANNELS=['Theatrical','Streaming SVOD','Streaming AVOD','Broadcast TV','Cable TV','TVOD / PVOD','Physical media','International sales','Music distribution','Game publishing'];
const RIGHTS=['Theatrical exhibition','Streaming','Broadcast','Home video','Download / rental','Remake','Sequel / prequel','Merchandising','Music synchronization','Game adaptation','All media'];
const SEGMENTS=['Families','Young adults','Teen audiences','Adults 25–44','Adults 45+','Genre fans','Animation fans','Gamers','Music listeners','Global general audience'];
function ensure(){
 if(!active)return null;
 if(!active.ecosystem||typeof active.ecosystem!=='object'||Array.isArray(active.ecosystem))active.ecosystem={version:'6.1.0',deals:[],offers:[],releases:[],campaigns:[],merchandise:[],royalties:[],revenueEvents:[],platforms:[],audienceSegments:[],fandoms:[],reviews:[],history:[],lastProcessedDate:null,lastMonthlyDate:null};
 const e=active.ecosystem;
 const defaults={version:'6.1.0',deals:[],offers:[],releases:[],campaigns:[],merchandise:[],royalties:[],revenueEvents:[],platforms:[],audienceSegments:[],fandoms:[],reviews:[],history:[],lastProcessedDate:null,lastMonthlyDate:null};
 Object.keys(defaults).forEach(k=>{if(e[k]===undefined)e[k]=Array.isArray(defaults[k])?[]:defaults[k];});
 ['deals','offers','releases','campaigns','merchandise','royalties','revenueEvents','platforms','audienceSegments','fandoms','reviews','history'].forEach(k=>{if(!Array.isArray(e[k]))e[k]=[];});
 e.version='6.1.0';
 if(!e.platforms.length)e.platforms.push(
  {id:'PLAT-ORBIT',name:'Orbit Stream',type:'SVOD',territory:'Worldwide',subscribers:1250000,monthlyRevenuePerSubscriber:8,active:true,reliability:88},
  {id:'PLAT-NORTHSTAR',name:'Northstar Broadcast',type:'Broadcast',territory:'North America',subscribers:0,monthlyRevenuePerSubscriber:0,active:true,reliability:82},
  {id:'PLAT-PIXEL',name:'PixelPlay',type:'Game / Interactive',territory:'Worldwide',subscribers:420000,monthlyRevenuePerSubscriber:5,active:true,reliability:85}
 );
 return e;
}
function log(action,detail){const e=ensure();if(!e)return;const item={id:uid('ECOLOG'),date:active.date,action,detail:String(detail||'')};e.history.unshift(item);e.history=e.history.slice(0,500);if(typeof addLog==='function')addLog('Ecosystem — '+action+': '+detail);}
function persist(message){if(typeof window.persist==='function')window.persist();else if(typeof persistCampaign==='function')persistCampaign();if(message&&typeof toast==='function')toast(message);}
function project(id){return (active?.projects||[]).find(p=>p.id===id)||null;}
function ip(id){return (active?.company?.ipAssets||[]).find(p=>p.id===id)||null;}
function territoryOverlap(a,b){
 const norm=x=>String(x||'').trim().toLowerCase().replace(/&/g,'and').replace(/\s+/g,' ');
 const groups={
  'north america':['north america','united states','usa','us','canada','mexico'],
  'south asia':['south asia','india','pakistan','bangladesh','sri lanka','nepal','bhutan'],
  'east asia':['east asia','china','japan','south korea','north korea','taiwan','hong kong'],
  'europe':['europe','continental europe','united kingdom','uk','ireland','france','germany','italy','spain','netherlands','sweden','norway','denmark','poland'],
  'latin america':['latin america','brazil','argentina','chile','colombia','peru','mexico'],
  'oceania':['oceania','australia','new zealand'],
  'middle east and africa':['middle east and africa','middle east','africa','uae','saudi arabia','south africa','nigeria','egypt']
 };
 const x=norm(a),y=norm(b);if(!x||!y)return false;
 if(x==='worldwide'||y==='worldwide'||x===y)return true;
 const contains=(parent,child)=>groups[parent]?.includes(child)||false;
 return contains(x,y)||contains(y,x);
}
function dateOverlap(a,b){const ae=a.endDate||'9999-12-31',be=b.endDate||'9999-12-31';return a.startDate<=be&&b.startDate<=ae;}
function rightsOverlap(a,b){return a.rights==='All media'||b.rights==='All media'||a.rights===b.rights;}
function hasConflict(candidate,ignoreId){
 const e=ensure();
 return e.deals.find(d=>d.id!==ignoreId&&d.status==='Active'&&d.exclusive!==false&&candidate.exclusive!==false&&d.projectId===candidate.projectId&&territoryOverlap(d.territory,candidate.territory)&&rightsOverlap(d,candidate)&&dateOverlap(d,candidate));
}
function postCash(description,category,amount,date=active.date,meta={}){
 if(!amount)return true;
 if(typeof window.post!=='function')throw Error('Company finance posting service is unavailable.');
 return window.post(description,category,amount,date,'ecosystem',{phase6:true,...meta})!==false;
}
function recordRevenue(source,amount,date,meta={}){
 const e=ensure(),n=money(amount);if(!(n>0)||!Number.isFinite(n))return 0;
 if(!postCash(source,'Entertainment ecosystem revenue',n,date,meta))return 0;
 const event={id:uid('ECOREV'),date,source,amount:n,meta:{...meta},royaltyAccrued:0};
 e.royalties.filter(r=>r.status==='Active').forEach(r=>{if(r.projectId&&meta.projectId&&r.projectId!==meta.projectId)return;if(r.ipId&&meta.ipId&&r.ipId!==meta.ipId)return;if(r.merchandiseId&&r.merchandiseId!==meta.merchandiseId)return;const basis=meta.royaltyBasis||'gross';const base=basis==='net'?n*(1-money(meta.cost||0)/Math.max(n,1)):n;const due=Math.round(base*money(r.rate)/100*100)/100;r.accrued=money(r.accrued)+due;event.royaltyAccrued+=due;});
 e.revenueEvents.unshift(event);e.revenueEvents=e.revenueEvents.slice(0,1000);return n;
}
function addDistributionDeal(data){
 const e=ensure(),p=project(data.projectId);if(!p)throw Error('Choose an existing production project.');
 const start=String(data.startDate||active.date),end=String(data.endDate||'');
 if(!isoDate(start)||(end&&!isoDate(end))||(end&&end<start))throw Error('Distribution window dates are invalid.');
 const upfront=money(data.upfrontFee),share=money(data.revenueShare),fee=money(data.distributorFee);
 if(!data.licensee||!data.territory||!data.rights||upfront<0||share<0||share>100||fee<0||fee>100||share+fee>100)throw Error('Check licensee, territory, rights and revenue percentages.');
 const d={id:uid('DIST'),projectId:p.id,projectTitle:p.title,channel:data.channel||'Theatrical',licensee:String(data.licensee).trim(),territory:String(data.territory).trim(),rights:data.rights,exclusive:data.exclusive!==false,startDate:start,endDate:end||null,upfrontFee:upfront,revenueShare:share,distributorFee:fee,minimumGuarantee:money(data.minimumGuarantee??data.upfrontFee),status:'Active',signedDate:active.date,paidToDate:0,reportedRevenue:0,notes:String(data.notes||'')};
 const conflict=hasConflict(d);if(conflict)throw Error('Exclusive rights conflict with '+conflict.licensee+' for '+conflict.territory+' ('+conflict.rights+').');
 if(upfront&&!postCash('Distribution advance — '+p.title,'Distribution advance',upfront,active.date,{dealId:d.id,projectId:p.id}))throw Error('The distribution advance could not be posted.');
 d.paidToDate=upfront;e.deals.unshift(d);log('Distribution deal signed',p.title+' · '+d.channel+' · '+d.licensee);persist('Distribution deal recorded.');return d;
}
function createOffer(data){
 const e=ensure(),p=project(data.projectId);if(!p)throw Error('Choose an existing production project.');
 const offer={id:uid('OFFER'),projectId:p.id,projectTitle:p.title,licensee:String(data.licensee||'').trim(),channel:data.channel||'Streaming SVOD',territory:String(data.territory||'Worldwide'),rights:data.rights||'Streaming',exclusive:data.exclusive!==false,upfrontFee:money(data.upfrontFee),revenueShare:money(data.revenueShare),distributorFee:money(data.distributorFee),minimumGuarantee:money(data.minimumGuarantee??data.upfrontFee),startDate:data.startDate||active.date,endDate:data.endDate||null,status:'Negotiating',rounds:[],created:active.date};
 if(!offer.licensee||offer.upfrontFee<0||offer.revenueShare<0||offer.revenueShare>100||offer.distributorFee<0||offer.distributorFee>100||offer.revenueShare+offer.distributorFee>100)throw Error('Offer terms are invalid.');
 if(!isoDate(offer.startDate)||(offer.endDate&&(!isoDate(offer.endDate)||offer.endDate<offer.startDate)))throw Error('Offer dates are invalid.');
 e.offers.unshift(offer);log('Distribution offer received',offer.licensee+' · '+offer.projectTitle);persist('Offer added to negotiations.');return offer;
}
function counterOffer(id,terms){
 const e=ensure(),o=e.offers.find(x=>x.id===id);if(!o||o.status!=='Negotiating')throw Error('Open negotiation not found.');
 const next={...o,...terms};next.upfrontFee=money(next.upfrontFee);next.revenueShare=money(next.revenueShare);next.distributorFee=money(next.distributorFee);
 if(next.upfrontFee<0||next.revenueShare<0||next.revenueShare>100||next.distributorFee<0||next.distributorFee>100||next.revenueShare+next.distributorFee>100)throw Error('Counter-offer financial terms are invalid.');
 o.rounds.push({date:active.date,upfrontFee:o.upfrontFee,revenueShare:o.revenueShare,distributorFee:o.distributorFee});Object.assign(o,{upfrontFee:next.upfrontFee,minimumGuarantee:money(terms.minimumGuarantee??next.upfrontFee),revenueShare:next.revenueShare,distributorFee:next.distributorFee});log('Counter-offer submitted',o.licensee+' · '+o.projectTitle);persist('Counter-offer recorded.');return o;
}
function acceptOffer(id){
 const e=ensure(),o=e.offers.find(x=>x.id===id);if(!o||o.status!=='Negotiating')throw Error('Open offer not found.');
 const d=addDistributionDeal(o);o.status='Accepted';o.acceptedDealId=d.id;persist('Offer accepted and converted to a deal.');return d;
}
function rejectOffer(id){const o=ensure().offers.find(x=>x.id===id);if(!o||o.status!=='Negotiating')throw Error('Open offer not found.');o.status='Rejected';o.closedDate=active.date;log('Distribution offer rejected',o.licensee+' · '+o.projectTitle);persist('Offer rejected.');return o;}
function addRelease(data){
 const e=ensure(),p=project(data.projectId);if(!p||p.stage<6)throw Error('Only released projects can enter distribution.');
 const opening=String(data.openingDate||active.date),screens=Math.floor(money(data.screens)),ticket=money(data.averageTicket),exhibitor=money(data.exhibitorShare),fee=money(data.distributorFee);
 if(!isoDate(opening)||screens<1||ticket<=0||exhibitor<0||exhibitor>100||fee<0||fee>100||exhibitor+fee>=100)throw Error('Release schedule and box-office economics are invalid.');
 const territory=String(data.territory||'Domestic');
 if(e.releases.some(x=>x.projectId===p.id&&x.territory.toLowerCase()===territory.toLowerCase()&&x.status==='Active'))throw Error('An active release already exists for this project and territory.');
 const r={id:uid('REL'),projectId:p.id,projectTitle:p.title,territory,channel:'Theatrical',openingDate:opening,screens,averageTicket:ticket,exhibitorShare:exhibitor,distributorFee:fee,expectedRunDays:Math.max(7,Math.floor(money(data.expectedRunDays)||56)),dailyGross:0,totalGross:0,studioReceipts:0,daysRun:0,status:'Scheduled',notes:String(data.notes||'')};
 e.releases.unshift(r);log('Theatrical release scheduled',p.title+' · '+territory+' · '+opening);persist('Theatrical release scheduled.');return r;
}
function addCampaign(data){
 const e=ensure(),p=project(data.projectId),budget=money(data.budget),duration=Math.floor(money(data.durationDays)||30);
 if(!p||p.stage<4)throw Error('Marketing campaigns require a project in post-production or later.');
 if(!data.name||budget<0||duration<1||duration>730||!data.channel||!data.segment)throw Error('Marketing campaign details are invalid.');
 if(budget>0&&!postCash('Marketing campaign — '+data.name,'Marketing & publicity',-budget,active.date,{projectId:p.id}))throw Error('Insufficient company cash for this campaign.');
 const c={id:uid('MKT'),projectId:p.id,projectTitle:p.title,name:String(data.name).trim(),channel:data.channel,segment:data.segment,budget,spent:budget,durationDays:duration,startDate:active.date,endDate:addDays(active.date,duration),status:'Active',impressions:0,engagements:0,conversions:0,attributedRevenue:0,brandLift:0};
 e.campaigns.unshift(c);log('Marketing campaign launched',c.name+' · '+c.channel+' · '+c.segment);persist('Marketing campaign launched.');return c;
}
function addMerchandise(data){
 const e=ensure(),asset=ip(data.ipId),units=Math.floor(money(data.initialStock)),cost=money(data.unitCost),price=money(data.retailPrice),rate=money(data.royaltyRate);
 if(!asset)throw Error('Link merchandise to an IP asset.');
 if(!data.name||units<0||cost<0||price<=cost||rate<0||rate>100)throw Error('Merchandise product economics are invalid.');
 const m={id:uid('MERCH'),name:String(data.name).trim(),ipId:asset.id,ipTitle:asset.title,category:data.category||'Collectibles',unitCost:cost,retailPrice:price,royaltyRate:rate,inventory:units,unitsSold:0,revenue:0,costOfGoods:0,royaltyAccrued:0,status:'Active',created:active.date};
 e.merchandise.unshift(m);if(rate>0)e.royalties.unshift({id:uid('ROY'),ipId:asset.id,ipTitle:asset.title,projectId:asset.projectId||'',merchandiseId:m.id,payee:asset.creator||asset.rightsOwner||'Rights holder',rate,basis:'gross',accrued:0,paid:0,status:'Active',created:active.date,notes:'Product royalty for '+m.name});log('Merchandise product added',m.name+' · '+units+' units');persist('Merchandise product added.');return m;
}
function sellMerchandise(id,units){
 const m=ensure().merchandise.find(x=>x.id===id);units=Math.floor(money(units));
 if(!m||m.status!=='Active'||units<1||units>m.inventory)throw Error('Sale exceeds available merchandise inventory.');
 const revenue=units*m.retailPrice,cost=units*m.unitCost,royalty=Math.round(revenue*m.royaltyRate/100*100)/100;
 if(!postCash('Merchandise cost of goods — '+m.name,'Merchandise cost of sales',-cost,active.date,{merchandiseId:m.id}))throw Error('Insufficient cash to fulfil this merchandise sale.');
 if(!recordRevenue('Merchandise sales — '+m.name,revenue,active.date,{ipId:m.ipId,merchandiseId:m.id,royaltyBasis:'gross'}))throw Error('Merchandise revenue could not be posted.');
 m.inventory-=units;m.unitsSold+=units;m.revenue+=revenue;m.costOfGoods+=cost;m.royaltyAccrued+=royalty;
 // IP-level royalty agreements accrue through recordRevenue(); the product's
 // own royalty meter is tracked separately to avoid double-accruing the same sale.
 log('Merchandise sale',m.name+' · '+units+' units · '+revenue);persist('Merchandise sale recorded.');return {units,revenue,cost,royalty,inventory:m.inventory};
}
function addRoyalty(data){
 const e=ensure(),asset=ip(data.ipId),rate=money(data.rate);
 if(!asset||!data.payee||rate<0||rate>100||!['gross','net'].includes(data.basis||'gross'))throw Error('Royalty agreement terms are invalid.');
 const r={id:uid('ROY'),ipId:asset.id,ipTitle:asset.title,projectId:data.projectId||asset.projectId||'',payee:String(data.payee).trim(),rate,basis:data.basis||'gross',accrued:0,paid:0,status:'Active',created:active.date,notes:String(data.notes||'')};
 e.royalties.unshift(r);log('Royalty agreement added',asset.title+' · '+r.payee+' · '+rate+'%');persist('Royalty agreement added.');return r;
}
function addPlatform(data){
 const e=ensure(),name=String(data.name||'').trim(),type=String(data.type||'SVOD'),territory=String(data.territory||'Worldwide'),subscribers=Math.floor(money(data.subscribers)),rpm=money(data.monthlyRevenuePerSubscriber),reliability=money(data.reliability??80);
 if(!name||!territory||subscribers<0||rpm<0||reliability<0||reliability>100)throw Error('Platform profile is invalid.');
 if(e.platforms.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('A platform with this name already exists.');
 const p={id:uid('PLAT'),name,type,territory,subscribers,monthlyRevenuePerSubscriber:rpm,reliability,active:true,created:active.date};
 e.platforms.push(p);log('Platform relationship created',p.name+' · '+p.type+' · '+p.territory);persist('Platform relationship added.');return p;
}
function settleRoyalties(date=active.date){
 const e=ensure();let paid=0,failed=0;
 e.royalties.filter(r=>r.status==='Active'&&money(r.accrued)>0).forEach(r=>{
  const amount=Math.round(money(r.accrued)*100)/100;
  if(!postCash('Royalty settlement — '+r.ipTitle+' — '+r.payee,'Talent & IP royalties',-amount,date,{royaltyId:r.id,ipId:r.ipId})){failed++;return;}
  r.paid=money(r.paid)+amount;r.accrued=0;r.lastPaid=date;paid+=amount;
 });
 return {paid,failed};
}
function processReleaseDay(r,date){
 if(r.status==='Scheduled'&&r.openingDate<=date)r.status='Active';
 if(r.status!=='Active'||r.openingDate>date)return;
 if(r.daysRun>=r.expectedRunDays){r.status='Completed';return;}
 const seed=active.worldSeed||hashSeed(active.id),day=new Date(date+'T00:00:00Z').getUTCDay(),market=active.market?.economy?.cinemaAttendance||'100',week=Math.floor(r.daysRun/7);
 const weekend=day===5||day===6?1.32:0.72,decay=Math.max(.12,1-week*.115),demand=.55+Number(stableUnit(seed,r.id+'|'+date))*0.9;
 const gross=Math.round(r.screens*money(r.averageTicket)*weekend*decay*demand*100)/100;
 const studio=gross*(1-r.exhibitorShare/100-r.distributorFee/100);
 r.dailyGross=gross;r.totalGross=Math.round((money(r.totalGross)+gross)*100)/100;r.studioReceipts=Math.round((money(r.studioReceipts)+studio)*100)/100;r.daysRun++;
 if(studio>0)recordRevenue('Theatrical receipts — '+r.projectTitle+' — '+r.territory,studio,date,{projectId:r.projectId,releaseId:r.id,boxOfficeGross:gross});
 if(r.daysRun>=r.expectedRunDays)r.status='Completed';
}
function processCampaignDay(c,date){
 if(c.status!=='Active'||date<c.startDate)return;
 const seed=active.worldSeed||hashSeed(active.id),d=Number(stableUnit(seed,c.id+'|'+date)),reach=Math.max(0,c.budget/Math.max(1,c.durationDays)*d*16);
 c.impressions=Math.round(c.impressions+reach*1000);c.engagements=Math.round(c.engagements+reach*1000*(.025+d*.09));c.conversions=Math.round(c.conversions+reach*(.002+d*.012));c.brandLift=Math.min(100,c.brandLift+.015+d*.055);
 if(date>=c.endDate)c.status='Completed';
}
function processMonth(date){
 const e=ensure(),month=date.slice(0,7);if(e.lastMonthlyDate===month)return;
 e.lastMonthlyDate=month;
 e.deals.filter(d=>d.status==='Active'&&d.startDate<=date&&(!d.endDate||d.endDate>=date)&&['Streaming SVOD','Streaming AVOD','Broadcast TV','Cable TV'].includes(d.channel)).forEach(d=>{
  const desired=d.channel.includes('AVOD')?'avod':d.channel.includes('SVOD')?'svod':d.channel.includes('Broadcast')?'broadcast':d.channel.includes('Cable')?'cable':'stream';
  const platform=e.platforms.find(p=>p.active&&(String(p.type).toLowerCase().includes(desired)||String(p.name).toLowerCase().includes(desired)))||e.platforms.find(p=>p.active);
  if(!platform)return;
  const base=money(platform.subscribers||500000),views=Math.round(base*(.12+Number(stableUnit(active.worldSeed||hashSeed(active.id),d.id+'|'+month))*.42));
  const gross=views*(money(platform.monthlyRevenuePerSubscriber)||4)/Math.max(1,base);
  const net=Math.max(0,gross*d.revenueShare/100);
  d.reportedRevenue=money(d.reportedRevenue)+gross;
  if(net>0){const posted=recordRevenue('Platform statement — '+d.projectTitle+' — '+platform.name,net,date,{projectId:d.projectId,dealId:d.id,platformId:platform.id});d.paidToDate=money(d.paidToDate)+posted;}
 });
 if(Number(date.slice(8,10))===1){const result=settleRoyalties(date);if(result.failed)log('Royalty settlement delayed',result.failed+' payment(s) could not be posted.');}
}
function stepDay(date){
 const e=ensure();if(!e||!isoDate(date)||e.lastProcessedDate===date)return {skipped:true};
 e.deals.forEach(d=>{if(d.status==='Active'&&d.endDate&&d.endDate<date){const topUp=Math.max(0,money(d.minimumGuarantee)-money(d.paidToDate));if(topUp>0){const posted=recordRevenue('Minimum guarantee settlement — '+d.projectTitle+' — '+d.licensee,topUp,date,{projectId:d.projectId,dealId:d.id});if(!posted){d.settlementPending=true;return;}d.paidToDate=money(d.paidToDate)+posted;}d.settlementPending=false;d.status='Completed';}});
 e.releases.forEach(r=>processReleaseDay(r,date));
 e.campaigns.forEach(c=>processCampaignDay(c,date));
 if(date.slice(8,10)==='01')processMonth(date);
 e.lastProcessedDate=date;return {date,releases:e.releases.length,campaigns:e.campaigns.length};
}
function audit(){
 const e=ensure(),tests=[],add=(name,ok,detail='')=>tests.push({name,ok:!!ok,detail:String(detail)});
 const ids=[...e.deals,...e.offers,...e.releases,...e.campaigns,...e.merchandise,...e.royalties].map(x=>x.id);
 add('Ecosystem record identifiers are unique',new Set(ids).size===ids.length,'Across deals, offers, releases, campaigns, products and royalty agreements.');
 add('Distribution deal terms are valid',e.deals.every(d=>d.id&&d.projectId&&d.licensee&&d.territory&&d.rights&&isoDate(d.startDate)&&(!d.endDate||isoDate(d.endDate)&&d.endDate>=d.startDate)&&money(d.upfrontFee)>=0&&money(d.revenueShare)>=0&&money(d.revenueShare)<=100&&money(d.distributorFee)>=0&&money(d.distributorFee)<=100&&money(d.revenueShare)+money(d.distributorFee)<=100),'All rights windows and financial shares are bounded.');
 add('No overlapping exclusive rights grants',e.deals.every(d=>!hasConflict(d,d.id)),'Exclusive rights cannot be granted twice over overlapping territory, rights and dates, including regional territories.');
 add('Audience and fandom records are structurally valid',e.audienceSegments.every(x=>x.id&&x.name&&x.audienceIndex>=0&&x.engagement>=0&&x.engagement<=100)&&e.fandoms.every(x=>x.id&&x.projectId&&x.name&&x.members>=0&&x.engagement>=0&&x.engagement<=100)&&e.reviews.every(x=>x.id&&x.projectId&&x.critic&&x.score>=0&&x.score<=100),'Audience segments, fan communities and critic reviews stay within valid ranges.');
 add('Negotiation records have valid status',e.offers.every(o=>['Negotiating','Accepted','Rejected'].includes(o.status)),'Offers use a controlled negotiation state.');
 add('Theatrical release economics are valid',e.releases.every(r=>r.id&&r.projectId&&isoDate(r.openingDate)&&r.screens>0&&r.averageTicket>0&&r.exhibitorShare>=0&&r.distributorFee>=0&&r.exhibitorShare+r.distributorFee<100&&r.daysRun>=0&&r.totalGross>=0),'Release schedules, shares and receipts are non-negative.');
 add('Marketing campaign metrics are finite',e.campaigns.every(c=>c.id&&c.projectId&&c.budget>=0&&c.impressions>=0&&c.engagements>=0&&c.conversions>=0&&Number.isFinite(c.brandLift)),'Marketing measurement remains finite.');
 add('Merchandise inventory and unit economics reconcile',e.merchandise.every(m=>m.inventory>=0&&m.unitsSold>=0&&m.unitCost>=0&&m.retailPrice>m.unitCost&&m.revenue>=0&&m.costOfGoods>=0),'Stock never becomes negative and unit economics remain positive.');
 add('Platform partner profiles are valid',e.platforms.every(p=>p.id&&p.name&&p.type&&p.territory&&p.subscribers>=0&&p.monthlyRevenuePerSubscriber>=0&&p.reliability>=0&&p.reliability<=100),'Partner audiences, unit economics and reliability scores are bounded.');
 add('Royalty balances are finite and non-negative',e.royalties.every(r=>r.rate>=0&&r.rate<=100&&r.accrued>=0&&r.paid>=0&&Number.isFinite(r.accrued+r.paid)),'Accrued and settled royalty balances reconcile.');
 add('Revenue event amounts are finite',e.revenueEvents.every(r=>r.id&&isoDate(r.date)&&Number.isFinite(r.amount)&&r.amount>0),'Revenue events are auditable and date-stamped.');
 add('Ecosystem checkpoint matches campaign clock',!e.lastProcessedDate||e.lastProcessedDate<=active.date,'Daily ecosystem processing cannot run ahead of campaign time.');
 add('Campaign save serialization',(()=>{try{JSON.stringify(active);return true}catch(e){return false}})(),'Phase 6 records remain serializable in the campaign save.');
 return {passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};
}
function form(title,html,submit){show(title,html);const f=$('p6form');if(!f)throw Error('Phase 6 form could not be opened.');f.onsubmit=e=>{e.preventDefault();try{submit();close();render();persist();toast(title+' saved.');}catch(err){toast(err.message||'Unable to save.');}};}
function projectOptions(min=0){return (active?.projects||[]).filter(p=>p.stage>=min).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.title)+' · '+esc(p.format||'Project')+'</option>').join('');}
function ipOptions(){return (active?.company?.ipAssets||[]).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>').join('');}
function addDealForm(){
 form('Negotiate distribution deal','<form id="p6form"><div class="formgrid"><div class="field"><label>Project</label><select id="p6project" required>'+projectOptions()+'</select></div><div class="field"><label>Licensee / distributor</label><input id="p6licensee" required></div><div class="field"><label>Distribution channel</label><select id="p6channel">'+CHANNELS.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>Territory</label><input id="p6territory" value="Worldwide" required></div><div class="field"><label>Rights granted</label><select id="p6rights">'+RIGHTS.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>Start date</label><input id="p6start" type="date" value="'+active.date+'" required></div><div class="field"><label>End date (optional)</label><input id="p6end" type="date"></div><div class="field"><label>Upfront fee / minimum guarantee</label><input id="p6fee" type="number" min="0" step=".01" value="0"></div><div class="field"><label>Studio revenue share (%)</label><input id="p6share" type="number" min="0" max="100" step=".01" value="70"></div><div class="field"><label>Distributor fee (%)</label><input id="p6distfee" type="number" min="0" max="100" step=".01" value="10"></div><div class="field"><label>Exclusive rights</label><select id="p6exclusive"><option value="yes">Exclusive</option><option value="no">Non-exclusive</option></select></div></div><div class="field" style="margin-top:10px"><label>Contract notes</label><textarea id="p6notes"></textarea></div><button class="btn primary">Sign distribution deal</button></form>',()=>addDistributionDeal({projectId:$('p6project').value,licensee:$('p6licensee').value,channel:$('p6channel').value,territory:$('p6territory').value,rights:$('p6rights').value,startDate:$('p6start').value,endDate:$('p6end').value||null,upfrontFee:$('p6fee').value,revenueShare:$('p6share').value,distributorFee:$('p6distfee').value,exclusive:$('p6exclusive').value==='yes',notes:$('p6notes').value}));
}
function addOfferForm(){
 form('Receive distribution offer','<form id="p6form"><div class="formgrid"><div class="field"><label>Project</label><select id="p6project" required>'+projectOptions()+'</select></div><div class="field"><label>Licensee / platform</label><input id="p6licensee" required></div><div class="field"><label>Channel</label><select id="p6channel">'+CHANNELS.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>Territory</label><input id="p6territory" value="Worldwide"></div><div class="field"><label>Rights</label><select id="p6rights">'+RIGHTS.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>Upfront / minimum guarantee</label><input id="p6fee" type="number" min="0" step=".01" value="25000"></div><div class="field"><label>Studio share (%)</label><input id="p6share" type="number" min="0" max="100" step=".01" value="70"></div><div class="field"><label>Distributor fee (%)</label><input id="p6distfee" type="number" min="0" max="100" step=".01" value="10"></div><div class="field"><label>Start date</label><input id="p6start" type="date" value="'+active.date+'"></div><div class="field"><label>End date</label><input id="p6end" type="date"></div></div><button class="btn primary">Add offer to negotiations</button></form>',()=>createOffer({projectId:$('p6project').value,licensee:$('p6licensee').value,channel:$('p6channel').value,territory:$('p6territory').value,rights:$('p6rights').value,upfrontFee:$('p6fee').value,revenueShare:$('p6share').value,distributorFee:$('p6distfee').value,startDate:$('p6start').value,endDate:$('p6end').value||null}));
}
function addReleaseForm(){
 form('Schedule theatrical release','<form id="p6form"><div class="formgrid"><div class="field"><label>Released project</label><select id="p6project" required>'+projectOptions(6)+'</select></div><div class="field"><label>Territory</label><input id="p6territory" value="Domestic"></div><div class="field"><label>Opening date</label><input id="p6opening" type="date" value="'+active.date+'"></div><div class="field"><label>Number of screens</label><input id="p6screens" type="number" min="1" value="250"></div><div class="field"><label>Average ticket price</label><input id="p6ticket" type="number" min=".01" step=".01" value="12"></div><div class="field"><label>Exhibitor share (%)</label><input id="p6exhibitor" type="number" min="0" max="100" value="50"></div><div class="field"><label>Distributor fee (%)</label><input id="p6distfee" type="number" min="0" max="100" value="10"></div><div class="field"><label>Run length (days)</label><input id="p6days" type="number" min="7" max="365" value="56"></div></div><button class="btn primary">Schedule release</button></form>',()=>addRelease({projectId:$('p6project').value,territory:$('p6territory').value,openingDate:$('p6opening').value,screens:$('p6screens').value,averageTicket:$('p6ticket').value,exhibitorShare:$('p6exhibitor').value,distributorFee:$('p6distfee').value,expectedRunDays:$('p6days').value}));
}
function addCampaignForm(){
 form('Launch marketing campaign','<form id="p6form"><div class="formgrid"><div class="field"><label>Project</label><select id="p6project" required>'+projectOptions(4)+'</select></div><div class="field"><label>Campaign name</label><input id="p6name" required></div><div class="field"><label>Channel</label><select id="p6channel"><option>Trailer / video</option><option>Social media</option><option>Press & publicity</option><option>Influencer / creator</option><option>Outdoor & print</option><option>Television advertising</option><option>Festival / premiere</option><option>Community / fan events</option></select></div><div class="field"><label>Target audience</label><select id="p6segment">'+SEGMENTS.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>Budget</label><input id="p6budget" type="number" min="0" step=".01" value="10000"></div><div class="field"><label>Duration (days)</label><input id="p6duration" type="number" min="1" max="730" value="30"></div></div><button class="btn primary">Launch campaign</button></form>',()=>addCampaign({projectId:$('p6project').value,name:$('p6name').value,channel:$('p6channel').value,segment:$('p6segment').value,budget:$('p6budget').value,durationDays:$('p6duration').value}));
}
function addMerchForm(){
 form('Create merchandise product','<form id="p6form"><div class="formgrid"><div class="field"><label>Linked IP asset</label><select id="p6ip" required>'+ipOptions()+'</select></div><div class="field"><label>Product name</label><input id="p6name" required></div><div class="field"><label>Category</label><select id="p6category"><option>Apparel</option><option>Collectibles</option><option>Home & lifestyle</option><option>Books & print</option><option>Soundtrack</option><option>Games & digital</option></select></div><div class="field"><label>Initial inventory</label><input id="p6stock" type="number" min="0" value="100"></div><div class="field"><label>Unit manufacturing cost</label><input id="p6cost" type="number" min="0" step=".01" value="5"></div><div class="field"><label>Retail price</label><input id="p6price" type="number" min=".01" step=".01" value="20"></div><div class="field"><label>Creator royalty (%)</label><input id="p6royalty" type="number" min="0" max="100" step=".01" value="5"></div></div><button class="btn primary">Add product</button></form>',()=>addMerchandise({ipId:$('p6ip').value,name:$('p6name').value,category:$('p6category').value,initialStock:$('p6stock').value,unitCost:$('p6cost').value,retailPrice:$('p6price').value,royaltyRate:$('p6royalty').value}));
}
function addPlatformForm(){
 form('Add distribution platform','<form id="p6form"><div class="formgrid"><div class="field"><label>Platform name</label><input id="p6platformname" required></div><div class="field"><label>Platform type</label><select id="p6platformtype"><option>SVOD</option><option>AVOD</option><option>FAST</option><option>Broadcast</option><option>Cable</option><option>TVOD</option><option>Music streaming</option><option>Game / Interactive</option></select></div><div class="field"><label>Territory</label><input id="p6platformterritory" value="Worldwide"></div><div class="field"><label>Subscribers / active users</label><input id="p6platformsubs" type="number" min="0" value="100000"></div><div class="field"><label>Monthly revenue per subscriber</label><input id="p6platformrpm" type="number" min="0" step=".01" value="5"></div><div class="field"><label>Reliability score (0–100)</label><input id="p6platformreliability" type="number" min="0" max="100" value="85"></div></div><button class="btn primary">Add platform partner</button></form>',()=>addPlatform({name:$('p6platformname').value,type:$('p6platformtype').value,territory:$('p6platformterritory').value,subscribers:$('p6platformsubs').value,monthlyRevenuePerSubscriber:$('p6platformrpm').value,reliability:$('p6platformreliability').value}));
}
function addRoyaltyForm(){
 form('Create royalty agreement','<form id="p6form"><div class="formgrid"><div class="field"><label>IP asset</label><select id="p6ip" required>'+ipOptions()+'</select></div><div class="field"><label>Payee / creator</label><input id="p6payee" required></div><div class="field"><label>Royalty rate (%)</label><input id="p6rate" type="number" min="0" max="100" step=".01" value="5"></div><div class="field"><label>Royalty basis</label><select id="p6basis"><option value="gross">Gross revenue</option><option value="net">Net revenue</option></select></div></div><button class="btn primary">Save royalty agreement</button></form>',()=>addRoyalty({ipId:$('p6ip').value,payee:$('p6payee').value,rate:$('p6rate').value,basis:$('p6basis').value}));
}
function render(){
 const page=$('page-ecosystem');if(!page)return;
 const e=ensure(),host=$('p6-content');if(!host)return;
 if(!active){host.innerHTML='<div class="empty">Create or load a campaign to operate the entertainment ecosystem.</div>';return;}
 const revenue=e.revenueEvents.reduce((a,x)=>a+money(x.amount),0),dealValue=e.deals.reduce((a,x)=>a+money(x.upfrontFee),0),box=e.releases.reduce((a,x)=>a+money(x.totalGross),0),stock=e.merchandise.reduce((a,x)=>a+money(x.inventory),0);
 const rows=(items,empty,fn)=>items.length?items.slice(0,12).map(fn).join(''):'<div class="empty">'+empty+'</div>';
 host.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">ACTIVE RIGHTS DEALS</div><div class="statvalue">'+e.deals.filter(x=>x.status==='Active').length+'</div></div><div class="card"><div class="statlabel">ECOSYSTEM REVENUE</div><div class="statvalue">'+fmt(revenue)+'</div></div><div class="card"><div class="statlabel">THEATRICAL GROSS</div><div class="statvalue">'+fmt(box)+'</div></div><div class="card"><div class="statlabel">MERCH INVENTORY</div><div class="statvalue">'+stock.toLocaleString()+'</div></div></div>'+
 '<div class="card"><div class="cardhead"><b class="cardtitle">Distribution, rights & release control</b><span class="tag gold">PHASE 6</span></div><div class="actions"><button class="btn primary" id="p6-add-deal">＋ Distribution deal</button><button class="btn" id="p6-add-offer">＋ Negotiate offer</button><button class="btn" id="p6-add-release">＋ Theatrical release</button><button class="btn" id="p6-add-campaign">＋ Marketing campaign</button><button class="btn" id="p6-add-merch">＋ Merchandise</button><button class="btn" id="p6-add-royalty">＋ Royalty agreement</button><button class="btn" id="p6-open-media">Media & publicity</button><button class="btn" id="p6-open-awards">Awards & festivals</button></div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><div class="cardhead"><b class="cardtitle">Distribution deals & rights windows</b><span class="tiny">'+e.deals.length+' agreements</span></div>'+rows(e.deals,'No distribution deals yet.',d=>'<div class="rowitem"><span><b>'+esc(d.projectTitle)+'</b><div class="tiny">'+esc(d.channel)+' · '+esc(d.licensee)+' · '+esc(d.territory)+' · '+esc(d.rights)+'</div><div class="tiny">'+esc(d.startDate)+' → '+esc(d.endDate||'Open term')+' · Studio share '+d.revenueShare+'%</div></span><b>'+fmt(d.upfrontFee)+'</b></div>')+'</div><div class="card"><div class="cardhead"><b class="cardtitle">Distribution negotiations</b><span class="tiny">'+e.offers.filter(o=>o.status==='Negotiating').length+' open offers</span></div>'+rows(e.offers,'No active distribution negotiations.',o=>'<div class="rowitem"><span><b>'+esc(o.licensee)+'</b><div class="tiny">'+esc(o.projectTitle)+' · '+esc(o.channel)+' · '+esc(o.territory)+' · '+esc(o.rights)+'</div><div class="tiny">Offer '+fmt(o.upfrontFee)+' · Studio share '+o.revenueShare+'% · '+o.rounds.length+' counter(s)</div></span><span class="actions"><button class="btn" data-p6-counter="'+esc(o.id)+'">Counter</button><button class="btn" data-p6-accept="'+esc(o.id)+'">Accept</button><button class="btn" data-p6-reject="'+esc(o.id)+'">Reject</button></span></div>')+'</div><div class="card"><div class="cardhead"><b class="cardtitle">Theatrical release slate</b><span class="tiny">'+e.releases.length+' releases</span></div>'+rows(e.releases,'No theatrical releases scheduled.',r=>'<div class="rowitem"><span><b>'+esc(r.projectTitle)+'</b><div class="tiny">'+esc(r.territory)+' · '+esc(r.status)+' · '+r.screens+' screens · '+r.daysRun+'/'+r.expectedRunDays+' days</div><div class="tiny">Gross '+fmt(r.totalGross)+' · Studio receipts '+fmt(r.studioReceipts)+'</div></span><span class="tag">'+esc(r.openingDate)+'</span></div>')+'</div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><div class="cardhead"><b class="cardtitle">Marketing & audience analytics</b><span class="tiny">'+e.campaigns.length+' campaigns</span></div>'+rows(e.campaigns,'No marketing campaigns.',c=>'<div class="rowitem"><span><b>'+esc(c.name)+'</b><div class="tiny">'+esc(c.projectTitle)+' · '+esc(c.channel)+' · '+esc(c.segment)+' · '+esc(c.status)+'</div><div class="tiny">'+c.impressions.toLocaleString()+' impressions · '+c.engagements.toLocaleString()+' engagements · '+c.conversions.toLocaleString()+' conversions</div></span><b>'+fmt(c.budget)+'</b></div>')+'</div><div class="card"><div class="cardhead"><b class="cardtitle">Merchandise & consumer products</b><span class="tiny">'+e.merchandise.length+' products</span></div>'+rows(e.merchandise,'No merchandise products.',m=>'<div class="rowitem"><span><b>'+esc(m.name)+'</b><div class="tiny">'+esc(m.ipTitle)+' · '+esc(m.category)+' · '+m.inventory+' in stock</div><div class="tiny">'+m.unitsSold+' sold · Revenue '+fmt(m.revenue)+' · Royalty '+fmt(m.royaltyAccrued)+'</div></span><button class="btn" data-p6-sell="'+esc(m.id)+'">Sell units</button></div>')+'</div></div>'+
 '<div class="grid cols" style="margin-top:14px"><div class="card"><div class="cardhead"><b class="cardtitle">Creator royalties</b><span class="tiny">'+e.royalties.length+' agreements</span></div>'+rows(e.royalties,'No royalty agreements.',r=>'<div class="rowitem"><span><b>'+esc(r.payee)+'</b><div class="tiny">'+esc(r.ipTitle)+' · '+r.rate+'% of '+esc(r.basis)+' · '+esc(r.status)+'</div><div class="tiny">Accrued '+fmt(r.accrued)+' · Paid '+fmt(r.paid)+'</div></span><span class="tag">'+esc(r.lastPaid||'Unsettled')+'</span></div>')+'</div><div class="card"><div class="cardhead"><b class="cardtitle">Platform relationships</b><span class="tiny">'+e.platforms.length+' partners</span></div><button class="btn" id="p6-add-platform">＋ Add platform partner</button>'+rows(e.platforms,'No platform partners.',p=>'<div class="rowitem"><span><b>'+esc(p.name)+'</b><div class="tiny">'+esc(p.type)+' · '+esc(p.territory)+' · '+Number(p.subscribers||0).toLocaleString()+' subscribers</div></span><span class="tag '+(p.active?'green':'')+'">'+(p.active?'Active':'Inactive')+'</span></div>')+'</div></div>'+
 '<div class="card" style="margin-top:14px"><div class="cardhead"><b class="cardtitle">Ecosystem activity ledger</b><span class="tiny">'+e.history.length+' events</span></div>'+rows(e.history,'No ecosystem activity recorded.',x=>'<div class="rowitem"><span><b>'+esc(x.action)+'</b><div class="tiny">'+esc(x.detail)+'</div></span><span class="tiny">'+esc(x.date)+'</span></div>')+'</div>'+
 '<div class="card" style="margin-top:14px"><div class="cardhead"><b class="cardtitle">Phase 6 integrity audit</b><span class="tiny">RIGHTS · REVENUE · AUDIENCE · ROYALTIES</span></div><div class="rowitem"><b>'+audit().passed+' passed · '+audit().failed+' failed</b><button class="btn" id="p6-audit">Run audit</button></div><div id="p6-audit-results"></div></div>';
 $('p6-open-media').onclick=()=>window.nav('media');$('p6-open-awards').onclick=()=>window.nav('awards');$('p6-add-deal').onclick=addDealForm;$('p6-add-offer').onclick=addOfferForm;$('p6-add-platform').onclick=addPlatformForm;$('p6-add-release').onclick=addReleaseForm;$('p6-add-campaign').onclick=addCampaignForm;$('p6-add-merch').onclick=addMerchForm;$('p6-add-royalty').onclick=addRoyaltyForm;
 host.querySelectorAll('[data-p6-counter]').forEach(b=>b.onclick=()=>{const o=e.offers.find(x=>x.id===b.dataset.p6Counter);if(!o)return;const fee=prompt('Counter-offer upfront fee',String(o.upfrontFee));if(fee===null)return;const share=prompt('Counter-offer studio revenue share (%)',String(o.revenueShare));if(share===null)return;const distributor=prompt('Counter-offer distributor fee (%)',String(o.distributorFee));if(distributor===null)return;try{counterOffer(o.id,{upfrontFee:fee,revenueShare:share,distributorFee:distributor});render();}catch(err){toast(err.message);}});
 host.querySelectorAll('[data-p6-accept]').forEach(b=>b.onclick=()=>{try{acceptOffer(b.dataset.p6Accept);render();}catch(err){toast(err.message);}});
 host.querySelectorAll('[data-p6-reject]').forEach(b=>b.onclick=()=>{try{rejectOffer(b.dataset.p6Reject);render();}catch(err){toast(err.message);}});
 host.querySelectorAll('[data-p6-sell]').forEach(b=>b.onclick=()=>{const units=prompt('Units to sell');if(units===null)return;try{sellMerchandise(b.dataset.p6Sell,units);render();}catch(err){toast(err.message);}});
 $('p6-audit').onclick=()=>{const a=audit();$('p6-audit-results').innerHTML=a.tests.map(t=>'<div class="rowitem"><span>'+esc(t.name)+'<div class="tiny">'+esc(t.detail)+'</div></span><b style="color:'+(t.ok?'var(--green)':'var(--red)')+'">'+(t.ok?'PASS':'FAIL')+'</b></div>').join('');};
}
function install(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!$('page-ecosystem')){
  const b=document.createElement('button');b.dataset.page='ecosystem';b.innerHTML='<span>◈</span>Ecosystem';b.onclick=()=>window.nav('ecosystem');nav.appendChild(b);
  const page=document.createElement('section');page.className='page';page.id='page-ecosystem';
  page.innerHTML='<div class="hero"><div><div class="eyebrow">PHASE 6 · ENTERTAINMENT ECOSYSTEM</div><h1 class="h1">Distribution & ecosystem</h1><p class="sub">Rights windows, distribution economics, streaming partners, theatrical receipts, creator royalties, marketing intelligence and merchandise.</p></div></div><div id="p6-content"></div>';
  content.appendChild(page);
 }
 const prior=window.render;
 if(typeof prior==='function'&&!prior.__p6Wrapped){const wrapped=function(...args){const out=prior.apply(this,args);render();return out;};wrapped.__p6Wrapped=true;window.render=wrapped;}
 const priorDay=window.simulateLifeDay;
 if(typeof priorDay==='function'&&!priorDay.__p6Wrapped){const wrapped=function(...args){const out=priorDay.apply(this,args);stepDay(args[0]||active?.date);return out;};wrapped.__p6Wrapped=true;window.simulateLifeDay=wrapped;}
 render();
}
window.Phase6Ecosystem={version:'6.1.0',ensure,addPlatform,addDistributionDeal,createOffer,counterOffer,acceptOffer,rejectOffer,addRelease,addCampaign,addMerchandise,sellMerchandise,addRoyalty,settleRoyalties,stepDay,audit,render,hasConflict};
try{window.StudioPhase0?.registerModule({id:'ecosystem',name:'Entertainment ecosystem',deps:['kernel','rights','media','production','finance','economy'],owns:['distribution agreements','rights windows','theatrical releases','platform revenue','marketing analytics','merchandise','creator royalties'],status:'implemented'});}catch(e){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();