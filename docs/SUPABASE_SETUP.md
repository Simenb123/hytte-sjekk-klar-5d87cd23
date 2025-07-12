# Setting up Supabase for Cabin Documents

This guide explains how to configure Supabase so the AI helper can read uploaded cabin documents. The steps assume you have the Supabase CLI installed.

1. **Link to the project**
   ```sh
   supabase login
   supabase link --project-ref <PROJECT_ID>
   ```
   Replace `<PROJECT_ID>` with your project ID from the Supabase dashboard.

2. **Apply migrations**
   Run the SQL migrations located in `supabase/migrations`. Each file is named
   using the pattern `YYYYMMDDHHMMSS_description.sql`, for example
   `20250615132216_initial.sql`.
   ```sh
   supabase db push
   ```
   This creates the `cabin_documents` table, the `search_cabin_documents` RPC function, and required RLS policies.

3. **Set secrets for edge functions**
   ```sh
  supabase secrets set OPENAI_API_KEY=<your-openai-key> \
    SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
    SUPABASE_URL=http://localhost:54321 \
    SUPABASE_ANON_KEY=<anon-key> \
    GOOGLE_CLIENT_ID=<google-client-id> \
    GOOGLE_CLIENT_SECRET=<google-client-secret> \
    SEARCH_API_KEY=<your-search-key> \
    SEARCH_API_URL=https://api.bing.microsoft.com/v7.0/search
  ```

4. **Start local Supabase and test**
   ```sh
   supabase start
   supabase functions serve ai-helper
   ```
   Visit `http://localhost:54321/functions/v1/ai-helper` to confirm the function can fetch documents. Make sure you are signed in when invoking the function so the RLS policies allow access.

5. **Upload or edit documents**
   In the application, open **Dokumenter** after logging in. Upload manuals and guides or edit the sample documents that were added by the migration.

6. **Query documents using the AI helper**
   When you chat with the AI, it will automatically search `cabin_documents` for relevant text using the current user's token. Try asking questions like:
   "Hvordan bruker jeg boblebadet?"

If the assistant reports that it cannot find the documents, double‑check that the migrations were applied and that you are logged in.
