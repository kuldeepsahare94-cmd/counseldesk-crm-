const express = require('express');
const router = express.Router();
const db = require('../db');

const appNumber = (id) => `APP-${String(id).padStart(4, '0')}`;

function withNumber(row) {
  if (!row) return row;
  return { ...row, application_number: appNumber(row.id) };
}

router.get('/', (req, res) => {
  const { status, student_id } = req.query;
  let sql = `
    SELECT a.*, s.name AS student_name, s.phone AS student_phone,
           i.name AS institution_name, c.name AS course_name, ik.label AS intake_label
    FROM applications a
    JOIN students s ON s.id = a.student_id
    JOIN institutions i ON i.id = a.institution_id
    LEFT JOIN courses c ON c.id = a.course_id
    LEFT JOIN intakes ik ON ik.id = a.intake_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (student_id) { sql += ' AND a.student_id = ?'; params.push(student_id); }
  sql += ' ORDER BY a.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(withNumber));
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT a.*, s.name AS student_name, s.phone AS student_phone,
           i.name AS institution_name, c.name AS course_name, ik.label AS intake_label
    FROM applications a
    JOIN students s ON s.id = a.student_id
    JOIN institutions i ON i.id = a.institution_id
    LEFT JOIN courses c ON c.id = a.course_id
    LEFT JOIN intakes ik ON ik.id = a.intake_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(withNumber(row));
});

router.post('/', (req, res) => {
  const { student_id, institution_id, course_id, course, intake_id, notes } = req.body;
  if (!student_id || !institution_id) return res.status(400).json({ error: 'student_id and institution_id are required' });

  let courseName = course || null;
  if (course_id && !courseName) {
    const c = db.prepare('SELECT * FROM courses WHERE id=?').get(course_id);
    if (c) courseName = c.name;
  }

  const info = db.prepare(`
    INSERT INTO applications (student_id, institution_id, course_id, course, intake_id, notes)
    VALUES (?,?,?,?,?,?)
  `).run(student_id, institution_id, course_id || null, courseName, intake_id || null, notes || null);
  res.status(201).json(withNumber(db.prepare('SELECT * FROM applications WHERE id = ?').get(info.lastInsertRowid)));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { status, course, course_id, intake_id, notes, submitted_at, decision_at } = req.body;
  const m = { ...existing };
  if (status !== undefined) {
    m.status = status;
    // Track timestamps automatically as the status moves through the workflow
    if (status === 'Submitted' && !existing.submitted_at) m.submitted_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (['Offer Received', 'Accepted', 'Rejected', 'Withdrawn'].includes(status) && !existing.decision_at) {
      m.decision_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  if (course !== undefined) m.course = course;
  if (course_id !== undefined) m.course_id = course_id;
  if (intake_id !== undefined) m.intake_id = intake_id;
  if (notes !== undefined) m.notes = notes;
  if (submitted_at !== undefined) m.submitted_at = submitted_at;
  if (decision_at !== undefined) m.decision_at = decision_at;

  db.prepare(`
    UPDATE applications SET status=?, course=?, course_id=?, intake_id=?, notes=?, submitted_at=?, decision_at=? WHERE id=?
  `).run(m.status, m.course, m.course_id, m.intake_id, m.notes, m.submitted_at, m.decision_at, req.params.id);
  res.json(withNumber(db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Convert an accepted application straight into an Enrollment
router.post('/:id/convert', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const already = db.prepare('SELECT * FROM enrollments WHERE application_id = ?').get(app.id);
  if (already) return res.status(409).json({ error: 'Already converted to an enrollment', enrollment: already });

  const institution = db.prepare('SELECT * FROM institutions WHERE id = ?').get(app.institution_id);
  const { fee_total, payment_status } = req.body;

  const cType = institution.commission_type;
  const cValue = institution.commission_value;
  const commission_amount = cType === 'flat' ? Number(cValue) || 0 : (Number(fee_total) || 0) * (Number(cValue) || 0) / 100;

  const info = db.prepare(`
    INSERT INTO enrollments (student_id, institution_id, course, course_id, fee_total, commission_type, commission_value, commission_amount, payment_status, application_id)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(app.student_id, app.institution_id, app.course, app.course_id, fee_total || 0, cType, cValue, commission_amount, payment_status || 'Pending', app.id);

  res.status(201).json(db.prepare('SELECT * FROM enrollments WHERE id = ?').get(info.lastInsertRowid));
});

module.exports = router;
