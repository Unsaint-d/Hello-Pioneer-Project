import { useState } from 'react';
import { Wifi } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
  isDark: boolean;
}

const ConnectModal = ({ isOpen, onConfirm, onCancel, isDark }: ConnectModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden relative`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg border-2 border-green-500 text-green-500"><Wifi size={24} /></div>
            <h3 className="text-2xl font-black uppercase italic">Дрон обнаружен</h3>
          </div>
          <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} font-bold mb-8`}>
            Обнаружен дрон Pioneer (192.168.4.1).<br/>
            Выполнить подключение?
          </p>
          <div className="flex gap-3">
            <button onClick={() => onConfirm(dontShowAgain)} className="flex-1 bg-green-500 text-white py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none hover:opacity-90 transition-opacity">Да</button>
            <button onClick={onCancel} className={`flex-1 py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'} hover:opacity-90 transition-opacity`}>Нет</button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 cursor-pointer group" onClick={() => setDontShowAgain(!dontShowAgain)}>
             <div className={`w-10 h-6 rounded-full p-1 transition-colors border-2 border-transparent ${dontShowAgain ? 'bg-green-500' : (isDark ? 'bg-zinc-700' : 'bg-gray-300')}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${dontShowAgain ? 'translate-x-4' : 'translate-x-0'}`} />
             </div>
             <span className={`text-[10px] font-bold uppercase tracking-wider opacity-50 group-hover:opacity-100 transition-opacity ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
               Больше не показывать
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
