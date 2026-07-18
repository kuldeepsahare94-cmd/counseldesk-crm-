const express = require('express');
const router = express.Router();
const db = require('../db');

const ENTITY_TYPES = ['inquiry', 'institution', 'student', 'enrollment'];

// List fields for an entity type (or all)
router.get('/', (req, res) => {
  const { entity_type } = req.query;
  if (entity_type) {
    res.json(db.prepare('SELECT * FROM custom_fields WHERE entity_type=? ORDER BY sort_order, id').all(entity_type));
  } else {
    res.json(db.prepare('SELECT * FROM custom_fields ORDER BY entity_type, sort_order, id').all());
  }
});

router.post('/', (req, res) => {
  const { entity_type, label, field_type, options } = req.body;
  if (!ENTITY_TYPES.includes(entity_type)) return res.status(400).json({ error: 'Invalid entity_type' });
  if (!label) return res.status(400).json({ error: 'label is required' });
  const info = db.prepare(`
    INSERT INTO custom_fields (entity_type, label, field_type, options) VALUES (?,?,?,?)
  `).run(entity_type, label, field_type || 'text', options ? JSON.stringify(options) : null);
  res.status(201).json(db.prepare('SELECT * FROM custom_fields WHERE id=?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM custom_fields WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { label, field_type, options } = req.body;
  db.prepare('UPDATE custom_fields SET label=?, field_type=?, options=? WHERE id=?').run(
    label ?? existing.label,
    field_type ?? existing.field_type,
    options !== undefined ? JSON.stringify(options) : existing.options,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM custom_fields WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM custom_fields WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// Get all custom field values for one record (merged with field definitions)
router.get('/values/:entity_type/:record_id', (req, res) => {
  const fields = db.prepare('SELECT * FROM custom_fields WHERE entity_type=? ORDER BY sort_order, id').all(req.params.entity_type);
  const values = db.prepare(`
    SELECT cf.id AS field_id, cfv.value FROM custom_fields cf
    LEFT JOIN custom_field_values cfv ON cfv.field_id = cf.id AND cfv.record_id = ?
    WHERE cf.entity_type = ?
  `).all(req.params.record_id, req.params.entity_type);
  const valueMap = Object.fromEntries(values.map((v) => [v.field_id, v.value]));
  res.json(fields.map((f) => ({ ...f, options: f.options ? JSON.parse(f.options) : [], value: valueMap[f.id] ?? '' })));
});

// Save (upsert) custom field values for one record. Body: { values: { fieldId: value, ... } }
router.post('/values/:entity_type/:record_id', (req, res) => {
  const { values } = req.body;
  if (!values || typeof values !== 'object') return res.status(400).json({ error: 'values object required' });
  const upsert = db.prepare(`
    INSERT INTO custom_field_values (field_id, record_id, value) VALUES (?,?,?)
    ON CONFLICT(field_id, record_id) DO UPDATE SET value=excluded.value
  `);
  const tx = db.transaction((entries) => {
    for (const [fieldId, value] of entries) upsert.run(Number(fieldId), req.params.record_id, String(value ?? ''));
  });
  tx(Object.entries(values));
  res.json({ ok: true });
});

module.exports = router;
