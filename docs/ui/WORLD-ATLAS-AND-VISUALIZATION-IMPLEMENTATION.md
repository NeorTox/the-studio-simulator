# World Atlas, Travel and Visualization Implementation

Date: 20 November 2026
Branch: `ui/full-native-game-interface-rebuild`

## Purpose

This document records the first player-facing World / Travel vertical slice and the initial live chart system. It describes what is implemented, which existing engines remain authoritative, how the modules are loaded, and what is deliberately not represented as completed functionality.

## Runtime integration

The existing simulation engines remain authoritative:

- `phase1-global-geography-engine.js` owns countries, administrative divisions, city coordinates and airport gateway identifiers.
- `phase1-global-mobility-engine.js` owns the player's current location, passport, entry permits, transport bookings, accommodation, personal-ledger charges and daily travel progression.
- `studio-ui-runtime.js` owns application navigation and workspace lifecycle.
- `studio-world-atlas.js` enhances the existing Geography and Global Travel routes without changing the campaign save schema.
- `studio-visualization-runtime.js` reads campaign data and mounts charts on existing workspaces.

The module order in `index.html` is intentional: the geography and mobility engines load first; the native UI runtime loads after them; the world-atlas module then wraps the final navigation/render lifecycle; the visualization module is loaded last.

Both new UI scripts are included in the service-worker shell cache. The cache key is versioned to force clients to refresh these assets.

## Global atlas

### Renderer and map style

- Renderer: MapLibre GL JS 6.19.0, loaded as a browser ES module.
- Default map: a custom dark vector style using MapLibre's published demonstration vector-tile endpoint.
- Projection: globe by default, with a globe/flat-map toggle.
- Controls: navigation/compass/zoom and metric scale.
- Layers: country polygons and borders, geographic lines, country labels, clustered city/airport gateway markers, city labels, and the selected flight route.
- The basemap style may be overridden before the atlas initializes with `window.STUDIO_MAP_STYLE_URL`.

The default vector tiles are a development/demo source. The available country vector layer is limited to zoom level 6; overzooming does not create street-level data. A production map provider or self-hosted tile stack must be chosen before release. Provider licensing, attribution, usage limits, privacy, mobile performance and offline policy must be reviewed. Do not treat the demo tile service as a production service or bulk-download it.

### Location selection

- The map's country-fill layer supports country/territory selection using the vector tile `ADM0_A3` property and the geography engine's ISO3 registry.
- A country dossier offers airport-enabled city gateways from the existing city registry.
- Selecting a city opens its location dossier and exposes the existing travel destination action.
- City markers are clustered at small scales and selectable at larger scales.
- Search uses the existing geography registry and does not invent new locations.
- The map is centered on the campaign player's current city; the current-location control recenters it.

Country boundary datasets represent a particular cartographic treatment of de facto boundaries and should not be presented as legal or geopolitical adjudication. Custom styles need a `country-fill` layer to support polygon-to-country selection; city search/markers can still work without it.

## Generated flight itineraries

The existing mobility engine's flight quote is distance-based; it is not an airline schedule. The atlas module adds a deterministic in-game timetable layer without claiming to book real airlines.

For a mapped origin/destination it can produce:
- a direct itinerary;
- up to two one-stop itineraries through geographically plausible hubs from a curated in-game hub list;
- generated in-game carrier names, flight numbers and aircraft labels;
- approximate departure and arrival local clock times;
- layover duration, total duration, route distance and an in-game fare;
- multi-leg great-circle line geometry for map visualization.

The flight planner reuses the existing destination/date/hotel/nights inputs. The selected itinerary is booked by calling `StudioGlobalTravel.planTrip`, then the selected schedule and itinerary legs are stored on the resulting campaign travel booking. Existing passport and entry-permit checks remain in force. The existing travel ledger remains authoritative for ticket and hotel costs; any itinerary surcharge is recorded through the founder's personal finance engine.

### Explicit limits

- Carrier names, flight numbers, schedules, aircraft assignments and fares are generated simulation data, not live commercial services.
- Current local-time estimates use longitude-derived approximate UTC offsets, not a full IANA timezone database.
- Day-level travel processing currently treats the booking as a trip to its final destination. Detailed airport check-in, gate/terminal handling, segment-by-segment departure, transit-visa logic, layover-day events, missed connections, delays, cancellations and operational airline capacity still require engine work.
- The map's current airport marker coverage comes from the existing geography registry; identifiers prefixed with `SIM-` are generated regional gateways, not verified commercial airport codes.
- The atlas can search for mapped cities, but a city without an airport gateway cannot be booked as a flight destination.

## Campaign-backed charts

ECharts 6.1.0 is loaded lazily when a visible chart has real campaign data. Chart cards can show an explanatory empty state without requesting the external chart bundle. Charts share a restrained theme, responsive resizing and ECharts accessibility options.

Current charts:

| Workspace | Chart | Data source |
|---|---|---|
| Command / overview | Company cash position | Posted `active.ledger` entries, reconstructed into a running balance |
| Finance | Expense structure | Negative posted company ledger amounts grouped by category |
| Finance | Treasury / investment allocation | Company cash and active `active.financialEmpire.holdings` market values |
| Productions | Development readiness | Actual boolean values in each project's Phase 5 development checklist |
| Market | Regional economic conditions | GDP index from `active.market.globalEconomy.regions`, with inflation and unemployment in tooltip |
| Population | Materialized NPC age profile | Age values of named NPC records currently stored in the campaign |
| People | Workforce and payroll by department | Active employee records and their monthly salary values |
| Market | Audience demand by genre | Current campaign `active.market.genres` values |
| Media | Press cycle and coverage reach | Dated `active.market.media.coverage` records |
| Distribution | Royalty settlements over time | Dated `active.distribution.settlements` receipts |
| Founder | Personal assets and liabilities | Founder personal cash, asset values and debt, separate from company accounts |

The NPC chart is explicitly a profile of materialized NPC records, not the full virtual resident population. No example or placeholder values are inserted into production charts.

Further charts should be attached to additional specialist workspaces only when their source engine exposes well-defined data, units and time semantics.

## Validation and QA

The regression workflow now syntax-checks the atlas and visualization modules and runs:
- `studio-ui-rebuild-browser-qa.js`: route navigation, world-atlas presence, mapped gateway count, globe toggle, country dossier/city selection, chart workspace cards, mobile and desktop shell checks.
- `phase1-global-geography-travel-qa.js`: existing geography/travel engine audit plus direct and one-stop itinerary structure, leg metadata, curved route geometry, world-atlas/travel panel integration, relocated travel controls and passport-section preservation.

An isolated itinerary logic check should verify direct/connecting itinerary availability and finite great-circle coordinates. Full browser/CI success must be based on the actual workflow run result, not source inspection alone.

## Management workspace layout

The Command Centre now includes an Operations launchpad with six direct actions: create a production, record a transaction, hire an employee, open Talent, open Market, and open Global Travel. These actions call the existing game functions and navigation routes rather than introducing duplicate command logic.

The native interface now organizes more of the legacy management pages into player-facing workspaces without replacing their underlying renderers or action handlers:

- Finance: Overview, Accounting, Operations, Debt & Treasury, Investments and Audit.
- Productions: Production slate and Contracts & payments.
- Talent: Roster & auditions and Casting contracts.
- Market: Industry, Markets & investment, Competitors and Labour market.
- Media: Newsroom & coverage and Publicity campaigns.
- Company: Corporate profile and Divisions & subsidiaries.
- Founder personal life: Assets & finances and Relationships & family.
- Distribution: Rights agreements and Royalty settlements.
- Legal: Legal matters and Insurance & risk.
- Awards: Award events and Submissions.

Workspace tabs preserve the original DOM nodes and their IDs, so existing inline actions and engine render targets continue to address the same elements. The active tab is retained for the browser session. Tabs support keyboard navigation and horizontal scrolling on narrow screens. Empty legacy grid wrappers are removed after their cards are moved into the new panels.

The responsive styling now gives management pages a consistent mobile hierarchy, collapses paired cards into a single column, keeps wide data tables horizontally scrollable rather than forcing the entire viewport wider, and provides visible keyboard focus states.

## Next implementation work

1. Select a production basemap/tile strategy with street-level zoom, reliable worldwide coverage and a suitable offline/licensing plan.
2. Import a verified airport data subset into the existing geography registry, matching records by stable identifiers.
3. Add real timezone conversion and airport-to-city/terminal metadata.
4. Implement segment-level itinerary progression, airport check-in, connection handling, delays and travel disruption events.
5. Continue bespoke screen redesigns for remaining management workspaces, with action-level and mobile QA.
6. Extend charts to people, media, distribution, competitors and additional finance/production series using their real engine data.
7. Implement layered NPC identity/appearance generation and population streaming as a separate simulation milestone; the virtual 100-million population is not 100 million fully materialized agents.
