-- Seed transparency config
INSERT INTO transparency_config (category, percentage, description, sort_order) VALUES
  ('Mosque Operations & Maintenance', 35, 'Daily upkeep, utilities, and facility maintenance of the mosque', 1),
  ('Religious Education', 25, 'Madrasah programmes, Quran classes, and Islamic studies', 2),
  ('Community Welfare & Assistance', 20, 'Financial aid, food distribution, and family support services', 3),
  ('Youth Development', 10, 'Mentorship programmes, sports, and leadership development for youth', 4),
  ('Da''wah & Outreach', 10, 'Community events, interfaith dialogues, and public education', 5)
ON CONFLICT DO NOTHING;

-- Seed admin (password: admin123, bcrypt hash)
INSERT INTO admins (name, email, password_hash) VALUES
  ('Admin', 'admin@arraudhah.org.sg', '$2a$10$rQEY0tEMm9UnjeJGNjFZ4OG1GPlVbILCqYvlstAfly2Re7rSTxyNy')
ON CONFLICT (email) DO NOTHING;

-- Seed sample donors
INSERT INTO donors (name, phone, email, reminder_channel) VALUES
  ('Ahmad bin Ibrahim', '+6591234567', 'ahmad@example.com', 'WHATSAPP'),
  ('Siti Nurhaliza', '+6598765432', 'siti@example.com', 'EMAIL'),
  ('Muhammad Farhan', '+6587654321', NULL, 'SMS')
ON CONFLICT (phone) DO NOTHING;

-- Seed pledges (for the 3 donors above)
INSERT INTO pledges (donor_id, amount, frequency, reminder_day, status) VALUES
  (1, 50.00, 'MONTHLY', 1, 'ACTIVE'),
  (2, 100.00, 'MONTHLY', 1, 'ACTIVE'),
  (3, 30.00, 'MONTHLY', 1, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Seed sample donations
INSERT INTO donations (pledge_id, donor_id, amount, reference, cycle_month, status, received_at) VALUES
  (1, 1, 50.00, 'SP-0001-202601', '2026-01', 'RECEIVED', NOW()),
  (1, 1, 50.00, 'SP-0001-202602', '2026-02', 'RECEIVED', NOW()),
  (1, 1, 50.00, 'SP-0001-202603', '2026-03', 'PENDING', NULL),
  (2, 2, 100.00, 'SP-0002-202601', '2026-01', 'RECEIVED', NOW()),
  (2, 2, 100.00, 'SP-0002-202602', '2026-02', 'RECEIVED', NOW()),
  (2, 2, 100.00, 'SP-0002-202603', '2026-03', 'PENDING', NULL),
  (3, 3, 30.00, 'SP-0003-202601', '2026-01', 'RECEIVED', NOW()),
  (3, 3, 30.00, 'SP-0003-202602', '2026-02', 'RECEIVED', NOW()),
  (3, 3, 30.00, 'SP-0003-202603', '2026-03', 'PENDING', NULL)
ON CONFLICT DO NOTHING;
