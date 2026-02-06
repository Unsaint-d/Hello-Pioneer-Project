import { useContext, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, X } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

interface MissionStartModalProps {
  onClose: () => void;
  onConfirm: () => void;
  hasInvalidHeights: boolean;
}

const MissionStartModal = ({ onClose, onConfirm, hasInvalidHeights }: MissionStartModalProps) => {
  const context = useContext(AppContext);
  const [armButtonText, setArmButtonText] = useState('Отправить команду ARM');
  const [isArmButtonDisabled] = useState(false);
  const [isArmSure, setIsArmSure] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [optimisticArmed, setOptimisticArmed] = useState(false);

  if (!context) return null;
  const { state, arm, disarm, toggleAutoArm } = context;
  const isDark = state.darkMode;
  const isArmed = state.autopilotState?.toUpperCase() === 'ARMED';
  const showAsArmed = isArmed || optimisticArmed;
  const isStartEnabled = !hasInvalidHeights && (state.autoArmOnMissionStart || state.autopilotState?.toUpperCase() === 'PREFLIGHT' || state.autopilotState?.toUpperCase() === 'ARMED');

  const handleArmClick = () => {
    if (showAsArmed) {
      disarm();
      setOptimisticArmed(false);
      return;
    }

    if (!isArmSure) {
      setArmButtonText('Вы уверены?');
      setIsArmSure(true);
    } else {
      arm();
      setOptimisticArmed(true);
      setArmButtonText('Отправить команду ARM');
      setIsArmSure(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-md items-center">
        <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-4 border-black rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full overflow-hidden relative z-20`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full border-2 border-transparent hover:border-black"><X size={20} /></button>
          <div className="p-8 pb-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg border-2 border-red-500 text-red-500"><AlertTriangle size={24} /></div>
              <h3 className="text-2xl font-black uppercase italic">Вы уверены?</h3>
            </div>
            <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} font-bold mb-6`}>
              Перед запуском полётной миссии убедитесь в правильности маршрута, возможности его безопасного исполнения и в том, что дрон находится в состоянии ARM
            </p>
            
            <button 
               onClick={handleArmClick} 
               disabled={isArmButtonDisabled}
               className={`w-full mb-6 py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all ${
                 isArmButtonDisabled ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed' : 
                 (showAsArmed ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600')
               }`}
            >
              {showAsArmed ? 'Выполнить DISARM' : armButtonText}
            </button>

            <div className="flex gap-3 mb-4">
              <button 
                  onClick={onConfirm} 
                  disabled={!isStartEnabled}
                  className={`flex-1 py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all ${!isStartEnabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
              >
                  {isStartEnabled ? 'Да, я уверен' : 'Дрон не готов'}
              </button>
              <button onClick={onClose} className={`flex-1 py-3 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${isDark ? 'bg-zinc-700' : 'bg-gray-100'}`}>Отмена</button>
            </div>
            
            <div className="flex justify-center pb-2">
                <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className={`transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''} opacity-30 hover:opacity-100`}>
                    <ChevronDown size={24} />
                </button>
            </div>
          </div>
        </div>

        <div className={`w-[90%] transition-all duration-300 ease-in-out origin-top ${isDetailsOpen ? 'opacity-100 max-h-[200px] translate-y-[-10px]' : 'opacity-0 max-h-0 translate-y-[-50px]'}`} style={{ zIndex: 10 }}>
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-black'} border-2 border-t-0 rounded-b-xl p-4 pt-6 shadow-xl`}>
                 <div className="flex items-start gap-3 cursor-pointer" onClick={toggleAutoArm}>
                    <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${state.autoArmOnMissionStart ? 'bg-red-500 border-red-500' : (isDark ? 'border-zinc-500' : 'border-gray-300')}`}>
                        {state.autoArmOnMissionStart && <Check size={14} className="text-white" />}
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${state.autoArmOnMissionStart ? 'text-red-500' : (isDark ? 'text-zinc-400' : 'text-gray-500')}`}>
                            Автоматически выполнять arm при запуске полётной миссии
                        </p>
                        {state.autoArmOnMissionStart && <p className="text-[10px] font-black text-red-500 mt-1 uppercase">Внимание! Двигатели запустятся автоматически!</p>}
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MissionStartModal;
