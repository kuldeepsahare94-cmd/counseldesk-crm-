const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { status, assigned_to, overdue, date } = req.query;
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (assigned_to) { sql += ' AND assigned_to = ?'; params.push(assigned_to); }
  if (date) { sql += ' AND date(due_date) = ?'; params.push(date); }
  if (overdue === 'true') {
    sql += " AND status != 'Done' AND due_date IS NOT NULL AND datetime(due_date) < datetime('now')";
  }
  sql += ' ORDER BY COALESCE(due_date, created_at) ASC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { title, description, entity_type, entity_id, assigned_to, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db.prepare(`
    INSERT INTO tasks (title, description, entity_type, entity_id, assigned_to, priority, due_date)
    VALUES (?,?,?,?,?,?,?)
  `).run(title, description || null, entity_type || null, entity_id || null, assigned_to || null, priority || null, due_date || null);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id=?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const m = { ...existing, ...req.body };
  if (req.body.status === 'Done' && !existing.completed_at) {
    m.completed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  db.prepare(`
    UPDATE tasks SET title=?, description=?, entity_type=?, entity_id=?, assigned_to=?, priority=?, status=?, due_date=?, completed_at=?
    WHERE id=?
  `).run(m.title, m.description, m.entity_type, m.entity_id, m.assigned_to, m.priority, m.status, m.due_date, m.completed_at, req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
