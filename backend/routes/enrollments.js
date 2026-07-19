const express = require('express');
const router = express.Router();
const db = require('../db');

function computeCommission(fee_total, commission_type, commission_value) {
  if (commission_type === 'flat') return Number(commission_value) || 0;
  return (Number(fee_total) || 0) * (Number(commission_value) || 0) / 100;
}

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT en.*, s.name AS student_name, inst.name AS institution_name
    FROM enrollments en
    JOIN students s ON s.id = en.student_id
    JOIN institutions inst ON inst.id = en.institution_id
    ORDER BY en.enrolled_at DESC
  `).all();
  res.json(rows);
});

// Onboard a student into their chosen institution
router.post('/', (req, res) => {
  const { student_id, institution_id, course, course_id, fee_total, commission_type, commission_value, payment_status } = req.body;
  if (!student_id || !institution_id) return res.status(400).json({ error: 'student_id and institution_id are required' });

  const institution = db.prepare('SELECT * FROM institutions WHERE id = ?').get(institution_id);
  if (!institution) return res.status(404).json({ error: 'Institution not found' });

  // If a catalog course was picked, use its name unless the user typed something specific
  let courseName = course || null;
  if (course_id && !courseName) {
    const c = db.prepare('SELECT * FROM courses WHERE id=?').get(course_id);
    if (c) courseName = c.name;
  }

  // default to institution's own commission terms unless overridden
  const cType = commission_type || institution.commission_type;
  const cValue = commission_value !== undefined ? commission_value : institution.commission_value;
  const commission_amount = computeCommission(fee_total || 0, cType, cValue);

  const info = db.prepare(`
    INSERT INTO enrollments (student_id, institution_id, course, course_id, fee_total, commission_type, commission_value, commission_amount, payment_status)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(student_id, institution_id, courseName, course_id || null, fee_total || 0, cType, cValue, commission_amount, payment_status || 'Pending');

  res.status(201).json(db.prepare('SELECT * FROM enrollments WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const m = { ...existing, ...req.body };
  const commission_amount = computeCommission(m.fee_total, m.commission_type, m.commission_value);
  db.prepare(`
    UPDATE enrollments SET course=?, course_id=?, fee_total=?, commission_type=?, commission_value=?, commission_amount=?, payment_status=?, status=?
    WHERE id=?
  `).run(m.course, m.course_id || null, m.fee_total, m.commission_type, m.commission_value, commission_amount, m.payment_status, m.status, req.params.id);
  res.json(db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM enrollments WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
