const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getTodayStatus, getMyHistory, getTeamSummary, getAdminSummary } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/status', getTodayStatus);
router.get('/history', getMyHistory);
router.get('/team-summary', authorize('Manager', 'Admin'), getTeamSummary);
router.get('/admin-summary', authorize('Admin'), getAdminSummary);

module.exports = router;
