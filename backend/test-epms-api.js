const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🚀 Starting EPMS Backend API Integration Tests...');

  const timestamp = Date.now();
  
  // Test user details
  const testAdmin = {
    name: 'Test Admin',
    email: `admin_${timestamp}@epms.com`,
    password: 'password123',
    role: 'Admin'
  };

  const testManager = {
    name: 'Test Manager',
    email: `manager_${timestamp}@epms.com`,
    password: 'password123',
    role: 'Manager'
  };

  const testEmployee = {
    name: 'Test Employee',
    email: `employee_${timestamp}@epms.com`,
    password: 'password123',
    role: 'Employee'
  };

  let adminToken = '';
  let managerToken = '';
  let employeeToken = '';

  let employeeId = '';
  let projectId = '';

  try {
    // 1. Test Registration
    console.log('\n--- 1. Testing Registration ---');
    
    // Register Admin
    const regAdminRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAdmin)
    });
    const regAdminData = await regAdminRes.json();
    console.log('Register Admin status:', regAdminRes.status);
    if (!regAdminData.success || !regAdminData.data.token) throw new Error('Admin registration failed');
    adminToken = regAdminData.data.token;
    
    // Register Manager
    const regManagerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testManager)
    });
    const regManagerData = await regManagerRes.json();
    console.log('Register Manager status:', regManagerRes.status);
    if (!regManagerData.success || !regManagerData.data.token) throw new Error('Manager registration failed');
    managerToken = regManagerData.data.token;

    // Register Employee
    const regEmployeeRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmployee)
    });
    const regEmployeeData = await regEmployeeRes.json();
    console.log('Register Employee status:', regEmployeeRes.status);
    if (!regEmployeeData.success || !regEmployeeData.data.token) throw new Error('Employee registration failed');
    employeeToken = regEmployeeData.data.token;
    employeeId = regEmployeeData.data._id;

    console.log('✅ Registration Pass. All roles created.');

    // 2. Test Login & Forgot Password
    console.log('\n--- 2. Testing Login & Forgot Password ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmployee.email, password: testEmployee.password })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    if (!loginData.success) throw new Error('Login failed');

    // Forgot password test
    const resetRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmployee.email, newPassword: 'newpassword123' })
    });
    const resetData = await resetRes.json();
    console.log('Reset Password status:', resetRes.status);
    if (!resetData.success) throw new Error('Password reset failed');

    // Login with new password
    const loginNewRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmployee.email, password: 'newpassword123' })
    });
    const loginNewData = await loginNewRes.json();
    console.log('Login with new password status:', loginNewRes.status);
    if (!loginNewData.success) throw new Error('Login with new password failed');
    employeeToken = loginNewData.data.token; // update token

    console.log('✅ Login & Forgot Password Pass.');

    // 3. Test Employee Management (CRUD & RBAC)
    console.log('\n--- 3. Testing Employee Management & RBAC ---');
    
    // Non-admin tries to get managers list
    const getManagersRes = await fetch(`${API_URL}/employees/managers`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    console.log('Employee tries to access managers list (expected 200/allowed):', getManagersRes.status);

    // Non-admin tries to create employee (expected 403 Forbidden)
    const badCreateRes = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employeeToken}`
      },
      body: JSON.stringify({ name: 'Should Fail', email: 'fail@epms.com', password: 'password' })
    });
    console.log('Employee tries to create employee status (expected 403):', badCreateRes.status);
    if (badCreateRes.status !== 403) throw new Error('RBAC validation failed: employee was allowed to create employee');

    // Admin creates an employee
    const adminCreateRes = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'John Staff',
        email: `john_${timestamp}@epms.com`,
        password: 'password123',
        role: 'Employee',
        department: 'Engineering',
        designation: 'QA Engineer',
        manager: regManagerData.data._id
      })
    });
    const adminCreateData = await adminCreateRes.json();
    console.log('Admin creates employee status:', adminCreateRes.status);
    if (!adminCreateData.success) throw new Error('Admin employee creation failed');
    const newStaffId = adminCreateData.data._id;

    // Admin updates the employee
    const adminUpdateRes = await fetch(`${API_URL}/employees/${newStaffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ designation: 'Senior QA Engineer' })
    });
    const adminUpdateData = await adminUpdateRes.json();
    console.log('Admin updates employee status:', adminUpdateRes.status);
    if (!adminUpdateData.success || adminUpdateData.data.designation !== 'Senior QA Engineer') {
      throw new Error('Admin update failed');
    }

    console.log('✅ Employee Management & RBAC Pass.');

    // 4. Test Project Management
    console.log('\n--- 4. Testing Project Management ---');
    
    // Manager creates a project
    const createProjectRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        name: 'Project Test Automation',
        description: 'Test project description',
        employees: [employeeId]
      })
    });
    const createProjectData = await createProjectRes.json();
    console.log('Manager creates project status:', createProjectRes.status);
    if (!createProjectData.success) throw new Error('Project creation failed');
    projectId = createProjectData.data._id;

    // Employee views projects (should see the project where they are in employees)
    const employeeProjectsRes = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const employeeProjectsData = await employeeProjectsRes.json();
    console.log('Employee gets projects status:', employeeProjectsRes.status, 'Count:', employeeProjectsData.data.length);
    if (!employeeProjectsData.success || employeeProjectsData.data.length === 0) {
      throw new Error('Employee did not receive assigned project');
    }

    console.log('✅ Project Management Pass.');

    // 5. Test Attendance Management (Check-in / Check-out)
    console.log('\n--- 5. Testing Attendance Management ---');
    
    // Check In
    const checkInRes = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const checkInData = await checkInRes.json();
    console.log('Employee checks in status:', checkInRes.status);
    if (!checkInData.success) throw new Error('Check-in failed');

    // Get Today Status
    const statusRes = await fetch(`${API_URL}/attendance/status`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const statusData = await statusRes.json();
    console.log('Employee checks status status:', statusRes.status);
    if (!statusData.success || !statusData.data || statusData.data.checkOut) {
      throw new Error('Get today status check failed');
    }

    // Check Out
    const checkOutRes = await fetch(`${API_URL}/attendance/check-out`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const checkOutData = await checkOutRes.json();
    console.log('Employee checks out status:', checkOutRes.status);
    if (!checkOutData.success) throw new Error('Check-out failed');

    console.log('✅ Attendance Management Pass.');

    // 6. Test Performance Reviews
    console.log('\n--- 6. Testing Performance Reviews ---');
    
    // Manager submits a review for the employee
    const submitReviewRes = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        employee: employeeId,
        technicalSkills: 5,
        communication: 4,
        teamwork: 4,
        problemSolving: 5,
        leadership: 3,
        comments: 'Excellent work on the integration testing module.'
      })
    });
    const submitReviewData = await submitReviewRes.json();
    console.log('Manager submits review status:', submitReviewRes.status);
    if (!submitReviewData.success) throw new Error('Review submission failed');

    // Employee gets their stats
    const statsRes = await fetch(`${API_URL}/reviews/stats`, {
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const statsData = await statsRes.json();
    console.log('Employee gets review stats status:', statsRes.status, 'Score:', statsData.data.overall);
    if (!statsData.success || statsData.data.overall !== 4.2) {
      throw new Error(`Review stats calculation failed. Expected overall score 4.2 but got ${statsData.data.overall}`);
    }

    console.log('✅ Performance Reviews Pass.');

    // Cleanup: Admin deletes the created staff
    console.log('\n--- 7. Cleanup ---');
    const deleteStaffRes = await fetch(`${API_URL}/employees/${newStaffId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Admin deletes employee status:', deleteStaffRes.status);
    if (deleteStaffRes.status !== 200) throw new Error('Employee cleanup failed');

    console.log('\n🎉 ALL EPMS API INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ EPMS Integration Test Failed:', error.message);
    process.exit(1);
  }
};

runTests();
