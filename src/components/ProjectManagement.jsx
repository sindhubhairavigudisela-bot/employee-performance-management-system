import React, { useState, useEffect } from 'react';

const ProjectManagement = ({ user, token }) => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab filter
  const [activeTab, setActiveTab] = useState('All');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    employees: [],
    status: 'Not Started',
    startDate: '',
    endDate: ''
  });

  const statusOptions = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/projects', { headers });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        setError(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Connection failure to project API');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch employees for multi-select checklist
      const empRes = await fetch('http://localhost:5000/api/employees', { headers });
      const empData = await empRes.json();
      if (empData.success) {
        setEmployees(empData.data.filter(e => e.role === 'Employee'));
      }

      // Fetch managers
      const mgrRes = await fetch('http://localhost:5000/api/employees/managers', { headers });
      const mgrData = await mgrRes.json();
      if (mgrData.success) {
        setManagers(mgrData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchAllUsers();
  }, [token]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      manager: user.role === 'Manager' ? user._id : '',
      employees: [],
      status: 'Not Started',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setShowModal(true);
  };

  const handleCheckboxChange = (empId) => {
    const isAssigned = formData.employees.includes(empId);
    if (isAssigned) {
      setFormData({
        ...formData,
        employees: formData.employees.filter(id => id !== empId)
      });
    } else {
      setFormData({
        ...formData,
        employees: [...formData.employees, empId]
      });
    }
  };

  const handleStatusChange = async (projId, newStatus) => {
    try {
      setError('');
      setSuccess('');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const res = await fetch(`http://localhost:5000/api/projects/${projId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Project status updated to ${newStatus}`);
        fetchProjects();
      } else {
        setError(data.message || 'Failed to update project status');
      }
    } catch (err) {
      setError('Failed to reach project status update API');
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

      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Project created successfully');
        setShowModal(false);
        fetchProjects();
      } else {
        setError(data.message || 'Project creation failed');
      }
    } catch (err) {
      setError('Network request failed');
    }
  };

  const isPrivileged = user.role === 'Admin' || user.role === 'Manager';

  const filteredProjects = activeTab === 'All' 
    ? projects 
    : projects.filter(p => p.status === activeTab);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Not Started': return 'var(--text-muted)';
      case 'In Progress': return 'var(--accent-cyan)';
      case 'Completed': return 'var(--accent-emerald)';
      case 'On Hold': return 'var(--accent-red)';
      default: return 'var(--text-primary)';
    }
  };

  const getStatusGlow = (status) => {
    switch(status) {
      case 'Not Started': return 'rgba(255, 255, 255, 0.05)';
      case 'In Progress': return 'var(--accent-cyan-glow)';
      case 'Completed': return 'var(--accent-emerald-glow)';
      case 'On Hold': return 'var(--accent-red-glow)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Project Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track team priorities, assign engineers, and update deliverable status timelines.</p>
        </div>
        {isPrivileged && (
          <button className="btn-add-task" onClick={handleOpenAdd}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Project</span>
          </button>
        )}
      </div>

      {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div className="dashboard-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: '0.5rem',
        overflowX: 'auto'
      }}>
        {['All', ...statusOptions].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
              border: activeTab === tab ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: activeTab === tab ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400',
              transition: 'var(--transition-smooth)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner-large"></div>
          <p>Compiling project reports...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredProjects.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              No projects found in this status category.
            </div>
          ) : (
            filteredProjects.map(proj => (
              <div key={proj._id} style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                padding: '1.75rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
                transition: 'var(--transition-smooth)'
              }} className="project-card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>{proj.name}</h3>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: getStatusGlow(proj.status),
                    color: getStatusColor(proj.status),
                    border: `1px solid ${getStatusColor(proj.status)}33`
                  }}>
                    {proj.status}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', flex: 1 }}>
                  {proj.description || <em style={{ color: 'var(--text-muted)' }}>No description provided.</em>}
                </p>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Manager:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{proj.manager ? proj.manager.name : 'Unassigned'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Team:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {proj.employees.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No employees assigned</span>
                      ) : (
                        proj.employees.map(emp => (
                          <span key={emp._id} style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '6px',
                            padding: '0.15rem 0.4rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}>
                            {emp.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Status modifier dropdown for Managers/Admins */}
                {isPrivileged && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update Status:</label>
                    <select
                      value={proj.status}
                      onChange={(e) => handleStatusChange(proj._id, e.target.value)}
                      style={{
                        background: 'rgba(10, 10, 15, 0.6)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        padding: '0.4rem 0.75rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {statusOptions.map(opt => <option key={opt} value={opt} style={{ background: '#12121a' }}>{opt}</option>)}
                    </select>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Project Modal */}
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
          <div className="auth-card" style={{ maxWidth: '540px', width: '100%', padding: '2rem 2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
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

            <h3 style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Create Project</h3>

            <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., AWS Cloud Migration"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail scope, deliverables, and dependencies..."
                  rows={3}
                  style={{
                    background: 'rgba(10, 10, 15, 0.6)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '0.8rem 1rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-family)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {user.role === 'Admin' && (
                <div className="form-group">
                  <label>Project Manager</label>
                  <select
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    style={{
                      background: 'rgba(10, 10, 15, 0.8)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      color: 'var(--text-primary)'
                    }}
                    required
                  >
                    <option value="">Select Manager</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.department})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Assign Employees</label>
                <div style={{
                  background: 'rgba(10, 10, 15, 0.6)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {employees.map(emp => (
                    <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.employees.includes(emp._id)}
                        onChange={() => handleCheckboxChange(emp._id)}
                        style={{ accentColor: 'var(--accent-cyan)' }}
                      />
                      <span>{emp.name} ({emp.designation})</span>
                    </label>
                  ))}
                  {employees.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No employees found to assign.</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-logout" style={{ flex: '1', padding: '0.75rem' }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: '2', padding: '0.75rem', marginTop: 0 }}>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
