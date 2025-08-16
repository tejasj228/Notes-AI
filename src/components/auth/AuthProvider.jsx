import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../api/auth';

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
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          console.log('AuthProvider init - Stored user:', JSON.parse(storedUser));
          // Verify token is still valid
          const response = await authAPI.getProfile();
          if (response.success) {
            console.log('AuthProvider init - Profile response user ID:', response.data.user?.id);
            console.log('AuthProvider init - Profile response user:', response.data.user);
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            // Token invalid, clear storage
            logout();
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData, authToken) => {
    console.log('AuthProvider login - User ID:', userData?.id);
    console.log('AuthProvider login - User data:', userData);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
