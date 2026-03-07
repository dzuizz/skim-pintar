-- Add tier column to pledges for membership tier tracking
ALTER TABLE pledges
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'INDIVIDUAL';

-- Drop initiative_priorities if it exists (no longer used)
ALTER TABLE pledges
  DROP COLUMN IF EXISTS initiative_priorities;
