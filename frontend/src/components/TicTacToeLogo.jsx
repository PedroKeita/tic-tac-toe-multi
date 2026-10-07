import React from 'react';

export default function TicTacToeLogo({ className = 'w-56 h-56' }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Container rotacionado ~15 graus no sentido horário como na imagem do Figma */}
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full transform rotate-[18deg]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Linhas da Grade do Jogo da Velha */}
        {/* Linha vertical esquerda */}
        <line
          x1="85"
          y1="25"
          x2="85"
          y2="215"
          stroke="#111827"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Linha vertical direita */}
        <line
          x1="155"
          y1="25"
          x2="155"
          y2="215"
          stroke="#111827"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Linha horizontal superior */}
        <line
          x1="25"
          y1="85"
          x2="215"
          y2="85"
          stroke="#111827"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Linha horizontal inferior */}
        <line
          x1="25"
          y1="155"
          x2="215"
          y2="155"
          stroke="#111827"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Círculo Azul (Top-Left) */}
        <circle
          cx="48"
          cy="48"
          r="16"
          stroke="#22a6fe"
          strokeWidth="6"
          fill="none"
        />

        {/* X Laranja (Top-Middle) */}
        <g stroke="#f25b2a" strokeWidth="6" strokeLinecap="round">
          <line x1="108" y1="36" x2="132" y2="60" />
          <line x1="132" y1="36" x2="108" y2="60" />
        </g>

        {/* X Laranja (Middle-Left) */}
        <g stroke="#f25b2a" strokeWidth="6" strokeLinecap="round">
          <line x1="36" y1="108" x2="60" y2="132" />
          <line x1="60" y1="108" x2="36" y2="132" />
        </g>

        {/* Círculo Azul (Center) */}
        <circle
          cx="120"
          cy="120"
          r="16"
          stroke="#22a6fe"
          strokeWidth="6"
          fill="none"
        />

        {/* X Laranja (Middle-Right) */}
        <g stroke="#f25b2a" strokeWidth="6" strokeLinecap="round">
          <line x1="180" y1="108" x2="204" y2="132" />
          <line x1="204" y1="108" x2="180" y2="132" />
        </g>

        {/* Círculo Azul (Bottom-Middle) */}
        <circle
          cx="120"
          cy="192"
          r="16"
          stroke="#22a6fe"
          strokeWidth="6"
          fill="none"
        />
      </svg>
    </div>
  );
}
