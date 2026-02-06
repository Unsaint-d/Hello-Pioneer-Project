import { AlertTriangle } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  title: string;
  message: string;
  isDark: boolean;
}

const WarningModal = ({ isOpen, onConfirm, title, message, isDark }: WarningModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden relative`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg border-2 border-red-500 text-red-500"><AlertTriangle size={24} /></div>
            <h3 className="text-2xl font-black uppercase italic">{title}</h3>
          </div>
          <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} font-bold mb-8`}>{message}</p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">Ок</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;
