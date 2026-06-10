const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Check In for today
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    // Check if user already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: req.user._id,
      date: todayStr
    });

    if (existingAttendance) {
      return res.status(400).json({ success: false, message: 'You have already checked in today' });
    }

    const checkInTime = new Date();
    
    // Check if late (e.g. past 09:30 AM local time)
    let status = 'Present';
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    if (hours > 9 || (hours === 9 && minutes > 30)) {
      status = 'Late';
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: todayStr,
      checkIn: checkInTime,
      status
    });

    res.status(201).json({
      success: true,
      message: 'Successfully checked in',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check Out for today
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res) => {
  try {
    const todayStr = getLocalDateString();

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: todayStr
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'You must check in first before checking out' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'You have already checked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Successfully checked out',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's check-in/out status for current user
// @route   GET /api/attendance/status
// @access  Private
const getTodayStatus = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: todayStr
    });

    res.status(200).json({
      success: true,
      data: attendance || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance history of current user
// @route   GET /api/attendance/history
// @access  Private
const getMyHistory = async (req, res) => {
  try {
    const history = await Attendance.find({ employee: req.user._id })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team attendance summary for Managers
// @route   GET /api/attendance/team-summary
// @access  Private/Manager
const getTeamSummary = async (req, res) => {
  try {
    // Find all team members managed by this Manager
    const teamMembers = await User.find({ manager: req.user._id }).select('_id');
    const teamIds = teamMembers.map(member => member._id);

    const todayStr = getLocalDateString();

    // Find today's attendance for team
    const attendance = await Attendance.find({
      employee: { $in: teamIds },
      date: todayStr
    }).populate('employee', 'name email role department designation');

    // Also get overall counts (present, late, absent)
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const lateCount = attendance.filter(a => a.status === 'Late').length;
    const totalCount = teamIds.length;
    const absentCount = totalCount - (presentCount + lateCount);

    res.status(200).json({
      success: true,
      data: {
        attendance,
        summary: {
          totalTeamSize: totalCount,
          present: presentCount,
          late: lateCount,
          absent: absentCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get global attendance stats for Admin dashboard
// @route   GET /api/attendance/admin-summary
// @access  Private/Admin
const getAdminSummary = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    // Total registered employees
    const totalEmployees = await User.countDocuments({ role: 'Employee' });

    // Today's attendance logs
    const logs = await Attendance.find({ date: todayStr })
      .populate('employee', 'name email role department designation');

    const totalActivePresent = logs.length;
    const presentPercentage = totalEmployees > 0 
      ? Math.round((totalActivePresent / totalEmployees) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        presentPercentage,
        totalPresent: totalActivePresent,
        totalEmployees,
        logs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyHistory,
  getTeamSummary,
  getAdminSummary
};
