# THE STUDIO — Route and renderer dependency map
Branch: ui/complete-interface-redesign
Baseline: 516d63a9c308d05e1881fc0148ce94a5325c45e5
Purpose: record the current UI ownership boundaries before changing presentation code.

## 1. Navigation composition

The application begins with 18 directly authored navigation entries in the initial shell. Inline bootstrap code then adds additional base destinations, bringing the base navigation to 27 in the running application. Further engine scripts append their own routes. Therefore, do not treat a grep of the opening HTML shell as the complete runtime navigation inventory.

Base destinations (27):
overview, campaign, company, facilities, ip, legal, people, personal, talent, projects, finance, world, market, media, admin, awards, manual, calendar, distribution, digital, sustainability, governance, integrity, productionops, population, algorithms, time.

## 2. Base destination ownership

| Route | Current renderer / owner | Primary data surface | Notes for redesign |
|---|---|---|---|
| overview | index.html main render() | active campaign, company, events, cash, project and employee counts | Command-centre candidate; preserve quick advance, export and campaign actions |
| campaign | index.html render() + campaign form/save helpers | local saves, activeId, campaign envelope | Save/export/import must remain compatible |
| company | renderCompany() | active.company, divisions, capTable, subsidiaries | Very dense dossier; separate company profile from ownership and operating divisions |
| facilities | renderFacilities() | active.company.facilities and facility assets/costs | Candidate for optional 3D facility preview; core register stays tabular |
| ip | renderIP() | company IP assets, licences and revenue | Link every asset to project, rights, distribution and settlements |
| legal | renderLegal() | legalCases, insurancePolicies and exposure | Clearly label simplified fictional legal mechanics |
| people | renderPeople() | active.employees and payroll/contract data | Employee list and employee profile should become reusable entity patterns |
| personal | renderPersonal() plus inline renderLife() extension | founder assets, relationships, wellbeing and personal events | Keep founder cash and company accounts visually separate |
| talent | renderTalent() | talent roster, auditions and casting contracts | Link talent directly to projects and contract terms |
| projects | renderProjects(), renderProductionContracts() and Phase 5 production extensions | projects, budgets, production contracts, schedule and delivery state | The core creative workflow; do not collapse its stages into one generic status |
| finance | renderFinance(), renderAccounting(), renderInvoices(), renderFixedAssets(), renderLoans(), renderTax(), renderFX(), renderPortfolio(); Phase 8 adds institutional capital panel | ledger, accounting journal, invoices, assets, loans, tax, FX, portfolio and treasury | Must remain accurate and auditable; avoid decorative-only financial charts |
| world | renderWorld() plus Phase 1 world engine and world-risk extensions | era, world clock, regions, weather, scheduled events and hazards | Separate historical era summary from operational world conditions |
| market | renderMarket(), renderCompetitorOperations(), renderLaborMarket() and market extensions | macroeconomy, genre demand, equities, orders, competitors, labour | Use focused tabs and filters; this is a large analytical workspace |
| media | renderMedia() plus media ecosystem extensions | media outlets, coverage, campaigns, sentiment and media market | Distinguish fictional outlets/indexes from real-world anchors |
| admin | renderAdmin() | cheat status, achievements and cheat audit | Sandbox/cheat controls need prominent irreversible-state warnings |
| awards | renderAwards() | award catalog, submissions, results and eligibility | Link submissions to project dossiers and event calendar |
| manual | static page markup | explanatory help and system rules | Keep help content synchronized with actual clock and simulation behavior |
| calendar | renderCalendar() | scheduled events, upcoming items and activity history | One event model should be linked from projects, finance, awards and legal |
| distribution | renderDistribution() | agreements, rights windows and settlements | Inline bootstrap creates page and renderer; link back to IP and project records |
| digital | renderDigital() | platforms, subscribers, recurring revenue and digital services | Smartphone/social ecosystem is broader than this one platform page |
| sustainability | renderSustainability() and Phase 11 extensions | emissions, renewable share, efficiency, investments and history | Distinguish measured simulation values from targets and initiatives |
| governance | renderGovernance() | board, resolutions, cap table and compliance score | Decisions should expose voting context and financial consequences |
| integrity | renderAudit() and integration/release diagnostics | integration audit and runtime integrity | Advanced/developer surface; keep separate from player-facing business KPIs |
| productionops | renderOps() and Phase 5 production operations | call sheets, shoot operations, safety, continuity and delays | Daily operational workspace; link to project, facility, crew and weather |
| population | renderNPCs() and Phase 2 population engine | virtual population pool, named NPCs, households, families and events | Explicitly label aggregate population vs materialized named NPC records |
| algorithms | renderAlgorithms() and algorithm audit | algorithm registry, implemented/partial/missing status, audit results | Developer transparency; do not imply partial algorithms are complete |
| time | renderClock() and world clock engine | worldClock, date, accumulator, pause/running state and speed | Clarify the actual time model; see source inconsistency below |

## 3. Engine-created route inventory

| Runtime route | Source file | Current role | Redesign boundary |
|---|---|---|---|
| architecture | phase0-architecture.js | domain registry, dependency graph, campaign schema and migration diagnostics | Developer architecture view |
| worldengine | phase1-world-engine.js | world clock, regions, climate and scheduled world events | World simulation workspace; avoid duplicating base World page |
| peopleintelligence | phase2-population-engine.js | named NPC biographies, skills, needs, careers, family and relationships | People/NPC dossier workspace; avoid a duplicate people directory |
| ecosystem | phase6-ecosystem-engine.js | audience, fandom and entertainment ecosystem systems | Link to projects, market, media and distribution |
| integrationhealth | phase-integration-engine.js | phase contracts and integration health | Developer diagnostics |
| phone | phase7-smartphone-engine.js | Studio One smartphone shell | Player-facing digital-life device |
| competitors | phase10-autonomous-competitors-engine.js | autonomous rival studio operations | Integrate as a tab within Market or retain as a linked deep workspace |
| technology | phase11-technology-sustainability-engine.js | technology tree, labs, R&D, patents and sustainability | Technology and research workspace |
| generations | phase12-generations-engine.js | family lineage, inheritance, succession and world evolution | Link to people, founder, governance and company |
| geography | phase1-global-geography-engine.js | countries, administrative regions, cities and geographic reference data | Map and geographic intelligence workspace |
| globaltravel | phase1-global-mobility-engine.js | travel routes, passports, bookings, transport and accommodation | Link to founder, workforce, projects and geography |
| releasequality | phase13-release-quality-engine.js | PWA, asset, schema and release gate checks | Developer/release engineering |
| autonomy | autonomous-simulation-engine.js | autonomous task registry, execution and audit | Advanced simulation diagnostics |
| situations | player-experience-layer.js | optional player situations, intervention and consequence history | Player decision inbox; unify with overview alerts |
| worldsystems | simulation-depth-engine.js | public safety, cyber, resilience and other world-system summaries | Split into focused player workspaces where appropriate |

Additional panels (not independent routes):
- media-ecosystem panel inside the phone page.
- Phase 5 development/completion and production-operation panels inside Projects / Production Ops.
- Phase 8 financial empire panel inside Finance.
- Phase 11 R&D / technology and sustainability views.
- Founder wellbeing and life events extension inside Personal.
- World-risk monitoring panel inside World Engine.
- Phase 7 digital-life surfaces appended to the smartphone ecosystem.

## 4. Global render and initialization dependencies

The current code uses a shared global render() function and several engine wrappers. Confirmed wrapper sources include:
- phase1-world-engine.js
- phase2-population-engine.js
- phase8-financial-empire-engine.js
- phase9-global-economy-engine.js
- phase10-autonomous-competitors-engine.js
- phase11-technology-sustainability-engine.js
- phase12-generations-engine.js
- phase1-global-mobility-engine.js
- phase6-ecosystem-engine.js
- phase7-smartphone-engine.js
- autonomous-simulation-engine.js
- phase13-release-quality-engine.js
- player-experience-layer.js and inline experience extensions

These wrappers call earlier render functions and then refresh their own panels. This is a compatibility chain, not a clean page-component lifecycle. The UI refactor must instrument the chain before migrating it. Do not assume a single route change refreshes only one page.

Engine load order is meaningful: multiple engines wrap shared APIs such as render, persist, Phase6Ecosystem.stepDay and StudioPhaseIntegration.audit. Keep script order unchanged until dependency tests prove a safe alternative.

## 5. Source-level content consistency issue

The current player-facing copy appears inconsistent about simulation time:
- The World Clock page describes a continuous simulation and says one in-game day equals three real-world minutes at normal speed.
- The runtime installs a one-second tickClock interval and calls tickClock while the world clock is running and not frozen.
- Calendar page copy says time never advances automatically and describes manual-only advancement.
- Other pages expose manual advance controls.

Before redesigning time controls, verify the actual default worldClock.running state, pause/resume behavior, offline catch-up, manual advancement and user-facing wording. Do not resolve this by changing simulation behavior as part of a visual task. The UI must accurately communicate the behavior the engine actually implements.

## 6. Screen-level implementation checklist

For each route/panel, add a follow-on source map with:
- exact render function and file/line,
- exact DOM IDs queried or written,
- exact campaign fields read,
- engine API calls made by controls,
- mutation and persistence path,
- linked route/entity dependencies,
- existing browser QA coverage,
- empty/error/unavailable behavior,
- implementation status and known limitations.

This document maps ownership at a first-pass level. It is not a claim that every route has been fully functionally audited or that every feature is complete.
