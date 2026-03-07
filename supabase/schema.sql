-- Enums
CREATE TYPE reminder_channel_type AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');
CREATE TYPE frequency_type AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');
CREATE TYPE pledge_status_type AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE donation_status_type AS ENUM ('PENDING', 'RECEIVED', 'MISSED');

-- Donors
CREATE TABLE donors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  nric_last4 TEXT,
  reminder_channel reminder_channel_type NOT NULL DEFAULT 'WHATSAPP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pledges
CREATE TABLE pledges (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES donors(id),
  amount NUMERIC(10,2) NOT NULL,
  frequency frequency_type NOT NULL DEFAULT 'MONTHLY',
  reminder_day INTEGER NOT NULL DEFAULT 1 CHECK (reminder_day BETWEEN 1 AND 28),
  status pledge_status_type NOT NULL DEFAULT 'ACTIVE',
  missed_count INTEGER NOT NULL DEFAULT 0,
  grace_deadline TIMESTAMPTZ,
  initiative_priorities JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Donations
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  pledge_id INTEGER NOT NULL REFERENCES pledges(id),
  donor_id INTEGER NOT NULL REFERENCES donors(id),
  amount NUMERIC(10,2) NOT NULL,
  reference TEXT NOT NULL,
  cycle_month TEXT NOT NULL,
  status donation_status_type NOT NULL DEFAULT 'PENDING',
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admins
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transparency Config
CREATE TABLE transparency_config (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  target NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pledges_donor_id ON pledges(donor_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_pledge_id ON donations(pledge_id);
CREATE INDEX idx_donations_cycle_month ON donations(cycle_month);
CREATE INDEX idx_donations_status ON donations(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donors_updated_at BEFORE UPDATE ON donors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pledges_updated_at BEFORE UPDATE ON pledges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transparency_config_updated_at BEFORE UPDATE ON transparency_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
