import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(true);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    console.log('[MOCK SOCKET]: Conexão estabelecida.');
    setIsConnected(true);

    return () => {
      console.log('[MOCK SOCKET]: Conexão encerrada.');
      listenersRef.current.clear();
    };
  }, []);


  const emit = useCallback((eventName, payload) => {
    console.log('[MOCK SOCKET EMIT]:', eventName, payload);

    const callbacks = listenersRef.current.get(eventName) || [];
    callbacks.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[MOCK SOCKET ERROR]: Falha ao executar listener de ${eventName}`, err);
      }
    });
  }, []);

  const on = useCallback((eventName, callback) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, []);
    }
    listenersRef.current.get(eventName).push(callback);
    console.log(`[MOCK SOCKET]: Ouvinte registrado para o evento '${eventName}'`);
  }, []);

  const off = useCallback((eventName, callback) => {
    if (!listenersRef.current.has(eventName)) return;

    if (!callback) {
      listenersRef.current.delete(eventName);
    } else {
      const filtered = listenersRef.current.get(eventName).filter((cb) => cb !== callback);
      listenersRef.current.set(eventName, filtered);
    }
    console.log(`[MOCK SOCKET]: Ouvinte removido do evento '${eventName}'`);
  }, []);

  return {
    isConnected,
    setIsConnected,
    emit,
    on,
    off,
  };
}

export default useGameSocket;
