const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { student_id, status } = req.query;
  let sql = `
    SELECT d.*, s.name AS student_name, s.phone AS student_phone
    FROM documents d JOIN students s ON s.id = d.student_id
    WHERE 1=1
  `;
  const params = [];
  if (student_id) { sql += ' AND d.student_id = ?'; params.push(student_id); }
  if (status) { sql += ' AND d.status = ?'; params.push(status); }
  sql += ' ORDER BY d.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { student_id, document_type, status, notes } = req.body;
  if (!student_id || !document_type) return res.status(400).json({ error: 'student_id and document_type are required' });
  const received_at = status === 'Received' || status === 'Verified' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
  const info = db.prepare(`
    INSERT INTO documents (student_id, document_type, status, notes, received_at) VALUES (?,?,?,?,?)
  `).run(student_id, document_type, status || 'Pending', notes || null, received_at);
  res.status(201).json(db.prepare('SELECT * FROM documents WHERE id=?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { status, notes } = req.body;
  const m = { ...existing };
  if (status !== undefined) {
    m.status = status;
    if ((status === 'Received' || status === 'Verified') && !existing.received_at) {
      m.received_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  if (notes !== undefined) m.notes = notes;
  db.prepare('UPDATE documents SET status=?, notes=?, received_at=? WHERE id=?')
    .run(m.status, m.notes, m.received_at, req.params.id);
  res.json(db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM documents WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// Summary for dashboard: how many pending across all students
router.get('/summary/counts', (req, res) => {
  const rows = db.prepare('SELECT status, COUNT(*) c FROM documents GROUP BY status').all();
  res.json(rows);
});

module.exports = router;
