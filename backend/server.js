const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/students', require('./routes/students'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/custom-fields', require('./routes/customFields'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Edu CRM API running on port ${PORT}`));
