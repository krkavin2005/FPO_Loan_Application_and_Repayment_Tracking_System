import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default api URL
  const API_BASE_URL = 'http://localhost:5000/api';
  axios.defaults.baseURL = API_BASE_URL;

  // Sync token with local storage and axios headers
  useEffect(() => {
    const storedUser = localStorage.getItem('agrilend_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const data = response.data;
      setUser(data);
      localStorage.setItem('agrilend_user', JSON.stringify(data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const registerFarmer = async (formData) => {
    try {
      const response = await axios.post('/auth/register', formData);
      const data = response.data;
      setUser(data);
      localStorage.setItem('agrilend_user', JSON.stringify(data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Try again.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrilend_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshProfile = async () => {
    try {
      const response = await axios.get('/auth/me');
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      localStorage.setItem('agrilend_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error refreshing user profile: ', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerFarmer,
        logout,
        refreshProfile,
        API_BASE_URL,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
