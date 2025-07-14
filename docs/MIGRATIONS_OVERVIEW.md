# Oversikt over migrasjonsfiler

Denne filen oppsummerer hva hver SQL‑migrasjon i `supabase/migrations` gjør. Migrasjonene er sortert etter filnavn (tidsstempel) slik de typisk blir kjørt av Supabase CLI.

## Beskrivelse per migrasjon

- **20250615012015_3ac993ef-d00a-431e-8815-91b95f60309f.sql** – Utvider `checklist_items` med feltene `category` og `season`, gjør `type`-kolonnen valgfri før den til slutt slettes. Tømmer gamle sjekklister og fyller inn en ny standardliste med oppgaver.
- **20250615042412_ac70d699-6c6c-41f9-a950-04a9f8fc97de.sql** – Legger til ekstra kolonner på `inventory_items` (merke, farge, plassering m.m.). Forutsetter at tabellen allerede finnes.
- **20250615152017_create_inventory_items_table.sql** – Oppretter `inventory_items`, `item_images` og `owner_assignments` med tilhørende RLS-policyer samt bøtten `inventory_images`.
- **20250615164522_add_inventory_images_bucket.sql** – Sikrer at bøtten `inventory_images` finnes og (re)oppretter policyene for opplasting og lesing.
- **20250615180256_add_inventory_category.sql** – Legger til `category`-kolonne i `inventory_items` og setter eksisterende rader til standardkategorien «Klær».
- **20250616010136_ddabcb56-ea96-4a17-9c8f-c385412038cc.sql** – Introduserer `family_members` og `task_assignments` samt koblinger til sjekklister og inventar. Inkluderer RLS-policyer.
- **20250618181733_add_checklist_items_policies.sql** – Aktiverer RLS på `checklist_items` og definerer policyer for autentiserte brukere.
- **20250619071325_1e0b59ab-7dba-4128-bac4-0047e8317a09.sql** – Oppretter tabellen `booking_family_members` for å knytte familiemedlemmer til bookinger med tilhørende policyer.
- **20250619090700_create_notifications_table.sql** – Lager `notifications`-tabellen for varsler til brukerne med nødvendige policyer og indekser.
- **20250620110624_8e8411fd-4bba-474d-86c7-377f46e1c4b7.sql** – Oppretter `cabin_documents`, funksjonen `search_cabin_documents` og legger inn eksempeldokumenter.
- **20250622120000_add_summary_to_cabin_documents.sql** – Legger til `summary`-kolonne, oppdaterer søkefunksjonen og fyller inn sammendrag for eksisterende dokumenter.
- **20250622121500_rls_fixes.sql** – Strammer inn RLS på `inventory_items` slik at bare eieren ser sine egne poster.
- **20250622133000_create_hyttebok_entries.sql** – Lager `hyttebok_entries` (digital gjestebok) med RLS-policyer.
- **20250623120000_add_document_files_bucket.sql** – Oppretter lagringsbøtten `document_files` for vedlagte filer og policyer for tilgang.
- **20250623121500_add_booking_id_to_completion_logs.sql** – Legger til `booking_id` på `completion_logs` for å koble sjekklister til bookinger.
- **20250624100000_ensure_hyttebok_text_column.sql** – Sikrer at `hyttebok_entries` har kolonnen `content` (bruker `ADD COLUMN IF NOT EXISTS`).

## Vurdering av duplikater og overflødige filer

- **20250615164522_add_inventory_images_bucket.sql** har lignende innhold som i `create_inventory_items_table.sql`, men brukes for å sikre at lagringsbøtten og policyene finnes. Denne kan anses som overflødig dersom man alltid kjører den første migrasjonen.
- **20250624100000_ensure_hyttebok_text_column.sql** tilfører en kolonne som allerede opprettes i `create_hyttebok_entries.sql`. Den er dermed unødvendig hvis tabellen ikke endres andre steder.
- Migrasjonen **20250615042412_ac70d699-6c6c-41f9-a950-04a9f8fc97de.sql** forutsetter at `inventory_items` allerede er opprettet, men tabellen opprettes først i en senere fil. Filene bør i utgangspunktet kjøres i motsatt rekkefølge for å unngå feil.

Ellers henger de øvrige migrasjonene sammen med funksjonaliteten i appen og ser ut til å være relevante.
