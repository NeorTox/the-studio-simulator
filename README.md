# THE STUDIO

A film and entertainment company simulation game.

## Project baseline

- Game version: 4.19.0
- Completed development phases: 0–3
- Next roadmap phase: Phase 4 — Company Management
- Production: https://neortox.github.io/the-studio-simulator/

## Deployment

- Source branch: `main`
- Hosting: Vercel Git integration
- Build output: `dist/`
- Static build copies the application entry point, engines, manifest, icon, and service worker into the deployment output.
- Production must not be promoted until the candidate deployment passes asset, route, and application smoke checks.

## Source of truth

This repository is intended to hold the complete application source, engines, static assets, tests, and roadmap documentation. Do not treat this bootstrap README as a complete game import or as a production release.

## Release policy

Production deployments must be tested against the existing regression, browser, save/load, and campaign simulation checks before release. Preserve existing saves and the current production build until a candidate passes verification.
