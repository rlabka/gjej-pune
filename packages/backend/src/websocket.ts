import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';

let io: Server | null = null;
const onlineUsers = new Map<string, number>(); // userId -> number of active sockets
const lastSeenMap = new Map<string, Date>(); // userId -> last disconnect time

export function initWebSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.IS_PRODUCTION
        ? [env.FRONTEND_URL, env.FRONTEND_URL.replace('://', '://www.')]
        : [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    },
    path: '/ws',
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string;
    if (!token) {
      console.warn('[WS] Auth failed: no token provided');
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub?: string; userId?: string };
      const userId = decoded.sub || decoded.userId;
      if (!userId) {
        console.warn('[WS] Auth failed: no userId in token', Object.keys(decoded));
        return next(new Error('Invalid token: no userId'));
      }
      (socket as any).userId = userId;
      console.log(`[WS] Auth OK for userId: ${userId}`);
      next();
    } catch (err) {
      console.warn('[WS] Auth failed: invalid token', (err as Error).message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`[WS] User connected: ${userId}, socketId: ${socket.id}`);
    // Join user's personal room
    socket.join(`user:${userId}`);

    // Track online status
    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);
    if (count === 0) {
      // User just came online — broadcast to all
      io!.emit('user:online', { userId });
    }

    socket.on('disconnect', () => {
      const current = onlineUsers.get(userId) || 1;
      if (current <= 1) {
        onlineUsers.delete(userId);
        lastSeenMap.set(userId, new Date());
        io!.emit('user:offline', { userId });
      } else {
        onlineUsers.set(userId, current - 1);
      }
    });
  });

  return io;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

export function getLastSeen(userId: string): Date | null {
  return lastSeenMap.get(userId) || null;
}

// Emit a new message event to a specific user
export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    console.log(`[WS] Emitting '${event}' to user:${userId}`);
    io.to(`user:${userId}`).emit(event, data);
  } else {
    console.warn(`[WS] Cannot emit '${event}' — io not initialized`);
  }
}

export function getIO() {
  return io;
}
