
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TattooForm } from './components/TattooForm';
import { ResultDisplay } from './components/ResultDisplay';
import { GeneratedTattoo, TattooConfig } from './types';
import { generateTattooDesign } from './services/geminiService';
import { saveTattooToDB, getHistoryFromDB, deleteTattooFromDB, clearHistoryDB } from './services/storageService';
import { audioService } from './services/audioService';
import { AlertCircle, PenTool, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [currentTattoos, setCurrentTattoos] = useState<GeneratedTattoo[]>([]);
  const [history, setHistory] = useState<GeneratedTattoo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImages, setEditingImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'gallery'>('studio');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await getHistoryFromDB();
        setHistory(savedHistory);
      } catch (e) {
        console.error("Failed to load history from DB", e);
      }
    };
    loadHistory();
  }, []);

  const handleTabChange = (tab: 'studio' | 'gallery') => {
    audioService.playClick();
    setActiveTab(tab);
  };

  const handleGenerate = async (config: TattooConfig) => {
    setIsGenerating(true);
    setError(null);
    setCurrentTattoos([]);
    setActiveTab('studio');

    try {
      const imageUrls = await generateTattooDesign(config);
      
      const newTattoos: GeneratedTattoo[] = imageUrls.map(url => ({
        id: crypto.randomUUID(),
        imageUrl: url,
        prompt: config.description,
        config,
        timestamp: Date.now()
      }));

      setCurrentTattoos(newTattoos);
      setHistory(prev => [...newTattoos, ...prev]);

      await Promise.all(newTattoos.map(tattoo => saveTattooToDB(tattoo)));
      setEditingImages([]); 
    } catch (err: any) {
      setError(err.message || "Não foi possível gerar a arte. Tente reformular.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearCurrent = () => {
    setCurrentTattoos([]);
    setError(null);
    setEditingImages([]);
  };

  const handleClearHistory = async () => {
    if (window.confirm("Tem certeza que deseja apagar toda a sua galeria? Esta ação não pode ser desfeita.")) {
      try {
        audioService.playClick();
        await clearHistoryDB();
        setHistory([]);
      } catch (e) {
        console.error("Failed to clear DB", e);
        alert("Erro ao limpar galeria.");
      }
    }
  };

  const handleDeleteFromHistory = async (id: string) => {
    try {
      await deleteTattooFromDB(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error("Failed to delete item", e);
    }
  };

  const handleEdit = (tattoo: GeneratedTattoo) => {
    audioService.playClick();
    setEditingImages([tattoo.imageUrl]);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
        
        <div className="text-center max-w-2xl mx-auto mb-8 animate-fadeIn">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent mb-4 tracking-tight">
            Transforme Ideias em Tinta
          </h2>
          <p className="text-zinc-400 text-lg font-light">
            Crie designs exclusivos com IA avançada.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="flex p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-md shadow-xl">
            <button
              onClick={() => handleTabChange('studio')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                activeTab === 'studio' 
                  ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Studio
            </button>
            <button
              onClick={() => handleTabChange('gallery')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                activeTab === 'gallery' 
                  ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Galeria 
              <span className={`px-2 py-0.5 rounded-full text-[10px] ml-1 border transition-colors ${activeTab === 'gallery' ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}>
                {history.length}
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'studio' && (
          <div className="flex flex-col lg:flex-row gap-12 items-start justify-center max-w-7xl mx-auto animate-fadeIn">
            <div className="w-full lg:w-4/12">
              <TattooForm 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
                initialReferenceImages={editingImages}
              />
              
              {error && (
                <div className="mt-4 p-4 bg-red-950/30 border border-red-900/50 text-red-200 rounded-xl flex items-start gap-3 lg:hidden animate-fadeIn">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <div className="mt-8 p-6 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 group hover:border-zinc-600 transition-colors">
                  <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 group-hover:text-zinc-400 transition-colors">Dicas de Mestre</h4>
                  <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-4 font-light">
                      <li>Seja específico sobre os elementos e fluxo da arte.</li>
                      <li>Use imagens de referência para guiar a composição.</li>
                      <li>O modo "Papel/Impressão" é ideal para criar o decalque.</li>
                  </ul>
              </div>
            </div>

            <div className="w-full lg:w-8/12 sticky top-8">
              <ResultDisplay 
                tattoos={currentTattoos} 
                onClear={handleClearCurrent} 
                onEdit={handleEdit}
                title="Sessão Atual"
                emptyMessage="Sua arte aparecerá aqui"
                isGenerating={isGenerating}
                error={error}
              />
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="max-w-7xl mx-auto animate-fadeIn">
            <ResultDisplay 
              tattoos={history}
              onClear={handleClearHistory}
              onEdit={handleEdit}
              onDeleteTattoo={handleDeleteFromHistory}
              title="Galeria Pessoal"
              emptyMessage="Sua galeria está limpa. Hora de criar!"
              emptyIcon={LayoutGrid}
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
