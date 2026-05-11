import 'dotenv/config'
import { createServer } from 'http'
import { app } from './app'
import { setupSocket } from './socket/socketHandler'
import { startCronJobs } from './services/cronService'

const PORT = Number(process.env.PORT ?? 3000)

const httpServer = createServer(app)

setupSocket(httpServer)
startCronJobs()

httpServer.listen(PORT, () => {
  console.log(`Kyndill API  :${PORT}  [${process.env.NODE_ENV ?? 'development'}]`)
})
