import express, { type Request, type Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'

import { authRouter } from './routes/auth'
import { habitsRouter } from './routes/habits'
import { petRouter } from './routes/pet'
import { shopRouter } from './routes/shop'
import { socialRouter } from './routes/social'
import { focusRouter } from './routes/focus'
import { userRouter } from './routes/user'
import { leaderboardRouter } from './routes/leaderboard'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// ─── Global middleware ──────────────────────────────────────────────────────

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

// ─── Routes ────────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth',        authRouter)
app.use('/api/habits',      habitsRouter)
app.use('/api/pet',         petRouter)
app.use('/api/shop',        shopRouter)
app.use('/api/social',      socialRouter)
app.use('/api/focus',       focusRouter)
app.use('/api/user',        userRouter)
app.use('/api/leaderboard', leaderboardRouter)

// ─── 404 fallthrough ────────────────────────────────────────────────────────

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `${req.method} ${req.path} not found` })
})

// ─── Global error handler (must be last) ───────────────────────────────────

app.use(errorHandler)

export { app }
