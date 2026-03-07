-- Seed transparency config (7 Ar-Raudhah-specific categories)
INSERT INTO transparency_config (category, percentage, description, sort_order, target) VALUES
  ('Khidmat Jenazah', 30, 'Funeral services, burial assistance, and bereavement support for the community', 1, 21600),
  ('Zakat Family Support', 20, 'Financial assistance, groceries, and essential aid for families in need', 2, 14400),
  ('Islamic Education', 15, 'Subsidised Quran classes, Islamic studies, and enrichment programmes for all ages', 3, 10800),
  ('Youth Programmes', 12, 'aLIVE, Al-Fateh, sports, mentorship, and leadership development for youth', 4, 8640),
  ('Community Outreach', 10, 'ARRPromise, interfaith dialogues, new Muslim support, and public education', 5, 7200),
  ('Mosque Operations', 8, 'Utilities, maintenance, cleaning, and daily upkeep of the mosque', 6, 5760),
  ('Community Events', 5, 'Hijrah Walk, Ramadan bazaar, Hari Raya celebrations, and festive programmes', 7, 3600)
ON CONFLICT DO NOTHING;

-- Seed admin (password: admin123, bcrypt hash)
-- Password: admin123
INSERT INTO admins (name, email, password_hash) VALUES
  ('Admin', 'admin@arraudhah.org.sg', '$2b$10$iCqQVs7GQSRksgb/ddj7x.2oijafDaYFbaKC/N6jCF/lgGOzabK2q')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Seed sample members
INSERT INTO donors (name, phone, email, reminder_channel) VALUES
  ('Ahmad bin Ibrahim', '+6591234567', 'ahmad@example.com', 'WHATSAPP'),
  ('Siti Nurhaliza', '+6598765432', 'siti@example.com', 'EMAIL'),
  ('Muhammad Farhan', '+6587654321', NULL, 'SMS')
ON CONFLICT (phone) DO NOTHING;

-- Seed pledges (for the 3 members above)
INSERT INTO pledges (donor_id, amount, frequency, reminder_day, status, missed_count, grace_deadline, tier) VALUES
  (1, 20.00, 'MONTHLY', 1, 'ACTIVE', 0, NULL, 'FAMILY'),
  (2, 5.00, 'MONTHLY', 1, 'ACTIVE', 2, NOW() + INTERVAL '30 days', 'INDIVIDUAL'),
  (3, 30.00, 'MONTHLY', 1, 'ACTIVE', 3, NOW() + INTERVAL '12 days', 'CUSTOM')
ON CONFLICT DO NOTHING;

-- Seed sample donations
INSERT INTO donations (pledge_id, donor_id, amount, reference, cycle_month, status, received_at) VALUES
  (1, 1, 20.00, 'SP-0001-202601', '2026-01', 'RECEIVED', NOW()),
  (1, 1, 20.00, 'SP-0001-202602', '2026-02', 'RECEIVED', NOW()),
  (1, 1, 20.00, 'SP-0001-202603', '2026-03', 'PENDING', NULL),
  (2, 2, 5.00, 'SP-0002-202601', '2026-01', 'RECEIVED', NOW()),
  (2, 2, 5.00, 'SP-0002-202602', '2026-02', 'RECEIVED', NOW()),
  (2, 2, 5.00, 'SP-0002-202603', '2026-03', 'PENDING', NULL),
  (3, 3, 30.00, 'SP-0003-202601', '2026-01', 'RECEIVED', NOW()),
  (3, 3, 30.00, 'SP-0003-202602', '2026-02', 'RECEIVED', NOW()),
  (3, 3, 30.00, 'SP-0003-202603', '2026-03', 'PENDING', NULL)
ON CONFLICT DO NOTHING;
