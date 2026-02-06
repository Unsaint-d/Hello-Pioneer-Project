import React, { useContext, useState } from 'react';
import { GripVertical, Navigation, Repeat, Trash2, Download, AlertTriangle } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { HOME_POINT_ID } from '../utils/flightPlan';
import ConfirmationModal from './modals/ConfirmationModal';
import SavePlanModal from './modals/SavePlanModal';
import MissionStartModal from './modals/MissionStartModal';
import { actionLabels } from '../utils/helpers';



const FlightPlanPanel = () => {
  const context = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoopConfirmOpen, setIsLoopConfirmOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isMissionConfirmOpen, setIsMissionConfirmOpen] = useState(false);

  if (!context) return null;
  const { state, setDialogOpen, setDragging, deletePoint, selectPoint, startMission, clearAllPoints, saveFlightPlanToFile, toggleLoop, enableLoopWithLandRemoval, reorderPoints } = context;
  const isDark = state.darkMode;
  const hasLandActions = state.points.some(p => p.actions.some(a => a.type === 'land'));
  const hasFlightPoints = state.points.some(p => p.id !== HOME_POINT_ID);
  const hasInvalidHeights = state.points.some(p => p.id !== HOME_POINT_ID && p.z < 0.1);
  const isDisconnected = state.connectionStatus === 'DISCONNECTED';
  const defaultPlanName = `План полёта №${state.savedPlans.length + 1}`;
  const totalDistance = state.points.reduce((acc, point, i, arr) => {
    if (i === 0) return 0;
    const prev = arr[i - 1];
    const dist = Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2) + Math.pow(point.z - prev.z, 2));
    return acc + dist;
  }, 0);
  const totalDistanceRounded = parseFloat(totalDistance.toFixed(2));

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderPoints(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
      setDraggedIndex(null);
      setDragging(false);
  };

  const handleToggleLoop = () => {
    if (state.isLooped) {
      toggleLoop();
      return;
    }
    if (hasLandActions) {
      setIsLoopConfirmOpen(true);
      setDialogOpen(true);
      return;
    }
    toggleLoop();
  };

  return (
    <>
      <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-2 border-black rounded-[18px] p-5 h-full flex flex-col shadow-sm`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-black italic uppercase">План полёта</h3>
            <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Маршрутный лист</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!hasFlightPoints) return;
                setIsSaveModalOpen(true);
                setDialogOpen(true);
              }}
              disabled={!hasFlightPoints}
              className={`p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] transition-all ${isDark ? 'bg-blue-900/50 hover:bg-blue-900/80 disabled:bg-zinc-700 disabled:cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed'}`}
              title="Сохранить план"
            >
              <Download size={16} className={`${!hasFlightPoints ? (isDark ? 'text-zinc-500' : 'text-gray-400') : (isDark ? 'text-blue-300' : 'text-blue-500')}`} />
            </button>
            <button
              onClick={() => {
                if (state.points.length === 0) return;
                setIsModalOpen(true);
                setDialogOpen(true);
              }}
              className={`p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] transition-all ${isDark ? 'bg-red-900/50 hover:bg-red-900/80' : 'bg-red-100 hover:bg-red-200'}`}
              title="Очистить все"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        </div>

        <button onClick={handleToggleLoop} className={`mb-3 flex items-center justify-between p-2 rounded-xl border-2 font-bold text-[10px] uppercase transition-all ${state.isLooped ? 'border-yellow-400 bg-yellow-400/10 text-yellow-600' : (isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-400' : 'border-black/5 bg-gray-50 text-gray-400')}`}>
          <span className="flex items-center gap-2"><Repeat size={14} /> Зациклить</span>
          <div className={`w-6 h-3 rounded-full relative border border-current ${state.isLooped ? 'bg-yellow-400' : ''}`}><div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full bg-current transition-all ${state.isLooped ? 'right-0.5' : 'left-0.5'}`} /></div>
        </button>

        <div className="flex-1 lg:overflow-y-auto pr-1 scrollbar-thin space-y-1">
          {state.points.map((p, idx) => {
            const isHeightInvalid = p.id !== HOME_POINT_ID && p.z < 0.1;
            return (
            <div
              key={p.id}
              draggable={p.id !== HOME_POINT_ID}
              onDragStart={(e) => p.id !== HOME_POINT_ID && handleDragStart(e, idx)}
              onDragOver={(e) => p.id !== HOME_POINT_ID && handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => selectPoint(p.id)}
              className={`flex items-center gap-2 p-2.5 border-2 rounded-xl cursor-pointer transition-all relative group ${state.selectedPointId === p.id ? 'border-yellow-400 bg-yellow-50/10 shadow-sm' : 'border-black/5'} ${draggedIndex === idx ? 'opacity-30 scale-95 border-dashed border-gray-400' : 'opacity-100'}`}
            >
              <div className={`text-gray-300 hover:text-black transition-colors ${p.id === HOME_POINT_ID ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}>
                <GripVertical size={16} />
              </div>
              <div className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-black border-2 ${isHeightInvalid ? 'border-red-500' : 'border-black'} bg-black text-white shrink-0`}>{idx}</div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-black uppercase truncate leading-none mb-1">
                  {p.x.toFixed(1)} м. {p.y.toFixed(1)} м. {p.z.toFixed(1)} м.
                </div>
                <div className="text-[10px] font-bold opacity-60 truncate">
                  действия: {p.actions.length > 0 ? p.actions.map(a => actionLabels[a.type]).join(', ') : 'нет'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isHeightInvalid && <AlertTriangle size={12} className="text-red-500" />}
                <button 
                  disabled={p.id === HOME_POINT_ID} 
                  onClick={(e) => { e.stopPropagation(); deletePoint(p.id); }} 
                  className={`p-1.5 rounded-md transition-all ${p.id === HOME_POINT_ID ? 'text-gray-400 cursor-not-allowed opacity-40' : `text-red-500 cursor-pointer ${isDark ? 'hover:bg-red-900/30 hover:text-red-400' : 'hover:bg-red-100 hover:text-red-600'}`}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )})}
          {state.isLooped && state.points.length > 1 && (
            <div className="p-2 border-2 border-dashed border-yellow-400/20 rounded-xl bg-yellow-50/5 flex items-center gap-2 text-yellow-600/80 text-[9px] font-bold uppercase">
              <Navigation size={12} />
              <span>Возврат на точку #0</span>
            </div>
          )}
        </div>
        <button 
            onClick={() => {
              setIsMissionConfirmOpen(true);
              setDialogOpen(true);
            }} 
            disabled={!hasFlightPoints || state.connectionStatus !== 'CONNECTED' || hasInvalidHeights} 
            className="w-full mt-3 bg-yellow-400 text-black py-2.5 rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300"
        >
            Запустить полётную миссию
        </button>
      </div>
      <ConfirmationModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setDialogOpen(false); }} onConfirm={() => { clearAllPoints(); setIsModalOpen(false); setDialogOpen(false); }} title="Удаление" message="Очистить маршрут?" />
      <ConfirmationModal isOpen={isLoopConfirmOpen && !isDisconnected} onClose={() => { setIsLoopConfirmOpen(false); setDialogOpen(false); }} onConfirm={() => { enableLoopWithLandRemoval(); setIsLoopConfirmOpen(false); setDialogOpen(false); }} title="Режим цикла" message="При включении режима зацикливания все действия «посадка» будут удалены и режим будет включён." confirmLabel="Ок" cancelLabel="Отмена" />
      {isSaveModalOpen && (
        <SavePlanModal
          onClose={() => { setIsSaveModalOpen(false); setDialogOpen(false); }}
          onSave={(name) => saveFlightPlanToFile(name)}
          defaultName={defaultPlanName}
          pointsCount={state.points.length}
          distance={totalDistanceRounded}
        />
      )}
      {isMissionConfirmOpen && !isDisconnected && (
        <MissionStartModal 
          onClose={() => { setIsMissionConfirmOpen(false); setDialogOpen(false); }} 
          onConfirm={() => { startMission(); setIsMissionConfirmOpen(false); setDialogOpen(false); }} 
          hasInvalidHeights={hasInvalidHeights}
        />
      )}
    </>
  );
};

export default FlightPlanPanel;
