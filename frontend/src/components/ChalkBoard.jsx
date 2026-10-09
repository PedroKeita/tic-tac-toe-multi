import React from 'react';
import GameResultOverlay from './GameResultOverlay';

export default function ChalkBoard({
  board = Array(9).fill(null),
  onCellClick,
  disabled = false,
  isGameOver = false,
  gameResult = null, // 'win' | 'draw' | 'defeat'
  onPlayAgain,
  onExit,
}) {
  return (
    <div className="relative select-none flex flex-col items-center">
      {/* Moldura de Madeira do Quadro de Giz */}
      <div
        className="relative rounded-lg p-3 md:p-4 shadow-[0_15px_35px_rgba(0,0,0,0.35)] transition-all"
        style={{
          background: 'linear-gradient(135deg, #a7693d 0%, #874e27 50%, #6d3a19 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.6), 0 12px 28px rgba(0,0,0,0.4)',
        }}
      >
        {/* Borda interna chanfrada (madeira escura) */}
        <div
          className="rounded p-1.5 md:p-2"
          style={{
            background: 'linear-gradient(to bottom, #542c13, #723c1a)',
            boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.7)',
          }}
        >
          {/* Superfície da Lousa / Quadro de Giz */}
          <div
            className="w-[320px] h-[260px] sm:w-[390px] sm:h-[300px] md:w-[470px] md:h-[340px] rounded relative overflow-hidden flex items-center justify-center"
            style={{
              backgroundColor: '#1b2c21',
              backgroundImage: 'radial-gradient(circle at 50% 45%, #253d2f 0%, #17271e 80%)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.85)',
            }}
          >
            {/* Se o jogo terminou, exibe o Overlay de Resultado */}
            {isGameOver && gameResult ? (
              <GameResultOverlay
                status={gameResult}
                onPlayAgain={onPlayAgain}
                onExit={onExit}
              />
            ) : (
              /* Container rigorosamente QUADRADO para alinhar 1:1 o Grid de botões com as Linhas de Giz */
              <div className="relative w-[210px] h-[210px] sm:w-[250px] sm:h-[250px] md:w-[285px] md:h-[285px] aspect-square flex items-center justify-center">
                {/* Linhas da Grade de Giz perfeitamente coincidentes em 1/3 (100px) e 2/3 (200px) */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 300 300"
                  fill="none"
                >
                  {/* Linhas Verticais de Giz */}
                  <line
                    x1="100"
                    y1="10"
                    x2="100"
                    y2="290"
                    stroke="#f1f5f9"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                  />
                  <line
                    x1="200"
                    y1="10"
                    x2="200"
                    y2="290"
                    stroke="#f1f5f9"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                  />
                  {/* Linhas Horizontais de Giz */}
                  <line
                    x1="10"
                    y1="100"
                    x2="290"
                    y2="100"
                    stroke="#f1f5f9"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                  />
                  <line
                    x1="10"
                    y1="200"
                    x2="290"
                    y2="200"
                    stroke="#f1f5f9"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                  />
                </svg>

                {/* Grade 3x3 de Botões/Células rigorosamente mapeada sobre o mesmo quadrado */}
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full relative z-10">
                  {board.map((cell, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={disabled || cell !== null}
                      onClick={() => onCellClick(index)}
                      className={`w-full h-full flex items-center justify-center transition-colors rounded-lg group ${
                        !disabled && cell === null
                          ? 'hover:bg-white/5 cursor-pointer active:scale-95'
                          : 'cursor-default'
                      }`}
                    >
                      {/* Símbolo O (Azul) centralizado dentro do quadrante */}
                      {cell === 'O' && (
                        <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full border-[5px] sm:border-[6px] border-[#22a6fe] shadow-[0_0_12px_rgba(34,166,254,0.7)] animate-scaleUp" />
                      )}

                      {/* Símbolo X (Laranja) centralizado dentro do quadrante */}
                      {cell === 'X' && (
                        <div className="relative w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 flex items-center justify-center animate-scaleUp">
                          <span className="absolute w-11 sm:w-13 md:w-15 h-1.5 sm:h-2 bg-[#f25b2a] rotate-45 rounded-full shadow-[0_0_12px_rgba(242,91,42,0.7)]" />
                          <span className="absolute w-11 sm:w-13 md:w-15 h-1.5 sm:h-2 bg-[#f25b2a] -rotate-45 rounded-full shadow-[0_0_12px_rgba(242,91,42,0.7)]" />
                        </div>
                      )}

                      {/* Ghost preview suave ao passar o mouse */}
                      {!disabled && cell === null && (
                        <div className="opacity-0 group-hover:opacity-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full border-4 border-[#22a6fe] transition-opacity" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Peças de Giz na Base Direita do Quadro (Fiel ao layout do Figma) */}
        <div className="absolute -bottom-1 right-6 flex items-end gap-1.5 z-20 pointer-events-none">
          {/* Giz 1 horizontal */}
          <div
            className="w-7 h-2 bg-[#f8fafc] rounded-sm shadow-md"
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          />
          {/* Giz 2 inclinado */}
          <div
            className="w-7 h-2 bg-[#e2e8f0] rounded-sm shadow-md transform rotate-[-12deg]"
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
