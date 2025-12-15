import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TattooForm } from './components/TattooForm';
import { ResultDisplay } from './components/ResultDisplay';
import { GeneratedTattoo, TattooConfig } from './types';
import { generateTattooDesign } from './services/geminiService';
import { saveTattooToDB, getHistoryFromDB, deleteTattooFromDB, clearHistoryDB } from './services/storageService';
import { AlertCircle, PenTool, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [currentTattoos, setCurrentTattoos] = useState<GeneratedTattoo[]>([]);
  const [history, setHistory] = useState<GeneratedTattoo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImages, setEditingImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'gallery'>('studio');

  // Load history from IndexedDB on mount
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

  // NOTE: We removed the useEffect that syncs to localStorage because 
  // we now save explicitly to IndexedDB during the generate/delete actions.

  const handleGenerate = async (config: TattooConfig) => {
    setIsGenerating(true);
    setError(null);
    setCurrentTattoos([]); // Clear previous results on new generation
    setActiveTab('studio'); // Switch to studio view to see results

    try {
      const imageUrls = await generateTattooDesign(config);
      
      const newTattoos: GeneratedTattoo[] = imageUrls.map(url => ({
        id: crypto.randomUUID(),
        imageUrl: url,
        prompt: config.description,
        config,
        timestamp: Date.now()
      }));

      // Update UI state
      setCurrentTattoos(newTattoos);
      setHistory(prev => [...newTattoos, ...prev]);

      // Save to IndexedDB
      // We use Promise.all to save all generated images concurrently
      await Promise.all(newTattoos.map(tattoo => saveTattooToDB(tattoo)));

      // Clear editing images after successful generation
      setEditingImages([]); 
    } catch (err: any) {
      // Use the error message from the service if available
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
    setEditingImages([tattoo.imageUrl]);
    setActiveTab('studio');
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
        
        {/* Intro Text */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent mb-4">
            Transforme Ideias em Tinta
          </h2>
          <p className="text-zinc-400 text-lg">
            Crie designs exclusivos com IA avançada.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'studio' 
                  ? 'bg-zinc-800 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Studio (Gerador)
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'gallery' 
                  ? 'bg-zinc-800 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Galeria 
              <span className="bg-zinc-950 px-2 py-0.5 rounded-full text-xs text-zinc-500 ml-1 border border-zinc-800">
                {history.length}
              </span>
            </button>
          </div>
        </div>

        {/* STUDIO TAB CONTENT */}
        {activeTab === 'studio' && (
          <div className="flex flex-col lg:flex-row gap-12 items-start justify-center max-w-7xl mx-auto animate-fadeIn">
            {/* Left Column: Form */}
            <div className="w-full lg:w-4/12">
              <TattooForm 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating} 
                initialReferenceImages={editingImages}
              />
              
              {/* Note: Error is now also handled in ResultDisplay for better visibility, 
                  but we can keep it here as well or remove it. 
                  Keeping it small here for mobile users who might be at the top. */}
              {error && (
                <div className="mt-4 p-4 bg-red-950/30 border border-red-900/50 text-red-200 rounded-xl flex items-start gap-3 lg:hidden">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <div className="mt-8 p-6 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800">
                  <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Dicas para melhores resultados</h4>
                  <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-4">
                      <li>Seja específico sobre os elementos principais.</li>
                      <li>Faça upload de várias imagens para criar composições únicas.</li>
                      <li>Experimente o "Fundo Temático" para ver como a arte interage com o ambiente.</li>
                  </ul>
              </div>
            </div>

            {/* Right Column: Result */}
            <div className="w-full lg:w-8/12 sticky top-8">
              <ResultDisplay 
                tattoos={currentTattoos} 
                onClear={handleClearCurrent} 
                onEdit={handleEdit}
                title="Sessão Atual"
                emptyMessage="Sua arte aparecerá aqui após a geração"
                isGenerating={isGenerating}
                error={error}
              />
            </div>
          </div>
        )}

        {/* GALLERY TAB CONTENT */}
        {activeTab === 'gallery' && (
          <div className="max-w-7xl mx-auto animate-fadeIn">
            <ResultDisplay 
              tattoos={history}
              onClear={handleClearHistory}
              onEdit={handleEdit}
              onDeleteTattoo={handleDeleteFromHistory}
              title="Minha Galeria"
              emptyMessage="Sua galeria está vazia. Crie algo no Studio!"
              emptyIcon={LayoutGrid}
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;