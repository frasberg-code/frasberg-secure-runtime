import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Private admin users - DO NOT expose publicly
const ADMIN_USERS = [
  'admin@emeraldorbit.com',
  'teslalicensecompany@gmail.com',
  'sqaurepay@usa.com',
  'mr.claytonm.bernardex@gmail.com',
  'contact@168emeraldestatesllc.com'
];
const ADMIN_PASSWORD = '2151947@$$Aa';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth
    const stored = localStorage.getItem('sofia_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('sofia_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    // Check if admin user
    const isAdmin = ADMIN_USERS.includes(email.toLowerCase()) && password === ADMIN_PASSWORD;
    
    if (!isAdmin && password !== ADMIN_PASSWORD) {
      // For non-admin, accept any password for demo purposes
      // In production, this should validate against a real backend
    }
    
    const userData = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };
    setUser(userData);
    localStorage.setItem('sofia_user', JSON.stringify(userData));
    return userData;
  };

  const signup = async (email, password, name) => {
    const userData = {
      id: Date.now().toString(),
      email,
      name: name || email.split('@')[0],
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    setUser(userData);
    localStorage.setItem('sofia_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sofia_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
