import React, { useState, useEffect } from 'react';

const AttendanceManagement = ({ user, token }) => {
  const [history, setHistory] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [teamLogs, setTeamLogs] = useState([]);
  const [teamSummary, setTeamSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tabs for Manager/Admin
  const [activeSubTab, setActiveSubTab] = useState('My Attendance');

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchMyAttendance = async () => {
    try {
      const resStatus = await fetch('http://localhost:5000/api/attendance/status', { headers });
      const statusData = await resStatus.json();
      if (statusData.success) {
        setTodayStatus(statusData.data);
      }

      const resHist = await fetch('http://localhost:5000/api/attendance/history', { headers });
      const histData = await resHist.json();
      if (histData.success) {
        setHistory(histData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeamAttendance = async () => {
    if (user.role === 'Manager') {
      try {
        const res = await fetch('http://localhost:5000/api/attendance/team-summary', { headers });
        const data = await res.json();
        if (data.success) {
          setTeamLogs(data.data.attendance);
          setTeamSummary(data.data.summary);
        }
      } catch (err) {
        console.error(err);
      }
    } else if (user.role === 'Admin') {
      try {
        const res = await fetch('http://localhost:5000/api/attendance/admin-summary', { headers });
        const data = await res.json();
        if (data.success) {
          setTeamLogs(data.data.logs);
          setTeamSummary({
            totalTeamSize: data.data.totalEmployees,
            present: data.data.totalPresent,
            rate: data.data.presentPercentage
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const initData = async () => {
    setLoading(true);
    setError('');
    await fetchMyAttendance();
    if (user.role !== 'Employee') {
      await fetchTeamAttendance();
    }
    setLoading(false);
  };

  useEffect(() => {
    initData();

    // Clock ticker
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [token, user]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/attendance/check-in', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Checked In successfully');
        fetchMyAttendance();
        fetchTeamAttendance();
      } else {
        setError(data.message || 'Check In failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/attendance/check-out', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Checked Out successfully');
        fetchMyAttendance();
        fetchTeamAttendance();
      } else {
        setError(data.message || 'Check Out failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate a neat 30 days attendance calendar log
  const renderCalendarGrid = () => {
    const boxes = [];
    const today = new Date();
    
    // Last 28 days
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Check if we have logs for this date
      const log = history.find(h => h.date === dateStr);
      let status = 'Future'; // defaulted to gray/blank
      
      // If it is in the past and no log, let's mark it as absent (red), except if weekend
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (log) {
        status = log.status; // Present or Late
      } else if (d < today && !isWeekend) {
        status = 'Absent';
      } else if (isWeekend) {
        status = 'Weekend';
      }

      boxes.push({
        date: dateStr,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        status
      });
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.75rem',
        marginTop: '1.25rem'
      }}>
        {boxes.map((box, index) => {
          let color = 'rgba(255,255,255,0.03)';
          let border = '1px solid rgba(255,255,255,0.06)';
          let glow = 'none';

          if (box.status === 'Present') {
            color = 'rgba(16, 185, 129, 0.15)';
            border = '1px solid var(--accent-emerald)';
            glow = '0 0 6px var(--accent-emerald-glow)';
          } else if (box.status === 'Late') {
            color = 'rgba(6, 182, 212, 0.15)';
            border = '1px solid var(--accent-cyan)';
            glow = '0 0 6px var(--accent-cyan-glow)';
          } else if (box.status === 'Absent') {
            color = 'rgba(239, 68, 68, 0.1)';
            border = '1px solid var(--accent-red)';
            glow = '0 0 6px var(--accent-red-glow)';
          } else if (box.status === 'Weekend') {
            color = 'rgba(255, 255, 255, 0.01)';
            border = '1px dashed rgba(255,255,255,0.04)';
          }

          return (
            <div
              key={index}
              title={`${box.date}: ${box.status}`}
              style={{
                background: color,
                border,
                borderRadius: '10px',
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: glow,
                fontSize: '0.75rem',
                fontWeight: '600',
                color: box.status === 'Weekend' ? 'var(--text-muted)' : 'var(--text-primary)'
              }}
            >
              <span>{box.label.split(' ')[1]}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                {box.label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const formatClockTime = (date) => {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatClockDate = (date) => {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTimeStr = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Attendance Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Log working hours, check daily presence ratios, and review monthly activity logs.</p>
        </div>
      </div>

      {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div className="dashboard-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Role Tabs */}
      {user.role !== 'Employee' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {['My Attendance', 'Team Logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                background: activeSubTab === tab ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                border: activeSubTab === tab ? '1px solid var(--accent-purple)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: activeSubTab === tab ? 'var(--accent-purple)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: activeSubTab === tab ? '600' : '400'
              }}
            >
              {tab === 'Team Logs' && user.role === 'Admin' ? 'Company Check-Ins' : tab}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner-large"></div>
          <p>Syncing attendance timestamps...</p>
        </div>
      ) : (
        <>
          {activeSubTab === 'My Attendance' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' }}>
              
              {/* Check In / Out Clock Panel */}
              <div className="glass-panel" style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '24px',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {formatClockDate(currentTime)}
                </div>
                
                <div style={{
                  fontSize: '3.25rem',
                  fontWeight: '800',
                  margin: '1rem 0',
                  fontFamily: 'monospace',
                  color: 'var(--accent-cyan)',
                  textShadow: '0 0 15px var(--accent-cyan-glow)'
                }}>
                  {formatClockTime(currentTime)}
                </div>

                <div style={{ margin: '1.5rem 0', display: 'flex', gap: '1rem', width: '100%', maxWidth: '320px' }}>
                  {/* Check In Button */}
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading || todayStatus !== null}
                    className="btn-primary"
                    style={{
                      flex: '1',
                      margin: 0,
                      background: todayStatus !== null ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                      boxShadow: todayStatus !== null ? 'none' : '0 4px 12px var(--accent-cyan-glow)',
                      color: todayStatus !== null ? 'var(--text-muted)' : '#fff'
                    }}
                  >
                    {actionLoading ? <span className="spinner"></span> : 'Check In'}
                  </button>

                  {/* Check Out Button */}
                  <button
                    onClick={handleCheckOut}
                    disabled={actionLoading || todayStatus === null || todayStatus.checkOut !== undefined}
                    className="btn-logout"
                    style={{
                      flex: '1',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: (todayStatus === null || todayStatus.checkOut !== undefined) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {actionLoading ? <span className="spinner"></span> : 'Check Out'}
                  </button>
                </div>

                {/* Status Indicator */}
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {todayStatus === null ? (
                    <span>Status: <strong style={{ color: 'var(--accent-red)' }}>Not Checked In</strong></span>
                  ) : todayStatus.checkOut === undefined ? (
                    <span>Status: <strong style={{ color: 'var(--accent-cyan)' }}>Checked In at {formatTimeStr(todayStatus.checkIn)}</strong></span>
                  ) : (
                    <span>Status: <strong style={{ color: 'var(--accent-emerald)' }}>Checked Out ({todayStatus.status})</strong></span>
                  )}
                </div>
              </div>

              {/* Calendar Visual Panel */}
              <div className="glass-panel" style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Recent Activity (Last 28 Days)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '0.5rem' }}>Visual calendar logging presence status metrics.</p>
                {renderCalendarGrid()}
                
                {/* Legend */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)' }}></div>
                    <span>Present</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid var(--accent-cyan)' }}></div>
                    <span>Late</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)' }}></div>
                    <span>Absent</span>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Personal Attendance History</h3>
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Date</th>
                        <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Check In</th>
                        <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Check Out</th>
                        <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No logs recorded yet.</td>
                        </tr>
                      ) : (
                        history.map((log, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '1rem 1.25rem', fontWeight: '500' }}>{log.date}</td>
                            <td style={{ padding: '1rem 1.25rem' }}>{formatTimeStr(log.checkIn)}</td>
                            <td style={{ padding: '1rem 1.25rem' }}>{formatTimeStr(log.checkOut)}</td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <span style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                background: log.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                                color: log.status === 'Present' ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                                border: `1px solid ${log.status === 'Present' ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)'}`
                              }}>{log.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            
            // Team Logs Sub-Tab
            <div>
              {teamSummary && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Team Size</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem' }}>{teamSummary.totalTeamSize}</h3>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Present Today</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--accent-emerald)' }}>{teamSummary.present || 0}</h3>
                  </div>
                  {teamSummary.late !== undefined && (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Late Today</span>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--accent-cyan)' }}>{teamSummary.late || 0}</h3>
                    </div>
                  )}
                  {teamSummary.absent !== undefined && (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Absent Today</span>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--accent-red)' }}>{teamSummary.absent || 0}</h3>
                    </div>
                  )}
                  {teamSummary.rate !== undefined && (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Attendance Rate</span>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--accent-cyan)' }}>{teamSummary.rate}%</h3>
                    </div>
                  )}
                </div>
              )}

              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Today's Employee Presence Logs</h3>
              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Employee</th>
                      <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Department</th>
                      <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Check In</th>
                      <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Check Out</th>
                      <th style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No presence updates for today.</td>
                      </tr>
                    ) : (
                      teamLogs.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: '500' }}>{log.employee ? log.employee.name : 'Unknown'}</td>
                          <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>{log.employee ? log.employee.department : '--'}</td>
                          <td style={{ padding: '1rem 1.25rem' }}>{formatTimeStr(log.checkIn)}</td>
                          <td style={{ padding: '1rem 1.25rem' }}>{formatTimeStr(log.checkOut)}</td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              background: log.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                              color: log.status === 'Present' ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                              border: `1px solid ${log.status === 'Present' ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)'}`
                            }}>{log.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceManagement;
