import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user credentials exist in localStorage
    const savedUser = localStorage.getItem('netflix_user');
    const token = localStorage.getItem('netflix_token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Corrupted data — clear it
        localStorage.removeItem('netflix_token');
        localStorage.removeItem('netflix_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;
      
      const userData = {
        username: data.username || username,
        email: data.email,
        role: data.role
      };
      localStorage.setItem('netflix_token', data.token);
      localStorage.setItem('netflix_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      // Try to extract the most useful error message
      const responseData = error.response?.data;
      let message = 'Login failed. Please try again.';
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.message) {
          message = responseData.message;
        } else if (responseData.error) {
          message = responseData.error;
        }
      } else if (error.message) {
        message =
          error.message === 'Network Error' || error.code === 'ECONNABORTED'
            ? 'Cannot reach the API. Use http://localhost:3000, start the backend on port 8080, then restart npm run dev.'
            : error.message;
      }
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const data = response.data;
      
      const userData = {
        username: data.username || username,
        email: data.email || email,
        role: data.role || 'USER'
      };
      localStorage.setItem('netflix_token', data.token);
      localStorage.setItem('netflix_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      const responseData = error.response?.data;
      let message = 'Registration failed. Please try again.';
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.message) {
          message = responseData.message;
        } else if (responseData.error) {
          message = responseData.error;
        }
      } else if (error.message) {
        message =
          error.message === 'Network Error' || error.code === 'ECONNABORTED'
            ? 'Cannot reach the API. Use http://localhost:3000, start the backend on port 8080, then restart npm run dev.'
            : error.message;
      }
      return { success: false, error: message };
    }
  };

  const [profile, setProfileState] = useState(() => {
    try {
      const saved = localStorage.getItem('netflix_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setProfile = (p) => {
    setProfileState(p);
    if (p) localStorage.setItem('netflix_profile', JSON.stringify(p));
    else localStorage.removeItem('netflix_profile');
  };

  const logout = () => {
    localStorage.removeItem('netflix_token');
    localStorage.removeItem('netflix_user');
    localStorage.removeItem('netflix_profile');
    setUser(null);
    setProfileState(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, setProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
