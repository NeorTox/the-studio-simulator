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
      const stale = charts.get(id);
      if (stale) { stale.dispose(); charts.delete(id); }
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
      if (instance && (instance.isDisposed?.() || instance.getDom?.() !== plot)) {
        instance.dispose();
        charts.delete(id);
        instance = null;
      }
      if (!instance) {
        instance = echarts.init(plot,null,{renderer:'canvas',useDirtyRect:true});
        charts.set(id,instance);
      }
      instance.setOption({
        backgroundColor:'transparent',
        color:['#c2a477','#7e9f93','#718ba7','#b87965','#8e83a6','#a4a77a','#5f9ca0','#c1a0ac'],
        textStyle:{fontFamily:'Inter, system-ui, sans-serif',color:'#b6c1bc'},
        aria:{enabled:true},
        ...option
      },{notMerge:true,lazyUpdate:true});
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
      series:[{name:'Company cash',type:'line',smooth:.28,symbol:'circle',symbolSize:5,data:rows.map(row=>Number(row[1].toFixed(2))),lineStyle:{width:2.6,color:'#c8a779'},itemStyle:{color:'#e5c89d',borderColor:'#172126',borderWidth:2},areaStyle:{color:'rgba(199,164,117,.12)'}}]
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
    if (!page.classList.contains('active')) return;
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
    const parent = $('finance-overview-charts') || tabs.parentElement;
    const card = ensureCard(parent,'studio-finance-category-chart','Expense structure','Posted company expenses grouped by ledger category.','ACTUAL TRANSACTIONS');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
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
  function investmentSeries() {
    const empire = active?.financialEmpire;
    const holdings = Array.isArray(empire?.holdings) ? empire.holdings.filter(item => item.status === 'Active') : [];
    const rows = new Map();
    holdings.forEach(item => {
      const key = String(item.assetClass || 'Other');
      rows.set(key,(rows.get(key)||0)+number(item.marketValue));
    });
    const cash = number(active?.company?.cash);
    if (cash > 0) rows.set('Treasury cash',cash);
    return Array.from(rows.entries()).filter(row=>row[1]>0).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value:Math.round(value*100)/100}));
  }
  function renderPortfolioChart() {
    const page = $('page-finance');
    if (!page) return;
    const tabs = page.querySelector('.workspace-tabs') || page.querySelector('.workspace-panels') || page.querySelector(':scope > .hero');
    if (!tabs) return;
    const parent = $('finance-overview-charts') || tabs.parentElement;
    const card = ensureCard(parent,'studio-finance-portfolio-chart','Treasury & investment allocation','Actual company cash and marked value of active financial-empire holdings.','CURRENT PORTFOLIO');
    if (!card) return;
    const expense = $('studio-finance-category-chart');
    if (expense && expense.parentElement === parent) expense.insertAdjacentElement('afterend',card);
    else parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const rows = investmentSeries();
    if (!rows.length) {
      showEmpty('studio-finance-portfolio-chart','Treasury allocation will appear when cash is available or an investment holding is recorded.');
      return;
    }
    mount('studio-finance-portfolio-chart',{
      animationDuration:420,
      tooltip:{trigger:'item',backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:item=>item.name+'<br><b>'+item.value.toLocaleString()+'</b> ('+item.percent+'%)'},
      legend:{type:'scroll',bottom:0,textStyle:{color:'#a8b4b0',fontSize:9},pageTextStyle:{color:'#a8b4b0'}},
      series:[{type:'pie',radius:['38%','70%'],center:['50%','44%'],itemStyle:{borderColor:'#152025',borderWidth:3},label:{color:'#dfe3da',fontSize:9,formatter:'{b}'},labelLine:{lineStyle:{color:'#667671'}},data:rows}]
    });
  }
  function renderProductionChart() {
    const page = $('page-projects');
    if (!page) return;
    const parent = $('production-slate-charts') || page;
    const card = ensureCard(parent,'studio-production-readiness-chart','Production development readiness','Completion of each project’s recorded creative-development checklist.','PROJECT PORTFOLIO');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const projects = Array.isArray(active?.projects) ? active.projects : [];
    if (!projects.length) {
      showEmpty('studio-production-readiness-chart','Production readiness will appear when the campaign has development projects.');
      return;
    }
    const rows = projects.map(project=>{
      const checklist = project.development?.checklist || {};
      const entries = Object.values(checklist);
      const complete = entries.filter(Boolean).length;
      return {name:String(project.title||project.name||project.id||'Untitled project'),value:entries.length?Math.round(complete/entries.length*100):0,complete,total:entries.length};
    }).slice(0,12);
    mount('studio-production-readiness-chart',{
      animationDuration:420,
      grid:{left:100,right:32,top:14,bottom:18},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items=>{const item=items[0],row=rows[item.dataIndex];return row.name+'<br><b>'+row.complete+' / '+row.total+' checks</b> · '+row.value+'%';}},
      xAxis:{type:'value',min:0,max:100,axisLabel:{color:'#a3b0ab',fontSize:9,formatter:'{value}%'},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      yAxis:{type:'category',data:rows.map(row=>row.name),axisLabel:{color:'#c0cac4',fontSize:9,overflow:'truncate',width:90},axisLine:{show:false},axisTick:{show:false}},
      series:[{type:'bar',data:rows.map(row=>row.value),barMaxWidth:18,itemStyle:{color:'#b99a6d',borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:'#d7d9cf',fontSize:9,formatter:'{c}%'}}]
    });
  }
  function regionalEconomySeries() {
    const regions = active?.market?.globalEconomy?.regions;
    if (!Array.isArray(regions) || !regions.length) return null;
    return regions.filter(region=>Number.isFinite(Number(region.gdpIndex))).map(region=>({
      name:String(region.name||region.id||'Region'),
      gdp:number(region.gdpIndex),
      inflation:number(region.inflationPct),
      unemployment:number(region.unemploymentPct)
    }));
  }
  function renderRegionalEconomyChart() {
    const page = $('page-market');
    const parent = $('market-regional-chart-slot');
    if (!page || !parent) return;
    const card = ensureCard(parent,'studio-market-regional-economy-chart','Regional economic conditions','GDP index from the campaign’s simulated global economy.','SIMULATION DATA');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const rows = regionalEconomySeries();
    if (!rows) {
      showEmpty('studio-market-regional-economy-chart','Regional economic comparisons will appear when the global economy has initialized.');
      return;
    }
    mount('studio-market-regional-economy-chart',{
      animationDuration:420,
      grid:{left:115,right:26,top:16,bottom:20},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items=>{const row=rows[items[0].dataIndex];return row.name+'<br>GDP index: <b>'+row.gdp.toFixed(1)+'</b><br>Inflation: '+row.inflation.toFixed(2)+'%<br>Unemployment: '+row.unemployment.toFixed(2)+'%';}},
      xAxis:{type:'value',axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      yAxis:{type:'category',data:rows.map(row=>row.name),axisLabel:{color:'#c0cac4',fontSize:9,overflow:'truncate',width:105},axisLine:{show:false},axisTick:{show:false}},
      series:[{type:'bar',data:rows.map(row=>row.gdp),barMaxWidth:20,itemStyle:{color:'#8eaa9a',borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:'#d7d9cf',fontSize:8,formatter:params=>Number(params.value).toFixed(1)}}]
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
    if (!page.classList.contains('active')) return;
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
  function renderWorkforceChart() {
    const page = $('page-people');
    const parent = $('people-workforce-chart-slot') || page;
    if (!page || !parent) return;
    const card = ensureCard(parent,'studio-people-workforce-chart','Workforce & payroll by department','Active employee records grouped by department. Payroll is the sum of recorded monthly salaries.','EMPLOYEE REGISTER');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const employees = Array.isArray(active?.employees) ? active.employees.filter(e=>e.status!=='Terminated'&&(!(e.endDate||e.contractEndDate)||(e.endDate||e.contractEndDate)>=active.date)) : [];
    if (!employees.length) {
      showEmpty('studio-people-workforce-chart','Department headcount and payroll will appear after the first employee is hired.');
      return;
    }
    const groups = new Map();
    employees.forEach(employee=>{
      const department=String(employee.department||'Unassigned');
      const row=groups.get(department)||{name:department,headcount:0,payroll:0};
      row.headcount++;
      row.payroll+=number(employee.salary);
      groups.set(department,row);
    });
    const rows=Array.from(groups.values()).sort((a,b)=>b.payroll-a.payroll).slice(0,12);
    mount('studio-people-workforce-chart',{
      animationDuration:420,
      grid:{left:110,right:55,top:16,bottom:18},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items=>{const row=rows[items[0].dataIndex];return row.name+'<br>Headcount: <b>'+row.headcount+'</b><br>Monthly payroll: '+row.payroll.toLocaleString();}},
      xAxis:{type:'value',axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      yAxis:{type:'category',data:rows.map(row=>row.name),axisLabel:{color:'#c0cac4',fontSize:9,overflow:'truncate',width:100},axisLine:{show:false},axisTick:{show:false}},
      series:[{type:'bar',data:rows.map(row=>row.headcount),barMaxWidth:20,itemStyle:{color:'#8eaa9a',borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:'#d7d9cf',fontSize:9}}]
    });
  }
  function renderTalentRosterChart() {
    const page = $('page-talent');
    const parent = $('talent-roster-chart-slot');
    if (!page || !parent) return;
    const card = ensureCard(parent,'studio-talent-roster-chart','Performer capability profile','Acting skill and star power for performers currently available or under contract.','ACTIVE ROSTER');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const roster = Array.isArray(active?.talent) ? active.talent.filter(t=>t && (t.status==='Available'||t.status==='Contracted')) : [];
    if (!roster.length) {
      showEmpty('studio-talent-roster-chart','Promote audition applicants into the roster to compare acting skill and star power.');
      return;
    }
    const rows = roster.slice().sort((a,b)=>number(b.starPower)-number(a.starPower)).slice(0,10);
    mount('studio-talent-roster-chart',{
      animationDuration:420,
      legend:{top:0,textStyle:{color:'#a8b4b0',fontSize:9}},
      grid:{left:112,right:24,top:34,bottom:18},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items=>{const row=rows[items[0].dataIndex];return row.name+'<br>Acting skill: <b>'+number(row.actingSkill)+'/100</b><br>Star power: <b>'+number(row.starPower)+'/100</b><br>Expected fee: '+number(row.expectedFee).toLocaleString();}},
      xAxis:{type:'value',min:0,max:100,axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      yAxis:{type:'category',data:rows.map(row=>String(row.name||'Performer')),axisLabel:{color:'#c0cac4',fontSize:9,overflow:'truncate',width:102},axisLine:{show:false},axisTick:{show:false}},
      series:[
        {name:'Acting skill',type:'bar',data:rows.map(row=>number(row.actingSkill)),barMaxWidth:16,itemStyle:{color:'#8eaa9a',borderRadius:[0,4,4,0]}},
        {name:'Star power',type:'bar',data:rows.map(row=>number(row.starPower)),barMaxWidth:16,itemStyle:{color:'#b99a6d',borderRadius:[0,4,4,0]}}
      ]
    });
  }
  function renderGenreDemandChart() {
    const page = $('page-market');
    const parent = $('market-genre-chart-slot');
    if (!page || !parent) return;
    const card = ensureCard(parent,'studio-market-genre-chart','Audience demand by genre','Current campaign demand index, using the market engine’s live genre values.','DEMAND INDEX');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const genres=active?.market?.genres;
    if (!genres || typeof genres!=='object' || !Object.keys(genres).length) {
      showEmpty('studio-market-genre-chart','Genre demand will appear when the market simulation initializes.');
      return;
    }
    const rows=Object.entries(genres).map(([name,value])=>({name,value:number(value)})).sort((a,b)=>b.value-a.value).slice(0,12);
    mount('studio-market-genre-chart',{
      animationDuration:420,
      grid:{left:112,right:34,top:14,bottom:18},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'}},
      xAxis:{type:'value',min:0,max:100,axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      yAxis:{type:'category',data:rows.map(row=>row.name),axisLabel:{color:'#c0cac4',fontSize:9,overflow:'truncate',width:104},axisLine:{show:false},axisTick:{show:false}},
      series:[{type:'bar',data:rows.map(row=>row.value),barMaxWidth:18,itemStyle:{color:'#b99a6d',borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:'#d7d9cf',fontSize:9}}]
    });
  }
  function renderMediaCoverageChart() {
    const page = $('page-media');
    const parent = $('media-coverage-chart-slot');
    if (!page || !parent) return;
    const card = ensureCard(parent,'studio-media-coverage-chart','Press cycle & coverage reach','Recorded coverage items grouped by campaign date. Reach is the media engine’s index, not a verified audience count.','RECORDED COVERAGE');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const coverage=Array.isArray(active?.market?.media?.coverage)?active.market.media.coverage:[];
    if (!coverage.length) {
      showEmpty('studio-media-coverage-chart','Coverage activity will appear as the simulated press cycle records stories.');
      return;
    }
    const grouped=new Map();
    coverage.forEach(item=>{
      if(!validDate(item.date))return;
      const row=grouped.get(item.date)||{date:item.date,stories:0,reach:0};
      row.stories++;
      row.reach+=number(item.reachIndex);
      grouped.set(item.date,row);
    });
    const rows=Array.from(grouped.values()).sort((a,b)=>a.date.localeCompare(b.date)).slice(-45);
    if(!rows.length){showEmpty('studio-media-coverage-chart','No dated coverage records are available yet.');return;}
    mount('studio-media-coverage-chart',{
      animationDuration:420,
      grid:{left:48,right:18,top:18,bottom:38},
      tooltip:{trigger:'axis',backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items=>{const row=rows[items[0].dataIndex];return row.date+'<br>Stories: <b>'+row.stories+'</b><br>Combined reach index: '+row.reach.toFixed(2);}},
      xAxis:{type:'category',data:rows.map(row=>row.date),axisLabel:{color:'#a3b0ab',fontSize:8,hideOverlap:true},axisLine:{lineStyle:{color:'#46545a'}},axisTick:{show:false}},
      yAxis:{type:'value',minInterval:1,axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      series:[{type:'bar',data:rows.map(row=>row.stories),barMaxWidth:24,itemStyle:{color:'#8eaa9a',borderRadius:[3,3,0,0]}}]
    });
  }
  function renderDistributionChart() {
    const page = $('page-distribution');
    if (!page) return;
    const tabs = page.querySelector('.workspace-tabs') || page.querySelector(':scope > .hero');
    if (!tabs) return;
    const card = ensureCard(page,'studio-distribution-settlement-chart','Royalty settlements over time','Cash receipts recorded by the distribution settlement engine, grouped by settlement month.','SETTLEMENT HISTORY');
    if (!card) return;
    tabs.insertAdjacentElement('afterend',card);
    if (!page.classList.contains('active')) return;
    const settlements=Array.isArray(active?.distribution?.settlements)?active.distribution.settlements:[];
    if (!settlements.length) {
      showEmpty('studio-distribution-settlement-chart','Royalty settlement history will appear after a distribution partner pays the first statement.');
      return;
    }
    const grouped=new Map();
    settlements.forEach(item=>{
      if(!validDate(item.date))return;
      const month=item.date.slice(0,7);
      grouped.set(month,(grouped.get(month)||0)+number(item.amount));
    });
    const rows=Array.from(grouped.entries()).sort((a,b)=>a[0].localeCompare(b[0])).slice(-36);
    mount('studio-distribution-settlement-chart',{
      animationDuration:420,
      grid:{left:58,right:18,top:18,bottom:38},
      tooltip:{trigger:'axis',backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items=>items[0].axisValue+'<br><b>'+number(items[0].data).toLocaleString()+'</b>'},
      xAxis:{type:'category',data:rows.map(row=>row[0]),axisLabel:{color:'#a3b0ab',fontSize:8,hideOverlap:true},axisLine:{lineStyle:{color:'#46545a'}},axisTick:{show:false}},
      yAxis:{type:'value',axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      series:[{type:'line',smooth:.25,symbol:'circle',symbolSize:5,data:rows.map(row=>round2(row[1])),lineStyle:{width:2.5,color:'#c2a477'},itemStyle:{color:'#e5c89d'},areaStyle:{color:'rgba(199,164,117,.12)'}}]
    });
  }
  function renderFounderAssetsChart() {
    const page = $('page-personal');
    const parent = $('personal-assets-chart-slot');
    if (!page || !parent) return;
    const card = ensureCard(parent,'studio-personal-assets-chart','Founder assets & liabilities','Personal cash, asset values and debt are shown separately from company accounts.','FOUNDER FINANCES');
    if (!card) return;
    parent.appendChild(card);
    if (!page.classList.contains('active')) return;
    const founder=active?.founder;
    if (!founder) {showEmpty('studio-personal-assets-chart','Founder financial data will appear after a campaign is created.');return;}
    const rows=[];
    if(number(founder.personalCash)>0)rows.push({name:'Cash',value:number(founder.personalCash)});
    (Array.isArray(founder.personalAssets)?founder.personalAssets:[]).forEach(asset=>{if(number(asset.currentValue)>0)rows.push({name:String(asset.name||asset.type||'Personal asset'),value:number(asset.currentValue)});});
    if(number(founder.personalDebt)>0)rows.push({name:'Personal debt',value:-number(founder.personalDebt)});
    if(!rows.length){showEmpty('studio-personal-assets-chart','No personal assets or cash balances have been recorded.');return;}
    mount('studio-personal-assets-chart',{
      animationDuration:420,
      grid:{left:115,right:45,top:16,bottom:24},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'#111a1f',borderColor:'#6f624e',textStyle:{color:'#eee9dc'},formatter:items=>items[0].name+'<br><b>'+number(items[0].data).toLocaleString()+'</b>'},
      xAxis:{type:'value',axisLabel:{color:'#a3b0ab',fontSize:9},splitLine:{lineStyle:{color:'rgba(137,157,155,.13)',type:'dashed'}}},
      yAxis:{type:'category',data:rows.map(row=>row.name),axisLabel:{color:'#c0cac4',fontSize:9,overflow:'truncate',width:105},axisLine:{show:false},axisTick:{show:false}},
      series:[{type:'bar',data:rows.map(row=>row.value),barMaxWidth:22,itemStyle:{color:params=>params.value<0?'#b87965':'#8eaa9a',borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:'#d7d9cf',fontSize:9,formatter:params=>number(params.value).toLocaleString()}}]
    });
  }
  function refresh() {
    renderOverviewChart();
    renderFinanceChart();
    renderPortfolioChart();
    renderProductionChart();
    renderRegionalEconomyChart();
    renderPopulationChart();
    renderWorkforceChart();
    renderTalentRosterChart();
    renderGenreDemandChart();
    renderMediaCoverageChart();
    renderDistributionChart();
    renderFounderAssetsChart();
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