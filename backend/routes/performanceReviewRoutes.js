const express = require('express');
const router = express.Router();
const { createReview, getReviews, getEmployeeReviews, getReviewStats } = require('../controllers/performanceReviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes
router.get('/', getReviews);
router.post('/', authorize('Manager', 'Admin'), createReview);
router.get('/employee/:employeeId', getEmployeeReviews);
router.get('/stats', getReviewStats);

module.exports = router;
