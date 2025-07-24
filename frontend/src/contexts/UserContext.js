import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://event-tracker-app-u25w.onrender.com/api'
  : 'http://localhost:8000/api';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initialization
  useEffect(() => {
    const storedUser = localStorage.getItem('eventTrackerUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('eventTrackerUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        const userData = {
          ...result.user,
          loginTime: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('eventTrackerUser', JSON.stringify(userData));
        
        return { 
          success: true, 
          message: 'Login successful' 
        };
      } else {
        return { 
          success: false, 
          message: result.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eventTrackerUser');
  };

  const changePassword = async (newPassword) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id, 
          newPassword 
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const isGuest = () => {
    return user === null;
  };

  const canView = () => {
    return true; // Everyone can view events
  };

  const canJoinEvent = () => {
    return true; // Everyone can join events (including non-logged users)
  };

  const canCreate = () => {
    return isAdmin();
  };

  const canEdit = () => {
    return isAdmin();
  };

  const canDelete = () => {
    return isAdmin();
  };

  const value = {
    user,
    login,
    logout,
    changePassword,
    isAdmin,
    isAuthenticated,
    isGuest,
    canView,
    canJoinEvent,
    canCreate,
    canEdit,
    canDelete,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
