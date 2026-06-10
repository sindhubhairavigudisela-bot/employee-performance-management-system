const User = require('../models/User');

// @desc    Get all tasks of user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        undoneTasks: user.undoneTasks || [],
        doneTasks: user.doneTasks || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a task
// @route   POST /api/tasks
// @access  Private
const addTask = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Task text is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Push to undoneTasks array
    user.undoneTasks.push({ text: text.trim() });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: {
        undoneTasks: user.undoneTasks,
        doneTasks: user.doneTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a task as done
// @route   PUT /api/tasks/:id/done
// @access  Private
const completeTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the task in undoneTasks
    const taskIndex = user.undoneTasks.findIndex(task => task._id.toString() === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found in active tasks list' });
    }

    // Extract the task
    const [completedTask] = user.undoneTasks.splice(taskIndex, 1);

    // Push to doneTasks
    user.doneTasks.push({
      _id: completedTask._id,
      text: completedTask.text,
      createdAt: completedTask.createdAt
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Task marked as done',
      data: {
        undoneTasks: user.undoneTasks,
        doneTasks: user.doneTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task from either undone or done list
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Try deleting from undoneTasks
    let isDeleted = false;
    const undoneIndex = user.undoneTasks.findIndex(task => task._id.toString() === taskId);
    if (undoneIndex !== -1) {
      user.undoneTasks.splice(undoneIndex, 1);
      isDeleted = true;
    }

    // Try deleting from doneTasks
    if (!isDeleted) {
      const doneIndex = user.doneTasks.findIndex(task => task._id.toString() === taskId);
      if (doneIndex !== -1) {
        user.doneTasks.splice(doneIndex, 1);
        isDeleted = true;
      }
    }

    if (!isDeleted) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        undoneTasks: user.undoneTasks,
        doneTasks: user.doneTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasks,
  addTask,
  completeTask,
  deleteTask
};
