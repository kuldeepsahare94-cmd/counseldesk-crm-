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
  type TEXT,                -- call / whatsapp / sms / email
  message TEXT,             -- what was sent (e.g. WhatsApp text) or plan notes
  disposition TEXT,         -- Interested / Not Interested / Call Back Later / Not Reachable / Wrong Number / Converted / No Response / Other
  remark TEXT,              -- free-text notes from the counselor
  status TEXT DEFAULT 'Done',   -- Planned / Done / Missed
  scheduled_at TEXT,        -- when a Planned follow-up is due (null if logged as already done)
  completed_at TEXT,        -- when it was marked Done
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

-- ===== Master Data (Phase 1) =====

CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT
);

CREATE TABLE IF NOT EXISTS states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS universities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country_id INTEGER,
  city TEXT,
  website TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  university_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  level TEXT,                 -- Diploma / Bachelors / Masters / PhD
  duration_months INTEGER,
  currency TEXT DEFAULT 'USD',
  tuition_fee REAL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS intakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,        -- e.g. "Fall 2026"
  month INTEGER,
  year INTEGER,
  active INTEGER DEFAULT 1
);

-- Generic canonical option lists (Lead Sources, English Tests, Document Types,
-- Payment Modes, Student Status, Application Status, Priority, Tags)
CREATE TABLE IF NOT EXISTS master_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_type TEXT NOT NULL,    -- lead_source | english_test | document_type | payment_mode | student_status | application_status | priority | tag
  label TEXT NOT NULL,
  color TEXT,                 -- optional hex, used for status/priority/tag badges
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_states_country ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_courses_university ON courses(university_id);
CREATE INDEX IF NOT EXISTS idx_master_options_type ON master_options(list_type);
`);

// Safe migration: if an older followups table exists without these columns, add them.
const followupCols = db.prepare("PRAGMA table_info(followups)").all().map((c) => c.name);
const addColIfMissing = (col, def) => {
  if (!followupCols.includes(col)) {
    try { db.exec(`ALTER TABLE followups ADD COLUMN ${col} ${def}`); } catch (e) { /* ignore */ }
  }
};
addColIfMissing('disposition', 'TEXT');
addColIfMissing('remark', 'TEXT');
addColIfMissing('status', "TEXT DEFAULT 'Done'");
addColIfMissing('scheduled_at', 'TEXT');
addColIfMissing('completed_at', 'TEXT');

// Phase 2: optional lookups from Institutions -> Master Data Universities,
// and Enrollments -> Master Data Courses. Nullable, additive, non-breaking.
const institutionCols = db.prepare("PRAGMA table_info(institutions)").all().map((c) => c.name);
if (!institutionCols.includes('university_id')) {
  try { db.exec('ALTER TABLE institutions ADD COLUMN university_id INTEGER REFERENCES universities(id)'); } catch (e) { /* ignore */ }
}
const enrollmentCols = db.prepare("PRAGMA table_info(enrollments)").all().map((c) => c.name);
if (!enrollmentCols.includes('course_id')) {
  try { db.exec('ALTER TABLE enrollments ADD COLUMN course_id INTEGER REFERENCES courses(id)'); } catch (e) { /* ignore */ }
}
const inquiryCols = db.prepare("PRAGMA table_info(inquiries)").all().map((c) => c.name);
if (!inquiryCols.includes('priority')) {
  try { db.exec("ALTER TABLE inquiries ADD COLUMN priority TEXT"); } catch (e) { /* ignore */ }
}

// ===== Phase 3: Applications (the link between Student and Enrollment) =====
db.exec(`
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  institution_id INTEGER NOT NULL,
  course_id INTEGER,
  course TEXT,
  intake_id INTEGER,
  status TEXT NOT NULL DEFAULT 'Draft',   -- Draft / Submitted / Under Review / Offer Received / Accepted / Rejected / Withdrawn
  submitted_at TEXT,
  decision_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (intake_id) REFERENCES intakes(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
`);

// Optional back-link from an Enrollment to the Application it came from (additive, nullable)
const enrollmentColsForApp = db.prepare("PRAGMA table_info(enrollments)").all().map((c) => c.name);
if (!enrollmentColsForApp.includes('application_id')) {
  try { db.exec('ALTER TABLE enrollments ADD COLUMN application_id INTEGER REFERENCES applications(id)'); } catch (e) { /* ignore */ }
}

// ===== Phase 4: Documents, Tasks, Payments =====

// Documents: a checklist/tracker per student (not file upload — no cloud storage configured yet)
db.exec(`
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,   -- pulled from master_options list_type=document_type
  status TEXT NOT NULL DEFAULT 'Pending',  -- Pending / Received / Verified / Rejected
  notes TEXT,
  received_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,     -- inquiry / student / application (nullable — a task can be general)
  entity_id INTEGER,
  assigned_to TEXT,      -- username
  priority TEXT,         -- from master_options list_type=priority
  status TEXT NOT NULL DEFAULT 'To Do',  -- To Do / In Progress / Done
  due_date TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  payment_mode TEXT,     -- from master_options list_type=payment_mode
  paid_at TEXT DEFAULT (datetime('now')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_followup_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followup_scheduled ON followups(scheduled_at);`);

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

// Seed default master data option lists the first time (only if a list_type has zero rows)
const seedOptions = {
  lead_source: ['Walk-in', 'Referral', 'Facebook', 'Google', 'Website', 'Agent', 'Other'],
  english_test: ['IELTS', 'TOEFL', 'PTE', 'Duolingo', 'Not Required'],
  document_type: ['Passport', 'Academic Transcripts', 'LOR', 'SOP', 'Resume/CV', 'Bank Statement', 'English Test Score', 'Photo', 'Visa Copy'],
  payment_mode: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other'],
  student_status: ['New', 'Profile Evaluation', 'Counselling', 'Application', 'Documents', 'Payment', 'Admission', 'Enrolled', 'Dropped'],
  application_status: ['Draft', 'Submitted', 'Under Review', 'Offer Received', 'Accepted', 'Rejected', 'Withdrawn'],
  priority: ['Low', 'Medium', 'High', 'Urgent'],
  tag: ['Hot Lead', 'VIP', 'Scholarship', 'Urgent'],
};
const insertOption = db.prepare('INSERT INTO master_options (list_type, label, sort_order) VALUES (?,?,?)');
for (const [listType, labels] of Object.entries(seedOptions)) {
  const count = db.prepare('SELECT COUNT(*) c FROM master_options WHERE list_type=?').get(listType).c;
  if (count === 0) {
    labels.forEach((label, i) => insertOption.run(listType, label, i));
  }
}

module.exports = db;
