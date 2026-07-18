const express = require('express');
const router = express.Router();
const db = require('../db');

// List follow-ups with filters: status, date (YYYY-MM-DD, matches scheduled_at day), overdue=true
router.get('/', (req, res) => {
  const { status, date, overdue } = req.query;
  let sql = `
    SELECT f.*, inq.name AS inquiry_name, inq.phone AS inquiry_phone
    FROM followups f
    JOIN inquiries inq ON inq.id = f.inquiry_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND f.status = ?'; params.push(status); }
  if (date) { sql += " AND date(f.scheduled_at) = ?"; params.push(date); }
  if (overdue === 'true') {
    sql += " AND f.status = 'Planned' AND datetime(f.scheduled_at) < datetime('now')";
  }
  sql += ' ORDER BY COALESCE(f.scheduled_at, f.sent_at) ASC';
  res.json(db.prepare(sql).all(...params));
});

// Mark a follow-up done (add disposition/remark) or reschedule/edit
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM followups WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { disposition, remark, status, scheduled_at, message } = req.body;
  const m = {
    disposition: disposition !== undefined ? disposition : existing.disposition,
    remark: remark !== undefined ? remark : existing.remark,
    status: status || existing.status,
    scheduled_at: scheduled_at !== undefined ? scheduled_at : existing.scheduled_at,
    message: message !== undefined ? message : existing.message,
    completed_at: status === 'Done' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : existing.completed_at,
  };
  db.prepare(`
    UPDATE followups SET disposition=?, remark=?, status=?, scheduled_at=?, message=?, completed_at=? WHERE id=?
  `).run(m.disposition, m.remark, m.status, m.scheduled_at, m.message, m.completed_at, req.params.id);
  res.json(db.prepare('SELECT * FROM followups WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM followups WHERE id=?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
