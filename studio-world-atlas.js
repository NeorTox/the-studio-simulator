(() => {
  'use strict';
  const G = window.StudioGeography;
  const T = window.StudioGlobalTravel;
  if (!G || !T) {
    console.warn('[STUDIO_ATLAS] Geography and mobility engines are required.');
    return;
  }

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const round = value => Math.round(Number(value) * 100) / 100;
  const hash = value => {
    let h = 2166136261;
    for (const ch of String(value)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const distance = (a, b) => {
    const rad = Math.PI / 180;
    const dLat = (b.latitude - a.latitude) * rad;
    const dLon = (b.longitude - a.longitude) * rad;
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  const addClock = (clock, hours) => {
    const [h, m] = clock.split(':').map(Number);
    const total = h * 60 + m + Math.round(hours * 60);
    const normalized = ((total % 1440) + 1440) % 1440;
    return String(Math.floor(normalized / 60)).padStart(2, '0') + ':' +
      String(normalized % 60).padStart(2, '0');
  };
  const clockOffset = city => Math.round((Number(city.longitude) || 0) / 15);
  const clock = minutes => String(Math.floor(minutes / 60) % 24).padStart(2, '0') +
    ':' + String(minutes % 60).padStart(2, '0');
  const carriers = [
    {name:'Meridian Air',code:'MR'},
    {name:'Northstar Airways',code:'NS'},
    {name:'Horizon Connect',code:'HZ'},
    {name:'Solstice Airlines',code:'SL'},
    {name:'Pioneer Air',code:'PN'}
  ];
  const hubs = [
    'Dubai','Doha','Singapore','Istanbul','London','Frankfurt','Amsterdam',
    'Paris','Tokyo','Hong Kong','New York','Los Angeles','Mumbai','Delhi',
    'Sydney','Toronto','Nairobi','Johannesburg'
  ];

  let map = null;
  let mapElement = null;
  let mapLoading = null;
  let mapReady = false;
  let selectedCityId = null;
  let selectedItinerary = null;
  let itineraryOptions = [];
  let routeToDraw = null;
  let globeMode = false;
  let geographyObserver = null;
  let travelObserver = null;
  let lastTravelRoot = null;
  let lastGeographyRoot = null;

  function currentTravel() {
    return T.ensure();
  }
  function currentCity() {
    const travel = currentTravel();
    return G.getCity(travel?.player?.cityId) || G.cities.find(city => city.name === 'Mumbai');
  }
  function getAirportLabel(city) {
    if (!city?.airport) return 'Airport not mapped';
    return String(city.airport).startsWith('SIM-')
      ? 'Regional simulation gateway'
      : city.airport + ' · ' + city.name;
  }
  function mapFeatures() {
    return {
      type:'FeatureCollection',
      features:G.cities.filter(city =>
        Number.isFinite(city.latitude) && Number.isFinite(city.longitude) && city.airport
      ).map(city => ({
        type:'Feature',
        geometry:{type:'Point',coordinates:[city.longitude,city.latitude]},
        properties:{
          id:city.id,
          name:city.name,
          country:G.getCountry(city.countryId)?.name || city.countryId,
          countryId:city.countryId,
          airport:city.airport,
          gateway:String(city.airport).startsWith('SIM-') ? 'Regional gateway' : 'Airport'
        }
      }))
    };
  }
  function setMapStatus(message, kind) {
    const status = $('studio-map-status');
    if (status) {
      status.textContent = message;
      status.dataset.kind = kind || 'info';
    }
  }
  function cityDetailMarkup(city) {
    if (!city) return '<div class="atlas-detail-empty">Select a city marker or search for a destination.</div>';
    const country = G.getCountry(city.countryId);
    const current = currentCity();
    const same = current?.id === city.id;
    return '<div class="atlas-detail-kicker">SELECTED LOCATION</div>' +
      '<div class="atlas-detail-name">' + esc(city.name) + '</div>' +
      '<div class="atlas-detail-country">' + esc(country?.name || city.countryId) + '</div>' +
      '<div class="atlas-detail-grid">' +
        '<div><span>CONTINENT</span><b>' + esc(country?.continent || '—') + '</b></div>' +
        '<div><span>AIRPORT</span><b>' + esc(city.airport || 'Not mapped') + '</b></div>' +
        '<div><span>GATEWAY</span><b>' + (String(city.airport || '').startsWith('SIM-') ? 'Simulated' : (city.airport ? 'Indexed' : 'Unavailable')) + '</b></div>' +
        '<div><span>COORDINATES</span><b>' + city.latitude.toFixed(3) + ', ' + city.longitude.toFixed(3) + '</b></div>' +
      '</div>' +
      '<button class="atlas-primary-action" id="atlas-set-destination" ' + (same ? 'disabled' : '') + '>' +
        (same ? 'CURRENT LOCATION' : 'SET AS DESTINATION  ↗') +
      '</button>';
  }
  function selectCity(cityId, flyTo) {
    const city = G.getCity(cityId);
    if (!city || !Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) return;
    selectedCityId = city.id;
    const detail = $('studio-atlas-detail');
    if (detail) detail.innerHTML = cityDetailMarkup(city);
    const search = $('studio-atlas-search');
    if (search) search.value = city.name + ', ' + (G.getCountry(city.countryId)?.name || '');
    if (map && flyTo !== false) {
      map.flyTo({center:[city.longitude,city.latitude],zoom:Math.max(map.getZoom(),4.1),duration:750});
    }
    bindDestinationAction();
    if (mapReady) refreshSelectedPoint();
  }
  function bindDestinationAction() {
    const button = $('atlas-set-destination');
    if (!button || button.dataset.bound) return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const city = G.getCity(selectedCityId);
      if (!city || city.id === currentCity()?.id) return;
      window.__STUDIO_TRAVEL_DESTINATION = city.id;
      if (typeof window.nav === 'function') window.nav('globaltravel');
      window.setTimeout(() => {
        const destination = $('travel-destination');
        if (destination) destination.value = city.id;
        renderTravelPlanner();
        const result = $('studio-flight-results');
        if (result) result.scrollIntoView({behavior:'smooth',block:'nearest'});
      }, 80);
    });
  }
  function greatCircleSegment(from,to,steps=48) {
    const rad=Math.PI/180,deg=180/Math.PI;
    const lat1=from.latitude*rad,lon1=from.longitude*rad,lat2=to.latitude*rad,lon2=to.longitude*rad;
    const a=[Math.cos(lat1)*Math.cos(lon1),Math.cos(lat1)*Math.sin(lon1),Math.sin(lat1)];
    const b=[Math.cos(lat2)*Math.cos(lon2),Math.cos(lat2)*Math.sin(lon2),Math.sin(lat2)];
    const dot=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
    const omega=Math.acos(dot),sinOmega=Math.sin(omega),coords=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps;
      const wa=Math.abs(sinOmega)<1e-8?1-t:Math.sin((1-t)*omega)/sinOmega;
      const wb=Math.abs(sinOmega)<1e-8?t:Math.sin(t*omega)/sinOmega;
      const x=wa*a[0]+wb*b[0],y=wa*a[1]+wb*b[1],z=wa*a[2]+wb*b[2];
      coords.push([Math.atan2(y,x)*deg,Math.atan2(z,Math.sqrt(x*x+y*y))*deg]);
    }
    return coords;
  }
  function routeFeature(itinerary) {
    if (!itinerary?.legs?.length) return null;
    const coordinates=[];
    itinerary.legs.forEach(leg=>{
      const from=G.getCity(leg.fromCityId),to=G.getCity(leg.toCityId);
      if(!from||!to)return;
      const segment=greatCircleSegment(from,to);
      coordinates.push(...(coordinates.length?segment.slice(1):segment));
    });
    if(coordinates.length<2)return null;
    return {type:'Feature',geometry:{type:'LineString',coordinates},properties:{kind:'selected-itinerary'}};
  }
  function refreshRouteLayer() {
    if (!mapReady || !map) return;
    const source = map.getSource('studio-flight-route');
    if (!source) return;
    const feature = routeFeature(routeToDraw);
    source.setData({type:'FeatureCollection',features:feature?[feature]:[]});
    if (feature) {
      const coords = feature.geometry.coordinates;
      const bounds = coords.reduce((b, coord) => b.extend(coord), new window.__STUDIO_MAPLIBRE.LngLatBounds(coords[0],coords[0]));
      map.fitBounds(bounds,{padding:70,maxZoom:5,duration:800});
    }
  }
  function refreshSelectedPoint() {
    if (!mapReady || !map) return;
    const source = map.getSource('studio-cities');
    if (!source) return;
    const features = mapFeatures().features;
    source.setData({type:'FeatureCollection',features});
  }
  function ensureMapLayers() {
    if (!map || map.getSource('studio-cities')) return;
    map.addSource('studio-cities',{
      type:'geojson',data:mapFeatures(),cluster:true,clusterMaxZoom:4,clusterRadius:42
    });
    map.addLayer({
      id:'studio-city-clusters',type:'circle',source:'studio-cities',filter:['has','point_count'],
      paint:{
        'circle-color':'#b99a6d',
        'circle-radius':['step',['get','point_count'],15,20,20,60,26,120,32],
        'circle-opacity':0.88,
        'circle-stroke-width':1.5,
        'circle-stroke-color':'#f0d4a3'
      }
    });
    map.addLayer({
      id:'studio-cluster-count',type:'symbol',source:'studio-cities',filter:['has','point_count'],
      layout:{'text-field':['get','point_count_abbreviated'],'text-size':11},
      paint:{'text-color':'#15191b'}
    });
    map.addLayer({
      id:'studio-city-points',type:'circle',source:'studio-cities',filter:['!', ['has','point_count']],
      paint:{
        'circle-radius':['interpolate',['linear'],['zoom'],1,3.2,4,5.2,8,7],
        'circle-color':['case',['==',['get','id'],currentCity()?.id || ''], '#f3e2bb','#c4a16d'],
        'circle-stroke-color':'#10171b',
        'circle-stroke-width':1.5
      }
    });
    map.addLayer({
      id:'studio-city-labels',type:'symbol',source:'studio-cities',filter:['!', ['has','point_count']],minzoom:3.5,
      layout:{'text-field':['get','name'],'text-size':['interpolate',['linear'],['zoom'],3.5,9,8,12],'text-offset':[0,1.15],'text-anchor':'top','text-optional':true},
      paint:{'text-color':'#f0e7d4','text-halo-color':'#13212a','text-halo-width':1.5}
    });
    map.addSource('studio-flight-route',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    map.addLayer({
      id:'studio-flight-route',type:'line',source:'studio-flight-route',
      paint:{'line-color':'#e2bd83','line-width':2.7,'line-opacity':0.95,'line-dasharray':[2,1.2]}
    });
    map.on('click','studio-city-points',event => {
      const id = event.features?.[0]?.properties?.id;
      if (id) selectCity(id,false);
    });
    map.on('click','studio-city-clusters',event => {
      const features = map.queryRenderedFeatures(event.point,{layers:['studio-city-clusters']});
      const clusterId = features[0]?.properties?.cluster_id;
      if (clusterId === undefined) return;
      map.getSource('studio-cities').getClusterExpansionZoom(clusterId,(error,zoom) => {
        if (!error) map.easeTo({center:features[0].geometry.coordinates,zoom});
      });
    });
    map.on('mouseenter','studio-city-points',() => {map.getCanvas().style.cursor='pointer'});
    map.on('mouseleave','studio-city-points',() => {map.getCanvas().style.cursor=''});
    map.on('mouseenter','studio-city-clusters',() => {map.getCanvas().style.cursor='pointer'});
    map.on('mouseleave','studio-city-clusters',() => {map.getCanvas().style.cursor=''});
    mapReady = true;
    refreshRouteLayer();
  }
  async function loadMap() {
    if (mapLoading) return mapLoading;
    mapLoading = import('https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.mjs')
      .then(module => {
        window.__STUDIO_MAPLIBRE = module;
        return module;
      });
    try {
      return await mapLoading;
    } catch (error) {
      mapLoading = null;
      throw error;
    }
  }
  async function initMap() {
    const container = $('studio-world-map');
    if (!container) return;
    if (map && mapElement !== container) {
      map.remove();
      map = null;
      mapReady = false;
    }
    if (map) {
      map.resize();
      refreshRouteLayer();
      return;
    }
    if (container.dataset.mapState === 'loading') return;
    container.dataset.mapState = 'loading';
    setMapStatus('CONNECTING TO THE WORLD MAP', 'loading');
    try {
      const lib = await loadMap();
      if (!container.isConnected) return;
      mapElement = container;
      const playerCity = currentCity();
      const initial = playerCity && Number.isFinite(playerCity.longitude)
        ? [playerCity.longitude,playerCity.latitude] : [12,20];
      const style = window.STUDIO_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json';
      map = new lib.Map({
        container,
        style,
        center:initial,
        zoom:playerCity ? 2.5 : 1.6,
        minZoom:1.1,
        maxZoom:12,
        attributionControl:{compact:true},
        cooperativeGestures:true
      });
      map.addControl(new lib.NavigationControl({showCompass:true,showZoom:true}), 'top-right');
      map.on('style.load',() => {
        if(globeMode) map.setProjection({type:'globe'});
      });
      map.on('load',() => {
        ensureMapLayers();
        setMapStatus('GLOBAL ATLAS ONLINE · ' + G.cities.filter(c => c.airport && Number.isFinite(c.latitude)).length + ' MAPPED CITY GATEWAYS','ready');
        const start = currentCity();
        if (start) selectCity(start.id,false);
        refreshRouteLayer();
      });
      map.on('error',event => {
        const message = event?.error?.message || 'Basemap source unavailable';
        setMapStatus('MAP DATA CONNECTION ISSUE · ' + message,'warning');
      });
    } catch (error) {
      container.dataset.mapState = 'failed';
      setMapStatus('MAP RENDERER COULD NOT LOAD · ' + (error.message || 'Network unavailable'),'warning');
      const fallback = $('studio-atlas-fallback');
      if (fallback) fallback.hidden = false;
      console.warn('[STUDIO_ATLAS] MapLibre could not be loaded.',error);
    }
  }
  function atlasMarkup() {
    const searchOptions = G.cities.filter(city => Number.isFinite(city.latitude))
      .map(city => '<option value="' + esc(city.name + ', ' + (G.getCountry(city.countryId)?.name || city.countryId)) + '"></option>').join('');
    return '<section class="studio-atlas" id="studio-world-atlas">' +
      '<div class="atlas-heading"><div><div class="atlas-kicker">WORLD INFRASTRUCTURE / LIVE REGISTRY</div><h2>Global atlas</h2><p>Explore mapped cities and airport gateways. Select a location to inspect it or use it as your next destination.</p></div>' +
      '<div class="atlas-heading-actions"><button class="atlas-secondary-action" id="atlas-current-location">◎ CENTRE ON ME</button><button class="atlas-secondary-action" id="atlas-clear-route">CLEAR ROUTE</button></div></div>' +
      '<div class="atlas-grid"><div class="atlas-map-frame"><div class="atlas-map-toolbar"><label><span>FIND A CITY</span><input id="studio-atlas-search" list="studio-atlas-city-list" placeholder="Search city or country" autocomplete="off"><datalist id="studio-atlas-city-list">' + searchOptions + '</datalist></label><div class="atlas-map-tools"><button type="button" id="atlas-toggle-globe">VIEW 3D GLOBE</button><span class="atlas-map-legend"><i></i> AIRPORT / CITY GATEWAY <b></b> CLUSTER</span></div></div>' +
      '<div class="atlas-map-wrap"><div id="studio-world-map" aria-label="Interactive world map"></div><div class="atlas-map-status" id="studio-map-status" data-kind="loading">CONNECTING TO THE WORLD MAP</div><div class="atlas-fallback" id="studio-atlas-fallback" hidden>Map tiles could not be reached. Location search and travel data remain available; reconnect to load the basemap.</div></div>' +
      '<div class="atlas-map-footer"><span>GEOGRAPHIC REGISTRY · ' + G.countries.length + ' COUNTRIES / TERRITORIES</span><span>MAP STYLE CONFIGURABLE · CITY DATA FROM THE GAME ENGINE</span></div></div>' +
      '<aside class="atlas-detail-panel"><div class="atlas-detail-top"><span>LOCATION DOSSIER</span><span class="atlas-live-dot">WORLD DATA</span></div><div id="studio-atlas-detail">' + cityDetailMarkup(currentCity()) + '</div><div class="atlas-detail-note">Airport codes prefixed with SIM- represent generated regional gateways, not verified commercial airport identifiers.</div></aside></div>' +
      '</section>';
  }
  function bindAtlasControls() {
    $('atlas-toggle-globe')?.addEventListener('click',() => {
      globeMode=!globeMode;
      if(map) map.setProjection({type:globeMode?'globe':'mercator'});
      const button=$('atlas-toggle-globe');
      if(button) button.textContent=globeMode?'VIEW FLAT MAP':'VIEW 3D GLOBE';
    });
    $('atlas-current-location')?.addEventListener('click',() => {
      const city = currentCity();
      if (!city) return;
      selectCity(city.id,true);
      map?.flyTo({center:[city.longitude,city.latitude],zoom:3.3,duration:900});
    });
    $('atlas-clear-route')?.addEventListener('click',() => {
      routeToDraw = null;
      refreshRouteLayer();
    });
    $('studio-atlas-search')?.addEventListener('change',event => {
      const value = event.target.value.toLowerCase();
      const city = G.cities.find(item =>
        (item.name + ', ' + (G.getCountry(item.countryId)?.name || '')).toLowerCase() === value ||
        item.name.toLowerCase() === value
      );
      if (city) selectCity(city.id,true);
    });
    bindDestinationAction();
  }
  function renderAtlasPanel() {
    const root = $('geography-content');
    if (!root) return;
    let panel = $('studio-world-atlas');
    if (panel && panel.parentElement !== root) panel.remove();
    if (!panel || !panel.isConnected) {
      root.insertAdjacentHTML('afterbegin',atlasMarkup());
      panel = $('studio-world-atlas');
      bindAtlasControls();
    }
    if (lastGeographyRoot !== root) {
      lastGeographyRoot = root;
      if (geographyObserver) geographyObserver.disconnect();
      geographyObserver = new MutationObserver(() => {
        if (!$('studio-world-atlas')) {
          window.requestAnimationFrame(() => {
            if ($('page-geography')?.classList.contains('active')) renderAtlasPanel();
          });
        }
      });
      geographyObserver.observe(root,{childList:true});
    }
    initMap();
  }

  function buildLeg(from,to,date,sequence,operator,seedValue,departureClock) {
    const km = distance(from,to);
    const flightHours = Math.max(0.55,km / 790);
    const firstClock = departureClock || clock(390 + (hash(seedValue + '|dep') % 570));
    const offsetDelta = clockOffset(to) - clockOffset(from);
    const arrivalClock = addClock(firstClock,flightHours + offsetDelta);
    const flightNo = operator.code + String(1000 + (hash(seedValue + '|flight') % 8999));
    const aircraft = km > 6200 ? 'Boeing 787-9' : km > 3500 ? 'Airbus A330-900' :
      km > 1600 ? 'Airbus A321neo' : 'Airbus A320neo';
    return {
      sequence,
      fromCityId:from.id,
      toCityId:to.id,
      fromAirport:from.airport,
      toAirport:to.airport,
      distanceKm:round(km),
      durationHours:round(flightHours),
      departureLocal:firstClock,
      arrivalLocal:arrivalClock,
      departureDate:date,
      flightNumber:flightNo,
      operator:operator.name,
      aircraft
    };
  }
  function findItineraries(destinationId,date) {
    const travel = currentTravel();
    const from = G.getCity(travel?.player?.cityId);
    const to = G.getCity(destinationId);
    if (!from || !to) throw new Error('Choose a supported origin and destination.');
    if (from.id === to.id) throw new Error('You are already in this city.');
    if (![from,to].every(city => city.airport && Number.isFinite(city.latitude) && Number.isFinite(city.longitude))) {
      throw new Error('A mapped airport gateway is not available for this city.');
    }
    const baseQuote = T.quote(to.id,'flight');
    const candidates = [];
    const operator = carriers[hash(from.id + '|' + to.id + '|' + date) % carriers.length];
    const directLeg = buildLeg(from,to,date,1,operator,from.id + '|' + to.id + '|' + date);
    candidates.push({
      id:'ITIN-D-' + hash(from.id + to.id + date),
      type:'Direct',
      from,to,operator,legs:[directLeg],stopCount:0,
      distanceKm:baseQuote.distanceKm,
      durationHours:baseQuote.durationHours,
      fare:baseQuote.fare,
      layoverHours:0
    });
    const hubCities = G.cities.filter(city =>
      hubs.includes(city.name) && city.id !== from.id && city.id !== to.id &&
      city.airport && Number.isFinite(city.latitude) && Number.isFinite(city.longitude)
    );
    if (baseQuote.distanceKm > 1400 && hubCities.length) {
      const viable = hubCities.map(hub => {
        const first = distance(from,hub);
        const second = distance(hub,to);
        const total = first + second;
        return {hub,first,second,total,detour:total / baseQuote.distanceKm};
      }).filter(item =>
        item.first > 350 && item.second > 350 && item.detour <= (baseQuote.distanceKm > 6500 ? 1.48 : 1.32)
      ).sort((a,b) => a.detour - b.detour);
      viable.slice(0,2).forEach((item,index) => {
        const layover = 1.55 + (hash(from.id + item.hub.id + to.id + date) % 85) / 100;
        const firstClock = clock(420 + (hash(from.id + item.hub.id + date) % 430));
        const operatorForRoute = carriers[(hash(item.hub.id + to.id + date) + index) % carriers.length];
        const leg1 = buildLeg(from,item.hub,date,1,operator,from.id + item.hub.id + date,firstClock);
        const nextDeparture = addClock(leg1.arrivalLocal,layover);
        const leg2 = buildLeg(item.hub,to,date,2,operatorForRoute,item.hub.id + to.id + date,nextDeparture);
        const airHours = leg1.durationHours + leg2.durationHours;
        const totalHours = round(airHours + layover + 2.1);
        const fare = round(baseQuote.fare + Math.max(0,item.total-baseQuote.distanceKm)*0.075 + 30 + index*18);
        candidates.push({
          id:'ITIN-C-' + hash(from.id + item.hub.id + to.id + date),
          type:'1 stop',
          from,to,operator:operatorForRoute,legs:[leg1,leg2],stopCount:1,
          hub:item.hub,
          distanceKm:round(item.total),
          durationHours:totalHours,
          fare,
          layoverHours:round(layover)
        });
      });
    }
    return candidates.sort((a,b) => a.fare-b.fare || a.durationHours-b.durationHours);
  }
  function formatDuration(hours) {
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m >= 60) { h += 1; m = 0; }
    return h + 'h ' + String(m).padStart(2,'0') + 'm';
  }
  function itineraryMarkup(item,index) {
    const legs = item.legs.map((leg,i) =>
      '<div class="flight-leg"><div class="flight-leg-top"><span>LEG ' + (i+1) + ' · ' + esc(leg.operator) + '</span><b>' + esc(leg.flightNumber) + '</b></div>' +
      '<div class="flight-leg-route"><div><strong>' + esc(leg.departureLocal) + '</strong><span>' + esc(G.getCity(leg.fromCityId).name) + '</span><small>' + esc(leg.fromAirport) + '</small></div><i></i><div><strong>' + esc(leg.arrivalLocal) + '</strong><span>' + esc(G.getCity(leg.toCityId).name) + '</span><small>' + esc(leg.toAirport) + '</small></div></div>' +
      '<div class="flight-leg-meta"><span>' + formatDuration(leg.durationHours) + '</span><span>' + esc(leg.aircraft) + '</span><span>' + leg.distanceKm.toLocaleString() + ' km</span></div></div>' +
      (i < item.legs.length-1 ? '<div class="flight-layover"><span>CONNECTION AT ' + esc(G.getCity(leg.toCityId).name.toUpperCase()) + '</span><b>' + formatDuration(item.layoverHours) + ' LAYOVER</b></div>' : '')
    ).join('');
    return '<article class="flight-option ' + (selectedItinerary?.id === item.id ? 'selected' : '') + '" data-flight-option="' + index + '">' +
      '<div class="flight-option-head"><span class="flight-badge">' + (item.stopCount ? 'CONNECTING' : 'NONSTOP') + '</span><span>' + esc(item.type) + '</span><b>' + esc(item.operator.name) + '</b></div>' +
      '<div class="flight-option-summary"><div><strong>' + esc(item.legs[0].departureLocal) + '</strong><span>' + esc(item.from.name) + '</span></div><div class="flight-summary-middle"><b>' + formatDuration(item.durationHours) + '</b><i></i><span>' + (item.stopCount ? '1 CONNECTION' : 'DIRECT FLIGHT') + '</span></div><div><strong>' + esc(item.legs[item.legs.length-1].arrivalLocal) + '</strong><span>' + esc(item.to.name) + '</span></div><div class="flight-option-price"><strong>' + item.fare.toLocaleString() + '</strong><span>GAME CURRENCY</span></div></div>' +
      '<div class="flight-option-legs">' + legs + '</div>' +
      '<div class="flight-option-foot"><span>' + item.distanceKm.toLocaleString() + ' km total routing</span><span>' + esc(item.operator.name) + ' · generated operator</span><button type="button" data-select-flight="' + index + '">' + (selectedItinerary?.id === item.id ? 'SELECTED ✓' : 'SELECT ITINERARY') + '</button></div>' +
      '</article>';
  }
  function renderFlightResults() {
    const root = $('studio-flight-results');
    if (!root) return;
    if (!itineraryOptions.length) {
      root.innerHTML = '<div class="flight-empty">Choose a destination and departure date, then search for available in-game itineraries.</div>';
      return;
    }
    root.innerHTML = itineraryOptions.map(itineraryMarkup).join('') +
      '<div class="flight-results-note">SIMULATION TIMETABLE · Operators, flight numbers, schedules and aircraft assignments are generated by the game. Local clock offsets are approximate; these are not live airline bookings.</div>' +
      '<div class="flight-results-actions"><button type="button" id="studio-book-flight" ' + (selectedItinerary ? '' : 'disabled') + '>BOOK SELECTED ITINERARY ↗</button><button type="button" id="studio-show-flight-map" ' + (selectedItinerary ? '' : 'disabled') + '>VIEW ROUTE ON WORLD MAP</button></div>';
    root.querySelectorAll('[data-select-flight]').forEach(button => button.addEventListener('click',() => {
      selectedItinerary = itineraryOptions[Number(button.dataset.selectFlight)] || null;
      routeToDraw = selectedItinerary;
      renderFlightResults();
      refreshRouteLayer();
    }));
    $('studio-book-flight')?.addEventListener('click',bookSelectedFlight);
    $('studio-show-flight-map')?.addEventListener('click',() => {
      if (!selectedItinerary) return;
      routeToDraw = selectedItinerary;
      window.nav('geography');
      window.setTimeout(() => refreshRouteLayer(),250);
    });
  }
  function searchFlights() {
    const destination = $('travel-destination')?.value;
    const date = $('travel-date')?.value || (typeof active !== 'undefined' ? active.date : null);
    if (!destination) {
      const root = $('studio-flight-results');
      if (root) root.innerHTML = '<div class="flight-empty">Select a destination first.</div>';
      return;
    }
    try {
      itineraryOptions = findItineraries(destination,date);
      selectedItinerary = null;
      routeToDraw = null;
      renderFlightResults();
    } catch (error) {
      itineraryOptions = [];
      selectedItinerary = null;
      const root = $('studio-flight-results');
      if (root) root.innerHTML = '<div class="flight-empty flight-error">' + esc(error.message) + '</div>';
    }
  }
  function bookSelectedFlight() {
    if (!selectedItinerary) return;
    const item = selectedItinerary;
    const destination = $('travel-destination')?.value;
    const date = $('travel-date')?.value || (typeof active !== 'undefined' ? active.date : null);
    const nights = $('travel-nights')?.value || 2;
    const hotel = $('travel-hotel')?.value || 'standard';
    if (destination !== item.to.id) {
      window.toast?.('The destination changed. Search for flights again.');
      return;
    }
    try {
      const original = T.planTrip(destination,'flight',date,nights,hotel);
      const travel = currentTravel();
      const booking = travel.bookings.find(entry => entry.id === original.id);
      if (!booking) throw new Error('The travel engine did not retain the booking.');
      const delta = round(item.fare - booking.fare);
      if (delta > 0 && window.Phase3Founder?.record) {
        window.Phase3Founder.record('Expense',delta,'Travel','Connection and itinerary charges · ' + item.from.name + ' to ' + item.to.name,(typeof active !== 'undefined' ? active.date : date),'global-mobility-itinerary');
      }
      booking.fare = item.fare;
      booking.distanceKm = item.distanceKm;
      booking.durationHours = item.durationHours;
      booking.arrivalDate = dateAdd(date,Math.max(1,Math.ceil(item.durationHours / 18)));
      booking.flightItinerary = {
        type:item.type,
        stopCount:item.stopCount,
        operator:item.operator.name,
        legs:item.legs,
        layoverHours:item.layoverHours,
        generatedSchedule:true,
        scheduleBasis:'Deterministic in-game timetable; not a live airline schedule.'
      };
      booking.hotel.checkIn = booking.arrivalDate;
      booking.hotel.checkOut = dateAdd(booking.arrivalDate,booking.hotel.nights);
      const stay = travel.stays.find(entry => entry.bookingId === booking.id);
      if (stay) {
        stay.checkIn = booking.hotel.checkIn;
        stay.checkOut = booking.hotel.checkOut;
      }
      const historyItem = travel.history.find(entry => entry.bookingId === booking.id && entry.type === 'booking');
      if (historyItem) historyItem.text = 'Booked ' + item.type.toLowerCase() + ' flight to ' + item.to.name;
      routeToDraw = item;
      selectedItinerary = item;
      window.persist?.();
      window.toast?.('Itinerary booked · ' + item.operator.name + ' · arrival ' + booking.arrivalDate);
      itineraryOptions = [];
      selectedItinerary = null;
      window.render?.();
    } catch (error) {
      window.toast?.(error.message);
    }
  }
  function renderTravelPlanner() {
    const root = $('globaltravel-content');
    if (!root) return;
    if (!active) return;
    let panel = $('studio-flight-planner');
    if (panel && panel.parentElement !== root) panel.remove();
    if (!panel || !panel.isConnected) {
      panel = document.createElement('section');
      panel.className = 'studio-flight-planner';
      panel.id = 'studio-flight-planner';
      panel.innerHTML = '<div class="flight-planner-head"><div><div class="atlas-kicker">AVIATION OPERATIONS / ROUTE SEARCH</div><h2>Plan a flight</h2><p>Compare direct and connecting services generated by the campaign world.</p></div><button class="atlas-secondary-action" id="studio-open-atlas">OPEN GLOBAL ATLAS ↗</button></div>' +
        '<div class="flight-planner-route"><div><span>ORIGIN</span><strong id="studio-flight-origin">—</strong><small id="studio-flight-origin-airport">—</small></div><div class="flight-planner-arrow">→</div><div><span>DESTINATION</span><strong id="studio-flight-destination">Choose a city below</strong><small id="studio-flight-destination-airport">—</small></div><button type="button" id="studio-search-flights">SEARCH FLIGHTS</button></div>' +
        '<div id="studio-flight-controls" class="flight-control-grid"></div>' +
        '<div id="studio-flight-results"><div class="flight-empty">Select a destination and departure date, then search for available in-game itineraries.</div></div>';
      root.insertBefore(panel,root.firstChild);
    }
    if (window.__STUDIO_TRAVEL_DESTINATION && $('travel-destination')) {
      $('travel-destination').value = window.__STUDIO_TRAVEL_DESTINATION;
      window.__STUDIO_TRAVEL_DESTINATION = null;
    }
    const destinationField = $('travel-destination')?.closest('.field');
    const journeyFields = $('travel-mode')?.closest('.formgrid');
    const controls = $('studio-flight-controls');
    if (controls && destinationField && destinationField.parentElement !== controls) controls.append(destinationField);
    if (controls && journeyFields && journeyFields.parentElement !== controls) controls.append(journeyFields);
    const legacyActions = $('travel-quote')?.closest('.actions');
    if (legacyActions) legacyActions.hidden = true;
    const legacyPlanCard = destinationField?.closest('.card');
    const legacyTitle = legacyPlanCard?.querySelector(':scope > .cardtitle');
    if (legacyTitle) legacyTitle.hidden = true;
    const origin = currentCity();
    const destination = G.getCity($('travel-destination')?.value);
    $('studio-flight-origin').textContent = origin?.name || '—';
    $('studio-flight-origin-airport').textContent = getAirportLabel(origin);
    $('studio-flight-destination').textContent = destination?.name || 'Choose a city below';
    $('studio-flight-destination-airport').textContent = destination ? getAirportLabel(destination) : 'Select a destination';
    const destinationSelect = $('travel-destination');
    if (destinationSelect) destinationSelect.onchange = () => {
      selectedItinerary = null;
      itineraryOptions = [];
      renderFlightResults();
      renderTravelPlanner();
    };
    const searchButton = $('studio-search-flights');
    if (searchButton) searchButton.onclick = searchFlights;
    const atlasButton = $('studio-open-atlas');
    if (atlasButton) atlasButton.onclick = () => window.nav('geography');
    if (itineraryOptions.length) renderFlightResults();
  }

  function refreshActiveMap() {
    if ($('page-geography')?.classList.contains('active')) renderAtlasPanel();
    if ($('page-globaltravel')?.classList.contains('active')) renderTravelPlanner();
  }
  function wrapRenderAndNavigation() {
    const oldRender = window.render;
    if (typeof oldRender === 'function' && !oldRender.__studioAtlasWrapped) {
      const wrappedRender = function(...args) {
        const output = oldRender.apply(this,args);
        refreshActiveMap();
        return output;
      };
      wrappedRender.__studioAtlasWrapped = true;
      window.render = wrappedRender;
    }
    const oldNav = window.nav;
    if (typeof oldNav === 'function' && !oldNav.__studioAtlasWrapped) {
      const wrappedNav = function(route,...args) {
        const output = oldNav.call(this,route,...args);
        if (route === 'geography') renderAtlasPanel();
        if (route === 'globaltravel') renderTravelPlanner();
        if (route !== 'globaltravel') selectedItinerary = selectedItinerary || null;
        return output;
      };
      wrappedNav.__studioAtlasWrapped = true;
      window.nav = wrappedNav;
    }
  }
  function dateAdd(date,days) {
    const d = new Date(String(date) + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0,10);
  }

  wrapRenderAndNavigation();
  const geoRoot = $('geography-content');
  if (geoRoot && typeof MutationObserver !== 'undefined') {
    geographyObserver = new MutationObserver(() => {
      if (!$('studio-world-atlas') && $('page-geography')?.classList.contains('active')) {
        window.requestAnimationFrame(renderAtlasPanel);
      }
    });
    geographyObserver.observe(geoRoot,{childList:true});
  }
  const travelRoot = $('globaltravel-content');
  if (travelRoot && typeof MutationObserver !== 'undefined') {
    travelObserver = new MutationObserver(() => {
      if (!$('studio-flight-planner') && $('page-globaltravel')?.classList.contains('active')) {
        window.requestAnimationFrame(renderTravelPlanner);
      }
    });
    travelObserver.observe(travelRoot,{childList:true});
  }
  window.StudioWorldAtlas = {
    version:'1.0.0',
    findItineraries,
    renderAtlas:renderAtlasPanel,
    renderTravel:renderTravelPlanner,
    getSelectedItinerary:() => selectedItinerary
  };
})();