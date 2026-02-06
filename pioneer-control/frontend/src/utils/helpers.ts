import type { ActionType } from '../types';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

export const getBatteryPercent = (voltage: number) => {
  const minVoltage = 7;
  const maxVoltage = 8.4;
  const percent = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
  return clamp(percent, 0, 100);
};

export const getBatteryColor = (percent: number) => {
  const red = { r: 239, g: 68, b: 68 };
  const orange = { r: 249, g: 115, b: 22 };
  const green = { r: 34, g: 197, b: 94 };
  const p = clamp(percent, 0, 100) / 100;
  const orangeThreshold = 0.3;
  if (p <= orangeThreshold) {
    const t = p / orangeThreshold;
    const r = Math.round(lerp(red.r, orange.r, t));
    const g = Math.round(lerp(red.g, orange.g, t));
    const b = Math.round(lerp(red.b, orange.b, t));
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = (p - orangeThreshold) / (1 - orangeThreshold);
  const r = Math.round(lerp(orange.r, green.r, t));
  const g = Math.round(lerp(orange.g, green.g, t));
  const b = Math.round(lerp(orange.b, green.b, t));
  return `rgb(${r}, ${g}, ${b})`;
};

export const getApStatusDisplay = (status: string) => {
  const s = (status || 'N/A').toUpperCase();
  if (s === 'DISCONNECTED') return { label: 'OFFLINE', short: 'OFF', color: 'text-zinc-400' };
  if (s === 'PREFLIGHT') return { label: 'READY', short: 'RDY', color: 'text-blue-500' };
  if (s === 'ARMED') return { label: 'ARMED', short: 'ARM', color: 'text-red-500' };
  if (s === 'DISARMED') return { label: 'DISARMED', short: 'DIS', color: 'text-green-500' };
  if (s === 'IN_FLIGHT') return { label: 'FLYING', short: 'FLY', color: 'text-blue-500' };
  if (s === 'TAKEOFF') return { label: 'TAKEOFF', short: 'TOF', color: 'text-blue-500' };
  if (s === 'LANDING') return { label: 'LANDING', short: 'LND', color: 'text-blue-500' };
  if (s === 'WAIT_FOR_LANDING') return { label: 'LANDING...', short: 'W-LND', color: 'text-yellow-500' };
  if (s === 'MISSION') return { label: 'MISSION', short: 'MSN', color: 'text-purple-500' };
  if (s === 'RTL') return { label: 'RTL', short: 'RTL', color: 'text-orange-500' };
  return { label: status, short: status.substring(0, 3).toUpperCase(), color: 'text-zinc-500' };
};

export const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Неизвестная ошибка';

export const actionLabels: Record<ActionType, string> = { photo: 'Фотоснимок', rotate: 'Поворот', wait: 'Ожидание', land: 'Посадка' };
