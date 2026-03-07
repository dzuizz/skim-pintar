-- Add initiative_priorities column to pledges for storing donor's selected causes
ALTER TABLE pledges
  ADD COLUMN IF NOT EXISTS initiative_priorities JSONB NOT NULL DEFAULT '[]';
