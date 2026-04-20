// API and WebSocket URLs - change these for production
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const inferWsUrlFromApiUrl = (apiUrl: string): string => {
  // Convert "http://host/api" -> "http://host" for Socket.IO.
  return apiUrl.replace(/\/api\/?$/, '');
};

const runtimeOrigin =
  typeof globalThis.window !== 'undefined' ? globalThis.window.location.origin : '';

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  inferWsUrlFromApiUrl(API_URL) ||
  runtimeOrigin ||
  'http://localhost:4000';

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ProjectMeet';
