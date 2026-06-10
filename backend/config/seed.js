const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');
const Attendance = require('../models/Attendance');
const PerformanceReview = require('../models/PerformanceReview');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDB = async () => {
  try {
    // Connect to DB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager');
    console.log(`MongoDB Connected for seeding: ${conn.connection.host}`);

    // Clear existing data
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Attendance.deleteMany({});
    await PerformanceReview.deleteMany({});

    console.log('Seeding database with default records...');

    // 1. Create Managers & Admins first
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@epms.com',
      password: 'password123',
      role: 'Admin',
      department: 'Management',
      designation: 'IT Admin'
    });

    const engManager = await User.create({
      name: 'Alice Manager',
      email: 'manager@epms.com',
      password: 'password123',
      role: 'Manager',
      department: 'Engineering',
      designation: 'Engineering Manager'
    });

    const hrManager = await User.create({
      name: 'Sarah HR',
      email: 'hr@epms.com',
      password: 'password123',
      role: 'Manager',
      department: 'HR',
      designation: 'HR Lead'
    });

    // 2. Create Employees referencing the managers
    const devEmployee = await User.create({
      name: 'Bob Employee',
      email: 'employee@epms.com',
      password: 'password123',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Frontend Engineer',
      manager: engManager._id
    });

    const devEmployee2 = await User.create({
      name: 'Charlie Dev',
      email: 'charlie@epms.com',
      password: 'password123',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Backend Engineer',
      manager: engManager._id
    });

    const hrEmployee = await User.create({
      name: 'Diana HR',
      email: 'hr_staff@epms.com',
      password: 'password123',
      role: 'Employee',
      department: 'HR',
      designation: 'HR Recruiter',
      manager: hrManager._id
    });

    console.log('✅ Users seeded successfully.');

    // 3. Create Projects
    const project1 = await Project.create({
      name: 'EPMS Platform Development',
      description: 'Design and build the Employee Performance Management System featuring role dashboards and neon aesthetic.',
      manager: engManager._id,
      employees: [devEmployee._id, devEmployee2._id],
      status: 'In Progress',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // in 30 days
    });

    const project2 = await Project.create({
      name: 'Annual Recruitment Campaign',
      description: 'Source, interview, and onboard new graduate engineers for the autumn intake.',
      manager: hrManager._id,
      employees: [hrEmployee._id, devEmployee._id], // dev assigned to interview panel
      status: 'Not Started',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    });

    const project3 = await Project.create({
      name: 'Legacy Cloud Migration',
      description: 'Migrate on-prem microservices to AWS secure VPC instances.',
      manager: engManager._id,
      employees: [devEmployee2._id],
      status: 'Completed',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    console.log('✅ Projects seeded successfully.');

    // 4. Create Performance Reviews
    await PerformanceReview.create({
      employee: devEmployee._id,
      reviewer: engManager._id,
      technicalSkills: 5,
      communication: 4,
      teamwork: 4,
      problemSolving: 5,
      leadership: 3,
      comments: 'Bob has done an excellent job building the UI of the EPMS platform. His coding standards are very high, and he resolves algorithmic bottlenecks with ease. Communication is clear, although he could speak up more in large architectural reviews. Looking forward to seeing him lead small modules next quarter!'
    });

    await PerformanceReview.create({
      employee: devEmployee2._id,
      reviewer: engManager._id,
      technicalSkills: 4,
      communication: 3,
      teamwork: 5,
      problemSolving: 4,
      leadership: 4,
      comments: 'Charlie is a stellar team player. He is always willing to help others unblock. His backend APIs are robust, although he should pay a bit more attention to query optimization in mongoose hooks.'
    });

    console.log('✅ Performance Reviews seeded successfully.');

    // 5. Create Attendance Logs (simulate last 5 days)
    const recentDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      recentDays.push({
        dateStr: `${year}-${month}-${day}`,
        checkInTime: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, Math.floor(Math.random() * 25)), // checked in before 9:25 AM
        checkOutTime: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 30 + Math.floor(Math.random() * 30))
      });
    }

    // Insert attendance for Bob, Charlie, Sarah, Diana
    const employeesList = [devEmployee, devEmployee2, hrEmployee];
    for (const emp of employeesList) {
      for (const day of recentDays) {
        // Randomly make one check-in late
        const checkIn = new Date(day.checkInTime);
        let status = 'Present';
        if (Math.random() > 0.8) {
          checkIn.setHours(10);
          checkIn.setMinutes(15);
          status = 'Late';
        }

        await Attendance.create({
          employee: emp._id,
          date: day.dateStr,
          checkIn,
          checkOut: day.checkOutTime,
          status
        });
      }
    }

    console.log('✅ Attendance histories seeded successfully.');
    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
