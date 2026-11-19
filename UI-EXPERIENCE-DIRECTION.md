# THE STUDIO — Experience direction and world-scale information architecture
Branch: ui/complete-interface-redesign
Product identity: persistent life simulation + world travel simulation + entertainment/business tycoon.
Status: design direction for the full interface redesign.

## 1. Product definition

THE STUDIO must not be presented as a film-company management game with a few life-simulation side panels. It is a persistent simulated life in which the player can live, travel, build relationships, work, own assets, establish companies, manage productions, invest, compete, and experience a changing world.

The interface must make these three experiences equally legible:

1. LIFE — the player's personal identity, time, wellbeing, money, relationships, household, family, career, reputation, memories and consequences.
2. WORLD — geography, countries, cities, travel, weather, public events, culture, mobility, infrastructure, hazards and the wider simulated society.
3. EMPIRE — company formation, employees, facilities, projects, production, rights, distribution, finance, markets, competitors, investment, technology and succession.

These are not isolated game modes. The same people, money, time, places, relationships and events connect them.

## 2. Core experience principles

### A. One persistent world
- One campaign timeline governs personal life, company operations, NPCs, travel, markets, weather and world events.
- The same date and location context should be visible wherever relevant.
- A player action should not appear in one workspace and disappear from another.
- Cross-system consequences should be linked to the affected person, project, company, place or asset.

### B. Player-first, not system-first
- The player should see meaningful situations and choices, not raw engine names.
- Developer diagnostics remain available in a clearly separated Advanced / Diagnostics area.
- Do not expose every simulation subsystem in the primary navigation.
- Complexity should be progressively disclosed: summary → decision → dossier → full records.

### C. Editorial clarity
- Narrative reports, personal messages, news, event briefings and decisions should read like a living world.
- Numbers must carry units, currency, date, period and source context.
- Simulation indexes must be identified as indexes, not real-world measurements.
- Fictional media outlets and simulated events must never be mistaken for current real-world information.

### D. Spatial context where it matters
- Use geographic maps for travel, location discovery, global operations and regional events.
- Use facility/campus 3D only for spatial inspection and atmosphere, never as the only way to access operational controls.
- A list/table equivalent must exist for map-heavy content.
- 3D and maps must not delay initial application loading.

### E. Consistent interaction grammar
- Every entity type has a reusable profile/dossier pattern.
- Every consequential action has a clear preview, confirmation where appropriate, result and history record.
- Every alert links to the record or workspace where it can be resolved.
- Filters, sorting, selected entity and scroll context persist when the player returns.

## 3. Primary navigation model

The proposed player-facing primary navigation is grouped by the player's mental model, not by internal engine phase.

### HOME
- Overview — daily briefing, decision queue, company pulse, life pulse and world pulse.
- Inbox — situations, messages, offers, deadlines, requests and pending decisions.
- Calendar — personal, social, travel, company and production schedule in one timeline.
- Journal — chronological personal and campaign history, with filters.

### LIFE
- My Life — identity, personal profile, health/wellbeing model, skills, ambitions and reputation.
- Relationships — family, friends, colleagues, partners, social groups and relationship history.
- Household — residence, household members, recurring costs, possessions and domestic activity.
- Career — personal career history, employment, education and professional opportunities.
- Personal Finances — personal cash, income, expenses, assets, liabilities and investments.

Only expose sections for which real source data and actions exist. Do not invent health, romance or household mechanics that are only planned.

### WORLD
- World Map — countries, administrative regions, cities, regions and points of interest.
- Travel — journeys, routes, transport, bookings, accommodation, passports and travel history.
- Places — city and location dossiers, local conditions and available services.
- World Events — weather, seasons, hazards, public safety, political/economic events and disruptions.
- Society — population, households, communities, labour and social conditions.

### STUDIO
- Studio Overview — identity, departments, leadership, divisions and current operating state.
- Productions — development, pre-production, photography, post, delivery and release.
- People & Talent — employees, executives, crew, performers, auditions and contracts.
- Facilities — offices, stages, equipment, properties, maintenance and capacity.
- IP & Rights — owned intellectual property, licences, contracts, windows and royalties.
- Distribution — theatrical, streaming, broadcast, licensing and settlements.
- Media & Publicity — coverage, public relations, campaigns and audience response.

### EMPIRE
- Finance — company accounts, journal, statements, cash flow, invoices and reconciliation.
- Treasury & Investments — FX, securities, portfolio, funds, equity and debt.
- Market Intelligence — macroeconomy, genre demand, industry conditions and stock exchange.
- Competitors — rival studios, acquisitions, autonomous operations and market position.
- Technology & Research — technology tree, research labs, scientists, patents and licensing.
- Sustainability — energy, emissions, resource efficiency and investment programmes.
- Governance & Legal — board, ownership, compliance, legal cases, insurance and risk.
- Legacy & Succession — family lineage, estate, inheritance, leadership succession and generational continuity.

### ADVANCED
- Simulation Systems
- Population & NPC Intelligence
- Algorithms & Calibration
- Architecture & Dependency Graph
- Integration Health
- Release Quality
- Autonomy Audit
- Integrity / Save Diagnostics
- Sandbox Console

Advanced is not a dumping ground: each tool still receives the same design quality, but it is visually separated from normal player workflows.

## 4. Universal entity dossier system

Build a consistent dossier layout for:
- Player/founder
- NPC/person
- Household/family
- Company/subsidiary
- Employee/executive/talent
- Production/project
- IP/rights asset
- Facility/property
- Country/region/city/place
- Travel itinerary/booking
- Media organization
- Competitor
- Investment/security
- Technology/patent
- Legal case/insurance policy
- Event/situation

A dossier may include:
1. Identity and current status.
2. Overview and key facts.
3. Relationships / ownership / affiliations.
4. Timeline and history.
5. Finances and commitments where applicable.
6. Location and travel context where applicable.
7. Decisions, actions and consequences.
8. Related entities.

Do not show irrelevant empty tabs. Dossiers must adapt to the actual entity type and available data.

## 5. Cross-system interaction examples

The UI should make existing data connections visible, without inventing mechanics:
- A work trip opens the travel itinerary, destination city, related project, expenses and calendar events.
- A production shoot opens the project, call sheet, cast/crew, facility/location, weather and cost commitments.
- Hiring an NPC links the person dossier, labour market, department, payroll and relationship network where supported.
- A company acquisition links the target competitor, valuation, funding, governance approval, legal obligations and post-acquisition operations where supported.
- A family succession event links the founder, family tree, estate, ownership and company leadership.
- A severe weather event links the affected region, facilities, travel plans, production schedule and operational decisions where the engines expose those dependencies.

If a link is not yet implemented in the simulation, mark it as unavailable/planned; do not create a fake interaction.

## 6. Visual language

The design should feel like a premium simulation platform with editorial depth:
- Deep graphite / ink surfaces, not pure-black everywhere.
- Warm muted metal accent for identity and high-value emphasis.
- Cool neutrals for operational data.
- Restrained semantic colours for positive, warning, critical and informational states.
- Strong typographic hierarchy and generous but efficient spacing.
- Dense information where professional users need it; calm summaries for first-glance decisions.
- Tabular numerals for finance and time.
- Distinct visual voices for personal diary, world dispatch, corporate report and production dossier while retaining the same component system.

Avoid:
- Generic SaaS dashboard cards everywhere.
- Neon gamer UI, excessive gradients, glassmorphism and glowing borders.
- Oversized decorative 3D scenes that hide important controls.
- Overloaded left navigation with every engine subpage.
- Charts without units, date ranges, source or explanation.
- Fake live-world data and fabricated trends.

## 7. Screen families and design patterns

| Family | Main interaction pattern | Visual treatment |
|---|---|---|
| Overview | briefing, prioritized queue, compact summaries | editorial command centre |
| Life / personal | profile, timeline, relationship network, diary | warm, human, narrative |
| Relationship / NPC | dossier, history, network and decisions | character-centric, readable |
| World map | layers, filters, map/list split and place dossier | spatial and geographic |
| Travel planner | route, itinerary, booking and cost breakdown | journey timeline + map |
| Company | corporate profile, organization, ownership and departments | professional business dossier |
| Production | stage pipeline, project brief, schedule, cost and delivery | creative operations |
| Finance | statements, ledger, reconciliation, portfolio and cash flow | precise, tabular, analytical |
| Market | indices, charts, news, competitors and labour | research terminal |
| Decision | context, options, cost/risk and consequences | focused decision brief |
| Calendar | multi-layer agenda and timeline | temporal overview |
| Diagnostics | contracts, traces, audits and raw status | technical console |

## 8. Design quality standard

Every player-facing screen and advanced screen must pass:
- Clear page purpose in the first viewport.
- Deliberate hierarchy; no wall of identical cards.
- Real data with clear provenance, units and dates.
- Strong empty, loading, unavailable and error states.
- Useful sorting, filtering, search and drill-down where data volume warrants it.
- Responsive landscape layout and touch-sized controls.
- Keyboard navigation, focus visibility and accessible labels.
- Consistent confirmations and action feedback.
- No accidental data loss or hidden destructive actions.
- Visual regression screenshot review at desktop and handheld landscape sizes.

"Everything needs extremely good design" means every screen family gets a purpose-built composition, not just the same template with different headings.

## 9. Scope guardrails

- Keep the game text-first and data-rich.
- Maps and optional 3D add context; they do not replace records, reports or decisions.
- Preserve existing engine contracts and local save compatibility.
- Distinguish implemented, partial and planned systems.
- Do not imply real-world historical accuracy where the game currently uses scenario profiles.
- Do not alter simulation behavior during presentation-only work.
- Build incrementally behind a preview/feature flag and test each migration.

## 10. Implementation sequence

1. Finish route/renderer dependency map and classify player vs advanced routes.
2. Add isolated presentation registry and shell prototype without changing the live shell.
3. Build shared entity, decision, timeline, table and report primitives.
4. Build Overview as the visual benchmark.
5. Build Life and World workspaces, including travel/map interaction.
6. Build Studio and Empire workspaces.
7. Separate Advanced diagnostics and migrate them with the same design standard.
8. Add optional facility/campus 3D prototype after the 2D information architecture is stable.
9. Complete screenshot, accessibility, interaction, save, PWA and simulation regression gates before merging.

## 11. Definition of success

A player should be able to spend a whole campaign focused on personal life and travel, another focused on building a studio empire, or move naturally between both — without feeling that they have left the same world or opened a different application.
