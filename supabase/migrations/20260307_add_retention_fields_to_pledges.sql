-- Add retention tracking fields to pledges table
ALTER TABLE pledges
  ADD COLUMN IF NOT EXISTS missed_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE pledges
  ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMPTZ;

-- Index for quickly finding at-risk pledges
CREATE INDEX IF NOT EXISTS idx_pledges_missed_count ON pledges(missed_count) WHERE status = 'ACTIVE' AND missed_count >= 2;

-- Set sample at-risk data for demo
UPDATE pledges SET missed_count = 2, grace_deadline = NOW() + INTERVAL '30 days'
  WHERE donor_id = 3 AND status = 'ACTIVE';
