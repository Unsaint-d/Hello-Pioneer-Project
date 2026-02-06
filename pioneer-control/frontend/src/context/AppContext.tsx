import { createContext } from 'react';
import type { ActionParamKey, ActionType, AppState, FlightPoint, LogEntry } from '../types';

export interface AppContextValue {
  state: AppState;
  isDialogOpen: boolean;
  setDialogOpen: (isOpen: boolean) => void;
  isDragging: boolean;
  setDragging: (isDragging: boolean) => void;
  draggedPointId: string | null;
  setDraggedPointId: (id: string | null) => void;
  addPoint: (p: Partial<FlightPoint>) => void;
  updatePoint: (id: string, p: Partial<FlightPoint>) => void;
  deletePoint: (id: string) => void;
  reorderPoints: (from: number, to: number) => void;
  selectPoint: (id: string | null) => void;
  clearAllPoints: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  addLog: (level: LogEntry['level'], msg: string) => void;
  clearLogs: () => void;
  refreshStatus: () => Promise<{ connected: boolean; voltage: number | null; autopilotState: string | null }>;
  sendFlightPlan: () => Promise<void>;
  startMission: () => Promise<void>;
  arm: () => Promise<void>;
  disarm: () => Promise<void>;
  toggleAutoArm: () => void;
  land: () => Promise<void>;
  connect: () => Promise<{ connected: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  saveFlightPlanToFile: (name?: string) => void;
  deleteSavedPlan: (id: string) => void;
  renameSavedPlan: (id: string, newName: string) => void;
  loadSavedPlan: (id: string) => void;
  toggleTheme: () => void;
  toggleLoop: () => void;
  enableLoopWithLandRemoval: () => void;
  addAction: (pointId: string, type: ActionType) => void;
  removeAction: (pointId: string, actionId: string) => void;
  reorderActions: (pointId: string, from: number, to: number) => void;
  updateActionParam: (pointId: string, actionId: string, key: ActionParamKey, value: number | string | boolean) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);
