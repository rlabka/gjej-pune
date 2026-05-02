import { io, type Socket } from 'socket.io-client';
import { config } from './config';
import { getToken } from './auth';

let socket: Socket | null = null;

/**
 * Singleton socket.io client. Connects on first call, reuses across the app.
 * Mirrors apps/web/src/lib/socket.ts but reads the token asynchronously
 * from expo-secure-store.
 */
export async function getSocket(): Promise<Socket | null> {
  if (socket) return socket;

  const token = await getToken();
  if (!token) {
    console.warn('[WS] no token — skipping socket connect');
    return null;
  }

  socket = io(config.wsUrl, {
    path: config.wsPath,
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => console.log('[WS] connected', socket?.id));
  socket.on('disconnect', (reason) => console.warn('[WS] disconnected:', reason));
  socket.on('connect_error', (err) => console.warn('[WS] error:', err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
