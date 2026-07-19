const express = require('express');
const router = express.Router();
const db = require('../db');

// ===== Countries =====
router.get('/countries', (req, res) => res.json(db.prepare('SELECT * FROM countries ORDER BY name').all()));
router.post('/countries', (req, res) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const info = db.prepare('INSERT INTO countries (name, code) VALUES (?,?)').run(name, code || null);
    res.status(201).json(db.prepare('SELECT * FROM countries WHERE id=?').get(info.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Country already exists' });
    res.status(500).json({ error: e.message });
  }
});
router.delete('/countries/:id', (req, res) => { db.prepare('DELETE FROM countries WHERE id=?').run(req.params.id); res.status(204).end(); });

// ===== States =====
router.get('/states', (req, res) => {
  const { country_id } = req.query;
  const sql = country_id ? 'SELECT * FROM states WHERE country_id=? ORDER BY name' : 'SELECT * FROM states ORDER BY name';
  res.json(country_id ? db.prepare(sql).all(country_id) : db.prepare(sql).all());
});
router.post('/states', (req, res) => {
  const { country_id, name } = req.body;
  if (!country_id || !name) return res.status(400).json({ error: 'country_id and name are required' });
  const info = db.prepare('INSERT INTO states (country_id, name) VALUES (?,?)').run(country_id, name);
  res.status(201).json(db.prepare('SELECT * FROM states WHERE id=?').get(info.lastInsertRowid));
});
router.delete('/states/:id', (req, res) => { db.prepare('DELETE FROM states WHERE id=?').run(req.params.id); res.status(204).end(); });

// ===== Cities =====
router.get('/cities', (req, res) => {
  const { state_id } = req.query;
  const sql = state_id ? 'SELECT * FROM cities WHERE state_id=? ORDER BY name' : 'SELECT * FROM cities ORDER BY name';
  res.json(state_id ? db.prepare(sql).all(state_id) : db.prepare(sql).all());
});
router.post('/cities', (req, res) => {
  const { state_id, name } = req.body;
  if (!state_id || !name) return res.status(400).json({ error: 'state_id and name are required' });
  const info = db.prepare('INSERT INTO cities (state_id, name) VALUES (?,?)').run(state_id, name);
  res.status(201).json(db.prepare('SELECT * FROM cities WHERE id=?').get(info.lastInsertRowid));
});
router.delete('/cities/:id', (req, res) => { db.prepare('DELETE FROM cities WHERE id=?').run(req.params.id); res.status(204).end(); });

// ===== Universities =====
router.get('/universities', (req, res) => {
  res.json(db.prepare(`
    SELECT u.*, c.name AS country_name,
      (SELECT COUNT(*) FROM courses co WHERE co.university_id = u.id) AS course_count
    FROM universities u LEFT JOIN countries c ON c.id = u.country_id
    ORDER BY u.name
  `).all());
});
router.post('/universities', (req, res) => {
  const { name, country_id, city, website, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare(`
    INSERT INTO universities (name, country_id, city, website, notes) VALUES (?,?,?,?,?)
  `).run(name, country_id || null, city || null, website || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM universities WHERE id=?').get(info.lastInsertRowid));
});
router.put('/universities/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM universities WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const m = { ...existing, ...req.body };
  db.prepare('UPDATE universities SET name=?, country_id=?, city=?, website=?, notes=?, active=? WHERE id=?')
    .run(m.name, m.country_id, m.city, m.website, m.notes, m.active ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM universities WHERE id=?').get(req.params.id));
});
router.delete('/universities/:id', (req, res) => { db.prepare('DELETE FROM universities WHERE id=?').run(req.params.id); res.status(204).end(); });

// ===== Courses =====
router.get('/courses', (req, res) => {
  const { university_id } = req.query;
  const sql = university_id
    ? 'SELECT * FROM courses WHERE university_id=? ORDER BY name'
    : `SELECT co.*, u.name AS university_name FROM courses co JOIN universities u ON u.id=co.university_id ORDER BY co.name`;
  res.json(university_id ? db.prepare(sql).all(university_id) : db.prepare(sql).all());
});
router.post('/courses', (req, res) => {
  const { university_id, name, level, duration_months, currency, tuition_fee } = req.body;
  if (!university_id || !name) return res.status(400).json({ error: 'university_id and name are required' });
  const info = db.prepare(`
    INSERT INTO courses (university_id, name, level, duration_months, currency, tuition_fee) VALUES (?,?,?,?,?,?)
  `).run(university_id, name, level || null, duration_months || null, currency || 'USD', tuition_fee || null);
  res.status(201).json(db.prepare('SELECT * FROM courses WHERE id=?').get(info.lastInsertRowid));
});
router.put('/courses/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM courses WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const m = { ...existing, ...req.body };
  db.prepare('UPDATE courses SET name=?, level=?, duration_months=?, currency=?, tuition_fee=?, active=? WHERE id=?')
    .run(m.name, m.level, m.duration_months, m.currency, m.tuition_fee, m.active ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM courses WHERE id=?').get(req.params.id));
});
router.delete('/courses/:id', (req, res) => { db.prepare('DELETE FROM courses WHERE id=?').run(req.params.id); res.status(204).end(); });

// ===== Intakes =====
router.get('/intakes', (req, res) => res.json(db.prepare('SELECT * FROM intakes ORDER BY year, month').all()));
router.post('/intakes', (req, res) => {
  const { label, month, year } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  const info = db.prepare('INSERT INTO intakes (label, month, year) VALUES (?,?,?)').run(label, month || null, year || null);
  res.status(201).json(db.prepare('SELECT * FROM intakes WHERE id=?').get(info.lastInsertRowid));
});
router.delete('/intakes/:id', (req, res) => { db.prepare('DELETE FROM intakes WHERE id=?').run(req.params.id); res.status(204).end(); });

// ===== Generic option lists (lead_source, english_test, document_type, payment_mode,
//       student_status, application_status, priority, tag) =====
router.get('/options', (req, res) => {
  const { list_type } = req.query;
  if (!list_type) return res.status(400).json({ error: 'list_type query param is required' });
  res.json(db.prepare('SELECT * FROM master_options WHERE list_type=? ORDER BY sort_order, id').all(list_type));
});
router.post('/options', (req, res) => {
  const { list_type, label, color } = req.body;
  if (!list_type || !label) return res.status(400).json({ error: 'list_type and label are required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) m FROM master_options WHERE list_type=?').get(list_type).m;
  const info = db.prepare('INSERT INTO master_options (list_type, label, color, sort_order) VALUES (?,?,?,?)')
    .run(list_type, label, color || null, maxOrder + 1);
  res.status(201).json(db.prepare('SELECT * FROM master_options WHERE id=?').get(info.lastInsertRowid));
});
router.put('/options/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM master_options WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const m = { ...existing, ...req.body };
  db.prepare('UPDATE master_options SET label=?, color=?, active=? WHERE id=?')
    .run(m.label, m.color, m.active ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM master_options WHERE id=?').get(req.params.id));
});
router.delete('/options/:id', (req, res) => { db.prepare('DELETE FROM master_options WHERE id=?').run(req.params.id); res.status(204).end(); });

module.exports = router;
