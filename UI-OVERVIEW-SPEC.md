# THE STUDIO — Executive overview redesign specification
Branch: ui/complete-interface-redesign
Status: design specification; no production page markup changed.

## 1. Purpose

The Overview is the player's operating desk. It must answer five questions within seconds:
1. What company and campaign am I running?
2. What is happening right now?
3. What needs my attention?
4. What is the state of my productions and finances?
5. What happens if I advance time?

This is a text-first command centre. It is not a 3D lobby and not a wall of interchangeable metric cards.

## 2. Page structure

### A. Global context header
Persistent across workspaces:
- THE STUDIO identity and current company name.
- Campaign date and simulation day.
- Real clock state: running, paused, frozen or blocked.
- Configured in-game-day duration.
- Save state and last successful save.
- Global search / command palette.
- Notifications and decision inbox count.

The header must not claim a clock is paused when it is running. The clock copy issue in UI-CONTENT-AND-UX-ISSUES.md must be resolved.

### B. Executive briefing
A strong editorial heading:
- "Good morning" or time-neutral alternative based on in-game clock.
- Company name, headquarters and current industry era.
- One short generated briefing based only on actual events/conditions.
- If there are no meaningful changes, say so rather than inventing a narrative.

### C. Operating indicators
Use a compact horizontal strip, not oversized cards:
- Company cash (active.company.cash).
- Active project count (active.projects; define active status from actual stage/state before using).
- Active employee count (active.employees with current contract status; reuse the existing calculation).
- Campaign date / simulation day.
- Company reputation and market share only if initialized and meaningful.
- Debt, upcoming cash commitments or other risk signals only when backed by current accounting records.

Every indicator needs:
- value and unit/currency,
- source date or "as of" label,
- context/trend only when historical data exists,
- click-through to the source workspace.

Do not show invented revenue, profit, valuation or reputation trends.

### D. Attention / decisions
The most important section:
- Player-intervenable situations from StudioNPCDecisionConsequences.observe(date).
- Pending scheduled events and deadlines.
- Upcoming production contract payments and production operations.
- Mandatory financial obligations, unpaid invoices, overdue settlements and cash sufficiency warnings where the engine provides them.
- Legal and insurance deadlines if actual due-date fields exist.
- Weather/hazard impacts only when the world engine reports an active hazard.

Each item includes:
- severity / urgency,
- event date and due date where known,
- affected person/project/company/region,
- short explanation,
- consequence or cost preview when the engine exposes one,
- direct action or route link,
- dismiss/ignore only where supported by the source engine.

Do not treat every NPC event as a quest. The existing player-experience layer explicitly supports observation without intervention.

### E. Production portfolio
A compact table/list with:
- Project title and format/genre.
- Current stage (use the actual stages).
- Approved budget and committed/spent amount only if the exact fields are reconciled.
- Next milestone/date if present.
- Schedule delay / operational risk where present.
- Release performance when available.
- Open project action.

Default sort: urgent risk / next milestone, then stage; allow player sorting. Never imply a project is on schedule if no schedule data exists.

### F. Financial pulse
Use a concise management summary:
- Cash balance.
- Income, expenses and operating result for a clearly defined accounting period (derive from the existing double-entry journal).
- Debt outstanding.
- Receivables and payables / upcoming settlement obligations.
- Balance-sheet reconciliation status.
- Optional compact cash history only if stored history supports it.

The overview must not replace Finance. It is a quick interpretation and drill-down point.

### G. Industry and world pulse
A compact, text-led feed with tabs or filters:
- Industry market news (fictional simulation events clearly labelled).
- Macro conditions and market movement.
- Competitor activity.
- Media coverage and sentiment.
- Regional weather/hazards affecting current operations.
- Significant world events and public-safety incidents.

Each item must carry its date, source system and region/entity. Do not present fictional market events as live real-world news.

### H. Recent activity
Chronological event log from active.events:
- Date,
- event description,
- related entity if the event record contains one,
- category/severity only if present,
- click-through only when a stable related record exists.

### I. Time controls
Keep explicit but secondary:
- Pause/resume.
- Speed selector using the actual supported values.
- Manual advance one day / week / month / year.
- Long-advance progress state and cancellation behavior only if supported.
- Clear warning that automatic clock and manual advance both process the simulation and can trigger obligations.

Never put the one-year advance next to the primary create-project action as an equally prominent action.

## 3. No-campaign state

When there is no active campaign, Overview becomes an intentional welcome screen:
- Explain what THE STUDIO simulates in concise language.
- Primary action: Create campaign.
- Secondary action: Load / import campaign.
- Explain local browser saves and backup responsibility.
- Explain that the game is text-first and the simulation runs on the selected campaign timeline.
- No fake KPI values, dummy projects, fake staff, simulated news or fabricated activity.

## 4. Active-campaign state

When a campaign exists:
- Prioritize decisions and immediate operational risks over vanity statistics.
- Make the top viewport useful without scrolling.
- Keep long tables, logs and full reports in dedicated workspaces.
- Support compact and comfortable density settings.
- Preserve the player's selected campaign and scroll position on navigation return.

## 5. Interaction contracts

Every clickable indicator opens the relevant workspace with context preserved:
- Cash / accounting → Finance.
- Project count / project row → Productions.
- Employees → People.
- Clock/date → World Clock / Calendar.
- Company identity → Company.
- Market indicator → Market / Economy.
- Situation → Life & Events.
- Weather alert → World Engine / World Systems.
- Distribution/rights alert → Distribution / IP.
- Legal obligation → Legal.

Every quick action calls an existing simulation API. Do not implement a parallel version of project creation, hiring, payments, time advance, or campaign save.

## 6. Layout direction

Desktop/large landscape:
- Main column: executive briefing, attention queue, production portfolio.
- Secondary rail: finance pulse, industry/world pulse, calendar preview.
- Recent activity as a lower full-width stream.
- Persistent top command bar and grouped left navigation.

Handheld landscape:
- Keep the navigation rail compact and scrollable.
- Use a two-column workspace only where text remains legible.
- Convert production portfolio and attention queue to stacked compact rows.
- Keep quick actions in a contextual action menu instead of wrapping into multiple rows.
- Avoid tiny 4-column metric cards on narrow landscape widths.

## 7. Typography and editorial hierarchy

- Briefing headline: expressive but restrained.
- Section titles: concise, consistent and scannable.
- Metric labels: small but readable, never all-caps-only.
- Financial figures: tabular numerals, aligned decimals, currency shown.
- Narrative copy: normal sentence case, comfortable line length.
- System metadata: subdued but accessible contrast.
- Critical warnings: text label + icon + colour; never colour alone.

## 8. Quality gates

- New campaign welcome state has no fake data.
- Active campaign values reconcile with the source pages.
- Clock state and speed exactly match runtime.
- Situation actions create the same persistent decision history as existing behavior.
- Production links open the correct project.
- Financial summaries reconcile with journal-derived Finance values.
- No overview render mutates campaign state.
- No full global rerender is required to update one overview panel.
- All actions work by mouse, touch and keyboard.
- Desktop landscape and handheld landscape screenshots pass visual review.
- Existing campaign saves remain byte-compatible or migrate only through the existing versioned save path.
