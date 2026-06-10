const PerformanceReview = require('../models/PerformanceReview');
const User = require('../models/User');

// @desc    Submit a performance review
// @route   POST /api/reviews
// @access  Private/Manager/Admin
const createReview = async (req, res) => {
  try {
    const { employee, technicalSkills, communication, teamwork, problemSolving, leadership, comments } = req.body;

    if (!employee || !technicalSkills || !communication || !teamwork || !problemSolving || !leadership || !comments) {
      return res.status(400).json({ success: false, message: 'Please provide all ratings and comments' });
    }

    // Verify employee exists
    const employeeUser = await User.findById(employee);
    if (!employeeUser) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const review = await PerformanceReview.create({
      employee,
      reviewer: req.user._id,
      technicalSkills: Number(technicalSkills),
      communication: Number(communication),
      teamwork: Number(teamwork),
      problemSolving: Number(problemSolving),
      leadership: Number(leadership),
      comments
    });

    const populatedReview = await PerformanceReview.findById(review._id)
      .populate('employee', 'name email role department designation')
      .populate('reviewer', 'name email role department designation');

    res.status(201).json({
      success: true,
      message: 'Performance review submitted successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get performance reviews with role filtering
// @route   GET /api/reviews
// @access  Private
const getReviews = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Employee') {
      // Employees only see reviews written about them
      query.employee = req.user._id;
    } else if (req.user.role === 'Manager') {
      // Managers see reviews they wrote OR reviews written for their team members
      const teamMembers = await User.find({ manager: req.user._id }).select('_id');
      const teamIds = teamMembers.map(t => t._id);
      
      query.$or = [
        { reviewer: req.user._id },
        { employee: { $in: teamIds } }
      ];
    }
    // Admins see all reviews (query remains empty)

    const reviews = await PerformanceReview.find(query)
      .populate('employee', 'name email role department designation')
      .populate('reviewer', 'name email role department designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get performance reviews for a specific employee
// @route   GET /api/reviews/employee/:employeeId
// @access  Private
const getEmployeeReviews = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    // Authorization check: Employees can only view their own reviews
    if (req.user.role === 'Employee' && req.user._id.toString() !== employeeId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these reviews' });
    }

    // Managers can only view their team members' reviews (unless they are admin or wrote it)
    if (req.user.role === 'Manager') {
      const employee = await User.findById(employeeId);
      if (employee && employee.manager && employee.manager.toString() !== req.user._id.toString()) {
        // Double check if this manager authored any review for this employee as well
        const isAuthor = await PerformanceReview.exists({ employee: employeeId, reviewer: req.user._id });
        if (!isAuthor) {
          return res.status(403).json({ success: false, message: 'Not authorized to view this employee reviews' });
        }
      }
    }

    const reviews = await PerformanceReview.find({ employee: employeeId })
      .populate('employee', 'name email role department designation')
      .populate('reviewer', 'name email role department designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get average score metrics for dashboard charting
// @route   GET /api/reviews/stats
// @access  Private
const getReviewStats = async (req, res) => {
  try {
    const targetUserId = req.query.employeeId || req.user._id;

    // Authorization check
    if (req.user.role === 'Employee' && req.user._id.toString() !== targetUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access these stats' });
    }

    const reviews = await PerformanceReview.find({ employee: targetUserId });
    
    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          technicalSkills: 0,
          communication: 0,
          teamwork: 0,
          problemSolving: 0,
          leadership: 0,
          overall: 0,
          reviewCount: 0
        }
      });
    }

    // Calculate averages
    let techSum = 0, commSum = 0, teamSum = 0, probSum = 0, leadSum = 0;
    
    reviews.forEach(r => {
      techSum += r.technicalSkills;
      commSum += r.communication;
      teamSum += r.teamwork;
      probSum += r.problemSolving;
      leadSum += r.leadership;
    });

    const count = reviews.length;
    const stats = {
      technicalSkills: Number((techSum / count).toFixed(1)),
      communication: Number((commSum / count).toFixed(1)),
      teamwork: Number((teamSum / count).toFixed(1)),
      problemSolving: Number((probSum / count).toFixed(1)),
      leadership: Number((leadSum / count).toFixed(1)),
      reviewCount: count
    };

    stats.overall = Number(((stats.technicalSkills + stats.communication + stats.teamwork + stats.problemSolving + stats.leadership) / 5).toFixed(1));

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getReviews,
  getEmployeeReviews,
  getReviewStats
};
