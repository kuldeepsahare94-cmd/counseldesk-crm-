const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) AS enrollment_count
    FROM students s ORDER BY s.converted_at DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const student = db.prepare(`
    SELECT s.*, c.name AS country_name FROM students s
    LEFT JOIN countries c ON c.id = s.country_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  const enrollments = db.prepare(`
    SELECT en.*, inst.name AS institution_name
    FROM enrollments en JOIN institutions inst ON inst.id = en.institution_id
    WHERE en.student_id = ? ORDER BY en.enrolled_at DESC
  `).all(req.params.id);
  // full counseling history via the original inquiry
  const history = student.inquiry_id ? db.prepare(`
    SELECT ii.status AS counseling_status, ii.created_at, inst.name AS institution_name
    FROM inquiry_institutions ii JOIN institutions inst ON inst.id = ii.institution_id
    WHERE ii.inquiry_id = ? ORDER BY ii.created_at DESC
  `).all(student.inquiry_id) : [];
  res.json({ ...student, enrollments, counseling_history: history });
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const m = { ...existing, ...req.body };
  db.prepare(`
    UPDATE students SET
      name=?, phone=?, email=?, date_of_birth=?, gender=?, address=?, city=?, country_id=?,
      passport_number=?, highest_qualification=?, academic_percentage=?, english_test=?, english_test_score=?,
      alternate_phone=?, guardian_name=?, guardian_phone=?
    WHERE id=?
  `).run(
    m.name, m.phone, m.email, m.date_of_birth || null, m.gender || null, m.address || null, m.city || null, m.country_id || null,
    m.passport_number || null, m.highest_qualification || null, m.academic_percentage || null, m.english_test || null, m.english_test_score || null,
    m.alternate_phone || null, m.guardian_name || null, m.guardian_phone || null,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id));
});

module.exports = router;
