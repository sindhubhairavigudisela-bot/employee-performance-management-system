const express = require('express');
const router = express.Router();
const { getEmployees, getManagers, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes
router.get('/', getEmployees);
router.get('/managers', getManagers);
router.post('/', authorize('Admin'), createEmployee);
router.put('/:id', authorize('Admin'), updateEmployee);
router.delete('/:id', authorize('Admin'), deleteEmployee);

module.exports = router;
