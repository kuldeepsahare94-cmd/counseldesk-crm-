const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'crm.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,                -- School / College / University
  city TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  commission_type TEXT DEFAULT 'percentage', -- percentage | flat
  commission_value REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  course_interest TEXT,
  source TEXT,               -- Walk-in / Referral / Facebook / etc.
  status TEXT DEFAULT 'New', -- New / In Counseling / Converted / Dropped
  counselor TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Many-to-many: one inquiry can be counseled for many institutions
CREATE TABLE IF NOT EXISTS inquiry_institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL,
  institution_id INTEGER NOT NULL,
  status TEXT DEFAULT 'Counseling', -- Counseling / Applied / Offer / Rejected / Not Interested
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  UNIQUE(inquiry_id, institution_id)
);

-- Once counseling completes, inquiry converts into a student
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  converted_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL
);

-- Student's final onboarded institution + revenue tracking
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  institution_id INTEGER NOT NULL,
  course TEXT,
  fee_total REAL DEFAULT 0,          -- total fee student pays institution
  commission_type TEXT DEFAULT 'percentage',
  commission_value REAL DEFAULT 0,   -- % or flat, copied from institution at time of enrollment
  commission_amount REAL DEFAULT 0,  -- computed consultancy share
  payment_status TEXT DEFAULT 'Pending', -- Pending / Partial / Received
  status TEXT DEFAULT 'Active',      -- Active / Cancelled / Completed
  enrolled_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL,
  type TEXT,           -- whatsapp / sms / call / email
  message TEXT,
  sent_by TEXT,
  sent_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ii_inquiry ON inquiry_institutions(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_ii_institution ON inquiry_institutions(institution_id);
CREATE INDEX IF NOT EXISTS idx_enroll_institution ON enrollments(institution_id);
CREATE INDEX IF NOT EXISTS idx_followup_inquiry ON followups(inquiry_id);

-- Custom fields: lets the consultancy add their own fields/dropdowns without code changes
CREATE TABLE IF NOT EXISTS custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,   -- inquiry | institution | student | enrollment
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text | number | date | dropdown
  options TEXT,                 -- JSON array string, only for dropdown
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL,
  record_id INTEGER NOT NULL,
  value TEXT,
  FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
  UNIQUE(field_id, record_id)
);

CREATE INDEX IF NOT EXISTS idx_cfv_field ON custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_cfv_record ON custom_field_values(record_id);
CREATE INDEX IF NOT EXISTS idx_cf_entity ON custom_fields(entity_type);

-- Users who can log in to the CRM
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  active INTEGER NOT NULL DEFAULT 1,  -- 1 = can log in, 0 = blocked
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Seed a default admin account the first time the app runs, so there's
// always at least one way in. Change this password immediately after login.
const bcrypt = require('bcryptjs');
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash, full_name, active) VALUES (?,?,?,1)')
    .run('admin', hash, 'Administrator');
  console.log('Seeded default login -> username: admin / password: admin123 (change this immediately)');
}

module.exports = db;
