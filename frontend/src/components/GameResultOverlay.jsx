import React from 'react';
import { PlayerAvatar } from './PlayerGameCard';

// Ícone do Troféu com Estrelas para Vitória
function TrophyBadge() {
  return (
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#1e293b] border-2 border-amber-400/50 flex items-center justify-center relative shadow-lg">
      <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-20 md:h-20" fill="none">
        {/* Fundo estrelado */}
        <polygon points="50,12 52,18 58,18 53,22 55,28 50,24 45,28 47,22 42,18 48,18" fill="#fde047" />
        <polygon points="26,38 27,42 31,42 28,44 29,48 26,45 23,48 24,44 21,42 25,42" fill="#fde047" />
        <polygon points="74,38 75,42 79,42 76,44 77,48 74,45 71,48 72,44 69,42 73,42" fill="#fde047" />
        
        {/* Taça do Troféu */}
        <path d="M 30 26 L 70 26 C 70 48 58 56 50 56 C 42 56 30 48 30 26 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
        {/* Alças */}
        <path d="M 30 32 C 18 32 18 46 30 46" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 70 32 C 82 32 82 46 70 46" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Haste e Base */}
        <rect x="46" y="56" width="8" height="12" fill="#d97706" />
        <rect x="36" y="68" width="28" height="8" rx="2" fill="#b45309" />
        <rect x="32" y="76" width="36" height="5" rx="1.5" fill="#78350f" />
        {/* Estrela central na taça */}
        <polygon points="50,33 52,38 57,38 53,41 55,46 50,43 45,46 47,41 43,38 48,38" fill="#fef08a" />
      </svg>
    </div>
  );
}

// Ícone de Aperto de Mão (DRAW) para Empate
function DrawBadge() {
  return (
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#3b82f6] border-2 border-blue-300 flex flex-col items-center justify-center relative shadow-lg">
      {/* Plaquinha DRAW */}
      <div className="bg-[#fbbf24] border border-[#d97706] px-2 py-0.5 rounded-sm shadow-sm -mt-2 mb-1">
        <span className="text-[9px] font-black text-neutral-900 tracking-wider">DRAW</span>
      </div>
      {/* Mãos dadas vetoriais */}
      <svg viewBox="0 0 100 60" className="w-14 h-10" fill="none">
        {/* Mão esquerda */}
        <path d="M 10 30 L 32 18 C 36 24 40 28 48 30 L 40 44 L 20 44 Z" fill="#fda4af" stroke="#be123c" strokeWidth="1.5" />
        {/* Mão direita */}
        <path d="M 90 30 L 68 18 C 64 24 60 28 52 30 L 60 44 L 80 44 Z" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
        {/* Dedos entrelaçados */}
        <path d="M 44 26 C 48 26 52 30 52 36 M 46 32 C 50 32 54 36 54 40" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
        {/* Punhos */}
        <rect x="6" y="24" width="8" height="22" rx="2" fill="#38bdf8" />
        <rect x="86" y="24" width="8" height="22" rx="2" fill="#f97316" />
      </svg>
    </div>
  );
}

// Ícone Triste para Derrota
function SadFaceBadge() {
  return (
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#ef4444] to-[#dc2626] border-2 border-red-300 flex items-center justify-center relative shadow-lg">
      <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-20 md:h-20" fill="none">
        {/* Sobrancelhas caídas */}
        <path d="M 28 36 L 40 44" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M 72 36 L 60 44" stroke="white" strokeWidth="4" strokeLinecap="round" />
        {/* Olhos tristes */}
        <circle cx="34" cy="50" r="5" fill="white" />
        <circle cx="66" cy="50" r="5" fill="white" />
        {/* Boca curvada para baixo (triste) */}
        <path d="M 30 76 C 35 62 65 62 70 76" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

export default function GameResultOverlay({
  status = 'win', // 'win', 'draw', 'defeat'
  onPlayAgain,
  onExit,
}) {
  return (
    <div className="w-full h-full flex flex-row items-center justify-around px-4 py-6 md:px-8 select-none animate-fadeIn">
      {/* COLUNA ESQUERDA: Mensagem e Ilustração */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 max-w-[220px]">
        {status === 'win' && (
          <>
            <div className="flex flex-col items-center">
              <PlayerAvatar className="w-12 h-12 mb-1" />
              <div className="w-14 h-[1.5px] bg-white/70 mb-2" />
            </div>
            <div className="font-pixel text-[#00e5ff] text-[11px] sm:text-xs leading-relaxed tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Você ganhou<br />Parabéns!!!
            </div>
            <TrophyBadge />
          </>
        )}

        {status === 'draw' && (
          <>
            <div className="font-pixel text-[#facc15] text-[11px] sm:text-xs leading-relaxed tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Opppps!<br />Temos um<br />empate.
            </div>
            <DrawBadge />
          </>
        )}

        {status === 'defeat' && (
          <>
            <div className="font-pixel text-[#ff4d2e] text-[11px] sm:text-xs leading-relaxed tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Viiiiiix!<br />Você perdeu.
            </div>
            <SadFaceBadge />
          </>
        )}
      </div>

      {/* COLUNA DIREITA: Botões de Ação com Símbolos O e X */}
      <div className="flex flex-col items-start justify-center space-y-5">
        {/* Botão Jogar Novamente + Símbolo O */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayAgain}
            className="bg-[#22a6fe] hover:bg-[#1294ea] active:scale-95 text-white font-medium text-xs sm:text-sm py-2 px-4 sm:px-5 rounded-xl shadow-[0_4px_12px_rgba(34,166,254,0.4)] transition-all cursor-pointer whitespace-nowrap"
          >
            Jogar novamente
          </button>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-4 border-[#22a6fe] shadow-[0_0_8px_rgba(34,166,254,0.6)]" />
        </div>

        {/* Botão Sair + Símbolo X */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="bg-[#f25b2a] hover:bg-[#e04a19] active:scale-95 text-white font-medium text-xs sm:text-sm py-2 px-6 sm:px-7 rounded-xl shadow-[0_4px_12px_rgba(242,91,42,0.4)] transition-all cursor-pointer whitespace-nowrap"
          >
            Sair
          </button>
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
            <span className="absolute w-7 sm:w-8 h-1 bg-[#f25b2a] rotate-45 rounded-full shadow-[0_0_8px_rgba(242,91,42,0.6)]" />
            <span className="absolute w-7 sm:w-8 h-1 bg-[#f25b2a] -rotate-45 rounded-full shadow-[0_0_8px_rgba(242,91,42,0.6)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
