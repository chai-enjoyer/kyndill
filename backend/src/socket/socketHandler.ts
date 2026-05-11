import type { IncomingMessage, Server, ServerResponse } from 'http'
import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'

let io: SocketServer

export function setupSocket(
  httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  })

  // Authenticate every socket connection via the JWT passed in handshake.auth.token.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined

    if (!token) {
      next(new Error('Authentication required'))
      return
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
      socket.data.userId = payload.userId
      next()
    } catch {
      next(new Error('Invalid or expired token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string

    // Each user joins their own private room so emitToUser can target them directly.
    socket.join(`user:${userId}`)
    console.log(`[socket] ${userId} connected (${socket.id})`)

    socket.on('disconnect', () => {
      console.log(`[socket] ${userId} disconnected`)
    })
  })

  return io
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized — call setupSocket first')
  return io
}

// Emit a named event to all connections belonging to a single user.
export function emitToUser(userId: string, event: string, data: unknown): void {
  getIO().to(`user:${userId}`).emit(event, data)
}
