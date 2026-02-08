import React from 'react';
import { FileText, Map, Moon, Settings, Sun, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onNavigate: (view: 'editor' | 'saved-plans') => void;
  currentView: 'editor' | 'saved-plans';
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDark, toggleTheme, onNavigate, currentView }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[900] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 left-0 h-full w-64 z-[950] transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r-2 flex flex-col shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-black'}`}>
        <div className="p-4 border-b-2 flex justify-between items-center bg-yellow-400 border-black">
          <span className="font-black uppercase italic text-lg text-black">Меню</span>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg transition-colors text-black">
            <X size={24} />
          </button>
        </div>
        <div className={`p-4 flex flex-col gap-2 flex-1 ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 font-bold uppercase text-xs transition-all ${isDark ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700' : 'bg-gray-50 text-black border-black hover:bg-gray-100'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>

          <button 
            onClick={() => onNavigate('editor')}
            className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 font-bold uppercase text-xs transition-all text-left ${currentView === 'editor' ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent'} ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 hover:border-black/10 text-black'}`}
          >
            <Map size={18} />
            <span>Редактор маршрута</span>
          </button>

          <button 
            onClick={() => onNavigate('saved-plans')}
            className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 font-bold uppercase text-xs transition-all text-left ${currentView === 'saved-plans' ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent'} ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 hover:border-black/10 text-black'}`}
          >
            <FileText size={18} />
            <span>Сохранённые планы</span>
          </button>
        </div>
        
        <div className={`p-4 border-t-2 ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-black/5'}`}>
             <button
               className={`w-full p-3 rounded-xl border-2 border-transparent flex items-center gap-3 font-bold uppercase text-xs transition-all text-left ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 hover:border-black/10 text-black'}`}
             >
                <Settings size={18} />
                <span>Настройки</span>
             </button>
        </div>

        <div className={`p-4 text-center opacity-30 text-[10px] font-black uppercase border-t-2 ${isDark ? 'bg-zinc-900 text-white border-white/5' : 'bg-white border-black/5'}`}>
          Pioneer Station v0.1
        </div>
      </div>
    </>
  );
};

export default Sidebar;
