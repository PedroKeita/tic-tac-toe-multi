import React from 'react';
import ChalkBoard from './ChalkBoard';

export default function RoomListBoard({
  rooms = [],
  onJoinRoom,
  isLoading = false,
}) {
  return (
    <ChalkBoard>
      <div className="w-full h-full p-6 md:p-8 flex flex-col justify-start overflow-y-auto custom-scrollbar select-none">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-2">
            <span className="w-6 h-6 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            <p className="font-serif text-white/80 text-xs tracking-wider">
              Buscando salas disponíveis...
            </p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <p className="font-serif text-neutral-300 text-sm tracking-wide mb-1">
              Nenhuma sala disponível no momento.
            </p>
            <p className="text-white/50 text-xs">
              Crie uma sala para convidar um amigo!
            </p>
          </div>
        ) : (
          <div className="w-full space-y-3.5 my-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="w-full flex items-center justify-between py-2 px-3 sm:px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                {/* Nome do Host no estilo giz / azul ciano conforme o Figma */}
                <span className="font-serif text-[#38bdf8] text-sm sm:text-base font-semibold tracking-wide drop-shadow-sm">
                  {room.hostName || room.name}
                </span>

                {/* Botão de Ação: Entrar ou Lotada */}
                {room.isFull ? (
                  <span className="bg-[#f25b2a] text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                    Lotada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onJoinRoom(room.id, room.hostName)}
                    className="bg-[#22a6fe] hover:bg-[#1395ea] active:scale-95 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-[0_2px_8px_rgba(34,166,254,0.4)] transition-all cursor-pointer"
                  >
                    Entrar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ChalkBoard>
  );
}
