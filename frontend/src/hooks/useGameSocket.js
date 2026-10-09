import { useState, useEffect, useRef, useCallback } from 'react';

// Salas mockadas iniciais (fiéis ao Figma com "Pedro" e "Davi")
const INITIAL_MOCK_ROOMS = [
  { id: 'room-pedro', hostName: 'Pedro', isFull: false },
  { id: 'room-davi', hostName: 'Davi', isFull: true },
  { id: 'room-lucas', hostName: 'Lucas', isFull: false },
];

/**
 * Hook centralizado para WebSockets com simulador inteligente de rede
 */
export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(true);
  const listenersRef = useRef(new Map());
  const activeRoomsRef = useRef([...INITIAL_MOCK_ROOMS]);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    console.log('[MOCK SOCKET]: Conexão estabelecida.');
    setIsConnected(true);

    return () => {
      console.log('[MOCK SOCKET]: Conexão encerrada.');
      listenersRef.current.clear();
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  /**
   * Dispara callbacks locais registrados para um evento
   */
  const triggerLocal = useCallback((eventName, data) => {
    console.log(`[MOCK SOCKET INCOMING] -> '${eventName}':`, data);
    const callbacks = listenersRef.current.get(eventName) || [];
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[MOCK SOCKET ERROR]: Falha no listener de '${eventName}'`, err);
      }
    });
  }, []);

  /**
   * Emite eventos para o WebSocket simulado
   */
  const emit = useCallback((eventName, payload = {}) => {
    console.log('[MOCK SOCKET EMIT]:', eventName, payload);

    // 1. Obter lista de salas
    if (eventName === 'get_rooms') {
      const t = setTimeout(() => {
        triggerLocal('rooms_list', activeRoomsRef.current);
      }, 300);
      timeoutsRef.current.push(t);
      return;
    }

    // 2. Criar uma nova sala
    if (eventName === 'create_room') {
      const roomId = 'room_' + Math.random().toString(36).substring(2, 8);
      const newRoom = {
        id: roomId,
        hostName: payload.hostName || 'Você',
        hostId: payload.hostId,
        isFull: false,
      };
      activeRoomsRef.current.unshift(newRoom);

      triggerLocal('room_created', { roomId, room: newRoom });

      // Simulação: após 3.5 segundos aguardando, um segundo jogador ("Jogador 2") entra na sala
      const t = setTimeout(() => {
        const opponent = {
          id: 'usr_guest_42',
          name: 'Jogador 2',
          avatar: 'bot',
          symbol: 'X',
        };
        newRoom.isFull = true;
        triggerLocal('player_joined', { roomId, opponent });
      }, 3500);
      timeoutsRef.current.push(t);
      return;
    }

    // 3. Entrar em uma sala existente
    if (eventName === 'join_room') {
      const { roomId } = payload;
      const targetRoom = activeRoomsRef.current.find((r) => r.id === roomId);
      const opponentName = targetRoom ? targetRoom.hostName : 'Pedro';

      const t = setTimeout(() => {
        triggerLocal('joined_room', {
          roomId,
          opponent: {
            id: 'usr_opponent_99',
            name: opponentName,
            avatar: 'bot',
            symbol: 'X',
          },
        });
      }, 400);
      timeoutsRef.current.push(t);
      return;
    }

    // 4. Jogada de um jogador
    if (eventName === 'make_move') {
      const { cellIndex, symbol, board } = payload;
      triggerLocal('move_made', { cellIndex, symbol });

      // Simula resposta do oponente online após 1.2s a 1.8s
      if (board) {
        const delay = Math.floor(Math.random() * 600) + 1200;
        const t = setTimeout(() => {
          // Acha células vazias para a resposta do oponente
          const availableIndices = board
            .map((v, i) => (v === null && i !== cellIndex ? i : null))
            .filter((v) => v !== null);

          if (availableIndices.length > 0) {
            const botChoice = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            triggerLocal('opponent_move', {
              cellIndex: botChoice,
              symbol: symbol === 'O' ? 'X' : 'O',
            });
          }
        }, delay);
        timeoutsRef.current.push(t);
      }
      return;
    }

    // 5. Pedido de Revanche
    if (eventName === 'request_rematch') {
      triggerLocal('rematch_requested', { by: payload.by || 'You' });
      const t = setTimeout(() => {
        triggerLocal('rematch_accepted', { message: 'Oponente aceitou a revanche!' });
      }, 1000);
      timeoutsRef.current.push(t);
      return;
    }

    // 6. Sair da sala
    if (eventName === 'leave_room') {
      triggerLocal('left_room', { roomId: payload.roomId });
      return;
    }

    // Caso genérico: dispara listener local com o mesmo payload se registrado
    triggerLocal(eventName, payload);
  }, [triggerLocal]);

  /**
   * Registra um listener para um evento
   */
  const on = useCallback((eventName, callback) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, []);
    }
    listenersRef.current.get(eventName).push(callback);
  }, []);

  /**
   * Remove um listener
   */
  const off = useCallback((eventName, callback) => {
    if (!listenersRef.current.has(eventName)) return;

    if (!callback) {
      listenersRef.current.delete(eventName);
    } else {
      const filtered = listenersRef.current.get(eventName).filter((cb) => cb !== callback);
      listenersRef.current.set(eventName, filtered);
    }
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
