import React, { useState, useEffect } from 'react';

const EmployeeManagement = ({ user, token }) => {
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    manager: ''
  });

  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Management'];

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const url = `http://localhost:5000/api/employees?search=${search}&department=${deptFilter}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      } else {
        setError(data.message || 'Failed to fetch employees');
      }
    } catch (err) {
      setError('Connection failure to API');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/employees/managers', { headers });
      const data = await res.json();
      if (data.success) {
        setManagers(data.data);
      }
    } catch (err) {
      console.error('Failed fetching managers:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, [search, deptFilter]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Software Engineer',
      manager: ''
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '', // blank by default on edit
      role: emp.role,
      department: emp.department,
      designation: emp.designation,
      manager: emp.manager ? emp.manager._id : ''
    });
    setEditId(emp._id);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDelete = async (empId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      setError('');
      setSuccess('');
      const response = await fetch(`http://localhost:5000/api/employees/${empId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Employee deleted successfully');
        fetchEmployees();
      } else {
        setError(data.message || 'Failed to delete employee');
      }
    } catch (err) {
      setError('Failed to reach delete API');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const body = { ...formData };
      if (isEdit && !body.password) {
        delete body.password; // don't update password if empty on edit
      }

      const url = isEdit 
        ? `http://localhost:5000/api/employees/${editId}` 
        : 'http://localhost:5000/api/employees';

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(isEdit ? 'Employee updated successfully' : 'Employee added successfully');
        setShowModal(false);
        fetchEmployees();
        fetchManagers(); // managers list could change if roles changed
      } else {
        setError(data.message || 'Submission failed');
      }
    } catch (err) {
      setError('Network request failed');
    }
  };

  const isAdmin = user.role === 'Admin';

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Employee Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View, search, and manage corporate users and structural reporting lines.</p>
        </div>
        {isAdmin && (
          <button className="btn-add-task" onClick={handleOpenAdd}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div className="dashboard-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Search and Filters */}
      <div className="glass-panel" style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(10, 10, 15, 0.5)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              padding: '0.6rem 1rem 0.6rem 2.25rem',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              background: 'rgba(10, 10, 15, 0.5)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner-large"></div>
          <p>Gathering personnel records...</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          overflowX: 'auto',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            color: 'var(--text-primary)',
            fontSize: '0.925rem'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Department</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Designation</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Manager</th>
                {isAdmin && <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '1.1rem 1.5rem', fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.email}</td>
                    <td style={{ padding: '1.1rem 1.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        border: '1px solid',
                        background: emp.role === 'Admin' ? 'rgba(239, 68, 68, 0.1)' : emp.role === 'Manager' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        color: emp.role === 'Admin' ? 'var(--accent-red)' : emp.role === 'Manager' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                        borderColor: emp.role === 'Admin' ? 'rgba(239, 68, 68, 0.2)' : emp.role === 'Manager' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      }}>
                        {emp.role}
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.department}</td>
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.designation}</td>
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {emp.manager ? emp.manager.name : <em style={{ color: 'var(--text-muted)' }}>None</em>}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '1.1rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="btn-action btn-complete"
                            title="Edit"
                            style={{ width: '28px', height: '28px' }}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(emp._id)}
                            className="btn-action btn-delete"
                            title="Delete"
                            style={{ width: '28px', height: '28px' }}
                            disabled={emp._id === user._id} // can't delete self
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="auth-card" style={{ maxWidth: '500px', width: '100%', padding: '2rem 2.5rem', position: 'relative' }}>
            <button style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }} onClick={() => setShowModal(false)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 style={{ textAlign: 'left', marginBottom: '1.5rem' }}>{isEdit ? 'Edit Employee' : 'Add Employee'}</h3>

            <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password {isEdit && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEdit ? '••••••••' : 'Password (min. 6 chars)'}
                  required={!isEdit}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      background: 'rgba(10, 10, 15, 0.8)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      background: 'rgba(10, 10, 15, 0.8)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="QA Automation Engineer"
                  required
                />
              </div>

              <div className="form-group">
                <label>Assign Manager</label>
                <select
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  style={{
                    background: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '0.6rem 1rem',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="">No Manager Assigned</option>
                  {managers
                    .filter(m => m._id !== editId) // can't assign self as own manager
                    .map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.role} - {m.department})</option>
                    ))
                  }
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-logout" style={{ flex: '1', padding: '0.75rem' }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: '2', padding: '0.75rem', marginTop: 0 }}>
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
