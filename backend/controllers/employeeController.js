const User = require('../models/User');

// @desc    Get all employees with filters
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
  try {
    const { search, department, role } = req.query;
    let query = {};

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) {
      query.department = department;
    }
    if (role) {
      query.role = role;
    }

    const employees = await User.find(query)
      .populate('manager', 'name email role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all managers (users with Manager or Admin role)
// @route   GET /api/employees/managers
// @access  Private
const getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: { $in: ['Manager', 'Admin'] } })
      .select('name email role department')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: managers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new employee
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, manager } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Check if email already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const employee = await User.create({
      name,
      email,
      password,
      role: role || 'Employee',
      department: department || 'Engineering',
      designation: designation || 'Software Engineer',
      manager: manager || null
    });

    const populatedEmployee = await User.findById(employee._id).populate('manager', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      data: populatedEmployee
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, manager } = req.body;
    const employeeId = req.params.id;

    let employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Construct update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const emailUser = await User.findOne({ email });
      if (emailUser && emailUser._id.toString() !== employeeId) {
        return res.status(400).json({ success: false, message: 'Email already in use by another user' });
      }
      updateData.email = email;
    }
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (designation) updateData.designation = designation;
    
    // Explicit check for null vs undefined to allow clearing manager assignment
    if (manager !== undefined) {
      updateData.manager = manager || null;
    }

    // Handle password separately (pre-save hashing works on saving document)
    if (password) {
      employee.password = password;
      await employee.save(); // Need to save so pre-save hook triggers password hash
    }

    const updatedEmployee = await User.findByIdAndUpdate(employeeId, updateData, { new: true })
      .populate('manager', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Use deleteOne instead of deprecated remove
    await User.deleteOne({ _id: employeeId });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEmployees,
  getManagers,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
