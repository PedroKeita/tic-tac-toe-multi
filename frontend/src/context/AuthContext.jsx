import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { gameSocket } from '../services/websocket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ttt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('ttt_user')));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ttt_user', JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('ttt_user');
      setIsAuthenticated(false);
    }
  }, [user]);

  const ensureConnected = useCallback(async () => {
    if (!gameSocket.isConnected()) {
      await gameSocket.connect();
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      await ensureConnected();
    } catch {
      setIsLoading(false);
      const err = 'Nao foi possivel conectar ao servidor.';
      setError(err);
      throw new Error(err);
    }

    return new Promise((resolve, reject) => {
      const onSuccess = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = JSON.parse(msg.payload);
        const userData = { username: payload.username, token: payload.token };
        setUser(userData);
        resolve(userData);
      };

      const onError = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = JSON.parse(msg.payload);
        const errMsg = payload.message || 'Falha no login.';
        setError(errMsg);
        reject(new Error(errMsg));
      };

      const cleanup = () => {
        gameSocket.off('LOGIN_SUCCESS', onSuccess);
        gameSocket.off('LOGIN_ERROR', onError);
      };

      gameSocket.on('LOGIN_SUCCESS', onSuccess);
      gameSocket.on('LOGIN_ERROR', onError);
      gameSocket.send('LOGIN', { username, password });
    });
  }, [ensureConnected]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    const { username, password, confirmPassword } = userData;

    if (!username || !password) {
      setIsLoading(false);
      const err = 'Username e senha sao obrigatorios.';
      setError(err);
      throw new Error(err);
    }

    if (confirmPassword && password !== confirmPassword) {
      setIsLoading(false);
      const err = 'As senhas nao coincidem.';
      setError(err);
      throw new Error(err);
    }

    try {
      await ensureConnected();
    } catch {
      setIsLoading(false);
      const err = 'Nao foi possivel conectar ao servidor.';
      setError(err);
      throw new Error(err);
    }

    return new Promise((resolve, reject) => {
      const onSuccess = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = JSON.parse(msg.payload);
        const registeredUser = { username: payload.username };
        resolve(registeredUser);
      };

      const onError = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = JSON.parse(msg.payload);
        const errMsg = payload.message || 'Falha no registro.';
        setError(errMsg);
        reject(new Error(errMsg));
      };

      const cleanup = () => {
        gameSocket.off('REGISTER_SUCCESS', onSuccess);
        gameSocket.off('REGISTER_ERROR', onError);
      };

      gameSocket.on('REGISTER_SUCCESS', onSuccess);
      gameSocket.on('REGISTER_ERROR', onError);
      gameSocket.send('REGISTER', { username, password });
    });
  }, [ensureConnected]);

  const logout = useCallback(() => {
    gameSocket.send('DISCONNECT', {});
    gameSocket.disconnect();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('ttt_user');
  }, []);

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
