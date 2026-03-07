ALTER TABLE donors ADD COLUMN IF NOT EXISTS address TEXT;

CREATE TABLE IF NOT EXISTS dependants (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  nric_last4 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dependants_donor_id ON dependants(donor_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES donors(id),
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_donor_id ON audit_log(donor_id);

CREATE TABLE IF NOT EXISTS reminder_log (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES donors(id),
  pledge_id INTEGER NOT NULL REFERENCES pledges(id),
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  stage INTEGER NOT NULL DEFAULT 1,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminder_log_donor_id ON reminder_log(donor_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dependants_updated_at') THEN
    CREATE TRIGGER dependants_updated_at BEFORE UPDATE ON dependants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
