import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';

// Ilustração vetorial do Robô (Modo Single Player)
function RobotIcon() {
  return (
    <div className="w-24 h-24 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        {/* Antena com esfera no topo */}
        <line x1="50" y1="8" x2="50" y2="22" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="8" r="4" fill="#fbbf24" stroke="#111827" strokeWidth="2" />

        {/* Cabeça do Robô */}
        <rect x="30" y="22" width="40" height="32" rx="8" fill="#f87171" stroke="#111827" strokeWidth="3.5" />
        {/* Viseira / Olhos */}
        <rect x="36" y="28" width="28" height="12" rx="4" fill="#38bdf8" stroke="#111827" strokeWidth="2" />
        <circle cx="43" cy="34" r="2.5" fill="#111827" />
        <circle cx="57" cy="34" r="2.5" fill="#111827" />
        {/* Boca do Robô */}
        <line x1="42" y1="46" x2="58" y2="46" stroke="#111827" strokeWidth="3" strokeLinecap="round" />

        {/* Tronco / Corpo cilíndrico */}
        <rect x="25" y="58" width="50" height="24" rx="6" fill="#fbbf24" stroke="#111827" strokeWidth="3.5" />
        {/* Medidor central no peito */}
        <circle cx="50" cy="70" r="5" fill="#ef4444" stroke="#111827" strokeWidth="2" />

        {/* Ombros e Braços com garras */}
        <circle cx="21" cy="62" r="5" fill="#38bdf8" stroke="#111827" strokeWidth="2.5" />
        <circle cx="79" cy="62" r="5" fill="#38bdf8" stroke="#111827" strokeWidth="2.5" />
        <path d="M 18 67 L 18 80 C 18 85 24 85 24 80" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M 82 67 L 82 80 C 82 85 76 85 76 80" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

// Ilustração vetorial dos Controles / Gamepads (Modo Multiplayer)
function ControllersIcon() {
  return (
    <div className="w-24 h-24 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        {/* Controle Superior Esquerdo */}
        <g transform="translate(-4, -6) scale(0.9)">
          <rect x="20" y="24" width="60" height="34" rx="14" fill="#38bdf8" stroke="#111827" strokeWidth="4" />
          {/* D-Pad Cruz */}
          <path d="M 32 35 L 38 35 M 35 32 L 35 38" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
          {/* Botões de Ação */}
          <circle cx="62" cy="35" r="3" fill="#111827" />
          <circle cx="68" cy="41" r="3" fill="#111827" />
        </g>

        {/* Controle Inferior Direito sobreposto */}
        <g transform="translate(6, 16) scale(0.9)">
          <rect x="20" y="24" width="60" height="34" rx="14" fill="#67e8f9" stroke="#111827" strokeWidth="4" />
          {/* D-Pad Cruz */}
          <path d="M 32 35 L 38 35 M 35 32 L 35 38" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
          {/* Botões de Ação */}
          <circle cx="62" cy="35" r="3" fill="#111827" />
          <circle cx="68" cy="41" r="3" fill="#111827" />
        </g>
      </svg>
    </div>
  );
}

export default function GameMode() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card>
        {/* Título com fonte serifada e barra bipartida conforme Figma */}
        <HeaderBar title="MODOS DE JOGO" />

        {/* Seleção dos Dois Modos de Jogo */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8 my-auto py-4">
          {/* Card Vermelho: Single Player */}
          <button
            type="button"
            onClick={() => navigate('/game/singleplayer')}
            className="w-44 h-56 md:w-48 md:h-60 bg-[#ea3838] hover:bg-[#dc2626] active:scale-98 rounded-3xl p-5 flex flex-col items-center justify-between shadow-lg shadow-red-500/25 transition-all duration-200 group cursor-pointer border border-red-400/40"
          >
            <div className="flex-1 flex items-center justify-center transform group-hover:scale-108 transition-transform">
              <RobotIcon />
            </div>

            <div className="w-full">
              <div className="w-full h-[1.5px] bg-white/70 mb-3" />
              <span className="font-serif text-white font-bold tracking-wider text-xs md:text-sm uppercase block text-center">
                SINGLE PLAYER
              </span>
            </div>
          </button>

          {/* Card Azul: Multiplayer */}
          <button
            type="button"
            onClick={() => navigate('/lobby')}
            className="w-44 h-56 md:w-48 md:h-60 bg-[#00b0ff] hover:bg-[#009ee6] active:scale-98 rounded-3xl p-5 flex flex-col items-center justify-between shadow-lg shadow-sky-500/25 transition-all duration-200 group cursor-pointer border border-sky-300/40"
          >
            <div className="flex-1 flex items-center justify-center transform group-hover:scale-108 transition-transform">
              <ControllersIcon />
            </div>

            <div className="w-full">
              <div className="w-full h-[1.5px] bg-white/70 mb-3" />
              <span className="font-serif text-white font-bold tracking-wider text-xs md:text-sm uppercase block text-center">
                MULTIPLAYER
              </span>
            </div>
          </button>
        </div>

        {/* Rodapé / Espaçador mantendo equilíbrio do layout */}
        <div className="h-6" />
      </Card>
    </div>
  );
}
