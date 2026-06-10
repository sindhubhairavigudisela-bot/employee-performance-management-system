const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🚀 Starting Backend API Integration Tests...');

  const timestamp = Date.now();
  const testUser = {
    name: 'Test User',
    email: `testuser_${timestamp}@example.com`,
    password: 'password123'
  };

  let token = '';
  let activeTaskId = '';

  try {
    // 1. Test Registration
    console.log('\n--- 1. Testing Registration ---');
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const registerData = await registerRes.json();
    console.log('Status:', registerRes.status);
    console.log('Data:', registerData);
    if (!registerData.success || !registerData.data.token) {
      throw new Error('Registration failed');
    }
    token = registerData.data.token;
    console.log('✅ Registration Passed. Token obtained.');

    // 2. Test Login
    console.log('\n--- 2. Testing Login ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Data:', loginData);
    if (!loginData.success || loginData.data.token !== token) {
      throw new Error('Login failed');
    }
    console.log('✅ Login Passed.');

    // 3. Test Add Task
    console.log('\n--- 3. Testing Add Task ---');
    const addTaskRes = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text: 'Implement Automated Verification tests' })
    });
    const addTaskData = await addTaskRes.json();
    console.log('Status:', addTaskRes.status);
    console.log('Data:', addTaskData);
    if (!addTaskData.success || addTaskData.data.undoneTasks.length !== 1) {
      throw new Error('Adding task failed');
    }
    activeTaskId = addTaskData.data.undoneTasks[0]._id;
    console.log(`✅ Add Task Passed. Task ID: ${activeTaskId}`);

    // 4. Test Complete Task
    console.log('\n--- 4. Testing Complete Task ---');
    const completeTaskRes = await fetch(`${API_URL}/tasks/${activeTaskId}/done`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const completeTaskData = await completeTaskRes.json();
    console.log('Status:', completeTaskRes.status);
    console.log('Data:', completeTaskData);
    if (
      !completeTaskData.success ||
      completeTaskData.data.undoneTasks.length !== 0 ||
      completeTaskData.data.doneTasks.length !== 1
    ) {
      throw new Error('Completing task failed');
    }
    console.log('✅ Complete Task Passed.');

    // 5. Test Delete Task
    console.log('\n--- 5. Testing Delete Task ---');
    const deleteTaskRes = await fetch(`${API_URL}/tasks/${activeTaskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteTaskData = await deleteTaskRes.json();
    console.log('Status:', deleteTaskRes.status);
    console.log('Data:', deleteTaskData);
    if (
      !deleteTaskData.success ||
      deleteTaskData.data.undoneTasks.length !== 0 ||
      deleteTaskData.data.doneTasks.length !== 0
    ) {
      throw new Error('Deleting task failed');
    }
    console.log('✅ Delete Task Passed.');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (error) {
    console.error('❌ Integration Test Failed:', error.message);
    process.exit(1);
  }
};

runTests();
