import type { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../services/authService';

let ioRef: SocketIOServer | null = null;

export function registerSocketHandlers(io: SocketIOServer): void {
  ioRef = io;

  io.use((socket, next) => {
    const tokenFromAuth = (socket.handshake.auth as { token?: string } | undefined)?.token;
    const tokenFromQuery = (socket.handshake.query as { token?: string | string[] } | undefined)
      ?.token;
    const headerAuth = socket.handshake.headers.authorization;
    const tokenFromHeader = headerAuth?.startsWith('Bearer ')
      ? headerAuth.slice('Bearer '.length)
      : undefined;

    const raw =
      tokenFromAuth ?? (Array.isArray(tokenFromQuery) ? tokenFromQuery[0] : tokenFromQuery) ?? tokenFromHeader;

    if (!raw) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    try {
      const payload = verifyToken(String(raw));
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
    }
    socket.on('disconnect', () => {});
  });
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  ioRef?.to(`user:${userId}`).emit(event, payload);
}
