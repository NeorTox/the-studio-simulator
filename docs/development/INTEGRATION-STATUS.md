# THE STUDIO — Integration status

## Current source branches

- Production baseline: `main`
- Active game-interface candidate: `ui/game-interface-overhaul`
- Repository cleanup: `chore/repository-cleanup` (this branch)
- Active interface pull request: [#53](https://github.com/NeorTox/the-studio-simulator/pull/53)

## Latest candidate regression

The UI candidate's latest full regression run (GitHub Actions run 44531728153, commit `d997491264413b260bbd02c74818369f666fa81d`) did **not** pass overall.

Verified passing groups included the new UI browser QA, player-experience browser QA, simulation-depth runtime QA, individual phase checks, and the three-year cross-phase stress test (1,095 daily ticks, 7,665 scheduled tasks, and a 61-check integration audit with zero failures).

The run failed in the Phase 3 end-to-end year-advance test. It started on 2026-11-14 and stopped on 2026-12-14 after advancing only 30 of the requested 365 days. The subsequent one-year recurring-finance, save/export/import, and legacy migration assertions were not reached. They must not be reported as passed by this run.

The repository-cleanup branch regression (run 44533769318, commit `c35ee953a0e1335b3fef4e33e36d3ae05c69b56c`) repeated the same Phase 3 year-advance failure. Its engine/finance checks, UI browser QA, player-experience QA, world-system runtime checks, all individual phase tests, and the three-year integration stress test passed. The workflow's final one-year save-round-trip reporting step failed because the earlier Phase 3 year-advance step had already failed; it is not a separate save-round-trip failure.

## Integration principles

- Keep one authoritative simulation clock, finance ledger, campaign calendar, production registry, and company record.
- Preserve campaign saves and existing schema migrations.
- Treat independent engine tests, browser tests, save/load tests, and multi-year integration tests as separate evidence.
- A passing subset does not make a failed workflow a passing release.
- Do not deploy the candidate until the full required regression and Pages build pass.

## NPC and population scope

The dedicated NPC and media QA fixtures materialize 25,000 named NPCs total, not 25,000 per region. Larger populations are represented partly through regional aggregate records.

## Hosting

GitHub Pages remains the production hosting target. No Vercel deployment or hosting migration is part of this work.
