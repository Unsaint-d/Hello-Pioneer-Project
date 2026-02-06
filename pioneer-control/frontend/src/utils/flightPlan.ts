import type { FlightPoint } from '../types';

export const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
export const HOME_POINT_ID = '0';
export const createHomePoint = (): FlightPoint => ({
  id: HOME_POINT_ID,
  name: '0',
  x: 0,
  y: 0,
  z: 1,
  actions: [],
  createdAt: new Date().toISOString()
});
