(function(){
'use strict';
const P=window.StudioPhase0,G=window.StudioGeography,VERSION='1.0.0';
if(!P||!G||!window.Phase3Founder)throw new Error('Geography and founder finance engines are required before global mobility.');
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const round=n=>Math.round(Number(n)*100)/100;
const dateAdd=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const dateValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s))&&!Number.isNaN(Date.parse(s+'T00:00:00Z'));
function ensure(){
 if(!active)return null;
 active.world=active.world||{};
 active.world.travel=active.world.travel||{version:1,passport:{nationality:'IN',number:'STUDIO-PASSPORT-0001',issuedDate:active.date,expiryDate:'2036-12-31'},player:{cityId:'CITY-IN-007',countryId:'IN'},visas:[],bookings:[],stays:[],history:[],nextBooking:1,lastProcessedDate:null,preferences:{hotelTier:'standard'}};
 const t=active.world.travel;t.passport=t.passport||{nationality:'IN',number:'STUDIO-PASSPORT-0001',issuedDate:active.date,expiryDate:'2036-12-31'};
 t.player=t.player||{cityId:'CITY-IN-007',countryId:'IN'};t.visas=Array.isArray(t.visas)?t.visas:[];t.bookings=Array.isArray(t.bookings)?t.bookings:[];t.stays=Array.isArray(t.stays)?t.stays:[];t.history=Array.isArray(t.history)?t.history:[];
 if(!G.getCity(t.player.cityId)){const focus=active.world.geography||{};const c=G.cities.find(x=>x.countryId===(focus.focusCountry==='India'?'IN':focus.focusCountry)&&x.name===focus.focusCity)||G.getCity('CITY-IN-007');t.player.cityId=c.id;t.player.countryId=c.countryId;}
 return t;
}
function haversine(a,b){const rad=Math.PI/180,dLat=(b.latitude-a.latitude)*rad,dLon=(b.longitude-a.longitude)*rad,x=Math.sin(dLat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function quote(destinationId,mode='flight'){
 const t=ensure();if(!t)throw Error('Create a campaign first.');
 const from=G.getCity(t.player.cityId),to=G.getCity(destinationId);if(!to)throw Error('Choose a supported city destination.');
 if(from.id===to.id)throw Error('You are already in this city.');
 if(!Number.isFinite(from.latitude)||!Number.isFinite(to.latitude))throw Error('A mapped route is not available for one of these capital-only locations yet. Choose a mapped travel hub.');
 const distance=round(haversine(from,to)),domestic=from.countryId===to.countryId;
 if(!domestic&&mode!=='flight')throw Error('International journeys currently require a flight.');
 if(mode==='flight'&&(!from.airport||!to.airport))throw Error('A scheduled airport route is not available for this destination yet.');
 if(!['flight','train','road'].includes(mode))throw Error('Unsupported travel mode.');
 if(mode==='road'&&(!domestic||distance>1200))throw Error('Road travel is available for domestic routes up to 1,200 km.');
 if(mode==='train'&&(!domestic||distance>2500))throw Error('Rail travel is available for domestic routes up to 2,500 km.');
 const speed=mode==='flight'?780:mode==='train'?105:68;
 const hours=round((distance/speed)+(mode==='flight'?2.1:mode==='train'?0.35:0.25));
 const fare=round(mode==='flight'?Math.max(55,distance*0.145+55):mode==='train'?Math.max(8,distance*0.075+8):Math.max(12,distance*0.105+12));
 return {from,to,mode,distanceKm:distance,durationHours:hours,fare,domestic,currency:'game currency',assumption:'Procedural in-game route estimate; not a real timetable or live fare.'};
}
function passportNationality(countryId){const t=ensure(),c=G.getCountry(countryId);if(!c)throw Error('Choose a valid passport nationality.');t.passport.nationality=c.id;t.passport.updatedDate=active.date;persist();render();return t.passport;}
function hasEntryPermit(countryId,date){const t=ensure();if(t.passport.nationality===countryId)return true;return t.visas.some(v=>v.countryId===countryId&&v.status==='valid'&&v.validFrom<=date&&v.validUntil>=date);}
function applyForEntryPermit(countryId){
 const t=ensure(),c=G.getCountry(countryId);if(!c)throw Error('Unknown destination country.');
 if(t.passport.nationality===c.id)return {status:'not-required',message:'Your passport nationality matches the destination.'};
 if(hasEntryPermit(c.id,active.date))return {status:'valid',message:'You already hold a valid in-game entry permit.'};
 const fee=round(c.continent==='EU'?180:c.continent==='NA'?160:c.continent==='AS'?120:100);
 if(!active.founder)throw Error('Founder personal finance is not initialized.');
 if(Number(active.founder.personalCash||0)<fee)throw Error('Insufficient personal cash for the entry-permit fee.');
 Phase3Founder.record('Expense',fee,'Travel & immigration','In-game entry permit · '+c.name,active.date,'global-mobility');
 const visa={id:'VISA-'+c.id+'-'+(t.visas.length+1),countryId:c.id,nationality:t.passport.nationality,issuedDate:active.date,validFrom:active.date,validUntil:dateAdd(active.date,30),status:'valid',fee};
 t.visas.push(visa);t.history.unshift({date:active.date,type:'entry-permit',text:'Entry permit issued for '+c.name,amount:fee});persist();render();return visa;
}
function planTrip(destinationId,mode,departureDate,nights=2,hotelTier='standard'){
 const t=ensure();if(!t)throw Error('Create a campaign first.');
 if(!dateValid(departureDate)||departureDate<active.date)throw Error('Departure date must be today or a future simulation date.');
 const q=quote(destinationId,mode),n=Math.max(1,Math.min(30,Math.floor(Number(nights)||1)));
 if(!q.domestic&&!hasEntryPermit(q.to.countryId,departureDate))throw Error('An in-game entry permit is required. Apply for one before booking.');
 const hotelRates={budget:45,standard:110,premium:260,luxury:650},rate=hotelRates[hotelTier]||hotelRates.standard,hotelCost=round(rate*n),total=round(q.fare+hotelCost);
 if(!active.founder||Number(active.founder.personalCash||0)<total)throw Error('Insufficient personal cash. Trip total is '+total.toFixed(2)+'.');
 Phase3Founder.record('Expense',q.fare,'Travel',''+q.mode+' ticket · '+q.from.name+' to '+q.to.name,active.date,'global-mobility');
 Phase3Founder.record('Expense',hotelCost,'Accommodation',n+' nights · '+hotelTier+' stay in '+q.to.name,active.date,'global-mobility');
 const days=Math.max(1,Math.ceil(q.durationHours/18)),arrivalDate=dateAdd(departureDate,days);
 const booking={id:'TRIP-'+String(t.nextBooking++).padStart(6,'0'),fromCityId:q.from.id,toCityId:q.to.id,fromCountryId:q.from.countryId,toCountryId:q.to.countryId,mode:q.mode,distanceKm:q.distanceKm,durationHours:q.durationHours,fare:q.fare,departureDate,arrivalDate,status:departureDate===active.date?'In transit':'Booked',hotel:{tier:hotelTier,nights:n,nightlyRate:rate,total:hotelCost,checkIn:arrivalDate,checkOut:dateAdd(arrivalDate,n),status:'Reserved'},createdDate:active.date};
 t.bookings.unshift(booking);t.stays.unshift({id:'STAY-'+booking.id,bookingId:booking.id,cityId:q.to.id,tier:hotelTier,checkIn:arrivalDate,checkOut:dateAdd(arrivalDate,n),status:'Reserved',total:hotelCost});
 t.history.unshift({date:active.date,type:'booking',text:'Booked '+q.mode+' travel to '+q.to.name,amount:total,bookingId:booking.id});
 if(booking.status==='In transit')t.player.inTransitBookingId=booking.id;
 persist();render();return {...booking,quote:q,totalCost:total};
}
function processDay(date){
 const t=ensure();if(!t||t.lastProcessedDate===date)return false;
 t.bookings.forEach(b=>{
  if(b.status==='Booked'&&b.departureDate<=date){b.status='In transit';t.player.inTransitBookingId=b.id;t.history.unshift({date,type:'departure',text:'Departed for '+G.getCity(b.toCityId).name,bookingId:b.id});}
  if(b.status==='In transit'&&b.arrivalDate<=date){const city=G.getCity(b.toCityId);b.status='Arrived';b.actualArrivalDate=date;t.player.cityId=city.id;t.player.countryId=city.countryId;delete t.player.inTransitBookingId;t.history.unshift({date,type:'arrival',text:'Arrived in '+city.name+', '+G.getCountry(city.countryId).name,bookingId:b.id});const stay=t.stays.find(x=>x.bookingId===b.id);if(stay)stay.status='Checked in';}
 });
 t.stays.forEach(s=>{if(s.status==='Checked in'&&s.checkOut<=date)s.status='Completed';});
 t.lastProcessedDate=date;return true;
}
function audit(){
 const t=ensure(),tests=[],add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail:String(detail||'')});
 add('Travel state is initialized',!!t,'Campaign travel state exists.');
 add('Player location resolves to a city',!!G.getCity(t?.player?.cityId),'Current location is linked to the global city registry.');
 add('Passport nationality resolves',!!G.getCountry(t?.passport?.nationality),'Passport nationality is a registered country.');
 add('All bookings reference valid cities',t?.bookings?.every(b=>G.getCity(b.fromCityId)&&G.getCity(b.toCityId)),(t?.bookings?.length||0)+' bookings');
 add('All stays reference bookings',t?.stays?.every(s=>t.bookings.some(b=>b.id===s.bookingId)),(t?.stays?.length||0)+' accommodation records');
 add('Travel costs are finite and nonnegative',t?.bookings?.every(b=>Number.isFinite(b.fare)&&b.fare>=0&&Number.isFinite(b.hotel.total)&&b.hotel.total>=0),'Ticket and accommodation charges are finite.');
 add('Travel save state is serializable',(()=>{try{JSON.stringify(t);return true}catch(e){return false}})(),'Travel bookings, visas and history serialize to campaign saves.');
 return {passed:tests.filter(x=>x.ok).length,failed:tests.filter(x=>!x.ok).length,tests};
}
function render(){
 const nav=document.querySelector('.nav'),content=document.querySelector('.content');if(!nav||!content)return;
 if(!$('page-globaltravel')){const b=document.createElement('button');b.dataset.page='globaltravel';b.innerHTML='<span>✈</span>Travel';b.onclick=()=>window.nav('globaltravel');nav.appendChild(b);const page=document.createElement('section');page.className='page';page.id='page-globaltravel';page.innerHTML='<div class="hero"><div><div class="eyebrow">WORLDWIDE MOBILITY</div><h1 class="h1">Travel the world</h1><p class="sub">Choose a destination, arrange entry documents, book transport and accommodation, and build a travel history.</p></div></div><div id="globaltravel-content"></div>';content.appendChild(page);}
 const root=$('globaltravel-content');if(!root)return;if(!active){root.innerHTML='<div class="empty">Create a campaign to begin travelling.</div>';return;}
 const t=ensure(),loc=G.getCity(t.player.cityId),co=G.getCountry(loc.countryId),destinations=G.cities.filter(c=>Number.isFinite(c.latitude)&&c.id!==loc.id).sort((a,b)=>G.getCountry(a.countryId).name.localeCompare(G.getCountry(b.countryId).name)||a.name.localeCompare(b.name));
 const currentBooking=t.bookings.find(b=>b.status==='In transit'),history=t.history.slice(0,8);
 root.innerHTML='<div class="grid stats"><div class="card"><div class="statlabel">CURRENT LOCATION</div><div class="statvalue" style="font-size:19px">'+esc(loc.name)+'</div><div class="tiny">'+esc(co.name)+'</div></div><div class="card"><div class="statlabel">PASSPORT NATIONALITY</div><div class="statvalue" style="font-size:19px">'+esc(G.getCountry(t.passport.nationality).name)+'</div><div class="tiny">'+esc(t.passport.number)+'</div></div><div class="card"><div class="statlabel">TRIPS COMPLETED</div><div class="statvalue">'+t.bookings.filter(b=>b.status==='Arrived').length+'</div></div><div class="card"><div class="statlabel">PERSONAL CASH</div><div class="statvalue" style="font-size:19px">'+Number(active.founder?.personalCash||0).toLocaleString()+'</div><div class="tiny">Trip expenses use the founder personal ledger</div></div></div>'+
 '<div class="grid cols"><div class="card"><b class="cardtitle">Plan a journey</b><div class="field"><label>Destination city</label><select id="travel-destination">'+destinations.map(c=>'<option value="'+c.id+'">'+esc(c.name+', '+G.getCountry(c.countryId).name)+'</option>').join('')+'</select></div><div class="formgrid" style="margin-top:10px"><div class="field"><label>Transport</label><select id="travel-mode"><option value="flight">Flight</option><option value="train">Train (domestic)</option><option value="road">Road (domestic)</option></select></div><div class="field"><label>Departure date</label><input id="travel-date" type="date" value="'+esc(active.date)+'" min="'+esc(active.date)+'"></div><div class="field"><label>Hotel tier</label><select id="travel-hotel"><option value="budget">Budget</option><option value="standard" selected>Standard</option><option value="premium">Premium</option><option value="luxury">Luxury</option></select></div><div class="field"><label>Number of nights</label><input id="travel-nights" type="number" min="1" max="30" value="2"></div></div><div class="actions" style="margin-top:12px"><button class="btn" id="travel-quote">Calculate route</button><button class="btn primary" id="travel-book">Book trip</button></div><div id="travel-quote-result" class="hint" style="margin-top:10px">Route estimates are generated for mapped cities. International trips use flights.</div><div class="divider"></div><b class="cardtitle">Passport & entry documents</b><div class="field" style="margin-top:8px"><label>Passport nationality</label><select id="travel-nationality">'+G.countries.filter(c=>c.kind==='country').map(c=>'<option value="'+c.id+'" '+(c.id===t.passport.nationality?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></div><div class="actions" style="margin-top:9px"><button class="btn" id="travel-save-nationality">Update nationality</button><button class="btn" id="travel-visa">Apply for destination entry permit</button></div><p class="hint">Entry rules are simplified game mechanics, not real-world immigration advice. International travel requires an in-game entry permit unless passport nationality matches the destination.</p></div>'+
 '<div class="card"><b class="cardtitle">Travel status</b>'+(currentBooking?'<div class="rowitem"><span>In transit to</span><b>'+esc(G.getCity(currentBooking.toCityId).name)+'</b></div><div class="rowitem"><span>Expected arrival</span><b>'+esc(currentBooking.arrivalDate)+'</b></div>':'<div class="empty">You are not currently in transit.</div>')+'<div class="divider"></div><b class="cardtitle">Recent travel history</b>'+(history.length?history.map(x=>'<div class="rowitem"><span>'+esc(x.text)+'</span><span class="tiny">'+esc(x.date)+'</span></div>').join(''):'<div class="empty">No trips yet.</div>')+'</div></div>'+
 '<div class="card" style="margin-top:14px"><b class="cardtitle">Bookings & stays</b>'+(t.bookings.length?t.bookings.slice(0,12).map(b=>'<div class="rowitem"><span><b>'+esc(G.getCity(b.fromCityId).name)+' → '+esc(G.getCity(b.toCityId).name)+'</b><div class="tiny">'+esc(b.mode)+' · '+esc(b.departureDate)+' → '+esc(b.arrivalDate)+' · '+esc(b.hotel.tier)+' hotel · '+esc(b.status)+'</div></span><b>'+Number(b.fare+b.hotel.total).toLocaleString()+'</b></div>').join(''):'<div class="empty">No bookings recorded.</div>')+'</div>';
 const quoteBtn=$('travel-quote'),bookBtn=$('travel-book'),getQuote=()=>quote($('travel-destination').value,$('travel-mode').value);
 quoteBtn.onclick=()=>{try{const q=getQuote();$('travel-quote-result').textContent=q.distanceKm.toLocaleString()+' km · '+q.durationHours+' hours estimated · '+q.fare.toLocaleString()+' ticket · '+q.from.name+' → '+q.to.name;}catch(e){$('travel-quote-result').textContent=e.message;}};
 bookBtn.onclick=()=>{try{const b=planTrip($('travel-destination').value,$('travel-mode').value,$('travel-date').value,$('travel-nights').value,$('travel-hotel').value);toast('Trip booked · arrival '+b.arrivalDate);render();}catch(e){toast(e.message);}};
 $('travel-save-nationality').onclick=()=>{try{passportNationality($('travel-nationality').value);toast('Passport nationality updated');}catch(e){toast(e.message);}};
 $('travel-visa').onclick=()=>{try{const dest=G.getCity($('travel-destination').value),v=applyForEntryPermit(dest.countryId);toast(v.status==='not-required'?'No entry permit required':v.status==='valid'?'Entry permit already valid':'Entry permit issued');}catch(e){toast(e.message);}};
}
P.on('world:day',e=>processDay(e.date));
const oldRender=window.render;if(typeof oldRender==='function'&&!oldRender.__globalTravelWrapped){const wrapped=function(...a){const out=oldRender.apply(this,a);render();return out};wrapped.__globalTravelWrapped=true;window.render=wrapped;}
const oldNav=window.nav;if(typeof oldNav==='function'&&!oldNav.__globalTravelWrapped){const wrapped=function(page,...a){const out=oldNav.call(this,page,...a);if(page==='globaltravel')render();return out};wrapped.__globalTravelWrapped=true;window.nav=wrapped;}
const oldPersist=window.persist;if(typeof oldPersist==='function'&&!oldPersist.__globalTravelWrapped){const wrapped=function(...a){if(active)ensure();return oldPersist.apply(this,a)};wrapped.__globalTravelWrapped=true;window.persist=wrapped;}
const oldAudit=window.StudioPhaseIntegration?.audit;if(typeof oldAudit==='function'){window.StudioPhaseIntegration.audit=function(){const r=oldAudit.call(this),g=G.audit(),t=audit();r.tests.push({name:'Global geography registry audit',ok:g.failed===0,detail:g.passed+' passed / '+g.failed+' failed'});r.tests.push({name:'Global mobility and travel audit',ok:t.failed===0,detail:t.passed+' passed / '+t.failed+' failed'});r.passed=r.tests.filter(x=>x.ok).length;r.failed=r.tests.length-r.passed;return r};}
window.StudioGlobalTravel={version:VERSION,ensure,quote,passportNationality,applyForEntryPermit,planTrip,processDay,audit,render};
try{P.registerModule({id:'global-mobility',name:'Worldwide player travel and mobility',deps:['world','global-geography','founder'],owns:['player location','route estimates','transport bookings','entry permits','accommodation','travel history'],status:'implemented'});}catch(e){}
if(active)ensure();render();
})();