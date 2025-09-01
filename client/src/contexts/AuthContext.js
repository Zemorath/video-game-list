import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check for existing authentication on app load
  useEffect(() => {
    if (!hasCheckedAuth) {
      checkAuthStatus();
    }
  }, [hasCheckedAuth]);

  const checkAuthStatus = async () => {
    try {
      // Try to verify the token from the cookie
      const response = await authAPI.verifyToken();
      if (response.success) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // If verification fails, user is not authenticated
      console.log('Auth verification failed:', error.response?.status);
      setUser(null);
      
      // Temporarily disable automatic redirect to debug the issue
      // TODO: Re-enable once API connection is stable
      /*
      // Only redirect to login if we're not already there and it's a 401
      if (error.response?.status === 401 && 
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      */
    } finally {
      setLoading(false);
      setHasCheckedAuth(true);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setHasCheckedAuth(true); // Mark as checked to prevent re-checking
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
