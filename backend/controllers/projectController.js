const Project = require('../models/Project');

// @desc    Get all projects filtered by user role
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let query = {};

    // Filter projects by role
    if (req.user.role === 'Manager') {
      // Managers see projects they manage OR are assigned to
      query.$or = [
        { manager: req.user._id },
        { employees: req.user._id }
      ];
    } else if (req.user.role === 'Employee') {
      // Employees only see projects they are assigned to
      query.employees = req.user._id;
    }
    // Admins see all projects (query remains empty)

    const projects = await Project.find(query)
      .populate('manager', 'name email role')
      .populate('employees', 'name email role department designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin/Manager
const createProject = async (req, res) => {
  try {
    const { name, description, manager, employees, status, startDate, endDate } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide project name' });
    }

    // Determine manager
    let projectManager = manager;
    if (!projectManager) {
      if (req.user.role === 'Manager') {
        projectManager = req.user._id;
      } else {
        return res.status(400).json({ success: false, message: 'Please assign a project manager' });
      }
    }

    const project = await Project.create({
      name,
      description,
      manager: projectManager,
      employees: employees || [],
      status: status || 'Not Started',
      startDate: startDate || Date.now(),
      endDate: endDate || null
    });

    const populatedProject = await Project.findById(project._id)
      .populate('manager', 'name email role')
      .populate('employees', 'name email role department designation');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: populatedProject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin/Manager
const updateProject = async (req, res) => {
  try {
    const { name, description, manager, employees, status, startDate, endDate } = req.body;
    const projectId = req.params.id;

    let project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check: Managers can only update projects they manage
    if (req.user.role === 'Manager' && project.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (manager) updateData.manager = manager;
    if (employees !== undefined) updateData.employees = employees;
    if (status) updateData.status = status;
    if (startDate) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;

    const updatedProject = await Project.findByIdAndUpdate(projectId, updateData, { new: true })
      .populate('manager', 'name email role')
      .populate('employees', 'name email role department designation');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await Project.deleteOne({ _id: projectId });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject
};
