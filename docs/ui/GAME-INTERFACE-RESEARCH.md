# THE STUDIO — Native game interface research and design decisions

Date: 20 November 2026  
Implementation branch: `ui/full-native-game-interface-rebuild`

## Purpose

Replace the existing web-dashboard presentation with a game-first interface for a persistent life, world-travel and entertainment-enterprise simulation. This is not a cosmetic CSS pass. The application shell, startup flow, navigation model, screen framing and mobile interaction model are being rebuilt while preserving the existing simulation runtime and save model.

## Benchmark research

### Football Manager Mobile (2026)

Official Sports Interactive interface guidance describes a responsive side-menu / bottom-menu model, a persistent title bar with current date and continue action, and object-focused screens divided into sections. The action bar stays available for the actions relevant to the current screen. Its home dashboard adapts information density to screen size.

**Adopt for THE STUDIO**
- Desktop side navigation and mobile bottom navigation with access to the same workspaces.
- Persistent simulation date/status in the title area.
- Screen-level sections and focused object dossiers rather than a giant undifferentiated page.
- Contextual action bars for consequential actions as later workspace slices are migrated.

Source: https://community.sports-interactive.com/sigames-manual/football-manager-mobile-2026/the-interface-r5245/

### The Sims Mobile / The Sims 4

The Sims Mobile design case study describes using a clear visual hierarchy and player-type-aware presentation, with sketching, flow mapping, prototyping and user testing before implementation. The Sims design portfolio documents work on the mobile interface, world map and main menu.

**Adopt for THE STUDIO**
- Distinct life, world and enterprise identities inside one coherent visual system.
- A deliberate main menu and world-entry flow.
- Strong character, relationship and place dossiers.
- Prototype and test complete player journeys, not isolated components.

Sources:
- https://www.alisterlee.com/work/the-sims-mobile-2ct5x
- https://hillaryproctordesign.com/projects/the-sims

### SimCity BuildIt

EA's development retrospective explains that the team preserved the open-ended city-simulation identity while redesigning controls and interaction patterns for touch-first mobile use, iterating through design dilemmas and player feedback.

**Adopt for THE STUDIO**
- Mobile is a first-class layout, not desktop navigation compressed into a narrow viewport.
- Touch targets, screen-specific controls and progressive disclosure.
- Keep high-value simulation information visible while secondary systems are accessed through dedicated workspaces.

Source: https://www.ea.com/amp/news/taking-simcity-to-mobile

### Management-simulation UX research

A peer-reviewed study focused on mobile management-simulation UI notes that these games present many kinds of information and menus on small screens, making screen composition and interaction design central to accessibility and usability.

**Adopt for THE STUDIO**
- Make the first screen calm and decision-oriented.
- Split complex domains into named sections and drill-downs.
- Avoid putting every simulation subsystem on one long mobile page.

Source: https://kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002232667

### Two Point Campus

The game interface separates the world/career overview from the active campus-management view. In the active management view, frequent controls, time speed and status information are kept close to the play area while deeper management functions remain accessible from grouped menus.

**Adopt for THE STUDIO**
- Separate the startup / world-selection layer from active campaign play.
- Keep simulation controls and critical status close to the current workspace.
- Group specialist management screens rather than exposing all of them at once.

Reference overview: https://two-point-campus.fandom.com/wiki/Interface

## Product-specific design decisions

1. **Startup:** a dedicated main menu with Continue, New Campaign, Load Campaign and Advanced Systems. No fake settings or store buttons.
2. **Loading:** a short branded boot state before the main menu; later asset loading can extend it when real assets exist.
3. **Gameplay shell:** a persistent game HUD and screen title, with the active workspace occupying the main screen area.
4. **Desktop:** persistent grouped side navigation.
5. **Mobile portrait and landscape:** bottom navigation for primary destinations plus a slide-out workspace drawer for the complete route list. No forced rotate-to-landscape interstitial.
6. **Workspace taxonomy:** Command, Life, World & Travel, Studio, Empire and Advanced Systems.
7. **Legacy compatibility:** preserve all existing page IDs, inline action handlers, modal/toast hosts, engine script order, campaign schema and local save keys during this shell replacement.
8. **No simulated features:** new controls must map to existing actions. Unimplemented mechanics remain clearly unavailable.
9. **Progressive migration:** the shell is a first slice. Finance, production, people, travel, market and other complex workspaces still require bespoke information architecture and action-level QA.
10. **Quality gates:** route reachability alone is insufficient. Browser tests must cover startup, navigation, portrait mobile, landscape mobile, overflow, and the continued presence of critical legacy action hosts; domain-specific tests continue to validate engine behaviour.

## Explicit non-goals

- No change to simulation economics, NPC behaviour, time progression, production calculations or campaign save schema.
- No dependency on Vercel.
- No decorative 3D world scene until a real, performant renderer and assets exist.
- No wholesale deletion of the existing engine-owned screen content in this first migration slice.
