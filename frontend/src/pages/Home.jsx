import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TicTacToeLogo from '../components/TicTacToeLogo';
import Button from '../components/Button';

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handlePlayClick = () => {
    if (isAuthenticated) {
      navigate('/game-mode');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#eceef2] relative select-none">
      {/* Indicador de Usuário Logado no Topo */}
      {isAuthenticated && user && (
        <div className="absolute top-6 right-6 flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-neutral-200">
          <span className="text-sm font-medium text-neutral-700">
            Olá, <strong className="text-neutral-900">{user.name}</strong>
          </span>
          <button
            onClick={logout}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      )}

      {/* Container Principal Centralizado */}
      <div className="flex flex-col items-center justify-center space-y-12">
        {/* Ilustração Exata da Grade do Jogo da Velha (Figma Tela Inicial) */}
        <TicTacToeLogo className="w-64 h-64 md:w-80 md:h-80 drop-shadow-sm" />

        {/* Botão Jogar */}
        <div className="w-48">
          <Button
            onClick={handlePlayClick}
            variant="primary"
            className="py-3 px-8 text-lg font-semibold rounded-2xl shadow-[0_10px_25px_-5px_rgba(34,166,254,0.5)]"
          >
            Jogar
          </Button>
        </div>
      </div>
    </div>
  );
}
