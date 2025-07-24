import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simple authentication - in a real app, this would connect to a proper auth service
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

  const login = (username, password) => {
    // Simple demo authentication - in production, this should be handled by a secure backend
    const validCredentials = [
      { 
        username: 'admin', 
        password: 'CatchBall2025!Secure#Admin', 
        role: 'admin', 
        name: 'Administrator',
        phone: '+1234567890',
        team: 'Management'
      }
    ];

    const foundUser = validCredentials.find(
      cred => cred.username === username && cred.password === password
    );

    if (foundUser) {
      const userData = {
        id: Date.now(),
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
        phone: foundUser.phone,
        team: foundUser.team,
        loginTime: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('eventTrackerUser', JSON.stringify(userData));
      return { success: true, user: userData };
    }

    return { success: false, message: 'Invalid username or password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eventTrackerUser');
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
