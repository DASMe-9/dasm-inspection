-- Shared updated_at trigger helper used by the vehicle-history migrations
-- (20260622183000/184500/190000). Those files reference set_updated_at() but no
-- migration created it (only inspection_set_updated_at existed), so a fresh apply
-- failed at trigger creation and the tables never landed in production until this
-- was added. Dated 182000 so it sorts before the tables that depend on it.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
