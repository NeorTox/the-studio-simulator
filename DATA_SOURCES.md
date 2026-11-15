# THE STUDIO geography data sources

The global geography registry uses the following public datasets:

- **Country and territory identities, ISO alpha-2 keys, capitals, continents, currencies and languages:** [Annexare Countries](https://github.com/annexare/Countries), distributed under the MIT License. Copyright © 2014 Annexare Studio. The upstream MIT notice is retained here by attribution.
- **First-level administrative division names:** [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database), distributed under the Open Database License (ODbL) 1.0. Attribution: dr5hn and contributors. The project reports coverage of approximately 250 country/territory records and more than 5,000 first-level administrative units. The derived names in THE STUDIO are attributed to this source; consult the upstream ODbL terms for database redistribution and share-alike obligations.

## Modeling notes

- The registry includes countries and dependent/special territories as distinct selectable identities where the upstream country dataset supplies them; it is not a claim that all entries are sovereign states or UN members.
- Administrative unit names are normalized into stable game IDs. Upstream naming and boundaries can change; future data refreshes must preserve stable game IDs and include migration checks.
- City travel hubs and airport codes are a curated gameplay subset. Capital names are also available for all country/territory records, but a capital is not automatically a route-capable city until coordinates and a transport hub are supplied.
- Simulation macro-regions are game groupings for climate/population processing, not official geopolitical regions.
- Visa/entry-permit logic and route fares are fictional gameplay systems. They are not real-world immigration guidance, airline schedules, or live prices.
