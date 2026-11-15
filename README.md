# THE STUDIO

A film and entertainment company simulation game.

## Project baseline

- Game version: 4.19.0
- Completed development phases: 0–5
- Active development phase: Phase 6 — Entertainment Ecosystem
- Production: https://neortox.github.io/the-studio-simulator/

## Phase 6 scope

The Entertainment Ecosystem models the commercial and cultural life of released content across film, television, animation, music and games. Current systems cover distribution agreements and rights windows, negotiation and minimum guarantees, theatrical releases and box office, streaming/broadcast partner economics, marketing and publicity, audience segments, fan communities, critic reviews, merchandise, intellectual property royalties, media coverage, awards and festivals.

Phase 6 is not complete until all systems are integrated with Phases 0–5, regression and multi-year simulation checks pass, and save compatibility and deployment are verified.

## Deployment

- Source branch: `main`
- Hosting: GitHub Pages
- Production URL: https://neortox.github.io/the-studio-simulator/
- Regression and browser QA: GitHub Actions

## Source of truth

This repository holds the application source, engines, static assets, tests, and roadmap documentation. Shared systems such as the simulation clock, finance ledger, campaign calendar, production projects and company records must be reused rather than duplicated by individual phases.

## Release policy

Production deployments must pass the existing engine, browser, save/load, integration, and multi-year simulation checks. Preserve existing saves and the current production build until a candidate passes verification.
