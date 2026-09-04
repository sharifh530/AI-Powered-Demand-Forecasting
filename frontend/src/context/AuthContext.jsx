import React, { createContext, useContext, useState, useEffect } from 'react';
import APIService from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check local storage for existing session
    const savedUser = APIService.getCurrentUser();
    const token = localStorage.getItem('access_token');

    if (savedUser && token) {
      setUser(savedUser);
      setIsDemoMode(token.includes('demo_mode'));
    } else {
      // Default demo guest session so dashboard is immediately usable
      const guestUser = { username: 'planner.demo', role: 'planner' };
      setUser(guestUser);
      setIsDemoMode(true);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await APIService.login(username, password);
    if (res.success) {
      setUser(res.user);
      setIsDemoMode(!res.live);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    APIService.logout();
    const guestUser = { username: 'planner.demo', role: 'planner' };
    setUser(guestUser);
    setIsDemoMode(true);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
