const express = require('express');
const router = express.Router();
const { getTasks, addTask, completeTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All task routes require authentication
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(addTask);

router.route('/:id')
  .delete(deleteTask);

router.route('/:id/done')
  .put(completeTask);

module.exports = router;
