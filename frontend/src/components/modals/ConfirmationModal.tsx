import { useContext } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Удалить', 
  cancelLabel = 'Отмена' 
}: ConfirmationModalProps) => {
  const context = useContext(AppContext);
  if (!isOpen) return null;
  const isDark = context?.state.darkMode;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden relative`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full border-2 border-transparent hover:border-black"><X size={20} /></button>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg border-2 border-red-500 text-red-500"><AlertTriangle size={24} /></div>
            <h3 className="text-2xl font-black uppercase italic">{title}</h3>
          </div>
          <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} font-bold mb-8`}>{message}</p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">{confirmLabel}</button>
            <button onClick={onClose} className={`flex-1 py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${isDark ? 'bg-zinc-700' : 'bg-gray-100'}`}>{cancelLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
