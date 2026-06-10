import React, { useState, useEffect } from 'react';

const ProfileSettings = ({ user, token }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Password Reset State
  const [passFormData, setPassFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:5000/api/auth/profile', { headers });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.message || 'Failed to load profile details');
      }
    } catch (err) {
      setError('Connection failed to user profile API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!passFormData.newPassword || !passFormData.confirmPassword) {
      setPassError('Please fill in all password fields');
      return;
    }

    if (passFormData.newPassword.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }

    if (passFormData.newPassword !== passFormData.confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }

    try {
      setPassLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          newPassword: passFormData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPassSuccess('Password updated successfully');
        setPassFormData({ newPassword: '', confirmPassword: '' });
      } else {
        setPassError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setPassError('Request error updating password');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Retrieving secure profile credentials...</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
      
      {/* Profile Info Details */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>My Profile Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>Review personal metadata, corporate placement, and reporting hierarchy credentials.</p>

        {error && <div className="dashboard-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {profile && (
          <div className="glass-panel" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '2rem',
                fontWeight: '800',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{profile.name}</h3>
                <p style={{ color: 'var(--accent-cyan)', fontWeight: '600', fontSize: '0.925rem' }}>{profile.designation}</p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '1.5rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Email Address</span>
                <p style={{ fontWeight: '500', marginTop: '0.25rem' }}>{profile.email}</p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Department</span>
                <p style={{ fontWeight: '500', marginTop: '0.25rem' }}>{profile.department}</p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>System Role</span>
                <p style={{ fontWeight: '500', marginTop: '0.25rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    background: 'rgba(6, 182, 212, 0.1)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.2)'
                  }}>{profile.role}</span>
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Reporting Manager</span>
                <p style={{ fontWeight: '500', marginTop: '0.25rem' }}>
                  {profile.manager ? profile.manager.name : <em style={{ color: 'var(--text-muted)' }}>None Assigned</em>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Sidebar Module */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Manager Placement Panel */}
        {profile && profile.manager && (
          <div className="glass-panel" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '24px',
            padding: '1.5rem 1.75rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>My Manager</h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>{profile.manager.name}</h5>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{profile.manager.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel" style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem' }}>Update Password</h3>

          {passSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '1rem' }}>{passSuccess}</div>}
          {passError && <div className="auth-error" style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', marginBottom: '1rem' }}>{passError}</div>}

          <form onSubmit={handlePasswordSubmit} className="auth-form" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="newPass">New Password</label>
              <input
                type="password"
                id="newPass"
                value={passFormData.newPassword}
                onChange={(e) => setPassFormData({ ...passFormData, newPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPass">Confirm New Password</label>
              <input
                type="password"
                id="confirmPass"
                value={passFormData.confirmPassword}
                onChange={(e) => setPassFormData({ ...passFormData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={passLoading} style={{ marginTop: '0.5rem' }}>
              {passLoading ? <span className="spinner"></span> : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default ProfileSettings;
