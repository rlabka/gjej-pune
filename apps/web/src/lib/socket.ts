import { io, Socket } from 'socket.io-client';
import { getToken } from './auth';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  // If socket instance exists, return it — Socket.IO handles reconnection internally
  if (socket) {
    console.log('[WS] Reusing existing socket, connected:', socket.connected);
    return socket;
  }

  const token = getToken();
  if (!token) {
    console.warn('[WS] getSocket() — no token, cannot connect');
    return null;
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  console.log('[WS] Creating new socket to', backendUrl);

  socket = io(backendUrl, {
    path: '/ws',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[WS] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[WS] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
