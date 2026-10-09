import React from 'react';

/**
 * Card de Espera para o Modo Multiplayer (Fiel ao Figma)
 * Exibe o ponto de interrogação '?' e os três pontinhos '...' indicando busca por oponente
 */
export default function WaitingPlayerCard({ message = '...' }) {
  return (
    <div className="w-32 sm:w-36 h-52 sm:h-56 p-4 rounded-2xl flex flex-col items-center justify-between select-none bg-[#0088cc] border-2 border-transparent shadow-md shrink-0 transition-all duration-300">
      {/* Ícone de Ponto de Interrogação (?) no lugar do avatar */}
      <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center border-2 border-white/40 shadow-inner">
        <span className="font-serif text-white text-3xl font-bold tracking-tight drop-shadow-sm animate-pulse">
          ?
        </span>
      </div>

      {/* Linha Divisória e Indicador de Espera */}
      <div className="w-full text-center flex flex-col items-center justify-center">
        <div className="w-12 h-[1.5px] bg-white/70 mb-2" />
        <p className="text-white text-sm font-bold tracking-widest animate-pulse">
          {message}
        </p>
      </div>

      {/* Espaçador / Placeholder para manter alinhamento 100% simétrico com PlayerGameCard */}
      <div className="h-9 flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-white/40 animate-ping" />
      </div>
    </div>
  );
}
