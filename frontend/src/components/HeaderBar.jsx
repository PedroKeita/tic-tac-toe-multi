import React from 'react';

export default function HeaderBar({ title }) {
  return (
    <div className="flex flex-col items-center w-full mb-10">
      <h1 className="text-4xl md:text-5xl font-serif tracking-wide text-neutral-900 mb-6 font-normal">
        {title}
      </h1>
      
      {/* Barra decorativa bipartida: metade azul, metade laranja */}
      <div className="w-full max-w-xl h-2 flex items-center rounded-full overflow-hidden shadow-sm">
        <div className="w-1/2 h-full bg-[#22a6fe]" />
        <div className="w-1/2 h-full bg-[#f25b2a]" />
      </div>
    </div>
  );
}
