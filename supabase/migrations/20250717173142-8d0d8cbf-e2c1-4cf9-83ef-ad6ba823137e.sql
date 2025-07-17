-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up daily reminders cron job to run every day at 8:00 AM
SELECT cron.schedule(
  'daily-booking-reminders',
  '0 8 * * *', -- Every day at 8:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://oztvpaviseudhobxmzgi.supabase.co/functions/v1/daily-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dHZwYXZpc2V1ZGhvYnhtemdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY2ODQxNCwiZXhwIjoyMDYwMjQ0NDE0fQ.Bqnpb-k8Cq2KKdJnQfL6vJgMIAJwdwn6Yx6VVZM6_L8"}'::jsonb,
        body:='{"source": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Also set up a manual trigger for 3-day reminders (weekly on Mondays at 9:00 AM)
SELECT cron.schedule(
  'weekly-3day-booking-reminders',
  '0 9 * * 1', -- Every Monday at 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://oztvpaviseudhobxmzgi.supabase.co/functions/v1/booking-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dHZwYXZpc2V1ZGhvYnhtemdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY2ODQxNCwiZXhwIjoyMDYwMjQ0NDE0fQ.Bqnpb-k8Cq2KKdJnQfL6vJgMIAJwdwn6Yx6VVZM6_L8"}'::jsonb,
        body:='{"source": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);