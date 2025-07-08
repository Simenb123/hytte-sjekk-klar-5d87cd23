# Foreslått mappestruktur for `src`

Dette prosjektet bruker i dag en blanding av mapper som `components`, `pages` og `hooks`.
For en mer oversiktlig struktur – spesielt når prosjektet skal kjøre i et React
eller Expo miljø – kan mappene organiseres slik:

```
src/
├── assets/           # Bilder, ikoner, fonter og andre statiske ressurser
├── components/       # Gjenbrukbare UI-komponenter
│   └── ui/           # Eksterne UI-komponenter (shadcn o.l.)
├── screens/          # Skjermkomponenter / sider
├── hooks/            # Egendefinerte React hooks
├── utils/            # Generelle hjelpefunksjoner
├── context/          # React context-er
├── services/         # API-kall og annen forretningslogikk
├── models/           # TypeScript-modeller
└── navigation/       # Navigasjonsoppsett (React Navigation/Expo)
```

## Forklaring

- **assets**: Samler alle statiske filer som nå ligger i `public` (f.eks. bilder).
  Disse importeres direkte i React/Expo ved behov.
- **components**: Inneholder små, gjenbrukbare komponenter. Under­mapper kan
  organiseres etter domene, f.eks. `booking/`, `calendar/` osv.
- **screens**: Erstatter dagens `pages`–mappe. Hver fil er en egen skjerm/
  rute og kan kombinere komponenter fra `components`.
- **hooks**: Alle egendefinerte React hooks. Kan evt. deles opp i undermapper
  per domene om det blir mange.
- **utils**: Generelle hjelpefunksjoner som ikke er direkte knyttet til React.
- **context** og **services** beholdes for henholdsvis delte tilstandscontainere og
  API-lag. `navigation` foreslås for å samle navigasjonslogikken om appen kjøres
  i Expo med React Navigation.

Dette opplegget gir en klarere separasjon mellom skjermnivå (screens) og
presentasjonsnivå (components), og gjør det lettere å finne frem i både hooks og
utils. Samtidig samles alle statiske filer i `assets` slik at de er enkle å
importere i både web- og mobilbygget.
