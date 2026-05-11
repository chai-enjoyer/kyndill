import 'dotenv/config';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';

import { createApp } from './app';
import { registerSocketHandlers } from './socket/socketHandler';
import { startCronJobs } from './services/cronService';

const port = Number(process.env.PORT ?? 3000);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const app = createApp();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: frontendUrl, credentials: true },
});

registerSocketHandlers(io);
startCronJobs();

server.listen(port, () => {
  console.log(`Kyndill API listening on http://localhost:${port}`);
});

function shutdown(signal: string): void {
  console.log(`\nReceived ${signal}, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
