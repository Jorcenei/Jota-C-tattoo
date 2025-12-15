import React from 'react';
import { PenTool } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-800 py-6 px-4 md:px-8 flex items-center justify-center md:justify-start">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <PenTool className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase">InkAI</h1>
          <p className="text-xs text-zinc-400 tracking-widest uppercase">Estúdio de Tatuagem Digital</p>
        </div>
      </div>
    </header>
  );
};
