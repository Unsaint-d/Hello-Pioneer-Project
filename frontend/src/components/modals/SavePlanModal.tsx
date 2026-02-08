import { useContext, useState } from 'react';
import { Download, X } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

interface SavePlanModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
  pointsCount: number;
  distance: number;
}

const SavePlanModal = ({ onClose, onSave, defaultName, pointsCount, distance }: SavePlanModalProps) => {
  const context = useContext(AppContext);
  const [name, setName] = useState(defaultName);

  const isDark = context?.state.darkMode;
  const summaryColor = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-black';

  const handleSave = () => {
    onSave(name.trim() || defaultName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden relative`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full border-2 border-transparent hover:border-black"><X size={20} /></button>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg border-2 border-blue-500 text-blue-500"><Download size={24} /></div>
            <h3 className="text-2xl font-black uppercase italic">Сохранить план</h3>
          </div>
          <div className="mb-4">
            <label className="text-[10px] font-black uppercase opacity-50">Название</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
              className={`mt-2 w-full border-2 rounded-xl px-3 py-2 font-bold text-sm outline-none focus:border-yellow-500 transition-colors ${inputBg}`}
            />
          </div>
          <div className={`text-[10px] font-bold ${summaryColor} mb-6`}>
            <div>Количество точек: {pointsCount} | Длина маршрута: {distance.toFixed(2)} м</div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 bg-blue-500 text-white py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">Сохранить</button>
            <button onClick={onClose} className={`flex-1 py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${isDark ? 'bg-zinc-700' : 'bg-gray-100'}`}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavePlanModal;
