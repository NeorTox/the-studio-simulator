/* THE STUDIO — StudioOS social calendar and relationship scenes.
 * Meetings are campaign events. Outcomes update the existing NPC social graph and memory.
 * All invitation and scene dialogue is deterministic/procedural, not generative AI.
 */
(function () {
  'use strict';

  if (!window.StudioOS || !window.StudioPhoneCommunications) {
    console.warn('[StudioOS social] The phone or communications layer is unavailable.');
    return;
  }

  const VERSION = '1.0.0';
  const TASK = 'phone.social-meetings';
  const MAX_MEETINGS = 120;
  const MIN_DAYS_AHEAD = 1;
  const MAX_DAYS_AHEAD = 30;
  const STATUS = ['accepted', 'declined', 'awaiting-scene', 'completed', 'missed', 'cancelled'];

  const ACTIVITIES = {
    coffee: { label: 'Coffee catch-up', category: 'social', summary: 'A relaxed chance to reconnect.' },
    lunch: { label: 'Working lunch', category: 'professional', summary: 'Discuss work, projects and opportunities.' },
    studio: { label: 'Studio visit', category: 'professional', summary: 'Show them the studio and hear their perspective.' },
    dinner: { label: 'Dinner', category: 'social', summary: 'Spend time together away from work.' },
    celebration: { label: 'Celebrate a milestone', category: 'social', summary: 'Share a win and recognise their support.' },
    reconciliation: { label: 'Clear the air', category: 'repair', summary: 'Make space for an honest conversation.' }
  };

  const CHOICES = {
    everyday: [
      { id: 'listen', label: 'Listen and understand', action: 'support', valence: 0.58, importance: 0.62, result: 'You gave them room to speak and made the conversation feel more personal.' },
      { id: 'share', label: 'Share something personal', action: 'positive', valence: 0.36, importance: 0.5, result: 'You shared something about your own life and made the relationship more reciprocal.' },
      { id: 'career', label: 'Talk about work and ambitions', action: 'share-information', valence: 0.3, importance: 0.48, result: 'You exchanged ideas and learned more about each other’s ambitions.' },
      { id: 'next-time', label: 'Make plans to meet again', action: 'cooperate', valence: 0.4, importance: 0.45, result: 'You agreed to make time for each other again.' }
    ],
    professional: [
      { id: 'listen', label: 'Hear their perspective first', action: 'support', valence: 0.48, importance: 0.58, result: 'You listened carefully before discussing the business.' },
      { id: 'collaborate', label: 'Explore working together', action: 'cooperate', valence: 0.36, importance: 0.55, result: 'You explored a possible professional collaboration.' },
      { id: 'career', label: 'Discuss their career goals', action: 'share-information', valence: 0.44, importance: 0.55, result: 'You discussed their goals and how your professional paths might intersect.' },
      { id: 'keep-formal', label: 'Keep the conversation professional', action: 'share-information', valence: 0.12, importance: 0.3, result: 'You kept the meeting focused and professional.' }
    ],
    celebration: [
      { id: 'celebrate', label: 'Celebrate their contribution', action: 'support', valence: 0.72, importance: 0.7, result: 'You made a point of recognising their contribution.' },
      { id: 'share', label: 'Share the moment personally', action: 'positive', valence: 0.55, importance: 0.58, result: 'You shared the moment rather than treating it as just another business milestone.' },
      { id: 'next-time', label: 'Plan something together again', action: 'cooperate', valence: 0.42, importance: 0.46, result: 'You made plans to celebrate together again.' }
    ],
    reconciliation: [
      { id: 'apologise', label: 'Acknowledge your part and apologise', action: 'reconcile', valence: 0.72, importance: 0.78, result: 'You acknowledged your part and gave the relationship room to recover.' },
      { id: 'listen', label: 'Hear them out without interrupting', action: 'support', valence: 0.6, importance: 0.68, result: 'You listened to how the situation affected them.' },
      { id: 'explain', label: 'Explain your position calmly', action: 'share-information', valence: 0.18, importance: 0.46, result: 'You explained your perspective and kept the discussion measured.' },
      { id: 'defend', label: 'Refuse to back down', action: 'conflict', valence: -0.5, importance: 0.58, result: 'You held your ground, but the disagreement became more difficult to resolve.' }
    ]
  };

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
  const validDate = value => {
    const date = new Date(String(value) + 'T00:00:00Z');
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) &&
      Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === String(value);
  };
  const addDays = (date, days) => {
    const stamp = Date.parse(String(date) + 'T12:00:00Z');
    return Number.isFinite(stamp) ? new Date(stamp + Number(days) * 86400000).toISOString().slice(0, 10) : '';
  };
  const dateLabel = date => {
    if (!validDate(date)) return 'Date unavailable';
    return new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
  };
  const dateDay = date => validDate(date) ? String(new Date(date + 'T12:00:00Z').getUTCDate()).padStart(2, '0') : '—';
  const campaign = () => {
    try { return typeof active !== 'undefined' && active ? active : null; }
    catch (_) { return null; }
  };
  const phoneState = () => {
    try { return window.StudioOS.getState(); }
    catch (_) { return null; }
  };
  const persist = () => {
    try { if (typeof window.persist === 'function') window.persist(); }
    catch (error) { console.warn('[StudioOS social] Save request failed:', error); }
  };

  function ensureSocial(s) {
    const comms = window.StudioPhoneCommunications.ensureState(s);
    if (!comms) return null;
    if (!comms.social || typeof comms.social !== 'object' || Array.isArray(comms.social)) {
      comms.social = { version: VERSION, meetings: [], metrics: { invitations: 0, accepted: 0, declined: 0, completed: 0, missed: 0 } };
    }
    const social = comms.social;
    social.version = VERSION;
    social.meetings = Array.isArray(social.meetings) ? social.meetings : [];
    social.metrics = social.metrics || { invitations: 0, accepted: 0, declined: 0, completed: 0, missed: 0 };
    ['invitations', 'accepted', 'declined', 'completed', 'missed'].forEach(key => {
      social.metrics[key] = Math.max(0, Number(social.metrics[key]) || 0);
    });
    return social;
  }

  function contacts() {
    return window.StudioPhoneCommunications.getContacts();
  }

  function contactById(id) {
    return contacts().find(item => String(item.id) === String(id)) || null;
  }

  function alive(contact) {
    return !!(contact && contact.npc && contact.npc.alive !== false && contact.npc.status !== 'Deceased');
  }

  function edgeFor(id) {
    const api = window.StudioSocialNetwork;
    if (!api || typeof api.networkFor !== 'function') return null;
    try {
      const graph = api.networkFor('PLAYER');
      return graph && Array.isArray(graph.relationships)
        ? graph.relationships.find(edge => String(edge.otherNpcId) === String(id)) || null
        : null;
    } catch (_) { return null; }
  }

  function rapport(contact) {
    const edge = edgeFor(contact.id);
    const quality = clamp(contact.quality, 0, 100);
    return {
      closeness: clamp(edge ? edge.closeness : quality, 0, 100),
      trust: clamp(edge ? edge.trust : quality * 0.72, 0, 100),
      tension: clamp(edge ? edge.tension : 0, 0, 100),
      type: edge ? edge.type : String(contact.relationshipType || 'acquaintance')
    };
  }

  function relationshipLabel(score) {
    if (score >= 82) return 'Trusted';
    if (score >= 66) return 'Close';
    if (score >= 48) return 'Friendly';
    if (score >= 28) return 'Familiar';
    return 'Distant';
  }

  function invite(contactId, activityId, offsetDays) {
    const c = campaign();
    const s = phoneState();
    const social = ensureSocial(s);
    const contact = contactById(contactId);
    const activity = ACTIVITIES[String(activityId)];
    const offset = Math.floor(Number(offsetDays));
    if (!c || !s || !social) throw new Error('Create or load a campaign first.');
    if (!alive(contact)) throw new Error('That character is no longer available.');
    if (!activity) throw new Error('Choose a valid meeting type.');
    if (!Number.isInteger(offset) || offset < MIN_DAYS_AHEAD || offset > MAX_DAYS_AHEAD) {
      throw new Error('Choose a date between 1 and 30 in-game days from now.');
    }
    const scheduledDate = addDays(c.date, offset);
    if (!validDate(scheduledDate)) throw new Error('The campaign date is invalid.');
    if (social.meetings.some(item => String(item.contactId) === String(contactId) &&
        item.scheduledDate === scheduledDate && ['accepted', 'awaiting-scene'].includes(item.status))) {
      throw new Error('You already have a meeting planned with this person on that date.');
    }

    const state = rapport(contact);
    const stress = clamp(contact.npc.stress, 0, 100);
    const count = social.meetings.filter(item => String(item.contactId) === String(contactId)).length;
    const id = 'MEET-' + hash(c.id + '|' + contactId + '|' + scheduledDate + '|' + activityId + '|' + count).toString(16);
    const chance = clamp(
      0.32 + state.closeness * 0.004 + state.trust * 0.002 -
      state.tension * 0.003 - Math.max(0, stress - 45) * 0.0015,
      0.08, 0.92
    );
    const roll = hash(id + '|invitation') / 4294967296;
    const accepted = roll < chance;
    const reason = accepted
      ? (stress >= 70 ? 'They are busy, but are willing to make time.' : 'They are happy to make time for you.')
      : (stress >= 65 ? 'They have too much on their plate at the moment.' :
        state.tension >= 65 ? 'They would prefer a little more time before meeting.' :
        'Their schedule does not line up this time.');
    const meeting = {
      id,
      contactId: String(contactId),
      activity: String(activityId),
      activityLabel: activity.label,
      invitedDate: c.date,
      scheduledDate,
      status: accepted ? 'accepted' : 'declined',
      responseReason: reason,
      acceptanceProbability: Number(chance.toFixed(3)),
      resolvedAt: null,
      choiceId: null,
      outcome: null,
      relationshipAfter: null
    };
    social.meetings.unshift(meeting);
    if (social.meetings.length > MAX_MEETINGS) social.meetings.length = MAX_MEETINGS;
    social.metrics.invitations++;
    social.metrics[accepted ? 'accepted' : 'declined']++;
    persist();
    return meeting;
  }

  function choicesFor(meeting) {
    const activity = ACTIVITIES[meeting.activity];
    if (activity && activity.category === 'professional') return CHOICES.professional;
    if (meeting.activity === 'celebration') return CHOICES.celebration;
    if (meeting.activity === 'reconciliation') return CHOICES.reconciliation;
    return CHOICES.everyday;
  }

  function processMeetings(date) {
    const c = campaign();
    const s = phoneState();
    const social = ensureSocial(s);
    if (!c || !social || !validDate(date)) return { processed: 0, ready: 0, missed: 0 };
    let ready = 0, missed = 0;
    social.meetings.forEach(meeting => {
      if (meeting.status !== 'accepted' || meeting.scheduledDate > date) return;
      const contact = contactById(meeting.contactId);
      if (!alive(contact)) {
        meeting.status = 'missed';
        meeting.outcome = 'The meeting could not take place because the character was no longer available.';
        meeting.resolvedAt = date;
        social.metrics.missed++;
        missed++;
        return;
      }
      meeting.status = 'awaiting-scene';
      meeting.arrivedDate = meeting.scheduledDate;
      meeting.sceneOpenedAt = date;
      ready++;
    });
    if (ready || missed) persist();
    return { processed: ready + missed, ready, missed };
  }

  function resolveMeeting(meetingId, choiceId) {
    const c = campaign();
    const s = phoneState();
    const social = ensureSocial(s);
    const meeting = social && social.meetings.find(item => String(item.id) === String(meetingId));
    if (!c || !meeting || meeting.status !== 'awaiting-scene') throw new Error('This meeting is not waiting for a scene decision.');
    const contact = contactById(meeting.contactId);
    if (!alive(contact)) {
      meeting.status = 'missed';
      meeting.outcome = 'The meeting could not take place because the character is no longer available.';
      meeting.resolvedAt = c.date;
      social.metrics.missed++;
      persist();
      throw new Error('This character is no longer available.');
    }
    const choice = choicesFor(meeting).find(item => item.id === String(choiceId));
    if (!choice) throw new Error('Choose one of the available conversation approaches.');

    const api = window.StudioSocialNetwork;
    if (!api || typeof api.interact !== 'function') throw new Error('The shared relationship engine is unavailable.');
    const intensity = choice.action === 'conflict' ? 1.35 : 1.15;
    const result = api.interact('PLAYER', contact.id, choice.action, intensity, c.date);
    const edge = result && result.edge;
    const npc = contact.npc;
    npc.needs = npc.needs || {};
    npc.needs.social = clamp((npc.needs.social == null ? 50 : npc.needs.social) + (choice.valence < 0 ? -1 : 2), 0, 100);
    npc.stress = clamp(Number(npc.stress || 0) + (choice.valence < 0 ? 1.5 : -0.8), 0, 100);

    const memory = window.StudioNPCMemory;
    if (memory && typeof memory.recordMemory === 'function') {
      memory.recordMemory(contact.id, {
        date: c.date,
        content: 'Met with the founder for ' + meeting.activityLabel.toLowerCase() + '. ' + choice.result,
        type: 'relationship',
        importance: choice.importance,
        emotionalValence: choice.valence,
        emotionalIntensity: Math.min(1, Math.abs(choice.valence) + 0.18),
        people: ['PLAYER'],
        tags: ['social-meeting', meeting.activity, choice.id],
        outcome: choice.result.slice(0, 150),
        source: 'studioos-social-meeting'
      });
    }

    meeting.status = 'completed';
    meeting.choiceId = choice.id;
    meeting.resolvedAt = c.date;
    meeting.outcome = choice.result;
    meeting.relationshipAfter = edge ? {
      closeness: Number(edge.closeness.toFixed(1)),
      trust: Number(edge.trust.toFixed(1)),
      tension: Number(edge.tension.toFixed(1)),
      label: relationshipLabel(Number(edge.closeness || 0))
    } : null;
    social.metrics.completed++;
    persist();
    return { meeting, choice, relationship: meeting.relationshipAfter };
  }

  function renderScene(meeting, contact) {
    const options = choicesFor(meeting);
    const activity = ACTIVITIES[meeting.activity] || ACTIVITIES.coffee;
    return '<article class="stps-scene-card">' +
      '<div class="stps-kicker">MEETING READY · ' + esc(dateLabel(meeting.scheduledDate)) + '</div>' +
      '<h3>' + esc(meeting.activityLabel) + ' with ' + esc(contact.npc.name) + '</h3>' +
      '<p>' + esc(activity.summary) + '</p>' +
      '<div class="stps-choice-list">' + options.map(option =>
        '<button type="button" class="stps-choice" data-stph-action="social-resolve-meeting" data-id="' + esc(meeting.id) +
        '" data-choice="' + esc(option.id) + '"><b>' + esc(option.label) + '</b><small>' + esc(option.result) + '</small></button>'
      ).join('') + '</div><small class="stps-footnote">Your approach updates the shared relationship graph and this character’s episodic memory.</small>' +
      '</article>';
  }

  function renderContactCard(contact) {
    const state = rapport(contact);
    const aliveNow = alive(contact);
    const closeness = Math.round(state.closeness);
    const trust = Math.round(state.trust);
    return '<article class="stps-contact">' +
      '<div class="stps-avatar">' + esc(String(contact.npc.name || '?').slice(0, 1).toUpperCase()) + '</div>' +
      '<div class="stps-contact-body"><div class="stps-contact-head"><b>' + esc(contact.npc.name) + '</b><span>' + esc(relationshipLabel(state.closeness)) + '</span></div>' +
      '<small>' + esc(state.type) + ' · ' + esc(contact.npc.occupation || 'Occupation unknown') + '</small>' +
      '<div class="stps-meter-row"><span>Closeness</span><b>' + closeness + '</b></div><div class="stps-meter"><i style="width:' + closeness + '%"></i></div>' +
      '<div class="stps-meter-row"><span>Trust</span><b>' + trust + '</b></div><div class="stps-meter trust"><i style="width:' + trust + '%"></i></div>' +
      '<div class="stps-contact-footer"><small>' + (state.tension >= 60 ? 'Elevated tension · ' : '') + 'Stress ' + Math.round(clamp(contact.npc.stress, 0, 100)) + '</small>' +
      '<button type="button" class="stph-small-button" data-stph-action="char-view-contact" data-id="' + esc(contact.id) + '">Profile</button>' +
      '<button type="button" class="stph-small-button" data-stph-action="char-open-thread" data-id="' + esc(contact.id) + '" ' + (!aliveNow ? 'disabled' : '') + '>Message</button></div></div></article>';
  }

  function render(s) {
    const c = campaign();
    const social = ensureSocial(s);
    if (!c || !social) return '<div class="stps-empty">Create or load a campaign to manage your social calendar.</div>';

    processMeetings(c.date);
    const allContacts = contacts();
    const living = allContacts.filter(alive);
    const sorted = living.slice().sort((a, b) => rapport(b).closeness - rapport(a).closeness);
    const ready = social.meetings.filter(item => item.status === 'awaiting-scene');
    const planned = social.meetings.filter(item => item.status === 'accepted').sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    const recent = social.meetings.filter(item => ['completed', 'declined', 'missed', 'cancelled'].includes(item.status)).slice(0, 6);
    const nextOffsets = [1, 2, 3, 7, 14, 30];

    const form = living.length
      ? '<form class="stps-invite-form" data-stph-form="social-invite">' +
        '<label>Invite someone<select name="contactId" required>' +
        living.slice(0, 150).map(person => '<option value="' + esc(person.id) + '">' + esc(person.npc.name) + ' · ' + esc(person.relationshipType) + '</option>').join('') +
        '</select></label><label>Activity<select name="activity" required>' +
        Object.keys(ACTIVITIES).map(key => '<option value="' + key + '">' + esc(ACTIVITIES[key].label) + '</option>').join('') +
        '</select></label><label>When<select name="offsetDays" required>' +
        nextOffsets.map(days => '<option value="' + days + '">' + (days === 1 ? 'Tomorrow' : 'In ' + days + ' days') + ' · ' + esc(dateLabel(addDays(c.date, days))) + '</option>').join('') +
        '</select></label><button type="submit" class="stps-submit">Send invitation</button>' +
        '<small>Invitations are evaluated using the character’s current closeness, trust, tension and stress. A decline does not automatically damage the relationship.</small></form>'
      : '<div class="stps-empty">No living contacts are available yet. Add people through Contacts or meet characters in the world.</div>';

    return '<div class="stps-dashboard">' +
      '<section class="stps-hero"><div><span class="stps-kicker">STUDIOOS · SOCIAL LIFE</span><h2>Relationships & plans</h2><p>Arrange time with people in your world. Their responses reflect the relationship you have built.</p></div>' +
      '<div class="stps-hero-stats"><div><b>' + living.length + '</b><small>CONTACTS</small></div><div><b>' + planned.length + '</b><small>PLANNED</small></div><div><b>' + ready.length + '</b><small>READY</small></div></div></section>' +
      (ready.length ? '<section class="stps-section"><div class="stps-section-heading"><h3>Meetings waiting for you</h3><span>' + ready.length + ' SCENE' + (ready.length === 1 ? '' : 'S') + '</span></div>' +
        ready.map(meeting => { const person = contactById(meeting.contactId); return person ? renderScene(meeting, person) : ''; }).join('') + '</section>' : '') +
      '<section class="stps-section"><div class="stps-section-heading"><h3>Plan time together</h3><span>IN-GAME CALENDAR</span></div>' + form + '</section>' +
      '<section class="stps-section"><div class="stps-section-heading"><h3>Your people</h3><span>SHARED RELATIONSHIP GRAPH</span></div>' +
        (sorted.length ? '<div class="stps-contact-grid">' + sorted.slice(0, 10).map(renderContactCard).join('') + '</div>' : '<div class="stps-empty">No contacts are available.</div>') + '</section>' +
      '<section class="stps-section"><div class="stps-section-heading"><h3>Upcoming</h3><span>' + planned.length + ' ACCEPTED</span></div>' +
        (planned.length ? planned.slice(0, 10).map(meeting => { const person = contactById(meeting.contactId); return '<article class="stps-event-row"><div class="stps-event-date"><b>' + esc(dateDay(meeting.scheduledDate)) + '</b><small>' + esc(meeting.scheduledDate) + '</small></div><div><b>' + esc(meeting.activityLabel) + '</b><small>' + esc(person ? person.npc.name : 'Unknown contact') + ' · ' + esc(meeting.responseReason) + '</small></div><span class="stps-status accepted">ACCEPTED</span></article>'; }).join('') : '<div class="stps-empty">No accepted meetings scheduled. Send an invitation above to make a plan.</div>') +
      '</section>' +
      '<section class="stps-section"><div class="stps-section-heading"><h3>Recent history</h3><span>LAST 6</span></div>' +
        (recent.length ? recent.map(meeting => { const person = contactById(meeting.contactId); return '<article class="stps-event-row"><div class="stps-event-date"><b>' + esc(meeting.resolvedAt || meeting.scheduledDate) + '</b><small>' + esc(meeting.status.toUpperCase()) + '</small></div><div><b>' + esc(meeting.activityLabel) + '</b><small>' + esc(person ? person.npc.name : 'Unknown contact') + ' · ' + esc(meeting.outcome || meeting.responseReason || '') + '</small></div><span class="stps-status ' + esc(meeting.status) + '">' + esc(meeting.status.replace('-', ' ').toUpperCase()) + '</span></article>'; }).join('') : '<div class="stps-empty">Completed meetings and invitations will appear here.</div>') +
      '</section></div>';
  }

  function audit() {
    const s = phoneState();
    const social = ensureSocial(s);
    if (!social) return { passed: 0, failed: 1, tests: [{ name: 'Social calendar state exists', ok: false, detail: 'No active campaign.' }] };
    const tests = [];
    const add = (name, ok, detail) => tests.push({ name, ok: !!ok, detail: String(detail || '') });
    const meetings = social.meetings;
    const known = new Set(contacts().map(person => String(person.id)));
    add('Social calendar state version', social.version === VERSION, social.version);
    add('Meeting history is bounded', meetings.length <= MAX_MEETINGS, meetings.length + ' records');
    add('Unique meeting IDs', new Set(meetings.map(item => item.id)).size === meetings.length, meetings.length + ' IDs');
    add('Meeting contacts exist', meetings.every(item => known.has(String(item.contactId))), 'Every meeting references a materialized character');
    add('Meeting dates are valid', meetings.every(item => validDate(item.invitedDate) && validDate(item.scheduledDate) && (!item.resolvedAt || validDate(item.resolvedAt))), 'Invitation, scheduled and resolution dates checked');
    add('Meeting activities are valid', meetings.every(item => !!ACTIVITIES[item.activity]), Object.keys(ACTIVITIES).join(', '));
    add('Meeting statuses are valid', meetings.every(item => STATUS.includes(item.status)), STATUS.join(', '));
    add('Completed scenes have outcomes', meetings.filter(item => item.status === 'completed').every(item => !!item.choiceId && !!item.outcome), 'Resolved meetings retain their selected approach');
    add('Serialisable meeting history', (() => { try { JSON.stringify(social); return true; } catch (_) { return false; } })(), 'Social calendar data survives campaign JSON save');
    return { passed: tests.filter(item => item.ok).length, failed: tests.filter(item => !item.ok).length, tests };
  }

  function registerTask() {
    const autonomy = window.StudioAutonomy;
    if (!autonomy || registerTask.done) return false;
    try {
      autonomy.registerTask({
        id: TASK,
        name: 'StudioOS scheduled social meetings',
        cadenceDays: 1,
        priority: 50,
        deps: ['npc.social-networks', 'npc.memory-reputation'],
        run: ctx => processMeetings(ctx.date)
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

    try {
      window.StudioOS.registerApp({
        id: 'meetups',
        label: 'Meetups',
        glyph: '♡',
        tone: 'contacts',
        detail: 'Relationships and meetings',
        render
      });
    } catch (error) {
      if (!/already exists/i.test(String(error.message))) throw error;
    }

    window.StudioOS.registerSubmit('social-invite', ({ data, announce }) => {
      const meeting = invite(data.get('contactId'), data.get('activity'), data.get('offsetDays'));
      announce(meeting.status === 'accepted'
        ? 'Invitation accepted · ' + meeting.activityLabel + ' on ' + meeting.scheduledDate + '.'
        : 'Invitation declined · ' + meeting.responseReason);
    });

    window.StudioOS.registerAction('social-resolve-meeting', ({ button, id, announce }) => {
      const result = resolveMeeting(id, button.dataset.choice);
      announce('Meeting completed · ' + result.meeting.outcome);
    });

    if (window.StudioPhase0 && typeof window.StudioPhase0.registerModule === 'function') {
      try {
        window.StudioPhase0.registerModule({
          id: 'studioos-social-calendar',
          name: 'StudioOS social calendar and relationship scenes',
          deps: ['studioos-communications', 'npc-social-networks', 'npc-memory-reputation'],
          owns: ['social invitations', 'scheduled character meetings', 'choice-based relationship scenes', 'meeting memories and relationship progression'],
          status: 'implemented'
        });
      } catch (_) {}
    }

    const integration = window.StudioPhaseIntegration;
    if (integration && typeof integration.audit === 'function' && !integration.audit.__studioosSocialWrapped) {
      const previous = integration.audit;
      const wrapped = function () {
        const result = previous.call(this);
        const c = campaign();
        if (!c) {
          result.tests.push({ name: 'StudioOS social calendar integrity', ok: true, detail: 'Skipped because no campaign is active.' });
        } else {
          const check = audit();
          result.tests.push({ name: 'StudioOS social calendar integrity', ok: check.failed === 0, detail: check.passed + ' passed / ' + check.failed + ' failed' });
        }
        result.passed = result.tests.filter(test => test.ok).length;
        result.failed = result.tests.length - result.passed;
        return result;
      };
      wrapped.__studioosSocialWrapped = true;
      integration.audit = wrapped;
    }

    console.info('[StudioOS social] Social calendar mounted.');
  }

  window.StudioPhoneSocial = {
    version: VERSION,
    invite,
    processMeetings,
    resolveMeeting,
    choicesFor,
    audit,
    ensureSocial
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();
