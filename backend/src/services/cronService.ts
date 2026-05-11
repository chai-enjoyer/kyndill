import cron from 'node-cron'
import { applyDailyDecay } from './petService'

export function startCronJobs(): void {
  // Daily at midnight UTC: decay all pet stats and check broken streaks.
  // On the e2-micro this runs alongside PostgreSQL; keep queries efficient.
  cron.schedule('0 0 * * *', async () => {
    console.log('[cron] Daily reset starting…')
    try {
      await applyDailyDecay()
      // TODO: checkBrokenStreaks()
      console.log('[cron] Daily reset complete')
    } catch (err) {
      console.error('[cron] Daily reset failed:', err)
    }
  })

  console.log('[cron] Jobs registered')
}
