# THE STUDIO — Visual-first rebuild direction
Status: approved direction for the active UI rebuild
Branch: ui/full-native-game-interface-rebuild

## Approved creative direction
- Overall personality: **Hybrid** — cinematic and atmospheric for the world-facing overview, personal life and travel; precise, editorial and professional for studio operations, finance and management.
- Information density: **Balanced** — first-glance clarity with meaningful information visible; deeper detail through deliberate drill-down, not endless scrolling or a wall of identical cards.
- Smartphone: **Real device presentation** — a recognizable handset with its own lock screen, home screen, app launcher, notifications, quick settings and individual app experiences. It is not a responsive webpage titled “Your smartphone”.

## Product principle
Appearance is the primary player-facing development priority. The first impression, visual hierarchy, navigation, typography, spacing, composition, transitions, iconography and feedback must be designed deliberately. Backend complexity is not a substitute for an attractive, understandable and enjoyable game.

## Visual language
- Graphite / ink foundations with warm neutral surfaces and restrained champagne-brass accents.
- Editorial typography and clear typographic scale; tabular numerals for money, dates and metrics.
- Distinct screen compositions by experience: LIFE feels human and personal; WORLD feels spatial, geographic and alive; EMPIRE feels like a premium studio operating environment.
- Use imagery, maps, timelines and charts when they communicate information or atmosphere. Avoid decorative charts, empty graph frames, generic card grids and unnecessary gradients.
- Motion is purposeful: screen transitions, navigation feedback, opening dossiers, notification arrival and meaningful state changes. Respect reduced-motion preferences.
- Balanced density: one clear focal area, supporting context, and progressive disclosure of secondary detail.
- Mobile is intentionally composed for handheld use, not a shrunken desktop view. Touch targets, safe areas, fixed navigation and scroll behaviour must be designed explicitly.

## Smartphone experience contract
The phone is a simulated device within the game world:
1. Lock screen with date/time and notifications.
2. Home screen with wallpaper, status indicators, widgets, app icons and dock.
3. App launcher / app library and individual app screens.
4. Notification shade and quick settings.
5. Device settings with storage, installed apps and device information.
6. Apps must use the existing Phase 7 smartphone engine data and actions. Do not fabricate app content or invent unsupported device capabilities.
7. The handset should be visually recognizable as a device on desktop and remain usable at mobile viewport sizes.

## Screen design contracts
- Overview: cinematic daily briefing with clear priorities, LIFE/WORLD/EMPIRE pulses and real data; not a grid of identical cards.
- LIFE: character-led, warm, timeline-driven and contextual.
- WORLD: map-led and spatial, with clear place/event context and list alternatives.
- EMPIRE: polished business intelligence and studio operations; detailed but legible.
- Production: strong project identity, stage progression, creative brief, schedule and financial status.
- Finance: precise analytical hierarchy, real charts with units, time ranges and source dates; tables remain available.
- Digital life: phone is presented as a handset; digital networks and media remain linked to simulated people, projects and events.

## Quality gates
- No fake metrics, invented live data or decorative empty charts.
- No overlapping labels, clipped controls, horizontal overflow or inaccessible touch targets.
- Every visible control has a working action and clear feedback.
- Desktop, tablet, portrait mobile and landscape mobile are reviewed independently.
- Screenshot review is required, but screenshots alone do not establish functional completeness.
- Preserve campaign saves, existing engine contracts, the 14-phase simulation plan and existing browser/regression checks.
- Keep the pull request open and unmerged until the user explicitly approves.
