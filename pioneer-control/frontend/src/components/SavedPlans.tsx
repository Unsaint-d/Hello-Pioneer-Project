import { useContext, useState } from 'react';
import { Download, FileJson, Trash2, Share, X, FolderOpen, Pencil } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import type { SavedFlightPlan } from '../types';

const SavedPlans = () => {
  const context = useContext(AppContext);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editNameDraft, setEditNameDraft] = useState('');
  
  if (!context) return null;
  const { state, deleteSavedPlan, renameSavedPlan, loadSavedPlan } = context;
  const { savedPlans, darkMode } = state;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleExportJson = (plan: SavedFlightPlan) => {
    const exportData = {
      loop: plan.isLooped,
      points: plan.points.map((p) => {
        const actionsObj: Record<string, { name: string; arg: string }> = {};
        p.actions.forEach((a, index) => {
          const key = (index + 1).toString();
          let arg = '';
          if (a.type === 'land') {
            arg = a.params.landOn === 'current' ? 'current' : (a.params.landOn?.toString() ?? 'current');
          } else if (a.type === 'rotate') {
            arg = (a.params.angle?.toString() ?? '0');
            if (a.params.targetPointId) {
              arg += '|' + a.params.targetPointId;
            }
          } else if (a.type === 'wait') {
            arg = (a.params.duration?.toString() ?? '0');
          }
          actionsObj[key] = { name: a.type, arg };
        });
        
        return {
          Point_ID: parseInt(p.id, 10),
          x: p.x,
          y: p.y,
          z: p.z,
          actions: actionsObj
        };
      })
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.name.replace(/\s+/g, '_')}_${plan.createdAt.split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = (plan: SavedFlightPlan) => {
    const exportData = {
      loop: plan.isLooped,
      points: plan.points.map((p) => {
        const actionsObj: Record<string, { name: string; arg: string }> = {};
        p.actions.forEach((a, index) => {
          const key = (index + 1).toString();
          let arg = '';
          if (a.type === 'land') {
            arg = a.params.landOn === 'current' ? 'current' : (a.params.landOn?.toString() ?? 'current');
          } else if (a.type === 'rotate') {
            arg = (a.params.angle?.toString() ?? '0');
            if (a.params.targetPointId) {
              arg += '|' + a.params.targetPointId;
            }
          } else if (a.type === 'wait') {
            arg = (a.params.duration?.toString() ?? '0');
          }
          actionsObj[key] = { name: a.type, arg };
        });
        
        return {
          Point_ID: parseInt(p.id, 10),
          x: p.x,
          y: p.y,
          z: p.z,
          actions: actionsObj
        };
      })
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    // Toast notification could be added here if a toast system existed
    alert('Данные плана скопированы в буфер обмена');
  };

  const startEditing = (plan: SavedFlightPlan) => {
    setEditingPlanId(plan.id);
    setEditNameDraft(plan.name);
  };

  const saveEditing = () => {
    if (editingPlanId && editNameDraft.trim()) {
      renameSavedPlan(editingPlanId, editNameDraft.trim());
      setEditingPlanId(null);
    }
  };

  const cancelEditing = () => {
    setEditingPlanId(null);
    setEditNameDraft('');
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden p-6 ${darkMode ? 'text-white' : 'text-black'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black uppercase italic">Сохранённые планы</h2>
      </div>

      <div className={`flex-1 overflow-hidden rounded-[24px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white'}`}>
        {savedPlans.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-50">
            <FileJson size={64} className="mb-4" />
            <p className="font-bold uppercase text-lg max-w-md">Нет сохраненных планов полета. Перейдите на главную страницу, создайте план полета и сохраните его.</p>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-left border-collapse">
              <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'} text-[10px] uppercase font-black tracking-wider`}>
                <tr>
                  <th className="p-4 border-b-2 border-black/10">Название плана</th>
                  <th className="p-4 border-b-2 border-black/10">Дата сохранения</th>
                  <th className="p-4 border-b-2 border-black/10 text-center">Количество точек</th>
                  <th className="p-4 border-b-2 border-black/10 text-center">Длина маршрута</th>
                  <th className="p-4 border-b-2 border-black/10 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold">
                {savedPlans.map((plan) => (
                  <tr key={plan.id} className={`border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors`}>
                    <td className="p-4">
                      {editingPlanId === plan.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            autoFocus
                            type="text" 
                            value={editNameDraft} 
                            onChange={(e) => setEditNameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing();
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            className={`border-b-2 border-black outline-none bg-transparent w-full ${darkMode ? 'border-white' : 'border-black'}`}
                          />
                          <button onClick={saveEditing} className="text-green-500"><X className="rotate-45" size={16} /></button>
                          <button onClick={cancelEditing} className="text-red-500"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span>{plan.name}</span>
                          <button 
                            onClick={() => startEditing(plan)}
                            className="opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono opacity-70">{formatDate(plan.createdAt)}</td>
                    <td className="p-4 text-center">{plan.points.length}</td>
                    <td className="p-4 text-center">{plan.distance.toFixed(2)} м</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => loadSavedPlan(plan.id)}
                          className="p-2 rounded-lg hover:bg-yellow-400 hover:text-black border-2 border-transparent hover:border-black transition-all"
                          title="Открыть в редакторе"
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button 
                          onClick={() => handleExportJson(plan)}
                          className="p-2 rounded-lg hover:bg-yellow-400 hover:text-black border-2 border-transparent hover:border-black transition-all"
                          title="Экспорт в JSON"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleCopyJson(plan)}
                          className="p-2 rounded-lg hover:bg-yellow-400 hover:text-black border-2 border-transparent hover:border-black transition-all"
                          title="Копировать JSON"
                        >
                          <Share size={16} />
                        </button>
                        
                        {deleteConfirmId === plan.id ? (
                          <div className="flex items-center gap-2 ml-2 bg-red-100 p-1 rounded-lg border border-red-200">
                            <button 
                              onClick={() => { deleteSavedPlan(plan.id); setDeleteConfirmId(null); }}
                              className="text-xs font-bold text-red-600 px-2 hover:underline"
                            >
                              Подтвердить
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-gray-500 hover:text-black"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmId(plan.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500 hover:border-red-200 border-2 border-transparent transition-all ml-2"
                            title="Удалить план"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPlans;
