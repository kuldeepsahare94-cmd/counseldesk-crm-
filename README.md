# CounselDesk — Education Consultancy CRM

A CRM built for your consultancy workflow:

**Inquiry → counseled by multiple institutions → converted to Student → enrolled in one institution → revenue/commission tracked.**

## What's inside

- `backend/` — Node.js + Express API, SQLite database (file-based, zero setup)
- `frontend/` — React (Vite) dashboard, Tailwind CSS

## Data model

- **Institutions** — schools/colleges/universities, each with a commission rule (% or flat ₹)
- **Inquiries** — the first contact point (name, phone, course interest, source)
- **Inquiry ↔ Institution** — many-to-many. One inquiry can be linked to several institutions for counseling, each with its own status (Counseling / Applied / Offer / Rejected / Not Interested)
- **Students** — created when you click "Convert to student" on an inquiry
- **Enrollments** — a student's actual onboarding into one institution, with fee, commission %, and payment status (Pending/Partial/Received)
- **Follow-ups** — manual WhatsApp (via wa.me click-to-chat, no cost) and call logs, timestamped per inquiry

## Running it locally

**Backend:**
```bash
cd backend
npm install
node server.js
```
Runs on `http://localhost:4000`. The database file `crm.db` is created automatically on first run — no separate database server needed.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api` calls to the backend.

## Deploying to your own server (e2e)

1. Copy both folders to your server
2. Backend: `npm install --production`, then run with `pm2 start server.js --name counseldesk-api` (keeps it alive, restarts on crash)
3. Frontend: `npm install && npm run build` — this produces a `dist/` folder of static files. Serve it with Nginx/Apache, or `npx serve dist`
4. Point Nginx to proxy `/api/*` requests to `http://localhost:4000` (same pattern as the Vite dev proxy)
5. Back up `backend/crm.db` regularly (it's a single file — trivial to copy/schedule via cron)

## What's next (not yet built, tell me which you want first)

1. **WhatsApp Business API** — replace the free click-to-chat with automated template reminders (needs a BSP like Gupshup/Interakt/Twilio, Meta business verification, and per-message cost)
2. **User login & roles** — right now anyone with the link can see everything; add counselor logins so each person sees only their assigned inquiries
3. **SMS integration** — via an SMS gateway API (MSG91, Twilio, etc.)
4. **Export reports** — download revenue/counseling reports as Excel/PDF
5. **Multi-user assignment** — auto-round-robin inquiries to counselors

## Try it now

Add an institution first (Institutions tab), then add an inquiry (Inquiries tab), link it to one or more institutions for counseling, convert it to a student once counseling is done, then enroll the student into their final institution to see the commission auto-calculate on the Dashboard.
