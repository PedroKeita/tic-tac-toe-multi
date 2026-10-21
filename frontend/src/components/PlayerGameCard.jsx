import React from 'react';

/**
 * Avatares vetoriais fiéis aos personagens do Figma
 */
export function PlayerAvatar({ className = 'w-16 h-16' }) {
  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm ring-2 ring-white/80 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        {/* Corpo roxo do monstrinho */}
        <rect x="20" y="32" width="60" height="52" rx="18" fill="#8b5cf6" />
        {/* Crista / espinhos amarelos */}
        <path d="M 26 34 L 32 16 L 40 32 L 50 12 L 60 32 L 68 16 L 74 34 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
        {/* Olhos brancos */}
        <circle cx="38" cy="46" r="8" fill="white" />
        <circle cx="62" cy="46" r="8" fill="white" />
        {/* Pupilas pretas com brilho */}
        <circle cx="39" cy="46" r="4" fill="#111827" />
        <circle cx="63" cy="46" r="4" fill="#111827" />
        <circle cx="41" cy="44" r="1.5" fill="white" />
        <circle cx="65" cy="44" r="1.5" fill="white" />
        {/* Boca com dentes */}
        <rect x="34" y="60" width="32" height="14" rx="7" fill="#dc2626" />
        <path d="M 38 60 L 42 66 L 46 60 M 54 60 L 58 66 L 62 60" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bochechas coradas */}
        <circle cx="26" cy="56" r="4" fill="#ec4899" opacity="0.6" />
        <circle cx="74" cy="56" r="4" fill="#ec4899" opacity="0.6" />
      </svg>
    </div>
  );
}

export function BotAvatar({ className = 'w-16 h-16' }) {
  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center bg-[#fde047] shadow-sm ring-2 ring-white/80 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
        <circle cx="50" cy="50" r="48" fill="#f59e0b" />
        <ellipse cx="50" cy="65" rx="36" ry="32" fill="#ea580c" />
        <circle cx="34" cy="62" r="3" fill="#c2410c" />
        <circle cx="64" cy="68" r="4" fill="#c2410c" />
        <circle cx="38" cy="38" r="11" fill="white" stroke="#c2410c" strokeWidth="2" />
        <circle cx="62" cy="38" r="11" fill="white" stroke="#c2410c" strokeWidth="2" />
        <circle cx="39" cy="38" r="5" fill="#111827" />
        <circle cx="63" cy="38" r="5" fill="#111827" />
        <circle cx="41" cy="36" r="1.5" fill="white" />
        <circle cx="65" cy="36" r="1.5" fill="white" />
        <rect x="34" y="66" width="32" height="16" rx="4" fill="#450a0a" />
        <path d="M 37 66 L 41 73 L 45 66 M 47 66 L 51 73 L 55 66 M 57 66 L 61 73 L 65 66" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function PlayerGameCard({
  type = 'player', // 'player' ou 'bot'
  name = 'You',
  symbol = 'O',   // 'O' ou 'X'
  isTurn = false,
  isThinking = false,
}) {
  const isPlayer = type === 'player';

  return (
    <div
      className={`w-32 sm:w-36 h-52 sm:h-56 p-4 rounded-2xl flex flex-col items-center justify-between select-none transition-all duration-200 border-2 shrink-0 ${
        isPlayer ? 'bg-[#0d122b]' : 'bg-[#0088cc]'
      } ${
        isTurn
          ? isPlayer
            ? 'border-[#22a6fe] shadow-[0_0_18px_rgba(34,166,254,0.6)]'
            : 'border-[#f25b2a] shadow-[0_0_18px_rgba(242,91,42,0.6)]'
          : 'border-transparent shadow-md opacity-90'
      }`}
    >
      {/* Avatar com Badge de Turno */}
      <div className="relative">
        {isPlayer ? <PlayerAvatar className="w-16 h-16" /> : <BotAvatar className="w-16 h-16" />}
        {isTurn && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlayer ? 'bg-[#22a6fe]' : 'bg-[#f25b2a]'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                isPlayer ? 'bg-[#22a6fe]' : 'bg-[#f25b2a]'
              }`}
            />
          </span>
        )}
      </div>

      {/* Nome e Linha Divisória */}
      <div className="w-full text-center flex flex-col items-center justify-center">
        <p className="text-white text-sm font-semibold tracking-wide">
          {name}
        </p>
        <div className="w-12 h-[1px] bg-white/70 mt-1 mb-0.5" />
        {isThinking ? (
          <span className="text-[10px] text-amber-200 animate-pulse font-medium">
            Pensando...
          </span>
        ) : (
          <span className="h-3.5" />
        )}
      </div>

      {/* Símbolo Atribuído (O ou X) perfeitamente alinhado */}
      <div className="h-9 flex items-center justify-center">
        {symbol === 'O' ? (
          <div className="w-8 h-8 rounded-full border-4 border-[#22a6fe] shadow-[0_0_10px_rgba(34,166,254,0.6)]" />
        ) : (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <span className="absolute w-8 h-1 bg-[#f25b2a] rotate-45 rounded-full shadow-[0_0_8px_rgba(242,91,42,0.6)]" />
            <span className="absolute w-8 h-1 bg-[#f25b2a] -rotate-45 rounded-full shadow-[0_0_8px_rgba(242,91,42,0.6)]" />
          </div>
        )}
      </div>
    </div>
  );
}
