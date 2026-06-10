import React, { useState, useEffect } from 'react';

const PerformanceReviews = ({ user, token }) => {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Stats for selected employee
  const [selectedEmpStats, setSelectedEmpStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Tab states: 'View Reviews' or 'Submit Review'
  const [activeSubTab, setActiveSubTab] = useState('View Reviews');

  // Submit Form State
  const [formData, setFormData] = useState({
    employee: '',
    technicalSkills: 5,
    communication: 5,
    teamwork: 5,
    problemSolving: 5,
    leadership: 5,
    comments: ''
  });

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/reviews', { headers });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      } else {
        setError(data.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError('Connection failed to reviews API');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    if (user.role !== 'Employee') {
      try {
        const res = await fetch('http://localhost:5000/api/employees', { headers });
        const data = await res.json();
        if (data.success) {
          // Managers see their team, admins see everyone
          const list = user.role === 'Manager' 
            ? data.data.filter(e => e.manager && e.manager._id === user._id) 
            : data.data.filter(e => e.role === 'Employee');
          setEmployees(list);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchStats = async (empId = '') => {
    try {
      setStatsLoading(true);
      const url = empId 
        ? `http://localhost:5000/api/reviews/stats?employeeId=${empId}` 
        : 'http://localhost:5000/api/reviews/stats';
        
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setSelectedEmpStats(data.data);
      }
    } catch (err) {
      console.error('Failed fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchEmployeesList();
    if (user.role === 'Employee') {
      fetchStats();
    }
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.employee || !formData.comments.trim()) {
      setError('Please select an employee and fill in the comments');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Performance review submitted successfully');
        setFormData({
          employee: '',
          technicalSkills: 5,
          communication: 5,
          teamwork: 5,
          problemSolving: 5,
          leadership: 5,
          comments: ''
        });
        setActiveSubTab('View Reviews');
        fetchReviews();
      } else {
        setError(data.message || 'Review submission failed');
      }
    } catch (err) {
      setError('Network request failed');
    }
  };

  const handleSelectEmployeeStats = (empId) => {
    if (!empId) {
      setSelectedEmpStats(null);
      return;
    }
    fetchStats(empId);
  };

  const isPrivileged = user.role === 'Admin' || user.role === 'Manager';

  // Radar Chart Generator
  const renderRadarChart = (data) => {
    if (!data || data.reviewCount === 0) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
          No review ratings logged to construct chart visualization.
        </div>
      );
    }

    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const r = 90; // max radius

    const axes = [
      { key: 'technicalSkills', label: 'Technical' },
      { key: 'communication', label: 'Communication' },
      { key: 'teamwork', label: 'Teamwork' },
      { key: 'problemSolving', label: 'Problem Solving' },
      { key: 'leadership', label: 'Leadership' }
    ];

    // Coordinate helper
    const getCoordinates = (index, value, maxVal = 5) => {
      const angle = index * (2 * Math.PI / 5) - Math.PI / 2;
      const distance = (value / maxVal) * r;
      return {
        x: cx + distance * Math.cos(angle),
        y: cy + distance * Math.sin(angle)
      };
    };

    // Construct pentagons for grid lines
    const gridLines = [];
    for (let level = 1; level <= 5; level++) {
      const points = axes.map((_, idx) => {
        const coord = getCoordinates(idx, level);
        return `${coord.x},${coord.y}`;
      }).join(' ');
      gridLines.push(points);
    }

    // Rating points
    const dataPoints = axes.map((axis, idx) => {
      const val = data[axis.key] || 0;
      const coord = getCoordinates(idx, val);
      return `${coord.x},${coord.y}`;
    }).join(' ');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {/* Radial axis lines */}
          {axes.map((_, idx) => {
            const endCoord = getCoordinates(idx, 5);
            return (
              <line
                key={`axis-${idx}`}
                x1={cx}
                y1={cy}
                x2={endCoord.x}
                y2={endCoord.y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Pentagon grids */}
          {gridLines.map((points, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={points}
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
          ))}

          {/* Rating area */}
          <polygon
            points={dataPoints}
            fill="url(#radarGradient)"
            stroke="var(--accent-purple)"
            strokeWidth="2.5"
            filter="url(#glowFilter)"
            style={{ transition: 'all 0.5s ease' }}
          />

          {/* Axis Labels */}
          {axes.map((axis, idx) => {
            const textCoord = getCoordinates(idx, 5.8);
            const anchor = idx === 0 ? 'middle' : (idx === 1 || idx === 2) ? 'start' : 'end';
            const val = data[axis.key] || 0;
            return (
              <g key={`label-${idx}`}>
                <text
                  x={textCoord.x}
                  y={textCoord.y}
                  textAnchor={anchor}
                  fill="var(--text-secondary)"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {axis.label}
                </text>
                <text
                  x={textCoord.x}
                  y={textCoord.y + 12}
                  textAnchor={anchor}
                  fill="var(--accent-cyan)"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Definitions for gradient and glow filters */}
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.2)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.5)" />
            </radialGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Performance Reviews</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track core rating competencies, summarize feedback comments, and plot performance radar indices.</p>
        </div>
        {isPrivileged && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveSubTab('View Reviews')}
              className="btn-logout"
              style={{
                background: activeSubTab === 'View Reviews' ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderColor: activeSubTab === 'View Reviews' ? 'var(--accent-cyan)' : 'var(--card-border)',
                color: activeSubTab === 'View Reviews' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              All Reviews
            </button>
            <button
              onClick={() => setActiveSubTab('Submit Review')}
              className="btn-add-task"
              style={{ background: activeSubTab === 'Submit Review' ? 'var(--accent-purple)' : 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Submit Review</span>
            </button>
          </div>
        )}
      </div>

      {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div className="dashboard-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner-large"></div>
          <p>Compiling review metrics...</p>
        </div>
      ) : (
        <>
          {activeSubTab === 'View Reviews' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
              
              {/* Reviews History Logs */}
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.25rem' }}>Review Histories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviews.length === 0 ? (
                    <div className="glass-panel" style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '16px',
                      padding: '4rem 2rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      No performance reviews logged in the database yet.
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev._id} className="glass-panel" style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                              Review for: {rev.employee ? rev.employee.name : 'Unknown Staff'}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Written by: {rev.reviewer ? rev.reviewer.name : 'Unknown'} | {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid var(--accent-purple)',
                            color: 'var(--accent-purple)',
                            borderRadius: '10px',
                            padding: '0.4rem 0.8rem',
                            fontWeight: '800',
                            fontSize: '1.1rem'
                          }}>
                            {((rev.technicalSkills + rev.communication + rev.teamwork + rev.problemSolving + rev.leadership) / 5).toFixed(1)} / 5.0
                          </div>
                        </div>

                        <p style={{ color: 'var(--text-primary)', fontSize: '0.925rem', lineHeight: '1.5', background: 'rgba(0,0,0,0.15)', padding: '0.85rem 1.1rem', borderRadius: '12px', borderLeft: '3px solid var(--accent-cyan)', marginBottom: '1rem' }}>
                          "{rev.comments}"
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>
                          {['Technical: ' + rev.technicalSkills, 'Comm: ' + rev.communication, 'Team: ' + rev.teamwork, 'Problem: ' + rev.problemSolving, 'Lead: ' + rev.leadership].map((axis, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.35rem 0.15rem' }}>
                              <span style={{ display: 'block', color: 'var(--text-muted)' }}>{axis.split(': ')[0]}</span>
                              <strong style={{ color: 'var(--accent-cyan)' }}>{axis.split(': ')[1]}/5</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Radar Chart Sidebar Panel */}
              <div className="glass-panel" style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '24px',
                padding: '2rem',
                position: 'sticky',
                top: '100px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>Performance Analysis</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
                  {user.role === 'Employee' 
                    ? 'Radar chart representing your historical review parameters.' 
                    : 'Select an employee below to graph their competency averages.'
                  }
                </p>

                {user.role !== 'Employee' && (
                  <select
                    onChange={(e) => handleSelectEmployeeStats(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(10, 10, 15, 0.6)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      color: 'var(--text-primary)',
                      marginBottom: '1.5rem',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.designation})</option>)}
                  </select>
                )}

                {statsLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <div className="spinner"></div>
                  </div>
                ) : (
                  renderRadarChart(selectedEmpStats)
                )}

                {selectedEmpStats && selectedEmpStats.reviewCount > 0 && (
                  <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Review Count: </span>
                    <strong style={{ color: '#fff' }}>{selectedEmpStats.reviewCount}</strong>
                    <br/>
                    <span style={{ color: 'var(--text-secondary)' }}>Average Score: </span>
                    <strong style={{ color: 'var(--accent-emerald)', fontSize: '1.1rem' }}>{selectedEmpStats.overall} / 5.0</strong>
                  </div>
                )}
              </div>

            </div>
          ) : (
            
            // Submit Review Form Sub-Tab (restricted to Managers/Admins)
            <div className="glass-panel" style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '24px',
              padding: '2.5rem',
              maxWidth: '650px',
              margin: '0 auto',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Write Performance Evaluation</h3>
              
              <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Select Employee</label>
                  <select
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    style={{
                      background: 'rgba(10, 10, 15, 0.8)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    required
                  >
                    <option value="">-- Choose employee to review --</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.designation} - {e.department})</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Competency Ratings (1-5)</label>
                  
                  {[
                    { key: 'technicalSkills', label: 'Technical Skills' },
                    { key: 'communication', label: 'Communication' },
                    { key: 'teamwork', label: 'Teamwork' },
                    { key: 'problemSolving', label: 'Problem Solving' },
                    { key: 'leadership', label: 'Leadership' }
                  ].map(competency => (
                    <div key={competency.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{competency.label}</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setFormData({ ...formData, [competency.key]: val })}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: formData[competency.key] === val ? '1px solid var(--accent-cyan)' : '1px solid var(--card-border)',
                              background: formData[competency.key] === val ? 'rgba(6,182,212,0.15)' : 'rgba(0,0,0,0.4)',
                              color: formData[competency.key] === val ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>Evaluation Comments</label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Provide constructive feedback highlighting accomplishments and improvement targets..."
                    rows={4}
                    style={{
                      background: 'rgba(10, 10, 15, 0.8)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      padding: '0.8rem 1rem',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-family)',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                  Submit Evaluation
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PerformanceReviews;
