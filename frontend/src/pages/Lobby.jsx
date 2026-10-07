import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import Button from '../components/Button';

export default function Lobby() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected, emit, on, off } = useGameSocket();

  const [socketStatusMsg, setSocketStatusMsg] = useState('Pronto para buscar partida.');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Escuta evento mockado
    const handleMatchFound = (data) => {
      setSocketStatusMsg(`Partida encontrada com ${data?.opponent || 'Adversário'}!`);
      setSearching(false);
    };

    on('match_found', handleMatchFound);

    return () => {
      off('match_found', handleMatchFound);
    };
  }, [on, off]);

  const handleFindMatch = () => {
    setSearching(true);
    setSocketStatusMsg('Buscando oponente na rede...');
    emit('find_match', { playerId: user?.id, playerName: user?.name });

    // Simula resposta do mock WebSocket após 2 segundos
    setTimeout(() => {
      emit('match_found', { opponent: 'Jogador_Convidado_99' });
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card>
        <HeaderBar title="LOBBY" />

        <div className="w-full max-w-md flex flex-col items-center space-y-6 my-auto text-center">
          {/* Status do WebSocket */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-neutral-600 font-medium">
              WebSocket: {isConnected ? 'Conectado (Mock)' : 'Desconectado'}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-neutral-800">
              Bem-vindo, {user?.name || 'Jogador'}!
            </h2>
            <p className="text-sm text-neutral-500 mt-1">{socketStatusMsg}</p>
          </div>

          <div className="w-full space-y-3">
            <Button
              variant="primary"
              onClick={handleFindMatch}
              isLoading={searching}
              className="py-3 text-base shadow-lg"
            >
              Buscar Partida Online
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                emit('create_room', { hostId: user?.id });
                alert('Sala privada criada no mock!');
              }}
              className="py-2.5 text-sm"
            >
              Criar Sala Privada
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline transition-colors cursor-pointer"
            >
              Voltar ao Início
            </button>
            <span className="text-neutral-300">•</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs text-red-500 hover:text-red-700 underline transition-colors cursor-pointer"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>

        <div className="h-6" />
      </Card>
    </div>
  );
}
