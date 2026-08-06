const express = require('express');
const router = express.Router();
const db = require('../db');

function isRead(key) {
  return !!db.prepare('SELECT 1 FROM notification_reads WHERE notification_key = ?').get(key);
}

function buildNotifications() {
  const items = [];

  // 1. Follow-ups due today or overdue
  const followups = db.prepare(`
    SELECT f.id, f.scheduled_at, f.remark, inq.id AS inquiry_id, inq.name AS inquiry_name
    FROM followups f JOIN inquiries inq ON inq.id = f.inquiry_id
    WHERE f.status = 'Planned' AND f.scheduled_at IS NOT NULL
      AND date(f.scheduled_at) <= date('now')
    ORDER BY f.scheduled_at
  `).all();
  for (const f of followups) {
    const overdue = new Date(f.scheduled_at) < new Date() && f.scheduled_at.slice(0, 10) !== new Date().toISOString().slice(0, 10);
    const key = `followup-${f.id}`;
    items.push({
      key, type: overdue ? 'followup_overdue' : 'followup_due_today',
      title: overdue ? 'Follow-up overdue' : 'Follow-up due today',
      message: `${f.inquiry_name}${f.remark ? ' — ' + f.remark : ''}`,
      link: `/inquiries/${f.inquiry_id}`,
      date: f.scheduled_at,
      read: isRead(key),
    });
  }

  // 2. Applications submitted
  const submitted = db.prepare(`
    SELECT a.id, a.submitted_at, s.name AS student_name, i.name AS institution_name, s.id AS student_id
    FROM applications a JOIN students s ON s.id = a.student_id JOIN institutions i ON i.id = a.institution_id
    WHERE a.status = 'Submitted'
    ORDER BY a.submitted_at DESC
  `).all();
  for (const a of submitted) {
    const key = `app-submitted-${a.id}`;
    items.push({
      key, type: 'application_submitted', title: 'Application submitted',
      message: `${a.student_name} → ${a.institution_name}`,
      link: `/students/${a.student_id}`,
      date: a.submitted_at,
      read: isRead(key),
    });
  }

  // 3. Offers received
  const offers = db.prepare(`
    SELECT a.id, a.decision_at, s.name AS student_name, i.name AS institution_name, s.id AS student_id
    FROM applications a JOIN students s ON s.id = a.student_id JOIN institutions i ON i.id = a.institution_id
    WHERE a.status = 'Offer Received'
    ORDER BY a.decision_at DESC
  `).all();
  for (const a of offers) {
    const key = `app-offer-${a.id}`;
    items.push({
      key, type: 'offer_received', title: 'Offer received',
      message: `${a.student_name} → ${a.institution_name}`,
      link: `/students/${a.student_id}`,
      date: a.decision_at,
      read: isRead(key),
    });
  }

  // 4. Payments overdue (active enrollment with a balance still outstanding)
  const enrollments = db.prepare(`
    SELECT e.id, e.fee_total, e.enrolled_at, s.name AS student_name, s.id AS student_id, i.name AS institution_name,
      (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.enrollment_id = e.id) AS paid
    FROM enrollments e JOIN students s ON s.id = e.student_id JOIN institutions i ON i.id = e.institution_id
    WHERE e.status = 'Active' AND e.payment_status != 'Received'
  `).all();
  for (const e of enrollments) {
    const balance = (e.fee_total || 0) - e.paid;
    if (balance <= 0) continue;
    const key = `payment-${e.id}`;
    items.push({
      key, type: 'payment_overdue', title: 'Payment overdue',
      message: `${e.student_name} · ${e.institution_name} · ₹${balance.toLocaleString('en-IN')} outstanding`,
      link: `/students/${e.student_id}`,
      date: e.enrolled_at,
      read: isRead(key),
    });
  }

  // 5. Documents pending
  const docs = db.prepare(`
    SELECT d.id, d.document_type, d.created_at, s.name AS student_name, s.id AS student_id
    FROM documents d JOIN students s ON s.id = d.student_id
    WHERE d.status = 'Pending'
    ORDER BY d.created_at DESC
  `).all();
  for (const d of docs) {
    const key = `doc-${d.id}`;
    items.push({
      key, type: 'document_pending', title: 'Document pending',
      message: `${d.student_name} — ${d.document_type}`,
      link: `/students/${d.student_id}`,
      date: d.created_at,
      read: isRead(key),
    });
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  return items;
}

router.get('/', (req, res) => {
  const items = buildNotifications();
  const unread = items.filter((i) => !i.read).length;
  res.json({ items, unread });
});

router.post('/:key/read', (req, res) => {
  db.prepare('INSERT OR IGNORE INTO notification_reads (notification_key) VALUES (?)').run(req.params.key);
  res.json({ ok: true });
});

router.post('/:key/unread', (req, res) => {
  db.prepare('DELETE FROM notification_reads WHERE notification_key = ?').run(req.params.key);
  res.json({ ok: true });
});

router.post('/read-all', (req, res) => {
  const items = buildNotifications();
  const insert = db.prepare('INSERT OR IGNORE INTO notification_reads (notification_key) VALUES (?)');
  const tx = db.transaction((keys) => { for (const k of keys) insert.run(k); });
  tx(items.filter((i) => !i.read).map((i) => i.key));
  res.json({ ok: true });
});

module.exports = router;
