-- Add SLA notification tracking columns to tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS sla_notified_breach boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sla_notified_warning boolean DEFAULT false;

-- Add notifications table if not exists (it may already exist)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  category text DEFAULT 'GENERAL',
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'users_read_own_notifications'
  ) THEN
    CREATE POLICY "users_read_own_notifications" ON notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: service role can insert notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'service_insert_notifications'
  ) THEN
    CREATE POLICY "service_insert_notifications" ON notifications
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- pg_cron: run sla-checker every 15 minutes (requires pg_cron extension)
-- Run this manually in Supabase SQL editor after enabling pg_cron extension:
-- SELECT cron.schedule('sla-check', '*/15 * * * *', $$
--   SELECT net.http_post(
--     url := current_setting('app.supabase_url') || '/functions/v1/sla-checker',
--     headers := '{"Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
-- $$);
