/* THE STUDIO — StudioOS contacts, messaging and simulated calls.
 * Additive campaign data only. Uses the existing population, social graph and NPC memory APIs.
 * Replies are procedural and context-weighted; this is not a generative chat model or live audio.
 */
(function () {
  'use strict';

  if (!window.StudioOS) {
    console.warn('[StudioOS communications] Phone app extension host is unavailable.');
    return;
  }

  const VERSION = '1.0.0';
  const TASK = 'phone.npc-messages';
  const MAX_MESSAGES_PER_THREAD = 120;
  const MAX_THREADS = 100;
  const MAX_CALLS = 250;
  const MAX_AUTOMATIC_MESSAGES_PER_DAY = 3;

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, Number(value) || 0));
  const hash = value => {
    let result = 2166136261;
    for (const ch of String(value)) {
      result ^= ch.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  };
  const dateValid = value => {
    const date = new Date(String(value) + 'T00:00:00Z');
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) &&
      Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === String(value);
  };
  const daysBetween = (a, b) => {
    const start = Date.parse(String(a) + 'T00:00:00Z');
    const end = Date.parse(String(b) + 'T00:00:00Z');
    return Number.isFinite(start) && Number.isFinite(end)
      ? Math.max(0, Math.floor((end - start) / 86400000)) : 0;
  };
  const campaign = () => {
    try { return typeof active !== 'undefined' && active ? active : null; }
    catch (_) { return null; }
  };
  const persist = () => {
    try { if (typeof window.persist === 'function') window.persist(); }
    catch (error) { console.warn('[StudioOS communications] Save request failed:', error); }
  };

  function ensureState(s) {
    if (!s) return null;
    let comms = s.communications;
    if (!comms || typeof comms !== 'object' || Array.isArray(comms)) {
      comms = s.communications = {
        version: VERSION,
        threads: [],
        calls: [],
        selectedContactId: null,
        metrics: { messagesSent: 0, messagesReceived: 0, callsPlaced: 0, callsReceived: 0 }
      };
    }
    // Preserve campaign conversations if the communications schema version advances.
    comms.version = VERSION;
    comms.threads = Array.isArray(comms.threads) ? comms.threads : [];
    comms.calls = Array.isArray(comms.calls) ? comms.calls : [];
    comms.metrics = comms.metrics || { messagesSent: 0, messagesReceived: 0, callsPlaced: 0, callsReceived: 0 };
    ['messagesSent', 'messagesReceived', 'callsPlaced', 'callsReceived'].forEach(key => {
      comms.metrics[key] = Math.max(0, Number(comms.metrics[key]) || 0);
    });
    return comms;
  }

  function population(c) {
    return c && c.world && c.world.population && Array.isArray(c.world.population.npcs)
      ? c.world.population.npcs : [];
  }

  function npcById(id) {
    const c = campaign();
    return population(c).find(person => String(person.id) === String(id)) || null;
  }

  function founderRelations(c) {
    const list = c && c.founder && Array.isArray(c.founder.relationships)
      ? c.founder.relationships : [];
    return list;
  }

  function relationFor(npcId) {
    const c = campaign();
    return founderRelations(c).find(item => String(item.npcId || item.id || '') === String(npcId)) || null;
  }

  function socialNetwork() {
    return window.StudioSocialNetwork || null;
  }

  function socialEdge(npcId) {
    const api = socialNetwork();
    if (!api || typeof api.networkFor !== 'function') return null;
    try {
      const graph = api.networkFor('PLAYER');
      return graph && graph.relationships
        ? graph.relationships.find(edge => String(edge.otherNpcId) === String(npcId)) || null
        : null;
    } catch (_) { return null; }
  }

  function relationshipType(contact) {
    const type = String(contact.relationship && contact.relationship.type || contact.relationshipType || 'acquaintance').toLowerCase();
    if (type.includes('romantic') || type === 'spouse' || type === 'dating' || type === 'partner') return 'romantic';
    if (type.includes('family') || type === 'spouse') return 'family';
    if (type.includes('mentor')) return 'mentor';
    if (type.includes('business') || type.includes('professional') || type.includes('colleague')) return 'professional-contact';
    if (type.includes('friend')) return 'friend';
    return 'acquaintance';
  }

  function getContacts() {
    const c = campaign();
    if (!c) return [];
    const byId = new Map();
    const add = (npcId, relation, fallback) => {
      const key = String(npcId || '');
      if (!key) return;
      const person = npcById(key);
      if (!person) return;
      const old = byId.get(key);
      const record = relation || (old && old.relationship) || fallback || null;
      byId.set(key, {
        id: key,
        npc: person,
        relationship: record,
        relationshipType: record && record.type || (old && old.relationshipType) || fallback && fallback.type || 'Professional contact',
        quality: Number(record && record.quality != null ? record.quality : (old && old.quality != null ? old.quality : 42)),
        source: old ? old.source + ', ' + (fallback && fallback.source || 'social') : (fallback && fallback.source || 'personal')
      });
    };

    founderRelations(c).forEach(relation => {
      const npcId = relation.npcId || (/^NPC-/.test(String(relation.id || '')) ? relation.id : null);
      if (npcId) add(npcId, relation, { type: 'Known to founder', source: 'personal relationship' });
    });

    (c.employees || []).forEach(employee => {
      if (employee.npcId) add(employee.npcId, null, { type: 'Colleague', source: 'studio employee' });
    });

    const api = socialNetwork();
    if (api && typeof api.networkFor === 'function') {
      try {
        const graph = api.networkFor('PLAYER');
        (graph && graph.relationships || []).forEach(edge => {
          const person = npcById(edge.otherNpcId);
          if (person) add(person.id, null, { type: edge.type || 'Acquaintance', quality: edge.closeness, source: 'social network' });
        });
      } catch (error) {
        console.warn('[StudioOS communications] Social network lookup failed:', error);
      }
    }

    return Array.from(byId.values()).sort((a, b) => {
      const edgeA = socialEdge(a.id), edgeB = socialEdge(b.id);
      const scoreA = edgeA ? Number(edgeA.closeness || 0) : a.quality;
      const scoreB = edgeB ? Number(edgeB.closeness || 0) : b.quality;
      return scoreB - scoreA || String(a.npc.name).localeCompare(String(b.npc.name));
    });
  }

  function contactById(id) {
    return getContacts().find(contact => String(contact.id) === String(id)) || null;
  }

  function threadFor(s, npcId, create) {
    const comms = ensureState(s);
    if (!comms) return null;
    let thread = comms.threads.find(item => String(item.contactId) === String(npcId));
    if (!thread && create) {
      thread = {
        id: 'THREAD-' + hash(npcId + '|' + String(s.id || 'campaign')).toString(16),
        contactId: String(npcId),
        createdDate: campaign().date,
        updatedDate: campaign().date,
        lastMessageDate: null,
        messages: []
      };
      comms.threads.unshift(thread);
      if (comms.threads.length > MAX_THREADS) comms.threads.length = MAX_THREADS;
    }
    return thread || null;
  }

  function unreadInThread(thread) {
    return (thread.messages || []).filter(message => message.from !== 'PLAYER' && !message.read).length;
  }

  function unreadTotal(s) {
    const comms = ensureState(s);
    return comms ? comms.threads.reduce((sum, thread) => sum + unreadInThread(thread), 0) : 0;
  }

  function addMessage(s, thread, from, text, type, date) {
    const message = {
      id: 'MSG-' + hash(thread.id + '|' + date + '|' + thread.messages.length + '|' + from + '|' + text).toString(16),
      from: String(from),
      text: String(text).slice(0, 600),
      date,
      type: type || 'text',
      read: from === 'PLAYER'
    };
    thread.messages.push(message);
    if (thread.messages.length > MAX_MESSAGES_PER_THREAD) thread.messages.splice(0, thread.messages.length - MAX_MESSAGES_PER_THREAD);
    thread.updatedDate = date;
    thread.lastMessageDate = date;
    return message;
  }

  function ensureRelationshipEdge(contact) {
    const api = socialNetwork();
    if (!api) return socialEdge(contact.id);
    let edge = socialEdge(contact.id);
    if (edge) return edge;
    try {
      const quality = clamp(contact.quality, 0, 100);
      const result = api.createRelationship('PLAYER', contact.id, relationshipType(contact), {
        date: campaign().date,
        closeness: quality,
        trust: clamp(quality * 0.72, 0, 100)
      });
      return result && result.edge || socialEdge(contact.id);
    } catch (error) {
      console.warn('[StudioOS communications] Could not create social link:', error);
      return null;
    }
  }

  function classify(text) {
    const value = String(text || '').toLowerCase();
    if (/\b(sorry|apolog|support|help|tough|difficult|stress|worried|concerned|rough time)\b/.test(value)) return 'support';
    if (/\b(argument|angry|upset with|unfair|disappointed|betray|lie|furious|fight)\b/.test(value)) return 'conflict';
    if (/\b(meet|meeting|coffee|lunch|dinner|visit|catch up|hang out|come over)\b/.test(value)) return 'meeting';
    if (/\b(studio update|company update|announcement|release|premiere|launch|business)\b/.test(value)) return 'studio';
    if (/\b(film|project|production|script|budget|cast|crew|studio|work|job|career|office|deadline)\b/.test(value)) return 'work';
    if (/\b(family|home|health|life|personal|feeling|doing|how are you|weekend)\b/.test(value)) return 'personal';
    return 'general';
  }

  function rapport(contact) {
    const edge = socialEdge(contact.id);
    return {
      closeness: clamp(edge ? edge.closeness : contact.quality, 0, 100),
      trust: clamp(edge ? edge.trust : contact.quality * 0.72, 0, 100),
      tension: clamp(edge ? edge.tension : 0, 0, 100),
      type: edge ? edge.type : contact.relationshipType
    };
  }

  function responseText(contact, topic, seedText) {
    const person = contact.npc;
    const state = rapport(contact);
    const date = campaign().date;
    const selector = hash(person.id + '|' + date + '|' + seedText + '|' + topic + '|' + (threadFor(campaign().smartphone, person.id, false)?.messages.length || 0));
    const pick = items => items[selector % items.length];
    const personality = String(person.personality || person.secondaryTrait || '').toLowerCase();
    const reserved = /reserved|quiet|introvert|guarded|private|cautious/.test(personality);
    const outgoing = /outgoing|extrovert|sociable|friendly|optimistic|warm/.test(personality);
    const busy = Number(person.stress || 0) >= 70;
    let reply;

    if (topic === 'support') {
      reply = pick([
        'I appreciate you checking in. It helps to know someone noticed.',
        'Thank you. It has been a demanding stretch, so that means a lot.',
        'I may take you up on that. It is good to know I can talk to you.'
      ]);
    } else if (topic === 'conflict') {
      reply = state.trust >= 55 && state.tension < 65
        ? pick(['I hear you. I do not want this to turn into something bigger. Can we talk it through?', 'I understand why you are upset. Let us be clear with each other and work this out.'])
        : pick(['I need a little time to think about this before I respond properly.', 'I do not think we are seeing this the same way right now. Let us come back to it later.']);
    } else if (topic === 'meeting') {
      reply = state.closeness >= 48 && state.tension < 55
        ? pick(['I would like that. Send me a time and place and I will see what I can arrange.', 'That sounds good. It would be nice to catch up properly.'])
        : pick(['That could work. Let us plan it rather than rush into it.', 'I am open to the idea. We should find a time that suits both of us.']);
    } else if (topic === 'work') {
      if (person.status === 'Employed') {
        reply = 'Work has been keeping me busy at ' + String(person.employer || 'the studio') + '. ' +
          pick(['There is a lot to coordinate at the moment.', 'I am learning something new every week.', 'It has been a demanding but interesting period.']);
      } else {
        reply = 'I have been thinking about my next professional step. ' +
          pick(['I would like to find something where I can make a real contribution.', 'I am trying to decide which opportunity is worth pursuing.', 'I have a few ideas, but nothing is settled yet.']);
      }
    } else if (topic === 'studio') {
      reply = pick([
        'I have heard a little about the studio. It will be interesting to see what you build next.',
        'The industry never stands still. I hope the latest plans come together.',
        'There is always another opportunity around the corner. Keep me posted.'
      ]);
    } else if (topic === 'personal') {
      reply = busy
        ? pick(['It has been a full-on week, honestly. I am trying to find a little balance.', 'Quite a lot has been happening, but I am managing. Thanks for asking.'])
        : pick(['Things have been steady lately. I have been keeping busy and trying to make time for myself.', 'I have had a few things on my mind, but it is good to hear from you.', 'Not too bad. It is nice to have a moment to catch up.']);
    } else {
      reply = pick([
        'Good to hear from you. How are things moving on your side?',
        'I was just thinking I should catch up with you. What has been happening?',
        'Thanks for the message. It is good to stay in touch.'
      ]);
    }

    if (reserved && state.closeness < 38) reply += ' I am still getting to know you, but I appreciate the conversation.';
    else if (outgoing && state.closeness >= 45) reply += ' We should catch up properly soon.';
    if (person.goal && topic === 'personal') reply += ' I have also been focused on ' + String(person.goal).replace(/[.!?]+$/, '') + '.';
    return reply.slice(0, 580);
  }

  function incomingText(contact, topic, seedText) {
    const person = contact.npc;
    const state = rapport(contact);
    const selector = hash(person.id + '|' + campaign().date + '|' + seedText + '|incoming');
    const pick = items => items[selector % items.length];
    if (topic === 'work') {
      return person.status === 'Employed'
        ? pick([
          'Hey, quick update from work: it has been busy here at ' + String(person.employer || 'the studio') + '. How are things with you?',
          'I have had a lot on my plate professionally this week. How is the studio holding up?'
        ])
        : pick(['I have been thinking about my next career move. Have you heard of anything interesting lately?', 'How have things been at the studio? I have been exploring a few opportunities.']);
    }
    if (topic === 'studio') return pick(['I saw the latest studio activity and thought I would check in. How is everything progressing?', 'There is a lot happening in entertainment at the moment. What are you working on now?']);
    if (topic === 'support') return pick(['I wanted to check in and see how you are doing. You have had a lot going on.', 'Just a quick message to say I hope everything is all right on your side.']);
    if (state.closeness >= 65) return pick(['Hey, it has been a little while. How have you been?', 'I was thinking we should catch up. What have you been up to?']);
    return pick(['Hello. I thought I would check in and see how things are going.', 'Hope your week is going well. How have you been?']);
  }

  function recordNpcMemory(contact, text, topic, date, valence) {
    const memory = window.StudioNPCMemory;
    if (!memory || typeof memory.recordMemory !== 'function') return;
    try {
      memory.recordMemory(contact.id, {
        id: 'PHONE-MEM-' + hash(contact.id + '|' + date + '|' + text + '|' + topic).toString(16),
        date,
        type: 'conversation',
        content: text,
        importance: topic === 'conflict' || topic === 'support' ? 0.62 : 0.42,
        emotionalValence: valence,
        emotionalIntensity: topic === 'conflict' ? 0.55 : 0.28,
        people: ['PLAYER'],
        tags: ['phone', 'conversation', topic],
        source: 'studioos-messaging'
      });
    } catch (error) {
      console.warn('[StudioOS communications] NPC memory update failed:', error);
    }
  }

  function addNotification(s, contact, message) {
    s.notifications = Array.isArray(s.notifications) ? s.notifications : [];
    s.notifications.unshift({
      id: 'PHONE-NOTIF-' + hash(contact.id + '|' + message.id).toString(16),
      date: message.date,
      title: 'Message from ' + contact.npc.name,
      body: message.text.slice(0, 150),
      read: false,
      kind: 'message',
      contactId: contact.id
    });
    s.notifications = s.notifications.slice(0, 100);
  }

  function socialInteraction(contact, topic, direction) {
    const api = socialNetwork();
    if (!api) return null;
    try {
      ensureRelationshipEdge(contact);
      const action = topic === 'conflict' ? 'conflict' :
        topic === 'support' ? 'support' :
        topic === 'work' || topic === 'studio' ? 'share-information' : 'positive';
      const result = api.interact('PLAYER', contact.id, action, direction === 'incoming' ? 0.45 : 0.8, campaign().date);
      const record = relationFor(contact.id);
      if (record && result && result.edge) record.quality = result.edge.closeness;
      return result && result.edge || null;
    } catch (error) {
      console.warn('[StudioOS communications] Social interaction update failed:', error);
      return null;
    }
  }

  function sendMessage(npcId, text, options) {
    const s = window.StudioOS.getState();
    const comms = ensureState(s);
    const contact = contactById(npcId);
    const body = String(text || '').trim();
    if (!campaign() || !s || !comms) throw new Error('Create or load a campaign first.');
    if (!contact || contact.npc.alive === false || contact.npc.status === 'Deceased')
      throw new Error('This character is no longer available for a conversation.');
    if (!body || body.length > 500) throw new Error('Messages must contain 1–500 characters.');
    const date = campaign().date;
    const topic = classify(body);
    const thread = threadFor(s, contact.id, true);
    const outgoing = addMessage(s, thread, 'PLAYER', body, options && options.type || 'text', date);
    const edge = socialInteraction(contact, topic, 'outgoing');
    const reply = responseText(contact, topic, body);
    const incoming = addMessage(s, thread, contact.id, reply, 'text', date);
    comms.metrics.messagesSent++;
    comms.metrics.messagesReceived++;
    recordNpcMemory(contact, 'The founder sent: "' + body.slice(0, 220) + '" The character replied: "' + reply.slice(0, 220) + '"', topic, date,
      topic === 'conflict' ? -0.35 : topic === 'support' ? 0.55 : 0.18);
    addNotification(s, contact, incoming);
    comms.selectedContactId = contact.id;
    if (edge && relationFor(contact.id)) relationFor(contact.id).quality = edge.closeness;
    persist();
    return { thread, outgoing, incoming, topic };
  }

  function markRead(s, contactId) {
    const thread = threadFor(s, contactId, false);
    if (!thread) return;
    thread.messages.forEach(message => { if (message.from !== 'PLAYER') message.read = true; });
    (s.notifications || []).forEach(notification => {
      if (notification.kind === 'message' && String(notification.contactId) === String(contactId)) notification.read = true;
    });
    persist();
  }

  function startCall(npcId) {
    const s = window.StudioOS.getState();
    const comms = ensureState(s);
    const contact = contactById(npcId);
    if (!campaign() || !s || !comms) throw new Error('Create or load a campaign first.');
    if (!contact || contact.npc.alive === false || contact.npc.status === 'Deceased')
      throw new Error('This character is no longer available for a call.');
    const date = campaign().date;
    const selector = hash(contact.id + '|' + date + '|' + comms.metrics.callsPlaced + '|call');
    const duration = 1 + (selector % 7);
    const topic = 'personal';
    const transcript = responseText(contact, topic, 'call|' + selector);
    const thread = threadFor(s, contact.id, true);
    addMessage(s, thread, 'PLAYER', 'Started a phone call.', 'call', date);
    addMessage(s, thread, contact.id, transcript, 'call', date);
    const edge = socialInteraction(contact, 'personal', 'outgoing');
    const call = {
      id: 'CALL-' + selector.toString(16),
      contactId: contact.id,
      date,
      durationMinutes: duration,
      status: 'Completed',
      summary: transcript
    };
    comms.calls.unshift(call);
    if (comms.calls.length > MAX_CALLS) comms.calls.length = MAX_CALLS;
    comms.metrics.callsPlaced++;
    comms.metrics.callsReceived++;
    recordNpcMemory(contact, 'The founder called. The conversation lasted ' + duration + ' simulated minutes. ' + transcript, 'personal', date, 0.3);
    if (edge && relationFor(contact.id)) relationFor(contact.id).quality = edge.closeness;
    comms.selectedContactId = contact.id;
    persist();
    return call;
  }

  function renderContactProfile(s, contact) {
    const person = contact.npc;
    const edge = socialEdge(contact.id);
    const relation = rapport(contact);
    const memories = person.memory && Array.isArray(person.memory.memories)
      ? person.memory.memories.filter(item => item.people && item.people.includes('PLAYER')).slice(-3).reverse() : [];
    const alive = person.alive !== false && person.status !== 'Deceased';
    return '<div class="stpc-profile">' +
      '<div class="stpc-profile-hero"><div class="stpc-avatar large">' + esc(String(person.name || '?').slice(0, 1).toUpperCase()) + '</div><div><span class="stpc-overline">CHARACTER DOSSIER</span><h3>' + esc(person.name) + '</h3><p>' + esc(contact.relationshipType) + ' · ' + esc(person.occupation || 'Occupation unknown') + '</p></div><span class="stpc-status ' + (alive ? 'online' : 'offline') + '">' + (alive ? 'LIVING' : 'DECEASED') + '</span></div>' +
      '<div class="stpc-profile-stats"><div><small>AGE</small><b>' + Number(person.age || 0) + '</b></div><div><small>CLOSENESS</small><b>' + relation.closeness.toFixed(0) + '/100</b></div><div><small>TRUST</small><b>' + relation.trust.toFixed(0) + '/100</b></div><div><small>TENSION</small><b>' + relation.tension.toFixed(0) + '/100</b></div></div>' +
      '<div class="stpc-profile-grid"><div><span>Current status</span><b>' + esc(person.status || 'Unknown') + '</b></div><div><span>Employer</span><b>' + esc(person.employer || 'Independent') + '</b></div><div><span>Home</span><b>' + esc([person.city, person.region].filter(Boolean).join(', ') || 'Unknown') + '</b></div><div><span>Personal goal</span><b>' + esc(person.goal || 'Not recorded') + '</b></div><div><span>Personality</span><b>' + esc([person.personality, person.secondaryTrait].filter(Boolean).join(' · ') || 'Not recorded') + '</b></div><div><span>Professional reputation</span><b>' + Number(person.reputation && person.reputation.professional || 0).toFixed(0) + '/100</b></div></div>' +
      '<div class="stpc-memory-block"><span class="stpc-overline">REMEMBERED EXPERIENCES</span>' +
      (memories.length ? memories.map(item => '<div class="stpc-memory"><b>' + esc(item.date) + '</b><span>' + esc(item.content) + '</span></div>').join('') : '<p>No shared memories have been recorded yet. Start a conversation to build this history.</p>') + '</div>' +
      '<div class="stpc-actions">' +
      '<button type="button" class="stph-primary-button" data-stph-action="char-open-thread" data-id="' + esc(contact.id) + '" ' + (!alive ? 'disabled' : '') + '>Message</button>' +
      '<button type="button" class="stph-small-button" data-stph-action="char-call" data-id="' + esc(contact.id) + '" ' + (!alive ? 'disabled' : '') + '>Call</button>' +
      '<button type="button" class="stph-small-button" data-stph-action="char-back-contacts">All contacts</button></div>' +
      (edge ? '<p class="stpc-note">Relationship changes are stored in the shared NPC social graph. Conversations are also recorded in this character’s episodic memory.</p>' : '') +
      '</div>';
  }

  function renderContacts(s) {
    const comms = ensureState(s);
    const contacts = getContacts();
    const selected = comms && comms.selectedContactId ? contactById(comms.selectedContactId) : null;
    if (selected) return renderContactProfile(s, selected);
    const npcContacts = contacts.map(contact => {
      const relation = rapport(contact);
      const thread = threadFor(s, contact.id, false);
      const last = thread && thread.messages.length ? thread.messages[thread.messages.length - 1] : null;
      const unread = thread ? unreadInThread(thread) : 0;
      const alive = contact.npc.alive !== false && contact.npc.status !== 'Deceased';
      return '<article class="stpc-contact-card"><div class="stpc-avatar">' + esc(String(contact.npc.name || '?').slice(0, 1).toUpperCase()) + '</div><div class="stpc-contact-main"><b>' + esc(contact.npc.name) + '</b><small>' + esc(contact.relationshipType) + ' · ' + esc(contact.npc.occupation || 'Occupation unknown') + '</small><p>' + (last ? esc(last.text.slice(0, 85)) : esc(contact.npc.goal || 'No conversation yet')) + '</p><div class="stpc-contact-meta"><span>' + relation.closeness.toFixed(0) + ' closeness</span><span>' + relation.trust.toFixed(0) + ' trust</span>' + (unread ? '<i>' + unread + ' new</i>' : '') + '</div></div><div class="stpc-contact-actions"><button type="button" class="stph-small-button" data-stph-action="char-view-contact" data-id="' + esc(contact.id) + '">Profile</button><button type="button" class="stph-small-button" data-stph-action="char-open-thread" data-id="' + esc(contact.id) + '" ' + (!alive ? 'disabled' : '') + '>Message</button></div></article>';
    }).join('');
    const unlinked = founderRelations(campaign()).filter(item => !item.npcId && !/^NPC-/.test(String(item.id || '')));
    return '<div class="stpc-section-title"><b>People you know</b><span>' + contacts.length + ' CONNECTED CONTACTS</span></div>' +
      (contacts.length ? '<div class="stpc-contact-list">' + npcContacts + '</div>' : '<div class="stpc-empty"><span class="stpc-empty-icon">♙</span><h3>Your contacts list is ready</h3><p>Meet named people in the People Intelligence workspace. Once you know someone, their profile and conversation thread will appear here.</p><button type="button" class="stph-primary-button" data-stph-action="char-open-people">Open People Intelligence</button></div>') +
      (unlinked.length ? '<div class="stpc-unlinked"><span class="stpc-overline">PERSONAL RELATIONSHIP RECORDS</span>' + unlinked.map(item => '<div><b>' + esc(item.name) + '</b><span>' + esc(item.type || 'Personal contact') + ' · Profile record only; not linked to an autonomous NPC.</span></div>').join('') + '</div>' : '') +
      '<p class="stph-footnote">Contacts are drawn from the founder’s relationship register, the studio employee roster and the shared social network. Virtual regional residents are not exposed as named contacts until the simulation materializes them.</p>';
  }

  function renderVisibleSituations(contact) {
    const decisions = window.StudioNPCDecisionConsequences;
    if (!decisions || typeof decisions.observe !== 'function') return '';
    let visible = [];
    try {
      visible = decisions.observe(campaign().date).filter(item =>
        String(item.actorId) === String(contact.id) &&
        item.status === 'open' &&
        item.playerCanIntervene &&
        Array.isArray(item.responseOptions) &&
        item.responseOptions.length > 0
      );
    } catch (error) {
      console.warn('[StudioOS communications] Could not read visible NPC situations:', error);
      return '';
    }
    if (!visible.length) return '';
    return '<section class="stpc-situations"><div class="stpc-situation-heading"><span class="stpc-overline">WORLD SIMULATION · PLAYER INTERVENTION</span><b>' + visible.length + ' situation' + (visible.length === 1 ? '' : 's') + ' involving this character</b></div>' +
      visible.map(item => '<article class="stpc-situation-card"><div class="stpc-situation-meta">' + esc(item.type || 'Life event') + ' · ' + esc(item.date || '') + '</div><b>' + esc(item.title) + '</b><p>' + esc(item.description || '') + '</p><div class="stpc-response-list">' +
        item.responseOptions.map(option => '<button type="button" class="stph-small-button" data-stph-action="char-intervene" data-situation="' + esc(item.id) + '" data-id="' + esc(option.id) + '">' + esc(option.label) + '</button>').join('') +
      '</div><small>Choices may change the character’s needs and create delayed consequences in their life.</small></article>').join('') +
      '</section>';
  }

  function renderThread(s, contact) {
    const comms = ensureState(s);
    const thread = threadFor(s, contact.id, false) || threadFor(s, contact.id, true);
    markRead(s, contact.id);
    const messages = thread.messages || [];
    const relation = rapport(contact);
    const situationPanel = renderVisibleSituations(contact);
    const quickReplies = [
      ['work', 'Ask how work is going', 'How is work going lately?'],
      ['personal', 'Check in personally', 'I wanted to check in. How have you been?'],
      ['studio', 'Share a studio update', 'I have a studio update I wanted to share.'],
      ['meeting', 'Invite them to meet', 'Would you like to meet for coffee and catch up?'],
      ['support', 'Offer support', 'If anything is on your mind, I am happy to listen.']
    ];
    return '<div class="stpc-thread">' +
      '<div class="stpc-thread-person"><button type="button" class="stpc-back" data-stph-action="char-back-messages">‹</button><div class="stpc-avatar">' + esc(String(contact.npc.name).slice(0, 1).toUpperCase()) + '</div><div><b>' + esc(contact.npc.name) + '</b><small>' + esc(contact.relationshipType) + ' · Closeness ' + relation.closeness.toFixed(0) + '</small></div><button type="button" class="stpc-profile-link" data-stph-action="char-view-contact" data-id="' + esc(contact.id) + '">PROFILE</button></div>' +
      situationPanel +
      '<div class="stpc-thread-history">' +
      (messages.length ? messages.slice(-60).map(message => '<div class="stpc-message-row ' + (message.from === 'PLAYER' ? 'outgoing' : 'incoming') + '"><div class="stpc-bubble">' + esc(message.text) + (message.type === 'call' ? '<small>CALL TRANSCRIPT</small>' : message.type === 'decision' ? '<small>SIMULATION DECISION</small>' : '') + '</div><span>' + esc(message.date) + '</span></div>').join('') : '<div class="stpc-first-message"><b>Start a conversation with ' + esc(contact.npc.name) + '</b><p>Your message will update the shared relationship graph and the character’s episodic memory.</p></div>') +
      '</div>' +
      '<div class="stpc-quick-replies"><span>CONVERSATION STARTERS</span>' + quickReplies.map(item => '<button type="button" class="stph-small-button" data-stph-action="char-quick-reply" data-id="' + esc(contact.id) + '" data-text="' + esc(item[2]) + '">' + esc(item[1]) + '</button>').join('') + '</div>' +
      (contact.npc.alive === false || contact.npc.status === 'Deceased'
        ? '<div class="stpc-readonly">This character has died. Their profile and existing conversation history remain available as a read-only record.</div>'
        : '<form class="stpc-compose" data-stph-form="char-send-message" data-contact="' + esc(contact.id) + '"><input name="message" maxlength="500" minlength="1" required placeholder="Write a message…" autocomplete="off" aria-label="Write a message"><button type="submit" aria-label="Send message">➤</button></form>') +
      '<p class="stph-footnote">Replies are procedural, using character status, personality, relationship values and the message topic. They are not generated by a language model.</p>' +
      '</div>';
  }

  function renderMessages(s) {
    const comms = ensureState(s);
    const contacts = getContacts();
    const selected = comms && comms.selectedContactId ? contactById(comms.selectedContactId) : null;
    if (selected) return renderThread(s, selected);
    const threads = comms ? comms.threads.slice().sort((a, b) => String(b.updatedDate).localeCompare(String(a.updatedDate))) : [];
    const rows = threads.map(thread => {
      const contact = contactById(thread.contactId);
      if (!contact) return '';
      const last = thread.messages[thread.messages.length - 1];
      const unread = unreadInThread(thread);
      return '<button type="button" class="stpc-inbox-row" data-stph-action="char-open-thread" data-id="' + esc(contact.id) + '"><span class="stpc-avatar">' + esc(String(contact.npc.name).slice(0, 1).toUpperCase()) + '</span><span class="stpc-inbox-copy"><b>' + esc(contact.npc.name) + '</b><small>' + esc(last ? last.text : 'No messages') + '</small></span><span class="stpc-inbox-date">' + esc(thread.updatedDate) + (unread ? '<i>' + unread + '</i>' : '') + '</span></button>';
    }).join('');
    return '<div class="stpc-section-title"><b>Messages</b><span>' + unreadTotal(s) + ' UNREAD</span></div>' +
      (rows ? '<div class="stpc-inbox">' + rows + '</div>' : '<div class="stpc-empty"><span class="stpc-empty-icon">✉</span><h3>No conversations yet</h3><p>Start with someone you have met. Your conversations will be saved with this campaign.</p><button type="button" class="stph-primary-button" data-stph-action="char-open-contacts">Open contacts</button></div>') +
      '<p class="stph-footnote">Messages are in-game text conversations. NPC replies reflect procedural personality and relationship logic, not real-time online services.</p>';
  }

  function renderCalls(s) {
    const comms = ensureState(s);
    const contacts = getContacts();
    const callRows = (comms ? comms.calls : []).map(call => {
      const contact = contactById(call.contactId);
      return '<article class="stpc-call-row"><span class="stpc-call-icon">↗</span><div><b>' + esc(contact ? contact.npc.name : 'Former contact') + '</b><small>' + esc(call.date) + ' · ' + Number(call.durationMinutes || 0) + ' simulated minutes · ' + esc(call.status) + '</small><p>' + esc(call.summary || 'Conversation completed.') + '</p></div><span class="stpc-call-kind">OUTGOING</span></article>';
    }).join('');
    return '<div class="stpc-section-title"><b>Calls</b><span>' + (comms ? comms.calls.length : 0) + ' RECORDED CALLS</span></div>' +
      '<div class="stpc-call-start"><div><b>Start a call</b><p>Choose a character from your contacts. Calls are simulated and leave a transcript summary in Messages.</p></div><div class="stpc-call-contacts">' +
      (contacts.length ? contacts.map(contact => '<button type="button" class="stph-small-button" data-stph-action="char-call" data-id="' + esc(contact.id) + '" ' + (contact.npc.alive === false || contact.npc.status === 'Deceased' ? 'disabled' : '') + '>Call ' + esc(contact.npc.name) + '</button>').join('') : '<button type="button" class="stph-primary-button" data-stph-action="char-open-people">Meet people first</button>') +
      '</div></div>' + (callRows ? '<div class="stpc-call-list">' + callRows + '</div>' : '<div class="stpc-empty compact"><h3>No call history</h3><p>Your completed in-game calls will appear here.</p></div>') +
      '<p class="stph-footnote">This build records simulated call sessions; it does not play or transmit voice audio.</p>';
  }

  function actionOpenThread(contactId, openApp) {
    const s = window.StudioOS.getState();
    const comms = ensureState(s);
    if (!contactById(contactId)) throw new Error('Contact not found. Meet this character first.');
    comms.selectedContactId = String(contactId);
    markRead(s, contactId);
    openApp('messages');
  }

  function handleCall(contactId, announce, openApp) {
    const result = startCall(contactId);
    announce('Call completed · ' + result.durationMinutes + ' simulated minutes.');
    openApp('messages');
  }

  function handleAction(name, handler) {
    window.StudioOS.registerAction(name, handler);
  }

  window.StudioOS.registerApp({
    id: 'contacts', label: 'Contacts', glyph: '♙', tone: 'contacts', detail: 'Character profiles',
    render: renderContacts
  });
  window.StudioOS.registerApp({
    id: 'messages', label: 'Messages', glyph: '✉', tone: 'messages', detail: 'Character conversations',
    render: renderMessages
  });
  window.StudioOS.registerApp({
    id: 'calls', label: 'Calls', glyph: '☎', tone: 'calls', detail: 'Call history',
    render: renderCalls
  });

  handleAction('char-view-contact', ({ id, s, openApp }) => {
    const comms = ensureState(s);
    if (!contactById(id)) throw new Error('Contact not found.');
    comms.selectedContactId = String(id);
    persist();
    openApp('contacts');
  });
  handleAction('char-open-thread', ({ id, openApp }) => actionOpenThread(id, openApp));
  handleAction('char-back-messages', ({ s, openApp }) => {
    ensureState(s).selectedContactId = null;
    openApp('messages');
  });
  handleAction('char-open-contacts', ({ s, openApp }) => {
    ensureState(s).selectedContactId = null;
    openApp('contacts');
  });
  handleAction('char-back-contacts', ({ s, openApp }) => {
    ensureState(s).selectedContactId = null;
    openApp('contacts');
  });
  handleAction('char-open-people', ({ goHome }) => {
    goHome();
    if (typeof window.nav === 'function') window.nav('peopleintelligence');
  });
  handleAction('char-message', ({ id, openApp }) => actionOpenThread(id, openApp));
  handleAction('char-intervene', ({ button, announce, render }) => {
    const decisions = window.StudioNPCDecisionConsequences;
    if (!decisions || typeof decisions.intervene !== 'function') throw new Error('The NPC decision engine is unavailable.');
    const situationId = button.dataset.situation;
    const responseId = button.dataset.id;
    const situation = (decisions.observe(campaign().date) || []).find(item => item.id === situationId);
    const result = decisions.intervene(situationId, responseId);
    if (!result || !result.resolved) throw new Error('This situation is no longer open for intervention.');
    const s = window.StudioOS.getState();
    const contact = contactById(result.situation.actorId);
    if (contact) {
      const comms = ensureState(s);
      const thread = threadFor(s, contact.id, true);
      addMessage(s, thread, 'PLAYER', 'I chose to ' + String(result.situation.response.label || 'respond') + ' when this situation arose: ' + String(result.situation.title || 'an everyday event') + '.', 'decision', campaign().date);
      const option = (decisions.responseStyles || []).find(item => item.id === responseId);
      if (option) {
        const socialKind = option.goodwill < -0.2 ? 'conflict' : option.kind === 'support' ? 'support' : option.goodwill > 0.35 ? 'positive' : 'neutral';
        const edge = socialInteraction(contact, socialKind === 'neutral' ? 'personal' : socialKind, 'outgoing');
        if (edge && relationFor(contact.id)) relationFor(contact.id).quality = edge.closeness;
      }
      comms.selectedContactId = contact.id;
      persist();
    }
    const count = result.consequences ? result.consequences.length : 0;
    announce('Decision recorded · ' + count + ' delayed consequence' + (count === 1 ? '' : 's') + ' scheduled.');
    render();
  });
  handleAction('char-call', ({ id, announce, openApp }) => handleCall(id, announce, openApp));
  handleAction('char-quick-reply', ({ button, id, announce, render }) => {
    const result = sendMessage(id, button.dataset.text);
    announce('Message sent to ' + contactById(id).npc.name + '.');
    render();
  });

  window.StudioOS.registerSubmit('char-send-message', ({ form, data, announce, render }) => {
    const contactId = form.dataset.contact;
    sendMessage(contactId, data.get('message'));
    announce('Message sent.');
    render();
  });

  function automaticMessages(ctx) {
    const c = campaign();
    if (!c || !c.smartphone) return { processed: 0 };
    const s = c.smartphone, comms = ensureState(s);
    const contacts = getContacts();
    let sent = 0, checked = 0;
    for (const contact of contacts) {
      if (sent >= MAX_AUTOMATIC_MESSAGES_PER_DAY || checked >= 500) break;
      checked++;
      const person = contact.npc;
      if (person.alive === false || person.status === 'Deceased') continue;
      const edge = ensureRelationshipEdge(contact);
      const closeness = edge ? Number(edge.closeness || 0) : contact.quality;
      const tension = edge ? Number(edge.tension || 0) : 0;
      if (closeness < 32 || tension > 82) continue;
      const thread = threadFor(s, contact.id, false);
      const lastDate = thread && thread.lastMessageDate || (contact.relationship && contact.relationship.added) || contact.npc.createdDate || ctx.date;
      const gap = daysBetween(lastDate, ctx.date);
      if (gap < 4) continue;
      const socialNeed = Number(person.needs && person.needs.social || 50);
      const stress = Number(person.stress || 0);
      const chance = Math.min(.045, .002 + closeness * .00018 + Math.max(0, 48 - socialNeed) * .00035 + Math.max(0, stress - 65) * .00015);
      const roll = hash(c.id + '|' + contact.id + '|' + ctx.date + '|npc-message') / 4294967296;
      if (roll >= chance) continue;
      const topic = person.status === 'Employed' ? 'work' : (socialNeed < 38 ? 'personal' : 'studio');
      const messageText = incomingText(contact, topic, 'daily|' + ctx.date + '|' + gap);
      const activeThread = threadFor(s, contact.id, true);
      const message = addMessage(s, activeThread, contact.id, messageText, 'text', ctx.date);
      comms.metrics.messagesReceived++;
      addNotification(s, contact, message);
      socialInteraction(contact, topic, 'incoming');
      recordNpcMemory(contact, 'Sent the founder a message: "' + messageText + '"', topic, ctx.date, .22);
      sent++;
    }
    if (sent) persist();
    return { processed: checked, messages: sent, contacts: contacts.length };
  }

  function audit() {
    const s = window.StudioOS.getState();
    const comms = ensureState(s);
    if (!comms) return { passed: 0, failed: 1, tests: [{ name: 'Communication state exists', ok: false, detail: 'No active smartphone campaign.' }] };
    const tests = [];
    const add = (name, ok, detail) => tests.push({ name, ok: !!ok, detail: String(detail || '') });
    const ids = comms.threads.map(thread => thread.id);
    const messages = comms.threads.flatMap(thread => thread.messages || []);
    add('Communication state exists', !!comms, 'Version ' + VERSION);
    add('Unique message thread IDs', new Set(ids).size === ids.length, ids.length + ' threads');
    add('Unique retained message IDs', new Set(messages.map(message => message.id)).size === messages.length, messages.length + ' messages');
    add('Message threads are bounded', comms.threads.every(thread => thread.messages.length <= MAX_MESSAGES_PER_THREAD), 'Maximum ' + MAX_MESSAGES_PER_THREAD + ' messages per thread');
    add('Call history is bounded', comms.calls.length <= MAX_CALLS, comms.calls.length + ' calls');
    add('Message dates valid', messages.every(message => dateValid(message.date)), 'All message dates are ISO calendar dates');
    add('Call dates valid', comms.calls.every(call => dateValid(call.date)), 'All call dates are ISO calendar dates');
    add('Thread contacts are materialized', comms.threads.every(thread => !!npcById(thread.contactId)), 'No dangling thread references');
    add('Communication data is serializable', (() => { try { JSON.stringify(comms); return true; } catch (_) { return false; } })(), 'Communication data survives JSON save serialization');
    return { passed: tests.filter(test => test.ok).length, failed: tests.filter(test => !test.ok).length, tests };
  }

  function registerTask() {
    const autonomy = window.StudioAutonomy;
    if (!autonomy || registerTask.done) return false;
    try {
      autonomy.registerTask({
        id: TASK,
        name: 'NPC-initiated phone conversations',
        cadenceDays: 1,
        priority: 48,
        deps: ['npc.social-networks', 'npc.memory-reputation'],
        run: automaticMessages
      });
      registerTask.done = true;
      return true;
    } catch (error) {
      if (!/already registered/i.test(String(error.message))) throw error;
      registerTask.done = true;
      return true;
    }
  }

  function attach() {
    registerTask();
    if (!registerTask.done) document.addEventListener('DOMContentLoaded', registerTask);
    if (window.StudioPhase0 && typeof window.StudioPhase0.registerModule === 'function') {
      try {
        window.StudioPhase0.registerModule({
          id: 'studioos-communications',
          name: 'StudioOS contacts, messaging and simulated calls',
          deps: ['smartphone-media', 'npc-social-networks', 'npc-memory-reputation'],
          owns: ['founder contact directory', 'persistent message threads', 'NPC-initiated messages', 'simulated call history'],
          status: 'implemented'
        });
      } catch (_) {}
    }
  }

  window.StudioPhoneCommunications = {
    version: VERSION,
    ensureState,
    getContacts,
    sendMessage,
    startCall,
    unreadTotal,
    automaticMessages,
    audit,
    registerTask
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();