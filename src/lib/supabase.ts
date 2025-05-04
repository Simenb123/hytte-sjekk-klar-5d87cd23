
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oztvpaviseudhobxmzgi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dHZwYXZpc2V1ZGhvYnhtemdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Njg0MTQsImV4cCI6MjA2MDI0NDQxNH0.t7fko5PqHOr5cXI0pnDEvKP4RYfEVgKr9Hn5ufiXS80';

export const supabase = createClient(supabaseUrl, supabaseKey);
