// src/lib/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const watchSession = (sessionId) => {
  if (!socket.connected) socket.connect();
  socket.emit('watch_session', sessionId);
};

export const unwatchSession = (sessionId) => {
  socket.emit('unwatch_session', sessionId);
};
