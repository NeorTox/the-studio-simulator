# THE STUDIO — Global simulation and interface requirements

Status: Product requirements for the next UI and simulation migration
Date: 20 November 2026
Branch: `ui/full-native-game-interface-rebuild`

## Product direction

THE STUDIO must present a believable, persistent global entertainment-industry simulation. The interface is not an administrative dashboard skin. It is the player's operating environment for a living world, their character's life, and a growing entertainment company.

The visual direction is a premium, information-rich management simulation: credible professional data presentation, strong editorial hierarchy, immersive place and character dossiers, and context-sensitive controls. It must work as a deliberately designed desktop experience and a deliberately designed mobile experience.

These requirements extend the first shell migration. They do not authorize replacing working simulation engines with mock data or breaking campaign persistence.

## 1. Information design and visual system

Every major workspace receives a bespoke information architecture rather than the same generic page template.

### Shared interface principles
- Persistent campaign context: date, local time, current location, company, available funds, alerts and simulation speed where relevant.
- Clear hierarchy: workspace, selected object, current section, status, primary action and supporting information.
- Consistent navigation with search, breadcrumbs, contextual back behaviour, keyboard support on desktop, and touch-first controls on mobile.
- Distinct object dossiers for people, companies, productions, locations, contracts, events, airports and other important entities.
- Contextual actions must call real engine functions. Do not add decorative controls that imply unavailable functionality.
- Settings are a real, searchable, categorized settings experience. Each setting must show its current value, explanation, scope, and consequences where applicable.
- Every menu, dialog, dropdown, table, chart, filter, notification and empty state must follow the same design system and accessibility rules.
- No horizontal overflow at supported mobile widths. Touch targets, safe areas, focus states, loading states and error states are part of acceptance criteria.

### Data visualization
Use charts wherever time-series, comparisons, distributions, flows or relationships make the information easier to understand. Candidate domains include:
- Finance: cash, revenue, expenses, profit/loss, debt, budgets, forecasts, cash runway and valuation.
- Company: market share, company performance, reputation, workforce, capacity and business units.
- Productions: budgets, spend curves, schedules, completion, delays, audience forecasts and release performance.
- Media and market: genre trends, audience demographics, demand, sentiment, ratings, distribution reach and competitor comparisons.
- People: career progression, compensation, performance, workload, relationships and reputation.
- World: regional economic indicators, population, market opportunity, risk and event impacts.
- Technology and research: investment, progress, capability, adoption and research outcomes.

Charts must use live values from the simulation, with units, date ranges, legends, meaningful scales, accessible labels and drill-downs. Do not fabricate sample values in production screens. A chart without meaningful data should explain why data is unavailable.

## 2. World atlas and travel experience

The world map is a first-class game workspace, not a decorative background.

### Map experience
- Interactive global map with pan, zoom, selection and clear geographic context.
- Selectable countries, administrative regions, cities and airports, based on the actual geography registry.
- Location detail panel with local date/time, population and relevant economic, cultural, industry and travel information when the simulation provides it.
- Layers for airports, airline routes, cities, company offices, production locations, events and relevant regional indicators.
- Route overlays, selected-location highlighting, map search, filters, map legend and return-to-current-location action.
- Responsive touch gestures and a usable compact mobile map control layout.
- Map rendering must be performant: load visible/nearby detail progressively, cluster dense markers, and avoid loading every object at once.

### Airport-to-destination journey
1. The player opens Travel and sees their current location and the appropriate nearby airport options.
2. Selecting an airport opens a dedicated airport view with departures, arrivals, services and available transport.
3. The player opens the global route map and selects a destination city or airport.
4. The route planner queries the real travel engine and displays available itineraries.
5. Each itinerary shows airline/operator, flight numbers when available, departure and arrival local times, total duration, direct or connecting status, each layover airport and layover duration, fare/class, baggage or other applicable conditions, and entry requirements.
6. The player compares options, selects an itinerary and confirms the booking.
7. The simulation processes departure, transit, layovers, arrival and location changes. The interface reports disruptions and required decisions.
8. The player can inspect a trip itinerary and travel history after booking.

### Travel rules
- Never invent a flight, schedule, airline, fare or connection. Show only data supported by the travel engine or explicitly labelled generated simulation data.
- Respect passport validity, nationality, visas/entry permits, border rules and travel restrictions implemented by the simulation.
- Handle time zones and local dates correctly. Show local times with timezone context.
- Direct and connecting itineraries must be distinguishable. A connection is a sequence of legs, not a single opaque trip.
- Travel can be expanded over time to include capacity, airline reliability, cancellations, missed connections, weather disruption and dynamic fares. These features must be implemented in the simulation before being shown as active functionality.
- The player must be able to inspect route details before spending money or advancing time.

### Existing foundation to preserve
The existing Phase 1 geography/travel QA already checks a registry exceeding 240 countries, more than 5,000 administrative divisions, airport-enabled cities across 90+ countries, location hierarchy, domestic rail, international entry permits, passport expiry/renewal, travel booking and daily arrival processing. Build the UI against these real contracts. Extend the engine only where a clearly identified capability is missing.

## 3. Procedural population and NPC simulation

The world must not require a handcrafted record or a loaded 3D model for every person. Use deterministic procedural generation, persistent identity, aggregated population simulation and progressive detail.

### Stable identity and generation
- Every generated person receives a stable unique identifier and deterministic generation seed.
- The seed and versioned generation rules reproduce core attributes consistently.
- Store durable changes and meaningful history separately from regeneratable baseline attributes.
- Generation must be bounded, testable, versioned and capable of migration when generation rules evolve.
- Avoid generating sensitive personal attributes or treating real-world demographic stereotypes as deterministic personality rules.

### NPC data layers
1. **Population aggregates:** counts and distributions by region, age band, occupation, income band and other permitted simulation dimensions. Used for broad economic and social calculations.
2. **Regional agents:** sampled or representative agents used for employment, household, consumer demand, cultural and regional event simulation.
3. **Individual agents:** persistent identity, occupation, household, goals and relationships for people who can affect the player's world.
4. **Important characters:** detailed personality, long-term memory, schedules, career history, relationships, contracts and consequential decision-making.
5. **Active/visible characters:** temporary high-detail appearance, animation and interaction state, loaded only when near or relevant to the player.

Not every member of the population is an individually ticking agent. Aggregate and event-driven simulation must represent the background population without pretending that millions of detailed agents are running every frame.

### Procedural character attributes
- Identity: generated name, age, birthplace, nationality and languages, subject to the world-generation model.
- Appearance: reproducible facial structure, hair, clothing, body proportions and style parameters.
- Background: education, occupation, skills, household, income, career and life history.
- Personality: multi-dimensional traits such as sociability, ambition, confidence, patience, conscientiousness, risk tolerance and conflict response.
- Preferences and quirks: interests, routines, habits, tastes, communication style and dislikes.
- Goals and needs: career, financial, family, social and personal objectives.
- Relationships: family, friends, colleagues, rivals, professional contacts and social ties.
- Memory: selected meaningful interactions and events, not an unbounded transcript.
- Behaviour: decisions must depend on traits, goals, resources, relationships, knowledge, current circumstances and prior outcomes.

### Behaviour and persistence
- Use a deterministic decision framework with bounded action choices and explicit preconditions, costs and consequences.
- Important NPCs can have schedules, but schedules should be event-driven and summarized between relevant moments.
- NPCs react to meaningful world events: releases, scandals, layoffs, awards, disasters, economic shocks, company decisions and personal events.
- Relationships and opinions evolve from observed events and direct interactions, with uncertainty and incomplete information.
- The same NPC must remain recognizably the same person when revisited, even if their detailed appearance was unloaded.
- Persist only necessary state changes, important memories, relationships and history. Regenerate stable baseline attributes from the identity seed.

### Performance and streaming
- Never instantiate the full world population as active objects.
- Use region/cell-based spatial indexing, visibility and relevance streaming, clustering, pooling and level-of-detail.
- Update agents at different frequencies based on importance, proximity and event relevance.
- Use aggregate statistical updates for background populations and individual simulation for consequential characters.
- Keep expensive generation and appearance construction off critical interaction paths; cache active character representations.
- Support deterministic replay and debugging from seeds, simulation date and event history.
- Define explicit budgets for active agents, memory, CPU time and rendering; measure them in stress tests rather than guessing.

## 4. Screen migration order

The shell is only the navigation foundation. Migrate complete workspaces in vertical slices, each including real data, visual design, interaction, responsive behaviour and browser tests.

Recommended sequence:
1. World atlas, location dossier and travel/airport/itinerary flow.
2. Command centre with campaign pulse, alerts, calendar, decisions and high-value charts.
3. Company and finance workspaces with linked dashboards and object details.
4. Production/project workspaces with schedules, budgets, milestones and release lifecycle.
5. People and talent with employee/NPC dossiers, relationships and contracts.
6. Market, media, distribution and competitor workspaces.
7. Life, household, events, settings and remaining specialist systems.

Each slice must preserve existing engine contracts and save compatibility. The implementation should replace the actual screen experience, not merely add a navigation shell or CSS skin.

## 5. Acceptance criteria

A workspace is not complete because its route opens. It is complete only when:
- It has a bespoke, coherent information architecture and polished visual hierarchy.
- Its displayed information is bound to actual simulation state.
- Every visible action performs the advertised operation or is clearly marked unavailable.
- Desktop, mobile portrait and mobile landscape are intentionally designed and tested.
- Loading, empty, error, disabled, confirmation and success states are implemented.
- Keyboard, touch, focus, labels and contrast are usable.
- Browser tests cover meaningful player journeys and action outcomes, not just element existence.
- Existing engine regression tests and campaign save/load tests continue to pass.
- Performance is tested with realistic data volumes.

## 6. Non-negotiable constraints

- Do not replace real simulation values with static demo data.
- Do not silently remove existing game systems, route IDs, save keys or action handlers.
- Do not merge the UI rebuild while major screens remain legacy placeholders or regression is unverified.
- Do not depend on Vercel.
- Do not claim a fully simulated 100-million-person world by loading 100 million detailed NPCs. Use layered, deterministic, event-driven population simulation.
- Do not display flight schedules, routes, fares or operational features that the underlying engine cannot actually support.
