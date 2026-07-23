// Populates realistic demo data across every module so a demo/dashboard walkthrough
// looks properly populated. Safe by design:
//   - Only runs when SEED_DEMO_DATA=true is set as an environment variable
//   - Only runs if the inquiries table is currently empty (never double-seeds,
//     never overwrites real data you've since entered)
// Remove the env var any time after your first deploy with it — it's harmless
// to leave in place since it won't fire again once real data exists.

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fmt(d) { return d.toISOString().slice(0, 19).replace('T', ' '); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return fmt(d); }
function dateOnly(d) { return d.toISOString().slice(0, 10); }

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Pooja', 'Rohan', 'Neha', 'Karan', 'Ananya',
  'Siddharth', 'Divya', 'Arjun', 'Kavya', 'Rajesh', 'Meera', 'Sanjay', 'Ritu', 'Varun', 'Isha',
  'Aditya', 'Shreya', 'Nikhil', 'Tanvi', 'Suresh', 'Anjali', 'Vivek', 'Radhika', 'Manish', 'Swati',
  'Deepak', 'Pallavi', 'Yash', 'Ishita', 'Gaurav', 'Simran', 'Akash', 'Nidhi', 'Harsh', 'Komal',
  'Rakesh', 'Sunita', 'Abhishek', 'Preeti', 'Vikas', 'Shweta', 'Mohit', 'Neelam', 'Ashish', 'Priyanka',
  'Tarun', 'Bhavna', 'Rohit', 'Sarita', 'Naveen', 'Kirti', 'Sameer', 'Alisha', 'Chirag', 'Madhavi'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Deshmukh', 'Kulkarni', 'Joshi', 'Gupta', 'Singh', 'Mehta', 'Reddy',
  'Iyer', 'Nair', 'Chatterjee', 'Bhatt', 'Agarwal', 'Rao', 'Pillai', 'Malhotra', 'Kapoor', 'Chauhan',
  'Bose', 'Dubey', 'Pandey', 'Trivedi', 'Shah'];

const UNIVERSITIES = [
  { name: 'University of Toronto', country: 'Canada', city: 'Toronto' },
  { name: 'McGill University', country: 'Canada', city: 'Montreal' },
  { name: 'Conestoga College', country: 'Canada', city: 'Kitchener' },
  { name: 'Humber College', country: 'Canada', city: 'Toronto' },
  { name: 'University of Melbourne', country: 'Australia', city: 'Melbourne' },
  { name: 'Monash University', country: 'Australia', city: 'Melbourne' },
  { name: 'Deakin University', country: 'Australia', city: 'Geelong' },
  { name: 'La Trobe University', country: 'Australia', city: 'Melbourne' },
  { name: 'University of Manchester', country: 'United Kingdom', city: 'Manchester' },
  { name: 'University of Birmingham', country: 'United Kingdom', city: 'Birmingham' },
  { name: 'Coventry University', country: 'United Kingdom', city: 'Coventry' },
  { name: 'Arizona State University', country: 'United States', city: 'Tempe' },
  { name: 'University of Texas at Dallas', country: 'United States', city: 'Dallas' },
  { name: 'University of Auckland', country: 'New Zealand', city: 'Auckland' },
  { name: 'Victoria University of Wellington', country: 'New Zealand', city: 'Wellington' },
  { name: 'Technical University of Munich', country: 'Germany', city: 'Munich' },
  { name: 'RWTH Aachen University', country: 'Germany', city: 'Aachen' },
  { name: 'University of British Columbia', country: 'Canada', city: 'Vancouver' },
];

const COURSE_TEMPLATES = [
  { name: 'MBA', level: 'Masters', months: 24, fee: 45000 },
  { name: 'MS Computer Science', level: 'Masters', months: 24, fee: 38000 },
  { name: 'MS Data Science', level: 'Masters', months: 18, fee: 36000 },
  { name: 'Bachelor of Business Administration', level: 'Bachelors', months: 36, fee: 60000 },
  { name: 'MS Information Technology', level: 'Masters', months: 24, fee: 34000 },
  { name: 'Diploma in Business Management', level: 'Diploma', months: 12, fee: 18000 },
  { name: 'MS Cybersecurity', level: 'Masters', months: 18, fee: 37000 },
  { name: 'Master of Engineering Management', level: 'Masters', months: 24, fee: 40000 },
];

function seedDemoData(db) {
  const existing = db.prepare('SELECT COUNT(*) c FROM inquiries').get().c;
  if (existing > 0) {
    console.log('Demo seed skipped — inquiries table already has data.');
    return;
  }

  console.log('Seeding demo data across all modules...');

  const getOptions = (type) => db.prepare('SELECT label FROM master_options WHERE list_type=? AND active=1').all(type).map((r) => r.label);
  const leadSources = getOptions('lead_source');
  const priorities = getOptions('priority');
  const documentTypes = getOptions('document_type');
  const paymentModes = getOptions('payment_mode');
  const applicationStatuses = [
    ...Array(6).fill('Draft'),
    ...Array(9).fill('Submitted'),
    ...Array(8).fill('Under Review'),
    ...Array(8).fill('Offer Received'),
    ...Array(14).fill('Accepted'),
    ...Array(4).fill('Rejected'),
    ...Array(3).fill('Withdrawn'),
  ];

  // ---- Master Data: countries, universities, courses, intakes ----
  const countryIds = {};
  for (const c of ['Canada', 'United States', 'United Kingdom', 'Australia', 'New Zealand', 'Germany', 'India']) {
    const info = db.prepare('INSERT INTO countries (name) VALUES (?)').run(c);
    countryIds[c] = info.lastInsertRowid;
  }

  const universityIds = [];
  for (const u of UNIVERSITIES) {
    const info = db.prepare('INSERT INTO universities (name, country_id, city) VALUES (?,?,?)')
      .run(u.name, countryIds[u.country], u.city);
    universityIds.push(info.lastInsertRowid);
    // 2 courses per university
    const templates = [randomFrom(COURSE_TEMPLATES), randomFrom(COURSE_TEMPLATES)];
    for (const t of templates) {
      db.prepare('INSERT INTO courses (university_id, name, level, duration_months, currency, tuition_fee) VALUES (?,?,?,?,?,?)')
        .run(info.lastInsertRowid, t.name, t.level, t.months, 'USD', t.fee);
    }
  }
  const courseRows = db.prepare('SELECT id, university_id, name, tuition_fee FROM courses').all();

  const intakeLabels = ['Spring 2026', 'Fall 2026', 'Spring 2027', 'Fall 2027', 'Winter 2026', 'Summer 2026'];
  const intakeIds = intakeLabels.map((label, i) =>
    db.prepare('INSERT INTO intakes (label, month, year) VALUES (?,?,?)').run(label, [1, 9, 1, 9, 12, 5][i], 2026 + Math.floor(i / 2)).lastInsertRowid
  );

  // ---- Institutions (business partner entities; ~half linked to a Master Data university) ----
  const institutionIds = [];
  for (let i = 0; i < 22; i++) {
    const linkToUni = i < universityIds.length ? universityIds[i] : null;
    const uni = linkToUni ? UNIVERSITIES[i] : null;
    const name = uni ? uni.name : `${randomFrom(['Nagpur', 'Pune', 'Mumbai', 'Delhi'])} Overseas Desk ${i}`;
    const city = uni ? uni.city : randomFrom(['Nagpur', 'Pune', 'Mumbai']);
    const commissionType = Math.random() > 0.5 ? 'percentage' : 'flat';
    const commissionValue = commissionType === 'percentage' ? randomInt(8, 18) : randomInt(3000, 8000);
    const info = db.prepare(`
      INSERT INTO institutions (name, type, city, commission_type, commission_value, university_id, contact_person, contact_phone)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(name, randomFrom(['College', 'University', 'School']), city, commissionType, commissionValue, linkToUni,
      `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`, `9${randomInt(100000000, 999999999)}`);
    institutionIds.push(info.lastInsertRowid);
  }

  // ---- Inquiries (58), spread across statuses and the last ~90 days ----
  const INQUIRY_TOTAL = 58;
  const statusWeights = [
    ...Array(12).fill('New'),
    ...Array(16).fill('In Counseling'),
    ...Array(23).fill('Converted'),
    ...Array(7).fill('Dropped'),
  ];
  const inquiryIds = [];
  const inquiryStatusMap = {};
  for (let i = 0; i < INQUIRY_TOTAL; i++) {
    const name = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
    const status = statusWeights[i];
    const createdDaysAgo = randomInt(1, 90);
    const info = db.prepare(`
      INSERT INTO inquiries (name, phone, email, course_interest, source, status, counselor, priority, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      name, `9${randomInt(100000000, 999999999)}`, `${name.toLowerCase().replace(' ', '.')}@example.com`,
      randomFrom(['MBA', 'MS Computer Science', 'MS Data Science', 'BBA', 'MS IT', 'Diploma in Business']),
      randomFrom(leadSources), status, randomFrom(['Amit', 'Priya', 'Rohan', null]),
      randomFrom(priorities), daysAgo(createdDaysAgo)
    );
    inquiryIds.push(info.lastInsertRowid);
    inquiryStatusMap[info.lastInsertRowid] = status;

    // link 1-2 institutions for counseling on most inquiries
    if (status !== 'New') {
      const linkCount = randomInt(1, 2);
      const picked = new Set();
      for (let j = 0; j < linkCount; j++) {
        const instId = randomFrom(institutionIds);
        if (picked.has(instId)) continue;
        picked.add(instId);
        const linkStatus = status === 'Dropped' ? randomFrom(['Rejected', 'Not Interested'])
          : status === 'Converted' ? randomFrom(['Offer', 'Applied'])
          : randomFrom(['Counseling', 'Applied']);
        try {
          db.prepare('INSERT INTO inquiry_institutions (inquiry_id, institution_id, status) VALUES (?,?,?)')
            .run(info.lastInsertRowid, instId, linkStatus);
        } catch (e) { /* unique constraint, skip */ }
      }
    }
  }

  // ---- Convert the 23 "Converted" inquiries into Students ----
  const studentIds = [];
  for (const inqId of inquiryIds) {
    if (inquiryStatusMap[inqId] !== 'Converted') continue;
    const inq = db.prepare('SELECT * FROM inquiries WHERE id=?').get(inqId);
    const countryPool = ['Canada', 'United States', 'United Kingdom', 'Australia', 'New Zealand', 'Germany'];
    const info = db.prepare(`
      INSERT INTO students (inquiry_id, name, phone, email, date_of_birth, gender, city, country_id,
        passport_number, highest_qualification, academic_percentage, english_test, english_test_score, converted_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      inqId, inq.name, inq.phone, inq.email,
      `${randomInt(1996, 2004)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      randomFrom(['Male', 'Female']), randomFrom(['Nagpur', 'Pune', 'Mumbai', 'Nashik']),
      countryIds[randomFrom(countryPool)], `P${randomInt(1000000, 9999999)}`,
      randomFrom(['B.Com', 'B.Sc', 'B.Tech', 'BBA', 'B.A']), `${randomInt(60, 92)}%`,
      randomFrom(['IELTS', 'PTE', 'TOEFL']), (Math.random() * 2 + 6).toFixed(1),
      daysAgo(randomInt(1, 60))
    );
    studentIds.push(info.lastInsertRowid);
  }

  // ---- Applications (~58) — students can have 1-2 each ----
  const applicationRows = [];
  let appCount = 0;
  for (const studentId of studentIds) {
    const numApps = randomInt(2, 3);
    for (let j = 0; j < numApps && appCount < 58; j++) {
      const instId = randomFrom(institutionIds);
      const inst = db.prepare('SELECT * FROM institutions WHERE id=?').get(instId);
      const course = inst.university_id ? randomFrom(courseRows.filter((c) => c.university_id === inst.university_id)) : null;
      const status = randomFrom(applicationStatuses);
      const submittedAt = ['Submitted', 'Under Review', 'Offer Received', 'Accepted', 'Rejected', 'Withdrawn'].includes(status)
        ? daysAgo(randomInt(2, 45)) : null;
      const decisionAt = ['Offer Received', 'Accepted', 'Rejected', 'Withdrawn'].includes(status)
        ? daysAgo(randomInt(1, 20)) : null;
      const info = db.prepare(`
        INSERT INTO applications (student_id, institution_id, course_id, course, intake_id, status, submitted_at, decision_at, created_at)
        VALUES (?,?,?,?,?,?,?,?,?)
      `).run(studentId, instId, course ? course.id : null, course ? course.name : randomFrom(['MBA', 'MS IT', 'BBA']),
        randomFrom(intakeIds), status, submittedAt, decisionAt, daysAgo(randomInt(10, 60)));
      applicationRows.push({ id: info.lastInsertRowid, studentId, instId, status, course });
      appCount++;
    }
  }

  // ---- Enrollments (from Accepted applications) + Payments ----
  const acceptedApps = applicationRows.filter((a) => a.status === 'Accepted');
  for (const app of acceptedApps) {
    const inst = db.prepare('SELECT * FROM institutions WHERE id=?').get(app.instId);
    const feeTotal = app.course && app.course.tuition_fee ? app.course.tuition_fee : randomInt(20000, 50000);
    const commissionAmount = inst.commission_type === 'flat' ? inst.commission_value : (feeTotal * inst.commission_value) / 100;
    const paymentStatus = randomFrom(['Pending', 'Partial', 'Partial', 'Received']);
    const enrollInfo = db.prepare(`
      INSERT INTO enrollments (student_id, institution_id, course, course_id, fee_total, commission_type, commission_value,
        commission_amount, payment_status, application_id, enrolled_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(app.studentId, app.instId, app.course ? app.course.name : 'MBA', app.course ? app.course.id : null,
      feeTotal, inst.commission_type, inst.commission_value, commissionAmount, paymentStatus, app.id, daysAgo(randomInt(5, 40)));
    const enrollmentId = enrollInfo.lastInsertRowid;

    if (paymentStatus !== 'Pending') {
      const paidSoFar = paymentStatus === 'Received' ? feeTotal : Math.round(feeTotal * randomInt(30, 70) / 100);
      const numPayments = randomInt(1, 2);
      let remaining = paidSoFar;
      for (let p = 0; p < numPayments; p++) {
        const amt = p === numPayments - 1 ? remaining : Math.round(remaining / 2);
        remaining -= amt;
        db.prepare('INSERT INTO payments (enrollment_id, amount, payment_mode, paid_at) VALUES (?,?,?,?)')
          .run(enrollmentId, amt, randomFrom(paymentModes), daysAgo(randomInt(1, 30)));
      }
    }
  }

  // ---- Documents (~58 across students) ----
  let docCount = 0;
  for (const studentId of studentIds) {
    const numDocs = randomInt(1, 3);
    for (let j = 0; j < numDocs && docCount < 58; j++) {
      const status = randomFrom(['Pending', 'Pending', 'Received', 'Verified', 'Rejected']);
      db.prepare('INSERT INTO documents (student_id, document_type, status, received_at, created_at) VALUES (?,?,?,?,?)')
        .run(studentId, randomFrom(documentTypes),
          status, status === 'Pending' ? null : daysAgo(randomInt(1, 20)), daysAgo(randomInt(1, 30)));
      docCount++;
    }
  }

  // ---- Tasks (~55): mix of overdue, due today, upcoming, done ----
  const taskTitles = ['Call student for document follow-up', 'Send offer letter', 'Verify passport copy',
    'Collect balance payment', 'Schedule visa interview prep', 'Follow up on IELTS score', 'Send university brochure',
    'Confirm intake seat', 'Request bank statement', 'Review SOP draft'];
  for (let i = 0; i < 55; i++) {
    const bucket = randomFrom(['overdue', 'overdue', 'today', 'upcoming', 'upcoming', 'done']);
    let dueDate, status, completedAt = null;
    if (bucket === 'overdue') { dueDate = daysAgo(randomInt(1, 10)); status = randomFrom(['To Do', 'In Progress']); }
    else if (bucket === 'today') { dueDate = fmt(new Date()); status = randomFrom(['To Do', 'In Progress']); }
    else if (bucket === 'upcoming') { dueDate = daysFromNow(randomInt(1, 14)); status = 'To Do'; }
    else { dueDate = daysAgo(randomInt(1, 20)); status = 'Done'; completedAt = daysAgo(randomInt(0, 5)); }

    const linkStudent = Math.random() > 0.4 && studentIds.length ? randomFrom(studentIds) : null;
    db.prepare(`
      INSERT INTO tasks (title, entity_type, entity_id, assigned_to, priority, status, due_date, completed_at, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(randomFrom(taskTitles), linkStudent ? 'student' : null, linkStudent,
      randomFrom(['Amit', 'Priya', 'Rohan']), randomFrom(priorities), status, dueDate, completedAt, daysAgo(randomInt(1, 15)));
  }

  // ---- Follow-ups (~58): planned today, overdue, done with dispositions ----
  const dispositions = ['Interested', 'Not Interested', 'Call Back Later', 'Not Reachable', 'Wrong Number', 'Converted', 'No Response'];
  let followupCount = 0;
  for (const inqId of inquiryIds) {
    if (followupCount >= 58) break;
    const numFollowups = randomInt(0, 2);
    for (let j = 0; j < numFollowups && followupCount < 58; j++) {
      const bucket = randomFrom(['done', 'done', 'planned_today', 'planned_overdue', 'planned_upcoming']);
      if (bucket === 'done') {
        db.prepare(`
          INSERT INTO followups (inquiry_id, type, disposition, remark, status, completed_at, sent_at)
          VALUES (?,?,?,?,?,?,?)
        `).run(inqId, randomFrom(['call', 'whatsapp']), randomFrom(dispositions),
          randomFrom(['Discussed course options', 'Sent fee structure', 'Confirmed documents needed', null]),
          'Done', daysAgo(randomInt(0, 20)), daysAgo(randomInt(0, 20)));
      } else {
        const scheduledAt = bucket === 'planned_today' ? fmt(new Date())
          : bucket === 'planned_overdue' ? daysAgo(randomInt(1, 7))
          : daysFromNow(randomInt(1, 10));
        db.prepare(`
          INSERT INTO followups (inquiry_id, type, remark, status, scheduled_at, sent_at)
          VALUES (?,?,?,?,?,?)
        `).run(inqId, 'call', randomFrom(['Discuss intake deadline', 'Follow up on documents', 'Confirm payment plan', null]),
          'Planned', scheduledAt, daysAgo(randomInt(1, 5)));
      }
      followupCount++;
    }
  }

  console.log(`Demo seed complete: ${inquiryIds.length} inquiries, ${studentIds.length} students, ${applicationRows.length} applications.`);
}

module.exports = { seedDemoData };
