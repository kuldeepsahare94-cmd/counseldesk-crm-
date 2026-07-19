const express = require('express');
const router = express.Router();
const db = require('../db');

const invoiceNumber = (id) => `INV-${String(id).padStart(4, '0')}`;
const withNumber = (row) => (row ? { ...row, invoice_number: invoiceNumber(row.id) } : row);

router.get('/', (req, res) => {
  const { enrollment_id } = req.query;
  let sql = `
    SELECT p.*, e.student_id, s.name AS student_name, inst.name AS institution_name
    FROM payments p
    JOIN enrollments e ON e.id = p.enrollment_id
    JOIN students s ON s.id = e.student_id
    JOIN institutions inst ON inst.id = e.institution_id
    WHERE 1=1
  `;
  const params = [];
  if (enrollment_id) { sql += ' AND p.enrollment_id = ?'; params.push(enrollment_id); }
  sql += ' ORDER BY p.paid_at DESC';
  res.json(db.prepare(sql).all(...params).map(withNumber));
});

router.post('/', (req, res) => {
  const { enrollment_id, amount, payment_mode, notes, paid_at } = req.body;
  if (!enrollment_id || !amount) return res.status(400).json({ error: 'enrollment_id and amount are required' });
  const info = db.prepare(`
    INSERT INTO payments (enrollment_id, amount, payment_mode, notes, paid_at)
    VALUES (?,?,?,?, COALESCE(?, datetime('now')))
  `).run(enrollment_id, amount, payment_mode || null, notes || null, paid_at || null);
  res.status(201).json(withNumber(db.prepare('SELECT * FROM payments WHERE id=?').get(info.lastInsertRowid)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM payments WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// How much has been paid so far for one enrollment (vs its fee_total)
router.get('/enrollment/:enrollmentId/summary', (req, res) => {
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id=?').get(req.params.enrollmentId);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  const paid = db.prepare('SELECT COALESCE(SUM(amount),0) total FROM payments WHERE enrollment_id=?').get(req.params.enrollmentId).total;
  res.json({ fee_total: enrollment.fee_total, paid, balance: (enrollment.fee_total || 0) - paid });
});

module.exports = router;
