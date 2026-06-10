import React, { useState, useEffect } from 'react';

const DashboardOverview = ({ user, token }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeProjects: 0,
    attendanceRate: 0,
    pendingReviews: 0,
    teamSize: 0,
    teamProjects: 0,
    teamPresence: { present: 0, late: 0, absent: 0 },
    myProjects: 0,
    myAttendance: 'Absent',
    myPerformance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');

        const headers = { 'Authorization': `Bearer ${token}` };

        if (user.role === 'Admin') {
          // Fetch employees
          const empRes = await fetch('http://localhost:5000/api/employees', { headers });
          const empData = await empRes.json();
          const totalEmployees = empData.success ? empData.count : 0;

          // Fetch projects
          const projRes = await fetch('http://localhost:5000/api/projects', { headers });
          const projData = await projRes.json();
          const activeProjects = projData.success 
            ? projData.data.filter(p => p.status !== 'Completed').length 
            : 0;

          // Fetch attendance summary
          const attRes = await fetch('http://localhost:5000/api/attendance/admin-summary', { headers });
          const attData = await attRes.json();
          const attendanceRate = attData.success ? attData.data.presentPercentage : 0;

          // Fetch performance reviews to compute pending reviews
          const revRes = await fetch('http://localhost:5000/api/reviews', { headers });
          const revData = await revRes.json();
          
          // Let's say pending reviews are employees who haven't received a review yet
          let pendingReviews = 0;
          if (empData.success && revData.success) {
            const reviewedIds = new Set(revData.data.map(r => r.employee?._id));
            const totalEmps = empData.data.filter(e => e.role === 'Employee');
            const unreviewed = totalEmps.filter(e => !reviewedIds.has(e._id));
            pendingReviews = unreviewed.length;
          }

          setStats(prev => ({
            ...prev,
            totalEmployees,
            activeProjects,
            attendanceRate,
            pendingReviews
          }));

        } else if (user.role === 'Manager') {
          // Fetch team size
          const empRes = await fetch('http://localhost:5000/api/employees', { headers });
          const empData = await empRes.json();
          const teamSize = empData.success 
            ? empData.data.filter(e => e.manager && e.manager._id === user._id).length 
            : 0;

          // Fetch managed projects
          const projRes = await fetch('http://localhost:5000/api/projects', { headers });
          const projData = await projRes.json();
          const teamProjects = projData.success 
            ? projData.data.filter(p => p.manager?._id === user._id).length 
            : 0;

          // Fetch team attendance
          const attRes = await fetch('http://localhost:5000/api/attendance/team-summary', { headers });
          const attData = await attRes.json();
          const teamPresence = attData.success 
            ? attData.data.summary 
            : { present: 0, late: 0, absent: 0 };

          setStats(prev => ({
            ...prev,
            teamSize,
            teamProjects,
            teamPresence
          }));

        } else if (user.role === 'Employee') {
          // Fetch employee projects
          const projRes = await fetch('http://localhost:5000/api/projects', { headers });
          const projData = await projRes.json();
          const myProjects = projData.success ? projData.data.length : 0;

          // Fetch today's attendance status
          const attRes = await fetch('http://localhost:5000/api/attendance/status', { headers });
          const attData = await attRes.json();
          let myAttendance = 'Absent';
          if (attData.success && attData.data) {
            myAttendance = attData.data.status || 'Present';
            if (attData.data.checkOut) {
              myAttendance = 'Checked Out';
            }
          }

          // Fetch performance review average
          const revRes = await fetch('http://localhost:5000/api/reviews/stats', { headers });
          const revData = await revRes.json();
          const myPerformance = revData.success ? revData.data.overall : 0;

          setStats(prev => ({
            ...prev,
            myProjects,
            myAttendance,
            myPerformance
          }));
        }

      } catch (err) {
        setError('Failed to fetch dashboard metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, token]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Analyzing metrics...</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      <div className="welcome-banner" style={{ marginBottom: '2.5rem' }}>
        <h2>Welcome back, {user.name}!</h2>
        <p>Here is your overview for today. Role: <strong style={{ color: 'var(--accent-cyan)' }}>{user.role}</strong> | Department: <strong>{user.department || 'Engineering'}</strong></p>
      </div>

      {error && <div className="dashboard-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Admin Cards */}
      {user.role === 'Admin' && (
        <div className="metric-cards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="metric-card bg-glow-purple" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Employees</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.totalEmployees}</span>
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                color: 'var(--accent-purple)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card bg-glow-cyan" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Projects</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.activeProjects}</span>
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                color: 'var(--accent-cyan)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card bg-glow-emerald" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Rate</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.attendanceRate}%</span>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-emerald)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card bg-glow-red" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Reviews</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.pendingReviews}</span>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--accent-red)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager Cards */}
      {user.role === 'Manager' && (
        <div className="metric-cards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="metric-card bg-glow-purple" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Members</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>{stats.teamSize}</span>
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                color: 'var(--accent-purple)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card bg-glow-cyan" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Projects</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>{stats.teamProjects}</span>
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                color: 'var(--accent-cyan)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card bg-glow-emerald" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Summary</h4>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Present:</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>{stats.teamPresence.present}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Late:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{stats.teamPresence.late}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Absent:</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{stats.teamPresence.absent}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Cards */}
      {user.role === 'Employee' && (
        <div className="metric-cards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="metric-card bg-glow-purple" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Projects</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>{stats.myProjects}</span>
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                color: 'var(--accent-purple)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card bg-glow-cyan" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Status</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ 
                fontSize: '2rem', 
                fontWeight: '800', 
                color: stats.myAttendance === 'Present' 
                  ? 'var(--accent-emerald)' 
                  : stats.myAttendance === 'Late' 
                    ? 'var(--accent-cyan)' 
                    : stats.myAttendance === 'Checked Out'
                      ? 'var(--text-secondary)'
                      : 'var(--accent-red)'
              }}>{stats.myAttendance}</span>
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                color: 'var(--accent-cyan)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card bg-glow-emerald" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performance Score</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>{stats.myPerformance > 0 ? `${stats.myPerformance} / 5.0` : 'N/A'}</span>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-emerald)',
                borderRadius: '12px',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decorative guidelines note for demo context */}
      <div className="glass-panel" style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '1.5rem',
        marginTop: '3rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Quick Tip</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          This system uses role-based access control. You can log out and register different accounts as <strong>Admin</strong>, <strong>Manager</strong>, or <strong>Employee</strong> to inspect how the dashboard and menu items customize themselves. Seeding database initially populated the system with <code>admin@epms.com</code>, <code>manager@epms.com</code>, and <code>employee@epms.com</code> (all password: <code>password123</code>).
        </p>
      </div>
    </div>
  );
};

export default DashboardOverview;
