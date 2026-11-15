# THE STUDIO

A film and entertainment company simulation game.

## Project baseline

- Game version: 4.25.0
- Engine versions: Phase 6 Ecosystem 6.1.0; Phase 6 Audience version is reported by its runtime module
- Completed development phases: 0–12; Phase 13 is active
- Phase 6: Entertainment ecosystem — complete; financial retries, media, awards and multi-year integration verified
- Phase 7: Smartphone & media — complete; app catalog, social creators, personalized feeds, daily engagement, digital advertising and save persistence verified
- Phase 10: Autonomous competitors — complete; ten rival studios, autonomous financial/production cycles, bids, acquisitions, market-share dynamics and strategy controls verified
- Phase 11: Technology & sustainability — complete; 12-node technology tree, research labs, patents/licensing, sustainability operations and three-year integration verified
- Active development phase: Phase 13 — Integration & release quality
- Production: https://neortox.github.io/the-studio-simulator/

## Phase 6 scope

The Entertainment Ecosystem models the commercial and cultural life of released content across film, television, animation, music and games. Current systems cover distribution agreements and rights windows, negotiation and minimum guarantees, theatrical releases and box office, streaming/broadcast partner economics, marketing analytics, audience segments, fan communities, critic reviews, merchandise, and intellectual-property royalties. Phase 6 also links to the existing media and awards areas of the application; those areas still require their own end-to-end feature audit before the phase can be marked complete.

Phase 6 is complete. Its daily ecosystem and audience processors are explicitly orchestrated by the cross-phase pipeline. Revenue posting, box-office receipts, platform statements, merchandise reversals, and royalty settlements include retry handling. Media and awards surfaces are included in the end-to-end integration audit.

## Phase 7 — Smartphone & media

The Studio One smartphone runs StudioOS and includes an installable app catalog: StudioSphere, ReelLoop, CineWire, PlayGrid, SoundWave, Streamline, MarketPulse and CreatorHub. App installation and removal update device storage and persist with the campaign.

The social layer supports creator profiles with unique handles, publishing to installed platforms, follow/unfollow, like/unlike reactions, comments, community reporting and moderation decisions. Audience preferences and relevance/freshness/engagement-based ranking drive personalized feeds. Daily simulation generates industry news and studio updates from Phase 6 releases and media coverage, calculates platform impressions and engagement, builds topic trends, grows creator audiences and produces daily notifications.

Creator sponsorship deals track sponsor, creator, CPM, budget, duration and capped creator payouts. Digital advertising campaigns track budget, CPM, impressions, clicks, conversions and bounded spend. Smartphone state is versioned and serialized in the campaign save. Phase 7 is processed inside the existing daily Phase 6 ecosystem call and is required by the cross-phase integration end-of-day gate.

Regression evidence on the Phase 7 candidate:
- Mobile browser QA passed: app installation, creator creation, publishing, ad campaign creation, daily idempotency, personalized feed, integration and save/reload.
- Three-year daily stress test: 1,095/1,095 days include Phase 7; smartphone date synchronized with world date; 500 feed items retained; Phase 7 audit 9 passed / 0 failed.
- Cross-phase audit: 30 passed / 0 failed; all eight implemented phases connected; no simulation errors.

## Deployment

- Source branch: `main`
- Hosting: GitHub Pages
- Production URL: https://neortox.github.io/the-studio-simulator/
- Regression and browser QA: GitHub Actions

## Source of truth

This repository holds the application source, engines, static assets, tests, and roadmap documentation. Shared systems such as the simulation clock, finance ledger, campaign calendar, production projects and company records must be reused rather than duplicated by individual phases.

## Release policy

Production deployments must pass the existing engine, browser, save/load, integration, and multi-year simulation checks. Preserve existing saves and the current production build until a candidate passes verification.


## Phase 8 — Financial empire

Phase 8 adds an institutional capital-management layer to the existing company finance system. Players can establish investment funds, assign fund managers and strategies, acquire private equity, venture capital, corporate and government bonds, real estate, infrastructure and commodities, and liquidate holdings. Purchases and sales post through the existing company ledger and double-entry marketable-investments account.

The daily financial-empire processor deterministically marks active holdings to market, accrues modeled investment income, and distributes accrued income at month end. Treasury reporting includes portfolio cost and market value, unrealized and realized gains, accrued income, liquidity, concentration, leverage and a simulated credit rating. Investment policy controls include risk profile, liquidity reserve target, maximum single exposure and target annual return. All state is stored in the campaign save and checked by the cross-phase integration gate.

Phase 8 is complete. Institutional holdings, policy controls, daily valuation, income accrual, ledger posting, audit and save persistence are covered by browser regression and the three-year cross-phase stress suite.


## Global geography and player travel expansion

The Phase 1 extension adds a shared global geography registry and the first playable worldwide mobility layer:

- 252 country and territory identities with ISO alpha-2/alpha-3 codes where available, continent, capital, currency, languages, parent-territory links and one of the eight simulation macro-regions.
- 5,000+ first-level administrative names sourced from an attributed open dataset. Countries without first-level divisions in that source are explicitly marked as country-level-only/pending rather than silently inventing subdivisions.
- Stable IDs connect administrative divisions, seeded city hubs and campaign locations. The seeded travel network currently includes 126 mapped city hubs across 92 countries. IATA airport codes are used where supplied; other mapped city centres use clearly labeled simulated gateways. Domestic rail/road estimates are available where supported.
- The Travel page supports player location, passport nationality, expiry checks and renewal, simplified in-game entry permits, flight/rail/road route quotes, bookings, hotel tiers, trip expenses through the existing founder personal-finance ledger, transit and arrival processing, and persistent travel history.
- Country geography now resolves into the Phase 1 climate engine. Unknown locations no longer silently default to South Asia.

**Scope note:** This is the foundation, not a fully detailed street-level atlas. Capital names exist across the country registry, but route calculations are enabled only for mapped travel hubs with coordinates and (for flights) airport codes. Visa rules, fares, and durations are fictional game mechanics, not real-world travel information. Additional city, airport, district and neighborhood coverage can be added without changing the country/division IDs.

Data provenance and licensing are documented in DATA_SOURCES.md.


## Phase 9 — Global economy

The global economy expands the existing entertainment-market macro model into eight linked regional economies. Regional GDP and industrial output, inflation, unemployment, consumer confidence, policy rates, fiscal balance, public debt and currency-strength indices evolve daily. Fifteen trade corridors calculate evolving trade-flow and tariff-friction indices. Ten commodity markets track supply, demand, inventory and price indices across energy, industrial materials, critical minerals, agriculture, timber and logistics.

Players can adjust regional monetary/fiscal policy and establish time-limited trade agreements. The model writes global risk, demand, commodity and currency-volatility indicators into the existing market economy state, and the Phase 8 financial-empire valuation reads the global risk signal. Values are fictional simulation indices, not live economic data, exchange rates or forecasts. State is versioned and stored in the campaign save. Phase 9 is complete: its 11-point integrity audit, 45-day browser test, full regression and fresh 1,095-day cross-phase stress test passed on commit 4a252cba879c87877d793b2a5dc4320f30f3a2cd, with all 42 integration checks passing.


## Landscape orientation
The installable app requests landscape orientation. On narrow mobile screens in portrait orientation, the game displays a rotate-device prompt. The complete visual and interaction redesign remains a post-simulation milestone, after Phases 10–13 and their integration are complete.

## Phase 9 verification
- 8 regional economies, 15 trade corridors and 10 commodity markets.
- Regional monetary/fiscal policy and time-limited trade agreements.
- 11/11 Phase 9 integrity checks and 42/42 full integration checks passed.
- Three-year simulation: 1,095/1,095 completed daily pipelines with synchronized global economy and world dates.
- GitHub Pages build and deployment succeeded for the verified code commit.


## Phase 10 — Autonomous competitors

The industry now contains ten autonomous rival studios with distinct headquarters, executives, strategies, reputations, quality, innovation, workforces, cash, debt, valuations and market positions. Rival studios run monthly operating cycles that update cash flow, investment, recruitment, restructuring, production budgets, project progress, releases, acquisitions and insolvency. They generate industry opportunities, submit competing bids, win contracts and publish events to the industry newswire.

The player can set a competitive posture (Balanced, Quality, Price, Innovation or Franchise), investment level, talent-retention target and marketing intensity. Those controls feed the monthly player market-share model. The Competitors dashboard exposes rival profiles, industry opportunities, production pipelines, market concentration and recent events. Competitor state is versioned, persisted in campaign saves and guarded by daily idempotency and end-of-day integration checks.

Phase 10 verification:
- Ten unique competitor studios and deterministic one-year simulation.
- 10/10 competitor integrity checks passed, including financial bounds, project-budget controls, valid bid/contract references, date synchronization and save serialization.
- Browser QA passed for dashboard navigation, competitive strategy submission, 45-day simulation, integration audit and save/reload.
- Three-year cross-phase stress test: 1,095/1,095 daily pipelines include Phase 10; all phases 0–10 connected; synchronized competitor/world dates; zero pipeline errors.
- Full integration audit: 46/46 checks passed.
- GitHub Pages build and production deployment succeeded for the verified Phase 10 release candidate.



## Phase 11 — Technology & sustainability (complete)

The studio now operates a persistent research campus and technology portfolio. Twelve technologies span AI production orchestration, virtual production, cloud and real-time rendering, procedural animation, digital twins, secure distribution, immersive audio and sustainability systems. Research capacity depends on lab level and scientist headcount; funded projects progress deterministically, respect prerequisites and create patents when completed. Patents can be licensed to rival studios for upfront fees and recurring royalties.

Sustainability operations model monthly energy consumption, emissions, water use, waste, renewable share, recycling, water efficiency, utility costs and an ESG score. Players can fund solar and battery infrastructure, efficient lighting/HVAC, water recovery, circular set construction and fleet electrification, and set renewable, recycling, water-efficiency and carbon-offset policies. Research breakthroughs improve environmental performance and publish technology/sustainability indicators into the global market state. Rival studios autonomously adopt technologies over time.

Phase 11 verification:
- Twelve-node technology catalogue, prerequisite unlocks, research budgets, lab upgrades, scientist recruitment and project-capacity controls.
- Patent creation, licensing to rival studios, upfront licence revenue and recurring royalties.
- Five sustainability investment programmes, environmental policy controls and monthly energy/emissions/water/waste/ESG accounting.
- Dedicated Node regression: 12/12 integrity checks passed; three technologies researched, three patents filed, two sustainability programmes completed, one rival licence and royalties settled.
- Playwright browser QA passed: research funding, sustainability investment, policy submission, 45-day simulation, save/reload and landscape PWA verification; Phase 11 audit 12/12 and global integration audit 50/50.
- Three-year cross-phase stress test passed: 1,095/1,095 daily pipelines include Phase 11; all phases 0–11 connected; technology/world dates synchronized; Phase 11 audit 12/12; global integration audit 50/50; zero browser errors.
- GitHub Pages build and production deployment succeeded for the signed-off Phase 11 candidate.



## Phase 12 — Generations & world evolution (complete)

Phase 12 connects long-term family history to the existing Phase 2 population graph. Named NPCs receive bounded generation indices; family records track lineage depth, living members, family heads and legacy scores. When a named NPC dies, the estate system settles their net assets once, distributes inheritance to eligible spouse/children and records a reconciled inheritance ledger. Monthly autonomous family events can create the next generation using deterministic campaign-seeded decisions while respecting the 25,000 named-NPC materialization cap.

Company succession plans score adult NPC candidates using leadership, communication, technical and performance capabilities. Approved appointments update the Phase 4 executive register and company governance history. Rival studios can also change chief executives over long tenures, with leadership transitions recorded. Annual world evolution updates six entertainment-industry indices—globalization, streaming, production technology, audience fragmentation, sustainability and franchise nostalgia—and publishes persistent era/trend snapshots into market state.

Phase 12 verification:
- Dedicated Node regression passed, including inheritance reconciliation, autonomous births, family generation depth, annual world evolution, executive succession, idempotency, integration and save serialization.
- Playwright browser QA passed for the Generations dashboard, successor planning and appointment, 45-day daily processing, integration audit and save/reload; Phase 12 audit 14/14 and global integration audit 53/53.
- Three-year cross-phase stress test passed: 1,095/1,095 daily pipelines include Phase 12; three annual evolution updates completed; campaign, population and generation dates synchronized; all 13 implemented phases connected; zero browser/simulation errors.
- Full regression workflow succeeded on commit `5674497a4104a7caa1fe98142669726854983a43` (run [43701468068](https://github.com/NeorTox/the-studio-simulator/actions/runs/43701468068)); GitHub Pages build and deployment succeeded (run [43701468113](https://github.com/NeorTox/the-studio-simulator/actions/runs/43701468113)).
