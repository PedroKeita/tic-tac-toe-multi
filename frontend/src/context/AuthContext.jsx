import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { gameSocket } from '../services/websocket';
import { safeParsePayload } from '../utils/safeJson';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Sessão em memória para evitar sessões fantasmas após F5 (quando o socket novo não está autenticado)
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Limpa resquícios de localStorage ao inicializar e escuta desconexão do socket
  useEffect(() => {
    localStorage.removeItem('ttt_user');

    const handleDisconnect = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('ttt_user');
    };

    gameSocket.on('_disconnected', handleDisconnect);
    return () => {
      gameSocket.off('_disconnected', handleDisconnect);
    };
  }, []);

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
      const err = 'Não foi possível conectar ao servidor.';
      setError(err);
      throw new Error(err);
    }

    return new Promise((resolve, reject) => {
      let timer = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        gameSocket.off('LOGIN_SUCCESS', onSuccess);
        gameSocket.off('LOGIN_ERROR', onError);
        gameSocket.off('ERROR', onGeneralError);
      };

      const onSuccess = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = safeParsePayload(msg.payload, {});
        const userData = { username: payload.username || username.trim(), token: payload.token };
        setUser(userData);
        setIsAuthenticated(true);
        resolve(userData);
      };

      const onError = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = safeParsePayload(msg.payload, {});
        const errMsg = payload.message || 'Falha no login.';
        setError(errMsg);
        reject(new Error(errMsg));
      };

      const onGeneralError = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = safeParsePayload(msg.payload, {});
        const errMsg = payload.message || 'Erro interno no servidor.';
        setError(errMsg);
        reject(new Error(errMsg));
      };

      // Timeout de 5s para evitar spinner travado
      timer = setTimeout(() => {
        cleanup();
        setIsLoading(false);
        const errMsg = 'Tempo de resposta do servidor esgotado. Tente novamente.';
        setError(errMsg);
        reject(new Error(errMsg));
      }, 5000);

      gameSocket.on('LOGIN_SUCCESS', onSuccess);
      gameSocket.on('LOGIN_ERROR', onError);
      gameSocket.on('ERROR', onGeneralError);
      gameSocket.send('LOGIN', { username: username.trim(), password });
    });
  }, [ensureConnected]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    const { username, password, confirmPassword } = userData;

    if (!username || !username.trim() || !password) {
      setIsLoading(false);
      const err = 'Username e senha são obrigatórios.';
      setError(err);
      throw new Error(err);
    }

    if (confirmPassword && password !== confirmPassword) {
      setIsLoading(false);
      const err = 'As senhas não coincidem.';
      setError(err);
      throw new Error(err);
    }

    try {
      await ensureConnected();
    } catch {
      setIsLoading(false);
      const err = 'Não foi possível conectar ao servidor.';
      setError(err);
      throw new Error(err);
    }

    return new Promise((resolve, reject) => {
      let timer = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        gameSocket.off('REGISTER_SUCCESS', onSuccess);
        gameSocket.off('REGISTER_ERROR', onError);
        gameSocket.off('ERROR', onGeneralError);
      };

      const onSuccess = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = safeParsePayload(msg.payload, {});
        const registeredUser = { username: payload.username || username.trim() };
        resolve(registeredUser);
      };

      const onError = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = safeParsePayload(msg.payload, {});
        const errMsg = payload.message || 'Falha no registro.';
        setError(errMsg);
        reject(new Error(errMsg));
      };

      const onGeneralError = (msg) => {
        cleanup();
        setIsLoading(false);
        const payload = safeParsePayload(msg.payload, {});
        const errMsg = payload.message || 'Erro interno no servidor.';
        setError(errMsg);
        reject(new Error(errMsg));
      };

      // Timeout de 5s para evitar spinner travado
      timer = setTimeout(() => {
        cleanup();
        setIsLoading(false);
        const errMsg = 'Tempo de resposta do servidor esgotado. Tente novamente.';
        setError(errMsg);
        reject(new Error(errMsg));
      }, 5000);

      gameSocket.on('REGISTER_SUCCESS', onSuccess);
      gameSocket.on('REGISTER_ERROR', onError);
      gameSocket.on('ERROR', onGeneralError);
      gameSocket.send('REGISTER', { username: username.trim(), password });
    });
  }, [ensureConnected]);

  const logout = useCallback(() => {
    try {
      gameSocket.send('DISCONNECT', {});
    } catch {}
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
