# THE STUDIO

A film and entertainment company simulation game.

## Project baseline

- Game version: 4.21.0
- Engine versions: Phase 6 Ecosystem 6.1.0; Phase 6 Audience version is reported by its runtime module
- Completed development phases: 0–7
- Phase 6: Entertainment ecosystem — complete; financial retries, media, awards and multi-year integration verified
- Phase 7: Smartphone & media — complete; app catalog, social creators, personalized feeds, daily engagement, digital advertising and save persistence verified
- Active development phase: Phase 8 — Financial empire
- Production: https://neortox.github.io/the-studio-simulator/

## Phase 6 scope

The Entertainment Ecosystem models the commercial and cultural life of released content across film, television, animation, music and games. Current systems cover distribution agreements and rights windows, negotiation and minimum guarantees, theatrical releases and box office, streaming/broadcast partner economics, marketing analytics, audience segments, fan communities, critic reviews, merchandise, and intellectual-property royalties. Phase 6 also links to the existing media and awards areas of the application; those areas still require their own end-to-end feature audit before the phase can be marked complete.

Phase 6 is still in progress. Its daily ecosystem and audience processors are explicitly orchestrated by the cross-phase pipeline. Revenue posting, box-office receipts, platform statements, merchandise reversals, and royalty settlements include retry handling. The phase is not complete until all financial failure-path, browser, integration, save-compatibility, and multi-year tests pass, and the media/awards surfaces are audited.

## Phase 7 — Smartphone & media

The Studio One smartphone runs StudioOS and includes an installable app catalog: StudioSphere, ReelLoop, CineWire, PlayGrid, SoundWave, Streamline, MarketPulse and CreatorHub. App installation and removal update device storage and persist with the campaign.

The social layer supports creator profiles with unique handles, publishing to installed platforms, audience preferences and relevance/freshness/engagement-based feed ranking. Daily simulation generates industry news and studio updates from Phase 6 releases and media coverage, calculates platform impressions and engagement, builds topic trends, grows creator audiences and produces daily notifications.

Digital advertising campaigns track budget, CPM, impressions, clicks, conversions and bounded spend. Smartphone state is versioned and serialized in the campaign save. Phase 7 is processed inside the existing daily Phase 6 ecosystem call and is required by the cross-phase integration end-of-day gate.

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
