# THE STUDIO — Redesign coverage audit

Date: 19 November 2026  
Branch: `ui/complete-interface-redesign`  
Preview mode: `?ui=next`  
Production status: **not merged; main remains unchanged**

## Executive finding

The redesign has a verified global visual shell and navigation system, but it is **not yet a complete screen-by-screen redesign**. The 43-route browser check proves that the routes remain reachable; it does not prove that every screen has received a bespoke information architecture, visual treatment, or full action-level QA.

The next work is deliberately incremental: preserve the engine-owned page markup and actions, then migrate operational workspaces one at a time with route-specific tests.

## Current coverage

| Area | Current treatment | Evidence / limitation |
|---|---|---|
| Global shell and navigation | Implemented in preview | Grouped navigation, route search, active state, breadcrumbs, preview indicator and shared visual tokens. Dynamic routes are adopted into navigation. |
| Overview | Composed preview treatment | Context band, workspace shortcuts, section labels and preserved KPI / World Pulse insertion contract. The fuller command-centre specification is not all implemented yet. |
| Campaign library | Composed preview treatment | Local save count, active-history summary, search, empty state, backup guidance and original Load / Export / Delete actions. |
| Campaign setup | Enhanced preview treatment | Four visual sections; existing field IDs, validation and submit path retained. |
| Company | New dossier treatment | Company identity, headquarters, legal status, ownership, cash, opening capital, division and subsidiary summary; contextual links to related workspaces. Browser regression now checks empty and active-campaign states plus data parity. |
| Personal life | Focused supplemental treatment | Founder wellbeing panel and related visual hierarchy; underlying personal-life renderer remains legacy-owned. |
| World | Focused supplemental styling | World panel/card styling; original world renderer and data structure remain unchanged. |
| Global travel | Focused supplemental styling | Travel content, forms, summary and rows receive specific layout treatment; original booking logic remains unchanged. |
| Finance | Partial visual treatment | Shared finance styling and table density improvements; the full finance information-architecture redesign (accounting, treasury, debt/tax, assets, investments and audit sub-workspaces) is still outstanding. |
| Productions | Partial visual treatment | Shared production-page card treatment; project lifecycle and contract renderers remain legacy-owned. |
| Population, geography, phone, digital, generations and world-system surfaces | Shared / limited treatment | Routes are grouped and some receive shared workspace classes; no complete route-specific redesign is claimed. |
| Remaining operational and reference routes | Shared visual system only | Facilities, IP, legal, people, talent, market, media, admin, awards, manual, calendar, distribution, sustainability, governance, integrity, production operations, algorithms and other advanced pages still need dedicated screen work. |
| Developer diagnostics | Reachability preserved | Architecture, integration health, release quality, integrity, algorithms and autonomy still require clearer separation and a deliberate advanced-workspace treatment. |

## Browser coverage

The successful baseline run #943 verified:
- The preview-only shell does not alter the default non-preview mode.
- All 43 runtime navigation destinations activate and receive the correct active-navigation state.
- Overview metrics and World Pulse retain their legacy DOM placement contract.
- Campaign setup can submit, create a campaign and preserve World Pulse.
- Campaign Library and search update from the actual local save register.
- Personal, Travel and Geography routes render their expected engine-owned content.
- Landscape layout checks pass.
- The one-year save round-trip and three-year / 1,095-day cross-phase stress test pass.

The next Company-specific regression adds:
- A no-campaign state with unavailable company facts shown as em dashes, not invented zeros.
- Active campaign company identity, headquarters, legal status, cash and opening capital compared against the existing company renderer.
- Contextual navigation to Finance and back to Company.

**Coverage boundary:** the 43-route loop checks route activation and `aria-current`; it does not deeply test every route's domain actions, empty/loading/error states, keyboard flows, save behavior or visual composition. Each operational screen still needs its own contract and targeted QA.

## Remaining migration order

1. Company — dossier and related-workspace navigation (current work).
2. Finance — statement navigation, ledger/journal, invoices, debt/tax, fixed assets, FX, treasury, investments and audit.
3. Productions and Production Operations — project stages, stage gates, contracts, call sheets, crew, locations, incidents and delivery.
4. People and Talent — searchable registers, contracts, availability, audition/casting and dossiers.
5. IP, Distribution, Media, Digital Life, Legal, Governance and Awards.
6. World, Population, Geography, Travel, Market and Competitors.
7. Facilities, Sustainability, Technology, Generations and Personal Life.
8. Calendar, Manual, Sandbox, Algorithms and advanced diagnostics.

## Release gates

- Keep the preview opt-in until each screen in the current migration slice has route-specific browser QA.
- Retain the existing engine renderers, campaign schema, local save paths and PWA/static hosting.
- Do not label a screen complete based only on route reachability or shared CSS.
- Run the complete browser, engine, save/load, PWA/offline and 1,095-day integration regressions after each material migration slice.
- Do not merge to `main` until the planned screen scope has been reviewed and the user explicitly authorizes the merge.
