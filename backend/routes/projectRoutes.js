const express = require('express');
const router = express.Router();
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes
router.get('/', getProjects);
router.post('/', authorize('Admin', 'Manager'), createProject);
router.put('/:id', authorize('Admin', 'Manager'), updateProject);
router.delete('/:id', authorize('Admin'), deleteProject);

module.exports = router;
