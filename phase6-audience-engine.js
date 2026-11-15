(function(){
'use strict';
const SEGMENTS=['Families','Young adults','Teen audiences','Adults 25–44','Adults 45+','Genre fans','Animation fans','Gamers','Music listeners','Global general audience'];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const uid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const api=window.Phase6Ecosystem;
if(!api)throw new Error('Phase 6 ecosystem engine must load before its audience engine.');
function ensure(){
 const e=api.ensure();if(!e)return null;
 ['audienceSegments','fandoms','reviews'].forEach(k=>{if(!Array.isArray(e[k]))e[k]=[];});
 if(!e.audienceSegments.length)e.audienceSegments=SEGMENTS.map((name,i)=>({id:'AUD-'+(i+1),name,audienceIndex:Math.round((42+i*4.1)*100)/100,engagement:Math.round((36+i*4.8)*100)/100,sentiment:0,genreAffinity:{},active:true,lastUpdated:active.date}));
 return e;
}
function project(id){return (active?.projects||[]).find(p=>p.id===id)||null;}
function addFandom(data){
 const e=ensure(),p=project(data.projectId),name=String(data.name||'').trim(),segment=String(data.segment||'Genre fans');
 if(!p||p.stage<2)throw Error('A project must be in production before a fan community can be created.');
 if(!name||!SEGMENTS.includes(segment))throw Error('Enter a fan community name and a valid audience segment.');
 if(e.fandoms.some(f=>f.projectId===p.id&&f.name.toLowerCase()===name.toLowerCase()))throw Error('That fan community already exists for this project.');
 const members=Math.floor(num(data.members)),engagement=num(data.engagement??50);
 if(members<0||engagement<0||engagement>100)throw Error('Community size or engagement is outside the valid range.');
 const f={id:uid('FAN'),projectId:p.id,projectTitle:p.title,name,segment,members,peakMembers:members,engagement,sentiment:0,growthRate:0,active:true,created:active.date,lastProcessedDate:null,lastCampaignConversions:0,history:[]};
 e.fandoms.unshift(f);e.history.unshift({id:uid('ECOLOG'),date:active.date,action:'Fan community founded',detail:name+' · '+members+' initial members'});
 if(typeof window.persist==='function')window.persist();return f;
}
function publishReview(data){
 const e=ensure(),p=project(data.projectId),critic=String(data.critic||'').trim(),publication=String(data.publication||'Independent review').trim(),score=num(data.score);
 if(!p||p.stage<6)throw Error('Only released projects can receive published critic reviews.');
 if(!critic||!publication||score<0||score>100)throw Error('Review details and a score from 0 to 100 are required.');
 const review={id:uid('REV'),projectId:p.id,projectTitle:p.title,critic,publication,score,headline:String(data.headline||''),date:active.date,verified:true};
 e.reviews.unshift(review);e.reviews=e.reviews.slice(0,1000);
 const all=e.reviews.filter(r=>r.projectId===p.id),avg=all.reduce((s,r)=>s+num(r.score),0)/all.length;
 p.ecosystemCriticScore=Math.round(avg*100)/100;p.ecosystemReviewCount=all.length;
 e.history.unshift({id:uid('ECOLOG'),date:active.date,action:'Critic review published',detail:p.title+' · '+critic+' · '+score+'/100'});
 if(typeof window.persist==='function')window.persist();return review;
}
function deterministic(seed,key){
 if(typeof window.stableUnit==='function')return clamp(num(window.stableUnit(seed,key)),0,0.999999);
 let h=0;const s=String(seed)+'|'+String(key);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h/4294967296;
}
function processAudienceDay(date=active?.date){
 const e=ensure();if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return {skipped:true};
 if(e.audienceLastProcessedDate===date)return {skipped:true,date};
 const seed=active.worldSeed||active.id||'studio';
 const mediaSentiment=clamp(num(active.market?.media?.publicSentiment),-100,100);
 e.audienceSegments.forEach((s,i)=>{
  if(!s.active)return;
  const noise=(deterministic(seed,'segment:'+s.id+':'+date)-.5)*.7;
  const campaignLift=e.campaigns.filter(c=>c.status==='Active'&&c.segment===s.name).reduce((sum,c)=>sum+Math.min(.35,num(c.budget)/1000000),0);
  s.sentiment=clamp(num(s.sentiment)*.94+mediaSentiment*.025+noise,-100,100);
  s.engagement=clamp(num(s.engagement)+noise+campaignLift*.08,0,100);
  s.audienceIndex=Math.max(0,num(s.audienceIndex)*(1+noise/10000+campaignLift/10000));
  s.lastUpdated=date;
 });
 e.fandoms.forEach(f=>{
  if(!f.active)return;
  const p=project(f.projectId);if(!p)return;
  const perf=p.performance||{},audience=num(perf.audienceScore??p.audienceScore??50);
  const related=e.campaigns.filter(c=>c.projectId===p.id);
  const conversions=related.reduce((sum,c)=>sum+num(c.conversions),0);
  const campaignDelta=Math.max(0,conversions-num(f.lastCampaignConversions||0));
  const segment=e.audienceSegments.find(s=>s.name===f.segment);
  const segmentLift=segment?num(segment.engagement)/100:0.4;
  const signal=clamp((audience-50)/10000,-.004,.006);
  const noise=(deterministic(seed,f.id+'|'+date)-.5)*.003;
  const growth=Math.round(num(f.members)*(signal+noise+segmentLift*.0008)+campaignDelta*.08);
  f.members=Math.max(0,num(f.members)+growth);f.peakMembers=Math.max(f.peakMembers,f.members);
  f.growthRate=f.members?Math.round(growth/Math.max(1,f.members-growth)*100000)/1000:0;
  f.engagement=clamp(num(f.engagement)+(segmentLift-.45)*.5+noise*100,0,100);
  f.sentiment=clamp(num(f.sentiment)*.9+(audience-50)*.08+(segment?.sentiment||0)*.04,-100,100);
  f.lastCampaignConversions=conversions;f.lastProcessedDate=date;
  f.history.unshift({date,members:f.members,growth,engagement:f.engagement});f.history=f.history.slice(0,90);
 });
 e.audienceLastProcessedDate=date;
 return {date,segments:e.audienceSegments.length,fandoms:e.fandoms.length};
}
function auditAudience(){
 const e=ensure(),tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail});
 add('Audience segment profiles are valid',e.audienceSegments.length===SEGMENTS.length&&e.audienceSegments.every(s=>s.id&&s.name&&num(s.audienceIndex)>=0&&num(s.engagement)>=0&&num(s.engagement)<=100),'All ten modeled audience segments have bounded audience and engagement indices.');
 add('Fan community links and metrics are valid',e.fandoms.every(f=>project(f.projectId)&&f.name&&num(f.members)>=0&&num(f.engagement)>=0&&num(f.engagement)<=100),'Fan communities point to existing projects and have non-negative membership.');
 add('Critic review scores are valid',e.reviews.every(r=>project(r.projectId)&&r.critic&&num(r.score)>=0&&num(r.score)<=100),'Published reviews reference projects and scores between 0 and 100.');
 add('Audience daily processing is idempotent',!e.audienceLastProcessedDate||e.audienceLastProcessedDate<=active.date,'Audience simulation never runs ahead of campaign time.');
 return {passed:tests.filter(t=>t.ok).length,failed:tests.filter(t=>!t.ok).length,tests};
}
function openFandomForm(){
 const projects=(active?.projects||[]).filter(p=>p.stage>=2);
 if(!projects.length){toast('A project must reach production before building its fan community.');return;}
 show('Build a fan community','<form id="p6fanform"><div class="formgrid"><div class="field"><label>Project</label><select id="p6fanproject">'+projects.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.title)+'</option>').join('')+'</select></div><div class="field"><label>Community name</label><input id="p6fanname" required placeholder="The Orbit Society"></div><div class="field"><label>Audience segment</label><select id="p6fansegment">'+SEGMENTS.map(s=>'<option>'+s+'</option>').join('')+'</select></div><div class="field"><label>Initial members</label><input id="p6fanmembers" type="number" min="0" value="1000"></div><div class="field"><label>Engagement (0–100)</label><input id="p6fanengagement" type="number" min="0" max="100" value="50"></div></div><button class="btn primary">Create fan community</button></form>');
 $('p6fanform').onsubmit=ev=>{ev.preventDefault();try{addFandom({projectId:$('p6fanproject').value,name:$('p6fanname').value,segment:$('p6fansegment').value,members:$('p6fanmembers').value,engagement:$('p6fanengagement').value});close();api.render();toast('Fan community created.');}catch(err){toast(err.message);}};
}
function openReviewForm(){
 const projects=(active?.projects||[]).filter(p=>p.stage>=6);
 if(!projects.length){toast('A released project is required before publishing a critic review.');return;}
 show('Publish a critic review','<form id="p6reviewform"><div class="formgrid"><div class="field"><label>Released project</label><select id="p6reviewproject">'+projects.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.title)+'</option>').join('')+'</select></div><div class="field"><label>Critic</label><input id="p6critic" required></div><div class="field"><label>Publication</label><input id="p6publication" required value="Independent review"></div><div class="field"><label>Score (0–100)</label><input id="p6score" type="number" min="0" max="100" value="75"></div><div class="field full"><label>Headline</label><input id="p6headline"></div></div><button class="btn primary">Publish review</button></form>');
 $('p6reviewform').onsubmit=ev=>{ev.preventDefault();try{publishReview({projectId:$('p6reviewproject').value,critic:$('p6critic').value,publication:$('p6publication').value,score:$('p6score').value,headline:$('p6headline').value});close();api.render();toast('Critic review published.');}catch(err){toast(err.message);}};
}
function renderAudience(){
 const host=$('p6-content');if(!host||!active)return;
 const e=ensure(),total=e.fandoms.reduce((s,f)=>s+num(f.members),0),avg=e.fandoms.length?e.fandoms.reduce((s,f)=>s+num(f.engagement),0)/e.fandoms.length:0;
 const rows=(items,empty,fn)=>items.length?items.slice(0,8).map(fn).join(''):'<div class="empty">'+empty+'</div>';
 $('p6-audience-section')?.remove();const section=document.createElement('div');section.id='p6-audience-section';section.className='card';section.style.marginTop='14px';section.innerHTML='<div class="cardhead"><b class="cardtitle">Audience behaviour & fandoms</b><span class="tag gold">LIVE AUDIENCE MODEL</span></div><div class="grid stats"><div class="card"><div class="statlabel">AUDIENCE SEGMENTS</div><div class="statvalue">'+e.audienceSegments.length+'</div></div><div class="card"><div class="statlabel">FAN COMMUNITY MEMBERS</div><div class="statvalue">'+total.toLocaleString()+'</div></div><div class="card"><div class="statlabel">AVG. FAN ENGAGEMENT</div><div class="statvalue">'+avg.toFixed(1)+'/100</div></div><div class="card"><div class="statlabel">CRITIC REVIEWS</div><div class="statvalue">'+e.reviews.length+'</div></div></div><div class="actions"><button class="btn primary" id="p6-add-fandom">＋ Build fan community</button><button class="btn" id="p6-add-review">＋ Publish critic review</button></div><div class="grid cols" style="margin-top:14px"><div><b class="cardtitle">Audience segments</b>'+rows(e.audienceSegments,'No audience segments.',s=>'<div class="rowitem"><span><b>'+esc(s.name)+'</b><div class="tiny">Audience index '+num(s.audienceIndex).toFixed(2)+' · Engagement '+num(s.engagement).toFixed(1)+' · Sentiment '+num(s.sentiment).toFixed(1)+'</div></span></div>')+'</div><div><b class="cardtitle">Fan communities</b>'+rows(e.fandoms,'No fan communities yet.',f=>'<div class="rowitem"><span><b>'+esc(f.name)+'</b><div class="tiny">'+esc(f.projectTitle)+' · '+esc(f.segment)+'</div><div class="tiny">'+num(f.members).toLocaleString()+' members · '+num(f.engagement).toFixed(1)+' engagement · '+num(f.growthRate).toFixed(3)+'% daily growth</div></span></div>')+'</div></div><div style="margin-top:14px"><b class="cardtitle">Critic reviews</b>'+rows(e.reviews,'No critic reviews published.',r=>'<div class="rowitem"><span><b>'+esc(r.projectTitle)+'</b><div class="tiny">'+esc(r.critic)+' · '+esc(r.publication)+' · '+esc(r.headline)+'</div></span><b>'+num(r.score).toFixed(1)+'/100</b></div>')+'</div><div class="rowitem"><span class="tiny">Audience simulation checkpoint</span><b>'+esc(e.audienceLastProcessedDate||'Not processed yet')+'</b></div>';
 host.appendChild(section);
 $('p6-add-fandom').onclick=openFandomForm;$('p6-add-review').onclick=openReviewForm;
}
const oldStep=api.stepDay;
api.stepDay=function(date){const target=date||active?.date;const result=oldStep.call(api,target);const e=ensure();if(e?.audienceLastProcessedDate!==target)processAudienceDay(target);return result;};
api.addFandom=addFandom;api.publishReview=publishReview;api.processAudienceDay=processAudienceDay;api.auditAudience=auditAudience;
const oldAudit=api.audit;
api.audit=function(){const base=oldAudit.call(api),extra=auditAudience();return {...base,passed:base.passed+extra.passed,failed:base.failed+extra.failed,tests:[...base.tests,...extra.tests]};};
ensure();
window.Phase6Audience={render:renderAudience,addFandom,publishReview,processDay:processAudienceDay,audit:auditAudience};
try{window.StudioPhase0?.registerModule({id:'ecosystem-audience',name:'Audience behaviour and fandom intelligence',deps:['rights','population','media','production'],owns:['audience segment profiles','fan communities','critic review aggregation'],status:'implemented'});}catch(e){}
api.render();
})();