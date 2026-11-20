# THE STUDIO — UI/UX Redesign Brief
Status: design baseline / research synthesis
Target branch: ui/complete-interface-redesign
Baseline: main at 516d63a9c308d05e1881fc0148ce94a5325c45e5
Product: text-first, data-rich entertainment-industry simulation; optional 3D as progressive visual enhancement

## 1. Product identity

THE STUDIO is a text-based simulation game first. The primary player actions are reading, comparing, planning, deciding, negotiating, allocating resources, reviewing consequences and advancing the simulation. The UI must make a deep simulation legible and enjoyable; it must never force the player to navigate a 3D scene to perform ordinary management work.

3D is permitted and encouraged selectively for atmosphere, spatial context and visual storytelling. It is an enhancement, not the primary interaction model and not a prerequisite for any core feature.

Design promise: "A sophisticated operating system for building and running an entertainment empire."

## 2. Repository facts established during initial audit

- Main is a static, landscape-first web/PWA application with a large single-page index.html and 31 local JavaScript script imports.
- 27 base navigation destinations exist: overview, campaign, company, facilities, ip, legal, people, personal, talent, projects, finance, world, market, media, admin, awards, manual, calendar, distribution, digital, sustainability, governance, integrity, productionops, population, algorithms, time.
- Engine-created page surfaces discovered in source: architecture, worldengine, peopleintelligence, situations, ecosystem, integrationhealth, phone, media, competitors, technology, generations, releasequality, autonomy, geography, globaltravel, worldsystems. Some are overlays or contextual surfaces rather than primary navigation destinations.
- Current main includes inline legacy CSS plus studio-overhaul.css. Existing visual treatment is dark/navy/gold and landscape responsive, but this is not yet a unified premium design system.
- No 3D model assets or 3D runtime dependency were found in the root asset inventory. Current app is static/PWA and uses local browser saves; cloud sync/server-side background simulation are not implemented.
- The Phase 0 architecture registry declares 24 domains and 81 dependency edges. It explicitly warns that these are target domain boundaries and that the application remains a legacy single-page bundle; not all domains are physically extracted.
- Do not assume a page is complete just because a route exists. Screen audit must distinguish implemented, partial, diagnostic, overlay and planned.
- Preserve current campaign schema, local save compatibility, simulation engine APIs, daily pipeline order, achievements/cheat semantics, PWA offline behavior and all regression contracts.

## 3. Product design principles

1. Text-first, not text-only: well-typeset information is the primary interaction; imagery and 3D add atmosphere and spatial understanding.
2. Decision-first: make the next meaningful decision and its context easy to find.
3. Progressive disclosure: summary → explanation → detailed records; advanced controls remain available without crowding first-time users.
4. Context preservation: opening a profile, report, event or record should not lose the user's place, filters, selected entity or scroll position.
5. Shared truth: every number and status comes from the actual campaign/runtime state. No decorative or invented metrics in live campaigns.
6. One system, many views: shared entities and actions link across departments; do not duplicate simulation logic or create parallel data.
7. High information density, high legibility: dense tables and reports are allowed, but hierarchy, spacing, alignment and labels must be excellent.
8. Consequence transparency: show what a decision changes, who/what is affected, the uncertainty, timing and follow-up.
9. Responsive by design: landscape desktop/tablet first, then deliberate narrow-screen support; avoid merely shrinking desktop tables.
10. Accessible and efficient: keyboard navigation, visible focus, semantic controls, contrast, scalable text, reduced motion and touch-friendly targets.
11. Performance is part of polish: lazy-load heavy views, virtualise long lists, avoid unnecessary rerenders and never let decorative 3D delay management actions.
12. Honest status: distinguish confirmed, estimated, unavailable, simulated, stale and not-yet-modeled data.

## 4. Visual direction

A premium cinematic editorial interface: charcoal/graphite foundations, restrained champagne/bronze accent, clean neutral surfaces, strong typography, carefully controlled use of imagery and elegant motion. Avoid neon gamer styling, generic SaaS cards everywhere, overdone glassmorphism, cluttered gradients and decorative graphs.

Suggested semantic tokens (final values require contrast and device testing):
- Background: deep graphite / ink.
- Surface: layered charcoal with subtle cool undertone.
- Accent: restrained warm brass/champagne for focus and primary actions.
- Positive: muted green; warning: amber; critical: muted red; informational: cool blue.
- Text: warm near-white; secondary: cool grey; tertiary: muted slate.
- Typography: high-quality system sans for controls/data; optional editorial serif for report/story headlines only.
- Use tabular numerals for finance, dates, counts and metrics.
- Use a consistent icon family; icons must be recognizable and never replace labels in unfamiliar contexts.
- Use borders, spacing and typography before shadows or decorative effects.

## 5. Application shell

### Persistent shell
- Left navigation rail with collapsible groups, clear labels, active state, favourites and contextual count badges only when actionable.
- Top command strip: campaign/company identity, in-game date, simulation pause/speed/advance, save status, inbox, global search and quick actions.
- Main workspace: breadcrumb, page title, concise purpose statement, primary action, filters and page content.
- Right-side contextual inspector (optional): selected entity summary, linked records and actions; should be dismissible and must not squeeze core tables.
- Unified notification/decision centre with urgency, deadline, affected system, source and action.
- Command palette/search for navigating pages and finding people, projects, companies, contracts and events when those records exist.

### Navigation grouping proposal
- Command: Overview, Campaigns, Calendar, World Clock, Decisions & Inbox, Integration Health, Release Quality.
- Studio: Company, Facilities, People, Talent, Productions, Production Operations, IP & Rights, Distribution, Media, Awards, Legal.
- Finance & Strategy: Finance, Market, Governance, Sustainability, Algorithms.
- Life & Society: Personal, Population, Digital Life, Smartphone.
- World: World, Geography, Travel, World Systems, Sandbox.
- Reference: Manual, Architecture/Integrity diagnostics.

Do not remove any of the 27 existing destinations. Merge labels only after each route/action is mapped and verified.

## 6. Page design contracts

### Overview / executive command centre
- Campaign identity, company identity, in-game date and simulation controls.
- KPI strip grounded in existing data: cash, active productions, workforce, reputation/market position where supported.
- Decision inbox with priority, due date, consequence preview and direct action.
- Production portfolio with phase, budget burn, milestone, delay/risk and next gate.
- Cash/revenue trend and financial alerts.
- Industry/world pulse: important news, market movement, hazards and events.
- Calendar preview and recent activity.
- A clear empty state for new campaigns; do not display fake sample values.

### Campaigns / world clock / calendar
- Create/resume/switch campaigns; show era, location, company, founder and save timestamp.
- Export/import and backup integrity clearly separated from ordinary campaign actions.
- Calendar supports event categories, deadlines, production milestones, payments and release dates.
- Time controls clearly state what one advance action processes and show progress for long advances.
- Warn before destructive/irreversible operations; preserve existing save behavior.

### Company / governance / facilities
- Company identity, legal structure, ownership/cap table, divisions, subsidiaries, board and management.
- Department budgets, actuals, variances, headcount and delegated authority.
- Facility register with location, type, capacity, utilisation, maintenance and operating costs.
- Board agenda, quorum/votes, capital requests, compliance obligations and governance history.
- Use organisation charts and entity detail drawers where supported.

### People / talent / personal / population
- Searchable directories with role-specific filters and stable sorting.
- Person dossier: portrait/visual (if available), role, skills, contract, compensation, availability, career, reputation, relationships and timeline.
- NPC profiles distinguish named individuals from aggregate population simulation.
- Family tree and succession views show lineage, generations, inheritance and appointment history.
- Founder personal finances remain visually and semantically separate from company finance.
- Avoid implying every aggregate resident is a fully materialised NPC.

### Productions / production operations
- Pipeline view from idea/development through greenlight, pre-production, production, post, QC, delivery and release.
- Project detail includes synopsis/script status, budget approval, cast, crew, locations, schedule, dependencies, insurance, safety, continuity, stage gates and next actions.
- Timeline/Gantt and milestone list; accessible table alternative always available.
- Cost-to-complete, forecast vs approved budget, schedule variance and delivery risks.
- Shoot-day reports, incidents, delay causes and mitigation.
- 3D studio/facility previews may provide spatial context but must never replace production schedules, crew lists or operational reports.

### IP / distribution / media / awards / legal
- IP catalogue with ownership, formats, territories, windows, rights expiry, licence terms and royalty streams.
- Distribution partner CRM: offer comparison, negotiation history, minimum guarantees, recoupment, release windows and settlements.
- Media newsroom/outlet directory, article chronology, credibility, coverage, sentiment and correction history.
- Smartphone/social surfaces: apps, creators, feeds, publishing, engagement, moderation, ads, sponsorships, data and telecom status.
- Awards/festivals: eligibility, submissions, nominations, results and prestige/revenue links where modeled.
- Legal matters: parties, issue, exposure, deadlines, status, insurance links and case history. Clearly label simplified fictional mechanics.

### Finance / market / economy
- Finance: cash, ledger, journal, income statement, balance sheet, cash flow, budgets, payroll, invoices, debt and fixed assets.
- Market: share performance, valuation, ownership, IPO, securities, portfolio, risk, concentration, liquidity and acquisitions.
- Global economy: eight regions, GDP/output, inflation, unemployment, confidence, policy rates, fiscal/debt indices, trade corridors and commodities.
- Graphs must include units, selected time range, source/state date, hover detail and a tabular alternative.
- Financial figures use consistent currency formatting, signs, decimals and date conventions.

### World / geography / travel / systems
- Interactive 2D map as the default operational map; region selection opens data panels and linked events.
- Weather: regional current state, hourly/day history, forecast only if actually modeled, severity and impacts.
- Hazards and disasters: affected regions, infrastructure, logistics, production, population and recovery timeline.
- Travel: routes, quotes, booking status, passports, expenses and travel history; distinguish simulated values from real-world data.
- Supply chain, energy, public safety, cyber resilience and infrastructure each get a focused operational view.
- 3D globe or selected location previews are optional navigation/atmosphere layers, not the only way to access world data.

### Algorithms / integration / release quality
- Autonomous task registry, cadence, last/next execution, status, failure history and audit.
- NPC decision/consequence explanation with traceable triggers and outcomes; expose debugging only in diagnostics mode.
- Phase registry, integration health, simulation pipeline and save/restore audits are technical tools, not ordinary player-facing dashboards.
- Distinguish player-facing simulation reports from developer diagnostics.

## 7. 3D policy and technical approach

3D is a progressive enhancement, not a requirement for core play.

Potential high-value 3D uses:
- A studio headquarters / campus overview as a cinematic landing view.
- Facility and soundstage previews with clickable hotspots.
- Selected production location or set previews.
- Optional globe/city fly-through for orientation.
- Event artwork or environment scenes for major incidents and industry milestones.

Do not use 3D for:
- Accounting, financial statements, large directories, schedules, long-form reports, decision option lists or high-frequency operational controls.
- Any feature that becomes harder to read, navigate or use without a mouse.
- Decorative continuous animation that wastes battery or blocks input.

Implementation constraints:
- First audit browser/PWA device performance and actual asset pipeline.
- No 3D framework or model assets are currently present in the audited root inventory. Do not assume Three.js, WebGL assets or a 3D renderer already exists.
- If approved after prototype testing, use a lazily loaded, isolated 3D module (e.g. Three.js/WebGL) with compressed assets, low draw calls, capped pixel ratio, adaptive quality and explicit disposal.
- Provide a static image/2D diagram fallback when WebGL is unavailable, disabled, low-power or reduced-motion is requested.
- Keep all controls, labels, hotspots and critical data accessible as ordinary HTML/D​​OM; canvas must not be the only interface.
- Do not add large third-party libraries to the initial page bundle.
- Respect GitHub Pages static hosting and service-worker/offline behavior; no Vercel migration and no cloud-service assumption.
- Prototype a single facility preview first. Measure load time, memory, frame rate, mobile battery/thermal impact and fallback correctness before expansion.

## 8. Benchmark synthesis

Text-first / narrative and decision references:
- Suzerain: editorial narrative presentation, consequential choices, character cast and clear story summaries. Official press kit describes a million-plus-word branching narrative and 50+ characters: https://www.torporgames.com/presskit
- Democracy 4: information-dense policy simulation with a deliberately revamped vector UI and visualised popularity/finance/influence: https://www.positech.co.uk/democracy4/
- King of Dragon Pass: clan management through advisors, season/calendar, focused screens and story events; caution that dense text and poor navigation can overwhelm: https://kingofdragonpass.fandom.com/wiki/Graphical_User_Interface
- The Life and Suffering of Sir Brante: menu-driven text adventure/simulation reference; use for readable narrative transitions, not as a full management dashboard.
- Terra Invicta: objectives, quick-focus panels, time control, finder and event log: https://wiki.hoodedhorse.com/Terra_Invicta/Beginner%27s_Guide

Management / analytical references:
- Football Manager: entity tabs, contextual actions, calendar, sorting and time-advance workflow. Use as a navigation reference, while avoiding over-nested menus and modal overload: https://community.sports-interactive.com/sigames-manual/football-manager-2024/the-user-interface-r4951/
- Anno 1800: cross-region statistics, filtering, production/consumption histories, drill-down and remembered context: https://anno1800.fandom.com/wiki/Statistics
- Hollywood Animal / The Movies: thematic studio management references; focus on production lifecycle, company atmosphere and linking business decisions to creative work.
- Factorio / Oxygen Not Included / Workers & Resources: readable systems diagnostics, production chains and data overlays.
- Crusader Kings III / RimWorld: character dossiers, relationships, work priorities, memory and succession.
- Frostpunk 2: high-stakes decisions, factions, negotiation and consequence presentation.
- Two Point Museum / Planet Zoo / F1 Manager: staff operations, contextual actions and polished management presentation.

Benchmark rule: borrow interaction principles, not exact layouts or copyrighted art/assets. All final visuals must be original to THE STUDIO.

## 9. Quality gates — no "looks done" sign-off

Each screen must pass:
- Correct live data: no fabricated values; all displayed fields trace to source state.
- Complete actions: every visible button works, has feedback and respects validation.
- Empty/loading/error states: designed and tested, not blank boxes.
- Navigation: direct links, back/forward behavior, deep-link correctness, context preservation.
- Save safety: reload, export/import, migration and persistence compatibility.
- Responsive: landscape desktop/tablet and narrow-screen fallback.
- Accessibility: keyboard, focus, labels, contrast, text scaling and reduced motion.
- Performance: no unbounded DOM growth, no unnecessary polling, long lists virtualised where needed.
- Visual QA: consistent typography, spacing, alignment, iconography, hierarchy and no clipping/overlap.
- Regression: all existing engine, browser, integration, 365-day and 1,095-day checks continue to pass.

No phase is complete on a screenshot alone. Each page requires visual review plus functional browser QA and simulation integration verification.

## 10. Proposed implementation order

1. Inventory every current route, generated view, action, state source and status (implemented/partial/diagnostic/overlay).
2. Establish design tokens, typography, controls, tables, tabs, drawers, modals, notifications and responsive shell.
3. Rebuild global navigation, top command bar, decision inbox and overview.
4. Build reusable entity detail patterns (person, project, company, facility, IP, contract, investment).
5. Rebuild production, company, people and finance workspaces.
6. Rebuild media/digital, world/economy, travel, sustainability and technology workspaces.
7. Rebuild diagnostics, campaign management and reference/help surfaces.
8. Prototype the optional 3D facility/campus preview in isolation; only expand if performance and usability gates pass.
9. Run visual, functional, save/load, PWA/offline and multi-year regression gates.
10. Roll out incrementally; preserve production main until each candidate is verified.

## 11. Explicit non-goals

- Do not convert THE STUDIO into a real-time 3D tycoon game.
- Do not replace text, tables or financial reports with 3D scenes.
- Do not redesign simulation algorithms as a side effect of UI work.
- Do not remove or silently hide existing features.
- Do not invent unimplemented systems, data, live real-world information or cloud functionality.
- Do not use Vercel or change hosting.
- Do not merge a visual overhaul before the complete regression suite and save-compatibility checks pass.
