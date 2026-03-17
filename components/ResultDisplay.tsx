
import React, { useState } from 'react';
import { GeneratedTattoo } from '../types';
import { Download, Maximize2, Trash2, ZoomIn, X, PenLine, Minus, Plus, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ResultDisplayProps {
  tattoos: GeneratedTattoo[];
  onClear: () => void;
  onEdit: (tattoo: GeneratedTattoo) => void;
  onDeleteTattoo?: (id: string) => void;
  title?: string;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  isGenerating?: boolean;
  error?: string | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  tattoos, 
  onClear, 
  onEdit, 
  onDeleteTattoo,
  title = "Resultados",
  emptyMessage = "Sua arte aparecerá aqui",
  emptyIcon: EmptyIcon = Maximize2,
  isGenerating = false,
  error = null
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const openZoom = (imageUrl: string) => {
    audioService.playClick();
    setZoomedImage(imageUrl);
    setZoomLevel(1);
  };

  const closeZoom = () => {
    audioService.playClick();
    setZoomedImage(null);
    setZoomLevel(1);
  };

  const adjustZoom = (delta: number) => {
    audioService.playClick();
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 4));
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold uppercase tracking-wide flex items-center gap-2">
            Criando sua arte...
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="flex flex-col gap-3">
             <div className="w-full aspect-square bg-zinc-800 rounded-xl border border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" style={{ transform: 'skewX(-20deg)' }} />
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest animate-pulse">Processando detalhes...</p>
             </div>
             <div className="h-10 bg-zinc-800 rounded-lg animate-pulse"></div>
           </div>
           
           <div className="hidden md:flex flex-col gap-3">
             <div className="w-full aspect-square bg-zinc-800 rounded-xl border border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" style={{ transform: 'skewX(-20deg)' }} />
             </div>
             <div className="h-10 bg-zinc-800 rounded-lg animate-pulse"></div>
           </div>
        </div>
      </div>
    );
  }

  if (error && tattoos.length === 0) {
    return (
      <div className="w-full h-96 md:h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-red-900/50 rounded-2xl bg-red-950/10 text-red-400 p-8 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mb-4 border border-red-900/50">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-bold text-red-200 mb-2">Erro na Geração</h4>
        <p className="text-sm text-red-300 max-w-md">{error}</p>
        <p className="text-xs text-red-400/60 mt-4 uppercase tracking-wider">Tente ajustar sua descrição</p>
      </div>
    );
  }

  if (tattoos.length === 0) {
    return (
      <div className="w-full h-96 md:h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 text-zinc-600">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
          <EmptyIcon className="w-6 h-6 opacity-50" />
        </div>
        <p className="text-sm font-medium uppercase tracking-widest">{emptyMessage}</p>
      </div>
    );
  }

  const handleDownload = (imageUrl: string, id: string) => {
    audioService.playClick();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `inkai-design-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold uppercase tracking-wide flex items-center gap-2">
          {title} <span className="text-zinc-500 text-sm font-normal">({tattoos.length})</span>
        </h3>
        <button 
            onClick={() => {
              audioService.playClick();
              onClear();
            }}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-all px-3 py-1.5 rounded-lg hover:bg-red-950/30 active:scale-95"
          >
            <Trash2 className="w-3 h-3" /> Limpar Lista
        </button>
      </div>

      <div className={`grid ${tattoos.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {tattoos.map((tattoo) => (
          <div key={tattoo.id} className="flex flex-col gap-3 group/card animate-fadeIn">
             <div 
              className="relative group w-full bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/50 aspect-square flex items-center justify-center cursor-zoom-in transition-all duration-500 hover:shadow-amber-500/10 hover:-translate-y-1"
              onClick={() => openZoom(tattoo.imageUrl)}
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
              
              <img 
                src={tattoo.imageUrl} 
                alt={tattoo.prompt} 
                className="max-w-full max-h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110"
              />

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-end gap-2 pointer-events-none">
                 {onDeleteTattoo && (
                   <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      audioService.playClick();
                      onDeleteTattoo(tattoo.id); 
                    }}
                    className="p-2 bg-red-900/80 text-white rounded-full hover:bg-red-600 transition-all shadow-lg pointer-events-auto mr-auto hover:scale-110 active:scale-90"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                 )}

                 <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    audioService.playClick();
                    onEdit(tattoo); 
                  }}
                  className="p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-all shadow-lg pointer-events-auto hover:scale-110 active:scale-90"
                  title="Editar / Usar como Referência"
                >
                  <PenLine className="w-4 h-4" />
                </button>
                 <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleDownload(tattoo.imageUrl, tattoo.id); 
                  }}
                  className="p-2 bg-white text-black rounded-full hover:bg-amber-400 transition-all shadow-lg pointer-events-auto hover:scale-110 active:scale-90"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
            
            <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 flex justify-between items-center text-xs transition-colors hover:border-zinc-700">
               <span className="text-zinc-400 truncate max-w-[50%]">{tattoo.config.style[0]}...</span>
               <div className="flex gap-2 shrink-0">
                 {tattoo.config.includeBackground && <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-amber-500 font-bold animate-pulse" title="Fundo Temático">BG</span>}
                 <span className="text-zinc-500 font-medium">{tattoo.config.placement.split('(')[0]}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn overflow-hidden"
          onClick={closeZoom}
        >
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-zinc-900/90 border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => adjustZoom(-0.25)} className="text-white hover:text-amber-400 p-1 transition-transform active:scale-75"><Minus className="w-4 h-4" /></button>
            <input 
              type="range" 
              min="0.5" 
              max="4" 
              step="0.1" 
              value={zoomLevel} 
              onChange={(e) => {
                setZoomLevel(parseFloat(e.target.value));
              }}
              className="w-32 accent-amber-500 cursor-pointer"
            />
            <button onClick={() => adjustZoom(0.25)} className="text-white hover:text-amber-400 p-1 transition-transform active:scale-75"><Plus className="w-4 h-4" /></button>
            <span className="text-xs text-zinc-400 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
          </div>

          <button 
            className="absolute top-6 right-6 z-[60] text-white hover:text-amber-400 bg-zinc-900/80 hover:bg-black p-3 rounded-full transition-all border border-zinc-700 shadow-xl cursor-pointer active:scale-90"
            onClick={(e) => {
                e.stopPropagation();
                closeZoom();
            }}
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="w-full h-full overflow-auto flex p-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
            onClick={closeZoom}
          >
            <div 
                className="relative m-auto bg-white shadow-2xl overflow-hidden shrink-0 transition-all duration-200 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

                <img 
                  src={zoomedImage} 
                  alt="Full Quality Zoom" 
                  className="block object-contain p-4 md:p-8"
                  style={{ 
                    maxHeight: `${95 * zoomLevel}vh`, 
                    maxWidth: `${95 * zoomLevel}vw`,
                    cursor: zoomLevel > 1 ? 'grab' : 'default',
                    transition: 'all 0.2s ease-out'
                  }}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
