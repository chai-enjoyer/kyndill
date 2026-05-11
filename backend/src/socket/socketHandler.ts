import type { Server as SocketIOServer, Socket } from 'socket.io';

export function registerSocketHandlers(io: SocketIOServer): void {
  io.use((_socket, next) => {
    // JWT verification on the socket handshake will live here.
    next();
  });

  io.on('connection', (socket: Socket) => {
    socket.on('disconnect', () => {});
  });
}
