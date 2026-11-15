# THE STUDIO

A film and entertainment company simulation game.

## Project baseline

- Game version: 4.20.0
- Engine versions: Phase 6 Ecosystem 6.1.0; Phase 6 Audience version is reported by its runtime module
- Completed development phases: 0–5
- Phase 6: core ecosystem systems implemented; final audit and regression closure in progress
- Active development phase: Phase 6 — Entertainment Ecosystem
- Production: https://neortox.github.io/the-studio-simulator/

## Phase 6 scope

The Entertainment Ecosystem models the commercial and cultural life of released content across film, television, animation, music and games. Current systems cover distribution agreements and rights windows, negotiation and minimum guarantees, theatrical releases and box office, streaming/broadcast partner economics, marketing analytics, audience segments, fan communities, critic reviews, merchandise, and intellectual-property royalties. Phase 6 also links to the existing media and awards areas of the application; those areas still require their own end-to-end feature audit before the phase can be marked complete.

Phase 6 is still in progress. Its daily ecosystem and audience processors are explicitly orchestrated by the cross-phase pipeline. Revenue posting, box-office receipts, platform statements, merchandise reversals, and royalty settlements include retry handling. The phase is not complete until all financial failure-path, browser, integration, save-compatibility, and multi-year tests pass, and the media/awards surfaces are audited.

## Deployment

- Source branch: `main`
- Hosting: GitHub Pages
- Production URL: https://neortox.github.io/the-studio-simulator/
- Regression and browser QA: GitHub Actions

## Source of truth

This repository holds the application source, engines, static assets, tests, and roadmap documentation. Shared systems such as the simulation clock, finance ledger, campaign calendar, production projects and company records must be reused rather than duplicated by individual phases.

## Release policy

Production deployments must pass the existing engine, browser, save/load, integration, and multi-year simulation checks. Preserve existing saves and the current production build until a candidate passes verification.
