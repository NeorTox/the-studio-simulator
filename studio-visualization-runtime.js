(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const charts = new Map();
  let loader = null;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
  function loadECharts() {
    if (window.echarts) return Promise.resolve(window.echarts);
    if (loader) return loader;
    loader = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/echarts@6.1.0/dist/echarts.min.js';
      script.async = true;
      script.onload = () => window.echarts ? resolve(window.echarts) : reject(new Error('ECharts did not expose its browser API.'));
      script.onerror = () => reject(new Error('Chart library could not be loaded. Check your connection.'));
      document.head.appendChild(script);
    }).catch(error => { loader = null; throw error; });
    return loader;
  }
  function ensureCard(parent,id,title,subtitle,meta) {
    if (!parent) return null;
    let card = $(id);
    if (!card || card.parentElement !== parent) {
      if (card) card.remove();
      card = document.createElement('section');
      card.className = 'studio-chart-card';
      card.id = id;
      card.innerHTML = '<div class="studio-chart-head"><div><div class="studio-chart-title">' + title +
        '</div><div class="studio-chart-subtitle">' + subtitle + '</div></div><div class="studio-chart-meta">' + meta +
        '</div></div><div class="studio-chart" id="' + id + '-plot"></div>';
      parent.appendChild(card);
    }
    return card;
  }
  function showEmpty(id,message) {
    const plot = $(id + '-plot');
    if (!plot) return;
    const instance = charts.get(id);
    if (instance) {
      instance.dispose();
      charts.delete(id);
    }
    plot.classList.add('studio-chart-empty');
    plot.textContent = message;
  }
  function mount(id,option) {
    const plot = $(id + '-plot');
    if (!plot) return;
    loadECharts().then(echarts => {
      if (!plot.isConnected) return;
      plot.classList.remove('studio-chart-empty');
      plot.textContent = '';
      let instance = charts.get(id);
      if (!instance || instance.isDisposed?.()) {
        instance = echarts.init(plot,null,{renderer:'canvas',useDirtyRect:true});
        charts.set(id,instance);
      }
      instance.setOption(option,{notMerge:true,lazyUpdate:true});
      instance.resize();
    }).catch(error => {
      plot.classList.add('studio-chart-empty');
      plot.textContent = error.message;
    });
  }
  function cashSeries() {
    const ledger = Array.isArray(active?.ledger) ? active.ledger : [];
    const entries = ledger.filter(tx => validDate(tx.date) && Number.isFinite(Number(tx.amount)))
      .slice().sort((a,b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
    if (!entries.length) return null;
    const currentCash = number(active?.company?.cash);
    let balance = currentCash - entries.reduce((sum,tx) => sum + number(tx.amount),0);
    const byDate = new Map();
    for (const tx of entries) {
      balance += number(tx.amount);
      byDate.set(tx.date,balance);
    }
    const rows = Array.from(byDate.entries()).sort((a,b) => a[0].localeCompare(b[0]));
    return rows.slice(-90);
  }
  function cashOption(rows) {
    const currency = String(active?.company?.currency || 'USD').toUpperCase();
    const formatter = value => {
      try { return new Intl.NumberFormat('en',{style:'currency',currency,notation:'compact',maximumFractionDigits:1}).format(value); }
      catch (_) { return value.toLocaleString(); }
    };
    return {
      animationDuration:450,
      grid:{left:58,right:18,top:22,bottom:40,containLabel:false},
      tooltip:{trigger:'axis',backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items => {
        const item=items[0];
        return item.axisValue + '<br><b>' + formatter(item.data) + '</b>';
      }},
      xAxis:{type:'category',boundaryGap:false,data:rows.map(row=>row[0]),axisLine:{lineStyle:{color:'#46545a'}},axisLabel:{color:'#97a6a3',fontSize:9,hideOverlap:true},axisTick:{show:false}},
      yAxis:{type:'value',scale:true,axisLabel:{color:'#97a6a3',fontSize:9,formatter},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      series:[{name:'Company cash',type:'line',smooth:.28,symbol:'circle',symbolSize:5,data:rows.map(row=>Number(row[1].toFixed(2))),lineStyle:{width:2.6,color:'#c8a779'},itemStyle:{color:'#e5c89d',borderColor:'#172126',borderWidth:2},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(199,164,117,.27)'},{offset:1,color:'rgba(199,164,117,.015)'}])}}]
    };
  }
  function renderOverviewChart() {
    const page = $('page-overview');
    if (!page) return;
    const stats = page.querySelector(':scope > .grid.stats');
    if (!stats) return;
    const card = ensureCard(stats.parentElement,'studio-overview-cash-chart','Company cash position','Running balance reconstructed from posted company ledger entries. Values are actual campaign data.','LEDGER / LAST 90 DATES');
    if (!card) return;
    stats.insertAdjacentElement('afterend',card);
    const rows = cashSeries();
    if (!rows) {
      showEmpty('studio-overview-cash-chart','Company cash history will appear after the first financial transactions are posted.');
      return;
    }
    mount('studio-overview-cash-chart',cashOption(rows));
  }
  function categorySeries() {
    const ledger = Array.isArray(active?.ledger) ? active.ledger : [];
    const totals = new Map();
    ledger.filter(tx => number(tx.amount) < 0).forEach(tx => {
      const category = String(tx.category || 'Other');
      totals.set(category,(totals.get(category)||0)+Math.abs(number(tx.amount)));
    });
    return Array.from(totals.entries()).sort((a,b)=>b[1]-a[1]).slice(0,9).map(([name,value])=>({name,value:round2(value)}));
  }
  function round2(value) { return Math.round(value*100)/100; }
  function renderFinanceChart() {
    const page = $('page-finance');
    if (!page) return;
    const tabs = page.querySelector('.workspace-tabs') || page.querySelector('.workspace-panels') || page.querySelector(':scope > .hero');
    if (!tabs) return;
    const parent = tabs.parentElement;
    const card = ensureCard(parent,'studio-finance-category-chart','Expense structure','Posted company expenses grouped by ledger category.','ACTUAL TRANSACTIONS');
    if (!card) return;
    tabs.insertAdjacentElement('afterend',card);
    const rows = categorySeries();
    if (!rows.length) {
      showEmpty('studio-finance-category-chart','Expense composition will appear when the company posts categorized expenses.');
      return;
    }
    mount('studio-finance-category-chart',{
      animationDuration:400,
      tooltip:{trigger:'item',backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:item=>item.name+'<br><b>'+item.value.toLocaleString()+'</b> ('+item.percent+'%)'},
      legend:{type:'scroll',bottom:0,textStyle:{color:'#a8b4b0',fontSize:9},pageTextStyle:{color:'#a8b4b0'}},
      series:[{type:'pie',radius:['43%','72%'],center:['50%','44%'],avoidLabelOverlap:true,itemStyle:{borderColor:'#152025',borderWidth:3},label:{color:'#dfe3da',fontSize:9,formatter:'{b}'},labelLine:{lineStyle:{color:'#667671'}},data:rows}]
    });
  }
  function populationSeries() {
    const people = active?.world?.population?.npcs;
    if (!Array.isArray(people) || !people.length) return null;
    const bands = {'0–15':0,'16–24':0,'25–34':0,'35–49':0,'50–64':0,'65+':0};
    people.filter(n=>n && n.alive!==false).forEach(n=>{
      const age=number(n.age);
      const key=age<=15?'0–15':age<=24?'16–24':age<=34?'25–34':age<=49?'35–49':age<=64?'50–64':'65+';
      bands[key]++;
    });
    return Object.entries(bands);
  }
  function renderPopulationChart() {
    const page = $('page-population');
    if (!page) return;
    const hero = page.querySelector(':scope > .hero');
    if (!hero) return;
    const card = ensureCard(hero.parentElement,'studio-population-age-chart','Materialized population · age profile','Age distribution of named NPC records currently materialized in this campaign. This is not the full virtual population.','ACTIVE NPC RECORDS');
    if (!card) return;
    hero.insertAdjacentElement('afterend',card);
    const rows = populationSeries();
    if (!rows) {
      showEmpty('studio-population-age-chart','Generate or load named NPCs to inspect the current age profile.');
      return;
    }
    mount('studio-population-age-chart',{
      animationDuration:400,
      grid:{left:48,right:16,top:18,bottom:30},
      tooltip:{trigger:'axis',backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'}},
      xAxis:{type:'category',data:rows.map(row=>row[0]),axisLine:{lineStyle:{color:'#46545a'}},axisLabel:{color:'#a3b0ab',fontSize:9},axisTick:{show:false}},
      yAxis:{type:'value',minInterval:1,axisLine:{show:false},axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      series:[{type:'bar',data:rows.map(row=>row[1]),barMaxWidth:38,itemStyle:{color:'#b99a6d',borderRadius:[4,4,0,0]},label:{show:true,position:'top',color:'#d7d9cf',fontSize:9}}]
    });
  }
  function refresh() {
    renderOverviewChart();
    renderFinanceChart();
    renderPopulationChart();
    for (const [id,chart] of charts) if (!$(id+'-plot')?.isConnected) {
      chart.dispose();
      charts.delete(id);
    }
  }
  const oldRender = window.render;
  if (typeof oldRender === 'function' && !oldRender.__studioVisualizationsWrapped) {
    const wrapped = function(...args) {
      const result = oldRender.apply(this,args);
      refresh();
      return result;
    };
    wrapped.__studioVisualizationsWrapped = true;
    window.render = wrapped;
  }
  const oldNav = window.nav;
  if (typeof oldNav === 'function' && !oldNav.__studioVisualizationsWrapped) {
    const wrapped = function(route,...args) {
      const result = oldNav.call(this,route,...args);
      refresh();
      return result;
    };
    wrapped.__studioVisualizationsWrapped = true;
    window.nav = wrapped;
  }
  window.addEventListener('resize',() => {
    for (const chart of charts.values()) chart.resize();
  },{passive:true});
  window.StudioVisualizations = {version:'1.0.0',refresh,loadECharts,dispose:()=>{for(const chart of charts.values())chart.dispose();charts.clear();}};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
})();