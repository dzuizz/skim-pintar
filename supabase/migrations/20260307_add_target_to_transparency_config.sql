-- Add target column to transparency_config for annual funding targets
ALTER TABLE transparency_config
  ADD COLUMN IF NOT EXISTS target NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Set initial targets for existing rows
UPDATE transparency_config SET target = 24000 WHERE category = 'Mosque Operations & Maintenance' AND target = 0;
UPDATE transparency_config SET target = 18000 WHERE category = 'Religious Education' AND target = 0;
UPDATE transparency_config SET target = 12000 WHERE category = 'Community Welfare & Assistance' AND target = 0;
UPDATE transparency_config SET target = 9600 WHERE category = 'Youth Development' AND target = 0;
UPDATE transparency_config SET target = 6000 WHERE category = 'Da''wah & Outreach' AND target = 0;
