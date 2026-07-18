const express = require('express');
const router = express.Router();
const db = require('../db');

// List inquiries with linked institution count
router.get('/', (req, res) => {
  const { status, month } = req.query;
  let sql = `
    SELECT inq.*,
      (SELECT COUNT(*) FROM inquiry_institutions ii WHERE ii.inquiry_id = inq.id) AS institution_count
    FROM inquiries inq
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND inq.status = ?';
    params.push(status);
  }
  if (month) {
    sql += " AND strftime('%Y-%m', inq.created_at) = ?";
    params.push(month);
  }
  sql += ' ORDER BY inq.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Not found' });
  const institutions = db.prepare(`
    SELECT ii.id AS link_id, ii.status AS counseling_status, ii.notes, ii.created_at,
           inst.id AS institution_id, inst.name, inst.type, inst.city
    FROM inquiry_institutions ii
    JOIN institutions inst ON inst.id = ii.institution_id
    WHERE ii.inquiry_id = ?
  `).all(req.params.id);
  const followups = db.prepare('SELECT * FROM followups WHERE inquiry_id = ? ORDER BY sent_at DESC').all(req.params.id);
  res.json({ ...inquiry, institutions, followups });
});

router.post('/', (req, res) => {
  const { name, phone, email, course_interest, source, counselor } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare(`
    INSERT INTO inquiries (name, phone, email, course_interest, source, counselor)
    VALUES (?,?,?,?,?,?)
  `).run(name, phone || null, email || null, course_interest || null, source || null, counselor || null);
  res.status(201).json(db.prepare('SELECT * FROM inquiries WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const m = { ...existing, ...req.body };
  db.prepare(`
    UPDATE inquiries SET name=?, phone=?, email=?, course_interest=?, source=?, status=?, counselor=?
    WHERE id=?
  `).run(m.name, m.phone, m.email, m.course_interest, m.source, m.status, m.counselor, req.params.id);
  res.json(db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Link inquiry to one or more institutions for counseling
router.post('/:id/institutions', (req, res) => {
  const { institution_id, notes } = req.body;
  if (!institution_id) return res.status(400).json({ error: 'institution_id is required' });
  try {
    const info = db.prepare(`
      INSERT INTO inquiry_institutions (inquiry_id, institution_id, notes)
      VALUES (?,?,?)
    `).run(req.params.id, institution_id, notes || null);
    // move inquiry to "In Counseling" if it was New
    db.prepare(`UPDATE inquiries SET status='In Counseling' WHERE id=? AND status='New'`).run(req.params.id);
    res.status(201).json(db.prepare('SELECT * FROM inquiry_institutions WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Already linked to this institution' });
    res.status(500).json({ error: e.message });
  }
});

// Update counseling status for a specific institution link
router.put('/institutions/:linkId', (req, res) => {
  const { status, notes } = req.body;
  const existing = db.prepare('SELECT * FROM inquiry_institutions WHERE id = ?').get(req.params.linkId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE inquiry_institutions SET status=?, notes=? WHERE id=?')
    .run(status || existing.status, notes !== undefined ? notes : existing.notes, req.params.linkId);
  res.json(db.prepare('SELECT * FROM inquiry_institutions WHERE id = ?').get(req.params.linkId));
});

router.delete('/institutions/:linkId', (req, res) => {
  db.prepare('DELETE FROM inquiry_institutions WHERE id = ?').run(req.params.linkId);
  res.status(204).end();
});

// Convert inquiry -> student
router.post('/:id/convert', (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
  const alreadyStudent = db.prepare('SELECT * FROM students WHERE inquiry_id = ?').get(req.params.id);
  if (alreadyStudent) return res.status(409).json({ error: 'Already converted', student: alreadyStudent });

  const info = db.prepare(`
    INSERT INTO students (inquiry_id, name, phone, email) VALUES (?,?,?,?)
  `).run(inquiry.id, inquiry.name, inquiry.phone, inquiry.email);
  db.prepare(`UPDATE inquiries SET status='Converted' WHERE id=?`).run(inquiry.id);
  res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid));
});

// Log a manual follow-up (WhatsApp/SMS/Call)
router.post('/:id/followups', (req, res) => {
  const { type, message, sent_by } = req.body;
  const info = db.prepare(`
    INSERT INTO followups (inquiry_id, type, message, sent_by) VALUES (?,?,?,?)
  `).run(req.params.id, type || 'whatsapp', message || '', sent_by || null);
  res.status(201).json(db.prepare('SELECT * FROM followups WHERE id = ?').get(info.lastInsertRowid));
});

module.exports = router;
