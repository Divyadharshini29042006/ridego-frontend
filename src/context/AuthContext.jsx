// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const AuthContext = createContext();

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

  // 🔥 Load user data from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUserData = localStorage.getItem('userData');

      if (token) {
        try {
          const decoded = jwtDecode(token);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            console.log('⚠️ Token expired, clearing auth data');
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            localStorage.removeItem('role');
            localStorage.removeItem('assignedLocation');
            setUser(null);
            setLoading(false);
            return;
          }

          // Merge stored user data with decoded token data
          const userData = storedUserData ? JSON.parse(storedUserData) : {};
          
          const normalizedUser = {
            id: decoded.id || decoded.userId || decoded.sub || userData.id,
            name: userData.name || decoded.name || decoded.fullName || 'User',
            email: userData.email || decoded.email || 'user@email.com',
            role: userData.role || decoded.role || 'customer',
            assignedLocation: userData.assignedLocation || decoded.assignedLocation,
            token
          };

          setUser(normalizedUser);
          console.log('✅ User loaded from localStorage:', normalizedUser);
        } catch (error) {
          console.error('❌ Invalid token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          localStorage.removeItem('role');
          localStorage.removeItem('assignedLocation');
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (token, additionalUserData = {}) => {
    try {
      const decoded = jwtDecode(token);
      console.log('📦 Decoded JWT:', decoded);
      console.log('📦 Additional user data:', additionalUserData);

      // Create complete user object
      const completeUserData = {
        id: additionalUserData.id || decoded.id || decoded.userId || decoded.sub,
        name: additionalUserData.name || decoded.name || decoded.fullName || 'User',
        email: additionalUserData.email || decoded.email || 'user@email.com',
        role: additionalUserData.role || decoded.role || 'customer',
        assignedLocation: additionalUserData.assignedLocation || decoded.assignedLocation,
        token
      };

      // 🔥 Store EVERYTHING in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify({
        id: completeUserData.id,
        name: completeUserData.name,
        email: completeUserData.email,
        role: completeUserData.role,
        assignedLocation: completeUserData.assignedLocation
      }));
      localStorage.setItem('role', completeUserData.role);
      if (completeUserData.assignedLocation) {
        localStorage.setItem('assignedLocation', completeUserData.assignedLocation);
      }

      setUser(completeUserData);
      console.log('✅ User logged in and stored:', completeUserData);
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  // 🔥 NEW: Update user data in context and localStorage
  const updateUser = (updatedData) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...updatedData
    };

    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('userData', JSON.stringify({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      assignedLocation: updatedUser.assignedLocation
    }));

    console.log('✅ User context updated:', updatedUser);
  };

  const logout = () => {
    // 🔥 Clear ALL user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('role');
    localStorage.removeItem('assignedLocation');
    setUser(null);
    console.log('✅ User logged out and localStorage cleared');
  };

  // 🔥 NEW: Refresh user data from backend
  const refreshUserData = async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/profile/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.user) {
        const userData = response.data.user;
        updateUser({
          name: userData.name,
          email: userData.email
        });
        console.log('✅ User data refreshed from backend');
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser,
      refreshUserData,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};