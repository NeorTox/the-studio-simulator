# Simulation stack integration

This branch consolidates the validated autonomous simulation, household economics, NPC decision/consequence, social network, memory/reputation, and global media systems onto the current mainline.

## Verification
The source stack passed GitHub Actions run 43717009295 on commit 2ca4e3e107ac59bd3ccd81aacd07e1c6ee8609b4 (31/31 steps, including Phase 0–13 browser regression and three-year cross-phase stress).

This consolidation is being revalidated against main because the autonomous foundation was previously squash-merged and the later work was developed on stacked branches.

## Known population scope
The dedicated NPC and media QA fixtures materialize 25,000 named NPCs total, not 25,000 per region. Larger populations are represented partly through regional aggregate records.

## Release scope
No deployment, hosting migration, or complete UI overhaul is included. The landscape UI overhaul remains scheduled after simulation systems and integration are stable.
