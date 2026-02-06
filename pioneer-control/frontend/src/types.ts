export type ActionType = 'photo' | 'rotate' | 'wait' | 'land';
export type ActionParamKey = 'angle' | 'duration' | 'landOn' | 'rotateToNext' | 'targetPointId';
export type ActionParams = Partial<Record<ActionParamKey, number | string | boolean>>;

export interface PointAction {
  id: string;
  type: ActionType;
  params: ActionParams;
}

export interface FlightPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  actions: PointAction[];
  createdAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'COMMAND';
  message: string;
}

export interface SavedFlightPlan {
  id: string;
  name: string;
  createdAt: string;
  points: FlightPoint[];
  distance: number;
  isLooped: boolean;
}

export interface AppState {
  points: FlightPoint[];
  nextPointId: number;
  selectedPointId: string | null;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  autopilotState: string;
  batteryVoltage: number;
  logs: LogEntry[];
  darkMode: boolean;
  isLooped: boolean;
  savedPlans: SavedFlightPlan[];
  autoArmOnMissionStart: boolean;
}
