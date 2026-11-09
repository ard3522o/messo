/* Seeds the mess management database with realistic demo data. */
const { connectDB, disconnectDB } = require('../config/db');
const env = require('../config/env');

const User = require('../models/User');
const Student = require('../models/Student');
const Menu = require('../models/Menu');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Inventory = require('../models/Inventory');
const StockLog = require('../models/StockLog');
const Announcement = require('../models/Announcement');
const Subscription = require('../models/Subscription');

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];
const HOSTELS = ['Ganga', 'Yamuna', 'Saraswati', 'Narmada', 'Godavari', 'Kaveri'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Metallurgy', 'Mathematics', 'Physics'];
const DEPT_CODES = { CSE: 'BCS', ECE: 'BEC', EEE: 'BEE', Mechanical: 'BME', Civil: 'BCE', Metallurgy: 'BMT', Mathematics: 'BMA', Physics: 'BPH' };

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const chance = (p) => Math.random() < p;
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const shiftDays = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};
const shiftMonths = (base, months) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
};

const IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  dinner: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
};

const MENU_POOL = {
  breakfast: [
    [['Aloo Paratha', 'veg', 320], ['Curd', 'veg', 90], ['Boiled Egg', 'non-veg', 78], ['Tea / Coffee', 'veg', 60]],
    [['Poha', 'veg', 250], ['Sprouts', 'veg', 110], ['Boiled Egg', 'non-veg', 78], ['Milk', 'veg', 120]],
    [['Idli Sambar', 'veg', 280], ['Coconut Chutney', 'veg', 80], ['Banana', 'veg', 105], ['Tea', 'veg', 50]],
    [['Puri Bhaji', 'veg', 340], ['Fruit Bowl', 'veg', 130], ['Boiled Egg', 'non-veg', 78], ['Coffee', 'veg', 60]],
    [['Upma', 'veg', 240], ['Vada', 'veg', 160], ['Sprouts Salad', 'veg', 110], ['Milk', 'veg', 120]],
    [['Chole Bhature', 'veg', 430], ['Curd', 'veg', 90], ['Banana', 'veg', 105], ['Tea', 'veg', 50]],
    [['Masala Dosa', 'veg', 300], ['Sambar', 'veg', 90], ['Boiled Egg', 'non-veg', 78], ['Coffee', 'veg', 60]],
  ],
  lunch: [
    [['Steamed Rice', 'veg', 320], ['Dal Tadka', 'veg', 180], ['Paneer Butter Masala', 'veg', 340], ['Roti', 'veg', 140], ['Green Salad', 'veg', 60]],
    [['Jeera Rice', 'veg', 330], ['Rajma Curry', 'veg', 220], ['Chicken Curry', 'non-veg', 380], ['Roti', 'veg', 140], ['Pickle', 'veg', 20]],
    [['Rice', 'veg', 320], ['Sambar', 'veg', 150], ['Mix Veg', 'veg', 200], ['Chapati', 'veg', 140], ['Curd', 'veg', 90]],
    [['Veg Pulao', 'veg', 360], ['Dal Fry', 'veg', 180], ['Egg Curry', 'non-veg', 280], ['Roti', 'veg', 140], ['Salad', 'veg', 60]],
    [['Steamed Rice', 'veg', 320], ['Kadhi Pakora', 'veg', 240], ['Aloo Gobi', 'veg', 200], ['Roti', 'veg', 140], ['Buttermilk', 'veg', 70]],
    [['Fried Rice', 'veg', 380], ['Manchurian Gravy', 'veg', 260], ['Chicken Masala', 'non-veg', 390], ['Soup', 'veg', 90], ['Salad', 'veg', 60]],
    [['Rice', 'veg', 320], ['Dal Makhani', 'veg', 280], ['Bhindi Masala', 'veg', 180], ['Roti', 'veg', 140], ['Curd', 'veg', 90]],
  ],
  snacks: [
    [['Samosa', 'veg', 260], ['Green Chutney', 'veg', 30], ['Masala Tea', 'veg', 70]],
    [['Veg Sandwich', 'veg', 220], ['Fruit Juice', 'veg', 120], ['Coffee', 'veg', 60]],
    [['Pakora', 'veg', 250], ['Tea', 'veg', 50], ['Banana', 'veg', 105]],
    [['Veg Cutlet', 'veg', 230], ['Ketchup', 'veg', 30], ['Lemon Tea', 'veg', 55]],
    [['Pav Bhaji', 'veg', 320], ['Buttermilk', 'veg', 70]],
    [['Egg Roll', 'non-veg', 330], ['Tea', 'veg', 50], ['Fruit Bowl', 'veg', 130]],
    [['Bread Butter', 'veg', 180], ['Corn Chaat', 'veg', 160], ['Coffee', 'veg', 60]],
  ],
  dinner: [
    [['Veg Biryani', 'veg', 430], ['Raita', 'veg', 90], ['Mirchi Salan', 'veg', 80], ['Gulab Jamun', 'veg', 160]],
    [['Rice', 'veg', 320], ['Dal Tadka', 'veg', 180], ['Chicken Curry', 'non-veg', 380], ['Roti', 'veg', 140], ['Salad', 'veg', 60]],
    [['Chapati', 'veg', 140], ['Paneer Tikka Masala', 'veg', 320], ['Jeera Rice', 'veg', 330], ['Curd', 'veg', 90]],
    [['Veg Fried Rice', 'veg', 380], ['Chilli Paneer', 'veg', 290], ['Soup', 'veg', 90], ['Ice Cream', 'veg', 150]],
    [['Roti', 'veg', 140], ['Mix Veg Curry', 'veg', 220], ['Dal Fry', 'veg', 180], ['Rice', 'veg', 320], ['Salad', 'veg', 60]],
    [['Egg Biryani', 'non-veg', 420], ['Raita', 'veg', 90], ['Papad', 'veg', 60], ['Fruit Custard', 'veg', 160]],
    [['Rice', 'veg', 320], ['Kadhi', 'veg', 220], ['Aloo Methi', 'veg', 190], ['Roti', 'veg', 140], ['Pickle', 'veg', 20]],
  ],
};

// Weekly schedule supplied for the mess menu (Monday through Sunday).
const WEEKLY_SCHEDULE = [
  { breakfast: 'Poha + Matar Curry + Jalebi', lunch: 'Rice/Roti + Dalma + Chole + Onion Salad', dinner: 'Rice/Roti + Dal + Paneer Masala' },
  { breakfast: 'Idli, Sambar, Chutney', lunch: 'Rice/Roti + Dal + Rajma + Dahi boondi + Fryums + Sambar', dinner: 'Rice/Roti + Dal + Veg Manchurian / Egg Curry' },
  { breakfast: 'Puri + Ghuguni', lunch: 'Rice/Roti + Dal + Chicken 3pcs curry / Paneer Curry + Salad', dinner: 'Rice/Roti + Dal + Egg Tadka / Chilli Soyabean + Gulab Jamun' },
  { breakfast: 'Upma + Matar Curry + Tea/Coffee', lunch: 'Rice/Roti + Dal + Mushroom (veg) / Prawns (non-veg, 3 pc)', dinner: 'Rice/Roti + Dal + Chana-Paneer Curry' },
  { breakfast: 'Uttapam/Masala Chakuli + Sambar + Chutney', lunch: 'Rice/Roti + Arhar Dal + Fish Curry / Paneer + Salad', dinner: 'Rice/Roti + Dal + Paneer / Chicken Kasa (3pcs)' },
  { breakfast: 'Khakra/Kakera + Aloo Chop + Matar Curry', lunch: 'Rice/Roti + Egg Curry + Mix Veg + Papad', dinner: 'Rice/Roti + Dal + Chilli Paneer / Chilli Chicken' },
  { breakfast: 'Vada + Matar Curry', lunch: 'Chicken / Veg Biryani(Veg) + Raita + Chicken Gravy', dinner: 'Rice/Roti + Dal + Chicken Kasa (3pcs) / Paneer Hyderabadi' },
];

const buildMeals = (date) => {
  const idx = new Date(`${date}T00:00:00`).getDay();
  const meal = (type, start, end, price) => ({
    items: type !== 'snacks'
      ? [{ name: WEEKLY_SCHEDULE[(idx + 6) % 7][type], category: /chicken|egg|prawn|fish|non-veg/i.test(WEEKLY_SCHEDULE[(idx + 6) % 7][type]) ? 'non-veg' : 'veg', calories: 0, image: IMAGES[type] }]
      : MENU_POOL[type][idx].map(([name, category, calories], i) => ({ name, category, calories, image: i === 0 ? IMAGES[type] : '' })),
    startTime: start,
    endTime: end,
    price,
    notes: '',
    isAvailable: true,
  });
  return {
    breakfast: meal('breakfast', '07:30', '09:30', 40),
    lunch: meal('lunch', '12:30', '14:30', 80),
    snacks: meal('snacks', '16:30', '18:00', 30),
    dinner: meal('dinner', '19:30', '21:30', 80),
  };
};

const FIRST = ['Aarav', 'Ananya', 'Rohan', 'Ishita', 'Kabir', 'Meera', 'Aditya', 'Sneha', 'Arjun', 'Priya', 'Vivaan', 'Diya', 'Reyansh', 'Kavya', 'Aryan', 'Tanvi', 'Siddharth', 'Nandini', 'Omkar', 'Pooja', 'Harsh', 'Riya', 'Devansh', 'Aisha', 'Yash', 'Shreya', 'Nikhil', 'Anjali', 'Rahul', 'Sakshi', 'Manish', 'Trisha', 'Karan', 'Bhavya', 'Sarthak'];
const LAST = ['Sharma', 'Mohapatra', 'Patra', 'Nayak', 'Das', 'Behera', 'Sahoo', 'Panda', 'Mishra', 'Rout', 'Jena', 'Swain', 'Mohanty', 'Pradhan', 'Ghosh', 'Verma', 'Gupta', 'Reddy'];

const seed = async () => {
  const startTime = Date.now();
  console.log('[seed] clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Menu.deleteMany({}), Attendance.deleteMany({}),
    Payment.deleteMany({}), Complaint.deleteMany({}), Feedback.deleteMany({}), Inventory.deleteMany({}),
    StockLog.deleteMany({}), Announcement.deleteMany({}), Subscription.deleteMany({}),
  ]);

  /* ---------------------------- users & students --------------------------- */
  const admin = await User.create({
    name: 'Dr. Sanjay Mishra', email: 'admin@iiit-bh.ac.in', password: 'Admin@123',
    phone: '9876543210', role: 'admin',
  });
  const manager = await User.create({
    name: 'Rakesh Patra', email: 'manager@iiit-bh.ac.in', password: 'Manager@123',
    phone: '9876543211', role: 'manager',
  });

  const demoUser = await User.create({
    name: 'Aarav Sharma', email: 'student@iiit-bh.ac.in', password: 'Student@123',
    phone: '9876543212', role: 'student',
  });
  const demoStudent = await Student.create({
    user: demoUser._id, studentId: '23BCS1042', name: 'Aarav Sharma', email: 'student@iiit-bh.ac.in',
    phone: '9876543212', hostel: 'Ganga', roomNumber: 'B-214', department: 'CSE', year: 3,
    messCardId: 'IIIT-MESS-23BCS1042', messType: 'veg', subscriptionStatus: 'active', joinedOn: shiftMonths(new Date(), -10),
  });

  const students = [demoStudent];
  const studentUsers = [demoUser];
  for (let i = 0; i < 34; i += 1) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const number = 1100 + i;
    const studentId = `${20 + (i % 4)}${DEPT_CODES[department]}${number}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@iiit-bh.ac.in`;
    const user = await User.create({
      name: `${first} ${last}`, email, password: 'Student@123',
      phone: `9${String(800000000 + i * 137931).slice(0, 9)}`, role: 'student',
    });
    const student = await Student.create({
      user: user._id, studentId, name: `${first} ${last}`, email, phone: user.phone,
      hostel: HOSTELS[i % HOSTELS.length], roomNumber: `${String.fromCharCode(65 + (i % 4))}-${200 + i}`,
      department, year: (i % 4) + 1, messCardId: `IIIT-MESS-${studentId}`,
      messType: i % 5 === 0 ? 'non-veg' : 'veg',
      dietaryPreference: i % 5 === 0 ? 'non-veg' : 'veg',
      subscriptionStatus: i < 30 ? 'active' : i < 32 ? 'expired' : 'inactive',
      joinedOn: shiftMonths(new Date(), -(rand(2, 18))),
    });
    students.push(student);
    studentUsers.push(user);
  }
  const activeStudents = students.filter((s) => s.subscriptionStatus === 'active');
  console.log(`[seed] ${students.length} students (${activeStudents.length} active)`);

  /* ------------------------------ subscriptions ---------------------------- */
  const subscriptionDocs = [];
  students.forEach((student, i) => {
    if (student.subscriptionStatus === 'inactive') return;
    const start = shiftMonths(new Date(), student.subscriptionStatus === 'expired' ? -2 : -1);
    start.setDate(1);
    const end = shiftMonths(start, 1);
    subscriptionDocs.push({
      student: student._id,
      plan: 'monthly',
      startDate: start,
      endDate: student.subscriptionStatus === 'expired' ? shiftMonths(start, 1) : shiftMonths(new Date(), 1),
      amount: 3500,
      status: student.subscriptionStatus,
      autoRenew: i % 3 === 0,
      mealsIncluded: MEALS,
      createdBy: admin._id,
    });
  });
  await Subscription.insertMany(subscriptionDocs);

  /* --------------------------------- menus --------------------------------- */
  const menuDocs = [];
  for (let offset = -7; offset <= 6; offset += 1) {
    const date = key(shiftDays(new Date(), offset));
    menuDocs.push({
      date,
      meals: buildMeals(date),
      isPublished: true,
      specialNote: offset === 0 ? 'Sunday special: extra dessert at dinner 🍮' : '',
      createdBy: admin._id,
    });
  }
  await Menu.insertMany(menuDocs);

  /* ------------------------------- attendance ------------------------------ */
  const attendanceDocs = [];
  const todayKey = key(new Date());
  for (let offset = 20; offset >= 0; offset -= 1) {
    const date = key(shiftDays(new Date(), -offset));
    for (const student of students) {
      if (student.subscriptionStatus === 'inactive') continue;
      if (student.subscriptionStatus === 'expired' && offset < 15) continue;
      if (date === todayKey && student.studentId === '23BCS1042') continue; // leave demo student unmarked
      for (const meal of MEALS) {
        if (date === todayKey && meal === 'dinner' && chance(0.5)) continue;
        if (!chance(0.86)) continue;
        attendanceDocs.push({
          student: student._id,
          date,
          meal,
          status: 'present',
          method: chance(0.8) ? 'qr' : 'manual',
          markedAt: new Date(`${date}T${meal === 'breakfast' ? '08:10' : meal === 'lunch' ? '13:05' : meal === 'snacks' ? '17:05' : '20:15'}:00`),
          markedBy: chance(0.15) ? admin._id : undefined,
        });
      }
    }
  }
  await Attendance.insertMany(attendanceDocs);

  /* -------------------------------- payments ------------------------------- */
  const paymentDocs = [];
  const months = [4, 3, 2, 1, 0].map((offset) => monthKey(shiftMonths(new Date(), -offset)));
  const counters = {};
  students.forEach((student) => {
    if (student.subscriptionStatus === 'inactive') return;
    months.forEach((month, mIndex) => {
      counters[month] = (counters[month] || 0) + 1;
      const isCurrent = mIndex === months.length - 1;
      let status = 'paid';
      if (isCurrent) status = chance(0.42) ? 'paid' : chance(0.4) ? 'unpaid' : 'pending';
      else if (student.subscriptionStatus === 'expired') status = chance(0.6) ? 'paid' : 'unpaid';
      else status = chance(0.92) ? 'paid' : 'unpaid';

      const paidAt = status === 'paid' ? new Date(`${month}-${pad(rand(2, 18))}T${pad(rand(9, 18))}:${pad(rand(0, 59))}:00`) : undefined;
      paymentDocs.push({
        student: student._id,
        invoiceNo: `INV-${month.replace('-', '')}-${String(counters[month]).padStart(4, '0')}`,
        month,
        amount: 3500,
        breakdown: { messFee: 3500 },
        status,
        method: status === 'paid' ? pick(['upi', 'card', 'netbanking', 'cash']) : 'none',
        transactionId: status === 'paid' ? `TXN${month.replace('-', '')}${rand(10000, 99999)}` : '',
        receiptNo: status === 'paid' ? `RCPT-${month.replace('-', '')}-${student.studentId}` : '',
        paidAt,
        dueDate: new Date(`${month}-10T00:00:00`),
        recordedBy: admin._id,
      });
    });
  });
  await Payment.insertMany(paymentDocs);

  /* -------------------------------- feedback ------------------------------- */
  const comments = [
    'The paneer was fresh and well cooked. Loved the taste!',
    'Rice was slightly undercooked today, please improve.',
    'Great variety in lunch, keep it up.',
    'Food was too oily for my liking.',
    'Service was quick and the staff were polite.',
    'Dinner dessert was excellent. More of this please!',
    'Dal needed a bit more salt.',
    'Hygiene at the counter was very good today.',
    'Snacks ran out before 5:30 PM, please plan better.',
    'Perfectly spiced and warm. Thank you!',
    'Roti was hard, could be softer.',
    'Salad bar was fresh and clean.',
  ];
  const feedbackDocs = [];
  const feedbackSeen = new Set();
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = key(shiftDays(new Date(), -offset));
    const responders = activeStudents.filter(() => chance(0.55));
    responders.forEach((student) => {
      const meal = pick(MEALS);
      const dedupe = `${student._id}-${date}-${meal}`;
      if (feedbackSeen.has(dedupe)) return;
      feedbackSeen.add(dedupe);
      const rating = chance(0.45) ? 5 : chance(0.6) ? 4 : chance(0.7) ? 3 : 2;
      const tags = [];
      if (rating >= 4) tags.push('Taste');
      if (chance(0.35)) tags.push('Quantity');
      if (chance(0.3)) tags.push('Hygiene');
      if (chance(0.25)) tags.push('Variety');
      feedbackDocs.push({
        student: student._id, date, meal, rating,
        comment: chance(0.45) ? pick(comments) : '', tags,
        isAnonymous: chance(0.15),
      });
    });
  }
  await Feedback.insertMany(feedbackDocs);

  /* ------------------------------- complaints ------------------------------ */
  const complaintSeed = [
    ['Food Quality', 'Stale chapatis served at dinner', 'The chapatis served yesterday at dinner were hard and seemed stale. Many students at Ganga mess complained. Please ensure fresh rotis are served.', 'high', 'resolved', 'We sincerely apologise. The kitchen has been instructed to prepare rotis in smaller batches through the dinner window.'],
    ['Hygiene', 'Water spillage near handwash area', 'The floor near the handwash station has been waterlogged for two days, making it slippery. Needs immediate cleaning and drainage check.', 'urgent', 'in_progress', 'Housekeeping has been alerted and a drainage inspection is scheduled today.'],
    ['Menu', 'Request to add millet options', 'Could we have millets or oats at least twice a week for breakfast? Many students are looking for healthier alternatives.', 'low', 'open', ''],
    ['Staff Behaviour', 'Rude response at the serving counter', 'A staff member at the lunch counter was dismissive when I asked for an extra roti. Requesting polite behaviour with students.', 'medium', 'resolved', 'The staff member has been counselled about courteous service. Thank you for raising this.'],
    ['Food Quality', 'Too much oil in the sabzi', 'The mixed vegetable served today was floating in oil. Please reduce oil usage for everyday meals.', 'medium', 'open', ''],
    ['Other', 'Long queues during lunch rush', 'Between 1:00 and 1:30 PM the queue extends outside the hall. Could an additional counter be opened?', 'medium', 'in_progress', 'We are reviewing counter staffing for the 1:00–1:30 PM peak and will update this week.'],
    ['Hygiene', 'Insects near the waste disposal area', 'Noticed insects near the waste bins behind the dining hall. Pest control should be scheduled.', 'high', 'resolved', 'Pest control was completed on Saturday. Weekly checks are now in place.'],
    ['Menu', 'Non-veg portion size inconsistent', 'Chicken curry portion varies a lot by counter. Requesting standardised serving sizes.', 'medium', 'open', ''],
    ['Food Quality', 'Cold breakfast on Monday', 'Idlis served on Monday were cold by 8:30 AM. Please maintain the warmer temperature.', 'medium', 'resolved', 'Hot cases are now switched on 15 minutes earlier and monitored by the duty manager.'],
    ['Other', 'Suggestion box is not visible', 'Could we have a QR-based suggestion option at the entrance? The physical box is hard to find.', 'low', 'open', ''],
    ['Staff Behaviour', 'Staff handled utensils without gloves', 'The serving staff were handling rotis without gloves during dinner. Please enforce hygiene protocol.', 'high', 'in_progress', 'Gloves have been reissued and supervisors are enforcing the protocol.'],
    ['Food Quality', 'Excellent Sunday biryani', 'Special mention to the kitchen team for the Sunday biryani. It was flavourful and well cooked!', 'low', 'resolved', 'Thank you for the kind words — we have shared this with the kitchen team.'],
  ];
  const complaintDocs = complaintSeed.map((c, i) => {
    const student = activeStudents[(i * 3 + 1) % activeStudents.length];
    const created = shiftDays(new Date(), -(i * 2 + 1));
    const [category, subject, description, priority, status, response] = c;
    return {
      complaintNo: `CMP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      student: student._id, category, subject, description, priority, status,
      images: [],
      response: response ? { message: response, by: admin._id, at: shiftDays(created, 1) } : undefined,
      resolvedAt: status === 'resolved' ? shiftDays(created, 2) : undefined,
      createdAt: created,
      updatedAt: created,
    };
  });
  await Complaint.insertMany(complaintDocs);

  /* ------------------------------- inventory ------------------------------- */
  const inventorySeed = [
    ['Basmati Rice', 'Grains', 'kg', 180, 50, 78, 'Odisha Agro Traders'],
    ['Wheat Flour', 'Grains', 'kg', 140, 40, 42, 'Odisha Agro Traders'],
    ['Toor Dal', 'Grains', 'kg', 75, 25, 118, 'Shree Balaji Suppliers'],
    ['Paneer', 'Dairy', 'kg', 12, 15, 340, 'Milk Mantra Daily'],
    ['Milk', 'Dairy', 'litre', 85, 30, 58, 'Milk Mantra Daily'],
    ['Curd', 'Dairy', 'kg', 22, 12, 90, 'Milk Mantra Daily'],
    ['Onion', 'Vegetables', 'kg', 60, 20, 34, 'Local Mandi'],
    ['Potato', 'Vegetables', 'kg', 95, 30, 28, 'Local Mandi'],
    ['Tomato', 'Vegetables', 'kg', 18, 20, 46, 'Local Mandi'],
    ['Cauliflower', 'Vegetables', 'kg', 14, 10, 40, 'Local Mandi'],
    ['Sunflower Oil', 'Oil & Fats', 'litre', 38, 15, 138, 'Fortune Distributors'],
    ['Turmeric Powder', 'Spices', 'kg', 6, 2, 210, 'Shree Balaji Suppliers'],
    ['Tea Powder', 'Beverages', 'kg', 9, 4, 420, 'Assam Tea House'],
    ['LPG Cylinder (Commercial)', 'Other', 'pieces', 6, 3, 1850, 'Indane Commercial'],
  ];
  const inventoryItems = await Inventory.insertMany(
    inventorySeed.map(([name, category, unit, quantity, minThreshold, unitPrice, supplier]) => ({
      name, category, unit, quantity, minThreshold, unitPrice, supplier,
      lastRestockedAt: shiftDays(new Date(), -rand(1, 5)),
    }))
  );

  const stockLogs = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = key(shiftDays(new Date(), -offset));
    inventoryItems.forEach((item, i) => {
      if (chance(0.18)) {
        const qty = i < 3 ? rand(20, 40) : rand(5, 18);
        stockLogs.push({
          item: item._id, itemName: item.name, type: 'purchase', quantity: qty, unit: item.unit,
          unitCost: item.unitPrice, totalCost: qty * item.unitPrice, date,
          note: `Purchase from ${item.supplier}`, recordedBy: manager._id,
        });
      }
      if (i < 9 && chance(0.7)) {
        const qty = Number((rand(2, 12) * 0.75).toFixed(2));
        stockLogs.push({
          item: item._id, itemName: item.name, type: 'consumption', quantity: qty, unit: item.unit,
          unitCost: item.unitPrice, totalCost: qty * item.unitPrice, date,
          meal: pick(MEALS), recordedBy: manager._id,
        });
      }
      if (i < 6 && chance(0.28)) {
        const qty = Number((rand(1, 4) * 0.5).toFixed(2));
        stockLogs.push({
          item: item._id, itemName: item.name, type: 'wastage', quantity: qty, unit: item.unit,
          unitCost: item.unitPrice, totalCost: qty * item.unitPrice, date,
          note: 'Spoiled / leftover beyond safe storage', recordedBy: manager._id,
        });
      }
    });
  }
  await StockLog.insertMany(stockLogs);

  /* ----------------------------- announcements ----------------------------- */
  await Announcement.insertMany([
    {
      title: 'Revised dinner timings for this week', category: 'Menu', audience: 'all', isPinned: true,
      content: 'Due to the annual cultural fest rehearsals, dinner will be served from 7:00 PM to 9:00 PM from Wednesday to Friday. Please plan your meals accordingly.',
      publishedBy: admin._id, publishedAt: shiftDays(new Date(), -1),
    },
    {
      title: 'Monthly mess bill for November is now available', category: 'Payment', audience: 'students', isPinned: true,
      content: 'The mess bill of ₹3,500 for November has been raised. Please clear your dues before the 10th to avoid a late fee. Receipts can be downloaded from the Payments section after checkout.',
      publishedBy: admin._id, publishedAt: shiftDays(new Date(), -3),
    },
    {
      title: 'Special Sunday menu: Biryani & Gulab Jamun', category: 'Menu', audience: 'all',
      content: 'This Sunday the mess will serve Veg Biryani, Chicken Curry, Raita and Gulab Jamun for dinner. Vegetarian and non-vegetarian counters will operate separately.',
      publishedBy: admin._id, publishedAt: shiftDays(new Date(), -2),
    },
    {
      title: 'Feedback drive — tell us how we are doing', category: 'General', audience: 'students',
      content: 'We are collecting meal-wise feedback for the next two weeks. Rate each meal from the Feedback section and help us improve the menu and service quality.',
      publishedBy: admin._id, publishedAt: shiftDays(new Date(), -5),
    },
    {
      title: 'Kitchen deep-cleaning on Saturday', category: 'General', audience: 'all',
      content: 'The kitchen and dining hall will undergo deep cleaning this Saturday from 3 PM to 5 PM. Snacks service will be shifted to the annexe counter.',
      publishedBy: admin._id, publishedAt: shiftDays(new Date(), -4),
    },
    {
      title: 'Maggi counter trial at snacks', category: 'Menu', audience: 'students',
      content: 'A live Maggi counter will be trialled at snacks from next Monday. Feedback from the trial will decide whether it becomes a permanent addition.',
      publishedBy: admin._id, publishedAt: shiftDays(new Date(), -6),
    },
  ]);

  console.log('[seed] summary:');
  console.log(`  users: ${await User.countDocuments()}`);
  console.log(`  students: ${await Student.countDocuments()}`);
  console.log(`  menus: ${await Menu.countDocuments()}`);
  console.log(`  attendance: ${attendanceDocs.length}`);
  console.log(`  payments: ${await Payment.countDocuments()}`);
  console.log(`  feedback: ${await Feedback.countDocuments()}`);
  console.log(`  complaints: ${await Complaint.countDocuments()}`);
  console.log(`  inventory: ${await Inventory.countDocuments()}, stock logs: ${await StockLog.countDocuments()}`);
  console.log(`[seed] done in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('\nDemo credentials');
  console.log('  Admin    admin@iiit-bh.ac.in / Admin@123');
  console.log('  Manager  manager@iiit-bh.ac.in / Manager@123');
  console.log('  Student  student@iiit-bh.ac.in / Student@123');
};

(async () => {
  try {
    await connectDB();
    if (process.argv.includes('--destroy')) {
      await Promise.all([
        User.deleteMany({}), Student.deleteMany({}), Menu.deleteMany({}), Attendance.deleteMany({}),
        Payment.deleteMany({}), Complaint.deleteMany({}), Feedback.deleteMany({}), Inventory.deleteMany({}),
        StockLog.deleteMany({}), Announcement.deleteMany({}), Subscription.deleteMany({}),
      ]);
      console.log('[seed] all collections cleared');
    } else {
      await seed();
    }
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[seed] failed:', err);
    await disconnectDB();
    process.exit(1);
  }
})();
