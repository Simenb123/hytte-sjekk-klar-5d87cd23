# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/97756950-3c85-41a4-94ae-a14ccf690d68

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/97756950-3c85-41a4-94ae-a14ccf690d68) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Weather data caching

The app stores the last successful weather forecast in `localStorage` for 30 minutes.
Use the refresh icon in the weather view to clear this cache and fetch new data from YR.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/97756950-3c85-41a4-94ae-a14ccf690d68) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Lokal Supabase-utvikling

For å utvikle og teste Edge Functions lokalt brukes [Supabase CLI](https://supabase.com/docs/guides/cli). Installer den globalt med npm:

```sh
npm install -g supabase
```

Når CLI-en er installert logger du inn og kobler den mot prosjektet ditt:

```sh
supabase login
supabase link --project-ref <PROJECT_ID>
```

Deretter kan du starte den lokale instansen (database og Edge Runtime) med:

```sh
supabase start
```

### Miljøvariabler

Edge Functions forventer flere hemmeligheter. Disse lagres i Supabase med `supabase secrets set`:

```sh
supabase secrets set OPENAI_API_KEY=<din-openai-nøkkel> \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-nøkkel> \
  SUPABASE_URL=http://localhost:54321 \
  SUPABASE_ANON_KEY=<anon-nøkkel> \
  GOOGLE_CLIENT_ID=<google-klient-id> \
  GOOGLE_CLIENT_SECRET=<google-klient-secret>
```

### Kjøre Edge Functions lokalt

Med `supabase start` kjørende kan du teste en funksjon slik:

```sh
supabase functions serve ai-helper
```

Dette bygger funksjonen og gjør den tilgjengelig på `http://localhost:54321/functions/v1/ai-helper`.

### Gi AI-hjelperen tilgang til dokumenter

Følg disse stegene for å sikre at AI-hjelperen kan lese fra hyttedokumentene:

1. Kjør migrasjonene i `supabase/migrations` mot ditt Supabase-prosjekt.
2. RLS-policyene som tillater autentiserte brukere å lese `cabin_documents` aktiveres av migrasjonene.
3. Logg inn i appen og åpne **Dokumenter** for å laste opp eller redigere manualer og guider.
4. Når du bruker AI-hjelperen, sendes innlogget brukers token automatisk til edge-funksjonen. Sørg derfor for at du er innlogget.
5. Test ved å spørre AI-hjelperen om et dokument, f.eks. _"Hvordan bruker jeg boblebadet?"_

Se også [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for en mer detaljert
steg-for-steg-guide til Supabase-oppsettet.

## Kjør tester

Prosjektet bruker [Vitest](https://vitest.dev/) for enhets­t­ester. Installer avhengigheter og kjør:

```sh
npm install
npm test
```

Dette vil kjøre alle testfilene under `src` og `supabase`.
