const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Student = require('../models/Student');

const accounts = [
  { name: 'Dr. Sanjay Mishra', email: 'admin@iiit-bh.ac.in', password: 'Admin@123', phone: '9876543210', role: 'admin' },
  { name: 'Rakesh Patra', email: 'manager@iiit-bh.ac.in', password: 'Manager@123', phone: '9876543211', role: 'manager' },
  { name: 'Aarav Sharma', email: 'student@iiit-bh.ac.in', password: 'Student@123', phone: '9876543212', role: 'student' },
];

async function main() {
  const reset = process.argv.includes('--reset-passwords');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo accounts are local-only and cannot be created or reset in production');
  }

  await connectDB();
  for (const account of accounts) {
    let user = await User.findOne({ email: account.email }).select('+password');
    if (!user) {
      user = await User.create(account);
      console.log(`[demo] created ${account.role}: ${account.email}`);
    } else if (reset) {
      user.password = account.password;
      user.isActive = true;
      await user.save();
      console.log(`[demo] reset password: ${account.email}`);
    } else {
      console.log(`[demo] kept existing account unchanged: ${account.email}`);
    }

    if (account.role === 'student' && !(await Student.exists({ user: user._id }))) {
      const studentId = '26DEMO001';
      if (!(await Student.exists({ studentId }))) {
        await Student.create({
          user: user._id,
          studentId,
          name: user.name,
          email: user.email,
          phone: user.phone || account.phone,
          hostel: 'Ganga',
          roomNumber: 'B-214',
          department: 'CSE',
          year: 1,
          messCardId: `IIIT-MESS-${studentId}`,
          messType: 'veg',
          subscriptionStatus: 'active',
        });
        console.log(`[demo] created student profile: ${studentId}`);
      } else {
        console.warn(`[demo] student ID ${studentId} is already in use; profile was not created`);
      }
    }
  }

  console.log('[demo] account setup complete. Existing account passwords are unchanged unless --reset-passwords is used.');
}

main()
  .catch((error) => {
    console.error('[demo] setup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
