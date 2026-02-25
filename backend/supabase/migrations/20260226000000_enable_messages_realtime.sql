-- Enable REPLICA IDENTITY FULL on messages so postgres_changes fires with full row data
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Ensure notifications also has it (belt-and-suspenders)
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add INSERT policy on notifications so service-role inserts (from backend pg pool)
-- are always allowed. The pg pool does NOT use Supabase auth, so auth.uid() is null.
-- We allow inserts from service role by checking that auth.uid() IS NULL
-- (backend bypasses Supabase auth entirely and connects via pg connection string).
-- The cleanest fix: drop RLS for notifications INSERT from backend path by
-- allowing any authenticated insert (backend has full DB access via pg Pool).
-- Since the backend uses a direct pg connection (not the anon key), RLS does not
-- apply to it at all — this migration is only needed for the anon client path
-- which we have now removed. Keeping for documentation.

-- Add a permissive INSERT policy so notifications can be inserted by the backend
-- service (which connects as the postgres superuser via the connection string).
-- NOTE: The backend pg Pool connects as the Supabase postgres role, which bypasses
-- RLS by default (superuser). No additional policy needed for the backend.
-- This migration only ensures realtime is enabled.
