import React, { useContext, useState } from 'react';
import { AlertTriangle, ArrowDownCircle, Camera, Clock, GripVertical, Plus, RotateCw, Settings, Trash2, X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import type { ActionType, FlightPoint } from '../types';
import { HOME_POINT_ID } from '../utils/flightPlan';
import { actionLabels } from '../utils/helpers';

const PointSettings = () => {
  const context = useContext(AppContext);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [draggedActionIndex, setDraggedActionIndex] = useState<number | null>(null);
  const [dragEnabledIndex, setDragEnabledIndex] = useState<number | null>(null);
  const [coordDrafts, setCoordDrafts] = useState<Record<string, string>>({});
  const [angleDrafts, setAngleDrafts] = useState<Record<string, string>>({});
  const [durationDrafts, setDurationDrafts] = useState<Record<string, string>>({});
  if (!context) return null;
  const { state, updatePoint, deletePoint, addAction, removeAction, reorderActions, updateActionParam } = context;
  const isDark = state.darkMode;
  const point = state.points.find(p => p.id === state.selectedPointId);

  if (!point) return <div className={`${isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-gray-400'} border-2 border-black rounded-[18px] p-6 h-full flex flex-col items-center justify-center text-center italic text-sm`}><Settings size={40} className="mb-2 opacity-20" /> Выберите точку для настройки</div>;

  const zDraft = coordDrafts.z;
  const zValue = zDraft === undefined || zDraft === '' ? point.z : parseFloat(zDraft);
  const isHeightInvalid = point.id !== HOME_POINT_ID && !Number.isNaN(zValue) && zValue < 0.1;

  const actionIcons: Record<ActionType, React.ElementType> = { photo: Camera, rotate: RotateCw, wait: Clock, land: ArrowDownCircle };
  const allActionTypes: ActionType[] = ['photo', 'rotate', 'wait', 'land'];
  const isHomePoint = point.id === HOME_POINT_ID;

  return (
    <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-2 border-black rounded-[18px] p-5 max-h-full h-full flex flex-col shadow-sm relative overflow-y-auto overflow-x-hidden`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black uppercase italic">WP #{point.name}</h2>
        <button disabled={isHomePoint} onClick={() => deletePoint(point.id)} className={`p-1 rounded-lg ${isHomePoint ? 'text-gray-500 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}><Trash2 size={18} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {['x', 'y', 'z'].map(coord => (
          <div key={coord} className={coord === 'z' ? 'col-span-2' : ''}>
            <label className="text-[10px] font-black uppercase mb-1 block opacity-50">{coord === 'z' ? 'Высота' : coord.toUpperCase()} (м)</label>
            <input
              type="number" step="0.1"
              value={coordDrafts[coord] ?? String(point[coord as keyof FlightPoint] as number)}
              onChange={e => {
                const nextValue = e.target.value;
                setCoordDrafts(prev => ({ ...prev, [coord]: nextValue }));
                if (nextValue === '') return;
                const parsed = parseFloat(nextValue);
                if (Number.isNaN(parsed)) return;
                updatePoint(point.id, { [coord]: parsed });
              }}
              onBlur={e => {
                const nextValue = e.target.value;
                if (nextValue === '') {
                  updatePoint(point.id, { [coord]: 0 });
                } else {
                  const parsed = parseFloat(nextValue);
                  updatePoint(point.id, { [coord]: Number.isNaN(parsed) ? 0 : parsed });
                }
                setCoordDrafts(prev => {
                  const copy = { ...prev };
                  delete copy[coord];
                  return copy;
                });
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
              disabled={isHomePoint}
              className={`w-full border-2 rounded-xl px-3 py-1.5 font-bold text-sm outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-zinc-800' : 'bg-gray-50'} ${coord === 'z' && isHeightInvalid ? 'border-red-500 focus:border-red-500' : `${isDark ? 'border-zinc-700' : 'border-black'} focus:border-yellow-500`}`}
            />
            {coord === 'z' && isHeightInvalid && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                введите допустимое значение: минимальная высота полёта на точке 0.1 м.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <h4 className="text-[10px] font-black uppercase tracking-wider mb-3">Сценарий поведения</h4>
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-4">
          {point.actions.map((action, index) => (
            <div 
              key={action.id}
              draggable={dragEnabledIndex === index}
              onDragStart={(e) => {
                setDraggedActionIndex(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedActionIndex !== null && draggedActionIndex !== index) {
                  reorderActions(point.id, draggedActionIndex, index);
                }
                setDraggedActionIndex(null);
              }}
              className={`p-3 rounded-2xl border-2 border-black transition-all ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'} ${draggedActionIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mr-1"
                    onMouseEnter={() => setDragEnabledIndex(index)}
                    onMouseLeave={() => setDragEnabledIndex(null)}
                    onTouchStart={() => setDragEnabledIndex(index)}
                  >
                    <GripVertical size={14} />
                  </div>
                  <div className="p-1.5 rounded-lg bg-yellow-400 border border-black text-black">
                    {React.createElement(actionIcons[action.type], { size: 14 })}
                  </div>
                  <span className="font-black uppercase text-[10px] leading-none">{actionLabels[action.type]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {action.type === 'rotate' && <div />}
                  <button onClick={() => removeAction(point.id, action.id)} className="text-red-500"><X size={14} /></button>
                </div>
              </div>

              {action.type === 'rotate' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => updateActionParam(point.id, action.id, 'targetPointId', '')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[9px] font-bold uppercase border-2 ${!action.params.targetPointId ? 'bg-yellow-400 border-black text-black' : (isDark ? 'border-zinc-700 text-zinc-500' : 'border-gray-200 text-gray-400')}`}
                    >
                      На угол
                    </button>
                    <button
                      onClick={() => updateActionParam(point.id, action.id, 'targetPointId', 'next')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[9px] font-bold uppercase border-2 ${action.params.targetPointId ? 'bg-yellow-400 border-black text-black' : (isDark ? 'border-zinc-700 text-zinc-500' : 'border-gray-200 text-gray-400')}`}
                    >
                      На точку
                    </button>
                  </div>
                  
                  {!action.params.targetPointId ? (
                    <>
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase opacity-50">
                        <span>Угол :</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={angleDrafts[action.id] ?? String(typeof action.params.angle === 'number' ? action.params.angle : 0)}
                          onChange={e => {
                            const nextValue = e.target.value;
                            setAngleDrafts(prev => ({ ...prev, [action.id]: nextValue }));
                            if (nextValue === '') return;
                            const parsed = parseInt(nextValue, 10);
                            if (Number.isNaN(parsed)) return;
                            const clamped = Math.max(-359, Math.min(359, parsed));
                            if (clamped !== parsed) {
                              setAngleDrafts(prev => ({ ...prev, [action.id]: String(clamped) }));
                            }
                            updateActionParam(point.id, action.id, 'angle', clamped);
                          }}
                          onBlur={e => {
                            const nextValue = e.target.value;
                            const parsed = parseInt(nextValue, 10);
                            const clamped = Number.isNaN(parsed) ? 0 : Math.max(-359, Math.min(359, parsed));
                            updateActionParam(point.id, action.id, 'angle', clamped);
                            setAngleDrafts(prev => {
                              const copy = { ...prev };
                              delete copy[action.id];
                              return copy;
                            });
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
                          className={`w-20 border-2 border-black rounded-lg px-2 py-1 text-[9px] font-bold ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-50'}`}
                        />
                      </div>
                      <input
                        type="range" min="-359" max="359"
                        value={typeof action.params.angle === 'number' ? action.params.angle : 0}
                        onChange={e => updateActionParam(point.id, action.id, 'angle', parseInt(e.target.value, 10))}
                        className="w-full accent-yellow-400"
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase opacity-50">Цель:</span>
                      <select
                        value={typeof action.params.targetPointId === 'string' ? action.params.targetPointId : 'next'}
                        onChange={(e) => updateActionParam(point.id, action.id, 'targetPointId', e.target.value)}
                        className={`flex-1 text-[9px] font-bold uppercase border-2 border-black rounded-lg px-2 py-1 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-50'}`}
                      >
                        <option value="next">Следующая точка</option>
                        {state.points.filter(p => p.id !== point.id).map(p => (
                          <option key={p.id} value={p.id}>Точка #{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {action.type === 'wait' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={durationDrafts[action.id] ?? String(typeof action.params.duration === 'number' ? action.params.duration : 1)}
                    onChange={e => {
                      const nextValue = e.target.value;
                      setDurationDrafts(prev => ({ ...prev, [action.id]: nextValue }));
                      if (nextValue === '') return;
                      const parsed = parseInt(nextValue, 10);
                      if (Number.isNaN(parsed)) return;
                      updateActionParam(point.id, action.id, 'duration', parsed);
                    }}
                    onBlur={e => {
                      const nextValue = e.target.value;
                      if (nextValue === '') {
                        updateActionParam(point.id, action.id, 'duration', 0);
                      } else {
                        const parsed = parseInt(nextValue, 10);
                        updateActionParam(point.id, action.id, 'duration', Number.isNaN(parsed) ? 0 : parsed);
                      }
                      setDurationDrafts(prev => {
                        const copy = { ...prev };
                        delete copy[action.id];
                        return copy;
                      });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
                    className={`w-16 border-2 border-black rounded-lg px-2 py-1 text-[10px] font-bold ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-50'}`}
                  />
                  <span className="text-[9px] font-bold uppercase opacity-50">сек. задержки</span>
                </div>
              )}
              {action.type === 'photo' && <p className="text-[9px] font-bold opacity-50 italic uppercase">Снимок в 12MP</p>}
              {action.type === 'land' && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-red-500 uppercase">Остановка двигателей</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase opacity-50">Посадка:</span>
                    <select
                      value={typeof action.params.landOn === 'string' ? action.params.landOn : 'current'}
                      onChange={(e) => updateActionParam(point.id, action.id, 'landOn', e.target.value)}
                      className={`text-[9px] font-bold uppercase border-2 border-black rounded-lg px-2 py-1 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-50'}`}
                    >
                      <option value="current">на текущей</option>
                      {state.points.filter(p => p.id !== point.id).map(p => (
                        <option key={p.id} value={p.id}>точка #{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => setIsAddingAction(true)}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-black/30 hover:border-yellow-500 flex flex-col items-center justify-center transition-all group"
          >
            <Plus size={18} className="text-black/30 group-hover:text-black mb-1" />
            <span className="text-[10px] font-black uppercase opacity-40">Добавить событие</span>
          </button>
        </div>
      </div>

      {isAddingAction && (
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm p-5 flex flex-col justify-end">
          <div className={`w-full rounded-[24px] border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center p-4 border-b-2 border-black bg-yellow-400">
              <h5 className="font-black uppercase text-xs italic text-black">Выберите действие</h5>
              <button onClick={() => setIsAddingAction(false)}><X size={18} /></button>
            </div>
            <div className="p-2 flex flex-col gap-1 max-h-[250px] overflow-y-auto">
              {allActionTypes.map(type => {
                const isDisabled = type === 'land' && state.isLooped;
                return (
                  <button
                    key={type}
                    disabled={isDisabled}
                    onClick={() => { if (!isDisabled) { addAction(point.id, type); setIsAddingAction(false); } }}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all group/btn ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-black/5'}`}
                  >
                    <div className={`p-2 rounded-lg border-2 border-black transition-all ${isDark ? 'bg-zinc-800' : 'bg-white'} ${isDisabled ? 'opacity-50' : 'group-hover/btn:bg-yellow-400'}`}>
                      {React.createElement(actionIcons[type], { size: 16 })}
                    </div>
                    <div className={isDisabled ? 'text-gray-400' : ''}>
                      <span className="text-[11px] font-black uppercase block">{actionLabels[type]}</span>
                      {isDisabled ? (
                        <span className="text-[9px] font-black text-red-600 uppercase">невозможно в режиме цикла</span>
                      ) : (
                        <span className="text-[8px] font-bold opacity-40 block uppercase">Добавить в сценарий</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointSettings;
