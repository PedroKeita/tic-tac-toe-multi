import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import RoomListBoard from '../components/RoomListBoard';
import Button from '../components/Button';

export default function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit, on, off } = useGameSocket();

  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Escuta a lista de salas enviada pelo socket
    const handleRoomsList = (roomsList) => {
      setRooms(roomsList || []);
      setIsLoading(false);
    };

    on('rooms_list', handleRoomsList);

    // Solicita as salas disponíveis ao montar
    setIsLoading(true);
    emit('get_rooms');

    return () => {
      off('rooms_list', handleRoomsList);
    };
  }, [emit, on, off]);

  const handleJoinRoom = (roomId, hostName) => {
    navigate(`/game/multiplayer?roomId=${roomId}&opponent=${encodeURIComponent(hostName)}`);
  };

  const handleCreateRoom = () => {
    navigate('/game/multiplayer?status=waiting&create=true');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card className="min-h-[620px] max-w-[920px] justify-between">
        {/* Título e Barra Bipartida (Fiel ao print 'Jogadores online' do Figma) */}
        <HeaderBar title="SALAS DISPONIVEIS" />

        {/* Quadro de Giz com a Lista de Salas Públicas */}
        <div className="my-auto flex flex-col items-center">
          <RoomListBoard
            rooms={rooms}
            onJoinRoom={handleJoinRoom}
            isLoading={isLoading}
          />

          {/* Botões de Ação Complementares */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              className="py-2.5 px-6 text-sm shadow-md"
            >
              + Criar Minha Sala
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate('/game-mode')}
              className="py-2.5 px-6 text-sm"
            >
              Voltar aos Modos
            </Button>
          </div>
        </div>

        {/* Rodapé equilibrado */}
        <div className="h-4" />
      </Card>
    </div>
  );
}
