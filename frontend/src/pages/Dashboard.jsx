import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardOverview from '../components/DashboardOverview';
import EmployeeManagement from '../components/EmployeeManagement';
import ProjectManagement from '../components/ProjectManagement';
import AttendanceManagement from '../components/AttendanceManagement';
import PerformanceReviews from '../components/PerformanceReviews';
import ProfileSettings from '../components/ProfileSettings';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { name: 'Dashboard', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ), roles: ['Admin', 'Manager', 'Employee'] },
    
    { name: 'Employee Management', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ), roles: ['Admin', 'Manager'] },
    
    { name: 'Project Management', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ), roles: ['Admin', 'Manager', 'Employee'] },
    
    { name: 'Attendance', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ), roles: ['Admin', 'Manager', 'Employee'] },
    
    { name: 'Performance Reviews', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ), roles: ['Admin', 'Manager', 'Employee'] },
    
    { name: 'Profile', icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ), roles: ['Admin', 'Manager', 'Employee'] }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardOverview user={user} token={user.token} />;
      case 'Employee Management':
        return <EmployeeManagement user={user} token={user.token} />;
      case 'Project Management':
        return <ProjectManagement user={user} token={user.token} />;
      case 'Attendance':
        return <AttendanceManagement user={user} token={user.token} />;
      case 'Performance Reviews':
        return <PerformanceReviews user={user} token={user.token} />;
      case 'Profile':
        return <ProfileSettings user={user} token={user.token} />;
      default:
        return <DashboardOverview user={user} token={user.token} />;
    }
  };

  const handleSidebarTabClick = (tabName) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      
      {/* Sidebar Navigation */}
      <aside 
        className={`dashboard-sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}
        style={{
          width: '260px',
          background: 'rgba(18, 18, 26, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--card-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2rem 1.5rem',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 999,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
          
          {/* Logo brand */}
          <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-cyan)' }}>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EPMS Portal</h1>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {menuItems
              .filter(item => item.roles.includes(user.role))
              .map(item => (
                <button
                  key={item.name}
                  onClick={() => handleSidebarTabClick(item.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    width: '100%',
                    padding: '0.85rem 1.1rem',
                    background: activeTab === item.name ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    color: activeTab === item.name ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontWeight: activeTab === item.name ? '600' : '400',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    boxShadow: activeTab === item.name ? 'inset 0 0 0 1px rgba(6, 182, 212, 0.15)' : 'none'
                  }}
                  className="sidebar-link-hover"
                >
                  <span style={{ display: 'flex', color: activeTab === item.name ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: '0.925rem' }}>{item.name}</span>
                </button>
              ))
            }
          </nav>
        </div>

        {/* Sidebar Footer User Details */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</span>
            </div>
          </div>

          <button onClick={logout} className="btn-logout" style={{ width: '100%', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div style={{ flex: 1, paddingLeft: '260px', minWidth: 0 }}>
        
        {/* Mobile Navbar Header */}
        <header className="mobile-header" style={{
          background: 'rgba(18, 18, 26, 0.8)',
          borderBottom: '1px solid var(--card-border)',
          padding: '1rem 1.5rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 998,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-cyan)' }}>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h1 style={{ fontSize: '1.1rem', fontWeight: '800' }}>EPMS</h1>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </header>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 990
            }}
          />
        )}

        {/* Workspace Scroll Content */}
        <main style={{ padding: '2.5rem 3rem', maxWidth: '1200px', margin: '0 auto' }} className="workspace-main">
          {renderActiveTab()}
        </main>
      </div>

    </div>
  );
};

export default Dashboard;
