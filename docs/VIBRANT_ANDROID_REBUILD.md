# THE STUDIO — Vibrant Android UI rebuild

## Locked product direction
- Platform: Android-first, native APK delivery, landscape-first.
- Visual personality: **Vibrant**.
- Information density: **Balanced**.
- Product identity: a living entertainment-industry world with a tactile smartphone interface, not a desktop dashboard compressed into a WebView.
- Preserve existing simulation engines, campaign saves, deterministic NPC behavior, and offline-first operation while replacing the presentation layer incrementally.

## Visual system
Use a deep ink foundation with expressive, differentiated accent families:
- Studio identity: electric coral / warm vermilion.
- World: teal / aqua.
- People: violet / lilac.
- Productions: cinematic amber / orange.
- Business: cobalt / sky blue.
- Positive, warning, and critical states remain semantic and consistent; never use color alone to communicate status.
- Use gradients and color fields as accents, not as a substitute for hierarchy. Avoid making every surface neon or every card equally loud.
- Balanced density means a clear primary story, a small set of key metrics, and drill-down for the rest. Advanced tables and detailed graphs remain available one level deeper.

## Information architecture
1. **Home** — daily briefing, next appointments, urgent decisions, cash runway, production pulse, continue campaign.
2. **World** — region map, places, weather, news, industry trends, events, travel.
3. **Studio** — slate, productions, talent, employees, facilities, operations.
4. **People** — encounters, contacts, profile timelines, messages, calls, meetings, family and relationships.
5. **Business** — cash flow, ledger, forecasts, market, legal, rights, investors, ownership and analytics.
6. **More** — campaign management, awards, calendar, settings, manual, accessibility and sandbox.

Map these destinations to existing page IDs and APIs. Do not create duplicate simulation state or placeholder destinations. Secondary functions should remain discoverable through contextual sub-navigation and search.

## Interaction rules
- One obvious primary action per screen; secondary actions are contextual.
- Minimum 44 CSS px touch targets where practical; no tiny desktop buttons.
- Every interactive chart supports range selection, tap-to-inspect values, clear units and an accessible text summary.
- Use bottom sheets/action sheets for short decisions; full screens for complex work.
- Motion confirms navigation, selection, arrival and state change; never blocks an action. Honor prefers-reduced-motion.
- Respect landscape safe areas, short-height devices, keyboard visibility, scroll containment and immersive Android system bars.
- Offline-first: core screens and assets are cached; no network dependency for core gameplay.

## Player agency and simulation integrity
The player is a participant in the simulated world, not its administrator.
- In standard campaigns, no arbitrary cash injection, balance editing, relationship assignment, instant reputation edits, direct stock-price edits, weather edits, or event/history rewriting.
- Every personal/company money movement is a typed, dated, sourced transaction with a destination and ledger record. Personal and corporate finances remain separate.
- Legitimate actions are gated by affordability, authority, eligibility, time, counterpart consent and world conditions.
- Other people and companies retain agency: offers can be rejected, relationships require mutual development, and negotiations can fail.
- World conditions (weather, market, public opinion, competitor actions and history) evolve through simulation, not player admin controls.
- Sandbox is a clearly separated mode with explicit settings and achievement restrictions. It must never leak into standard campaign controls.

## Delivery phases and gates

### Phase 0 — Baseline and architecture
- Inventory every page, action, event listener, CSS layer and script dependency.
- Capture current Android landscape screenshots and record target viewport dimensions.
- Map legacy page IDs to the six top-level destinations.
- Define component tokens and visual regression checkpoints.
- Keep the current branch isolated; no merge to main without explicit approval.

### Phase 1 — Vibrant design foundation
- Introduce a namespaced color/type/spacing/motion token layer.
- Apply differentiated accent families to navigation, cards, status, tabs and StudioOS apps.
- Establish focus, pressed, disabled, loading, empty and error states.
- Add reduced-motion and high-contrast behavior.
- Confirm existing forms, campaign creation and all legacy screens remain functional.

### Phase 2 — Android shell
- Replace the PC-style navigation with six persistent destinations and contextual secondary navigation.
- Rebuild the Home briefing as the default campaign landing screen.
- Rework app bar, campaign status, notifications, back behavior and overlays.
- Ensure touch navigation and scroll behavior work on the physical device.

### Phase 3 — Core hubs
- Rebuild World, Studio, People and Business as distinct visual spaces.
- Preserve access to every existing management function.
- Provide compact summaries with detailed drill-down views and meaningful charts.
- Avoid fake data and placeholder interactions.

### Phase 4 — People and life
- Make NPC identity and social graph canonical.
- Introduce encounters, introductions, follow-ups, social scenes and relationship timelines.
- Relationship labels emerge from history and mutual state; never provide an arbitrary "add relationship" action.
- Keep dialogue clearly identified as deterministic/procedural where applicable.

### Phase 5 — Visual assets and motion
- Create original launcher/adaptive icon and branded splash/boot sequence.
- Add optimized portraits, production key art, location art, app illustrations, sound and lightweight transitions.
- Keep the 60–100 MB target as an intentional quality budget, not artificial padding.
- Track APK download size separately from installed size.

### Phase 6 — Verification and release readiness
- Run syntax, module, integration, save migration and offline-cache checks.
- Test short landscape viewports, Android safe areas, text scaling, keyboard, navigation and reduced motion.
- Run a multi-year campaign regression and verify no arbitrary state mutation in standard mode.
- Build a fresh debug APK; verify artifact SHA, install and test on a physical Android device.
- Do not call the rebuild complete until device QA passes.

## Acceptance checklist
- [ ] Six top-level destinations are reachable in one tap.
- [ ] Every legacy page/action has a mapped destination.
- [ ] Balanced information density; detailed data remains discoverable.
- [ ] No horizontal clipping or inaccessible controls at the target landscape viewport.
- [ ] Charts are readable, interactive and truthful.
- [ ] Standard campaign blocks arbitrary money/state edits.
- [ ] Corporate and personal transactions are separated and auditable.
- [ ] NPCs retain independent agency.
- [ ] Reduced-motion and offline behavior work.
- [ ] Existing saves load without loss.
- [ ] Fresh APK installs and passes physical-device QA.
