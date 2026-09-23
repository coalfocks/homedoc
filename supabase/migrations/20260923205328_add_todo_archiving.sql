-- Archiving hides a todo from active views without changing its status or content.
-- Existing SELECT/UPDATE RLS policies continue to control record access.
SET lock_timeout = '5s';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS archived_at timestamptz;
COMMENT ON COLUMN public.todos.archived_at IS
  'NULL for active todos; timestamp when archived. Clear to restore the original task.';
RESET lock_timeout;
