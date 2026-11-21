(() => {
  'use strict';
  const VERSION = '1.0.0';
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clamp = (value, min=0, max=100) => Math.max(min, Math.min(max, Number(value) || 0));
  const hash = value => { let h=2166136261; for (const char of String(value)) { h ^= char.charCodeAt(0); h=Math.imul(h,16777619); } return (h>>>0).toString(16).padStart(8,'0'); };
  const campaign = () => typeof active !== 'undefined' && active ? active : null;
  const topics = {
    work: {label:'Current work',kicker:'THE WORK IN FRONT OF US',scene:'A quiet meeting room beside the production floor',prompt:'Talk through the work currently on their plate.'},
    career: {label:'Ambitions',kicker:'WHAT COMES NEXT',scene:'A private conversation about the future',prompt:'Give them room to talk about what they want next.'},
    personal: {label:'Life outside work',kicker:'THE PERSON BEHIND THE ROLE',scene:'A quieter corner away from the daily rush',prompt:'Check in on the person, not just the employee.'},
    industry: {label:'The industry',kicker:'A CHANGING BUSINESS',scene:'An informal discussion about the wider industry',prompt:'Talk about the changes shaping entertainment.'}
  };
  const choices = [
    {id:'support',label:'Ask what would help them most',line:'I want to understand what would make things easier for you.',kind:'support',intensity:1.2},
    {id:'curiosity',label:'Explore their ambitions',line:'What are you hoping to accomplish next?',kind:'share-information',intensity:1.05},
    {id:'plan',label:'Work out practical next steps',line:'Let’s work through this and agree on a practical next step.',kind:'cooperate',intensity:1.15},
    {id:'challenge',label:'Challenge their position',line:'I see it differently. Help me understand why you feel so strongly.',kind:'conflict',intensity:.8}
  ];
  let selectedId = null;
  let selectedTopic = 'work';
  let filter = '';
  let activeTab = 'all';
  let lastResult = null;
  const palettes = ['#b18b68','#7d9e9c','#9b829c','#b28b80','#8597b0','#a6a078'];

  function people() {
    const c=campaign();
    const list=c?.world?.population?.npcs;
    return Array.isArray(list) ? list.filter(n=>n && n.alive!==false && n.status!=='Deceased') : [];
  }
  function employees() {
    const c=campaign();
    return new Set((c?.employees||[]).map(e=>String(e.npcId || String(e.id||'').replace(/^EMP-/,'') )).filter(Boolean));
  }
  function findPerson(id) { return people().find(n=>String(n.id)===String(id)) || null; }
  function founderName() { const c=campaign(); return c?.founder?.name || c?.player?.name || 'Studio Founder'; }
  function persistentState() {
    const c=campaign();
    if(!c) return null;
    c.world=c.world||{};
    let s=c.world.cinematicInteractions;
    if(!s || s.version!==VERSION) {
      s=c.world.cinematicInteractions={version:VERSION,sessions:[],history:[],lastNpcId:null,metrics:{sessions:0,turns:0}};
    }
    s.sessions=Array.isArray(s.sessions)?s.sessions:[];
    s.history=Array.isArray(s.history)?s.history:[];
    s.metrics=s.metrics||{sessions:0,turns:0};
    return s;
  }
  function relationship(id) {
    try {
      const graph=window.StudioSocialNetwork?.networkFor?.('PLAYER');
      return graph?.relationships?.find(edge=>String(edge.otherNpcId)===String(id))||null;
    } catch (_) { return null; }
  }
  function relationshipLabel(edge) {
    if(!edge) return 'Not yet established';
    if(edge.tension>=65) return 'Strained';
    if(edge.trust>=70 && edge.closeness>=55) return 'Close connection';
    if(edge.trust>=50) return 'Building trust';
    return 'Getting acquainted';
  }
  function initials(name) {
    return String(name||'').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase()||'•';
  }
  function palette(person) { return palettes[parseInt(hash(person?.id||person?.name||'x').slice(0,4),16)%palettes.length]; }
  function employeeSet() { return employees(); }
  function contactSort(a,b,staff) {
    const ae=staff.has(String(a.id)),be=staff.has(String(b.id));
    if(ae!==be) return ae?-1:1;
    const edgeA=relationship(a.id),edgeB=relationship(b.id);
    const aScore=(edgeA?.closeness||0)+(edgeA?.trust||0),bScore=(edgeB?.closeness||0)+(edgeB?.trust||0);
    return bScore-aScore || String(a.name).localeCompare(String(b.name));
  }
  function selectedPerson() { return findPerson(selectedId); }
  function selectedSession(id=selectedId) {
    const s=persistentState();
    const matches=s?.sessions.filter(item=>String(item.npcId)===String(id))||[];return matches[matches.length-1]||null;
  }
  function playerLine(session, choice) {
    session.lines.push({speaker:'player',name:founderName(),text:choice.line,date:campaign().date});
  }
  function initialLine(person, topic, edge) {
    const name=person.name||'';
    const stress=Number(person.stress||0);
    if(edge?.trust>=65) return 'I’m glad we can have a proper conversation. There’s quite a bit I’ve wanted to discuss with you.';
    if(stress>=70) return 'I’m sorry if I seem a little distracted. It has been a demanding stretch, but I’m listening.';
    if(String(person.personality||'').toLowerCase().includes('reserved')) return 'I appreciate you making time for this. I’m not always the first to speak up, so it helps to have the space.';
    if(topic==='personal') return 'It’s good to have a moment that isn’t just about deadlines. There’s more to life here than the work.';
    return 'Thanks for making the time. I wasn’t sure when we’d get the chance to talk properly.';
  }
  function createSession(id, topicKey) {
    const person=findPerson(id),s=persistentState();
    if(!person||!s) return null;
    const topic=topics[topicKey]?topicKey:'work';
    let session=s.sessions.filter(item=>String(item.npcId)===String(id)&&item.status==='ongoing').slice(-1)[0];
    if(session) { session.topic=topic; session.updatedAt=campaign().date; return session; }
    const sessionId='SCENE-'+hash([campaign().id,id,campaign().date,s.sessions.length].join('|'));
    const edge=relationship(id);
    session={id:sessionId,npcId:String(id),topic,status:'ongoing',startedAt:campaign().date,updatedAt:campaign().date,turns:0,lines:[{speaker:'npc',name:person.name||'Colleague',text:initialLine(person,topic,edge),date:campaign().date}],lastChoice:null};
    s.sessions.push(session);
    if(s.sessions.length>80) s.sessions.splice(0,s.sessions.length-80);
    s.metrics.sessions++;
    s.lastNpcId=String(id);
    s.history.push({id:sessionId,npcId:String(id),date:campaign().date,topic,type:'conversation-started'});
    if(s.history.length>500) s.history.splice(0,s.history.length-500);
    return session;
  }
  function makeReply(person, topic, choice, edge) {
    const personality=String(person.personality||person.secondaryTrait||'').toLowerCase();
    const goal=String(person.goal||'').trim();
    const occupation=String(person.occupation||'their role');
    const stress=Number(person.stress||0);
    const trust=Number(edge?.trust??35);
    const guarded=trust<32 || (choice.id==='challenge'&&trust<48);
    if(choice.id==='support') {
      if(stress>=65) return 'Honestly, I’ve been carrying more than I let on. Having someone ask what would help, rather than just asking for results, makes a difference.';
      if(personality.includes('ambit')) return 'I appreciate that. I want to do excellent work, but I also want the chance to grow into something bigger.';
      return 'Thank you. I don’t need every problem solved for me, but knowing there’s room to speak openly matters.';
    }
    if(choice.id==='curiosity') {
      if(guarded) return 'I’m still working that out. I’d rather show what I can do before making promises about the future.';
      return goal ? 'I keep coming back to this: '+goal.replace(/[.!?]+$/,'')+'. I know it will take work, but it’s what motivates me.' : 'I want to keep developing my strengths and take on work that challenges me in the right ways.';
    }
    if(choice.id==='plan') {
      if(topic==='work') return 'That would help. Let’s make the next step specific, agree who owns it, and check in before it becomes another last-minute problem.';
      if(topic==='career') return 'A clear development plan would mean a lot. I’d like to agree on a milestone that demonstrates I’m ready for more responsibility.';
      if(topic==='personal') return 'A little predictability would help. I can manage demanding periods better when I know there’s room to recover afterwards.';
      return 'Let’s keep an eye on the changes that matter to our work and decide which ones deserve a practical response.';
    }
    if(choice.id==='challenge') {
      if(guarded) return 'I hear you. I’m being careful because I don’t want this to turn into a conversation where honesty is held against me.';
      if(personality.includes('confident')||personality.includes('assert')) return 'Fair enough. I would rather have a direct disagreement than pretend we see everything the same way. Here is why I hold this position…';
      return 'I can explain my reasoning. I may not have the whole picture, but I’m not raising it without a reason.';
    }
    if(topic==='personal') return 'Outside work, I’m trying to make time for the people and routines that keep me grounded.';
    if(topic==='industry') return 'The industry is moving quickly. I think the people who keep learning and stay adaptable will be in the strongest position.';
    return 'I’ve been thinking about how to make a stronger contribution in '+occupation.toLowerCase()+'.';
  }
  function applyChoice(choiceId) {
    const p=selectedPerson(),session=selectedSession(),s=persistentState();
    if(!p||!session||session.status!=='ongoing'||!s) return;
    const choice=choices.find(item=>item.id===choiceId);
    if(!choice) return;
    const edgeBefore=relationship(p.id);
    playerLine(session,choice);
    let edgeAfter=edgeBefore;
    try {
      const result=window.StudioSocialNetwork?.interact?.('PLAYER',p.id,choice.kind,choice.intensity,campaign().date);
      edgeAfter=result?.edge||relationship(p.id);
    } catch (error) {
      console.warn('[Studio conversations] Relationship update unavailable:',error);
    }
    const reply=makeReply(p,session.topic,choice,edgeAfter||edgeBefore);
    session.lines.push({speaker:'npc',name:p.name||'Colleague',text:reply,date:campaign().date});
    session.turns++;
    session.lastChoice=choice.id;
    session.updatedAt=campaign().date;
    s.metrics.turns++;
    s.history.push({id:session.id,npcId:String(p.id),date:campaign().date,topic:session.topic,type:'conversation-turn',choice:choice.id,approach:choice.kind});
    if(s.history.length>500) s.history.splice(0,s.history.length-500);
    try {
      window.StudioNPCMemory?.recordMemory?.(p.id,{
        id:'DIALOGUE-'+hash(session.id+'|'+session.turns),
        date:campaign().date,type:'conversation',
        content:founderName()+' spoke with '+p.name+'. '+choice.line+' '+reply,
        importance:.35,emotionalValence:choice.id==='challenge'?-0.12:choice.id==='support'?.55:.25,
        emotionalIntensity:choice.id==='challenge'?.45:.25,
        people:['PLAYER'],tags:['conversation','founder',session.topic,choice.kind],
        outcome:choice.id,source:'cinematic-interaction-layer'
      });
    } catch (error) {
      console.warn('[Studio conversations] Memory update unavailable:',error);
    }
    lastResult={choice,edgeBefore,edgeAfter};
    try { if(typeof window.persist==='function') window.persist(); } catch (_) {}
    render();
  }
  function endConversation() {
    const session=selectedSession();
    if(!session||session.status!=='ongoing') return;
    session.status='ended';session.updatedAt=campaign()?.date||session.updatedAt;
    session.lines.push({speaker:'narration',name:'',text:'The conversation comes to a natural close.',date:campaign()?.date||session.updatedAt});
    try { if(typeof window.persist==='function') window.persist(); } catch (_) {}
    render();
  }
  function contactMarkup(person,staff) {
    const edge=relationship(person.id);
    const isSelected=String(person.id)===String(selectedId);
    const isStaff=staff.has(String(person.id));
    const recent=selectedSession(person.id);
    return '<button class="st-contact'+(isSelected?' is-selected':'')+'" data-contact="'+esc(person.id)+'" type="button">'+
      '<span class="st-contact-avatar" style="--st-person-accent:'+palette(person)+'">'+esc(initials(person.name))+'</span>'+
      '<span class="st-contact-copy"><b>'+esc(person.name||'Unknown person')+'</b><small>'+esc(person.occupation||person.status||'Independent')+(isStaff?' · YOUR STUDIO':'')+'</small><span class="st-contact-relationship">'+esc(relationshipLabel(edge))+'</span></span>'+
      (recent?'<span class="st-contact-recency">◷</span>':'')+'</button>';
  }
  function lineMarkup(line) {
    if(line.speaker==='narration') return '<div class="st-scene-narration">'+esc(line.text)+'</div>';
    const player=line.speaker==='player';
    return '<article class="st-dialogue-line '+(player?'is-player':'is-character')+'"><small>'+(player?'YOU':esc(line.name||'CHARACTER'))+'</small><p>'+esc(line.text)+'</p><time>'+esc(line.date||'')+'</time></article>';
  }
  function contactListMarkup() {
    const list=people(),staff=employeeSet();
    let filtered=list.filter(person=>{
      const q=filter.toLowerCase();
      const matches=!q || [person.name,person.occupation,person.department,person.city,person.goal].join(' ').toLowerCase().includes(q);
      const isStaff=staff.has(String(person.id));
      return matches && (activeTab==='all' || (activeTab==='staff'&&isStaff) || (activeTab==='connected'&&!!relationship(person.id)));
    });
    filtered.sort((a,b)=>contactSort(a,b,staff));
    const visible=filtered.slice(0,100);
    return {count:filtered.length,html:visible.map(person=>contactMarkup(person,staff)).join('')};
  }
  function dossierMarkup(person,edge) {
    if(!person) return '<div class="st-dossier-empty">Choose someone from your world to see their profile.</div>';
    const trust=Number(edge?.trust??35),closeness=Number(edge?.closeness??12),tension=Number(edge?.tension??0);
    const memoryCount=Array.isArray(person.memory?.memories)?person.memory.memories.length:0;
    return '<div class="st-dossier-person"><span class="st-dossier-avatar" style="--st-person-accent:'+palette(person)+'">'+esc(initials(person.name))+'</span><div><h3>'+esc(person.name)+'</h3><p>'+esc(person.occupation||'Independent professional')+'</p></div></div>'+
      '<div class="st-dossier-section"><small>PERSONAL DETAILS</small><div class="st-dossier-row"><span>Age</span><b>'+(Number.isFinite(Number(person.age))?esc(person.age):'—')+'</b></div><div class="st-dossier-row"><span>Location</span><b>'+esc(person.city||person.region||'Unknown')+'</b></div><div class="st-dossier-row"><span>Department</span><b>'+esc(person.department||'—')+'</b></div><div class="st-dossier-row"><span>Current status</span><b>'+esc(person.status||'—')+'</b></div></div>'+
      '<div class="st-dossier-section"><small>PERSONALITY & DIRECTION</small><p class="st-dossier-traits">'+esc([person.personality,person.secondaryTrait].filter(Boolean).join(' · ')||'Still getting to know them')+'</p><p class="st-dossier-goal">'+esc(person.goal||'Their ambitions will become clearer as your relationship develops.')+'</p></div>'+
      '<div class="st-dossier-section"><small>YOUR CONNECTION</small><div class="st-relationship-metric"><div><span>TRUST</span><b>'+trust.toFixed(0)+'</b></div><i><em style="width:'+clamp(trust)+'%"></em></i></div><div class="st-relationship-metric"><div><span>RAPPORT</span><b>'+closeness.toFixed(0)+'</b></div><i><em style="width:'+clamp(closeness)+'%"></em></i></div><div class="st-relationship-metric"><div><span>TENSION</span><b>'+tension.toFixed(0)+'</b></div><i class="is-tension"><em style="width:'+clamp(tension)+'%"></em></i></div><p class="st-dossier-foot">'+memoryCount+' recorded personal memories · '+esc(relationshipLabel(edge))+'</p></div>';
  }
  function sceneMarkup(person,edge,session) {
    const topic=topics[session?.topic||selectedTopic]||topics.work;
    if(!person) return '<div class="st-scene-empty"><span>◈</span><small>THE PEOPLE BEHIND THE EMPIRE</small><h2>Every relationship starts somewhere.</h2><p>Select a person from your world to begin a conversation. The people you meet, support, challenge and remember will become part of your studio’s history.</p></div>';
    const mood=Number(person.stress||0)>70?'tense':edge?.trust>=65?'warm':edge?.trust<32?'guarded':'thoughtful';
    const sessionLines=session?.lines||[];
    const body=session?sessionLines.slice(-8).map(lineMarkup).join(''):'<div class="st-scene-intro"><small>'+esc(topic.kicker)+'</small><h2>'+esc(person.name||'A conversation')+'</h2><p>'+esc(topic.prompt)+'</p><button class="st-scene-start" data-start-conversation>BEGIN CONVERSATION <span>↗</span></button></div>';
    const options=session?.status==='ongoing'?'<div class="st-dialogue-choices">'+choices.map((choice,index)=>'<button type="button" data-choice="'+choice.id+'"><span>0'+(index+1)+'</span><b>'+esc(choice.label)+'</b><i>↗</i></button>').join('')+'<button class="st-dialogue-end" data-end-conversation>End conversation</button></div>':session?.status==='ended'?'<div class="st-conversation-ended"><span>CONVERSATION SAVED</span><p>You can start another conversation with '+esc(person.name)+'.</p><button class="st-scene-start" data-start-conversation>START ANOTHER CONVERSATION <span>↗</span></button></div>':'';
    return '<div class="st-scene-stage st-mood-'+mood+'"><div class="st-scene-backdrop-grid"></div><div class="st-scene-location"><span class="st-live-dot"></span><span>SCENE / '+esc(topic.label.toUpperCase())+'</span><b>'+esc(topic.scene)+'</b></div><div class="st-character-art" style="--st-person-accent:'+palette(person)+'"><div class="st-character-light"></div><div class="st-character-halo"></div><div class="st-character-figure"><div class="st-character-neck"></div><div class="st-character-head"><span class="st-character-hair"></span><span class="st-character-face"></span><span class="st-character-eye eye-left"></span><span class="st-character-eye eye-right"></span><span class="st-character-nose"></span><span class="st-character-mouth"></span></div><div class="st-character-body"></div></div><div class="st-character-shadow"></div></div><div class="st-character-caption"><small>IN CONVERSATION WITH</small><h2>'+esc(person.name||'Unknown person')+'</h2><p>'+esc(person.occupation||'Independent professional')+' · '+esc(person.city||person.region||'')+'</p></div><div class="st-scene-index"><span>THE STUDIO</span><b>01</b><i>/</i><span>PEOPLE & RELATIONSHIPS</span></div></div>'+
      '<div class="st-dialogue-area"><div class="st-dialogue-header"><div><small>'+esc(topic.kicker)+'</small><h3>'+(session?'The conversation':'A moment to connect')+'</h3></div><div class="st-dialogue-meta">'+(session?'<span>DAY '+esc(session.startedAt)+'</span><span>'+session.turns+' EXCHANGES</span>':'<span>NO RUSH. NO SCRIPT.</span>')+'</div></div>'+
      (!session?'<div class="st-topic-picker"><span>CHOOSE A TOPIC</span>'+Object.entries(topics).map(([key,value])=>'<button type="button" data-topic="'+key+'" class="'+(selectedTopic===key?'active':'')+'">'+esc(value.label)+'</button>').join('')+'</div>':'')+
      '<div class="st-dialogue-transcript">'+(body||'')+'</div>'+options+'</div>';
  }
  function render() {
    const page=$('#page-interactions');
    if(!page) return;
    const c=campaign(),s=persistentState();
    if(!c||!s) {
      page.innerHTML='<div class="st-interaction-empty"><small>THE STUDIO / LIFE</small><h1>Conversations</h1><p>Create or load a campaign to meet the people in your world.</p></div>';
      return;
    }
    if(!selectedId || !findPerson(selectedId)) selectedId=s.lastNpcId&&findPerson(s.lastNpcId)?s.lastNpcId:(people()[0]?.id||null);
    const list=contactListMarkup(),person=selectedPerson(),edge=person?relationship(person.id):null,session=person?selectedSession(person.id):null;
    page.innerHTML='<div class="st-interaction-heading"><div><div class="st-interaction-eyebrow">LIFE / PEOPLE / RELATIONSHIPS</div><h1>Conversations</h1><p>Meet the people behind the company. Listen, disagree, build trust and remember what was said.</p></div><div class="st-interaction-heading-meta"><span>WORLD DATE</span><b>'+esc(c.date||'—')+'</b><small>'+people().length.toLocaleString()+' people in your world</small></div></div>'+
      '<div class="st-conversation-layout"><aside class="st-contact-panel"><div class="st-contact-panel-head"><div><small>YOUR WORLD</small><h2>People</h2></div><span>'+list.count+'</span></div><label class="st-contact-search"><span>⌕</span><input id="st-contact-search" type="search" placeholder="Find someone…" value="'+esc(filter)+'" autocomplete="off"></label><div class="st-contact-filters"><button data-filter-tab="all" class="'+(activeTab==='all'?'active':'')+'">All people</button><button data-filter-tab="staff" class="'+(activeTab==='staff'?'active':'')+'">Your studio</button><button data-filter-tab="connected" class="'+(activeTab==='connected'?'active':'')+'">Connected</button></div><div class="st-contact-list">'+(list.html||'<div class="st-contact-none">No people match this view yet.</div>')+'</div><div class="st-contact-foot">CONTACTS ARE REAL SIMULATED PEOPLE</div></aside>'+
      '<section class="st-scene-column">'+sceneMarkup(person,edge,session)+'</section>'+
      '<aside class="st-character-dossier"><div class="st-dossier-heading"><small>CHARACTER DOSSIER</small><span>PROFILE / 01</span></div>'+dossierMarkup(person,edge)+'</aside></div>'+
      '<div class="st-interaction-footer"><span>CONVERSATIONS ARE SAVED WITH YOUR CAMPAIGN</span><span>MEMORY & RELATIONSHIPS CONNECTED</span></div>';
    bind(page);
  }
  let boundRoot=null;
  function bind(page) {
    if(boundRoot===page) return;
    boundRoot=page;
    page.addEventListener('click',event=>{
      const contact=event.target.closest('[data-contact]');
      if(contact){selectedId=contact.dataset.contact;const s=persistentState();if(s)s.lastNpcId=selectedId;render();return}
      const topic=event.target.closest('[data-topic]');
      if(topic){selectedTopic=topic.dataset.topic;render();return}
      const choice=event.target.closest('[data-choice]');
      if(choice){applyChoice(choice.dataset.choice);return}
      if(event.target.closest('[data-start-conversation]')){createSession(selectedId,selectedTopic);try{if(typeof window.persist==='function')window.persist()}catch(_){}render();return}
      if(event.target.closest('[data-end-conversation]')){endConversation();return}
      const tab=event.target.closest('[data-filter-tab]');
      if(tab){activeTab=tab.dataset.filterTab;render();return}
    });
    page.addEventListener('input',event=>{
      if(event.target.id!=='st-contact-search')return;
      filter=event.target.value;
      const q=filter.toLowerCase();
      page.querySelectorAll('[data-contact]').forEach(button=>{button.hidden=!button.textContent.toLowerCase().includes(q)});
      const count=page.querySelector('.st-contact-panel-head>span');
      if(count)count.textContent=String(page.querySelectorAll('[data-contact]:not([hidden])').length);
    });
  }
  function mount() {
    const content=$('.content'),nav=$('.nav');
    if(!content||!nav)return false;
    if(!$('#page-interactions')) {
      const page=document.createElement('section');
      page.id='page-interactions';page.className='page';
      content.append(page);
    }
    if(!nav.querySelector('[data-page="interactions"]')) {
      const button=document.createElement('button');
      button.type='button';
      button.dataset.page='interactions';
      button.innerHTML='<span>◉</span>Conversations';
      const lifeGroup=nav.querySelector('[data-nav-group="life"]');
      if(lifeGroup) lifeGroup.append(button);
      else {
        const group=document.createElement('section');
        group.className='nav-group st-interactions-nav-group';
        group.innerHTML='<div class="nav-group-heading">Life & people</div>';
        group.append(button);
        nav.append(group);
      }
      button.addEventListener('click',()=>window.nav?.('interactions'));
    }
    const personal=$('#page-personal');
    if(personal&&!personal.querySelector('[data-open-conversations]')) {
      const hero=$('.hero',personal);
      const button=document.createElement('button');
      button.type='button';button.className='btn';button.dataset.openConversations='true';button.textContent='◉ Open conversations';
      button.addEventListener('click',()=>window.nav?.('interactions'));
      hero?.querySelector('.actions')?.append(button);
    }
    const s=persistentState();
    if(!selectedId) selectedId=s?.lastNpcId&&findPerson(s.lastNpcId)?s.lastNpcId:people()[0]?.id||null;
    render();
    return true;
  }
  function audit() {
    const c=campaign(),s=persistentState(),tests=[];
    const add=(name,ok,detail)=>tests.push({name,ok:!!ok,detail});
    add('Conversation workspace mounted',!!$('#page-interactions'),'Dedicated life-and-people route exists.');
    add('Real NPC population connected',!c||!s||people().every(n=>!!n.id&&!!n.name),'Contacts are sourced from campaign NPC records.');
    add('Four meaningful dialogue approaches',choices.length===4,'Support, curiosity, practical planning and challenge.');
    add('Campaign-persistent conversation state',!s||(()=>{try{JSON.stringify(s);return true}catch(_){return false}})(),'Conversation history is JSON serializable.');
    add('Bounded conversation retention',!s||s.sessions.length<=80&&s.history.length<=500,'Sessions and event history are bounded.');
    return {passed:tests.filter(t=>t.ok).length,failed:tests.filter(t=>!t.ok).length,tests};
  }
  window.StudioCinematicInteractions={version:VERSION,render,mount,audit,createSession,applyChoice,topics,choices};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  const previousRender=window.render;
  if(typeof previousRender==='function'&&!previousRender.__studioConversations) {
    const wrapped=function(...args){const result=previousRender.apply(this,args);if($('#page-interactions')?.classList.contains('active'))render();return result};
    wrapped.__studioConversations=true;window.render=wrapped;
  }
})();