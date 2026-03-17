
import React, { useState, useRef, useEffect } from 'react';
import { BodyPlacement, TattooConfig, TattooStyle, TattooOrientation } from '../types';
import { Sparkles, Wand2, Plus, Check, RectangleVertical, RectangleHorizontal, Upload, X, ImageIcon, Layers, Palette } from 'lucide-react';
import { audioService } from '../services/audioService';

interface TattooFormProps {
  onGenerate: (config: TattooConfig) => void;
  isGenerating: boolean;
  initialReferenceImages?: string[];
}

export const TattooForm: React.FC<TattooFormProps> = ({ onGenerate, isGenerating, initialReferenceImages }) => {
  const [description, setDescription] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<TattooStyle[]>([TattooStyle.Fineline]);
  const [placement, setPlacement] = useState<BodyPlacement>(BodyPlacement.AntebracoInterno);
  const [orientation, setOrientation] = useState<TattooOrientation>(TattooOrientation.Vertical);
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [includeBackground, setIncludeBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialReferenceImages && initialReferenceImages.length > 0) {
      setReferenceImages(initialReferenceImages);
    }
  }, [initialReferenceImages]);

  const handleInteraction = (action: () => void) => {
    audioService.playClick();
    action();
  };

  const toggleStyle = (style: TattooStyle) => {
    handleInteraction(() => {
      setSelectedStyles(prev => {
        if (prev.includes(style)) {
          if (prev.length === 1) return prev;
          return prev.filter(s => s !== style);
        } else {
          return [...prev, style];
        }
      });
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      audioService.playClick();
      const newImages: string[] = [];
      const fileList = Array.from(files) as File[];
      
      let processedCount = 0;
      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            newImages.push(reader.result as string);
          }
          processedCount++;
          if (processedCount === fileList.length) {
            setReferenceImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeReferenceImage = (index: number) => {
    handleInteraction(() => {
      setReferenceImages(prev => prev.filter((_, i) => i !== index));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    audioService.playClick();
    
    onGenerate({
      description,
      style: selectedStyles,
      placement,
      orientation,
      includeBackground,
      referenceImages,
      numberOfImages
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Descreva sua ideia
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={referenceImages.length > 0 ? "Como devemos combinar estas imagens? O que deve ser mantido ou alterado?" : "Ex: Uma rosa central com um relógio antigo atrás..."}
          className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none transition-all hover:border-zinc-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 uppercase tracking-wide flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-zinc-400" />
          Imagens de Referência ({referenceImages.length})
        </label>
        
        <div className="flex flex-col gap-3">
          <div 
            onClick={() => {
              audioService.playClick();
              fileInputRef.current?.click();
            }}
            className="border-2 border-dashed border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-900/50 hover:scale-[1.01] rounded-xl p-4 transition-all cursor-pointer flex items-center justify-center gap-2 text-zinc-500"
          >
            <Upload className="w-5 h-5 opacity-50" />
            <span className="text-xs uppercase tracking-wider font-medium">Adicionar Imagens</span>
          </div>

          {referenceImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 animate-fadeIn">
              {referenceImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-zinc-950 rounded-lg overflow-hidden border border-zinc-700 group hover:scale-105 transition-transform">
                  <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <button
                    type="button"
                    onClick={() => removeReferenceImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-900/80 text-white rounded-full backdrop-blur-sm transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/*" 
          multiple
          className="hidden" 
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300 uppercase tracking-wide flex justify-between">
          <span>Estilos</span>
          <span className="text-xs text-zinc-500 normal-case">{selectedStyles.length} selecionado(s)</span>
        </label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {Object.values(TattooStyle).map((s) => {
            const isSelected = selectedStyles.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStyle(s)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-1.5
                  hover:scale-105 active:scale-95
                  ${isSelected 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                    : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }
                `}
              >
                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            Local do Corpo
          </label>
          <div className="relative group">
            <select
              value={placement}
              onChange={(e) => {
                audioService.playClick();
                setPlacement(e.target.value as BodyPlacement);
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-100 appearance-none focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer transition-all hover:border-zinc-500 group-hover:scale-[1.01]"
            >
              {Object.values(BodyPlacement).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-zinc-300 transition-colors">▼</div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            Orientação
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleInteraction(() => setOrientation(TattooOrientation.Vertical))}
              className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${orientation === TattooOrientation.Vertical ? 'bg-zinc-800 border-amber-500 text-amber-200 shadow-lg' : 'bg-zinc-950 border-zinc-700 text-zinc-400'}`}
            >
              <RectangleVertical className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleInteraction(() => setOrientation(TattooOrientation.Horizontal))}
              className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${orientation === TattooOrientation.Horizontal ? 'bg-zinc-800 border-amber-500 text-amber-200 shadow-lg' : 'bg-zinc-950 border-zinc-700 text-zinc-400'}`}
            >
              <RectangleHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 uppercase tracking-wide flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Fundo
            </label>
            <button
              type="button"
              onClick={() => handleInteraction(() => setIncludeBackground(!includeBackground))}
              className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] ${includeBackground ? 'bg-zinc-800 border-amber-500 text-amber-200 shadow-md' : 'bg-zinc-950 border-zinc-700 text-zinc-400'}`}
            >
              <span className="text-sm">{includeBackground ? 'Temático' : 'Neutro'}</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${includeBackground ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${includeBackground ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Variações
          </label>
          <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => handleInteraction(() => setNumberOfImages(1))}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${numberOfImages === 1 ? 'bg-zinc-800 text-white shadow-md scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleInteraction(() => setNumberOfImages(2))}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${numberOfImages === 2 ? 'bg-zinc-800 text-white shadow-md scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              2
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating || !description.trim()}
        className={`
          group relative w-full py-4 px-6 rounded-xl font-bold text-lg uppercase tracking-wider
          flex items-center justify-center gap-3 overflow-hidden transition-all duration-300 mt-2
          hover:scale-[1.02] active:scale-[0.98]
          ${isGenerating || !description.trim()
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
            : 'bg-white text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]'
          }
        `}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></span>
            {referenceImages.length > 0 ? 'Processando...' : 'Criando...'}
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
            {referenceImages.length > 0 ? 'Gerar com Referências' : 'Gerar Tatuagem'}
          </>
        )}
      </button>
    </form>
  );
};
