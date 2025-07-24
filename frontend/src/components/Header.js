import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Header = () => {
  const { user, logout, isAdmin, isAuthenticated } = useUser();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'user': return '👤';
      case 'guest': return '👁️';
      default: return '❓';
    }
  };

  const getRoleBadge = (role) => {
    const baseStyle = {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginLeft: '0.5rem'
    };

    const roleStyles = {
      admin: { backgroundColor: '#ff6b6b', color: 'white' },
      user: { backgroundColor: '#4ecdc4', color: 'white' },
      guest: { backgroundColor: '#95a5a6', color: 'white' }
    };

    return (
      <span style={{ ...baseStyle, ...roleStyles[role] }}>
        {role}
      </span>
    );
  };

  return (
    <header className="header">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>� Catchball Events</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <span>{getRoleIcon(user.role)} {user.name}</span>
                  {getRoleBadge(user.role)}
                  {isAdmin() && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                      (Can Create/Edit/Delete)
                    </span>
                  )}
                </div>
                
                <button
                  onClick={logout}
                  className="btn"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <div style={{ color: 'white', fontSize: '0.9rem', opacity: 0.9 }}>
                👤 Guest User (View & Join Events) • 
                <Link 
                  to="/login" 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'underline',
                    marginLeft: '0.5rem'
                  }}
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
