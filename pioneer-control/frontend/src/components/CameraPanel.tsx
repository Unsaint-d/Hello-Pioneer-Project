import React, { useContext, useState, useEffect } from 'react';
import { Camera, CameraOff, RefreshCw, Settings, X, ChevronLeft } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function CameraPanel() {
  const context = useContext(AppContext);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeView, setActiveView] = useState<'video' | 'settings'>('video');
  
  const streamUrl = `http://localhost:8000/camera/stream?t=${refreshKey}`;

  if (!context) return null;
  const { state } = context;
  const isDark = state.darkMode;

  const handleRetry = () => {
    setError(false);
    setRefreshKey(prev => prev + 1);
  };

  const toggleSettings = () => {
    if (activeView === 'video') {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveView('settings');
        setIsSettingsOpen(true);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 100);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveView('video');
        setIsSettingsOpen(false);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 100);
    }
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-black'} rounded-[18px] border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-colors`}>
      {/* Header */}
      <div className={`p-4 border-b-2 border-black flex items-center justify-between shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSettings}
            className={`w-9 h-9 flex items-center justify-center border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all ${isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-700' : 'bg-white text-zinc-600 hover:text-black hover:bg-zinc-50'}`}
            title={isSettingsOpen ? "Назад к камере" : "Настройки камеры"}
          >
            {isSettingsOpen ? <ChevronLeft size={20} /> : <Settings size={20} />}
          </button>
          <h2 className={`font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
            <i><b>Камера дрона</b></i>
          </h2>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className={`flex-1 relative overflow-hidden ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
        {/* Content Wrapper for Fade Transition */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-100 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          
          {activeView === 'video' ? (
            /* Video View */
            <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
               {/* 4:3 Aspect Ratio Container that fits within the available space */}
               <div className="relative w-full h-full max-w-full max-h-full aspect-[4/3] mx-auto">
                {!error ? (
                  <img 
                    src={streamUrl} 
                    alt="Drone Camera Feed" 
                    className="w-full h-full object-contain"
                    onError={() => setError(true)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white flex flex-col items-center gap-2 opacity-50">
                      <CameraOff size={48} />
                      <span className="font-bold">Нет сигнала</span>
                      <button 
                        onClick={handleRetry}
                        className={`mt-4 px-4 py-2 ${isDark ? 'bg-zinc-800 border-zinc-600 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-black hover:bg-zinc-100'} border font-bold rounded flex items-center gap-2 transition-colors`}
                      >
                        <RefreshCw size={16} />
                        Повторить
                      </button>
                    </div>
                  </div>
                )}
               </div>
            </div>
          ) : (
            /* Settings View */
            <div className="w-full h-full p-6 overflow-y-auto">
              <div className={`w-full h-full border-2 border-dashed ${isDark ? 'border-zinc-800' : 'border-zinc-300'} rounded-xl flex items-center justify-center flex-col gap-4`}>
                <Settings size={48} className={isDark ? 'text-zinc-800' : 'text-zinc-300'} />
                <span className="text-zinc-400 font-bold text-sm uppercase tracking-wider">Настройки камеры</span>
                <p className="text-zinc-500 text-xs text-center max-w-xs">
                  Здесь будут располагаться параметры разрешения, частоты кадров и настройки экспозиции.
                </p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
