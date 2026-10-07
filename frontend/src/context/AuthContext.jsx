import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ttt_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('ttt_token'));
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ttt_user', JSON.stringify(user));
      localStorage.setItem('ttt_token', 'mock_jwt_token_' + user.id);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('ttt_user');
      localStorage.removeItem('ttt_token');
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setIsLoading(false);

        if (!email || !password) {
          const err = 'Por favor, preencha todos os campos.';
          setError(err);
          reject(new Error(err));
          return;
        }

        // Mock de usuário logado
        const mockUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email,
          name: email.split('@')[0],
          avatar: null,
          createdAt: new Date().toISOString(),
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        resolve(mockUser);
      }, 1000);
    });
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setIsLoading(false);

        const { email, password, confirmPassword, name } = userData;

        if (!email || !password) {
          const err = 'E-mail e senha são obrigatórios.';
          setError(err);
          reject(new Error(err));
          return;
        }

        if (confirmPassword && password !== confirmPassword) {
          const err = 'As senhas não coincidem.';
          setError(err);
          reject(new Error(err));
          return;
        }

        // Mock de usuário cadastrado
        const mockUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email,
          name: name || email.split('@')[0],
          avatar: null,
          createdAt: new Date().toISOString(),
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        resolve(mockUser);
      }, 1000);
    });
  };

  /**
   * Reseta a autenticação
   */
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('ttt_user');
    localStorage.removeItem('ttt_token');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  return context;
}

export default AuthContext;
