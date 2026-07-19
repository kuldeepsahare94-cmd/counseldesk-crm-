const express = require('express');
const router = express.Router();
const db = require('../db');

// Overall dashboard summary
router.get('/summary', (req, res) => {
  const totalInquiries = db.prepare('SELECT COUNT(*) c FROM inquiries').get().c;
  const totalStudents = db.prepare('SELECT COUNT(*) c FROM students').get().c;
  const totalEnrollments = db.prepare(`SELECT COUNT(*) c FROM enrollments WHERE status='Active'`).get().c;
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(commission_amount),0) total,
           COALESCE(SUM(CASE WHEN payment_status='Received' THEN commission_amount ELSE 0 END),0) received,
           COALESCE(SUM(CASE WHEN payment_status!='Received' THEN commission_amount ELSE 0 END),0) pending
    FROM enrollments WHERE status='Active'
  `).get();
  res.json({
    total_inquiries: totalInquiries,
    total_students: totalStudents,
    total_enrollments: totalEnrollments,
    revenue_total: revenue.total,
    revenue_received: revenue.received,
    revenue_pending: revenue.pending
  });
});

// Counseling count per institution
router.get('/institution-counseling', (req, res) => {
  const rows = db.prepare(`
    SELECT inst.id, inst.name, inst.type,
      COUNT(ii.id) AS counseling_count,
      SUM(CASE WHEN ii.status='Offer' THEN 1 ELSE 0 END) AS offers,
      SUM(CASE WHEN ii.status='Rejected' THEN 1 ELSE 0 END) AS rejections
    FROM institutions inst
    LEFT JOIN inquiry_institutions ii ON ii.institution_id = inst.id
    GROUP BY inst.id ORDER BY counseling_count DESC
  `).all();
  res.json(rows);
});

// Revenue per institution
router.get('/revenue-by-institution', (req, res) => {
  const rows = db.prepare(`
    SELECT inst.id, inst.name,
      COUNT(en.id) AS enrollment_count,
      COALESCE(SUM(en.fee_total),0) AS total_fees,
      COALESCE(SUM(en.commission_amount),0) AS total_commission,
      COALESCE(SUM(CASE WHEN en.payment_status='Received' THEN en.commission_amount ELSE 0 END),0) AS received,
      COALESCE(SUM(CASE WHEN en.payment_status!='Received' THEN en.commission_amount ELSE 0 END),0) AS pending
    FROM institutions inst
    LEFT JOIN enrollments en ON en.institution_id = inst.id AND en.status='Active'
    GROUP BY inst.id ORDER BY total_commission DESC
  `).all();
  res.json(rows);
});

// Conversion funnel
router.get('/funnel', (req, res) => {
  const stages = db.prepare(`
    SELECT status, COUNT(*) c FROM inquiries GROUP BY status
  `).all();
  const students = db.prepare('SELECT COUNT(*) c FROM students').get().c;
  const enrolled = db.prepare(`SELECT COUNT(*) c FROM enrollments WHERE status='Active'`).get().c;
  res.json({ inquiry_stages: stages, total_students: students, total_enrolled: enrolled });
});

// Monthly inquiry trend (last 6 months)
router.get('/trend', (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS inquiries
    FROM inquiries
    GROUP BY month
    ORDER BY month DESC
    LIMIT 6
  `).all();
  res.json(rows.reverse());
});

// Follow-up tracking summary for the dashboard
router.get('/followups-summary', (req, res) => {
  const plannedToday = db.prepare(`
    SELECT COUNT(*) c FROM followups WHERE status='Planned' AND date(scheduled_at) = date('now')
  `).get().c;
  const doneToday = db.prepare(`
    SELECT COUNT(*) c FROM followups WHERE status='Done' AND date(COALESCE(completed_at, sent_at)) = date('now')
  `).get().c;
  const overdue = db.prepare(`
    SELECT COUNT(*) c FROM followups WHERE status='Planned' AND datetime(scheduled_at) < datetime('now')
  `).get().c;
  const totalPlanned = db.prepare(`SELECT COUNT(*) c FROM followups WHERE status='Planned'`).get().c;
  res.json({ planned_today: plannedToday, done_today: doneToday, overdue, total_planned: totalPlanned });
});

// Task tracking summary for the dashboard
router.get('/tasks-summary', (req, res) => {
  const dueToday = db.prepare(`
    SELECT COUNT(*) c FROM tasks WHERE status != 'Done' AND date(due_date) = date('now')
  `).get().c;
  const overdue = db.prepare(`
    SELECT COUNT(*) c FROM tasks WHERE status != 'Done' AND due_date IS NOT NULL AND datetime(due_date) < datetime('now')
  `).get().c;
  const doneToday = db.prepare(`
    SELECT COUNT(*) c FROM tasks WHERE status='Done' AND date(completed_at) = date('now')
  `).get().c;
  const pendingDocs = db.prepare(`SELECT COUNT(*) c FROM documents WHERE status='Pending'`).get().c;
  res.json({ due_today: dueToday, overdue, done_today: doneToday, pending_documents: pendingDocs });
});

module.exports = router;
