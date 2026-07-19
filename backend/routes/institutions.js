const express = require('express');
const router = express.Router();
const db = require('../db');

// List all institutions with counseling + enrollment counts, plus linked university (if any)
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, u.name AS university_name,
      (SELECT COUNT(*) FROM inquiry_institutions ii WHERE ii.institution_id = i.id) AS counseling_count,
      (SELECT COUNT(*) FROM enrollments e WHERE e.institution_id = i.id AND e.status = 'Active') AS enrolled_count
    FROM institutions i
    LEFT JOIN universities u ON u.id = i.university_id
    ORDER BY i.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT i.*, u.name AS university_name FROM institutions i
    LEFT JOIN universities u ON u.id = i.university_id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, type, city, contact_person, contact_phone, contact_email, commission_type, commission_value, notes, university_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare(`
    INSERT INTO institutions (name, type, city, contact_person, contact_phone, contact_email, commission_type, commission_value, notes, university_id)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(name, type || null, city || null, contact_person || null, contact_phone || null, contact_email || null,
         commission_type || 'percentage', commission_value || 0, notes || null, university_id || null);
  res.status(201).json(db.prepare('SELECT * FROM institutions WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM institutions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const merged = { ...existing, ...req.body };
  db.prepare(`
    UPDATE institutions SET name=?, type=?, city=?, contact_person=?, contact_phone=?, contact_email=?,
      commission_type=?, commission_value=?, notes=?, university_id=? WHERE id=?
  `).run(merged.name, merged.type, merged.city, merged.contact_person, merged.contact_phone, merged.contact_email,
         merged.commission_type, merged.commission_value, merged.notes, merged.university_id || null, req.params.id);
  res.json(db.prepare('SELECT * FROM institutions WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM institutions WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// All counseling records (inquiries) linked to this institution
router.get('/:id/counselings', (req, res) => {
  const rows = db.prepare(`
    SELECT ii.id AS link_id, ii.status AS counseling_status, ii.notes, ii.created_at,
           inq.id AS inquiry_id, inq.name, inq.phone, inq.email, inq.status AS inquiry_status
    FROM inquiry_institutions ii
    JOIN inquiries inq ON inq.id = ii.inquiry_id
    WHERE ii.institution_id = ?
    ORDER BY ii.created_at DESC
  `).all(req.params.id);
  res.json(rows);
});

module.exports = router;
