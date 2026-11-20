# THE STUDIO — Screen-by-screen UI inventory
Status: first-pass route inventory; validate each action and field against runtime before implementation.
Companion: UI-REDESIGN-BRIEF.md

## Inventory rules
- The 27 entries below are the actual base navigation destinations found in index.html.
- Additional engine-created views are listed separately. Some are diagnostics, overlays or secondary panels, not new top-level player destinations.
- The page title and existence of a route do not prove every described capability is fully implemented.
- For each view, implementation must record: source engine/function, campaign fields read, actions invoked, events emitted, persistence effects, status (implemented/partial/diagnostic/overlay), browser QA coverage and owner.
- Do not expose developer diagnostics as ordinary player-facing pages.

## 27 existing base destinations

| Existing route | Player purpose | UI treatment required | Key cross-links |
|---|---|---|---|
| overview | Understand current company and immediate priorities | Executive command centre; KPI strip; inbox; production portfolio; activity; financial/world pulse | Every department, calendar, decisions |
| campaign | Create, switch, save, export and import campaign histories | Campaign library, clear active-save identity, guided setup, backup/restore states | Overview, world clock, manual |
| company | Run legal entity, ownership, divisions, subsidiaries and capital decisions | Corporate dossier, org chart, cap table, department register, board actions | Finance, people, facilities, governance |
| facilities | Operate offices, stages and other physical assets | Facility register, utilisation/capacity, maintenance, operating costs; optional 3D preview | Company, production operations, sustainability |
| ip | Manage intellectual property and rights ownership | Catalogue, ownership/territory/window detail, licence and royalty history | Projects, distribution, finance, media |
| legal | Manage legal matters, insurance and exposure | Case register, deadlines, severity, insurance coverage and linked entities | Company, production, finance, governance |
| people | Manage company personnel and named individuals | Searchable people directory, employee dossier, department/role/contract/availability | Talent, company, personal, population |
| personal | Manage founder's life and personal finances | Founder dossier, separate personal balance sheet, wellbeing and relationships | Travel, people, company (only through explicit transactions) |
| talent | Manage creative talent and availability | Talent register, representation, auditions/casting, contracts and compensation | Projects, people, legal, finance |
| projects | Manage creative and production portfolio | Slate/pipeline, project dossier, development/greenlight/stage gates/budget/schedule | Talent, productionops, IP, distribution, finance |
| finance | Manage accounting, treasury and company financial health | Statement navigation, ledger, journal, cash flow, budgets, debt, payroll and audit trails | Company, projects, market, facilities |
| world | Understand world conditions and regional effects | World situation report, regions, weather, hazards, safety, logistics and infrastructure | Economy, travel, production, population |
| market | Manage competition, industry markets and investments | Market intelligence, rival comparison, securities/portfolio, exposure and risk | Finance, economy, competitors, technology |
| media | Understand press, news and entertainment coverage | Newsroom/outlet register, stories, credibility, coverage, sentiment and corrections | Projects, distribution, digital, reputation |
| admin | Configure sandbox and simulation options | Clearly separated sandbox controls; explain achievement impact; confirmation for consequential changes | Campaign, world clock, manual |
| awards | Manage festival and awards participation | Eligibility, submissions, nominations, results and event chronology | Projects, media, finance |
| manual | Learn systems and rules | Searchable reference, contextual help, glossary, formula/term explanations | All screens |
| calendar | Plan deadlines and time-sensitive obligations | Month/week/agenda views, category filters, deadlines and linked event detail | Projects, legal, finance, awards, world |
| distribution | Sell and license content | Partner register, offer comparison, negotiation timeline, rights windows and settlements | IP, projects, finance, media |
| digital | Operate digital ecosystem and smartphone economy | Platform/app/creator/ad/sponsorship/telecom workspaces with clear sub-navigation | Media, market, people, finance |
| sustainability | Manage environmental operations | Energy/emissions/water/waste dashboard, initiatives, policy and investment status | Facilities, production, technology, finance |
| governance | Manage board, ownership and corporate oversight | Board composition, agenda, voting, quorum, approvals, ownership and governance history | Company, finance, legal |
| integrity | Inspect system health and integration | Developer/advanced diagnostics with explicit technical language, not a player KPI page | Architecture, release quality, simulation logs |
| productionops | Run active shoot and production operations | Daily call sheet, crew, location, schedule, continuity, incidents, delays and safety | Projects, talent, facilities, legal |
| population | Understand simulated population and society | Regional aggregate views, cohorts, household economics, named-NPC search and population history | People, world, economy, digital |
| algorithms | Inspect autonomous and decision systems | Advanced controls and transparent audit traces; separate player-facing effects from developer debug detail | Population, world, media, competitors, integration |
| time | Control and understand simulation time | World clock, pause/advance, date/day, scheduled tasks and progress for long advances | Calendar, campaign, overview |

## Additional engine-created surfaces found in source

| View ID | Originating file | Classification | Design treatment |
|---|---|---|---|
| architecture | phase0-architecture.js | Developer architecture/diagnostics | Domain registry, dependencies, schema and migration audit; hide behind advanced diagnostics |
| worldengine | phase1-world-engine.js | World/time diagnostic surface | World clock and engine-level state, with clear separation from player world view |
| peopleintelligence | phase2-population-engine.js | Population/NPC intelligence view | Cohorts, named NPCs, aggregate population and audit distinctions |
| situations | player-experience-layer.js | Player-facing decision/event surface | Contextual situation cards and decisions; should integrate with global inbox |
| ecosystem | phase6-ecosystem-engine.js | Entertainment ecosystem workspace | Audience, releases, distribution economics and downstream performance |
| integrationhealth | phase-integration-engine.js | Developer/advanced diagnostic | Phase contracts, daily pipeline markers, errors and audit evidence |
| phone | phase7-smartphone-engine.js | Player-facing device view | Studio One device, installed apps, storage, battery and telecom state |
| media (engine surface) | phase7-smartphone-engine.js | Player-facing digital/social view | Social apps, creators, feed, posts and engagement; reconcile with base media route to avoid duplicate navigation |
| competitors | phase10-autonomous-competitors-engine.js | Player-facing market workspace | Rival studio profiles, operating cycles, bids, projects, market share and events |
| technology | phase11-technology-sustainability-engine.js | Player-facing R&D workspace | Research tree, labs, scientists, projects, patents and licensing |
| generations | phase12-generations-engine.js | Player-facing people/company workspace | Family trees, lineage, inheritance, successor candidates and leadership changes |
| releasequality | phase13-release-quality-engine.js | Developer/release diagnostic | Release gate, asset checks, campaign schema, PWA/offline and audit results |
| autonomy | autonomous-simulation-engine.js | Advanced autonomous systems view | Task registry, cadence, last/next tick, outcomes, errors and audit |
| geography | phase1-global-geography-engine.js | Player-facing map/data workspace | Country/territory, administrative regions, city hubs and regional context |
| globaltravel | phase1-global-mobility-engine.js | Player-facing travel workspace | Passport, route quotes, transport, booking, hotels, expenses and travel history |
| worldsystems | simulation-depth-engine.js | Mixed player-facing/advanced world systems | Public safety, cyber resilience, relationships, supply chain and market liquidity; audit current visibility and split into focused workspaces if needed |

## Required audit output for each screen

Create a route contract with:
1. Exact screen ID, visible title and navigation entry.
2. Rendering function and source file(s).
3. Actual data fields read; classify direct campaign state vs derived value vs external/static reference.
4. Every action/control, handler, validation and resulting state mutation.
5. Related pages and linked entities.
6. Empty, loading, error, stale and unavailable states.
7. Save/reload behavior and schema impact.
8. Browser regression coverage and missing tests.
9. Current status: implemented, partial, diagnostic, overlay or planned.
10. Design benchmark(s) and reason for borrowing the interaction pattern.

## Priority order for screen audits

1. Global shell, overview, campaign, clock and calendar.
2. Company, finance, productions, production operations, people and talent.
3. IP, distribution, media, digital life, legal, governance and awards.
4. World, population, geography, travel, economy, market and competitors.
5. Facilities, sustainability, technology, generations and personal life.
6. Algorithms, sandbox, manual, architecture, integration health and release quality.

## Known source/implementation caveats

- index.html is a large single-page document with inline styling and page markup; studio-overhaul.css overrides part of the visual system. Consolidation must be incremental.
- The 27 static routes and engine-created surfaces do not map one-to-one to 27 independent modules.
- Some views may be rendered into the document dynamically or registered by page ID. Confirm actual runtime navigation before moving or removing them.
- Some page names overlap (notably media). Reconcile ownership and navigation rather than creating duplicate tabs.
- Phase 0's domain registry is an architectural target contract and explicitly notes that not every domain has been physically extracted.
- The current app is a text/data management experience. 3D previews are optional visual layers only.
