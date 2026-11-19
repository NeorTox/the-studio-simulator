# THE STUDIO — UI implementation architecture and source audit
Branch: ui/complete-interface-redesign
Baseline: 516d63a9c308d05e1881fc0148ce94a5325c45e5
Audit performed against the current application source, not a mock-up.

## 1. Verified source facts

- index.html is 392,954 characters and 1,752 lines in the audited branch.
- It contains 27 primary navigation buttons and 27 matching base page sections.
- The navigation currently includes: overview, campaign, company, facilities, ip, legal, people, personal, talent, projects, finance, world, market, media, admin, awards, manual, calendar, distribution, digital, sustainability, governance, integrity, productionops, population, algorithms and time.
- index.html contains 36 script tags: 31 external JavaScript files and 5 inline script blocks.
- The main page has 474 unique element IDs and 4 repeated ID names in modal-form markup. These repeats occur in alternative modal templates, so this static count alone does not establish a simultaneous DOM collision; verify at runtime before changing IDs.
- The app includes 58 inline event-handler attributes in index.html. Engine scripts also attach handlers programmatically and dynamically create pages.
- The base document contains an inline legacy stylesheet and then loads studio-overhaul.css. The two style layers overlap on shell, navigation, page, card, grid, form, modal, table and responsive selectors.
- studio-overhaul.css is about 10.6 KB and contains a second broad visual layer plus targeted responsive rules and a command-pulse component.
- The app is static/PWA oriented and uses local browser saves. No established 3D renderer or 3D model asset pipeline was found in the audited root files.
- Several engines add pages or panels at runtime. The final visible navigation is therefore larger than the 27 base destinations.
- A number of engines wrap the global render function to refresh their own views. Examples found include world, population intelligence, financial empire, global economy, technology/sustainability, generations, global travel, autonomy and player-experience layers. Some wrappers are marked idempotently; not all use the same convention.
- Engine pages are sometimes inserted directly into .content and navigation entries directly into .nav. Some engines instead inject cards into existing pages.
- Phase 0's registry explicitly distinguishes conceptual domain boundaries from physically extracted modules; the app remains a legacy single-page bundle.

## 2. Architectural implications

The visual redesign must not begin by replacing index.html wholesale or moving engine logic into new modules. The simulation currently relies on shared globals, campaign state, global render/persist functions, inline event handlers, and engine initialization order.

The redesign should first introduce a UI presentation layer that consumes existing APIs and campaign state. It must not become a second simulation engine.

Risks to actively manage:
1. A global render change can affect several engine renderers due to wrapper chains.
2. Reordering script tags can break APIs or engine registration order.
3. Moving a panel can break selectors and handlers that target existing IDs.
4. Renaming or removing IDs can break engine-owned DOM queries.
5. Rebuilding a form can silently change validation, persistence or ledger behavior.
6. Replacing nav handling can break dynamic pages that currently attach their own handlers.
7. New CSS can be overridden by either inline styles or the existing overhaul stylesheet.
8. 3D libraries or assets can harm initial load, memory, thermal performance and offline caching.

## 3. Proposed UI presentation architecture

Keep the current runtime and engine contracts intact. Introduce a small, framework-free presentation layer in stages.

### A. StudioUI registry

A future studio-ui.js should own presentation metadata only:
- registerPage({ id, title, group, icon, order, status, render, onEnter, onLeave })
- registerPanel({ id, pageId, slot, order, render })
- registerAction({ id, label, handler, permission, confirm, category })
- registerEntityType({ type, label, getRecord, getLinks, renderSummary })
- registerNotification({ id, severity, date, source, title, body, href, action })
- setActivePage(id), getActivePage(), refreshPage(id), refreshAll()
- mountShell(), mountPage(), disposePage()

No simulation calculations, campaign mutations, time progression or save operations belong in this registry. Actions call existing engine APIs.

### B. Lifecycle

Each page has a stable lifecycle:
- mount: construct persistent DOM once and bind delegated interactions.
- enter: load current data, restore page context, focus the heading and update breadcrumbs.
- refresh: update only the affected view; avoid rebuilding the entire page if possible.
- leave: preserve filters, selected row and scroll context; dispose transient resources.
- error: show a recoverable error with retry and diagnostics link.

### C. Shared primitives

Create consistent, accessible primitives before rebuilding full screens:
- PageHeader, Breadcrumbs, PrimaryAction, SecondaryAction
- Metric, Status, Confidence/Source marker, TrendIndicator
- DataTable with sorting, filtering, column selection and row actions
- Timeline, CalendarAgenda, MilestoneList
- EntityList, EntitySummary, EntityDossier, RelationshipList
- DetailDrawer, ModalDialog, ConfirmDialog
- DecisionCard, DecisionInbox, EventFeed, Notification
- FilterBar, SearchField, EmptyState, ErrorState, LoadingState
- ChartPanel with units, range, source date and tabular alternative
- MapPanel with a non-map list alternative
- ReportHeader, ReportSection, AuditTrail

Primitives must support keyboard navigation, focus management, screen-reader labels, reduced motion and touch targets.

### D. Data adapters

UI adapters may format and combine existing state, but every displayed value must trace to:
- a campaign field,
- a named engine API,
- a deterministic derived calculation with documented formula,
- or an explicitly labelled static reference value.

Never use fabricated fallback metrics in active campaigns. When data is unavailable, render "Not available" or a specific explanation, not zero.

## 4. Styling consolidation strategy

Do not delete either stylesheet at the start. First inventory computed styles and screenshot every page at target breakpoints.

Then:
1. Define semantic tokens in a new UI token section: colour, typography, spacing, radii, borders, elevation, motion, focus and density.
2. Introduce component-scoped classes for new components; do not globally restyle .card, .btn, .grid, .page all at once.
3. Move the shell to the new token system.
4. Migrate one page at a time.
5. Remove obsolete inline rules only after browser comparison and regression coverage.
6. Consolidate into one authoritative stylesheet after the last page has migrated.

Avoid high-specificity selectors and broad !important overrides. Use CSS custom properties for theme and density.

## 5. Navigation migration

Current navigation is split between static markup and engine-added buttons. Introduce a registry adapter that initially discovers existing button[data-page] and section.page elements without renaming IDs.

A single delegated listener should eventually own:
- route changes,
- active navigation state,
- breadcrumbs,
- focus restoration,
- history/back behavior,
- page enter/leave lifecycle.

Migration must be incremental. Keep compatibility with window.nav(id) until every engine and browser test uses the registry. Do not remove engine-specific click handlers until their behavior has been reproduced and verified.

## 6. Rendering migration

Do not immediately remove global render wrappers. First instrument the existing render pipeline in a diagnostic-only way:
- identify wrapper order,
- count renderer invocations per user action,
- record duration by page/engine,
- catch and attribute renderer failures,
- detect duplicate work,
- verify no state mutation occurs during pure rendering.

Then introduce page-scoped refresh APIs. Migrate one wrapper at a time, retaining the old window.render() compatibility facade until all consumers have moved.

A refresh of the finance page should not rebuild the world map, population roster, phone, competitor dashboard and all diagnostics unless those views actually depend on the changed state.

## 7. Interaction and action contracts

Every button/action must have:
- a stable action ID,
- a visible label,
- a handler calling the existing engine API,
- validation and error feedback,
- confirmation for destructive or high-impact actions,
- explicit success feedback,
- a defined persistence point,
- an audit/history record where the underlying system supports it.

Never use onclick string construction for new components. Prefer delegated listeners or addEventListener with stable action IDs. Do not silently alter accounting, contract, hiring, ownership, rights or simulation-time semantics.

## 8. 3D integration boundary

A future studio-3d.js module should be dynamically loaded only when the user opens a supported visual preview.

First prototype:
- one static studio campus/facility scene,
- orbit/zoom only if useful,
- labelled hotspots rendered in the DOM,
- direct links to the existing facility record and operations screen,
- static image/2D fallback,
- WebGL unavailable and reduced-motion fallbacks,
- explicit close/unload and GPU resource disposal.

The initial page bundle must not load the 3D library. The 3D view must not contain exclusive business controls or essential simulation information. Keep the 3D renderer isolated from campaign mutation and save logic.

## 9. First implementation milestone

Before any production UI is replaced:
1. Add the UI registry skeleton and design tokens in isolated files.
2. Mount a new shell in a feature flag / preview route without replacing the existing shell.
3. Create an overview prototype using only existing live campaign fields.
4. Verify all quick actions call existing functions and retain current behavior.
5. Add visual browser screenshots and interaction tests for no-campaign and active-campaign states.
6. Test desktop landscape, tablet landscape and the supported handheld landscape layout.
7. Run save/reload, export/import, PWA/offline and current simulation regression workflows.
8. Only then replace the production overview route.

## 10. Acceptance gates

- No campaign-state mutation during rendering.
- No change to simulation day ordering, deterministic outcomes, financial posting or save schema.
- All 27 existing primary routes remain accessible.
- All dynamic engine pages continue to register and open.
- No missing DOM selectors, unhandled errors or broken action handlers.
- No loss of local save compatibility or PWA/offline operation.
- All pages have deliberate empty, unavailable, loading and error states.
- No new 3D code is loaded until the user explicitly opens a 3D preview.
- No merge to main until browser, integration and long-run regression checks pass.

## 11. Immediate next work

The next engineering task is not a full visual rewrite. It is a route-and-render dependency map:
- map each route to its exact renderer and engine source,
- map each renderer to the state fields and DOM IDs it reads/writes,
- identify global render wrappers and initialization dependencies,
- identify player-facing vs developer-only views,
- record which browser QA currently covers each route.

Once that map is complete, implement the isolated UI registry and token layer. This is the safest route to a polished interface without destabilizing the simulation.
