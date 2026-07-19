const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', require('./routes/auth'));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Everything below requires a valid, active login
app.use('/api/institutions', requireAuth, require('./routes/institutions'));
app.use('/api/inquiries', requireAuth, require('./routes/inquiries'));
app.use('/api/students', requireAuth, require('./routes/students'));
app.use('/api/enrollments', requireAuth, require('./routes/enrollments'));
app.use('/api/reports', requireAuth, require('./routes/reports'));
app.use('/api/custom-fields', requireAuth, require('./routes/customFields'));
app.use('/api/followups', requireAuth, require('./routes/followups'));
app.use('/api/master-data', requireAuth, require('./routes/masterData'));
app.use('/api/applications', requireAuth, require('./routes/applications'));
app.use('/api/documents', requireAuth, require('./routes/documents'));
app.use('/api/tasks', requireAuth, require('./routes/tasks'));
app.use('/api/payments', requireAuth, require('./routes/payments'));
app.use('/api/users', requireAuth, require('./routes/users'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Edu CRM API running on port ${PORT}`));
