# THE STUDIO — Android-first product redesign

## Product decision

THE STUDIO is an Android-first entertainment-industry life and business simulation. It is not a desktop management dashboard compressed into a phone viewport. Landscape is the primary play orientation, but every screen must be designed around touch, thumb reach, short sessions, readable hierarchy and device-safe areas.

The existing simulation engine, campaign data and deterministic NPC systems are valuable foundations. The presentation layer and player-facing relationship acquisition need a deliberate redesign rather than another round of desktop CSS overrides.

## 1. Mobile reference research

Use mobile titles as interaction references, not as templates to copy:

- **Game Dev Tycoon / Game Dev Story:** compact management loops, clear decision cards, legible business progression and approachable production decisions.
- **The Sims FreePlay:** relationships and life progression emerging through encounters, activities and recurring social contexts; strong character/home identity.
- **BitLife:** event-led decisions, consequences and fast readable narrative cards.
- **Pocket City 2:** layered city/world management presented through mobile-friendly actions and a strong sense of place.
- **Virtual Families 3:** long-running personal life, household continuity and generational progression.

Research notes and external reading:
- https://gamingroute.com/best-tycoon-games-mobile/
- https://unstore.io/discover/best-life-simulation-games-android/
- https://www.androidauthority.com/best-simulation-games-android-107609/
- https://vgtimes.com/top-and-the-best/169867-mobile-games-like-the-sims.html

Do not copy energy-gate monetization, manipulative timers or shallow idle mechanics. THE STUDIO's differentiator is a persistent, consequential entertainment-industry world.

## 2. New navigation and information architecture

Replace the current PC-style left rail and crowded header with a native-feeling landscape mobile shell:

1. **Home** — daily briefing, next appointments, urgent decisions, studio pulse and continue campaign.
2. **World** — map/places, industry news, weather, trends, events and travel.
3. **Studio** — productions, talent, employees, facilities and company operations.
4. **People** — contacts, relationships, messages, calls, meetings and personal life.
5. **Business** — finance, market, legal, rights, investors and analytics.
6. **More** — settings, saves, help, sandbox and advanced systems.

Use a persistent compact bottom/edge navigation appropriate to landscape, with a contextual top bar. Keep the navigation reachable and visually stable. Secondary pages use clear back navigation and consistent screen titles. Deep management views should use tabs, segmented filters, drill-down cards and bottom sheets rather than long desktop forms.

## 3. Screen design principles

- Design for the actual short landscape viewport first; adapt to portrait only where intentionally supported.
- Respect Android safe areas and system bars; immersive mode must not hide important controls or cause content to sit under cutouts.
- Use minimum comfortable touch targets, generous spacing, readable type and strong contrast.
- Keep one primary action per screen; secondary actions belong in contextual menus or detail views.
- Prefer progressive disclosure: summary first, details on tap, advanced analytics one level deeper.
- Make charts interactive and legible, with time ranges, labels, accessible values and tap-to-inspect data.
- Use character portraits, expressive status, relationship timelines, event cards and meaningful motion.
- Motion should communicate state changes, navigation, arrival, notifications and progression. Respect reduced-motion preferences and avoid animation that blocks play.
- Avoid permanently visible desktop-style metric strips, tiny all-caps controls and giant empty hero panels.

## 4. Relationship system: people are encountered, not created

Remove the player-facing **Add relationship** action. It currently creates an arbitrary name/age/type/status record directly in the founder relationship array, bypassing the world population, NPC identity, history, social graph and actual interaction. This feels like a cheat/debug form and must not be the normal gameplay path.

### Acquisition loop

1. **Encounter:** characters are introduced through hiring, auditions, productions, meetings, industry events, travel, mutual contacts, personal routines, news incidents and NPC-initiated approaches.
2. **Recognition:** an encountered NPC becomes a discoverable person with a persistent identity. The player may remember the encounter, exchange contact details, follow up or let the connection fade.
3. **Interaction:** dialogue choices, messages, calls, work decisions, invitations, shared experiences, support and conflict create relationship history.
4. **Development:** closeness, trust, respect, attraction, tension, familiarity and professional reputation evolve independently. A high score must not automatically mean friendship or romance.
5. **Milestones:** friendship, mentorship, rivalry, collaboration, dating, partnership, estrangement and reconciliation are earned through compatible history, mutual interest, age/eligibility rules and context.
6. **Maintenance:** relationships change with time, missed commitments, career events, life events, communication and NPC autonomy. NPCs can initiate contact and make their own decisions.
7. **Consequences:** personal connections can affect opportunities, loyalty, morale, conflicts, reputation, media exposure and family life—but must not become guaranteed bonuses.

### Data and system rules

- The NPC population is the source of truth for a person's identity. Never create a second free-floating person record for the same NPC.
- The social graph is the source of truth for interpersonal edges and their dimensions.
- Communications and meeting history provide evidence and memory, not a separate competing relationship system.
- The founder relationship list should be a derived/indexed view or a compatibility layer for legacy saves, not an unrestricted creation form.
- Existing legacy records must be migrated safely and remain visible.
- Relationship labels should be inferred from edge type plus history and thresholds, not selected by the player at creation.
- NPCs need personality, schedule, goals, boundaries, current context, existing ties and memory to shape responses.
- All social actions should be logged with date, participants, context, choice and outcome.
- Deterministic simulation is acceptable for the current engine; do not imply free-form AI conversation.

### UI

The People hub should show:
- Recent encounters and pending introductions.
- Contacts and relationship circles.
- NPC profile with portrait, occupation, goals, personality, history and known mutual contacts.
- Relationship timeline and separate trust/closeness/tension indicators.
- Conversation, call, invite and follow-up actions when contextually available.
- Clear unknowns: the player should not see hidden NPC information as omniscient facts.

There should be no generic button that directly assigns Friend, Spouse, Mentor or Romantic Partner.

## 5. Brand identity, launcher and boot sequence

The current launcher uses a generic striped SVG website mark. Replace it with a distinct THE STUDIO brand identity designed for Android adaptive icons, with foreground/background layers, safe masking and a monochrome-compatible silhouette.

The launch sequence should have:
- A native Android splash screen with the real launcher mark and a consistent dark/brass palette.
- A short branded animation (target roughly 700–1,000 ms; never hold the player on a decorative screen after the app is ready).
- A custom in-app transition only if needed to bridge native startup to the first fully rendered Home screen.
- No blank white/black flash, duplicated splash, website favicon, spinner-only screen or forced artificial delay.

Use Android's SplashScreen API and Capacitor-compatible asset generation. Android 12+ supports a native animated-vector splash icon; older versions need a graceful static fallback. Verify on a physical device and different launchers.

Official technical references:
- https://developer.android.com/develop/ui/views/launch/splash-screen
- https://developer.android.com/develop/ui/views/launch/splash-screen/migrate
- https://next.capacitorjs.com/docs/next/guides/splash-screens-and-icons
- https://capacitorjs.com/docs/android

## 6. Visual and animation system

Create a coherent design system rather than adding more overriding CSS patches:
- Design tokens for color, type, spacing, radius, elevation and motion.
- Reusable mobile components: navigation, app bar, cards, chips, segmented controls, charts, profile headers, timelines, action sheets, dialogs, toasts and empty states.
- One icon family and consistent illustration/portrait treatment.
- Motion primitives with documented durations/easing and reduced-motion behavior.
- Responsive layouts tested at the real device's CSS viewport and density.

Target personality: premium entertainment-industry command centre, with a warm editorial/brass accent and restrained cinematic atmosphere. The world should feel alive, not like a spreadsheet dashboard.

## 7. App size and asset budget

Target **60–100 MB installed/download footprint** as a quality budget, not a requirement to pad the APK. Add purposeful assets: optimized character portraits, location art, UI illustrations, sound design, short transition animations and optional music. Keep core app assets efficient.

Track separately:
- APK/AAB download size.
- Installed size after extraction.
- Native libraries and WebView/runtime overhead.
- Image/audio/video asset contribution.
- Debug vs release size.

Use WebP/AVIF where supported, vector drawables for scalable UI, compressed audio, sprite sheets or short lightweight animations where appropriate, and lazy-load optional content. Avoid bundling large video loops or duplicate assets. Reassess whether 60–100 MB refers to download size or installed size during release planning.

## 8. Delivery sequence and acceptance gates

### Phase A — Product and visual foundation
- Freeze new desktop-style UI additions.
- Inventory every current screen, action and data dependency.
- Produce mobile navigation map, screen wireframes and component tokens.
- Establish screenshot baselines on the target Android device.

### Phase B — Shell and identity
- New launcher/adaptive icon and branded splash.
- Native immersive launch behavior with safe-area handling.
- Replace desktop sidebar/header with the mobile shell.
- Rebuild Home, People, Studio and Business hubs.

### Phase C — Relationship redesign
- Remove the direct relationship-creation cheat form.
- Audit all encounter sources and social graph APIs.
- Make NPC identity/social graph canonical.
- Connect encounters, messages, meetings, work and life events to relationship progression.
- Migrate legacy relationship records and add regression tests.

### Phase D — Visual richness
- Character portraits, event art, motion, sound cues and richer charts.
- Loading, empty, error, success and offline states.
- Performance and memory profiling on mid-range Android devices.

### Phase E — Device QA and release
- Test clean install, upgrade, cold/warm/hot start, rotation lock, safe areas, navigation, back behavior, keyboard, dialogs, save persistence, notifications and long sessions.
- Test low-memory behavior and slow device startup.
- Build signed release APK/AAB only after QA; debug APK is not a production release.

### Acceptance criteria
- No desktop sidebar or desktop-first layout remains on the Android gameplay path.
- No permanently clipped content or inaccessible navigation.
- Every primary action is reachable by touch without precision tapping.
- Relationship records arise from encounters and interaction; no direct relationship assignment is exposed to normal play.
- The same NPC has one identity across world, contacts, social graph, meetings and history.
- Native app icon and branded launch sequence appear on real devices.
- Target size is measured and explained, not artificially padded.
- All major screens have device screenshots and regression checks before release.
