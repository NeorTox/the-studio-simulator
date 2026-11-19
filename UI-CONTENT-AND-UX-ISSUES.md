# THE STUDIO — UI copy and interaction inconsistencies
Branch: ui/complete-interface-redesign
Audit scope: current index.html and player-facing time controls.
This is a source-level review, not a claim that the issue has been reproduced in a live browser.

## 1. Simulation clock wording conflicts with runtime behavior

### Runtime facts
- loadClock() uses 180,000 ms (3 minutes) as its default in-game day duration.
- loadClock() sets c.running = true when the running field is not already a boolean.
- loadClock() forces c.running = false only when active.clockFrozen is true.
- The application installs setInterval(tickClock, 1000).
- tickClock() accumulates elapsed wall-clock time and calls advance() when a full in-game day is due, provided the clock is running and not frozen.
- Supported day durations are 30,000, 60,000, 90,000, 180,000, 300,000 and 600,000 ms (0.5, 1, 1.5, 3, 5 and 10 real minutes per in-game day).
- The clock UI exposes pause/resume and configurable speed.

### Conflicting player-facing copy
- World Clock describes a continuous simulation and a default of one in-game day per three real minutes.
- Calendar says: "Time never advances automatically."
- New campaign creation ends with the toast: "Simulation remains paused."
- setClock() displays "One day = three real minutes" when resuming, even though the player can choose other supported speeds.

### Required correction
Do not alter simulation behavior as part of UI styling. In the redesign:
- Display the real current clock state (RUNNING / PAUSED / FROZEN / BLOCKED).
- Display the actual configured speed, not a hard-coded 3-minute claim.
- Clearly explain automatic progression, manual advance actions, offline catch-up cap and cash-obligation pause behavior.
- Reconcile stale copy in Calendar and campaign creation after confirming intended product behavior.
- Add browser tests for a new campaign, default clock state, pause, resume, speed change, offline catch-up and cash-obligation block.

## 2. Information density and hierarchy

Current screens often place multiple unrelated operational systems in one long page. Finance is the clearest example: ledger, accounting journal, trial balance, invoices, fixed assets, debt, tax, FX, treasury, portfolio and institutional capital are stacked vertically.

Recommended treatment:
- Keep a finance overview with high-level cash and risk signals.
- Use sub-navigation for Accounting, Treasury, Debt & Tax, Assets, Investments and Audit.
- Preserve every existing panel and action; move presentation only.
- Provide clear labels, filters, totals and drill-down links.
- Keep the full general ledger and journal accessible without forcing them to dominate the first viewport.

The Market page similarly combines macroeconomic indicators, genre demand, equities, treasury trading, competitors, labour and rival operations. Give these distinct tabs/workspaces with a shared market summary.

## 3. Long-form forms

The campaign creation form is very long and combines:
- world date and difficulty,
- founder identity and biography,
- nine founder attributes,
- company structure,
- currency and starting capital,
- headquarters and ambition.

Redesign it as a guided multi-step flow with a persistent summary and validation, but preserve all existing field IDs or provide a tested adapter. Do not silently remove fields or change default values. Allow review before campaign creation and make currency/company/personal money separation explicit.

## 4. Player-facing versus developer-facing content

The application includes player-facing workspaces and developer diagnostics in the same navigation system. Architecture, integration health, release quality, integrity and algorithm calibration are valuable but should not compete with ordinary studio management navigation.

Proposed separation:
- Player workspace: Overview, Studio, Productions, People, Finance, Market, World, Media, Digital Life, Personal, Calendar and Decisions.
- Advanced / diagnostics: Architecture, Integration Health, Release QA, Integrity, Algorithm Calibration, Autonomy and Engine Audits.
- Sandbox remains player-accessible but visually distinct because cheats can permanently disable achievements.

Do not delete diagnostics or hide them without a reliable path.

## 5. Text-first opportunity

The current application already contains useful text-heavy systems: event histories, legal registers, board resolutions, project stage descriptions, journal lines, NPC biographies, media coverage, situation descriptions and audit results.

The redesign should elevate these into deliberate editorial components:
- event reports with timestamp, source, affected entity and consequence;
- decision briefs with context, options, cost, uncertainty and delayed effects;
- character dossiers with biography, current state and relationship history;
- project briefs with creative premise, production stage, budget, schedule and delivery risk;
- financial statements with clear accounting period, currency and audit trail;
- world dispatches with region, severity, weather and operational impact.

## 6. 3D and text separation

3D is optional and should only appear where spatial context is useful. It must not displace the text-based reports and decisions that are the core of the game. Any 3D scene needs a static fallback and must be unloadable without losing the player's context.

## 7. Severity

- High: clock wording and state presentation must be accurate because it affects the player's understanding of time and campaign progression.
- High: preserve save, accounting, production and autonomous simulation behavior while changing presentation.
- Medium: finance and market information architecture is too vertically stacked for efficient use.
- Medium: long campaign creation flow needs guided structure.
- Medium: diagnostics need separation from routine player workflows.
