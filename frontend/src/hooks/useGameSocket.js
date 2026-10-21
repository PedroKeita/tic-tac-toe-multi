import { useState, useEffect, useCallback } from 'react';
import { gameSocket } from '../services/websocket';

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(gameSocket.isConnected());

  useEffect(() => {
    const onConnected = () => setIsConnected(true);
    const onDisconnected = () => setIsConnected(false);

    gameSocket.on('_connected', onConnected);
    gameSocket.on('_disconnected', onDisconnected);

    if (!gameSocket.isConnected()) {
      gameSocket.connect().catch(() => {});
    }

    return () => {
      gameSocket.off('_connected', onConnected);
      gameSocket.off('_disconnected', onDisconnected);
    };
  }, []);

  const send = useCallback((type, payload = {}) => {
    gameSocket.send(type, payload);
  }, []);

  const on = useCallback((type, callback) => {
    gameSocket.on(type, callback);
  }, []);

  const off = useCallback((type, callback) => {
    gameSocket.off(type, callback);
  }, []);

  return { isConnected, send, on, off };
}

export default useGameSocket;
